# Kur'an ses hizalayıcı — uzun sure/cüz mp3'ünü ayet sınırlarına böler, kelime
# zamanlarını çıkarır. Yöntem: torchaudio MMS_FA (çok dilli wav2vec2, with_star)
# + ayet-ayet kayan pencere. Emisyonlar dosya başına TEK SEFER hesaplanır (hız),
# pencereler emisyon dizisi üzerinde kayar. İlk ayette öncü <star> baştaki
# istiâze/cıngıl gibi transkript dışı sesi emer.
#
# Kullanım: python align_quran.py audio.mp3 segments.json out.json
# segments.json: {"istiaze": true, "items": [{"key": "112:1", "words": [...],
#                 "drop_prefix": 4}, ...]}
# out.json: {"items": [{"key", "start_ms", "end_ms", "words": [[pos, s_ms, e_ms],...],
#            "score"}], "istiaze_ms", "total_ms"}
import json
import os
import subprocess
import sys
import tempfile

import soundfile as sf
import torch
import torchaudio
from uroman import Uroman

DEBUG = os.environ.get("DEBUG") == "1"
FFMPEG = os.environ.get("FFMPEG_BIN", "ffmpeg")
SR = 16000
FPS = 50  # wav2vec2 çerçevesi = 20 ms
ISTIAZE = "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ"

torch.set_num_threads(max(1, os.cpu_count() - 1))
uroman = Uroman()
bundle = torchaudio.pipelines.MMS_FA
model = bundle.get_model(with_star=True).eval()
DICT = bundle.get_dict()
STAR_ID = DICT["*"]
ALLOWED = set(DICT) - {"*"}


def romanize_words(words):
    toks = []
    for w in words:
        r = str(uroman.romanize_string(w)).lower()
        r = "".join(c for c in r if c in ALLOWED)
        toks.append(r if r else "a")
    return toks


def load_audio(path):
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", path,
                        "-ac", "1", "-ar", str(SR), tmp.name], check=True)
        wav, sr = sf.read(tmp.name, dtype="float32")
    assert sr == SR
    return torch.from_numpy(wav)


@torch.inference_mode()
def full_emissions(wav):
    """Tüm dosyanın emisyonları: 40 sn pencere, 4 sn bindirme (dikiş artığı kırpılır)."""
    WIN, OV = 40 * SR, 4 * SR
    hop = WIN - OV
    outs = []
    off = 0
    while off < len(wav):
        part = wav[off: off + WIN]
        if len(part) < 800:
            break
        em, _ = model(part.unsqueeze(0))
        em = torch.log_softmax(em[0], dim=-1)
        lead = 0 if off == 0 else (OV // 2) // 320
        tail = em.size(0) if off + WIN >= len(wav) else em.size(0) - (OV // 2) // 320
        outs.append(em[lead:tail])
        if off + WIN >= len(wav):
            break
        off += hop
    return torch.cat(outs) if outs else torch.zeros(1, len(DICT))


def align_tokens(em, token_ids):
    targets = torch.tensor([token_ids], dtype=torch.int32)
    aligned, scores = torchaudio.functional.forced_align(em.unsqueeze(0), targets, blank=0)
    return aligned[0], scores[0]


def token_spans(aligned):
    spans = []
    prev = None
    for f, tok in enumerate(aligned.tolist()):
        if tok == 0:
            prev = None
            continue
        if prev != tok or not spans or spans[-1][2] != tok:
            spans.append([f, f + 1, tok])
        else:
            spans[-1][1] = f + 1
        prev = tok
    return spans


def group_words(spans, word_lens, skip_leading_star):
    if skip_leading_star and spans and spans[0][2] == STAR_ID:
        spans = spans[1:]
    words = []
    i = 0
    for wl in word_lens:
        if wl == 0 or i >= len(spans):
            words.append(None)
            continue
        seg = spans[i:i + wl]
        i += wl
        words.append((seg[0][0], seg[-1][1]))
    return words


def mean_score(aligned, scores):
    real = (aligned != 0) & (aligned != STAR_ID)
    return float(scores[real].mean()) if real.any() else -99.0


def main():
    audio_path, seg_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    cfg = json.load(open(seg_path))
    wav = load_audio(audio_path)
    total_ms = int(len(wav) / SR * 1000)
    em = full_emissions(wav)
    T = em.size(0)  # toplam çerçeve (wav kesim yerleştirme için tutulur)

    items = cfg["items"]
    roman = [romanize_words(it["words"]) for it in items]
    char_tot = sum(len("".join(r)) for r in roman) or 1

    out = {"items": [], "total_ms": total_ms, "istiaze_ms": 0}
    cursor = 0  # çerçeve

    # İstiâze tespiti: ilk pencerede eûzü + yıldız vs ilk kelimeler + yıldız yarışır
    if cfg.get("istiaze"):
        win = em[: min(T, 25 * FPS)]

        def probe(words):
            toks_p = romanize_words(words)
            ids_p = [DICT[c] for c in "".join(toks_p)] + [STAR_ID]
            a_p, s_p = align_tokens(win, ids_p)
            sp = token_spans(a_p)
            return mean_score(a_p, s_p), sp

        sc_ist, sp_ist = probe(ISTIAZE.split())
        sc_ref, _ = probe(items[0]["words"][:5])
        if sc_ist > sc_ref and sp_ist:
            real_sp = [s for s in sp_ist if s[2] != STAR_ID]
            if real_sp:
                dur = (real_sp[-1][1] - real_sp[0][0]) * 20
                if 1200 < dur < 12000:
                    cursor = real_sp[-1][1] + 5
                    out["istiaze_ms"] = real_sp[-1][1] * 20

    for idx, it in enumerate(items):
        toks = roman[idx]
        n_tok = len("".join(toks))
        est_f = max(2 * FPS, int(T * n_tok / char_tot))
        min_win = n_tok * 3 + 80
        win_len = min(T - cursor, max(min_win, est_f * 3 + 15 * FPS))
        if T - cursor < min_win:
            cursor = max(0, T - min_win)
            win_len = T - cursor
        ok = False
        for attempt in range(3):
            win = em[cursor: cursor + win_len]
            ids = [DICT[c] for c in "".join(toks)]
            lead_star = idx == 0 and not out["istiaze_ms"]
            if lead_star:
                ids = [STAR_ID] + ids
            use_star = (idx < len(items) - 1) or (cursor + win_len < T)
            if use_star:
                ids = ids + [STAR_ID]
            aligned, scores = align_tokens(win, ids)
            spans = token_spans(aligned)
            if use_star and spans and spans[-1][2] == STAR_ID:
                spans = spans[:-1]
            words = group_words(spans, [len(t) for t in toks], lead_star)
            ok = words and words[0] is not None and words[-1] is not None
            if ok and use_star:
                end_f = words[-1][1]
                if end_f > win_len - 30 and cursor + win_len < T:
                    ok = False  # pencere sonuna dayandı: büyüt
            if ok:
                break
            win_len = min(T - cursor, int(win_len * 1.7) + 10 * FPS)
        if not ok:
            print(f"UYARI {it['key']}: pencere oturmadı, kaba tahmin", file=sys.stderr)
            end_f = min(T, cursor + est_f)
            out["items"].append({"key": it["key"], "start_ms": cursor * 20,
                                 "end_ms": end_f * 20, "words": [], "score": -99})
            cursor = end_f
            continue

        drop = it.get("drop_prefix", 0)
        wlist = []
        for wi, sp in enumerate(words):
            if sp is None or wi < drop:
                continue
            wlist.append([wi - drop + 1, (cursor + sp[0]) * 20, (cursor + sp[1]) * 20])
        score = mean_score(aligned, scores)
        start_ms = cursor * 20
        end_f = cursor + words[-1][1]
        first_sp = next((sp for sp in words if sp), None)
        speech_start = (cursor + first_sp[0]) * 20 if first_sp else start_ms
        out["items"].append({"key": it["key"], "start_ms": start_ms, "end_ms": end_f * 20,
                             "speech_start_ms": speech_start,
                             "words": wlist, "score": round(score, 3)})
        if DEBUG:
            print(f"  {it['key']}: {start_ms}-{end_f * 20} ms (skor {score:.2f})", file=sys.stderr)
        cursor = max(cursor, end_f - 4)

    # Kesim yerleştirme: ayet i'nin son kelime bitişi ile ayet i+1'in ilk kelime
    # başlangıcı arasındaki EN DÜŞÜK enerjili (nefes/sessizlik) noktaya otur.
    body_energy = float((wav ** 2).mean())
    SILENT = body_energy * 0.03  # ~-15 dB gövde altı: sessiz 's/ş' bile bunun üstünde kalır

    def rms_min(ms_a, ms_b):
        """Aralıktaki GERÇEK sessizliğin (dosya-uyarlamalı eşik) en uzun bitişik
        bölgesinin ortası; hiç sessizlik yoksa en düşük enerjili nokta (vasıl hâli)."""
        a, b = int(ms_a / 1000 * SR), int(ms_b / 1000 * SR)
        a, b = max(0, a), min(len(wav), b)
        if b - a < int(0.12 * SR):
            return ms_a
        seg = wav[a:b]
        wlen, hop = int(0.08 * SR), int(0.01 * SR)
        vals = []
        for off in range(0, len(seg) - wlen, hop):
            vals.append((off, float((seg[off:off + wlen] ** 2).mean())))
        if not vals:
            return ms_a
        # sessiz pencerelerin bitişik koşuları
        runs = []
        cur = None
        for i, (off, r) in enumerate(vals):
            if r < SILENT:
                if cur is None:
                    cur = [i, i]
                else:
                    cur[1] = i
            elif cur is not None:
                runs.append(cur)
                cur = None
        if cur is not None:
            runs.append(cur)
        if runs:
            lo, hi = max(runs, key=lambda r: r[1] - r[0])
            center_off = (vals[lo][0] + vals[hi][0]) // 2 + wlen // 2
        else:
            center_off = min(vals, key=lambda v: v[1])[0] + wlen // 2
        return (a + center_off) / SR * 1000

    its = out["items"]
    for i, it in enumerate(its):
        if i + 1 < len(its):
            # Geniş arama: hizalanmış söz sonu pausu geçe kaydırabilir (sessiz harf/medd),
            # gerçek sessizlik çoğu kez söz sonundan ÖNCE başlar.
            nxt_start = its[i + 1].get("speech_start_ms", its[i + 1]["start_ms"])
            it["cut_ms"] = int(rms_min(it["end_ms"] - 700, max(nxt_start, it["end_ms"]) + 200))
        else:
            it["cut_ms"] = total_ms
    # Dosya başı: istiâze sonrası ile ilk konuşma (besmele) arasındaki en sessiz nokta
    if its:
        first_start = its[0].get("speech_start_ms", its[0]["start_ms"])
        lo = out["istiaze_ms"] if out["istiaze_ms"] else max(0, first_start - 3000)
        out["start_cut_ms"] = int(rms_min(lo, first_start + 60)) if first_start > lo else lo

    json.dump(out, open(out_path, "w"), ensure_ascii=False)
    print(f"OK {len(out['items'])} ayet, toplam {total_ms} ms", file=sys.stderr)


if __name__ == "__main__":
    main()

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

    # İlk öğede belirsiz önek (cüz ortasında besmele okunmuş mu?): iki varyantı
    # aynı pencerede yarıştır, kaybeden önek atılır.
    if items and items[0].get("probe_prefix") and items[0].get("drop_prefix", 0) > 0:
        it0 = items[0]
        dp = it0["drop_prefix"]
        win0 = em[cursor: cursor + min(T - cursor, 40 * FPS)]

        def variant_score(words):
            toks_v = romanize_words(words)
            ids_v = [DICT[c] for c in "".join(toks_v)] + [STAR_ID]
            a_v, s_v = align_tokens(win0, ids_v)
            return mean_score(a_v, s_v)

        if variant_score(it0["words"]) < variant_score(it0["words"][dp:]) - 0.15:
            it0["words"] = it0["words"][dp:]
            it0["drop_prefix"] = 0
            roman[0] = romanize_words(it0["words"])
            print("  önek probu: besmele okunmamış varsayıldı", file=sys.stderr)

    # Hizalama çekirdeği: [start_f, end_limit] aralığına HAPSEDİLMİŞ ardışık pencere.
    # Çapa: sonraki öğenin ilk 3 kelimesi. Elastik sıfırlama yerel hasarı sınırlar.
    start_cursor = cursor

    def align_seq(sub_items, sub_roman, start_f, end_limit, scale, pad_f, lead_star_first):
        res = []
        cur = start_f
        span = max(1, end_limit - start_f)
        chars = sum(len("".join(r)) for r in sub_roman) or 1
        for idx, it in enumerate(sub_items):
            toks = sub_roman[idx]
            anchor = sub_roman[idx + 1][:3] if idx + 1 < len(sub_items) else []
            n_all = len("".join(toks)) + len("".join(anchor))
            est_f = max(2 * FPS, int(span * len("".join(toks)) / chars))
            min_win = n_all * 3 + 80
            win_len = min(end_limit - cur, max(min_win, int(est_f * scale) + pad_f))
            if end_limit - cur < min_win:
                cur = max(start_f, end_limit - min_win)
                win_len = end_limit - cur
            ok = False
            aligned = scores = aw = None
            for attempt in range(3):
                win = em[cur: cur + win_len]
                ids = [DICT[c] for c in "".join(toks)]
                a_ids = [DICT[c] for c in "".join(anchor)]
                lead = lead_star_first and idx == 0
                seq = ([STAR_ID] if lead else []) + ids + a_ids
                use_star = (idx < len(sub_items) - 1) or (cur + win_len < end_limit)
                if use_star:
                    seq = seq + [STAR_ID]
                aligned, scores = align_tokens(win, seq)
                spans = token_spans(aligned)
                if use_star and spans and spans[-1][2] == STAR_ID:
                    spans = spans[:-1]
                wl = [len(t) for t in toks] + [len(t) for t in anchor]
                words_all = group_words(spans, wl, lead)
                aw = words_all[:len(toks)]
                anw = words_all[len(toks):]
                ok = (aw and aw[0] is not None and aw[-1] is not None
                      and all(x is not None for x in anw))
                if ok and use_star:
                    tail = anw[-1][1] if anw else aw[-1][1]
                    if tail > win_len - 30 and cur + win_len < end_limit:
                        ok = False  # pencere sonuna dayandı: büyüt
                if ok:
                    break
                win_len = min(end_limit - cur, int(win_len * 1.7) + 10 * FPS)
            if not ok:
                print(f"UYARI {it['key']}: pencere oturmadı, kaba tahmin", file=sys.stderr)
                end_f = min(end_limit, cur + est_f)
                res.append({"key": it["key"], "start_ms": cur * 20, "end_ms": end_f * 20,
                            "speech_start_ms": cur * 20, "words": [], "score": -99})
                cur = end_f
                continue
            drop = it.get("drop_prefix", 0)
            score = mean_score(aligned, scores)
            first_f = next((sp[0] for sp in aw if sp), 0)
            # Elastik sıfırlama: çok kötü skor + aralık temposunun ~2 katı uzama
            if score < -5.2 and (aw[-1][1] - first_f) > est_f * 1.9:
                end_f = min(end_limit, cur + first_f + int(est_f * 1.25))
                print(f"UYARI {it['key']}: şüpheli uzama (skor {score:.2f}) — elastik kesim", file=sys.stderr)
                res.append({"key": it["key"], "start_ms": cur * 20, "end_ms": end_f * 20,
                            "speech_start_ms": (cur + first_f) * 20,
                            "words": [], "score": round(score, 3)})
                cur = end_f
                continue
            wlist = [[wi - drop + 1, (cur + sp[0]) * 20, (cur + sp[1]) * 20]
                     for wi, sp in enumerate(aw) if sp is not None and wi >= drop]
            end_f = cur + aw[-1][1]
            first_sp = next((sp for sp in aw if sp), None)
            res.append({"key": it["key"], "start_ms": cur * 20, "end_ms": end_f * 20,
                        "speech_start_ms": (cur + first_sp[0]) * 20 if first_sp else cur * 20,
                        "words": wlist, "score": round(score, 3)})
            if DEBUG:
                print(f"  {it['key']}: {cur * 20}-{end_f * 20} ms (skor {score:.2f})", file=sys.stderr)
            cur = max(cur, end_f - 4)
        good = [x["score"] for x in res if x["score"] > -90]
        return res, (sum(good) / len(good) if good else -99.0)

    # KABA-İNCE: uzun surelerde önce 8'li ayet BLOKLARI hizalanır (uzun blok metni
    # benzersizdir, sınırı şaşmaz); sonra her blok kendi zaman aralığına hapsedilerek
    # ayetlere bölünür. Kayma blok sınırını aşamaz (Ahzâb'ın kalitesiz orta bölgesi).
    B = 8
    lead0 = not out["istiaze_ms"]
    if len(items) > B + 4:
        starts = list(range(0, len(items), B))
        blocks = [{"key": f"blok{i}", "words": [w for it in items[s:s + B] for w in it["words"]], "drop_prefix": 0}
                  for i, s in enumerate(starts)]
        broman = [[t for r in roman[s:s + B] for t in r] for s in starts]
        bres, bmean = align_seq(blocks, broman, start_cursor, T, 1.6, 6 * FPS, lead0)
        print(f"  kaba geçiş: {len(blocks)} blok, ort {bmean:.2f}", file=sys.stderr)
        res = []
        prev_end = start_cursor
        for bi, s in enumerate(starts):
            sub = items[s:s + B]
            sub_roman = roman[s:s + B]
            bstart = max(prev_end, bres[bi]["start_ms"] // 20)
            if bi + 1 < len(bres):
                bend = min(T, bres[bi + 1].get("speech_start_ms", bres[bi + 1]["start_ms"]) // 20 + 3 * FPS)
            else:
                bend = T
            bend = min(T, max(bend, bstart + 4 * FPS))
            r_i, _ = align_seq(sub, sub_roman, bstart, bend, 2.0, 8 * FPS, bi == 0 and lead0)
            res.extend(r_i)
            prev_end = (r_i[-1]["end_ms"] // 20 - 4) if r_i else bstart
        good = [x["score"] for x in res if x["score"] > -90]
        mean_s = sum(good) / len(good) if good else -99.0
    else:
        res, mean_s = align_seq(items, roman, start_cursor, T, 2.0, 8 * FPS, lead0)
        if mean_s < -4.4:
            print(f"  sure ortalama skoru {mean_s:.2f} — dar pencereli ikinci geçiş", file=sys.stderr)
            res2, mean_s2 = align_seq(items, roman, start_cursor, T, 1.3, 4 * FPS, lead0)
            if mean_s2 > mean_s:
                res, mean_s = res2, mean_s2
                print(f"  ikinci geçiş kazandı ({mean_s:.2f})", file=sys.stderr)
    out["items"] = res

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

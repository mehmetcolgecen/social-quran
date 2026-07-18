# Ayet-dosyalı kâriler için kelime zamanı çıkarımı (dosya = 1 ayet; bölme yok).
# Model bir kez yüklenir, listedeki her dosya tam-dosya hizalanır.
# Kullanım: python align-files.py batch.json out.json  (FFMPEG_BIN ortam değişkeni)
# batch.json: {"items": [{"file": ".../112001.mp3", "key": "112:1",
#              "words": [...], "drop_prefix": 4}, ...]}
# out.json: {"112:1": {"score": -2.3, "words": [[pos, s_ms, e_ms], ...]}, ...}
import json
import os
import subprocess
import sys
import tempfile

import soundfile as sf
import torch
import torchaudio
from uroman import Uroman

FFMPEG = os.environ.get("FFMPEG_BIN", "ffmpeg")
SR = 16000

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


@torch.inference_mode()
def emissions(wav):
    outs = []
    step = 40 * SR
    for off in range(0, len(wav), step):
        part = wav[off:off + step]
        if len(part) < 800:
            break
        em, _ = model(part.unsqueeze(0))
        outs.append(torch.log_softmax(em[0], dim=-1))
    return torch.cat(outs) if outs else torch.zeros(1, len(DICT))


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


def main():
    batch = json.load(open(sys.argv[1]))
    out = {}
    for n, it in enumerate(batch["items"]):
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
                subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", it["file"],
                                "-ac", "1", "-ar", str(SR), tmp.name], check=True)
                wav_np, _ = sf.read(tmp.name, dtype="float32")
            wav = torch.from_numpy(wav_np)
            toks = romanize_words(it["words"])
            ids = [DICT[c] for c in "".join(toks)]
            em = emissions(wav)
            if em.size(0) < len(ids) * 2 + 8:
                out[it["key"]] = {"score": -99, "words": []}
                continue
            targets = torch.tensor([ids], dtype=torch.int32)
            aligned, scores = torchaudio.functional.forced_align(em.unsqueeze(0), targets, blank=0)
            aligned, scores = aligned[0], scores[0]
            spans = token_spans(aligned)
            words = []
            i = 0
            for wl in (len(t) for t in toks):
                seg = spans[i:i + wl] if i + wl <= len(spans) else None
                i += wl
                words.append((seg[0][0], seg[-1][1]) if seg else None)
            drop = it.get("drop_prefix", 0)
            wlist = [[wi - drop + 1, sp[0] * 20, sp[1] * 20]
                     for wi, sp in enumerate(words) if sp and wi >= drop]
            real = aligned != 0
            score = float(scores[real].mean()) if real.any() else -99.0
            out[it["key"]] = {"score": round(score, 3), "words": wlist}
        except Exception as e:  # tek dosya hatası koşuyu durdurmasın
            print(f"HATA {it['key']}: {e}", file=sys.stderr)
            out[it["key"]] = {"score": -99, "words": []}
        if (n + 1) % 50 == 0:
            print(f"  {n + 1}/{len(batch['items'])}", file=sys.stderr)
    json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False)
    print(f"OK {len(out)} ayet", file=sys.stderr)


if __name__ == "__main__":
    main()

# Veri hazırlama imajı (Job) — Kur'an metni/meal/zamanlama indirir, doğrular,
# quran.db üretir ve ses arşivlerini çeker. Scriptler bağımsızdır (npm bağımlılığı yok);
# curl + python3 (zip açma) node:24 bookworm imajında mevcuttur.
# Bağlam: repo kökü (docker build -f packages/quran-data/Dockerfile .)
FROM node:24-bookworm
WORKDIR /app
COPY packages/quran-data packages/quran-data
# PVC /app/data'ya bağlanır; scriptler repo köküne göre data/ altına yazar
CMD ["bash", "-c", "node packages/quran-data/scripts/download.mjs && node packages/quran-data/scripts/validate.mjs && node --no-warnings packages/quran-data/scripts/build-db.mjs && node packages/quran-data/scripts/download-audio.mjs && echo 'VERI HAZIR'"]

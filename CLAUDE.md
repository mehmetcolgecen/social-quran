# Sosyal Kur'an — Proje Kuralları

Proje dokümanları: `GOAL.md` (hedefler + faz planı), `ON_HAZIRLIK.md` (doğrulanmış veri kaynakları), `FABLE5_PROMPT.md` (faz komutları).

## Değişmez kurallar
1. **Kur'an metni asla değiştirilmez.** Her veri işleme adımından sonra 114 sure / 6236 ayet / beklenen kelime sayısı assert edilir; kaynak dosyaların SHA-256'ları `data/checksums.json`'da tutulur ve doğrulanır.
2. Her veri kaynağının lisansı `data/LICENSES.md`'ye işlenir. Tanzil: metin değiştirilemez, atıf + tanzil.net linki zorunlu. quran-align: CC-BY 4.0.
3. Test edilmemiş faz "bitti" sayılmaz; kabul kriterleri GOAL.md'deki faz tablosundadır.
4. UI saygılı ve reklamsız; yorum katmanı tamamen kapatılabilir.

## Yapı
- npm workspaces monorepo: `apps/web` (Next.js), `apps/api` (NestJS), `packages/quran-data` (veri boru hattı), `deploy/` (K3S manifests).
- Veri: `data/raw/` (indirilen, gitignore'da), `data/processed/` (üretilen DB/SQL), `data/audio/` (mp3, gitignore'da).
- Kanonik anahtarlar: sure `1–114`, ayet `"2:255"`, kelime `"2:255:3"`, sayfa `1–604` (KFGQPC V2 Medine mushafı), cüz `1–30`.

## Komutlar
- Veri boru hattı: `npm run -w packages/quran-data download` / `validate` / `build-db` (detay: `packages/quran-data/README.md`).
- Ses indirme (uzun sürer, resumable): `npm run -w packages/quran-data download-audio`.
- Web uygulaması: `npm run dev -w apps/web` (http://localhost:3000) / `npm run typecheck -w apps/web` / `npm run build -w apps/web`.
- Dev yığını (Faz 2+): `npm run -w packages/devstack db` (PG :5433) + `npm run -w packages/devstack oidc` (issuer :7788) + `npm run dev -w apps/api` (API :4000, OpenAPI /docs).
- E2E kabul testi: `npm run -w apps/api test:e2e` (yığın çalışırken).
- Komutları repo kökünden çalıştır (npm workspaces kökü burası).

## Teknik notlar
- `node:sqlite` satırları null-prototype döner; client component'e prop geçmeden önce düz nesneye kopyala (`apps/web/lib/db.ts` içindeki `plain()`).
- Ayarlar (renk modu, dil anahtarları, meal, boyut) CSS sınıflarıyla anında uygulanır; yalnızca renkli↔mahreç geçişi render gerektirir (AyahRow memo'lu).
- Mahreç renklendirmesi basitleştirilmiştir (`apps/web/lib/mahrec.ts` başındaki nota bak); tecvid uzmanı doğrulaması bekliyor.

## Ortam notları
- Bu makinede docker/pnpm yok; npm workspaces kullanılıyor. PostgreSQL seed SQL'i `data/processed/` altında üretilir, CNPG'ye Faz 4'te yüklenir; yerel geliştirme node:sqlite ile.

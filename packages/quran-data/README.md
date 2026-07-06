# @sosyal-kuran/quran-data — Veri Boru Hattı

Faz 0: kaynak verileri indirir, doğrular ve işlenmiş veritabanlarını üretir. Tüm scriptler **idempotent**tir; yarıda kesilirse tekrar çalıştırmak yeterli.

```bash
npm run -w packages/quran-data download        # Tanzil metni + kelime TR/EN + mealler + zamanlamalar → data/raw/
npm run -w packages/quran-data download-audio  # 4 kâri mp3 arşivi (~5.5GB, uzun sürer) → data/audio/
npm run -w packages/quran-data validate        # sayım assert'leri + SHA-256 → data/checksums.json
npm run -w packages/quran-data build-db        # → data/processed/quran.db (SQLite) + seed.sql.gz (PostgreSQL)
```

## Üretilen şema (SQLite = Postgres)

- `surahs` (114): Arapça/TR/EN isimler, iniş yeri, ayet sayısı
- `ayahs` (6236): `verse_key`, Tanzil Uthmani metni (kanonik), sayfa/cüz/hizb/secde
- `words` (77.429): `location` (`2:255:3`), API Uthmani imlâsı, sayfa+satır (KFGQPC V2 604-sayfa düzeni), `tr`/`en` kelime anlamı, transliterasyon
- `translations` (12.472): Elmalılı (tr) + Saheeh International (en); Saheeh metninde `<sup foot_note=…>` dipnot işaretleri var — UI render ederken işlenmeli
- `reciters` (4) + `timings` (24.944): ayet başına kelime segmentleri `[[kelimeIdx_başl, kelimeIdx_bitiş, başl_ms, bitiş_ms], …]`

## Bilinen imlâ notu
API kelime metni ile Tanzil ayet metni 4301 ayette karakter düzeyinde farklıdır (aynı içerik, farklı imlâ tekniği; ör. hançer elif için tatweel taşıyıcısı). Kelime bazlı görüntüleme API imlâsını, bütünlük doğrulaması Tanzil'i esas alır.

## Ses dosyaları
`data/audio/<Reciter_slug>/SSSAAA.mp3` (ör. `001001.mp3`). Kaynak: everyayah.com; her kâri dizininde `.complete` işareti indirmenin doğrulandığını gösterir. quran-align zamanlamaları bu dosyalarla hizalıdır.

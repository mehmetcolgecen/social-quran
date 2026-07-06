# Faz 0 Raporu — Veri Boru Hattı (2026-07-06)

**Sonuç: TAMAMLANDI ✅** — GOAL.md kabul kriteri: "114 sure / 6236 ayet / tüm kelimeler checksum'la doğrulandı."

## Çalıştırılmış kanıtlar

### Doğrulama çıktısı (`npm run -w packages/quran-data validate`)
```
tanzil:  114 sure, 6236 ayet
words:   77.429 kelime, 604 sayfa, boş çeviri TR=0 EN=0
align:   4 kâri × 6236 ayet kelime zamanlaması, eksik=0
Doğrulama BAŞARILI — checksums.json yazıldı (243 dosya)
```

### DB satır sayıları (`build-db`)
| Tablo | Satır | Not |
|---|---|---|
| surahs | 114 | Arapça/TR/EN isim, iniş yeri |
| ayahs | 6.236 | Tanzil Uthmani (kanonik) + sayfa/cüz/hizb/secde |
| words | 77.429 | `location`, TR+EN anlam, transliterasyon, sayfa+satır (KFGQPC V2) |
| translations | 12.472 | Elmalılı (tr) + Saheeh International (en) |
| reciters | 4 | Husary, Abdul Basit, Alafasy, Minshawi |
| timings | 24.944 | ayet başına kelime segmentleri (ms) |

Örnek satır: `2:255:3` → `إِلَـٰهَ` / "tanrı" / "God", sayfa 42, satır 8. Husary 1:1 segmentleri: `[[0,1,50,510],[1,2,520,1180],…]`.

### Ses dosyaları
Her kâri için 6236/6236 ayet mp3'ü tek tek `existsSync` ile doğrulandı (fazla dosyalar sure başı besmele parçaları). Toplam 5.2 GB, `data/audio/<slug>/SSSAAA.mp3`.

## Kararlar ve notlar
1. **QUL yerine quran.com API v4:** QUL dump indirmeleri ücretsiz üyelik istiyor; aynı verinin açık REST sunumu kullanıldı (aynı kuruluş: Tarteel/quran.com). İleride üyelikle QUL dump'ına geçilebilir; şema aynı kalır.
2. **İmlâ farkı (4301 ayet):** API kelime imlâsı hançer elifi tatweel taşıyıcısıyla yazıyor; Tanzil doğrudan bitiştiriyor. İçerik farkı değil. Kanonik bütünlük referansı Tanzil, ekranda kelime imlâsı API.
3. **Saheeh International** metninde `<sup foot_note=…>` işaretleri var — Faz 1'de render/strip edilecek.
4. Ortamda docker yok → yerel geliştirme `quran.db` (SQLite), production seed `seed.sql.gz` (PostgreSQL COPY; CNPG'ye Faz 4'te `zcat seed.sql.gz | psql` ile yüklenir).

## Yeniden üretim
```bash
npm run -w packages/quran-data download && npm run -w packages/quran-data download-audio
npm run -w packages/quran-data validate && npm run -w packages/quran-data build-db
```
Tümü idempotent; `data/checksums.json` beklenen hash'leri içerir.

**Sıradaki:** Faz 1 — okuma deneyimi (renkli kelimeler, anlam satırları, ayarlar, mahreç modu, sesli takip).

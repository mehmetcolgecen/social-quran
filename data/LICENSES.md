# Veri Kaynakları ve Lisanslar

Son doğrulama: 2026-07-06. Değişmez kural: Kur'an metni hiçbir işlemde değiştirilmez; kaynak dosya SHA-256'ları `data/checksums.json`'da.

| Veri | Kaynak | Lisans / Şartlar | Yükümlülüğümüz |
|------|--------|------------------|----------------|
| Kur'an metni (Uthmani, kanonik) | [Tanzil Project](https://tanzil.net/download/) | Birebir kopya dağıtımı serbest; **metin değiştirilemez** | Sitede "Tanzil Project" atfı + tanzil.net linki (atıf sayfası) |
| Kelime-kelime TR/EN çeviri, kelime imlâsı, sayfa/satır (KFGQPC V2), sure metadata | [quran.com API v4](https://api.quran.com) (QUL/Tarteel altyapısı) | Açık API; kaynak veri QUL'de yayınlanıyor | quran.com / QUL (Tarteel) atfı; ticari kullanım öncesi QUL kaynak sayfasındaki nota tekrar bakılmalı |
| Tam meal TR | Elmalılı Hamdi Yazır (quran.com API id=52) | Kamu malı (vefat 1942; TR'de telif süresi 2012'de doldu) | Eser sahibi atfı |
| Tam meal EN | Saheeh International (quran.com API id=20) | Serbest dağıtılan yaygın çeviri; quran.com üzerinden sunuluyor | "Saheeh International" atfı; metindeki `<sup foot_note>` işaretleri korunuyor |
| Kelime-seviyesi ses zamanlamaları (4 kâri) | [quran-align](https://github.com/cpfair/quran-align) (cpfair) | **CC-BY 4.0** | Atıf zorunlu: "Word timings by cpfair/quran-align, CC-BY 4.0" |
| Ayet-ayet mp3 (Husary 64k, Abdul Basit Murattal 64k, Alafasy 128k, Minshawy Murattal 128k) | [everyayah.com](https://everyayah.com) | Ücretsiz dağıtılan tilavet arşivi; sayfada ticari kısıt belirtilmiyor | everyayah.com atfı; kâri isimleri arayüzde gösterilir |
| Font: KFGQPC Uthmanic Hafs v18 (woff2, `apps/web/fonts/`) | [quran.com-frontend-next](https://github.com/quran/quran.com-frontend-next) deposu (kaynak: KFGQPC) | KFGQPC fontları serbest kullanımlı dağıtılır; quran.com da aynı dosyayı kullanıyor | KFGQPC atfı (footer'da mevcut) |
| Font: Amiri Quran | [aliftype/amiri](https://github.com/aliftype/amiri) | SIL OFL 1.1 | OFL bildirimi |
| Font: Scheherazade New | [silnrsi/font-scheherazade](https://github.com/silnrsi/font-scheherazade) | SIL OFL 1.1 | OFL bildirimi |
| Font: Lateef | [silnrsi/font-lateef](https://github.com/silnrsi/font-lateef) | SIL OFL 1.1 | OFL bildirimi |
| Font: Aref Ruqaa | [google/fonts](https://github.com/google/fonts/tree/main/ofl/arefruqaa) | SIL OFL 1.1 | OFL bildirimi |
| Font: Caveat (el yazısı notlar) | [google/fonts](https://github.com/google/fonts/tree/main/ofl/caveat) | SIL OFL 1.1 | OFL bildirimi |
| Font: Hüsrev Hattı Arapça | font.download (toplayıcı site) | ⚠️ **LİSANS BELİRSİZ** — Hattat Ahmed Hüsrev Altınbaşak hattının dijitalleştirmesi; haklar muhtemelen Hayrat Vakfı'nda | **Yayına almadan önce Hayrat Vakfı'ndan yazılı izin alınmalı; izin yoksa üründen çıkarılmalı.** Şimdilik yalnızca yerel değerlendirme |
| Ek mealler: DE Bubenheim&Elyas (27), FR Hamidullah (31), IT Piccardo (153), ES Isa García (83), UR Jalandhari (234), HI al-Umari (122), KO Hamed Choi (219), JA Saeed Sato (218), ZH Ma Jian (56) | quran.com API v4 `/quran/translations/{id}` | Kaynak bazında; quran.com üzerinden açık sunulan çeviriler | Çevirmen atfı meal satırında kaynak adı olarak saklanıyor |
| Kelime-kelime UR + HI çevirileri | quran.com API v4 (`language=ur/hi`) | QUL wbw veri setleri | quran.com/QUL atfı |

| Kâri fotoğrafları (5 adet, `apps/web/public/reciters/`) | Wikimedia Commons (lisans script ile doğrulandı) | Husary + Minshawi: Public Domain; Şureym: CC BY-SA 4.0; Sudais: GODL-India; Alafasy: Copyrighted free use | Dosya bazlı atıf `apps/web/lib/reciter-photos.json` manifest'inde (kaynak linkleriyle); CC BY-SA olanlar için atıf sayfası gösterimi |

## Notlar
- QUL'ün doğrudan dump indirmeleri ücretsiz üyelik istiyor; aynı verinin açık REST sunumu olan quran.com API v4 kullanıldı. İkisi de aynı kuruluşun (Tarteel/quran.com) altyapısı.
- API imlâsı ile Tanzil imlâsı 4301 ayette teknik olarak farklı (ör. hançer elif ٰ için tatweel taşıyıcısı). İçerik farkı değildir; kanonik referans Tanzil, kelime görüntüleme API imlâsıdır.
- Atıf sayfası (Faz 1'de): Tanzil, quran.com/QUL, Elmalılı, Saheeh International, cpfair/quran-align (CC-BY 4.0), everyayah.com, KFGQPC.

# Faz 1 Raporu — Okuma Deneyimi (2026-07-06)

**Sonuç: TAMAMLANDI ✅** — GOAL.md kabul kriteri: "Fatiha'dan Nâs'a kadar okunabilir + dinlenebilir; 1:1–7 ve 2:1–20 doğrulaması; ayarlar anında uygulanır."

## Ne yapıldı

`apps/web` — Next.js 15 (App Router, TS, React 19), bağımlılık minimal (yalnızca next/react). Veri `quran.db`'den server component'lerde okunur (node:sqlite, salt-okunur); sosyal özellikler Faz 2'de `apps/api` üzerinden gelecek.

| Özellik | Durum |
|---|---|
| Renkli kelimeler + aynı renkte TR/EN anlam satırları | ✅ 10 renklik palet, kelime↔meal renk eşleşmesi |
| Anlam satırları dil bazlı aç/kapat | ✅ TR ve EN bağımsız; CSS ile anında |
| Renkli / Siyah / Mahreç modları | ✅ Mahreç: 4 bölge + lejant (basitleştirilmiş, `lib/mahrec.ts`) |
| Ayet meali (Elmalılı / Saheeh) | ✅ Kapalı/TR/EN/İkisi; `<sup>` dipnotları temizlenir |
| Font boyutu | ✅ 4 kademe, CSS var ile anında |
| Ses: kâri seçimi, ayet takibi, kelime vurgusu | ✅ quran-align segmentleri; otomatik ilerleme + scroll |
| Hız (0.75–1.5×) ve ayet tekrarı | ✅ |
| Sayfa/cüz işaretleri, sure navigasyonu, basmala | ✅ 604 sayfa (KFGQPC V2), /sayfa/[n] görünümü |
| Kaldığın yerden devam | ✅ localStorage, ana sayfada kart |
| Tipografi | ✅ KFGQPC Uthmanic Hafs (woff2, self-host) |
| Atıf yükümlülükleri | ✅ Footer'da Tanzil linki + tüm kaynaklar |

## Çalıştırılmış kanıtlar

```
GET /            → 200, 114 sure kartı
GET /sure/1      → 7 ayet bloğu; بِسْمِ + "adıyla" + Elmalılı meali
GET /sure/2      → 286 ayet bloğu (2:20 dahil); 47 sayfa işareti (s.2–49), 2 cüz işareti; basmala
GET /sayfa/604   → İhlâs + Felâk + Nâs ayetleri (taslak-3.jpeg'teki sayfa)
GET /api/timings/Husary_64kbps/1 → [{"ayah":1,"segments":[[0,1,50,510],…
GET /audio/…/002020.mp3 (Range: 0-99) → 206 Partial Content
/sure/115, /sayfa/605, path traversal → 404
tsc --noEmit → temiz
```

Görsel doğrulama (kullanıcı): http://localhost:3000 → Fatiha (1:1–7) ve Bakara 1–20'yi taslak fotoğraflarıyla karşılaştır; ayar çubuğundaki her anahtarın sayfa yenilenmeden uygulandığını gör.

## Bilinen sınırlar / Faz 2+ notları
- Arayüz şimdilik TR; i18n (domain'e göre TR/EN varsayılan) Faz 2'de.
- Uzun surelerde (Bakara ~6k kelime) SSR yükü büyük; `content-visibility` ile akıcı, ancak ileride ayet aralığı bazlı sayfalama düşünülebilir.
- Mahreç modu basitleştirilmiş (و hep Şefetân, ğunne renklendirilmez) — tecvid uzmanı doğrulaması ON_HAZIRLIK'ta açık madde.
- `/sayfa/[n]` ayetleri bütün gösterir; satır-birebir mushaf dizgisi (V2 glyph fontları) ileride eklenebilir.
- Kelime hover'da tam morfoloji/kelime detayı Faz 2 yorum hedefleriyle birlikte gelecek.

**Sıradaki:** Faz 2 — Keycloak auth + profil + yorum sistemi (kelime/ayet/sayfa/sure).

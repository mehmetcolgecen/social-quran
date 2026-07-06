# Fable-5 Prompt — Sosyal Kur'an Uygulaması

> **Nasıl kullanılır:** Repo kökünde `GOAL.md`, `ON_HAZIRLIK.md` ve bu dosya varken, aşağıdaki prompt'u Claude Code'a (Fable 5) yapıştırın. Tek seferde hepsini değil, **faz faz** ilerletmek için en sondaki "Faz komutları" satırlarından birini ekleyin. Büyük fazlardan önce plan modu önerilir (`Shift+Tab`).

---

## PROMPT (kopyala-yapıştır)

Sen bu projede kıdemli full-stack mühendis ve mimar olarak çalışıyorsun. Amaç: **Sosyal Kur'an** — kelime mealli, renkli, sesli-takipli ve sosyal katmanlı bir web Kur'an uygulaması. Önce repo kökündeki `GOAL.md` ve `ON_HAZIRLIK.md` dosyalarını oku; oradaki kararlar bağlayıcıdır. `taslak/` klasöründeki üç fotoğraf basılı "kelime mealli mushaf" ilhamıdır — hedefimiz bunun daha gelişmiş dijital hali.

### Değişmez kurallar
1. **Kur'an metni asla değiştirilmez.** Veri boru hattının her aşamasında kaynak metnin SHA-256'sı doğrulanır; normalize/render katmanları orijinal karakter dizisini korur. Her veri işleme adımından sonra 114 sure / 6236 ayet / beklenen kelime sayısı assert edilir.
2. Kullanılan her veri setinin (metin, kelime meali, tam meal, ses, font) **lisansı `data/LICENSES.md`'ye** kaydedilir; belirsiz lisanslı kaynak kullanılmaz.
3. Test edilmemiş hiçbir faz "bitti" sayılmaz; her fazın sonunda kabul kriterlerini çalıştırıp sonucu raporla.
4. UI saygılı ve sade: reklamsız, yorum katmanı tamamen kapatılabilir, mushaf metniyle sosyal içerik asla iç içe girmez.

### Mimari (hedef: K3S)
- `apps/web` — Next.js (App Router, TS). SSR; Arapça için self-host KFGQPC Uthmanic Hafs fontu; RTL dizgi doğruluğu.
- `apps/api` — Node.js (NestJS, TS) REST API + OpenAPI şeması.
- Auth — **Keycloak** (OIDC): misafirler her şeyi okur; yorum/profil için login. Google + e-posta/şifre.
- PostgreSQL 16 (**CNPG**), Redis (cache/session/rate-limit), ingress **Traefik** + cert-manager.
- `packages/quran-data` — veri boru hattı scriptleri (indirme, doğrulama, DB seed).
- `deploy/` — Helm chart veya kustomize manifests; tek komutla K3S'e kurulum.

### Veri modeli çekirdeği
- Kanonik anahtarlar: sure `1–114`, ayet `"2:255"`, kelime `"2:255:3"`, sayfa `1–604` (Medine mushafı), cüz `1–30`.
- `words` tablosu: arapça metin, sure/ayet/pozisyon, sayfa, satır, TR anlam, EN anlam, harf-dizisi (mahreç render'ı için).
- `comments`: hedef tipi (`word|ayah|page|surah`) + hedef anahtarı, görünürlük (`public|private`), parent_id (yanıt), quote_id (alıntı).
- `reactions` (like), `user_stats` (yıldız/rozet hesabı), `recitations` + `timings` (kâri, ayet, ms aralıkları).

### Özellik gereksinimleri (özet — detay GOAL.md'de)
- **Kelime renklendirme:** Ayet içindeki her kelime palet renginde; altındaki TR/EN anlam **aynı renkte** (eşleştirme görsel dilin kalbi). Kullanıcı ayarı: renkli ⇄ siyah.
- **Anlam satırları:** TR ve EN bağımsız aç/kapat (ikisi/biri/hiçbiri). Ayar misafir için localStorage, üye için profilde saklanır.
- **Mahreç modu:** Alternatif renklendirme katmanı — harfler 5 mahreç grubuna göre boyanır (harita `ON_HAZIRLIK.md`'de); lejant gösterilir. Kelime-renk moduyla aynı anda açılamaz.
- **Ses:** Kâri seçimi, ayet-ayet çalma, çalan ayetin vurgulanması + otomatik scroll, hız/tekrar kontrolleri. Zaman verisi varsa kelime vurgusu.
- **Yorumlar:** 4 hedef tipi; metin içinde küçük rakam rozeti, hover'da önizleme, panelde tam liste; public/private; beğeni, yanıt, alıntı; "yorumları gizle" anahtarı; misafir salt-okur.
- **Yıldız sistemi:** Beğeni eşiklerine göre yıldız; profilde rozetler ve en beğenilen yorumlar.
- **Moderasyon:** Şikâyet akışı + basit admin paneli + kelime filtresi.
- **i18n:** Arayüz TR/EN; sosyal-kuran.com → TR varsayılan, social-quran.com → EN varsayılan.

### Çalışma şekli
- Monorepo: pnpm workspaces. Lint + typecheck + test CI'da (GitHub Actions).
- Her fazda: önce kısa plan, sonra uygulama, sonra kabul kriterlerinin **çalıştırılmış kanıtı** (test çıktısı, curl örneği, ekran görüntüsü alınabilir dev sunucu adımları).
- Veri indirme scriptleri idempotent ve tekrar çalıştırılabilir olsun; ham veri `data/raw/` (gitignore), işlenmiş veri DB'de.
- Bilinmeyen/riskli nokta bulursan (ör. TR kelime-meal kaynağı eksikse) durup seçenekleri kısa artı/eksiyle sun.

### Fazlar ve kabul kriterleri
- **Faz 0 — Veri:** Metin + kelime mealleri + sayfa eşlemesi + 2 kâri ses indirilir, doğrulanır, seed edilir. ✔ Sayım/checksum assert'leri geçer; `data/LICENSES.md` dolu.
- **Faz 1 — Okuma:** Sure/sayfa görünümü, renkli kelimeler + anlam satırları + ayarlar + mahreç modu + ses çalar (ayet takibi). ✔ 1:1–7 ve 2:1–20 görsel doğrulama; ayarlar anında uygulanır.
- **Faz 2 — Auth & Yorum:** Keycloak entegrasyonu, profil, 4 hedefli yorum CRUD, rakam rozetleri, public/private. ✔ e2e: misafir okur/yazamaz, üye yazar.
- **Faz 3 — Sosyal:** Beğeni, yanıt, alıntı, yıldız/rozet, moderasyon. ✔ Beğeni eşiği geçince profil rozeti oluşur.
- **Faz 4 — Deploy:** K3S manifests/Helm, CNPG + Redis + Keycloak + Traefik + cert-manager, CI/CD. ✔ İki domain HTTPS ile canlı, CNPG backup zamanlanmış.

---

## Faz komutları (prompt'un sonuna eklenecek tek satır)

- `Şimdi sadece Faz 0'ı uygula.`
- `Faz 0 tamam; Faz 1'i uygula.`
- … (her faz için aynı kalıp)

## İlk oturum için önerilen ek satır

`Başlamadan önce ON_HAZIRLIK.md'deki 🔍 işaretli veri-kaynağı doğrulamalarını yap (özellikle Türkçe kelime-meal kaynağı) ve sonucu raporla; kaynak eksikse alternatif öner.`

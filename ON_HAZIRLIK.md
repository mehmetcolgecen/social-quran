# Ön Hazırlık — İşe Başlamadan Önce Yapılacaklar

Kodlamaya başlamadan önce netleşmesi/hazırlanması gerekenler. ✅ = doğrulandı/karar verildi; 🔍 = doğrulama gerekiyor; 🛠 = elle yapılacak iş.

> **Veri kaynağı doğrulaması 2026-07-06'da yapıldı.** Projenin en büyük riski (Türkçe kelime-kelime meal) **çözüldü** — QUL'de mevcut. Aşağıdaki kaynakların tamamı indirme aşamasında `data/LICENSES.md`'ye lisans notuyla kaydedilecek.

## 1. Veri Kaynakları ve Lisanslar — DOĞRULANDI

### Kur'an metni ✅
- **Tanzil.net** (https://tanzil.net/download/): Uthmani ve Simple varyantlar; Text / XML / SQL formatları. **Lisans doğrulandı:** birebir kopyalama ve dağıtım serbest, **metin değiştirilemez**, Tanzil Project'e atıf + tanzil.net linki zorunlu. Sitedeki atıf sayfasına eklenecek.
- Alternatif/ek: QUL "QPC Hafs" Unicode metni (KFGQPC imlâsı; V1/V2 glyph fontlarıyla birebir uyumlu).
- 🛠 İndirme sonrası doğrulama: 114 sure / 6236 ayet / kelime sayımı + SHA-256 kayıt.
- Not: kullanıcı "md formatında" istemişti; kelime-bazlı renklendirme ve `sure:ayet:kelime` anahtarları için **kelime-seviyesi JSON/SQL esas**, md istenirse export olarak üretilir.

### Kelime-kelime anlamlar (TR + EN) ✅ — en büyük risk çözüldü
- **QUL (qul.tarteel.ai/resources/translation):** Kelime-kelime çeviri dilleri doğrulandı: **Türkçe ✅**, İngilizce ✅ (ayrıca Hintçe, Farsça, Urduca, Bengalce, Fransızca, Endonezce, Tamilce…). **JSON ve SQLite** formatlarında indirilebilir.
- ⚠️ QUL'de lisans **kaynak bazında** değişiyor (ör. Almanca wbw "© copyrighted" işaretli; TR/EN açık görünüyor). İndirme sırasında her kaynağın sayfasındaki lisans notu `data/LICENSES.md`'ye yazılacak.

### Tam meal (yan panel) ✅
- **TR (QUL'de mevcut):** Elmalılı Hamdi Yazır (vefat 1942 → TR'de telif 2012'de doldu, **kamu malı** — birincil öneri), ayrıca Diyanet, Muslim Shahin, Shaban Britch, Dar Al-Salam çevirileri listede (Diyanet'in dağıtım şartları belirsiz — kullanılacaksa ayrıca teyit).
- **EN:** QUL'deki açık dağıtımlı çevirilerden biri (ör. Saheeh International — indirme sayfasındaki nota göre kayıt).

### Ses (tilavet) ✅
- **everyayah.com** (https://everyayah.com/recitations_ayat.html): ayet-ayet mp3, 20+ kâri; Internet Archive'da tam yedekleri de var (archive.org/details/quran-every-ayah).
- **quran-align (github.com/cpfair/quran-align):** **kelime-seviyesi zaman damgaları, CC-BY 4.0**, everyayah ses dosyalarıyla uyumlu. Yayınlanmış 12 kâri seti doğrulandı:
  Abdul Basit (Mujawwad 128k + Murattal 64k), Sudais (192k), Abu Bakr eş-Şâtırî (128k), **Alafasy (128k)**, Hani Rifai (192k), **Husary (64k)**, Husary Muallim (128k), **Minshawi (Mujawwad 192k + Murattal 128k)**, Tablavi (128k), Şureym (128k).
- **QUL recitation (qul.tarteel.ai/resources/recitation):** 133 tilavet, **59'unda segment (zamanlama) verisi**, JSON/SQLite — quran-align'a alternatif/tamamlayıcı.
- ✅ **MVP kâri seçimi önerisi (hepsi hem everyayah hem quran-align'da var):** Husary (64k, öğretici ve net), Abdul Basit Murattal (64k), Alafasy (128k), Minshawi Murattal (128k). ≈ 3–4 GB.
- 🛠 Depolama: MVP'de bu 4 kâri PVC üzerinde self-host; disk sıkışırsa everyayah'a proxy fallback.

### Sayfa/cüz eşlemesi ✅
- **QUL mushaf-layout (qul.tarteel.ai/resources/mushaf-layout):** 12 layout seti; **KFGQPC V1 (1405H), V2 (1421H), V4 (1441H)** Medine mushafı (604 sayfa) doğrulandı — sayfa/satır bazında kelime konumları, **SQLite** formatında. "Sayfa yorumu" ve sayfa navigasyonu bu veriye bağlanacak. Öneri: **V2** (en yaygın dijital mushaf düzeni).

### Font ✅
- **QUL font deposu (qul.tarteel.ai/resources/font):** QPC Hafs (Unicode, ttf/woff2 — akan metin için birincil ✅), QPC V1/V2 glyph fontları (sayfa-birebir mushaf görünümü istenirse), **QPC V4 Tajweed fontu** (renkli tecvid — mahreç moduna ek ilham), sure adı fontları. woff2 self-host edilecek.

### Mahreç haritası 🛠 (statik veri olarak elle hazırlanacak)
- 5 mahreç grubunun harf eşlemesi:
  - **el-Cevf** (boşluk): med harfleri — sakin elif/vav/ya (bağlam gerektirir)
  - **el-Halk** (boğaz): ء هـ ع ح غ خ
  - **el-Lisân** (dil): ق ك ج ش ي ض ل ن ر ط د ت ظ ذ ث ص ز س
  - **eş-Şefetân** (dudaklar): ف ب م و
  - **el-Hayşûm** (geniz): ğunne — şeddeli ن/م (bağlamsal; v1'de bu alt kümeyle sınırla)
- ⚠️ Cevf ve Hayşûm harf değil **bağlam** kuralı; v1'de basitleştirilmiş kural seti + bir tecvid bilene doğrulatma.

## 2. Alan Adı & Erişim
- 🛠 sosyal-kuran.com ve social-quran.com kaydı; DNS'in K3S ingress IP'sine yönlendirilmesi.
- 🛠 cert-manager + Let's Encrypt ile TLS (iki domain tek uygulamaya, dil varsayılanı domain'e göre: sosyal-kuran → TR arayüz, social-quran → EN).

## 3. Altyapı Hazırlığı (K3S)
- 🛠 K3S cluster'ın hazır olduğunun teyidi (node sayısı, toplam disk — ses için ~5 GB dahil, RAM).
- 🛠 Kurulacak operatörler: **CloudNativePG (CNPG)**, **cert-manager**; K3S'in yerleşik **Traefik**'i ingress olarak kullanılacak (ayrıca nginx kurmaya gerek yok — tek karar: Traefik ✅).
- 🛠 Container registry kararı (ghcr.io ✅ öneri) ve CI/CD (GitHub Actions → registry → `kubectl apply`/Helm; ileride ArgoCD).
- 🛠 Yedekleme: CNPG scheduled backup hedefi (S3 uyumlu bir bucket veya node-yerel + offsite).

## 4. Teknoloji Kararları (öneriler ✅)
- **Frontend:** Next.js (React, App Router) — SSR ile SEO + hızlı ilk yükleme; QPC Hafs fontu self-host.
- **Backend:** Node.js (NestJS veya Fastify) REST/JSON API — tek dil (TS) tüm stack'te; alternatif Go istenirse belirtin.
- **Auth:** **Keycloak** (self-host OIDC, "1 auth pod" gereksinimini birebir karşılar) + Google login. Kendin-yaz auth önerilmez (güvenlik yükü).
- **DB:** PostgreSQL 16 (CNPG) — Kur'an verisi + kullanıcı/yorum verisi ayrı şemalarda.
- **Cache:** Redis — session/rate-limit/sık okunan sayfalar.
- **Monorepo:** pnpm workspaces (`apps/web`, `apps/api`, `packages/quran-data`, `deploy/`).

## 5. İçerik & Hukuk
- 🛠 Yorum politikası ve moderasyon kuralları metni (TR/EN) — dinî içerik platformunda tartışma yönetimi baştan tanımlanmalı.
- 🛠 KVKK/GDPR: aydınlatma metni, çerez politikası, hesap silme akışı.
- 🛠 Atıf/lisans sayfası: Tanzil (link zorunlu), QUL/Tarteel, quran-align (CC-BY 4.0 — atıf zorunlu), everyayah, KFGQPC fontları.

## 6. Repo Başlangıcı
- 🛠 `git init` + GitHub repo; `CLAUDE.md` (proje kuralları: metin bütünlüğü, lisans, test komutları); bu üç doküman repoya taşınır.
- 🛠 Taslak görsellerinin repoya `docs/inspiration/` altına kopyalanması (not: `taskak-1.jpeg` dosya adında yazım hatası var).

## Sıralama Önerisi

1. ~~Veri kaynaklarını doğrula~~ ✅ (2026-07-06 tamamlandı) → 2. Repo + CLAUDE.md → 3. Faz 0 veri boru hattı (Tanzil metni + QUL TR/EN wbw + QUL V2 layout + 4 kâri ses + quran-align zamanlamaları) → 4. Faz 1 UI → … (bkz. GOAL.md faz tablosu). Domain/K3S işleri paralel yürüyebilir; Faz 4'e kadar blocker değil.

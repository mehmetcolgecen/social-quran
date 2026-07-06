# Sosyal Kur'an — Hedef Dokümanı (GOAL)

Domainler: **sosyal-kuran.com** / **social-quran.com**

## Vizyon

Basılı "kelime mealli mushaf" deneyimini (bkz. `taslak/taskak-1.jpeg`, `taslak-2.jpeg`, `taslak-3.jpeg`) web'e taşıyan, üzerine **sesli takip** ve **sosyal katman** (kelime/ayet/sayfa/sure yorumları) ekleyen; misafir kullanıcıya tamamen açık, saygılı ve reklamsız bir Kur'an okuma platformu.

## Ana Hedefler

1. **Renkli kelime okuma deneyimi** — Her Arapça kelime bir palet rengiyle renklendirilir; altındaki Türkçe/İngilizce kelime anlamı **aynı rengi taşır** (basılı mushaftaki eşleştirme mantığı). Full-text (akan metin) formatında; sayfa (604 Medine mushafı sayfası), cüz, sure sınırları işaretli.
2. **Mahreç modu (tilavet)** — Harfler 5 mahreç bölgesine göre renklendirilir: el-Cevf, el-Halk, el-Lisân, eş-Şefetân, el-Hayşûm.
3. **Sesli ve takipli tilavet** — Meşhur imamların açık kaynak ses kayıtları; çalarken okunan ayet (ileri aşamada kelime) vurgulanır, otomatik kaydırma yapılır.
4. **Sosyal katman** — Login'li kullanıcılar kelime, ayet, sayfa ve sure hedeflerine yorum yazar; yorumlar public/private olabilir, beğenilebilir, alıntılanabilir; çok beğenilen yorumcular yıldız-tabanlı ödül/rozet kazanır.
5. **Rahatsız etmeyen arayüz** — Yorumlar metin içinde küçük rakam rozetleriyle gösterilir, hover'da belirginleşir; tamamen kapatılabilir. Misafirler okur ama yazamaz.
6. **K3S üzerinde self-host** — 1 auth + 1 UI + 1 backend + 1 ingress (Traefik) + PostgreSQL (CNPG) + Redis.

## Özellik Listesi

### Okuma Deneyimi
- Sure / cüz / sayfa / ayet navigasyonu; kaldığın yerden devam.
- Kelime renklendirme: **renkli** ve **siyah** mod (kullanıcı ayarı).
- Kelime anlamları: Arapça kelimenin altında TR ve EN; **dil bazında ayrı ayrı açılıp kapatılabilir** (sadece TR, sadece EN, ikisi, hiçbiri).
- Mahreç modu: ayrı bir görünüm katmanı; 5 mahreç rengi + lejant.
- Ayet numaraları basılı mushaftaki gibi süslü rozet içinde; yan panelde (veya ayet altında) tam meal.
- Arapça için uygun mushaf fontu (KFGQPC Uthmanic Hafs vb.), doğru RTL dizgi.

### Ses
- En az 3–5 meşhur kâri (ör. Abdulbasit, Husary, Minshawi, Alafasy) — açık/serbest dağıtımlı kaynaklardan.
- Ayet-ayet oynatma, sure baştan çalma, hız kontrolü, tekrar modu.
- Takip: çalan ayet vurgulanır + otomatik scroll; Faz-2'de kelime-seviyesi vurgu (quran-align zaman damgaları).

### Sosyal
- Yorum hedefleri: kelime (`2:255:3`), ayet (`2:255`), sayfa (`1–604`), sure (`1–114`).
- Görünürlük: public / private (sadece sahibi). Misafir: okuma evet, yazma hayır.
- Etkileşim: beğeni, yanıt, alıntı (quote). Bildirimler.
- Rakam rozetleri: hedefte kaç yorum olduğu küçük sayı ile gösterilir; hover'da önizleme; "yorumları gizle" global anahtarı.
- Yıldız/ödül sistemi: beğeni eşiklerine göre yıldız/rozet; profilde sergilenir.
- Moderasyon: şikâyet etme, admin paneli, küfür/spam filtresi. (Dinî içerikli platformda kritik.)

### Kullanıcı & Auth
- Misafir tüm içeriği okur; login yalnızca yorum + profil için gerekir.
- Auth: self-host OIDC sağlayıcı (öneri: **Keycloak** veya **Zitadel**) + e-posta/şifre + Google girişi.
- Profil: avatar, biyografi, yıldızlar, public yorumlar, istatistikler.

## Faz Planı

| Faz | Kapsam | Bitti sayılır çünkü… |
|-----|--------|----------------------|
| 0 | Veri boru hattı: metin, kelime mealleri, sayfa eşlemesi, ses dosyaları → doğrulanıp DB'ye yüklenir | 114 sure / 6236 ayet / tüm kelimeler checksum'la doğrulandı |
| 1 | Okuma deneyimi: renkli kelimeler, anlam satırları, ayarlar, mahreç modu, ses çalar (ayet takibi) | Fatiha'dan Nâs'a kadar okunabilir + dinlenebilir |
| 2 | Auth + profil + yorum CRUD (4 hedef tipi, public/private, rakam rozetleri) | Misafir okur, üye yazar; e2e test geçer |
| 3 | Sosyal etkileşim: beğeni, yanıt, alıntı, yıldız sistemi, moderasyon | Ödül rozetleri profilde görünür |
| 4 | K3S production: Helm/manifests, CNPG, Redis, Traefik + cert-manager, CI/CD | sosyal-kuran.com üzerinden HTTPS ile canlı |

## Değişmez Kurallar (Non-negotiable)

- **Metin bütünlüğü:** Kur'an metni hiçbir işlemde değiştirilmez; kaynak veri hash'lenir, her deploy'da doğrulanır.
- **Lisans uyumu:** Tüm metin/meal/ses kaynaklarının lisansları kayıt altına alınır, sitede atıf sayfası bulunur.
- **Saygılı UX:** Reklamsız; yorum katmanı isteyene tamamen kapanır; mushaf metni asla yorumlarla iç içe geçmez.
- **KVKK/GDPR:** Minimum veri toplama, hesap silme hakkı.

## Başarı Kriterleri

- Mobil ve masaüstünde akıcı okuma (sayfa geçişi < 100ms hissi, LCP < 2.5s).
- Renk modları ve dil anahtarları anında (client-side) uygulanır.
- Ses takibi ayet bazında ±0.5s hassasiyetle çalışır.
- Misafir → üye dönüşümü tek adımlı; login duvarı yalnızca yazma eylemlerinde.

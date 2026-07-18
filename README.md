# Sosyal Kur'an

Kelime mealli, renkli, sesli takipli ve saygılı bir Kur'an-ı Kerim okuma platformu.

🌐 **Canlı:** [sosyal-kuran.com](https://sosyal-kuran.com) · [social-quran.com](https://social-quran.com)

## Özellikler

- 📖 **İki görünüm:** Medine mushafı sayfa düzeni (604 sayfa) ve sure görünümü
- 🎨 **Kelime kelime renklendirme** ve basitleştirilmiş **mahreç modu** (tecvid bölgeleri)
- 🔤 **Kelime altı anlamlar** (TR/EN/UR/HI) ve **11 dilde tam meal**
- 🔊 **8 kâri** ile ayet ayet dinleme; 4 kâride **kelime seviyesinde takip**
- 🎓 **Öğren bölümü:** renkli elifba tablosu + 46 ders (harfler → tecvid → kısa sure pratikleri), yapay zekâ seslendirmesi ve gerçek tilavet örnekleriyle
- 🔬 **Hakikatler:** ayetlerdeki bilimsel işaretlere dair tefekkür notları
- 💬 **Sosyal katman:** ayet yorumları, hâşiye (el yazısı not) görünümü, beğeni, şikâyet ve moderasyon — tamamen kapatılabilir
- 🔖 Yer imleri, okuma planı, ezber kartları, ayet kartı paylaşımı
- 🌙 Açık/koyu tema, TR/EN arayüz, PWA desteği; **reklamsız**

## Değişmez ilke

**Kur'an metni asla değiştirilmez.** Metin [Tanzil](https://tanzil.net) Uthmani sürümünden alınır; her veri işleme adımından sonra 114 sure / 6236 ayet / beklenen kelime sayısı doğrulanır ve kaynak dosyaların SHA-256 özetleri (`data/checksums.json`) denetlenir.

## Mimari

npm workspaces monorepo:

| Dizin | İçerik |
| --- | --- |
| `apps/web` | Next.js okuma arayüzü (node:sqlite ile salt-okunur Kur'an DB) |
| `apps/api` | NestJS sosyal API (PostgreSQL + Redis, OIDC ile korunur) |
| `packages/quran-data` | Veri boru hattı: indir → doğrula → SQLite/SQL üret |
| `packages/devstack` | Yerel geliştirme yığını (embedded PostgreSQL + OIDC mock) |
| `deploy/` | K3S manifestleri (CNPG PostgreSQL, Keycloak, ingress, GH Actions imajları) |

## Geliştirme

```bash
npm install
npm run -w packages/quran-data download   # kaynak verileri indir
npm run -w packages/quran-data validate   # bütünlük doğrulaması
npm run -w packages/quran-data build-db   # quran.db üret
npm run dev -w apps/web                   # http://localhost:3000
```

Sosyal özellikler için: `npm run -w packages/devstack db` + `oidc` + `npm run dev -w apps/api`, kabul testleri `npm run -w apps/api test:e2e`.

## Veri kaynakları ve atıflar

| Kaynak | Kullanım | Lisans |
| --- | --- | --- |
| [Tanzil](https://tanzil.net) | Kur'an metni (Uthmani) | Metin değiştirilemez, atıf zorunlu |
| [quran.com API](https://quran.com) | Kelime anlamları, mealler | Kaynak bazında, çevirmen atfıyla |
| [everyayah.com](https://everyayah.com) | Ayet ayet tilavet mp3'leri | Serbest dağıtım, atıfla |
| [cpfair/quran-align](https://github.com/cpfair/quran-align) | Kelime seviyesi zamanlamalar | CC-BY 4.0 |
| KFGQPC (Medine Mushafı Kompleksi) | Hafs yazı tipi, sayfa düzeni | Serbest kullanım, atıfla |
| [Amiri](https://github.com/aliftype/amiri) · [DigitalKhatt](https://github.com/DigitalKhatt) | Kur'an yazı tipleri | OFL 1.1 · MIT |

Ayrıntılı liste: `data/LICENSES.md`.

## Lisans

İçerik kaynakları yukarıdaki tabloda belirtilen kendi lisanslarına tabidir; kod için ayrı bir lisans dosyası henüz eklenmemiştir.

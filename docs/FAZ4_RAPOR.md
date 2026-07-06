# Faz 4 Raporu — K3S Production (2026-07-07)

**Durum: KURULUM PAKETİ HAZIR ✅ / CANLIYA ALMA CLUSTER BEKLİYOR ⏳**

GOAL.md kabul kriteri "iki domain HTTPS ile canlı + CNPG backup zamanlanmış" fiziksel olarak
K3S cluster'ı ve DNS kayıtları gerektirir — bu makinede cluster yok. Bu fazda üretilen paket,
`deploy/README.md`'deki adımlar izlenerek **tek `kubectl apply -k` ile** canlıya alınacak durumda.

## Üretilenler

### İmajlar (3 Dockerfile + GitHub Actions release.yml → ghcr.io)
| İmaj | İçerik |
|---|---|
| `sosyal-kuran-web` | Next.js standalone (SSR); quran.db + ses PVC'den (`QURAN_DATA_ROOT`) |
| `sosyal-kuran-api` | NestJS dist + migrasyonlar (`node scripts/migrate.mjs` initContainer'da) |
| `sosyal-kuran-data` | Veri hazırlık Job'ı: indir → doğrula → build-db → 8 kâri ses (idempotent) |

### Manifests (`deploy/k8s/`, kustomize)
- **CNPG Cluster** (PG16, 8Gi) + `postInitSQL` ile keycloak DB + **ScheduledBackup 02:30 → S3** (retention 14g)
- **Keycloak 26** — `/auth` altında, realm `sosyal-kuran` otomatik import (kayıt açık, TR/EN,
  moderator/admin realm rolleri, `sosyal-kuran-api` audience mapper'lı confidential client)
- **Redis 7** (128MB LRU) — Faz 4 sonrası rate-limit/cache taşınacak
- **quran-data PVC (20Gi) + init Job**
- **api / web Deployment+Service** (web 2 replica; sağlık probları; API dışa kapalı — proxy üzerinden)
- **Ingress (Traefik)** — 4 host (iki domain + www), **cert-manager ClusterIssuer'ları
  (Let's Encrypt prod + staging)**, HTTP→HTTPS kalıcı yönlendirme middleware'i
- `secrets.example.yaml` şablonu (gerçek `secrets.yaml` gitignore'da)

### CI/CD (`.github/workflows/`)
- `ci.yml`: her PR/push'ta web+api typecheck
- `release.yml`: main'e push'ta 3 imajı ghcr.io'ya (latest + sha etiketli, GHA cache'li)

## Mimari kararların prod karşılıkları
- Dev'deki mock OIDC → **Keycloak realm'i** (`OIDC_ISSUER` env değişimi, kod aynı — Faz 2'de planlandığı gibi)
- Dev embedded-postgres → **CNPG**; migrasyonlar aynı SQL dosyaları
- Kur'an içeriği web'den (PVC), sosyal veriler API+PG'den; ses/statikler Traefik arkasında

## Doğrulama
- 12 manifest + 2 workflow YAML parse ✓, realm JSON parse ✓, web+api typecheck ✓
- İmaj build'leri CI'da doğrulanacak (yerelde docker yok) — release.yml ilk push'ta test edilmeli

## Canlıya alma (özet — detay `deploy/README.md`)
1. GitHub'a push → imajlar ghcr'de; manifestlerdeki `DEGISTIR-github-kullanici` doldurulur
2. K3S + DNS hazır → operatörler (CNPG, cert-manager) → `secrets.yaml` → `kubectl apply -k deploy/k8s`
3. data-init Job (~30-60 dk) → Keycloak client secret'ı üret → web restart
4. `kubectl get certificate` Ready → https://sosyal-kuran.com 🎉

## Açık işler (cluster sonrası)
- S3 bucket yoksa backup bloğu geçici yorumlanır; bucket gelince açılır
- Google IdP (Keycloak konsolundan 2 dk), rate-limit'in Redis'e taşınması, ArgoCD (isteğe bağlı)

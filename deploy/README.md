# K3S'e Kurulum (Faz 4)

Hedef: **sosyal-kuran.com** + **social-quran.com**, Traefik + cert-manager (Let's Encrypt) ile HTTPS.

## Ön koşullar
1. Çalışan K3S cluster'ı (Traefik yerleşik gelir) ve `kubectl` erişimi.
2. DNS: iki domain (+www) A kaydı → cluster'ın dış IP'si. (Let's Encrypt HTTP-01 için 80/443 açık olmalı.)
3. Operatörler:
   ```bash
   kubectl apply --server-side -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.25/releases/cnpg-1.25.1.yaml
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.3/cert-manager.yaml
   ```
4. GitHub reposu + Actions: `release.yml` main'e push'ta imajları ghcr.io'ya basar.
   Repo private ise ghcr çekimi için namespace'e `imagePullSecret` ekleyin.

## Kurulum adımları
```bash
# 1) Yer tutucuları doldurun
grep -rn "DEGISTIR" deploy/k8s/   # imaj sahibi (ghcr kullanıcı adı), S3 endpoint vb.

# 2) Gizli değerler
cp deploy/k8s/secrets.example.yaml deploy/k8s/secrets.yaml   # düzenleyin (git'e girmez)
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/secrets.yaml

# 3) Tüm kaynaklar
kubectl apply -k deploy/k8s

# 4) Veri hazırlığı (~30-60 dk: metin + 8 kâri ses ≈ 11 GB)
kubectl -n sosyal-kuran logs -f job/quran-data-init

# 5) Keycloak son ayar
#    - https://sosyal-kuran.com/auth → admin (keycloak-admin secret'ı)
#    - Realm 'sosyal-kuran' import edildi; client 'sosyal-kuran-web' >
#      Credentials'tan secret üretin → web-oidc secret'ındaki client-secret'ı
#      güncelleyip: kubectl -n sosyal-kuran rollout restart deploy/web
#    - Google ile giriş isteniyorsa: Identity Providers > Google (client id/secret).

# 6) Kontroller
kubectl -n sosyal-kuran get pods
kubectl -n sosyal-kuran get certificate    # sosyal-kuran-tls: Ready=True
curl -I https://sosyal-kuran.com
```

## Notlar
- **Sertifika:** İlk kurulumda `letsencrypt-staging` issuer'ı ile deneyin
  (ingress annotation'ını değiştirip), yeşil görünce `letsencrypt-prod`'a çevirin.
- **Yedek:** CNPG gece 02:30'da S3'e yedekler (`backup-s3` secret'ı + bucket gerekli).
  Bucket hazır değilse `cnpg-cluster.yaml` içindeki backup bloğunu ve ScheduledBackup'ı
  geçici olarak yorumlayın.
- **PVC:** K3S local-path RWO'dur; tek node'da web+api+job aynı node'da sorunsuz.
  Çok node'a geçişte Longhorn/NFS (RWX) kullanın.
- **API dışa açık değildir** — web, `/api/social` proxy'siyle cluster içinden konuşur.
- Dev OIDC issuer'ı ve embedded-postgres yalnızca yereldir; prod'da kullanılmaz.

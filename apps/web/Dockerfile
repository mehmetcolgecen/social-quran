# Sosyal Kur'an Web — bağlam: repo kökü (docker build -f apps/web/Dockerfile .)
# Not: sayfalar dinamik (SSR); quran.db build'de gerekmez, çalışma anında
# QURAN_DATA_ROOT altındaki PVC'den okunur.
FROM node:24-slim AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/quran-data/package.json packages/quran-data/
COPY packages/devstack/package.json packages/devstack/
RUN npm ci -w apps/web
COPY apps/web apps/web
RUN npm run build -w apps/web

FROM node:24-slim
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static apps/web/.next/static
COPY --from=build /repo/apps/web/public apps/web/public
EXPOSE 3000
USER node
CMD ["node", "apps/web/server.js"]

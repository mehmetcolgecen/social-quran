# Sosyal Kur'an API — bağlam: repo kökü (docker build -f apps/api/Dockerfile .)
FROM node:24-slim AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/quran-data/package.json packages/quran-data/
COPY packages/devstack/package.json packages/devstack/
RUN npm ci -w apps/api
COPY apps/api apps/api
RUN npm run build -w apps/api

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/apps/api/dist dist
COPY apps/api/migrations migrations
COPY apps/api/scripts scripts
COPY apps/api/package.json package.json
EXPOSE 4000
USER node
CMD ["node", "dist/main.js"]

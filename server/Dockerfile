FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV npm_config_update_notifier=false

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY nest-cli.json tsconfig.json tsconfig.build.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src ./src
RUN npm run build

FROM base AS production-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=8000
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./package.json
USER node
EXPOSE 8000
CMD ["node", "dist/main.js"]

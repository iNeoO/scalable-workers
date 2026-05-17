FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev /temp/prod
COPY package.json bun.lock /temp/dev/
COPY package.json bun.lock /temp/prod/
COPY apps/task-worker/package.json /temp/dev/apps/task-worker/package.json
COPY apps/task-worker/package.json /temp/prod/apps/task-worker/package.json
COPY packages/common/package.json /temp/dev/packages/common/package.json
COPY packages/common/package.json /temp/prod/packages/common/package.json
COPY packages/drizzle/package.json /temp/dev/packages/drizzle/package.json
COPY packages/drizzle/package.json /temp/prod/packages/drizzle/package.json
COPY packages/infra/package.json /temp/dev/packages/infra/package.json
COPY packages/infra/package.json /temp/prod/packages/infra/package.json
COPY packages/services/package.json /temp/dev/packages/services/package.json
COPY packages/services/package.json /temp/prod/packages/services/package.json
RUN cd /temp/dev && bun install --frozen-lockfile
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM base AS release
COPY --from=install /temp/prod/node_modules ./node_modules
COPY --from=prerelease /usr/src/app/package.json ./package.json
COPY --from=prerelease /usr/src/app/bun.lock ./bun.lock
COPY --from=prerelease /usr/src/app/apps/task-worker ./apps/task-worker
COPY --from=prerelease /usr/src/app/packages/common ./packages/common
COPY --from=prerelease /usr/src/app/packages/drizzle ./packages/drizzle
COPY --from=prerelease /usr/src/app/packages/infra ./packages/infra
COPY --from=prerelease /usr/src/app/packages/services ./packages/services
USER bun
ENTRYPOINT ["bun", "apps/task-worker/dist/index.js"]

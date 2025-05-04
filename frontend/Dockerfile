FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json .
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm run build

# ==== Runtime ====
FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=build /app/.next /app/.next

COPY package*.json .
RUN npm install -g pnpm && pnpm install --production

CMD ["pnpm", "run", "start"]

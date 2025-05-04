FROM node:22-alpine AS build

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json .
RUN pnpm install

COPY . .

RUN pnpm run build

# ==== Runtime ====
FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=build /app/dist /app/dist

COPY package*.json .
RUN npm install -g pnpm && pnpm install --production

CMD ["pnpm", "run", "start:prod"]

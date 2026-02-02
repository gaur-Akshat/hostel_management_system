FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
# .env is not copied (.dockerignore); set env at runtime (e.g. docker-compose)

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]

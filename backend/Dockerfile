FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts ./

# Prisma 7 loads prisma.config.ts during generate.
# A database connection is not required for client generation.
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/reachinbox"

RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]

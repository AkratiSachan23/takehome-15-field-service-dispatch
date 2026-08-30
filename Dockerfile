FROM node:20-alpine AS base

# Install dependencies required for better-sqlite3 build
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]

# =================================================
# CampusHat Frontend — Development Dockerfile
# =================================================

FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching
COPY package.json package-lock.json .npmrc ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---- Etapa 1: compilar Angular ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# URL pública del Gateway que queda dentro del build
ARG GATEWAY_URL
RUN if [ -n "$GATEWAY_URL" ]; then \
      sed -i -E "s|gatewayUrl: '[^']*'|gatewayUrl: '${GATEWAY_URL}'|" src/environments/environment.prod.ts; \
    fi
RUN npm run build -- --configuration production

# ---- Etapa 2: servir con nginx ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/app/browser /usr/share/nginx/html
EXPOSE 80
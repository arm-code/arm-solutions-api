# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — arm-solutions-api
# Stack: Node.js 22 (Alpine) + yt-dlp + ffmpeg
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Instala pnpm globalmente
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copia archivos de manifiesto primero para aprovechar la caché de Docker
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copia el resto del código fuente y compila
COPY . .
RUN pnpm run build


# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:22-alpine AS production

# ── Instalación de dependencias del sistema ───────────────────────────────────
# ffmpeg: conversión y post-procesamiento de audio.
# python3 + pip: requeridos por yt-dlp para su instalación.
# curl: descarga del binario de yt-dlp.
RUN apk add --no-cache \
      ffmpeg \
      python3 \
      py3-pip \
      curl \
      ca-certificates

# ── Instalación de yt-dlp ─────────────────────────────────────────────────────
# Se descarga el binario precompilado oficial desde GitHub Releases.
# Verificamos que el binario funciona correctamente antes de continuar.
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && yt-dlp --version

# ── Verificación de ffmpeg ────────────────────────────────────────────────────
RUN ffmpeg -version | head -n 1

# ── Configuración de la aplicación ───────────────────────────────────────────
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Solo dependencias de producción
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copia el código compilado desde la etapa de build
COPY --from=builder /app/dist ./dist

# Usuario no-root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Variables de entorno por defecto (sobreescribibles en docker-compose / k8s)
ENV NODE_ENV=production \
    PORT=3500 \
    YTDLP_BIN=yt-dlp \
    FFMPEG_BIN=ffmpeg \
    DOWNLOADER_MAX_DURATION_SEC=3600

EXPOSE 3500

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3500/ || exit 1

CMD ["node", "dist/src/main"]

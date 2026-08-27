# 🚀 Guía de Despliegue — arm-solutions-api

**Stack:** NestJS · TypeScript · Node.js 22 · pnpm · PostgreSQL (Supabase)  
**Módulos extra:** `DownloaderModule` requiere `yt-dlp` + `ffmpeg` en el entorno

---

## Tabla de Contenidos

- [Aclaración sobre el Dockerfile](#aclaración-sobre-el-dockerfile)
- [Variables de Entorno](#variables-de-entorno)
- [Entorno de Desarrollo — Windows](#entorno-de-desarrollo--windows)
- [Producción — Ubuntu / Debian (Recomendado)](#producción--ubuntu--debian-recomendado)
  - [Opción A: Despliegue Directo con PM2](#opción-a-despliegue-directo-con-pm2-recomendado)
  - [Opción B: Docker](#opción-b-docker)
- [Nginx como Reverse Proxy](#nginx-como-reverse-proxy)
- [Gestión de Versiones de yt-dlp](#gestión-de-versiones-de-yt-dlp)
- [Comandos de Referencia Rápida](#comandos-de-referencia-rápida)

---

## Aclaración sobre el Dockerfile

> **El `Dockerfile` incluido en el proyecto sirve para dos propósitos:**
> 1. Empaquetar la aplicación NestJS completa en una imagen lista para correr.
> 2. Incluir `yt-dlp` y `ffmpeg` dentro de la imagen, ya que el `DownloaderModule` los requiere como binarios del sistema.
>
> **Si despliegas de forma directa (sin Docker) en Ubuntu/Debian**, no usas el Dockerfile — pero sí debes instalar `yt-dlp` y `ffmpeg` manualmente en el servidor. Ambas opciones están documentadas abajo.

---

## Variables de Entorno

Copia `.env.template` como `.env` y rellena todos los valores **antes** de iniciar la aplicación.

```bash
cp .env.template .env
```

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto de escucha de la API | `3500` |
| `DB_HOST` | Host de PostgreSQL (Supabase) | `db.xxx.supabase.co` |
| `DB_PORT` | Puerto PostgreSQL | `5432` |
| `DB_USERNAME` | Usuario de la BD | `postgres` |
| `DB_PASSWORD` | Contraseña de la BD | `tu_password` |
| `DB_NAME` | Nombre de la BD | `postgres` |
| `ALLOWED_ORIGINS` | Orígenes CORS separados por coma | `https://arm-solutions.com.mx` |
| `SUPABASE_JWT_SECRET` | Secret JWT de Supabase (Project Settings → API) | `IUkV...` |
| `SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Anon Key de Supabase | `eyJh...` |
| `DOCS_USER` | Usuario para acceder a `/docs` | `admin` |
| `DOCS_PASSWORD` | Contraseña para `/docs` | `pass_seguro` |
| `YTDLP_BIN` | Ruta al binario `yt-dlp` | `yt-dlp` *(si está en PATH)* |
| `FFMPEG_BIN` | Ruta al binario `ffmpeg` | `ffmpeg` *(si está en PATH)* |
| `DOWNLOADER_MAX_DURATION_SEC` | Límite de duración de descarga (segundos) | `3600` |

---

## Entorno de Desarrollo — Windows

### 1. Prerrequisitos

- **Node.js 22 LTS** → [nodejs.org](https://nodejs.org)
- **pnpm** → `npm install -g pnpm`
- **yt-dlp** (necesario solo si vas a probar el `DownloaderModule`)
- **ffmpeg** (necesario solo si vas a probar el `DownloaderModule`)

### 2. Instalar yt-dlp en Windows

**Opción A — winget (recomendado):**
```powershell
winget install yt-dlp.yt-dlp
```

**Opción B — descarga manual:**
1. Descarga `yt-dlp.exe` desde [github.com/yt-dlp/yt-dlp/releases/latest](https://github.com/yt-dlp/yt-dlp/releases/latest)
2. Colócalo en una carpeta que esté en el `PATH`, por ejemplo `C:\tools\`
3. Agrega `C:\tools\` al PATH del sistema (Variables de Entorno → PATH)
4. Verifica: `yt-dlp --version`

### 3. Instalar ffmpeg en Windows

**Opción A — winget:**
```powershell
winget install Gyan.FFmpeg
```

**Opción B — Chocolatey:**
```powershell
choco install ffmpeg
```

**Opción B — manual:**
1. Descarga la build estable desde [ffmpeg.org/download.html](https://ffmpeg.org/download.html) (sección Windows builds by gyan.dev)
2. Extrae y copia `ffmpeg.exe`, `ffprobe.exe` a `C:\tools\`
3. Verifica: `ffmpeg -version`

> **Tip Windows:** Si los binarios no están en el PATH, puedes definir rutas absolutas en el `.env`:
> ```
> YTDLP_BIN=C:\tools\yt-dlp.exe
> FFMPEG_BIN=C:\tools\ffmpeg.exe
> ```

### 4. Levantar la aplicación

```powershell
# Instalar dependencias
pnpm install

# Configurar variables de entorno
copy .env.template .env
# (editar .env con tus valores reales)

# Modo desarrollo con hot-reload
pnpm run start:dev

# O compilar y ejecutar en modo producción local
pnpm run build
pnpm run start:prod
```

La API estará disponible en: `http://localhost:3500/api/v1`  
Documentación Scalar: `http://localhost:3500/docs`

---

## Producción — Ubuntu / Debian (Recomendado)

### Opción A: Despliegue Directo con PM2 (Recomendado)

Esta es la opción más directa: la app corre nativamente en el servidor con `pm2` como process manager y `nginx` como reverse proxy.

#### 1. Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Instalar Node.js 22 vía nvm

```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

# Instalar y usar Node.js 22 LTS
nvm install 22
nvm use 22
nvm alias default 22

# Verificar
node -v   # v22.x.x
npm -v
```

#### 3. Instalar pnpm

```bash
npm install -g pnpm
pnpm -v
```

#### 4. Instalar PM2

```bash
npm install -g pm2

# Configurar PM2 para arrancar con el sistema
pm2 startup
# (ejecutar el comando que PM2 te indique, empieza con "sudo env PATH=...")
```

#### 5. Instalar ffmpeg

```bash
sudo apt install -y ffmpeg
ffmpeg -version
```

#### 6. Instalar yt-dlp

> `yt-dlp` **no** está en los repositorios oficiales de apt. Se instala el binario precompilado directamente desde GitHub.

```bash
# Descargar el binario oficial
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp

# Dar permisos de ejecución
sudo chmod a+rx /usr/local/bin/yt-dlp

# Verificar
yt-dlp --version
```

#### 7. Clonar el repositorio y configurar

```bash
# Clonar
cd /var/www   # o la carpeta que prefieras
sudo git clone https://github.com/TU_ORG/arm-solutions-api.git
cd arm-solutions-api

# Ajustar propietario si es necesario
sudo chown -R $USER:$USER /var/www/arm-solutions-api

# Instalar dependencias de producción
pnpm install --frozen-lockfile

# Configurar variables de entorno
cp .env.template .env
nano .env   # completar todos los valores reales
```

#### 8. Compilar la aplicación

```bash
pnpm run build
# Resultado en: ./dist/
```

#### 9. Lanzar con PM2

```bash
# Iniciar la aplicación
pm2 start dist/src/main.js --name arm-solutions-api

# Guardar la lista de procesos para que sobreviva reinicios
pm2 save

# Ver estado
pm2 status
pm2 logs arm-solutions-api
```

#### 10. Actualizar la aplicación en producción

```bash
cd /var/www/arm-solutions-api

git pull origin main

pnpm install --frozen-lockfile
pnpm run build

pm2 restart arm-solutions-api
pm2 logs arm-solutions-api --lines 50
```

---

### Opción B: Docker

Usa esta opción si prefieres aislar completamente la aplicación. El Dockerfile incluye todo: Node.js, la app compilada, `yt-dlp` y `ffmpeg`.

#### 1. Instalar Docker en Ubuntu/Debian

```bash
# Dependencias
sudo apt install -y ca-certificates curl gnupg lsb-release

# Repositorio oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin

# Permitir correr Docker sin sudo (requiere nuevo login)
sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker --version
```

#### 2. Construir la imagen

```bash
cd /var/www/arm-solutions-api

docker build -t arm-solutions-api:latest .
```

> La primera build tarda varios minutos porque descarga `yt-dlp` y las dependencias de Node. Las builds posteriores son rápidas gracias al cache de capas.

#### 3. Correr el contenedor

```bash
docker run -d \
  --name arm-api \
  --restart unless-stopped \
  -p 3500:3500 \
  --env-file .env \
  arm-solutions-api:latest
```

#### 4. Verificar que está corriendo

```bash
docker ps
docker logs arm-api --tail 50 -f
```

#### 5. Actualizar con nueva versión

```bash
git pull origin main

# Reconstruir imagen
docker build -t arm-solutions-api:latest .

# Reemplazar el contenedor
docker stop arm-api
docker rm arm-api
docker run -d \
  --name arm-api \
  --restart unless-stopped \
  -p 3500:3500 \
  --env-file .env \
  arm-solutions-api:latest
```

---

## Nginx como Reverse Proxy

En ambas opciones (PM2 o Docker), se recomienda poner Nginx al frente para manejar HTTPS, timeouts extendidos para descargas largas y el dominio público.

### 1. Instalar Nginx y Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Configurar el virtual host

```bash
sudo nano /etc/nginx/sites-available/arm-solutions-api
```

Pega la siguiente configuración:

```nginx
server {
    listen 80;
    server_name api.arm-solutions.com.mx;

    # Redirige todo el tráfico HTTP a HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.arm-solutions.com.mx;

    # SSL — Certbot lo llenará automáticamente
    ssl_certificate     /etc/letsencrypt/live/api.arm-solutions.com.mx/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.arm-solutions.com.mx/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # ── CRÍTICO para el DownloaderModule ──
    # Las descargas de playlists largas pueden tardar minutos.
    # Sin estos timeouts, Nginx cerrará la conexión antes de que termine.
    proxy_read_timeout    3600s;
    proxy_send_timeout    3600s;
    proxy_connect_timeout 60s;

    # Aumentar buffer para archivos grandes (ZIP de playlists)
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_pass         http://127.0.0.1:3500;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Activar y verificar

```bash
# Activar el sitio
sudo ln -s /etc/nginx/sites-available/arm-solutions-api \
           /etc/nginx/sites-enabled/

# Verificar sintaxis
sudo nginx -t

# Aplicar cambios
sudo systemctl reload nginx
```

### 4. Obtener certificado SSL con Let's Encrypt

```bash
sudo certbot --nginx -d api.arm-solutions.com.mx

# Verificar auto-renovación
sudo certbot renew --dry-run
```

---

## Gestión de Versiones de yt-dlp

`yt-dlp` se actualiza frecuentemente (YouTube cambia su API regularmente). Si las descargas empiezan a fallar con errores `HTTP 403` o similares, actualiza el binario:

### En el servidor (Opción A — PM2)

```bash
sudo yt-dlp --update
# o forzar la última versión:
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
yt-dlp --version
```

### Con Docker (Opción B)

Reconstruye la imagen — el `Dockerfile` siempre descarga la versión `latest` de yt-dlp en el momento del build:

```bash
docker build --no-cache -t arm-solutions-api:latest .
```

---

## Comandos de Referencia Rápida

### PM2

```bash
pm2 status                           # Ver estado de todos los procesos
pm2 logs arm-solutions-api           # Ver logs en tiempo real
pm2 logs arm-solutions-api --lines 100  # Ver últimas 100 líneas
pm2 restart arm-solutions-api        # Reiniciar sin downtime
pm2 stop arm-solutions-api           # Detener
pm2 delete arm-solutions-api         # Eliminar proceso de PM2
```

### Docker

```bash
docker ps                            # Contenedores corriendo
docker logs arm-api -f               # Logs en tiempo real
docker exec -it arm-api sh           # Entrar al contenedor
docker stats arm-api                 # Uso de CPU/RAM
docker restart arm-api               # Reiniciar contenedor
```

### Verificar binarios dentro del contenedor

```bash
docker exec arm-api yt-dlp --version
docker exec arm-api ffmpeg -version
```

### Health check manual

```bash
# Verifica que la API responde (endpoint raíz, no requiere auth)
curl -i http://localhost:3500/

# Con dominio público
curl -i https://api.arm-solutions.com.mx/
```

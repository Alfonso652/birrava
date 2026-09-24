# 🍺 Birrava — el Strava de las cervezas

PWA para registrar cervezas (check-ins), descubrir bares, picarse en rankings de **variedad** y completar retos mensuales con tu cuadrilla. Se instala desde el navegador ("Añadir a pantalla de inicio"): nadie pasa por tiendas de apps.

**Coste: 0 €.** Frontend en GitHub Pages; login, base de datos y fotos en Supabase (plan Free).

| Pieza | Servicio gratis | Límite relevante |
|---|---|---|
| Hosting web | GitHub Pages | 1 GB, 100 GB/mes de tráfico |
| BD + login + API | Supabase Free | 500 MB BD, 50k usuarios/mes |
| Fotos | Supabase Storage | 1 GB (se comprimen a ~150 KB) |
| Emails de login | Brevo SMTP (u otro) | 300 emails/día |

## Funcionalidades

- Login sin contraseña con código de 6 dígitos por email
- Check-in: cerveza, cervecera, estilo, % alc., estrellas, nota, bar y foto
- Feed con "Chin-chin" (los kudos de Strava)
- Bares con búsqueda y orden por cercanía (GPS), y **Rey del bar** por bar
- Ranking mensual e histórico por cervezas distintas, estilos y bares
- Retos del mes e insignias por estilos probados
- Funciona sin conexión para consultar lo ya cargado; se actualiza sola

## Puesta en marcha (≈20 min, una sola vez)

### 1. Supabase
1. Crea una cuenta en <https://supabase.com> → **New project** (región `eu-west`, apunta la contraseña de la BD).
2. **SQL Editor** → pega todo `supabase/schema.sql` → **Run**.
3. **Authentication → Emails → Templates → Magic Link**: sustituye el cuerpo por algo que incluya el código:
   ```html
   <h2>Tu código de Birrava</h2>
   <p>Introduce este código en la app: <b style="font-size:24px">{{ .Token }}</b></p>
   ```
4. **Authentication → Emails → SMTP Settings**: activa un **SMTP propio**. El SMTP por defecto de Supabase solo envía a los miembros de tu equipo en Supabase, así que tus amigos no recibirían el código. Opción gratis: [Brevo](https://www.brevo.com) → *SMTP & API* → host `smtp-relay.brevo.com`, puerto `587`, usuario y clave SMTP que te da, remitente = un email tuyo verificado en Brevo.
5. **Project Settings → API**: copia `Project URL` y la `anon public` key.

### 2. Probar en local
```bash
cp .env.example .env   # y pega URL + anon key
npm install
npm run dev            # http://localhost:5173
```

### 3. Publicar en GitHub Pages
1. Crea un repo **público** vacío en GitHub llamado `birrava` (Pages gratis exige repo público en cuentas Free).
2. Sube el código:
   ```bash
   git add . && git commit -m "Birrava v0.1"
   git remote add origin https://github.com/<tu-usuario>/birrava.git
   git push -u origin main
   ```
3. En el repo: **Settings → Secrets and variables → Actions → Variables** → crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. **Settings → Pages → Source: GitHub Actions**.
5. **Actions → Deploy a GitHub Pages → Run workflow** (o cualquier push a `main`).
6. La app queda en `https://<tu-usuario>.github.io/birrava/`. Pasa el enlace a tu cuadrilla.

### Instalarla en el móvil
- **Android (Chrome)**: menú ⋮ → *Instalar aplicación*.
- **iPhone (Safari)**: botón compartir → *Añadir a pantalla de inicio*.

## Cosas a saber

- **Supabase Free pausa el proyecto tras 7 días sin actividad.** Se reactiva a mano desde el panel, sin perder datos. Con uso semanal no pasa.
- La `anon key` es pública por diseño; lo que protege los datos son las políticas **RLS** de `schema.sql` (cada usuario solo crea y borra lo suyo, y solo los usuarios logueados leen).
- Todos los usuarios registrados ven el feed de todos: pensado para un grupo cerrado de amigos. Si se abre al público, habría que añadir seguidores o cuadrillas.

## Alternativas de hosting (todas gratis)

`dist/` es estático: también vale **Cloudflare Pages** o **Netlify** (build `npm run build`, carpeta `dist`, mismas dos variables de entorno, sin `BASE_PATH`).

## Estructura

```
src/
  App.tsx            shell, sesión y rutas (hash)
  views/             Feed, NuevoCheckin, Bares, BarDetalle, Ranking, Perfil, Login, Onboarding
  components/        CheckinCard, Estrellas, SelectorBar
  lib/               retos, estilos, geo, compresión de imagen, fechas
supabase/schema.sql  tablas, RLS, rankings (RPC) y bucket de fotos
```

# Birrava — contexto para el agente

PWA "Strava de cervezas": React 19 + Vite 8 + vite-plugin-pwa, backend Supabase (auth OTP por email, Postgres con RLS, Storage `fotos`), hosting GitHub Pages vía `.github/workflows/deploy.yml`. Guía humana completa en `README.md`.

## Estado

- Código completo; `npm run build` compila limpio.
- **Nunca probado contra un Supabase real.** Primer objetivo: desplegar y verificar de punta a punta.
- Repo git sin commits todavía (o recién inicializado tras copiar el proyecto).

## Pendiente de despliegue (hacerlo el agente; el usuario ya hizo los logins de gh y supabase antes de arrancar)

1. Comprobar herramientas: `node -v`, `git --version`, `gh --version`. Si falta alguna: `winget install OpenJS.NodeJS.LTS` / `Git.Git` / `GitHub.cli` y abrir terminal nueva.
2. Login: el usuario lo hace en su terminal antes de arrancar (`gh auth login`, `npx supabase login`). Comprobar con `gh auth status` y `npx supabase projects list`; si fallan, pedírselo, no intentarlo en modo interactivo.
3. Supabase: crear proyecto (`npx supabase projects create birrava --region eu-west-3 --db-password <generada> --org-id <id>`), sacar URL + anon key (`npx supabase projects api-keys`), ejecutar `supabase/schema.sql` (Management API `POST /v1/projects/{ref}/database/query` o SQL editor).
4. Plantilla email Magic Link con `{{ .Token }}` (Management API `PATCH /v1/projects/{ref}/config/auth`, campos `mailer_templates_magic_link_content` y `mailer_subjects_magic_link`). Sin eso el login por código no funciona.
5. `.env` local con URL + anon key; `npm run dev` y probar login con el email del usuario (el SMTP por defecto de Supabase solo envía a miembros del equipo Supabase: vale para el dueño).
6. GitHub: repo **público** `birrava`, commit + push a `main`, variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (`gh variable set`), Pages con source "GitHub Actions" (`gh api -X POST repos/{owner}/birrava/pages -f build_type=workflow`), lanzar workflow y verificar la URL `https://<user>.github.io/birrava/`.
7. Más adelante, para que entren amigos: SMTP propio (Brevo gratis) en Supabase Auth.

## Reglas

- Commits sin líneas de atribución de herramientas de IA.
- No subir `.env` (ya está en `.gitignore`). La anon key no es secreta; la contraseña de BD sí: no commitearla.
- Rankings y retos premian variedad, no volumen: mantener ese criterio en features nuevas.

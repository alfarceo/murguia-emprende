# 🚀 Guía de despliegue — Murguía Emprende

## Lo que necesitas (todo gratis excepto el dominio)

| Cosa | Dónde | Costo |
|---|---|---|
| Dominio | namecheap.com o google.com/domains | ~$15 USD/año |
| Servidor | vercel.com | Gratis |
| Base de datos | supabase.com | Gratis |
| IA (Don Juan) | console.anthropic.com | ~$20-50 USD/mes |

---

## PASO 1 — Supabase (base de datos)

1. Entra a **supabase.com** → "Start your project" → crea cuenta con Google
2. Click en **"New project"**
   - Nombre: `murguia-emprende`
   - Contraseña: elige una segura (guárdala)
   - Región: `us-east-1` (o la más cercana)
3. Espera ~2 minutos a que se cree
4. Ve a **SQL Editor** (menú izquierdo)
5. Copia y pega TODO el contenido de `supabase_schema.sql` y dale **Run**
6. Ve a **Settings → API** y copia:
   - `Project URL` → esto es tu `SUPABASE_URL`
   - `service_role` key → esto es tu `SUPABASE_SERVICE_KEY`

---

## PASO 2 — GitHub (para conectar con Vercel)

1. Crea cuenta en **github.com** si no tienes
2. Click en **"New repository"**
   - Nombre: `murguia-emprende`
   - Privado: ✅ Sí
3. Sube todos los archivos de esta carpeta al repositorio

Si no sabes usar Git, lo más fácil:
- Descarga **GitHub Desktop** (desktop.github.com)
- Arrastra la carpeta `murguia-emprende` y dale "Publish"

---

## PASO 3 — Vercel (servidor)

1. Entra a **vercel.com** → "Start Deploying" → crea cuenta con GitHub
2. Click en **"Add New Project"**
3. Selecciona el repositorio `murguia-emprende`
4. En **"Environment Variables"** agrega:

```
ANTHROPIC_API_KEY = sk-ant-api03-...tu-key...
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY = eyJ...tu-key...
PASS_SALT = murguia-emprende-2025-familia-confianza
```

5. Click en **"Deploy"** — espera ~1 minuto
6. Vercel te da una URL tipo `murguia-emprende.vercel.app` — ya funciona

---

## PASO 4 — Dominio propio (opcional pero recomendado)

1. Compra el dominio en **namecheap.com** (ej. `murguiaemprende.com`)
2. En Vercel → tu proyecto → **"Settings → Domains"**
3. Escribe tu dominio y sigue las instrucciones para apuntar los DNS
4. En ~10 minutos ya funciona en tu dominio propio

---

## PASO 5 — Primer uso

1. Entra a tu URL
2. Click en "Crear cuenta"
3. Regístrate con `alfarceo@gmail.com` — automáticamente eres admin
4. ¡Listo!

---

## ¿Algo salió mal?

Mándale un mensaje a Claude con el error exacto y lo resolvemos.

# Guía de Instalación — Full Party Uruapan PWA

Esta guía está pensada para que puedas poner en marcha tu catálogo digital aunque no tengas experiencia en programación. Sigue los pasos en orden y tendrás tu tienda funcionando en menos de una hora.

---

## Lo que necesitas antes de empezar

Crea una cuenta gratuita en cada uno de estos servicios. No necesitas tarjeta de crédito.

| Servicio | Para qué sirve | Link |
|---|---|---|
| **Node.js** | Ejecutar el proyecto en tu computadora | https://nodejs.org (descarga la versión LTS) |
| **Supabase** | Base de datos y usuarios | https://supabase.com |
| **Vercel** | Publicar tu tienda en internet | https://vercel.com |
| **GitHub** | Guardar y versionar el código | https://github.com |

---

## Paso 1 — Sube el código a GitHub

1. Entra a [github.com](https://github.com) y haz clic en **New repository**.
2. Ponle el nombre que quieras (ej. `mi-catalogo`), deja el repositorio en **Public** y haz clic en **Create repository**.
3. Descarga el código de la PWA como ZIP, descomprímelo y sube todos los archivos a ese repositorio usando el botón **Upload files** en GitHub.

> Si ya sabes usar Git, simplemente haz `git push` de la carpeta del proyecto.

---

## Paso 2 — Crea tu base de datos en Supabase

### 2.1 Crear el proyecto

1. Entra a [supabase.com](https://supabase.com) y haz clic en **New Project**.
2. Ponle el nombre que quieras, elige una contraseña segura para la base de datos y selecciona la región más cercana a ti (ej. `South America (São Paulo)`).
3. Espera un minuto mientras se crea el proyecto.

### 2.2 Crear las tablas

1. En el menú de la izquierda entra a **SQL Editor**.
2. Haz clic en **New query**.
3. Abre el archivo `supabase_setup.sql` que viene con la PWA, copia todo su contenido y pégalo en el editor.
4. Haz clic en **Run** (el botón verde).
5. Repite lo mismo con el archivo `supabase_rate_limit.sql`.

### 2.3 Activar actualizaciones en tiempo real

1. En el menú entra a **Database → Replication**.
2. Activa las tablas `pedidos` y `productos` en la sección **Source**.

### 2.4 Crear tu usuario administrador

1. Ve a **Authentication → Users → Add user**.
2. Ingresa el email y contraseña con los que quieres entrar al panel de administración.
3. Anota ese email — lo usarás en el siguiente paso.

### 2.5 Copiar tus credenciales

1. Ve a **Project Settings → API**.
2. Copia los valores de:
   - **Project URL** (algo como `https://xxxxxxxx.supabase.co`)
   - **anon public key** (empieza con `eyJ...`)

Guárdalos, los necesitas en el siguiente paso.

---

## Paso 3 — Configura las variables de tu tienda

1. En la carpeta del proyecto busca el archivo `.env.example`.
2. Crea una copia con el nombre `.env` (sin el `.example`).
3. Abre ese archivo con cualquier editor de texto (Bloc de notas, Notepad++, VS Code) y rellena cada línea:

```
VITE_SUPABASE_URL=           ← pega aquí el Project URL de Supabase
VITE_SUPABASE_ANON_KEY=      ← pega aquí el anon public key
VITE_WHATSAPP_NUMBER=        ← tu número con lada, sin espacios (ej: 5214521000000)
VITE_NOMBRE_NEGOCIO=         ← nombre de tu tienda
VITE_DIRECCION_TIENDA=       ← dirección física
VITE_HORARIO_TIENDA=         ← horario de atención (ej: Lun–Sáb 9am–7pm)
VITE_MAPS_URL_TIENDA=        ← link de Google Maps a tu local
VITE_SITE_URL=               ← URL donde quedará tu tienda (la sabrás en el Paso 5)
VITE_ADMIN_EMAILS=           ← email del administrador (el que creaste en Supabase)
VITE_MONEDA=                 ← código de moneda (MXN, USD, EUR, etc.)
```

---

## Paso 4 — Prueba en tu computadora (opcional)

Si quieres ver cómo se ve antes de publicarla:

1. Abre una terminal (en Windows: busca "Símbolo del sistema" o "PowerShell").
2. Navega a la carpeta del proyecto con `cd ruta/del/proyecto`.
3. Ejecuta estos dos comandos, uno por uno:

```bash
npm install
npm run dev
```

4. Abre tu navegador en `http://localhost:3000` — ahí verás tu catálogo.

---

## Paso 5 — Publica tu tienda en Vercel

1. Entra a [vercel.com](https://vercel.com) y haz clic en **Add New Project**.
2. Conecta tu cuenta de GitHub y selecciona el repositorio que creaste en el Paso 1.
3. Vercel detecta automáticamente que es un proyecto Vite — no cambies nada en la configuración de build.
4. Antes de hacer clic en **Deploy**, agrega las variables de entorno:
   - Haz clic en **Environment Variables**.
   - Agrega cada una de las líneas de tu archivo `.env` (clave y valor).
5. Haz clic en **Deploy**.

En 1–2 minutos Vercel te dará una URL como `https://mi-catalogo.vercel.app`. Esa es tu tienda en línea.

> Copia esa URL y úsala en `VITE_SITE_URL`. Vuelve a Vercel → Settings → Environment Variables para actualizarla y haz un nuevo deploy.

---

## Paso 6 — Agrégate como administrador en la base de datos

Este es el único paso técnico que queda. Solo se hace una vez.

1. En Supabase ve a **Authentication → Users** y haz clic en el usuario que creaste.
2. Copia el **User UID** (es un código largo, ej. `a1b2c3d4-...`).
3. Ve a **SQL Editor → New query** y ejecuta esto, reemplazando el UUID con el tuyo:

```sql
INSERT INTO public.admins (id) VALUES ('pega-aqui-tu-uuid');
```

A partir de aquí puedes entrar al panel de administración en `https://tu-dominio.vercel.app/#/admin`.

---

## Listo — accesos rápidos

| Qué | Dónde |
|---|---|
| Tu tienda | `https://tu-dominio.vercel.app` |
| Panel de pedidos | `https://tu-dominio.vercel.app/#/admin` |
| Gestión de catálogo | `https://tu-dominio.vercel.app/#/admin/catalogo` |

---

## Personalizar categorías y productos

Todo se gestiona desde el panel de administración — no necesitas tocar código.

- **Productos**: agrégalos desde `/#/admin/catalogo` con nombre, precio, imagen, stock y precios por mayoreo.
- **Categorías, marcas y tamaños**: se crean al registrar el primer producto que los use. Desde el panel puedes renombrarlos o eliminarlos en cualquier momento.

---

## Soporte

Si algo no funciona, revisa primero:

- Que el archivo `.env` no tenga espacios extra ni comillas en los valores.
- Que el SQL se haya ejecutado sin errores en Supabase (el editor muestra "Success" en verde).
- Que las variables de entorno en Vercel coincidan exactamente con las de tu `.env`.

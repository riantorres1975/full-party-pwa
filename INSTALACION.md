# 🛒 Guía de Instalación — Catálogo Digital PWA

Bienvenido. Esta guía te lleva de la mano para que tengas tu tienda en línea funcionando aunque **nunca hayas programado nada**. Solo sigue los pasos en orden, como una receta de cocina.

**¿Cuánto tarda?** Aproximadamente **45 minutos** la primera vez.

---

## ¿Qué vas a tener al final?

- Una tienda en línea con tu catálogo de productos 🛍️
- Tus clientes te mandan pedidos por WhatsApp 📱
- Un panel para gestionar pedidos e inventario 📋
- La tienda funciona aunque no haya internet (PWA) 📶

---

## Lo que necesitas antes de empezar

Crea una cuenta **gratuita** en estos tres servicios. No necesitas tarjeta de crédito.

| Servicio | Para qué sirve | Cómo entrar |
|---|---|---|
| **GitHub** | Guardar el código de tu tienda | [github.com](https://github.com) → Sign up |
| **Supabase** | La base de datos (donde se guardan productos y pedidos) | [supabase.com](https://supabase.com) → Start your project |
| **Vercel** | Poner tu tienda en internet con un link | [vercel.com](https://vercel.com) → Sign Up |

También necesitas instalar en tu computadora:

- **Node.js** — descárgalo de [nodejs.org](https://nodejs.org), elige la versión que dice **LTS** y sigue el instalador como cualquier programa.

---

## PASO 1 — Sube el código a GitHub

Piensa en GitHub como una USB en la nube donde guardarás el código de tu tienda.

1. Entra a [github.com](https://github.com) con tu cuenta.
2. Haz clic en el botón verde **New** (o el ícono **+** arriba a la derecha → **New repository**).
3. En **Repository name** escribe `mi-catalogo` (o el nombre que quieras).
4. Deja todo lo demás como está y haz clic en **Create repository**.
5. En la siguiente pantalla verás un botón que dice **uploading an existing file** — haz clic ahí.
6. Arrastra **todos los archivos y carpetas** del ZIP que descargaste a esa página y haz clic en **Commit changes**.

✅ **¡Listo! Tu código ya está en la nube.**

---

## PASO 2 — Crea tu base de datos en Supabase

Supabase es donde se van a guardar tus productos, pedidos y clientes.

### 2.1 Crear el proyecto

1. Entra a [supabase.com](https://supabase.com) y haz clic en **New Project**.
2. Ponle el nombre que quieras a tu proyecto (ej. `mi-tienda`).
3. Inventa una contraseña segura para la base de datos y guárdala en algún lugar.
4. En **Region** elige la más cercana a ti (para México: **South America - São Paulo**).
5. Haz clic en **Create new project** y espera 1-2 minutos mientras se prepara.

### 2.2 Crear las tablas (la estructura de tu tienda)

Esto es como armar los estantes donde se acomodarán tus productos y pedidos.

1. En el menú de la izquierda haz clic en **SQL Editor**.
2. Haz clic en **New query** (botón con un símbolo `+`).
3. Abre el archivo **`supabase_setup.sql`** que viene en el ZIP con cualquier editor de texto (Bloc de Notas funciona).
4. Selecciona **todo el texto** (Ctrl+A) y cópialo (Ctrl+C).
5. Pégalo (Ctrl+V) en el editor de Supabase.
6. Haz clic en el botón verde **Run**.
7. Abajo deberás ver un mensaje en verde que dice **"Success"**. Si ves algo en rojo, escríbeme.

8. Repite los pasos 2 al 6 pero ahora con el archivo **`supabase_rate_limit.sql`**.

### 2.3 Crear tu cuenta de administrador

1. En el menú de la izquierda entra a **Authentication** → **Users**.
2. Haz clic en **Add user** → **Create new user**.
3. Escribe el **email** y **contraseña** con los que vas a entrar al panel de tu tienda.
4. Haz clic en **Create user**.

> ⚠️ Recuerda muy bien ese email y contraseña — los vas a usar para entrar al panel de administración.

### 2.4 Copiar tus credenciales de Supabase

1. En el menú de la izquierda ve a **Project Settings** → **API**.
2. Copia y guarda en un bloc de notas estos dos valores:
   - **Project URL** — parece `https://abcdefgh.supabase.co`
   - **anon public** (bajo "Project API keys") — es un texto largo que empieza con `eyJ...`

---

## PASO 3 — Configura los datos de tu tienda

Aquí le dices a la app cuál es tu negocio, tu WhatsApp, etc.

1. En la carpeta del proyecto busca el archivo llamado **`.env.example`**.

   > 💡 En Windows, los archivos que empiezan con punto a veces están ocultos. Si no lo ves, abre el Explorador de archivos, haz clic en **Vista** y activa **Elementos ocultos**.

2. Haz una **copia** de ese archivo en la misma carpeta y cámbiale el nombre a **`.env`** (borra el `.example`).

3. Abre el archivo `.env` con el Bloc de Notas y rellena cada línea:

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
         ↑ pega aquí el Project URL que copiaste en el paso 2.4

VITE_SUPABASE_ANON_KEY=eyJ...
         ↑ pega aquí el anon public key

VITE_WHATSAPP_NUMBER=5214521234567
         ↑ tu número de WhatsApp con lada del país (México = 52, luego 10 dígitos)
           Ejemplo: si tu número es 452-123-4567 escribe: 5214521234567

VITE_NOMBRE_NEGOCIO=Mi Tienda
         ↑ el nombre de tu negocio tal como quieres que aparezca

VITE_DIRECCION_TIENDA=Calle Ejemplo 123, Col. Centro
         ↑ tu dirección física

VITE_HORARIO_TIENDA=Lun–Sáb 9am–7pm
         ↑ tu horario de atención

VITE_MAPS_URL_TIENDA=https://maps.google.com/...
         ↑ el link de Google Maps a tu local (opcional, puedes dejarlo vacío)

VITE_SITE_URL=https://mi-catalogo.vercel.app
         ↑ la URL de tu tienda (la obtendrás en el Paso 5, por ahora déjala así)

VITE_ADMIN_EMAILS=admin@mitienda.com
         ↑ el email que usaste para crear el usuario en Supabase

VITE_MONEDA=MXN
         ↑ código de tu moneda (MXN para pesos mexicanos, USD para dólares)
```

4. Guarda el archivo (Ctrl+S).

> ⚠️ **Importante:** No dejes espacios antes ni después del signo `=`. Mal: `VITE_MONEDA = MXN`. Bien: `VITE_MONEDA=MXN`

---

## PASO 4 — Prueba la tienda en tu computadora

Este paso es para verificar que todo funciona antes de publicarlo. Es opcional pero recomendado.

1. Abre una terminal:
   - **Windows:** Presiona `Windows + R`, escribe `cmd` y presiona Enter.
   - **Mac:** Busca "Terminal" en Spotlight (Cmd + Espacio).

2. Escribe este comando para ir a la carpeta de tu proyecto (reemplaza la ruta por donde está tu carpeta):
   ```
   cd C:\Users\TuNombre\Desktop\mi-catalogo
   ```

3. Instala las dependencias (solo la primera vez):
   ```
   npm install
   ```
   Esto descarga todo lo necesario. Puede tardar 1-2 minutos.

4. Inicia la tienda:
   ```
   npm run dev
   ```

5. Abre tu navegador y ve a **http://localhost:3000** — deberías ver tu tienda. 🎉

Para detener el servidor presiona `Ctrl + C` en la terminal.

---

## PASO 5 — Publica tu tienda en internet (Vercel)

Vercel toma tu código de GitHub y lo convierte en un sitio web accesible para todos.

1. Entra a [vercel.com](https://vercel.com) con tu cuenta.
2. Haz clic en **Add New…** → **Project**.
3. En la lista que aparece busca el repositorio `mi-catalogo` que creaste en el Paso 1 y haz clic en **Import**.
4. Vercel detecta automáticamente que es un proyecto Vite — **no cambies nada** en la sección de configuración de build.
5. Antes de hacer clic en Deploy, agrega tus variables de entorno:
   - Haz clic en **Environment Variables**.
   - Agrega cada línea de tu archivo `.env`: escribe el nombre (ej. `VITE_SUPABASE_URL`) en el campo **Name** y el valor en **Value**.
   - Haz clic en **Add** después de cada una.
6. Cuando hayas agregado todas, haz clic en **Deploy**.
7. Espera 1-2 minutos. Vercel te dará una URL como: `https://mi-catalogo.vercel.app`

**¡Esa URL es tu tienda en línea!** Compártela con tus clientes.

> 📝 Ahora vuelve al archivo `.env` (y también a las variables en Vercel) y actualiza `VITE_SITE_URL` con esa URL real. En Vercel: **Settings → Environment Variables → edita VITE_SITE_URL** y luego ve a **Deployments → redeploy** para que el cambio tome efecto.

---

## PASO 6 — Activa tu cuenta como administrador

Este es el único paso "técnico" — solo se hace una vez.

1. En Supabase ve a **Authentication** → **Users**.
2. Haz clic en el usuario que creaste en el Paso 2.3.
3. Copia el **User UID** — es un código largo que parece: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
4. Ve a **SQL Editor** → **New query** y pega esto, **reemplazando** el UUID del ejemplo por el tuyo:

```sql
INSERT INTO public.admins (user_id) VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
```

5. Haz clic en **Run**.

A partir de aquí ya puedes entrar al panel de administración.

---

## PASO 7 — Entra al panel de administración

1. Abre tu tienda en el navegador: `https://mi-catalogo.vercel.app`
2. Haz clic en el ícono de candado 🔒 en la esquina superior derecha.
3. Ingresa el email y contraseña que creaste en el Paso 2.3.
4. ¡Ya estás dentro! Desde aquí puedes:

| Sección | Para qué |
|---|---|
| **Pedidos** | Ver todos los pedidos, cambiarles el estado, notificar clientes |
| **Catálogo** | Agregar, editar y eliminar productos |

---

## PASO 8 — Agrega tus primeros productos

1. En el panel de admin haz clic en **Catálogo**.
2. Haz clic en **Nuevo producto** (botón azul).
3. Llena el formulario: nombre, precio, descripción, categoría, imagen.
4. Haz clic en **Guardar**.

El producto aparecerá al instante en tu tienda pública. ¡No necesitas hacer nada más!

> 💡 **Truco:** puedes importar varios productos a la vez usando el botón **Importar** y un archivo CSV o JSON. El archivo `productos_ejemplo.json` que viene en el ZIP te sirve como referencia del formato.

---

## Accesos rápidos

Una vez que todo esté listo, estos son los links que más vas a usar:

| Qué | Link |
|---|---|
| Tu tienda (clientes) | `https://mi-catalogo.vercel.app` |
| Panel de administración | `https://mi-catalogo.vercel.app/#/admin` |

---

## ¿Algo no funciona? — Lista de verificación

Antes de pedir ayuda, revisa esto:

- [ ] El archivo `.env` no tiene espacios antes/después del `=`
- [ ] El SQL se ejecutó sin errores en Supabase (dice "Success" en verde)
- [ ] Las variables de entorno en Vercel coinciden exactamente con tu `.env`
- [ ] El UUID que insertaste en la tabla `admins` es el correcto (cópialo otra vez para verificar)
- [ ] Después de cambiar variables en Vercel, hiciste un nuevo **Redeploy**

### Errores comunes

| Error que ves | Qué significa | Solución |
|---|---|---|
| Pantalla en blanco | Las variables de entorno están mal | Verifica que todas existan en Vercel y haz Redeploy |
| "Invalid API key" | El `ANON_KEY` está incorrecto | Cópialo de nuevo desde Supabase → Settings → API |
| No puedo entrar al admin | Tu usuario no está en la tabla `admins` | Repite el Paso 6 con el UUID correcto |
| WhatsApp no abre | El número está mal escrito | Asegúrate de incluir el código de país (52 para México) |

---

## Personalización adicional

### Cambiar los colores
Los colores de la tienda se definen en el archivo `tailwind.config.js`. Si sabes algo de programación puedes editarlo. Si no, es mejor dejarlos como están.

### Cambiar el logo / ícono de la app

Necesitas dos versiones de tu logo en formato PNG: una de 192×192 píxeles y otra de 512×512. Si solo tienes tu logo en cualquier tamaño, usa este sitio gratuito para generarlos automáticamente:

**👉 [realfavicongenerator.net](https://realfavicongenerator.net/)**

1. Entra a esa página y haz clic en **Select your Favicon image** — sube tu logo.
2. La página te muestra una vista previa de cómo se verá en Android, iOS, Windows, etc. Puedes ajustar el color de fondo si tu logo tiene transparencia.
3. Baja hasta el final y haz clic en **Generate your Favicons and HTML code**.
4. Descarga el ZIP con el botón **Favicon package**.
5. Del ZIP que descargaste, toma los archivos y renómbralos así:
   - `android-chrome-192x192.png` → `icon-192.png`
   - `android-chrome-512x512.png` → `icon-512.png`
4. Reemplaza los archivos en la carpeta `public/` de tu proyecto con los nuevos.
5. Sube los cambios a GitHub — Vercel se actualiza solo.

> 💡 Si quieres que el ícono se vea bien en todos los dispositivos, usa una imagen cuadrada con fondo de color sólido (no transparente). Los logos con fondo blanco o de color se ven mejor que los de fondo transparente en pantallas de inicio de Android e iOS.

### Cambiar el nombre en la pestaña del navegador
Edita el archivo `index.html` y cambia el texto entre las etiquetas `<title>` y `</title>`.

---

*¿Dudas o problemas en la instalación? Contacta al desarrollador que te vendió esta plantilla.*

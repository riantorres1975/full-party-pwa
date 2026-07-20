# Pruebas del panel

## Pruebas unitarias

```bash
npm test
```

## Pruebas E2E

Instala Chromium una sola vez:

```bash
npx playwright install chromium
```

Ejecuta las pruebas publicas en escritorio y movil:

```bash
npm run test:e2e:public
```

Para incluir las regresiones autenticadas del panel, define credenciales de una
cuenta exclusiva de pruebas con el menor privilegio necesario:

```powershell
$env:E2E_ADMIN_EMAIL='admin-e2e@tutienda.com'
$env:E2E_ADMIN_PASSWORD='contrasena-local'
npm run test:e2e
```

Usa `E2E_BASE_URL` para probar un despliegue existente en lugar del servidor
local. Playwright guarda capturas, video y trazas solamente cuando una prueba
falla; esos artefactos estan excluidos de Git.

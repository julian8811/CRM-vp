# Verificación de producción — CRM-VP

**Fecha:** 2026-06-18  
**URL:** https://crm-vp.vercel.app/  
**Supabase:** `tgosnmvlvzaykiuolrot`

## Resumen ejecutivo

| Área | Resultado |
|------|-----------|
| Frontend Vercel | ✅ OK |
| Auth email/password | ✅ OK |
| Google OAuth | ✅ OK (redirect a Google confirmado) |
| CRUD clientes / leads | ✅ OK (tras fix RLS) |
| Pipeline (opportunities) | ✅ OK (tras restaurar políticas RLS) |
| Cotizaciones | ✅ OK |
| Notificación nuevo lead | ✅ OK (in-app) |
| Cron automatizaciones | ✅ OK (`pg_cron` activo) |
| Edge Functions desplegadas | ✅ OK |
| Chat IA | ❌ OpenAI quota exceeded |
| Emails (Resend) | ⏸️ No configurado |
| Meta / WhatsApp | ⏸️ No configurado |
| Avatares (Storage) | ⚠️ Bucket en DB pero API Storage devuelve 404 |
| Pedidos (orders) | ⚠️ RLS restaurado; validar status en UI |

## Incidente crítico corregido en esta verificación

### RLS roto en `profiles` (recursión infinita)

**Síntoma:** consultas a `customers`, `leads`, `products` y `profiles` devolvían `500 infinite recursion detected in policy for relation "profiles"`.

**Causa:** políticas que consultaban `profiles` dentro de políticas de `profiles`, y faltaban políticas base (`Users can read own profile`, etc.).

**Fix aplicado:** migración `20260618140000_fix_profiles_rls_recursion.sql` con funciones `SECURITY DEFINER` (`is_admin()`, `is_admin_or_manager()`).

### Políticas RLS ausentes (pipeline, pedidos, cotizaciones)

**Síntoma:** `opportunities`, `orders`, `quotations` y `activity_log` tenían RLS habilitado pero **0 políticas** → inserts bloqueados.

**Fix aplicado:** migración `20260618150000_restore_missing_rls_policies.sql`.

---

## Checklist detallado

### Infraestructura

| Prueba | Estado | Evidencia |
|--------|--------|-----------|
| Sitio carga en Vercel | ✅ | Login page con email, password y «Continuar con Google» |
| Bundle incluye Supabase + Google | ✅ | `index-CX7FT_gV.js` contiene `tgosnmvlvzaykiuolrot`, `signInWithOAuth` |
| `npm run lint` | ✅ | 0 errores (3 warnings hooks) |
| `npm run test:run` | ✅ | 82/82 tests |
| `npm run build` | ✅ | Build exitoso |
| Migraciones en producción | ✅ | 10 migraciones (incl. fixes RLS) |
| pg_cron `crm-vp-run-automations` | ✅ | Activo, cada 15 min |

### Autenticación

| Prueba | Estado | Evidencia |
|--------|--------|-----------|
| Registro email/password | ✅ | Signup 200, perfil auto-creado |
| Login inválido | ✅ | 400 `invalid_credentials` (no 500) |
| Google provider habilitado | ✅ | `external.google: true` en `/auth/v1/settings` |
| Redirect Google OAuth | ✅ | `/auth/v1/authorize?provider=google` → `accounts.google.com` |

### Datos y CRUD (API autenticada)

| Prueba | Estado | Evidencia |
|--------|--------|-----------|
| Leer perfil propio | ✅ | 200 tras fix RLS |
| Crear cliente | ✅ | 201 |
| Crear lead | ✅ | 201 |
| Notificación al crear lead | ✅ | Notificación `type: lead` in-app |
| Crear oportunidad (pipeline) | ✅ | 201 con `stage: lead` |
| Actualizar etapa pipeline | ✅ | PATCH `lead` → `proposal` = 200 |
| Crear cotización | ✅ | 201 con `number` |
| Listar productos | ✅ | 200 |
| Crear pedido | ⚠️ | Requiere `status` válido según constraint DB |

### Edge Functions

| Función | Sin auth | Con auth | Notas |
|---------|----------|----------|-------|
| `crm-ai` | 401 | 502 | OpenAI: quota exceeded |
| `invite-user` | 401 | — | Requiere admin (no probado) |
| `run-automations` | 403 | — | Correcto sin `x-cron-secret` |
| `meta-webhook` | 200 | — | Responde `ok` |

### Pendiente de credenciales

| Integración | Estado |
|-------------|--------|
| `RESEND_API_KEY` | No configurado → emails no se envían |
| `META_*` | No configurado → Lead Ads / WhatsApp inactivos |
| OpenAI billing | Cuota agotada → IA no responde |

### Opcional / mantenimiento

- PR [#9](https://github.com/julian8811/CRM-vp/pull/9) Google OAuth config en repo (pendiente merge)
- GitHub `CRON_SECRET` para workflow backup
- Rotar secretos compartidos en chat
- 6 PRs Dependabot abiertos

---

## Cómo repetir la verificación

```bash
npm ci && npm run lint && npm run test:run && npm run build
```

Pruebas API manuales contra `https://tgosnmvlvzaykiuolrot.supabase.co` con usuario de prueba.

En UI (https://crm-vp.vercel.app/):

1. Login / registro email
2. «Continuar con Google»
3. Crear cliente, lead, mover tarjeta en Pipeline
4. Ver notificación de nuevo lead
5. Chat IA (requiere crédito OpenAI)
6. Invitar usuario (como admin)

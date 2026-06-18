# Informe QA completo — CRM-VP

**Fecha:** 2026-06-18  
**Entorno:** https://crm-vp.vercel.app/  
**Supabase:** `tgosnmvlvzaykiuolrot`  
**Método:** pruebas API autenticadas + Edge Functions + revisión de código (`scripts/qa-production-test.py`)

---

## Resumen ejecutivo

| Estado | Cantidad | Descripción |
|--------|----------|-------------|
| ✅ Funciona | 12 módulos | Core CRM operativo |
| ❌ No funciona / bloqueado | 4 | Requiere credenciales externas o código |
| 🔧 Corregido en esta auditoría | 2 | RLS leads + informe |
| ⚠️ Parcial / menor | 5 | Ver detalle abajo |

---

## Por módulo

### 1. Autenticación — ✅ OK

| Función | Estado | Notas |
|---------|--------|-------|
| Registro email/password | ✅ | Perfil auto-creado |
| Login inválido | ✅ | 400 correcto |
| Google OAuth | ✅ | Provider habilitado, redirect a Google |
| Cerrar sesión | ✅ | (cliente Supabase) |

---

### 2. Dashboard — ✅ OK

| Función | Estado | Notas |
|---------|--------|-------|
| Carga métricas desde store | ✅ | Depende de datos del usuario |
| Búsqueda global (`search_crm`) | ✅ | RPC responde 200 |
| Notificaciones in-app | ✅ | Listar y marcar leídas |
| Export Excel | ✅ | Client-side (`exportExcel.js`), 82 tests |

---

### 3. Clientes — ✅ OK

| Función | Estado |
|---------|--------|
| Listar | ✅ |
| Crear | ✅ |
| Editar | ✅ |
| Eliminar | ✅ |

---

### 4. Leads (Dirige) — ✅ OK (tras fix)

| Función | Estado | Notas |
|---------|--------|-------|
| Listar | ✅ | |
| Crear | ✅ | |
| Notificación in-app al crear | ✅ | Trigger SQL activo |
| **Convertir / editar / eliminar** | ✅ **Corregido** | Faltaban políticas RLS `UPDATE`/`DELETE` — fallaban en silencio |
| Email al crear lead | ❌ | Requiere `RESEND_API_KEY` |

**Bug encontrado:** sin políticas `Owners can update/delete leads`, la UI devolvía éxito pero no persistía cambios. Migración `20260618160000_fix_leads_rls_update_delete.sql` aplicada en producción.

---

### 5. Pipeline (Embudo) — ✅ OK

| Función | Estado | Notas |
|---------|--------|-------|
| Listar oportunidades | ✅ | Join con `customers` |
| Crear oportunidad | ✅ | `stage: lead` |
| Mover etapa (drag & drop) | ✅ | PATCH `stage` |
| Eliminar | ✅ | |
| Export | ✅ | Client-side |

**Histórico:** faltaban políticas RLS en `opportunities` (corregido en migración `20260618150000`).

---

### 6. Productos — ✅ OK

| Función | Estado |
|---------|--------|
| Listar | ✅ |
| Crear (SKU único) | ✅ |
| Editar stock/precio | ✅ |
| Eliminar | ✅ |

---

### 7. Cotizaciones — ✅ OK

| Función | Estado | Notas |
|---------|--------|-------|
| Listar | ✅ | Requiere `customer_id` |
| Crear | ✅ | `status: draft`, `number` obligatorio |
| Eliminar | ✅ | |

---

### 8. Pedidos — ✅ OK

| Función | Estado | Notas |
|---------|--------|-------|
| Listar | ✅ | |
| Crear | ✅ | `status: confirmed` (no `pending`) |
| Actualizar estado | ✅ | `shipped`, `delivered`, etc. |
| Eliminar | ✅ | |

---

### 9. Postventa — ✅ OK

| Función | Estado | Notas |
|---------|--------|-------|
| Crear ticket | ✅ | Campo DB es `body`, no `description` |
| Listar / actualizar | ✅ | |

---

### 10. Automatizaciones — ⚠️ Parcial

| Función | Estado | Notas |
|---------|--------|-------|
| CRUD reglas en UI | ✅ | Tabla `automation_rules` |
| Cron cada 15 min | ✅ | `pg_cron` activo |
| Ejecución `run-automations` | ✅ | Requiere `x-cron-secret` |
| Emails automáticos | ❌ | Sin `RESEND_API_KEY` |
| Triggers en tiempo real | ❌ | No implementado — solo cron + notificaciones genéricas |

---

### 11. Meta (Lead Ads + WhatsApp) — ❌ Bloqueado

| Función | Estado | Qué falta |
|---------|--------|-----------|
| Guardar integración en DB | ✅ | Solo configuración local |
| Webhook endpoint | ✅ | Responde `ok` |
| Recibir leads de Facebook | ❌ | `META_VERIFY_TOKEN`, `META_APP_SECRET`, callback en Meta Developers |
| Sincronizar Lead Ads | ❌ | `META_PAGE_ACCESS_TOKEN` |
| Enviar WhatsApp | ❌ | `META_WHATSAPP_TOKEN` + `phone_number_id` |

---

### 12. Reportes — ✅ OK

| Función | Estado |
|---------|--------|
| Gráficos / funnel | ✅ | Datos del store |
| Filtros por período | ✅ |
| Export Excel | ✅ |

---

### 13. IA Comercial — ⚠️ Parcial

| Función | Estado | Notas |
|---------|--------|-------|
| Chat con asistente | ✅ | Gemini `gemini-2.5-flash-lite` |
| Preferencias (`user_preferences`) | ✅ | |
| Predicción / scoring / emails IA | ⚠️ | UI de tarjetas — todo pasa por el mismo chat |
| **Análisis de conversaciones** | ❌ | Texto: «Pendiente de integrar transcripciones» |
| Texto UI «OpenAI» | ⚠️ | Desactualizado — ya usa Gemini |

---

### 14. Configuración — ⚠️ Parcial

| Función | Estado | Notas |
|---------|--------|-------|
| Editar nombre/apellido | ✅ | |
| Preferencias notificaciones | ✅ | |
| **Subir avatar** | ⚠️ | Upload a Storage **funciona**; GET `/bucket/avatars` devuelve 404 (cosmético) |

---

### 15. Usuarios / Equipo — ⚠️ Parcial

| Función | Estado | Notas |
|---------|--------|-------|
| Listar equipo (admin/manager) | ✅ | RPC `get_team_profiles` |
| Usuario `sales` ve solo su perfil | ✅ | Por diseño |
| Cambiar rol | ⏸️ | Solo admin — no probado con sesión admin |
| Invitar por email | ⏸️ | `invite-user` bloquea no-admin (403 correcto) |
| Invitación real | ❓ | Requiere probar como admin + email Supabase Auth |

---

## Edge Functions

| Función | Estado | Evidencia |
|---------|--------|-----------|
| `crm-ai` | ✅ | 200 + respuesta Gemini |
| `run-automations` | ✅ | 403 sin secret (correcto) |
| `invite-user` | ✅ | 403 para no-admin |
| `meta-webhook` | ✅ | 200 |
| `meta-sync-leads` | ❌ | Sin token Meta / integración |
| `meta-send-whatsapp` | ❌ | Sin token WhatsApp |

---

## Infraestructura

| Item | Estado |
|------|--------|
| Vercel frontend | ✅ |
| Migraciones DB (producción) | ✅ 11+ (incl. fixes RLS) |
| `npm run test:run` | ✅ 82/82 |
| `npm run build` | ✅ |
| PRs pendientes merge | ⚠️ #9 Google OAuth, #10 RLS, #11 Gemini |
| Repo `main` sin migraciones RLS | ⚠️ Desincronizado vs producción |

---

## Prioridad de corrección

### P0 — Ya corregido en producción
1. ~~RLS `profiles` recursión~~ → migración `20260618140000`
2. ~~RLS faltante pipeline/pedidos/cotizaciones~~ → `20260618150000`
3. ~~Leads no editables/eliminables~~ → `20260618160000`

### P1 — Para cerrar integraciones (excluido por pedido del cliente)
1. Configurar `RESEND_API_KEY` + dominio → emails
2. Configurar secretos `META_*` + webhook en Meta Developers

### P2 — Resuelto en consolidación 2026-06-18
1. ~~Implementar «Análisis de conversaciones»~~ → tarjeta con análisis de tickets + mensajes CRM
2. ~~Actualizar textos UI IA~~ → Gemini
3. ~~Leads edit/delete silencioso~~ → migración RLS
4. ~~Admin invite error handling~~ → mejorado en UsersContent
5. ~~Merge PRs pendientes~~ → branch `cursor/fix-all-except-meta-resend-b954`

### P3 — Menor
1. Investigar 404 en GET bucket avatars (upload OK)
2. Sincronizar historial migraciones git ↔ Supabase (`migration repair`)

---

## Cómo repetir las pruebas

```bash
python3 scripts/qa-production-test.py
```

Resultados JSON en `qa-results.json`.

---

## Conclusión

**El CRM core está operativo** para uso diario: auth, clientes, leads, pipeline, productos, cotizaciones, pedidos, postventa, reportes, notificaciones in-app y chat IA con Gemini.

**No funciona sin configuración externa:** Meta/WhatsApp, emails Resend, y la feature «Análisis de conversaciones».

**Bug crítico corregido hoy:** editar/convertir/eliminar leads fallaba silenciosamente por RLS incompleto.

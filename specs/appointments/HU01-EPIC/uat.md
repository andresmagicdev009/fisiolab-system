# HU01-EPIC — UAT: Disponibilidad Horaria (Onboarding Obligatorio)

## Datos de Prueba

| Usuario | Rol | Estado DB | Propósito |
|---------|-----|-----------|-----------|
| `test_fisio_01` | `FISIOTERAPEUTA` | Sin availability | TC-01, TC-03, TC-05, TC-06 |
| `test_medico_01` | `MEDICO` | Con availability | TC-08, TC-09 |
| `test_pasante_01` | `PASANTE` | Sin availability | Variante TC-01 |
| `test_admin_01` | `ADMIN` | Sin availability | TC-02 |

---

## TC-01 · Bloqueo en primer login
**Cubre:** US-01
**Precondición:** Usuario `FISIOTERAPEUTA` creado en Clerk. 0 rows en `professional_availabilities`.

| # | Acción | Resultado Esperado | Resultado Real | Estado |
|---|--------|--------------------|----------------|--------|
| 1 | Login con credenciales del usuario clínico nuevo | Autenticación exitosa | | |
| 2 | Observar URL después del login | Redirect a `/onboarding/disponibilidad` | | |
| 3 | Verificar UI de la pantalla | Sin sidebar, sin menú de navegación del sistema | | |
| 4 | Verificar respuesta de API | `GET /users/me` → `hasAvailability: false` | | |

---

## TC-02 · Admin no interceptado (control negativo)
**Cubre:** US-01
**Precondición:** Usuario `ADMIN`, sin rows en `professional_availabilities`.

| # | Acción | Resultado Esperado | Resultado Real | Estado |
|---|--------|--------------------|----------------|--------|
| 1 | Login como admin | Autenticación exitosa | | |
| 2 | Observar URL post-login | Entra directamente a `/dashboard` | | |
| 3 | Verificar que OnboardingGuard no redirige | Permanece en dashboard | | |

---

## TC-03 · Completar wizard de onboarding
**Cubre:** US-02
**Precondición:** Usuario clínico nuevo en `/onboarding/disponibilidad`.

| # | Acción | Resultado Esperado | Resultado Real | Estado |
|---|--------|--------------------|----------------|--------|
| 1 | Activar día Lunes (pill LUN) | Fila de configuración se expande para Lunes | | |
| 2 | Ingresar `startTime: 08:00`, `endTime: 12:00`, duración: `30 min`, capacidad: `2` | Campos aceptan valores sin error | | |
| 3 | Activar Miércoles y configurar `09:00`–`17:00`, `60 min`, capacidad `1` | Fila Miércoles expandida y configurada | | |
| 4 | Verificar días no activados | Marcados como "Cerrado", sin campos de tiempo | | |
| 5 | Hacer Submit | `PUT /professionals/:id/availability` → 200 | | |
| 6 | Observar respuesta visual | Overlay de éxito visible | | |
| 7 | Observar redirect | Navegación a `/dashboard` del rol | | |
| 8 | Verificar API post-submit | `GET /users/me` → `hasAvailability: true` | | |

---

## TC-04 · Validación de payload sin días activos
**Cubre:** US-02
**Precondición:** Usuario clínico en wizard, ningún día activado.

| # | Acción | Resultado Esperado | Resultado Real | Estado |
|---|--------|--------------------|----------------|--------|
| 1 | No activar ningún día | Todos en estado "Cerrado" | | |
| 2 | Intentar Submit | Validación cliente bloquea envío, muestra error | | |
| 3 | Verificar network tab | Sin request PUT enviado | | |

---

## TC-05 · Evasión de URL bloqueada
**Cubre:** US-03
**Precondición:** Usuario clínico sin availability, sesión activa.

| # | Acción | Resultado Esperado | Resultado Real | Estado |
|---|--------|--------------------|----------------|--------|
| 1 | Escribir `/dashboard` en barra de URL | Redirect a `/onboarding/disponibilidad` | | |
| 2 | Escribir `/dashboard/patients` | Mismo redirect | | |
| 3 | Escribir `/dashboard/agenda` | Mismo redirect | | |
| 4 | Escribir `/onboarding/disponibilidad` | Pantalla carga correctamente | | |

---

## TC-06 · Solapas dentro del mismo batch (error path)
**Cubre:** US-04
**Precondición:** Usuario clínico en wizard.

| # | Acción | Resultado Esperado | Resultado Real | Estado |
|---|--------|--------------------|----------------|--------|
| 1 | Activar Lunes, configurar rango `08:00`–`12:00` | OK | | |
| 2 | Enviar batch con segundo rango Lunes `10:00`–`14:00` (solapado) | `PUT` → `409 Conflict` | | |
| 3 | Observar UI | Mensaje de error visible, sin redirect | | |
| 4 | Verificar DB | 0 rows nuevas en `professional_availabilities` (rollback) | | |

---

## TC-07 · Validación de campos — Backend ValidationPipe
**Cubre:** US-04, US-02
**Precondición:** Acceso directo a API (Postman/Insomnia) con token válido.

| # | Payload enviado | Resultado Esperado | Resultado Real | Estado |
|---|----------------|--------------------|----------------|--------|
| 1 | `startTime: null` | `400 Bad Request` | | |
| 2 | `dayOfWeek: 7` (fuera de rango 0–6) | `400 Bad Request` | | |
| 3 | `endTime` anterior a `startTime` (ej `07:00`–`06:00`) | `400 Bad Request` o `409` | | |
| 4 | `slotDurationMinutes: 25` (valor no predefinido) | `400 Bad Request` | | |
| 5 | Payload completo y válido (un día con rangos correctos) | `200 OK`, rows creadas en DB | | |

---

## TC-08 · Login normal post-onboarding
**Cubre:** US-05
**Precondición:** Usuario clínico con availability configurada (completó TC-03).

| # | Acción | Resultado Esperado | Resultado Real | Estado |
|---|--------|--------------------|----------------|--------|
| 1 | Login con usuario clínico | Autenticación exitosa | | |
| 2 | Observar URL post-login | Entra directo a `/dashboard`, no pasa por wizard | | |
| 3 | Verificar API | `GET /users/me` → `hasAvailability: true` | | |
| 4 | Navegar a `/onboarding/disponibilidad` manualmente | Sistema permite o redirige a dashboard (sin bloqueo infinito) | | |

---

## TC-09 · Edición de disponibilidad desde Agenda
**Cubre:** US-06
**Precondición:** Usuario clínico con availability configurada, en dashboard.

| # | Acción | Resultado Esperado | Resultado Real | Estado |
|---|--------|--------------------|----------------|--------|
| 1 | Navegar a pestaña Agenda | Formulario visible con datos actuales cargados | | |
| 2 | Modificar horario Lunes: `endTime` de `12:00` a `14:00` | Campo actualizado en UI | | |
| 3 | Guardar cambios | `PUT /professionals/:id/availability` → 200 | | |
| 4 | Verificar cache Redis | Llaves `USER_PROFILE` + `AVAIL_PROFESSIONAL` eliminadas | | |
| 5 | Recargar pestaña Agenda | Datos nuevos cargados sin re-login | | |

---

## TC-10 · Invalidación de cache post-submit
**Cubre:** US-02, US-05
**Precondición:** Redis activo, usuario clínico nuevo.

| # | Acción | Resultado Esperado | Resultado Real | Estado |
|---|--------|--------------------|----------------|--------|
| 1 | Pre-submit: inspeccionar Redis `USER_PROFILE(clerkId)` | Existe con `hasAvailability: false` | | |
| 2 | Completar wizard y hacer submit exitoso | `PUT` ejecutado → 200 | | |
| 3 | Post-submit: inspeccionar Redis | Llave `USER_PROFILE(clerkId)` eliminada o con `hasAvailability: true` | | |
| 4 | Siguiente `GET /users/me` | Dato fresco desde DB con `hasAvailability: true` | | |

---

## Resumen de Cobertura

| Test Case | US Cubierta | Tipo |
|-----------|------------|------|
| TC-01 | US-01 | Happy Path |
| TC-02 | US-01 | Control Negativo |
| TC-03 | US-02 | Happy Path |
| TC-04 | US-02 | Error Path |
| TC-05 | US-03 | Seguridad |
| TC-06 | US-04 | Error Path |
| TC-07 | US-04, US-02 | Validación API |
| TC-08 | US-05 | Happy Path |
| TC-09 | US-06 | Happy Path |
| TC-10 | US-02, US-05 | Integración Cache |

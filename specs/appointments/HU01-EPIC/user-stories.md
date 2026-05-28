# HU01-EPIC — Historias de Usuario: Disponibilidad Horaria (Onboarding Obligatorio)

---

## US-01 · Bloqueo obligatorio en primer login

**Como** profesional clínico (Médico, Fisioterapeuta, Pasante) recién creado en el sistema
**Quiero** ser redirigido automáticamente a configurar mi disponibilidad al primer login
**Para** no poder acceder al dashboard sin antes haber definido mi jornada semanal

### Criterios de aceptación
- Sistema detecta `hasAvailability: false` en `GET /users/me`
- Roles afectados: `medico`, `fisioterapeuta`, `pasante`
- Redirect automático a `/onboarding/disponibilidad`
- Vista no contiene sidebar ni menú del sistema (fullscreen limpio)
- Roles no clínicos (ej. `admin`) NO son interceptados

---

## US-02 · Configuración de jornada semanal en Wizard

**Como** profesional clínico en pantalla de onboarding
**Quiero** seleccionar días, horas de inicio/fin, duración de cita y capacidad simultánea
**Para** definir exactamente cuándo y cómo puedo atender pacientes

### Criterios de aceptación
- Listado LUN–DOM con activación por día (pill/switch)
- Por cada día activo: campos `startTime`, `endTime`, `slotDurationMinutes` (15/30/45/60 min), `maxConcurrentPatients`
- Días inactivos quedan marcados como "Cerrado" y no se envían en el payload
- Formulario usa React Hook Form con validación en cliente antes de enviar
- Submit ejecuta `PUT /professionals/:id/availability` (batch replace transaccional)
- Éxito muestra overlay de confirmación y redirige al dashboard correspondiente al rol

---

## US-03 · Bloqueo por evasión de URL

**Como** profesional clínico sin disponibilidad configurada
**Quiero** que el sistema me impida acceder al dashboard aunque manipule la URL directamente
**Para** garantizar que ningún profesional opere sin horario definido

### Criterios de aceptación
- `OnboardingGuard` verifica `hasAvailability` en cada carga de ruta protegida
- Cualquier sub-ruta bajo `/dashboard/**` redirige a `/onboarding/disponibilidad`
- Verificación ocurre en cliente (React Router v6) sin depender solo del servidor

---

## US-04 · Validación de rangos solapados

**Como** sistema
**Quiero** rechazar configuraciones donde dos rangos horarios del mismo día se solapan
**Para** evitar inconsistencias en la agenda del profesional

### Criterios de aceptación
- Backend valida solapas dentro del mismo `dayOfWeek` en el batch recibido
- Error retornado: `409 Conflict`
- Frontend muestra mensaje de error sin redirigir
- Estado de la base de datos no cambia (transacción rollback)

---

## US-05 · Acceso directo al dashboard post-onboarding

**Como** profesional clínico que ya completó su onboarding
**Quiero** entrar directamente al dashboard en cada login posterior
**Para** no ser interrumpido con el wizard de configuración de nuevo

### Criterios de aceptación
- `GET /users/me` retorna `hasAvailability: true`
- `OnboardingGuard` permite paso sin redirect
- Acceso directo a `/dashboard` sin pasar por `/onboarding/disponibilidad`
- Cache de perfil (`USER_PROFILE(clerkId)`) refleja el flag actualizado

---

## US-06 · Edición de disponibilidad desde perfil/agenda

**Como** profesional clínico que ya completó su onboarding
**Quiero** poder modificar mi jornada semanal desde la pestaña Agenda
**Para** ajustar mis horarios de atención cuando mi disponibilidad cambie

### Criterios de aceptación
- Mismo componente de formulario del wizard reutilizado en sección Agenda
- Submit ejecuta mismo `PUT` transaccional (Delete-Insert)
- Invalida caché `USER_PROFILE(clerkId)` + `AVAIL_PROFESSIONAL` simultáneamente
- No requiere re-login para ver cambios reflejados

---

## Reglas de Negocio Transversales

| # | Regla |
|---|-------|
| RN-01 | Onboarding no se puede evadir alterando URL; guard verifica en cada carga |
| RN-02 | No se permiten rangos que se solapen en el mismo día (409) |
| RN-03 | Backend valida estrictamente con `ValidationPipe` activo |
| RN-04 | Flag `hasAvailability` se deriva de existencia de rows — sin columna `is_onboarded` en users |
| RN-05 | Mutación de availability invalida cache `USER_PROFILE` + `AVAIL_PROFESSIONAL` de forma simultánea |

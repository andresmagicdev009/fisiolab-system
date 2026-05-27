## 📋 tasks.md

```markdown
# Checklist de Tareas - Onboarding de Disponibilidad

## Backend (NestJS + TypeORM)
- [ ] **Migración:** Crear tabla `professional_availabilities` (Campos: dayOfWeek, startTime, endTime, slotDurationMinutes, maxConcurrentPatients).
- [ ] **Modificación en Módulo Users:** Actualizar el método que retorna el usuario actual (`/users/me`) para incluir la propiedad calculada `hasAvailability` mediante un `EXISTS` en SQL o lectura de relación.
- [ ] **Módulo Availability:** Crear controlador y servicios para gestionar los slots semanales de manera transaccional (Delete-Insert en lote).
- [ ] **Invalidación de Caché:** Asegurar que al guardar los slots en `PUT /professional-availability`, se limpien las llaves de Redis del usuario y de su disponibilidad de forma simultánea.

## Frontend (React + React Router v6)
- [ ] **Actualización de Tipos:** Agregar `hasAvailability: boolean` al tipo `User` en `src/types/models.ts`.
- [ ] **Creación del Guard:** Desarrollar el componente `OnboardingGuard.tsx` para interceptar usuarios clínicos sin agenda.
- [ ] **Vista Onboarding Wizard (`/onboarding/disponibilidad`):**
  - [ ] Diseñar layout minimalista sin menús del sistema.
  - [ ] Implementar listado de Lunes a Domingo con switches de activación de día.
  - [ ] Añadir selectores de tiempo (`startTime`, `endTime`) y select de duración predefinida (30, 45, 60 min).
  - [ ] Vincular con `React Hook Form` y controlar estados iniciales limpios.
- [ ] **Mutación y Redirección:** Configurar el éxito del envío del formulario para que ejecute `queryClient.invalidateQueries(['currentUser'])` y redirija automáticamente al `/dashboard` usando `useNavigate()`.
- [ ] **Reutilización:** Emparejar el mismo componente de formulario interno para que sea usado dentro de la sección "Mi Perfil" en la gestión diaria normal.
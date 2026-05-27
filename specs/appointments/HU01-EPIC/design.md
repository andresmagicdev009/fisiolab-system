# Diseño Técnico: Interceptor de Onboarding y Disponibilidad

## 1. Estrategia de Control de Onboarding
Para evitar añadir columnas redundantes como `is_onboarded` en la tabla de usuarios, utilizaremos la misma existencia de los datos:
1. El Frontend consulta el endpoint `GET /api/v1/professional-availability`.
2. Si el array retorna vacío `[]` y el rol es clínico, un Guard de `React Router v6` intercepta la navegación.

## 2. API Endpoints (NestJS)
Mantenemos el estándar pero optimizamos la respuesta del usuario para el Frontend:

- `GET /api/v1/users/me` -> Retornará el perfil del usuario junto con un flag calculado en el servicio: `hasAvailability: boolean` (basado en un conteo rápido en DB indexado o caché). Esto evita peticiones extra en el arranque de la app.

### Flujo de Cache Redis
- Llave: `CK.USER_PROFILE(clerkId)`
- Al hacer el `PUT /api/v1/professional-availability`, invalidamos tanto la caché de disponibilidad como la del perfil del usuario para que el flag `hasAvailability` cambie a `true`.

## 3. Frontend Architecture & Router Guard (React Router v6)

Crearemos un componente Guard para envolver las rutas privadas del Dashboard.

### `src/components/auth/OnboardingGuard.tsx`
```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentDbUser } from '../../hooks/useCurrentUser';
import { Center, Spinner } from '@chakra-ui/react';

export const OnboardingGuard = () => {
  const { data: user, isLoading } = useCurrentDbUser();
  const rolesClinicos = ['medico', 'fisioterapeuta', 'pasante'];

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="teal.500" />
      </Center>
    );
  }

  // Si es clínico y no tiene disponibilidad configurada, forzar Onboarding
  if (user && rolesClinicos.includes(user.role) && !user.hasAvailability) {
    return <Navigate to="/onboarding/disponibilidad" replace />;
  }

  return <Outlet />;
};
Rutas (src/routes/index.tsx)
TypeScript
<Route element={<JwtAuthGuard />}>
  {/* Flujo de Onboarding Forzado */}
  <Route path="/onboarding/disponibilidad" element={<OnboardingWizard />} />

  {/* Rutas Protegidas por Disponibilidad */}
  <Route element={<OnboardingGuard />}>
    <Route path="/dashboard" element={<DashboardLayout />}>
      <Route index element={<DashboardHome />} />
      {/* Resto de módulos... */}
    </Route>
  </Route>
</Route>

4. UI del Asistente (Calendly Style)
Pantalla limpia, sin barra lateral de navegación del sistema para evitar distracciones.

Card centralizado usando Chakra UI v2.

Switch rápido para activar/desactivar días completos (ej: Sábado "Cerrado").

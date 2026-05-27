# Historia de Usuario: Disponibilidad Horaria (Onboarding Obligatorio)

## Descripción
**Como** profesional de la salud (Médico, Fisioterapeuta, Pasante) recién registrado en el sistema  
**Quiero** configurar mi horario de disponibilidad en mi primer inicio de sesión  
**Para** establecer mis horarios de atención de forma inmediata y activar mi agenda en la clínica sin navegación redundante.

## Criterios de Aceptación

### Escenario 1: Primer inicio de sesión (Bloqueo y Redirección al estilo Calendly)
- **Dado** que el Administrador ya creó al usuario en Clerk y este inicia sesión por primera vez.
- **Cuando** el sistema detecta que el usuario tiene un rol clínico (`MEDICO`, `FISIOTERAPEUTA`, `PASANTE`) pero **no posee** ningún horario configurado en la base de datos.
- **Entonces** el sistema debe bloquear el acceso al Dashboard principal y presentar la pantalla `/onboarding/disponibilidad` de forma suave.
- **Y** debe mostrar una interfaz fluida paso a paso para definir su jornada semanal (Días, Horas, Duración de cita y Capacidad simultánea).

### Escenario 2: Visualización y Edición posterior (Gestión continua)
- **Dado** que el profesional ya completó su onboarding.
- **Cuando** inicia sesión normalmente.
- **Entonces** entra directamente al Dashboard, y puede editar estos mismos slots al acceder a la pestaña Agenda.

## Reglas de Negocio Específicas
1. **Inmutabilidad del Onboarding:** Un profesional no puede evadir la pantalla de onboarding alterando la URL; el enrutador (`React Router v6`) debe verificar el estado de su disponibilidad en cada carga.
2. **Validación de Cruces:** Al igual que en el guardado estándar, no se permiten rangos que se solapen el mismo día (Error 409).
3. **Formato Limpio:** El backend validará estrictamente las propiedades con el `ValidationPipe` activo.
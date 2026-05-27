# Integración Appointments ↔ Sessions

## Objetivo
Definir cómo interactúan los módulos de Appointments y Sessions manteniendo bajo acoplamiento.

---

## Principios de Diseño

### 1. Single Responsibility Principle (SRP)
- `AppointmentService` → gestiona CUÁNDO (scheduling)
- `SessionService` → gestiona QUÉ (contenido clínico)
- Ninguno debe conocer detalles de implementación del otro

### 2. Open/Closed Principle (OCP)
- Agregar nuevos comportamientos (ej: notificaciones) sin modificar código existente
- Usar eventos para extensibilidad

### 3. Dependency Inversion Principle (DIP)
- Ambos dependen de abstracción (Domain Events)
- No dependen uno del otro directamente

---

## Casos de Uso

### Caso 1: Cita Vinculada a Sesión de Plan

**Flujo:**
1. Fisioterapeuta crea plan tratamiento (12 sesiones)
2. Sistema crea 12 registros Session con estado PENDIENTE
3. Fisioterapeuta agenda cita para "Sesión 1"
4. POST /appointments { ..., sessionId: 'uuid-sesion-1' }
5. Cita queda vinculada
6. Al completar cita → evento emitido → sesión auto-completada

**Estado Final:**
- Appointment.estado = COMPLETADA
- Session.estado = REALIZADA
- SessionPayment.estado = PENDIENTE

---

### Caso 2: Cita Genérica (Sin Vinculación)

**Flujo:**
1. Paciente llama para consulta no relacionada a plan activo
2. Fisioterapeuta agenda cita sin vincular
3. POST /appointments { ..., sessionId: null }
4. Al completar cita → evento emitido → crea Session LIBRE

**Estado Final:**
- Appointment.estado = COMPLETADA
- Session nueva creada con tipo LIBRE
- SessionPayment.estado = PENDIENTE

---

### Caso 3: Cancelar Cita Vinculada

**Flujo:**
1. Cita vinculada a Sesión 5 del plan
2. Paciente cancela
3. POST /appointments/:id/cancel
4. Evento `appointment.cancelled` emitido
5. Listener de sesiones recibe evento
6. Session.estado vuelve a PENDIENTE

**Estado Final:**
- Appointment.estado = CANCELADA
- Session.estado = PENDIENTE (puede reagendarse)

---

## Matriz de Responsabilidades

| Acción | Responsable | Mecanismo |
|--------|-------------|-----------|
| Crear cita | AppointmentService | CRUD directo |
| Vincular cita a sesión | AppointmentService | Guardar FK session_id |
| Completar cita | AppointmentService | Cambiar estado + emitir evento |
| Marcar sesión como realizada | SessionService | Listener de evento |
| Crear pago de sesión | SessionPaymentService | Listener de evento |
| Desvincular cita | AppointmentService | Borrar FK + emitir evento |

---

## Diagrama de Secuencia

### Completar Cita Vinculada

Profesional → AppointmentController: POST /appointments/:id/complete
AppointmentController → AppointmentService: complete(id, userId)
AppointmentService → AppointmentRepo: save(appointment con estado COMPLETADA)
AppointmentService → EventEmitter: emit('appointment.completed', payload)
EventEmitter → SessionListener: handleAppointmentCompleted(event)
SessionListener → SessionService: markAsCompleted(event.sessionId)
SessionService → SessionRepo: save(session con estado REALIZADA)
EventEmitter → PaymentListener: handleAppointmentCompleted(event)
PaymentListener → SessionPaymentService: create(appointmentId)
PaymentService → PaymentRepo: save(new SessionPayment)
AppointmentController → Profesional: 200 { appointment, message }

---

## Checklist de Integración

- [ ] Appointments NO importa SessionService
- [ ] Sessions NO importa AppointmentService
- [ ] Comunicación vía Domain Events únicamente
- [ ] Listeners tienen manejo de errores (si falla uno, no afecta otros)
- [ ] Transacciones aisladas por módulo (no cross-module transactions)
- [ ] Auditoría registra origen de auto-completado
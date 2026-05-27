### Task 2.8: Implementar Domain Events infrastructure
**Estimación:** 2 puntos  
**Asignado a:** Backend Dev  
**Dependencies:** Ninguna

**Subtasks:**
- [ ] Instalar `@nestjs/event-emitter`
- [ ] Configurar EventEmitterModule en app.module.ts
- [ ] Crear interfaces de eventos en `src/common/events/`
- [ ] Crear clase `AppointmentCompletedEvent`
- [ ] Tests unitarios de evento (payload correcto)

**Trazabilidad:** US-10

---

### Task 2.9: Emitir evento en AppointmentService.complete()
**Estimación:** 2 puntos  
**Asignado a:** Backend Dev  
**Dependencies:** Task 2.8

**Subtasks:**
- [ ] Inyectar EventEmitter2 en AppointmentService
- [ ] Emitir evento después de save() exitoso
- [ ] Incluir todos los campos necesarios en payload
- [ ] NO crear Session ni Payment directamente
- [ ] Tests: verificar que evento se emite con datos correctos

**Trazabilidad:** US-10

---

### Task 2.10: Crear Listener en Sessions module
**Estimación:** 3 puntos  
**Asignado a:** Backend Dev  
**Dependencies:** Task 2.9

**Subtasks:**
- [ ] Crear `appointment-completed.listener.ts` en sessions/
- [ ] Decorador `@OnEvent('appointment.completed')`
- [ ] Lógica: IF sessionId → markAsCompleted ELSE createFreeSession
- [ ] Manejo de errores sin romper otros listeners
- [ ] Tests integración: emitir evento mock → verificar sesión actualizada

**Trazabilidad:** US-10

---

### Task 2.11: Endpoints link/unlink cita ↔ sesión
**Estimación:** 3 puntos  
**Asignado a:** Backend Dev  
**Dependencies:** Task 2.3 (modificar entity)

**Subtasks:**
- [ ] POST /appointments/:id/link-to-plan
- [ ] DELETE /appointments/:id/unlink-from-plan
- [ ] Validaciones: sesión pendiente, no duplicados
- [ ] Tests integración
- [ ] Documentación Swagger

**Trazabilidad:** US-9

---

### Task 2.12: Frontend - Selector de plan en AppointmentForm
**Estimación:** 5 puntos  
**Asignado a:** Frontend Dev  
**Dependencies:** Task 2.11

**Subtasks:**
- [ ] Fetch treatment plans del paciente (hook useTreatmentPlans)
- [ ] Dropdown "Vincular a plan de tratamiento" (opcional)
- [ ] Al seleccionar plan → mostrar sesiones pendientes
- [ ] Radio buttons para seleccionar sesión específica
- [ ] Submit incluye treatmentPlanId + sessionId
- [ ] Badge visual "Vinculada a Sesión X"

**Trazabilidad:** US-9
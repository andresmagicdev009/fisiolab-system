# Módulo: session-payments + invoices

Pagos de sesiones clínicas y facturas electrónicas SRI Ecuador. Dos módulos relacionados: `SessionPayment` (cabecera de pago, auto-creada al completar cita) → `Invoice[]` (facturas vinculadas).

---

## Patrón de diseño: State Pattern

`PaymentStateFactory.get(estadoPago)` resuelve la estrategia activa:

```
EstadoPago     Transiciones permitidas
──────────────────────────────────────────────────────
PENDIENTE   →  PAGADO (pago completo) | PARCIAL (abono)
PARCIAL     →  PAGADO (pago del resto)
PAGADO      →  terminal (422 en cualquier PATCH)
```

```typescript
const state = PaymentStateFactory.get(payment.estadoPago); // PendienteState | ParcialState | PagadoState
const updated = state.pay(payment, dto);                   // valida + muta, no guarda
await paymentRepo.save(updated);
```

---

## Flujo de creación

`SessionPayment` **no se crea manualmente** — se genera automáticamente al completar una cita:
```
POST /appointments/:id/complete { monto, episodeId? }
→ INSERT session_payments (appointment_id, monto, estado_pago='PENDIENTE')
→ appointments.session_payment_id = nuevo id
```

Para cobrar, usar `PATCH /api/v1/payments/:paymentId` con `estadoPago` + `metodoPago`.

---

## Rutas

```
# Pagos
GET   /api/v1/patients/:patientId/payments         READERS
GET   /api/v1/payments                             ADMIN only
GET   /api/v1/payments/:paymentId                  READERS
PATCH /api/v1/payments/:paymentId                  WRITERS

# Facturas (nested bajo pago)
POST  /api/v1/payments/:paymentId/invoices         BILLERS (ADMIN|MEDICO)
GET   /api/v1/payments/:paymentId/invoices         READERS
GET   /api/v1/payments/:paymentId/invoices/:invId  READERS
```

**Roles:**
- `READERS` = ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE
- `WRITERS` = ADMIN, MEDICO, FISIOTERAPEUTA
- `BILLERS` = ADMIN, MEDICO

---

## Entidad `SessionPayment` (respuesta)

```typescript
{
  id: string
  appointmentId: string | null      // UUID de la cita origen
  monto: number                     // decimal(10,2)
  estadoPago: EstadoPago            // 'PENDIENTE' | 'PAGADO' | 'PARCIAL'
  metodoPago: MetodoPago | null     // null hasta registrar pago
  fechaPago: string | null          // ISO 8601 — autogenerado al pagar si no se envía
  createdAt: string
}
```

**`EstadoPago` enum:** `PENDIENTE | PAGADO | PARCIAL`  
**`MetodoPago` enum:** `EFECTIVO | TRANSFERENCIA | TARJETA | SEGURO`

---

## Entidad `Invoice` (respuesta)

```typescript
{
  id: string
  paymentId: string | null          // UUID del pago
  numeroFactura: string | null      // formato 001-001-000000001
  rucEmisor: string | null          // 13 dígitos (RUC Ecuador)
  claveAcceso: string | null        // 49 dígitos SRI
  autorizacionSri: string | null    // número autorización SRI
  xmlFactura: string | null         // XML RIDE completo
  createdAt: string
}
```

**Inmutable** — no hay endpoint PATCH para facturas (SRI Ecuador: facturas no se modifican).

---

## PATCH /payments/:paymentId — registrar pago

**Body:**
```typescript
{
  estadoPago: EstadoPago    // requerido: PAGADO o PARCIAL (desde PENDIENTE); PAGADO (desde PARCIAL)
  metodoPago: MetodoPago    // requerido
  monto?: number            // sobreescribe monto si se envía (útil para pagos parciales)
  fechaPago?: string        // ISO 8601 — default: ahora
}
```

**Errores:**
- 422: `estadoPago` inválido para el estado actual (ej: PARCIAL desde PARCIAL)
- 422: `metodoPago` faltante
- 422: pago ya está en estado PAGADO

---

## POST /payments/:paymentId/invoices — emitir factura

**Prerequisito:** `SessionPayment.estadoPago === 'PAGADO'` (422 si no).

**Body:**
```typescript
{
  numeroFactura?: string    // formato 001-001-000000001 (regex validado)
  rucEmisor?: string        // 13 dígitos exactos
  claveAcceso?: string      // 49 dígitos exactos
  autorizacionSri?: string  // max 50 chars
  xmlFactura?: string       // XML RIDE libre
}
```

Todos los campos son opcionales — permite registrar facturas parcialmente (ej: guardar XML antes de tener autorización SRI).

---

## Reglas de negocio

1. `SessionPayment` auto-creada al completar cita — no existe endpoint `POST /payments`
2. State Pattern: `PAGADO` es terminal — ningún PATCH posible (422)
3. `PARCIAL → PAGADO` único (no puede volver a PENDIENTE)
4. Factura solo para pagos `PAGADO` (422 si PENDIENTE o PARCIAL)
5. `numeroFactura` unique — conflicto 409 si duplicado
6. Facturas son inmutables (no hay PATCH ni DELETE)
7. `GET /payments` solo para ADMIN — scoping de privacidad financiera

---

## Cache Redis

| Clave | TTL | Invalidación |
|-------|-----|--------------|
| `payment:id:{id}` | 600s | PATCH, POST invoice |
| `invoice:id:{id}` | 600s | — (immutable, no invalidación) |

---

## Archivos backend

```
src/modules/session-payments/
  interfaces/payment-state.strategy.ts   ← abstract class
  states/
    pendiente.state.ts
    parcial.state.ts
    pagado.state.ts                       ← terminal, siempre 422
  factories/payment-state.factory.ts
  entities/session-payment.entity.ts
  dto/
    update-session-payment.dto.ts
    payment-query.dto.ts
  session-payments.service.ts
  session-payments.controller.ts         ← /payments
  patient-payments.controller.ts         ← /patients/:pid/payments
  session-payments.module.ts

src/modules/invoices/
  entities/invoice.entity.ts
  dto/
    create-invoice.dto.ts
    invoice-query.dto.ts
  invoices.service.ts
  invoices.controller.ts                 ← /payments/:pid/invoices
  invoices.module.ts

src/database/migrations/1747440019000-CreateInvoices.ts
```

**Nota:** Tabla `session_payments` creada en `1747440011000-CreateAppointments.ts`.

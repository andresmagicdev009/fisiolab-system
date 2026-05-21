# Módulo: interconsults

Interconsultas entre profesionales dentro de un episodio clínico. Un profesional (solicitante) solicita opinión a otro (destinatario). El destinatario puede aceptar y luego responder.

---

## Máquina de estados

```
SOLICITADA → EN_PROCESO  (POST /accept — destinatario)
SOLICITADA → RESPONDIDA  (POST /respond — destinatario, salto directo)
EN_PROCESO → RESPONDIDA  (POST /respond — destinatario)
```

- RESPONDIDA es inmutable
- PATCH solo en estado SOLICITADA

---

## Rutas

```
# Nested bajo episodio
POST  /api/v1/patients/:patientId/episodes/:episodeId/interconsults                   WRITERS
GET   /api/v1/patients/:patientId/episodes/:episodeId/interconsults                   READERS
GET   /api/v1/patients/:patientId/episodes/:episodeId/interconsults/:icId             READERS
PATCH /api/v1/patients/:patientId/episodes/:episodeId/interconsults/:icId             WRITERS (solicitante/admin, SOLICITADA)
POST  /api/v1/patients/:patientId/episodes/:episodeId/interconsults/:icId/accept      WRITERS (destinatario/admin)
POST  /api/v1/patients/:patientId/episodes/:episodeId/interconsults/:icId/respond     WRITERS (destinatario/admin)

# Vista global
GET   /api/v1/interconsults     READERS (admin: todas; profesional: donde es solicitante O destinatario)
```

**Roles:**
- `READERS` = ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE
- `WRITERS` = ADMIN, MEDICO, FISIOTERAPEUTA

---

## Entidad `Interconsult` (respuesta)

```typescript
{
  id: string
  episodeId: string
  codigoHc: string                    // 'HC-2024-0037' — desnormalizado
  pacienteId: string                  // desnormalizado
  solicitanteId: string               // UUID profesional que solicita
  destinatarioId: string              // UUID profesional destinatario
  motivo: string
  hallazgosRelevantes: string | null
  preguntaClinica: string | null
  estado: 'SOLICITADA' | 'EN_PROCESO' | 'RESPONDIDA'
  respuesta: string | null            // poblado al responder
  fechaRespuesta: string | null       // ISO 8601 — auto al responder
  createdAt: string
  updatedAt: string
}
```

---

## Crear — `POST`

**Body:**
```typescript
{
  solicitanteId: string              // uuid, requerido
  destinatarioId: string             // uuid, requerido
  motivo: string                     // min 10, max 1000, requerido
  hallazgosRelevantes?: string       // max 2000
  preguntaClinica?: string           // max 500
}
```

**Prerequisito:** Episodio en estado `abierto` o `en_tratamiento` (422 si no).

---

## PATCH — editar (solicitante/admin, solo SOLICITADA)

```typescript
{
  destinatarioId?: string
  motivo?: string
  hallazgosRelevantes?: string
  preguntaClinica?: string
}
```

---

## `POST /accept` — sin body

Destinatario acepta → `EN_PROCESO`. Solo desde `SOLICITADA` (422 si ya en otro estado).

---

## `POST /respond`

```typescript
{ respuesta: string }    // min 10, max 3000
```

- Destinatario o admin
- Desde `SOLICITADA` o `EN_PROCESO` (salto directo permitido)
- Auto-setea `fechaRespuesta = now()`
- `RESPONDIDA` es inmutable (422 si ya respondida)

---

## Listado global `/interconsults`

**Scoping automático:**
- ADMIN → sin restricción, puede filtrar por `solicitanteId` / `destinatarioId`
- MEDICO / FISIOTERAPEUTA → solo donde `solicitante_id = self OR destinatario_id = self`
- PASANTE → igual que profesional (solo lectura)

**Query params:** `page`, `limit`, `estado`, `solicitanteId`\*, `destinatarioId`\* (\*solo admin)

---

## Reglas de negocio

1. `solicitanteId` ≠ `destinatarioId` — no tiene sentido autoconsultarse (validar en service)
2. Episodio debe ser activo al crear (422)
3. PATCH solo en SOLICITADA; una vez EN_PROCESO o RESPONDIDA → inmutable
4. Solo destinatario puede aceptar y responder (403 si otro)
5. Solo solicitante puede editar (403 si otro)
6. RESPONDIDA es terminal — ninguna acción adicional

---

## Cache Redis

| Clave | TTL | Invalidación |
|-------|-----|--------------|
| `ic:id:{id}` | 600s | PATCH, /accept, /respond |

---

## Archivos backend

```
src/modules/interconsults/
  entities/interconsult.entity.ts      — EstadoInterconsulta enum
  dto/create-interconsult.dto.ts       — solicitanteId + destinatarioId + motivo req
  dto/update-interconsult.dto.ts       — todos opcionales
  dto/respond-interconsult.dto.ts      — respuesta req (min 10)
  dto/interconsult-query.dto.ts        — page, limit, estado, solicitanteId, destinatarioId
  interconsults.service.ts
  interconsults.controller.ts          ← dos controllers: EpisodeInterconsultsController + InterconsultsController
  interconsults.module.ts

src/database/migrations/1747440012000-CreateInterconsults.ts
```

# Módulo: physical-evaluations

Evaluaciones físicas fisioterapéuticas asociadas a un episodio clínico. Almacena ROM, fuerza muscular, pruebas especiales, inspección y palpación en campos JSONB flexibles.

---

## Prerequisitos

- Episodio clínico en estado `abierto` o `en_tratamiento`
- Tarjetero índice del paciente con `estado = activo`

---

## Rutas

```
POST  /api/v1/patients/:patientId/episodes/:episodeId/evaluations          — crear evaluación      WRITERS
GET   /api/v1/patients/:patientId/episodes/:episodeId/evaluations          — listar del episodio   READERS
GET   /api/v1/patients/:patientId/episodes/:episodeId/evaluations/:evalId  — detalle completo      READERS
PATCH /api/v1/patients/:patientId/episodes/:episodeId/evaluations/:evalId  — actualizar            WRITERS (autor/admin)
```

**Roles:**
- `READERS` = ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE
- `WRITERS` = ADMIN, MEDICO, FISIOTERAPEUTA

---

## Entidad `PhysicalEvaluation` (respuesta)

```typescript
{
  id: string                        // uuid
  episodeId: string                 // uuid — episodio al que pertenece
  codigoHc: string                  // 'HC-2024-0037' — desnormalizado
  pacienteId: string                // uuid — desnormalizado
  profesionalId: string             // uuid — quien realizó la evaluación
  numeroEvaluacion: number          // 1, 2, 3... (generado atómico por episodio)
  fechaEvaluacion: string           // 'YYYY-MM-DD'
  rangoMovimiento: Record<string, number> | null   // grados por segmento+movimiento
  fuerzaMuscular: Record<string, number> | null    // escala MRC 0-5 por músculo
  escalaDolor: number | null        // 0-10
  pruebasEspecificas: Record<string, PruebaEspecifica> | null
  inspeccion: string | null         // texto libre — hallazgos inspección
  palpacion: string | null          // texto libre — hallazgos palpación
  diagnostico: string | null        // diagnóstico fisioterapéutico
  observaciones: string | null
  createdAt: string                 // ISO 8601
  updatedAt: string                 // ISO 8601
}
```

### Tipos JSONB

```typescript
// Rango de movimiento — clave libre: segmento + movimiento + lado
// Ejemplos de claves: "hombroFlexionD", "hombroExtensionI", "codoFlexionD", "lumbarFlexion"
type RangoMovimiento = Record<string, number>

// Fuerza muscular — escala MRC 0-5 por músculo+lado
// Ejemplos de claves: "deltoidesD", "bicepsI", "cuadricepsD", "gluteoMayorI"
type FuerzaMuscular = Record<string, number>

// Prueba especial
interface PruebaEspecifica {
  resultado: 'positivo' | 'negativo' | 'dudoso'
  notas?: string   // max 200 chars
}

// Pruebas — clave libre: nombre de la prueba
// Ejemplos de claves: "laségue", "thomas", "apprehension", "mcMurray"
type PruebasEspecificas = Record<string, PruebaEspecifica>
```

---

## Crear evaluación — `POST`

**Body:**
```typescript
{
  fechaEvaluacion: string            // 'YYYY-MM-DD' requerido, no futura
  profesionalId: string              // uuid requerido
  rangoMovimiento?: Record<string, number>
  fuerzaMuscular?: Record<string, number>
  escalaDolor?: number               // 0-10
  pruebasEspecificas?: Record<string, {
    resultado: 'positivo' | 'negativo' | 'dudoso'
    notas?: string
  }>
  inspeccion?: string                // max 2000 chars
  palpacion?: string                 // max 2000 chars
  diagnostico?: string               // max 1000 chars
  observaciones?: string             // max 1000 chars
}
```

**Respuesta:** `201 Created` → `PhysicalEvaluation`

**Errores:**
- `404` — paciente o episodio no encontrado
- `400` — `fechaEvaluacion` es fecha futura
- `422` — episodio `cerrado` o `archivado`

**Nota:** `numeroEvaluacion` generado automáticamente (MAX+1 atómico por episodio). No enviar en body.

---

## Listar evaluaciones — `GET`

**Query params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | Página (default 1) |
| `limit` | number | Items por página (max 100, default 20) |
| `profesionalId` | uuid | Filtrar por profesional |
| `desde` | YYYY-MM-DD | Fecha inicio |
| `hasta` | YYYY-MM-DD | Fecha fin |

**Respuesta:**
```typescript
{
  data: PhysicalEvaluation[],
  meta: { total: number, page: number, limit: number, pages: number }
}
```

Ordenado por `numeroEvaluacion ASC`.

---

## Actualizar evaluación — `PATCH`

Todos los campos son opcionales. Los campos JSONB (`rangoMovimiento`, `fuerzaMuscular`, `pruebasEspecificas`) se **fusionan** con los existentes (merge shallow), no se reemplazan.

**Restricciones:**
- Solo el autor (`profesionalId`) o rol `admin` puede editar — `403` si no
- Episodio debe estar `abierto` o `en_tratamiento` — `422` si no

**Respuesta:** `200 OK` → `PhysicalEvaluation` actualizada. Redis `EVAL_ID` invalidado.

---

## Reglas de negocio

1. `numeroEvaluacion` es de solo lectura — no enviar en create ni patch
2. Episodio `cerrado` o `archivado` → evaluaciones inmutables (422)
3. PATCH en JSONB = merge, no replace — para reemplazar completo, enviar el objeto completo deseado
4. Múltiples evaluaciones por episodio permitidas — útil para seguimiento ROM durante tratamiento
5. `fechaEvaluacion` no puede ser futura (400)

---

## Cache Redis

| Clave | TTL | Invalidación |
|-------|-----|--------------|
| `eval:id:{id}` | 600s | PATCH |

No hay cache de lista (las evaluaciones cambian frecuentemente durante tratamiento).

---

## Archivos backend

```
src/modules/physical-evaluations/
  interfaces/evaluation.interfaces.ts     — RangoMovimiento, FuerzaMuscular, PruebasEspecificas
  entities/physical-evaluation.entity.ts
  dto/create-evaluation.dto.ts            — fechaEvaluacion + profesionalId req, resto opcional
  dto/update-evaluation.dto.ts            — PartialType de create
  dto/evaluation-query.dto.ts             — page, limit, profesionalId, desde, hasta
  physical-evaluations.service.ts
  physical-evaluations.controller.ts      ← /patients/:id/episodes/:id/evaluations
  physical-evaluations.module.ts

src/database/migrations/1747440009000-CreatePhysicalEvaluations.ts
```

---

## Ejemplos de uso

### Evaluación inicial de hombro

```json
POST /api/v1/patients/abc.../episodes/xyz.../evaluations
{
  "fechaEvaluacion": "2024-03-20",
  "profesionalId": "prof-uuid",
  "escalaDolor": 7,
  "rangoMovimiento": {
    "hombroFlexionD": 90,
    "hombroAbduccionD": 80,
    "hombroRotacionInternaD": 30,
    "hombroRotacionExternaD": 20
  },
  "fuerzaMuscular": {
    "deltoidesD": 3,
    "manguiRotadoresD": 2
  },
  "pruebasEspecificas": {
    "neer": { "resultado": "positivo" },
    "hawkins": { "resultado": "positivo", "notas": "dolor intenso" },
    "apprehension": { "resultado": "negativo" }
  },
  "inspeccion": "Postura antálgica. Hombro derecho en elevación leve. Atrofia muscular periesapular discreta.",
  "palpacion": "Dolor a palpación tendón supraespinoso. Punto gatillo activo trapecio superior D.",
  "diagnostico": "Síndrome de pinzamiento subacromial estadio II derecho"
}
```

### Seguimiento ROM — merge PATCH

```json
PATCH /api/v1/patients/abc.../episodes/xyz.../evaluations/eval-uuid
{
  "rangoMovimiento": {
    "hombroFlexionD": 120,
    "hombroAbduccionD": 100
  }
}
```
Resultado: ROM anterior se preserva, solo `hombroFlexionD` y `hombroAbduccionD` se actualizan.

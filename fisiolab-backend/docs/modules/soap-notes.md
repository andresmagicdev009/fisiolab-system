# Módulo: SOAP Notes (Notas de Evolución SOAP)

Base path: `/api/v1`

Todos los endpoints requieren `Authorization: Bearer <JWT>`.

> Una **Nota SOAP** registra la evolución clínica de una sesión de fisioterapia. Sigue el formato estándar MSP Ecuador: **S**ubjetivo → **O**bjetivo → **A**nálisis → **P**lan. Puede crearse directamente sobre un episodio (flujo libre) o vinculada a una `Session` de tipo `FISIOTERAPIA` dentro de un plan de tratamiento — en ese caso es el artefacto clínico de esa sesión. Ver [sessions.md](./sessions.md) y [clinical-episodes.md](./clinical-episodes.md).

---

## Estructura SOAP

| Sección     | Sigla | Descripción                                                      |
|-------------|-------|------------------------------------------------------------------|
| Subjetivo   | **S** | Lo que el paciente refiere: dolor, síntomas, evolución subjetiva |
| Objetivo    | **O** | Hallazgos del clínico: examen físico, signos vitales, ROM        |
| Análisis    | **A** | Interpretación clínica: diagnóstico fisioterapéutico, progreso   |
| Plan        | **P** | Intervención de la sesión y objetivos próxima consulta           |

---

## Entidad `SoapNote` (respuesta)

### Campos raíz

| Campo            | Tipo     | Nullable | Descripción                                                  |
|------------------|----------|----------|--------------------------------------------------------------|
| `id`             | `uuid`   | No       | Identificador único                                          |
| `episodeId`      | `uuid`   | No       | UUID del episodio clínico padre                              |
| `codigoHc`       | `string` | No       | Código HC desnormalizado (`HC-YYYY-NNNN`)                    |
| `pacienteId`     | `uuid`   | No       | UUID del paciente (desnormalizado)                           |
| `profesionalId`  | `uuid`   | No       | UUID del profesional que registra                            |
| `numeroSesion`   | `number` | No       | Número correlativo de sesión dentro del episodio (auto)      |
| `fechaSesion`    | `string` | No       | Fecha de la sesión `YYYY-MM-DD`                              |
| `subjetivo`      | `SoapS`  | No       | Ver objeto abajo                                             |
| `objetivo`       | `SoapO`  | No       | Ver objeto abajo                                             |
| `analisis`       | `SoapA`  | No       | Ver objeto abajo                                             |
| `plan`           | `SoapP`  | No       | Ver objeto abajo                                             |
| `sessionId`      | `uuid`   | Sí       | UUID de la `Session` a la que pertenece esta nota (si existe)|
| `observaciones`  | `string` | Sí       | Notas adicionales libres (máx 1000 chars)                    |
| `createdAt`      | `ISO 8601` | No     |                                                              |
| `updatedAt`      | `ISO 8601` | No     |                                                              |

### Objeto `SoapS` — Subjetivo

| Campo               | Tipo      | Nullable | Descripción                               |
|---------------------|-----------|----------|-------------------------------------------|
| `motivoSesion`      | `string`  | No       | Lo que refiere el paciente esta sesión    |
| `evaDolor`          | `number`  | Sí       | Escala EVA 0–10                           |
| `sintomasReferidos` | `string`  | Sí       | Síntomas adicionales referidos            |

### Objeto `SoapO` — Objetivo

| Campo                    | Tipo            | Nullable | Descripción                                      |
|--------------------------|-----------------|----------|--------------------------------------------------|
| `signosVitales`          | `SignosVitales` | Sí       | Ver objeto abajo                                 |
| `hallazgosExamenFisico`  | `string`        | Sí       | Hallazgos del examen físico (texto libre)        |
| `rangoMovimiento`        | `string`        | Sí       | ROM por articulación (texto libre o estructurado)|
| `fuerzaMuscular`         | `string`        | Sí       | Escala Daniels u otra (texto libre)              |
| `otrosHallazgos`         | `string`        | Sí       | Hallazgos adicionales relevantes                 |

### Objeto `SignosVitales`

| Campo          | Tipo     | Nullable | Ejemplo    | Descripción              |
|----------------|----------|----------|------------|--------------------------|
| `ta`           | `string` | Sí       | `"120/80"` | Tensión arterial mmHg    |
| `fc`           | `number` | Sí       | `72`       | Frecuencia cardíaca bpm  |
| `fr`           | `number` | Sí       | `16`       | Frecuencia respiratoria  |
| `temperatura`  | `number` | Sí       | `36.5`     | Temperatura °C           |
| `spo2`         | `number` | Sí       | `98`       | Saturación O₂ %          |
| `peso`         | `number` | Sí       | `70.5`     | Peso kg                  |
| `talla`        | `number` | Sí       | `1.72`     | Talla metros             |

### Objeto `SoapA` — Análisis

| Campo                         | Tipo     | Nullable | Descripción                                   |
|-------------------------------|----------|----------|-----------------------------------------------|
| `diagnosticoFisioterapeutico` | `string` | Sí       | Diagnóstico fisioterapéutico de la sesión     |
| `progresoVsAnterior`          | `string` | Sí       | Comparación objetiva vs sesión anterior       |
| `respuestaTratamiento`        | `string` | Sí       | Respuesta del paciente al tratamiento         |

### Objeto `SoapP` — Plan

| Campo                    | Tipo     | Nullable | Descripción                                    |
|--------------------------|----------|----------|------------------------------------------------|
| `tecnicasAplicadas`      | `string` | Sí       | Técnicas y modalidades aplicadas esta sesión  |
| `ejerciciosIndicados`    | `string` | Sí       | Ejercicios prescritos o realizados            |
| `objetivosProximaSesion` | `string` | Sí       | Metas para la próxima consulta               |
| `fechaProximaSesion`     | `string` | Sí       | `YYYY-MM-DD` — fecha sugerida próxima sesión  |

---

## DTOs

### `CreateSoapNoteDto`

| Campo           | Tipo       | Req | Validaciones                                              |
|-----------------|------------|-----|-----------------------------------------------------------|
| `fechaSesion`   | `string`   | Sí  | ISO date `YYYY-MM-DD`                                     |
| `profesionalId` | `uuid`     | Sí  | UUID válido en `users`                                    |
| `sessionId`     | `uuid`     | No  | UUID de `Session` tipo `FISIOTERAPIA` del mismo episodio  |
| `subjetivo`     | `SoapSDto` | Sí  | Ver abajo                                                 |
| `objetivo`      | `SoapODto` | Sí  | Ver abajo                                                 |
| `analisis`      | `SoapADto` | Sí  | Ver abajo (todos opcionales)                              |
| `plan`          | `SoapPDto` | Sí  | Ver abajo (todos opcionales)                              |
| `observaciones` | `string`   | No  | Máx 1000 chars                                            |

#### `SoapSDto` (dentro de `subjetivo`)

| Campo               | Tipo     | Req | Validaciones       |
|---------------------|----------|-----|--------------------|
| `motivoSesion`      | `string` | Sí  | 5–500 chars        |
| `evaDolor`          | `number` | No  | Entero 0–10        |
| `sintomasReferidos` | `string` | No  | Máx 500 chars      |

#### `SoapODto` (dentro de `objetivo`)

| Campo                   | Tipo              | Req | Validaciones     |
|-------------------------|-------------------|-----|------------------|
| `signosVitales`         | `SignosVitalesDto`| No  | Objeto anidado   |
| `hallazgosExamenFisico` | `string`          | No  | Máx 2000 chars   |
| `rangoMovimiento`       | `string`          | No  | Máx 1000 chars   |
| `fuerzaMuscular`        | `string`          | No  | Máx 500 chars    |
| `otrosHallazgos`        | `string`          | No  | Máx 1000 chars   |

#### `SignosVitalesDto`

| Campo         | Tipo     | Req | Validaciones         |
|---------------|----------|-----|----------------------|
| `ta`          | `string` | No  | Máx 10 chars         |
| `fc`          | `number` | No  | Entero 20–300        |
| `fr`          | `number` | No  | Entero 5–60          |
| `temperatura` | `number` | No  | Decimal 30.0–43.0    |
| `spo2`        | `number` | No  | Entero 50–100        |
| `peso`        | `number` | No  | Decimal 1.0–300.0    |
| `talla`       | `number` | No  | Decimal 0.3–2.5      |

#### `SoapADto` (dentro de `analisis`)

| Campo                         | Tipo     | Req | Validaciones   |
|-------------------------------|----------|-----|----------------|
| `diagnosticoFisioterapeutico` | `string` | No  | Máx 500 chars  |
| `progresoVsAnterior`          | `string` | No  | Máx 500 chars  |
| `respuestaTratamiento`        | `string` | No  | Máx 500 chars  |

#### `SoapPDto` (dentro de `plan`)

| Campo                    | Tipo     | Req | Validaciones         |
|--------------------------|----------|-----|----------------------|
| `tecnicasAplicadas`      | `string` | No  | Máx 1000 chars       |
| `ejerciciosIndicados`    | `string` | No  | Máx 1000 chars       |
| `objetivosProximaSesion` | `string` | No  | Máx 500 chars        |
| `fechaProximaSesion`     | `string` | No  | ISO date `YYYY-MM-DD`|

### `UpdateSoapNoteDto`

`PartialType` de `CreateSoapNoteDto` — todos los campos opcionales.

> Solo el autor (`profesionalId` original) o `admin` puede actualizar. Intentar con otro profesional → `403`.

### `SoapQueryDto` (query params)

| Param          | Tipo     | Default | Descripción                                    |
|----------------|----------|---------|------------------------------------------------|
| `page`         | `number` | `1`     | Página (mínimo 1)                              |
| `limit`        | `number` | `20`    | Registros por página (máximo 100)              |
| `profesionalId`| `uuid`   | —       | Filtra por profesional                         |
| `desde`        | `string` | —       | `fechaSesion >= desde` (`YYYY-MM-DD`)          |
| `hasta`        | `string` | —       | `fechaSesion <= hasta` (`YYYY-MM-DD`)          |

---

## Endpoints

---

### `POST /api/v1/patients/:patientId/episodes/:episodeId/soap`

Registra una nota SOAP para una sesión dentro del episodio.

**Roles:** `admin`, `medico`, `fisioterapeuta`

**Auditoría:** `CREATE_SOAP`

**Prerequisitos verificados en service:**
1. Paciente y episodio existen y coinciden
2. Episodio en `abierto` o `en_tratamiento` (422 si no)
3. `fechaSesion` no es futura (400)

**Path params:**

| Param       | Tipo   | Descripción        |
|-------------|--------|--------------------|
| `patientId` | `uuid` | UUID del paciente  |
| `episodeId` | `uuid` | UUID del episodio  |

**Request body:**

```json
{
  "fechaSesion": "2024-03-20",
  "profesionalId": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
  "subjetivo": {
    "motivoSesion": "Refiere mejoría del 30%. EVA bajó de 7 a 5. Aún con dolor nocturno.",
    "evaDolor": 5,
    "sintomasReferidos": "Hormigueo en cara lateral del pie derecho"
  },
  "objetivo": {
    "signosVitales": {
      "ta": "118/76",
      "fc": 68,
      "spo2": 98
    },
    "hallazgosExamenFisico": "Limitación flexión lumbar 60°. Lasègue (+) a 45° derecho.",
    "rangoMovimiento": "Flexión L: 60°, Extensión: 20°, Lat Dcha: 15°, Lat Izq: 25°",
    "fuerzaMuscular": "Glúteo mayor 4/5 bilateral. Cuádriceps 4/5 derecho."
  },
  "analisis": {
    "diagnosticoFisioterapeutico": "Síndrome radicular L4-L5 en fase subaguda con mejoría progresiva",
    "progresoVsAnterior": "Aumento ROM flexión lumbar de 45° a 60°. Reducción EVA 2 puntos.",
    "respuestaTratamiento": "Buena tolerancia a tracción lumbar. Respuesta positiva a TENS."
  },
  "plan": {
    "tecnicasAplicadas": "Tracción lumbar mecánica 20min, TENS 15min, Masoterapia paravertebral",
    "ejerciciosIndicados": "Williams modificado x10 reps, Puente glúteo x15 reps, Estiramiento isquiotibiales",
    "objetivosProximaSesion": "Alcanzar flexión 75°, reducir EVA a 3",
    "fechaProximaSesion": "2024-03-22"
  },
  "observaciones": "Paciente colaborador. Realizar radiografía de control."
}
```

**Response `201`:** objeto `SoapNote` completo con `numeroSesion` asignado.

```json
{
  "id": "e5f6a7b8-c9d0-1234-ef01-234567890123",
  "episodeId": "d4e5f6a7-b8c9-0123-def0-123456789012",
  "codigoHc": "HC-2024-0037",
  "pacienteId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "profesionalId": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
  "numeroSesion": 3,
  "fechaSesion": "2024-03-20",
  "subjetivo": { ... },
  "objetivo": { ... },
  "analisis": { ... },
  "plan": { ... },
  "observaciones": "Paciente colaborador. Realizar radiografía de control.",
  "createdAt": "2024-03-20T10:30:00Z",
  "updatedAt": "2024-03-20T10:30:00Z"
}
```

| Status | Descripción                                                           |
|--------|-----------------------------------------------------------------------|
| `201`  | Nota SOAP creada                                                      |
| `400`  | UUID inválido, campos con error, o `fechaSesion` futura              |
| `401`  | Token ausente o inválido                                              |
| `403`  | Rol insuficiente                                                      |
| `404`  | Paciente o episodio no encontrado                                     |
| `422`  | Episodio `cerrado` o `archivado` — no acepta nuevas notas            |

---

### `GET /api/v1/patients/:patientId/episodes/:episodeId/soap`

Lista las notas SOAP del episodio, ordenadas por `numeroSesion ASC`.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `LIST_SOAP`

**Path params:**

| Param       | Tipo   | Descripción        |
|-------------|--------|--------------------|
| `patientId` | `uuid` | UUID del paciente  |
| `episodeId` | `uuid` | UUID del episodio  |

**Query params:** `page`, `limit`, `profesionalId`, `desde`, `hasta`

**Response `200`:**

```json
{
  "data": [
    {
      "id": "e5f6a7b8-c9d0-1234-ef01-234567890123",
      "episodeId": "d4e5f6a7-b8c9-0123-def0-123456789012",
      "codigoHc": "HC-2024-0037",
      "profesionalId": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
      "numeroSesion": 3,
      "fechaSesion": "2024-03-20",
      "subjetivo": { "motivoSesion": "...", "evaDolor": 5 },
      "analisis": { "diagnosticoFisioterapeutico": "..." },
      "createdAt": "2024-03-20T10:30:00Z",
      "updatedAt": "2024-03-20T10:30:00Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20, "pages": 1 }
}
```

> Listado omite `objetivo.hallazgosExamenFisico`, `objetivo.otrosHallazgos`, `plan.ejerciciosIndicados`, `observaciones`. Disponibles en `GET /:soapId`.

| Status | Descripción               |
|--------|---------------------------|
| `200`  | Lista paginada            |
| `404`  | Paciente o episodio no encontrado |

---

### `GET /api/v1/patients/:patientId/episodes/:episodeId/soap/:soapId`

Obtiene una nota SOAP completa.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `READ_SOAP`

**Path params:**

| Param       | Tipo   | Descripción        |
|-------------|--------|--------------------|
| `patientId` | `uuid` | UUID del paciente  |
| `episodeId` | `uuid` | UUID del episodio  |
| `soapId`    | `uuid` | UUID de la nota    |

**Response `200`:** objeto `SoapNote` completo.

| Status | Descripción                                   |
|--------|-----------------------------------------------|
| `200`  | `SoapNote` completo                           |
| `404`  | Paciente, episodio o nota no encontrada       |

---

### `PATCH /api/v1/patients/:patientId/episodes/:episodeId/soap/:soapId`

Actualiza una nota SOAP. Solo el autor original o `admin`.

**Roles:** `admin`, `medico`, `fisioterapeuta`

**Auditoría:** `UPDATE_SOAP`

**Path params:**

| Param       | Tipo   | Descripción        |
|-------------|--------|--------------------|
| `patientId` | `uuid` | UUID del paciente  |
| `episodeId` | `uuid` | UUID del episodio  |
| `soapId`    | `uuid` | UUID de la nota    |

**Request body:** cualquier subconjunto de `UpdateSoapNoteDto`.

**Response `200`:** objeto `SoapNote` actualizado.

| Status | Descripción                                                        |
|--------|--------------------------------------------------------------------|
| `200`  | `SoapNote` actualizado                                             |
| `403`  | Rol insuficiente o profesional distinto al autor                   |
| `404`  | Paciente, episodio o nota no encontrada                            |
| `422`  | Episodio `cerrado` o `archivado` — nota inmutable                 |

---

## Tabla de permisos

| Endpoint                                             | admin | medico | fisioterapeuta | pasante |
|------------------------------------------------------|:-----:|:------:|:--------------:|:-------:|
| `POST /patients/:id/episodes/:eid/soap`              | ✓     | ✓      | ✓              |         |
| `GET /patients/:id/episodes/:eid/soap`               | ✓     | ✓      | ✓              | ✓       |
| `GET /patients/:id/episodes/:eid/soap/:sid`          | ✓     | ✓      | ✓              | ✓       |
| `PATCH /patients/:id/episodes/:eid/soap/:sid`        | ✓     | ✓ (propio) | ✓ (propio) |         |

---

## Reglas de negocio

1. **Episodio activo obligatorio** — crear nota en episodio `cerrado`/`archivado` → `422`.
2. **`numeroSesion` autogenerado** — se calcula como `MAX(numero_sesion) + 1` dentro del episodio en el mismo INSERT; no se acepta en el body.
3. **`fechaSesion` no futura** — no se puede registrar una sesión con fecha posterior a hoy → `400`.
4. **Edición restringida por autor** — solo el `profesionalId` que creó la nota o un `admin` puede hacer `PATCH`. Otro profesional → `403`.
5. **Nota en episodio cerrado/archivado inmutable** — `PATCH` → `422`.
6. **`codigoHc` desnormalizado** — copiado del episodio al crear para trazabilidad histórica.
7. **Secciones S y O obligatorias** al crear — `subjetivo` y `objetivo` son objetos requeridos (aunque sus campos internos sean mayoritariamente opcionales).
8. **`sessionId` opcional pero validado** — si se provee, la `Session` referenciada debe: (a) pertenecer al mismo episodio, (b) ser de tipo `FISIOTERAPIA`, (c) no tener ya una nota SOAP vinculada (409). Al vincularse, la sesión auto-transiciona a `EN_CURSO`.
9. **Sin `sessionId`** — flujo libre, nota standalone. No afecta progreso de ningún plan.

---

## Eventos de auditoría

| Evento        | Trigger                                                  |
|---------------|----------------------------------------------------------|
| `CREATE_SOAP` | `POST /patients/:id/episodes/:eid/soap`                  |
| `LIST_SOAP`   | `GET /patients/:id/episodes/:eid/soap`                   |
| `READ_SOAP`   | `GET /patients/:id/episodes/:eid/soap/:sid`              |
| `UPDATE_SOAP` | `PATCH /patients/:id/episodes/:eid/soap/:sid`            |

---

## Estructura DB — columnas JSONB

Los 4 campos SOAP (`subjetivo`, `objetivo`, `analisis`, `plan`) y `signos_vitales` se almacenan como `jsonb` en PostgreSQL para flexibilidad clínica sin migraciones adicionales al agregar sub-campos.

```sql
CREATE TABLE "soap_notes" (
  "id"              uuid PRIMARY KEY,
  "session_id"      uuid NULL REFERENCES sessions(id) ON DELETE SET NULL,   -- nullable, vinculada a Session
  "episode_id"      uuid NOT NULL REFERENCES clinical_episodes(id) ON DELETE RESTRICT,
  "codigo_hc"       varchar(15) NOT NULL,
  "patient_id"      uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  "profesional_id"  uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  "numero_sesion"   integer NOT NULL,
  "fecha_sesion"    date NOT NULL,
  "subjetivo"       jsonb NOT NULL,
  "objetivo"        jsonb NOT NULL,
  "analisis"        jsonb NOT NULL DEFAULT '{}',
  "plan"            jsonb NOT NULL DEFAULT '{}',
  "observaciones"   text,
  "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMP NOT NULL DEFAULT now()
);
```

> Índice único `(episode_id, numero_sesion)` garantiza correlatividad. Índice en `fecha_sesion` para queries de rango. Índice en `session_id`. Constraint único en `session_id` (una nota por sesión) cuando `session_id IS NOT NULL`.

---

## Notas de implementación

- Cache Redis: `GET /:soapId` → `SOAP_ID(id)` TTL 300s. Invalidar en `PATCH`.
- Listado por episodio NO se cachea.
- `numero_sesion` calculado con `SELECT MAX(numero_sesion) + 1` en transacción atómica (igual que `tarjetero-indice`).
- Migración creación: `1747440008000-CreateSoapNotes`. Migración `session_id`: `1747440014000-AddSessionIdToArtifacts`.
- Al crear con `sessionId`: en la misma transacción → validar sesión, vincular, auto-transicionar sesión a `EN_CURSO`, invalidar `SESSION_ID(sessionId)`.
- Frontend: tab **"Historia Clínica"** muestra notas SOAP standalone; tab **"Tratamiento"** muestra notas vinculadas a plan a través de `Session`.

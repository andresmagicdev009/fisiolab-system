# Módulo: Clinical Episodes (Episodios Clínicos)

Base path: `/api/v1`

Todos los endpoints requieren `Authorization: Bearer <JWT>`.

> Un **Episodio Clínico** es el contenedor principal de la historia clínica de un paciente para una atención específica (ej: dolor lumbar, fractura de mano). Agrupa notas SOAP, evaluaciones físicas, planes de tratamiento y pagos. Un paciente puede tener **múltiples episodios activos simultáneos** cuando presenta patologías independientes. Prerequisito: el paciente debe tener un `TarjeteroIndice` activo. Ver [tarjetero-indice.md](./tarjetero-indice.md).

---

## Máquina de estados

```
abierto ──► en_tratamiento ──► cerrado ──► archivado
                                            (solo admin)
```

| Transición                        | Quién puede         | Requisito                      |
|-----------------------------------|---------------------|--------------------------------|
| `abierto` → `en_tratamiento`      | MEDICO, FISIO, ADMIN | `PATCH` con `estado`           |
| `en_tratamiento` → `cerrado`      | MEDICO, FISIO, ADMIN | `POST /close` con `notaCierre` |
| `cerrado` → `archivado`           | solo ADMIN          | `PATCH` con `estado`           |
| Cualquier → `abierto`             | ❌ no permitido      | Crear nuevo episodio           |

---

## Entidad `ClinicalEpisode` (respuesta)

| Campo                   | Tipo                 | Nullable | Descripción                                        |
|-------------------------|----------------------|----------|----------------------------------------------------|
| `id`                    | `uuid`               | No       | Identificador único                                |
| `tarjeteroId`           | `uuid`               | No       | UUID del tarjetero índice del paciente             |
| `codigoHc`              | `string`             | No       | Código HC desnormalizado: `HC-YYYY-NNNN`           |
| `pacienteId`            | `uuid`               | No       | UUID del paciente (desnormalizado)                 |
| `paciente`              | `PatientResumen`     | No       | Ver abajo                                          |
| `profesionalId`         | `uuid`               | No       | UUID del profesional responsable                   |
| `estado`                | `EstadoEpisodio`     | No       | Ver enum abajo                                     |
| `motivoConsulta`        | `string`             | No       | Razón de la consulta                               |
| `diagnosticoPrincipal`  | `string`             | Sí       | Descripción diagnóstico principal                  |
| `codigoCie10`           | `string`             | Sí       | Código CIE-10, ej. `M54.5`                         |
| `diagnosticoSecundario` | `string`             | Sí       | Diagnóstico secundario (texto libre)               |
| `notaApertura`          | `string`             | Sí       | Nota inicial del episodio                          |
| `notaCierre`            | `string`             | Sí       | Nota de cierre — obligatoria al cerrar             |
| `fechaApertura`         | `string (date)`      | No       | `YYYY-MM-DD` — asignado automáticamente al crear  |
| `fechaCierre`           | `string (date)`      | Sí       | `YYYY-MM-DD` — asignado automáticamente al cerrar |
| `appointmentId`         | `uuid`               | Sí       | Reservado para módulo `appointments` (futuro)      |
| `createdAt`             | `ISO 8601`           | No       |                                                    |
| `updatedAt`             | `ISO 8601`           | No       |                                                    |

### Objeto anidado `PatientResumen`

| Campo       | Tipo     | Descripción                     |
|-------------|----------|---------------------------------|
| `id`        | `uuid`   |                                 |
| `cedula`    | `string` |                                 |
| `nombres`   | `string` |                                 |
| `apellidos` | `string` |                                 |
| `genero`    | `Genero` | `masculino \| femenino \| otro` |

### Enum `EstadoEpisodio`

| Valor           | Descripción                                          |
|-----------------|------------------------------------------------------|
| `abierto`       | Recién creado, en evaluación inicial                 |
| `en_tratamiento`| Diagnóstico establecido, tratamiento activo          |
| `cerrado`       | Alta médica — requiere `notaCierre`                  |
| `archivado`     | Archivado definitivo — solo `admin`                  |

---

## DTOs

### `CreateEpisodioDto`

| Campo            | Tipo     | Req | Validaciones                                   |
|------------------|----------|-----|------------------------------------------------|
| `motivoConsulta` | `string` | Sí  | 5–500 chars                                    |
| `profesionalId`  | `uuid`   | Sí  | UUID válido, debe existir en `users`           |
| `notaApertura`   | `string` | No  | Máx. 2000 chars                                |
| `appointmentId`  | `uuid`   | No  | Reservado — UUID válido si se provee           |

> `fechaApertura`, `codigoHc`, `estado` (`abierto`) son **generados por el sistema**.

### `UpdateEpisodioDto`

| Campo                   | Tipo             | Req | Validaciones                                    |
|-------------------------|------------------|-----|-------------------------------------------------|
| `motivoConsulta`        | `string`         | No  | 5–500 chars                                     |
| `profesionalId`         | `uuid`           | No  | UUID válido, debe existir en `users`            |
| `diagnosticoPrincipal`  | `string`         | No  | Máx. 255 chars                                  |
| `codigoCie10`           | `string`         | No  | Máx. 10 chars, formato `A00` o `A00.0`         |
| `diagnosticoSecundario` | `string`         | No  | Máx. 255 chars                                  |
| `notaApertura`          | `string`         | No  | Máx. 2000 chars                                 |
| `estado`                | `EstadoEpisodio` | No  | Solo `abierto → en_tratamiento` y `cerrado → archivado` (admin) |

> Para cerrar un episodio usar `POST /:id/close`, no este DTO.

### `CloseEpisodioDto`

| Campo                  | Tipo     | Req | Validaciones                      |
|------------------------|----------|-----|-----------------------------------|
| `notaCierre`           | `string` | Sí  | 10–2000 chars                     |
| `diagnosticoPrincipal` | `string` | No  | Máx. 255 chars (puede actualizar) |
| `codigoCie10`          | `string` | No  | Máx. 10 chars                     |

### `EpisodioQueryDto` (query params de listados)

| Param          | Tipo             | Default | Descripción                                          |
|----------------|------------------|---------|------------------------------------------------------|
| `page`         | `number`         | `1`     | Página (mínimo 1)                                    |
| `limit`        | `number`         | `20`    | Registros por página (máximo 100)                    |
| `estado`       | `EstadoEpisodio` | —       | Filtra por estado                                    |
| `profesionalId`| `uuid`           | —       | Filtra por profesional responsable                   |
| `search`       | `string`         | —       | Busca en `motivoConsulta` y `diagnosticoPrincipal`   |
| `desde`        | `string (date)`  | —       | Filtra `fechaApertura >= desde` (`YYYY-MM-DD`)       |
| `hasta`        | `string (date)`  | —       | Filtra `fechaApertura <= hasta` (`YYYY-MM-DD`)       |

---

## Endpoints

---

### `POST /api/v1/patients/:patientId/episodes`

Abre un nuevo episodio clínico para el paciente.

**Roles:** `admin`, `medico`, `fisioterapeuta`

**Auditoría:** `CREATE_EPISODE`

**Prerequisitos verificados en service:**
1. Paciente existe
2. Paciente tiene tarjetero con `estado = activo`

**Path params:**

| Param       | Tipo   | Descripción        |
|-------------|--------|--------------------|
| `patientId` | `uuid` | UUID del paciente  |

**Request body:**

```json
{
  "motivoConsulta": "Dolor lumbar crónico con irradiación a miembro inferior derecho",
  "profesionalId": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
  "notaApertura": "Paciente refiere 3 semanas de evolución. EVA 7/10."
}
```

**Response `201`:**

```json
{
  "id": "d4e5f6a7-b8c9-0123-def0-123456789012",
  "tarjeteroId": "c3d4e5f6-a7b8-9012-cdef-012345678901",
  "codigoHc": "HC-2024-0037",
  "pacienteId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "paciente": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "cedula": "1713175071",
    "nombres": "Juan Carlos",
    "apellidos": "Rodríguez Pérez",
    "genero": "masculino"
  },
  "profesionalId": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
  "estado": "abierto",
  "motivoConsulta": "Dolor lumbar crónico con irradiación a miembro inferior derecho",
  "diagnosticoPrincipal": null,
  "codigoCie10": null,
  "diagnosticoSecundario": null,
  "notaApertura": "Paciente refiere 3 semanas de evolución. EVA 7/10.",
  "notaCierre": null,
  "fechaApertura": "2024-03-15",
  "fechaCierre": null,
  "appointmentId": null,
  "createdAt": "2024-03-15T10:30:00Z",
  "updatedAt": "2024-03-15T10:30:00Z"
}
```

| Status | Descripción                                                           |
|--------|-----------------------------------------------------------------------|
| `201`  | Episodio creado                                                       |
| `400`  | UUID inválido o campos con error                                      |
| `401`  | Token ausente o inválido                                              |
| `403`  | Rol insuficiente                                                      |
| `404`  | Paciente no encontrado o sin tarjetero                                |
| `422`  | Tarjetero del paciente está `inactivo` o `archivado`                 |

---

### `GET /api/v1/patients/:patientId/episodes`

Lista todos los episodios del paciente, ordenados por `fechaApertura DESC`.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `LIST_EPISODES`

**Path params:**

| Param       | Tipo   | Descripción        |
|-------------|--------|--------------------|
| `patientId` | `uuid` | UUID del paciente  |

**Query params:** `page`, `limit`, `estado`

**Response `200`:**

```json
{
  "data": [
    {
      "id": "d4e5f6a7-b8c9-0123-def0-123456789012",
      "codigoHc": "HC-2024-0037",
      "pacienteId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "profesionalId": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
      "estado": "abierto",
      "motivoConsulta": "Dolor lumbar crónico",
      "diagnosticoPrincipal": null,
      "codigoCie10": null,
      "fechaApertura": "2024-03-15",
      "fechaCierre": null,
      "createdAt": "2024-03-15T10:30:00Z",
      "updatedAt": "2024-03-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

> `notaApertura`, `notaCierre`, `diagnosticoSecundario` y objeto `paciente` se omiten en listados. Disponibles en `GET /:episodeId`.

| Status | Descripción               |
|--------|---------------------------|
| `200`  | Lista paginada            |
| `400`  | UUID o query inválidos    |
| `401`  | Token ausente o inválido  |
| `403`  | Rol insuficiente          |
| `404`  | Paciente no encontrado    |

---

### `GET /api/v1/patients/:patientId/episodes/:episodeId`

Obtiene un episodio completo (todos los campos).

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `READ_EPISODE`

**Path params:**

| Param       | Tipo   | Descripción         |
|-------------|--------|---------------------|
| `patientId` | `uuid` | UUID del paciente   |
| `episodeId` | `uuid` | UUID del episodio   |

**Response `200`:** objeto `ClinicalEpisode` completo con `paciente` anidado.

| Status | Descripción                                          |
|--------|------------------------------------------------------|
| `200`  | `ClinicalEpisode` completo                           |
| `400`  | UUID con formato inválido                            |
| `401`  | Token ausente o inválido                             |
| `403`  | Rol insuficiente                                     |
| `404`  | Paciente o episodio no encontrado                    |

---

### `PATCH /api/v1/patients/:patientId/episodes/:episodeId`

Actualiza campos del episodio o cambia estado (solo transiciones permitidas).

**Roles:** `admin`, `medico`, `fisioterapeuta`

**Auditoría:** `UPDATE_EPISODE`

**Path params:**

| Param       | Tipo   | Descripción         |
|-------------|--------|---------------------|
| `patientId` | `uuid` | UUID del paciente   |
| `episodeId` | `uuid` | UUID del episodio   |

**Request body:** cualquier subconjunto de `UpdateEpisodioDto`.

```json
{
  "diagnosticoPrincipal": "Lumbalgia mecánica con radiculopatía L4-L5",
  "codigoCie10": "M51.1",
  "estado": "en_tratamiento"
}
```

**Response `200`:** objeto `ClinicalEpisode` actualizado.

| Status | Descripción                                                    |
|--------|----------------------------------------------------------------|
| `200`  | `ClinicalEpisode` actualizado                                  |
| `400`  | UUID inválido o campos con error                               |
| `401`  | Token ausente o inválido                                       |
| `403`  | Rol insuficiente, o transición de estado no permitida          |
| `404`  | Paciente o episodio no encontrado                              |
| `422`  | Episodio ya cerrado/archivado — no se puede editar            |

---

### `POST /api/v1/patients/:patientId/episodes/:episodeId/close`

Cierra el episodio. Establece `estado = cerrado`, `fechaCierre = hoy` y registra `notaCierre`.

**Roles:** `admin`, `medico`, `fisioterapeuta`

**Auditoría:** `CLOSE_EPISODE`

**Path params:**

| Param       | Tipo   | Descripción         |
|-------------|--------|---------------------|
| `patientId` | `uuid` | UUID del paciente   |
| `episodeId` | `uuid` | UUID del episodio   |

**Prerequisito:** episodio debe estar en `abierto` o `en_tratamiento`.

**Request body:**

```json
{
  "notaCierre": "Alta por mejoría clínica. EVA 2/10. Paciente tolera actividades cotidianas sin dolor significativo.",
  "diagnosticoPrincipal": "Lumbalgia mecánica con radiculopatía L4-L5",
  "codigoCie10": "M51.1"
}
```

**Response `200`:** objeto `ClinicalEpisode` con `estado = cerrado` y `fechaCierre` seteada.

| Status | Descripción                                                    |
|--------|----------------------------------------------------------------|
| `200`  | Episodio cerrado                                               |
| `400`  | UUID inválido o `notaCierre` ausente/muy corta                |
| `401`  | Token ausente o inválido                                       |
| `403`  | Rol insuficiente                                               |
| `404`  | Paciente o episodio no encontrado                              |
| `422`  | Episodio ya está `cerrado` o `archivado`                      |

---

### `GET /api/v1/episodes`

Lista todos los episodios del sistema con filtros. Uso principal: administración y reportes.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `LIST_EPISODES_GLOBAL`

**Query params:** todos los de `EpisodioQueryDto`.

```
GET /api/v1/episodes?estado=en_tratamiento&page=1&limit=20
GET /api/v1/episodes?profesionalId=uuid&desde=2024-01-01&hasta=2024-12-31
GET /api/v1/episodes?search=lumbalgia
```

**Response `200`:** igual que `GET /patients/:id/episodes` pero incluye objeto `paciente` en cada item.

| Status | Descripción              |
|--------|--------------------------|
| `200`  | Lista paginada           |
| `400`  | Query params inválidos   |
| `401`  | Token ausente o inválido |
| `403`  | Rol insuficiente         |

---

## Tabla de permisos

| Endpoint                                          | admin | medico | fisioterapeuta | pasante |
|---------------------------------------------------|:-----:|:------:|:--------------:|:-------:|
| `POST /patients/:id/episodes`                     | ✓     | ✓      | ✓              |         |
| `GET /patients/:id/episodes`                      | ✓     | ✓      | ✓              | ✓       |
| `GET /patients/:id/episodes/:eid`                 | ✓     | ✓      | ✓              | ✓       |
| `PATCH /patients/:id/episodes/:eid`               | ✓     | ✓      | ✓              |         |
| `POST /patients/:id/episodes/:eid/close`          | ✓     | ✓      | ✓              |         |
| `PATCH` (→ `archivado`)                           | ✓     |        |                |         |
| `GET /episodes`                                   | ✓     | ✓      | ✓              | ✓       |

---

## Reglas de negocio

1. **Tarjetero activo obligatorio** — si el paciente no tiene tarjetero o su estado es `inactivo`/`archivado`, `POST` retorna `422`.
2. **Múltiples episodios activos permitidos** — un paciente puede tener varios episodios simultáneos por patologías diferentes (ej: dolor de hombro y dolor de mano son casos independientes).
3. **Episodio cerrado es inmutable** — `PATCH` sobre episodio `cerrado` o `archivado` → `422`. Excepción: ADMIN puede cambiar `cerrado → archivado`.
4. **`notaCierre` obligatoria al cerrar** — `POST /close` sin `notaCierre` → `400`.
5. **`fechaCierre` autogenerada** — se asigna en el momento del cierre; no se acepta en el body.
6. **`codigoHc` desnormalizado** — se copia del tarjetero al crear el episodio para consultas históricas (si el tarjetero cambia de código no afecta episodios anteriores).
7. **Prerequisito de SOAP / evaluaciones** — los módulos `soap-notes` y `physical-evaluations` referencian `episode_id`. Un episodio `archivado` no acepta nuevos registros hijos.

---

## Eventos de auditoría

| Evento                  | Trigger                                              |
|-------------------------|------------------------------------------------------|
| `CREATE_EPISODE`        | `POST /patients/:id/episodes`                        |
| `LIST_EPISODES`         | `GET /patients/:id/episodes`                         |
| `READ_EPISODE`          | `GET /patients/:id/episodes/:eid`                    |
| `UPDATE_EPISODE`        | `PATCH /patients/:id/episodes/:eid`                  |
| `CLOSE_EPISODE`         | `POST /patients/:id/episodes/:eid/close`             |
| `LIST_EPISODES_GLOBAL`  | `GET /episodes`                                      |

---

## Notas de implementación

- Cache Redis: `GET /:eid` → TTL 300 s. Invalidar en cada `PATCH` y `POST /close`.
- Listados NO se cachean (cambian frecuentemente).
- Listado de paciente (`GET /patients/:id/episodes`) ordenado por `fechaApertura DESC`.
- Listado global (`GET /episodes`) ordenado por `fechaApertura DESC`.
- `codigoHc` se copia del tarjetero en el momento del INSERT — JOIN no necesario en queries frecuentes.
- Migración: `1747440007000-CreateClinicalEpisodes`.
- Módulos hijos que dependen de `episode_id`: `soap_notes`, `physical_evaluations`, `treatment_plans`, `session_payments`.

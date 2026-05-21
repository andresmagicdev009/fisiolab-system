# Módulo: Tarjetero Índice

Base path: `/api/v1`

Todos los endpoints requieren `Authorization: Bearer <JWT>`.

> El **Tarjetero Índice** es el registro maestro que asigna un código único de Historia Clínica (`HC-YYYY-NNNN`) a cada paciente. Es prerrequisito para abrir episodios clínicos. Se crea una sola vez por paciente, durante el onboarding.

---

## Entidad `TarjeteroIndice` (respuesta)

| Campo                 | Tipo              | Nullable | Descripción                                  |
|-----------------------|-------------------|----------|----------------------------------------------|
| `id`                  | `uuid`            | No       | Identificador interno                        |
| `codigoHc`            | `string`          | No       | Código HC generado: `HC-YYYY-NNNN`           |
| `pacienteId`          | `uuid`            | No       | UUID del paciente propietario                |
| `paciente`            | `PatientResumen`  | No       | Datos básicos del paciente (ver abajo)       |
| `medicoResponsableId` | `uuid`            | Sí       | UUID del profesional responsable             |
| `estado`              | `EstadoTarjetero` | No       | `activo \| inactivo \| archivado`            |
| `observaciones`       | `string`          | Sí       | Notas libres sobre el tarjetero              |
| `fechaApertura`       | `string (date)`   | No       | Fecha de apertura `YYYY-MM-DD`               |
| `createdAt`           | `ISO 8601`        | No       |                                              |
| `updatedAt`           | `ISO 8601`        | No       |                                              |

### Objeto anidado `PatientResumen`

| Campo       | Tipo     | Descripción              |
|-------------|----------|--------------------------|
| `id`        | `uuid`   |                          |
| `cedula`    | `string` |                          |
| `nombres`   | `string` |                          |
| `apellidos` | `string` |                          |
| `genero`    | `Genero` | `masculino\|femenino\|otro` |

### Enum `EstadoTarjetero`

| Valor        | Descripción                                              |
|--------------|----------------------------------------------------------|
| `activo`     | Tarjetero en uso normal (default al crear)               |
| `inactivo`   | Temporalmente desactivado (sin perder historial)         |
| `archivado`  | Archivado definitivo — solo `admin` puede asignarlo      |

### Formato del código `HC`

```
HC-{YYYY}-{NNNN}
```

- `YYYY` — año de apertura (4 dígitos)
- `NNNN` — secuencia correlativa del año, zero-padded a 4 dígitos, reinicia cada año
- Ejemplos: `HC-2024-0001`, `HC-2025-0142`
- **Generado por el sistema** — no se acepta en el body del request

---

## DTOs

### `CreateTarjeteroDto`

| Campo                 | Tipo     | Req | Validaciones                    |
|-----------------------|----------|-----|---------------------------------|



| `medicoResponsableId` | `uuid`   | No  | UUID válido, debe existir en DB |
| `observaciones`       | `string` | No  | Máx. 500 chars                  |

> El `codigoHc` y `fechaApertura` son **generados automáticamente**. No se aceptan en el body.

### `UpdateTarjeteroDto`

| Campo                 | Tipo              | Req | Validaciones                                    |
|-----------------------|-------------------|-----|-------------------------------------------------|
| `medicoResponsableId` | `uuid`            | No  | UUID válido, debe existir en DB                 |
| `estado`              | `EstadoTarjetero` | No  | `activo\|inactivo\|archivado` — ver restricción |
| `observaciones`       | `string`          | No  | Máx. 500 chars                                  |

> Cambiar `estado` a `archivado` requiere rol `admin`. Intentarlo con otro rol → `403`.

### `TarjeteroQueryDto` (query params de `GET /tarjetero`)

| Param      | Tipo              | Default | Descripción                                              |
|------------|-------------------|---------|----------------------------------------------------------|
| `page`     | `number`          | `1`     | Página (mínimo 1)                                        |
| `limit`    | `number`          | `20`    | Registros por página (máximo 100)                        |
| `search`   | `string`          | —       | Busca en `nombres`, `apellidos`, `cedula` del paciente   |
| `codigoHc` | `string`          | —       | Filtro exacto por código HC (ej. `HC-2024-0001`)         |
| `estado`   | `EstadoTarjetero` | —       | Filtra por estado                                        |
| `anio`     | `number`          | —       | Filtra por año del código HC (ej. `2024`)                |

---

## Endpoints

---

### `POST /api/v1/patients/:patientId/tarjetero`

Crea el tarjetero índice del paciente. **Llamado durante el onboarding, después de crear el paciente.**

**Roles:** `admin`, `medico`, `fisioterapeuta`

**Auditoría:** `CREATE_TARJETERO`

**Path params:**

| Param       | Tipo   | Descripción        |
|-------------|--------|--------------------|
| `patientId` | `uuid` | UUID del paciente  |

**Request body:**

```json
{
  "medicoResponsableId": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
  "observaciones": "Paciente referido por Dr. Ramírez"
}
```

> Body vacío `{}` también es válido — todos los campos son opcionales.

**Response `201`:**

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
  "codigoHc": "HC-2024-0037",
  "pacienteId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "paciente": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "cedula": "1713175071",
    "nombres": "Juan Carlos",
    "apellidos": "Rodríguez Pérez",
    "genero": "masculino"
  },
  "medicoResponsableId": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
  "estado": "activo",
  "observaciones": "Paciente referido por Dr. Ramírez",
  "fechaApertura": "2024-03-15",
  "createdAt": "2024-03-15T10:30:00Z",
  "updatedAt": "2024-03-15T10:30:00Z"
}
```

| Status | Descripción                                              |
|--------|----------------------------------------------------------|
| `201`  | Tarjetero creado                                         |
| `400`  | UUID de paciente con formato inválido                    |
| `401`  | Token ausente o inválido                                 |
| `403`  | Rol insuficiente                                         |
| `404`  | Paciente no encontrado                                   |
| `409`  | El paciente ya tiene un tarjetero — solo se permite uno  |

---

### `GET /api/v1/patients/:patientId/tarjetero`

Obtiene el tarjetero índice de un paciente.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `READ_TARJETERO`

**Path params:**

| Param       | Tipo   | Descripción        |
|-------------|--------|--------------------|
| `patientId` | `uuid` | UUID del paciente  |

**Response `200`:** objeto `TarjeteroIndice` completo.

| Status | Descripción                       |
|--------|-----------------------------------|
| `200`  | `TarjeteroIndice`                 |
| `400`  | UUID con formato inválido         |
| `401`  | Token ausente o inválido          |
| `403`  | Rol insuficiente                  |
| `404`  | Paciente o tarjetero no encontrado |

---

### `PATCH /api/v1/patients/:patientId/tarjetero`

Actualiza el médico responsable, estado u observaciones del tarjetero.

**Roles:** `admin`, `medico`, `fisioterapeuta` (ver restricción de `archivado`)

**Auditoría:** `UPDATE_TARJETERO`

**Path params:**

| Param       | Tipo   | Descripción        |
|-------------|--------|--------------------|
| `patientId` | `uuid` | UUID del paciente  |

**Request body:**

```json
{
  "estado": "inactivo",
  "observaciones": "Paciente fuera del país temporalmente"
}
```

**Response `200`:** objeto `TarjeteroIndice` actualizado.

| Status | Descripción                                           |
|--------|-------------------------------------------------------|
| `200`  | `TarjeteroIndice` actualizado                         |
| `400`  | UUID inválido o campos con error                      |
| `401`  | Token ausente o inválido                              |
| `403`  | Rol insuficiente, o intento de archivar sin ser admin |
| `404`  | Paciente o tarjetero no encontrado                    |

---

### `GET /api/v1/tarjetero`

Lista y busca tarjeteros con paginación. Uso principal: recepción y administración.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `LIST_TARJETERO`

**Query params:**

```
GET /api/v1/tarjetero?page=1&limit=20&search=rodriguez
GET /api/v1/tarjetero?codigoHc=HC-2024-0037
GET /api/v1/tarjetero?anio=2024&estado=activo
```

**Response `200`:**

```json
{
  "data": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
      "codigoHc": "HC-2024-0037",
      "pacienteId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "paciente": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "cedula": "1713175071",
        "nombres": "Juan Carlos",
        "apellidos": "Rodríguez Pérez",
        "genero": "masculino"
      },
      "medicoResponsableId": "b2c3d4e5-f6a7-8901-bcde-f01234567890",
      "estado": "activo",
      "fechaApertura": "2024-03-15",
      "createdAt": "2024-03-15T10:30:00Z",
      "updatedAt": "2024-03-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

> `observaciones` se omite en listados para reducir payload. Disponible en `GET /patients/:id/tarjetero`.

| Status | Descripción              |
|--------|--------------------------|
| `200`  | Página de tarjeteros     |
| `400`  | Query params inválidos   |
| `401`  | Token ausente o inválido |
| `403`  | Rol insuficiente         |

---

### `GET /api/v1/tarjetero/by-codigo/:codigoHc`

Busca un tarjetero por código HC exacto. Uso principal: búsqueda rápida en recepción.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `READ_TARJETERO`

**Path params:**

| Param      | Tipo     | Descripción                       |
|------------|----------|-----------------------------------|
| `codigoHc` | `string` | Código exacto, ej. `HC-2024-0037` |

**Ejemplo:**

```
GET /api/v1/tarjetero/by-codigo/HC-2024-0037
```

**Response `200`:** objeto `TarjeteroIndice` completo.

| Status | Descripción                    |
|--------|--------------------------------|
| `200`  | `TarjeteroIndice`              |
| `400`  | Formato de código inválido     |
| `401`  | Token ausente o inválido       |
| `403`  | Rol insuficiente               |
| `404`  | Código HC no encontrado        |

---

## Tabla de permisos

| Endpoint                                        | admin | medico | fisioterapeuta | pasante |
|-------------------------------------------------|:-----:|:------:|:--------------:|:-------:|
| `POST /patients/:id/tarjetero`                  | ✓     | ✓      | ✓              |         |
| `GET /patients/:id/tarjetero`                   | ✓     | ✓      | ✓              | ✓       |
| `PATCH /patients/:id/tarjetero`                 | ✓     | ✓      | ✓              |         |
| `PATCH /patients/:id/tarjetero` (→ archivado)   | ✓     |        |                |         |
| `GET /tarjetero`                                | ✓     | ✓      | ✓              | ✓       |
| `GET /tarjetero/by-codigo/:codigoHc`            | ✓     | ✓      | ✓              | ✓       |

---

## Reglas de negocio

1. **1:1 con paciente** — un paciente solo puede tener un tarjetero. Intentar crear un segundo → `409`.
2. **Código HC inmutable** — el `codigoHc` no puede modificarse una vez asignado.
3. **Secuencia anual** — `NNNN` es correlativo por año; al iniciar un nuevo año arranca desde `0001`.
4. **Archivado solo por admin** — cambiar `estado` a `archivado` requiere rol `admin`. Otros roles pueden cambiar entre `activo` e `inactivo`.
5. **Tarjetero archivado** — no permite abrir nuevos episodios clínicos (validación a implementar en `clinical-episodes`).
6. **Prerequisito de historia clínica** — sin tarjetero activo no se puede crear un `ClinicalEpisode`. Ver [clinical-episodes.md](./clinical-episodes.md).

---

## Eventos de auditoría

| Evento              | Trigger                                          |
|---------------------|--------------------------------------------------|
| `CREATE_TARJETERO`  | `POST /patients/:id/tarjetero`                   |
| `READ_TARJETERO`    | `GET /patients/:id/tarjetero` y `by-codigo`      |
| `UPDATE_TARJETERO`  | `PATCH /patients/:id/tarjetero`                  |
| `LIST_TARJETERO`    | `GET /tarjetero`                                 |

---

## Notas de implementación

- Cache Redis: `GET /patients/:id/tarjetero` y `by-codigo` → TTL 600 s. Invalidar en cada `PATCH`.
- Listado `GET /tarjetero`: ordenado por `fechaApertura DESC`.
- El campo `codigoHc` tiene índice único en DB.
- La generación del código debe ser atómica (transacción o sequence de DB) para evitar duplicados bajo concurrencia.

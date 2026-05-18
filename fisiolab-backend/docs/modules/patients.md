# Módulo: Patients

Base path: `/api/v1/patients`

Todos los endpoints requieren `Authorization: Bearer <JWT>`.

---

## Entidad `Patient` (respuesta)

> `userId` es un campo interno — **nunca aparece en respuestas de la API**.

| Campo                | Tipo              | Nullable | Descripción                           |
|----------------------|-------------------|----------|---------------------------------------|
| `id`                 | `uuid`            | No       | Identificador único                   |
| `cedula`             | `string(10)`      | No       | Cédula ecuatoriana (10 dígitos)       |
| `nombres`            | `string`          | No       |                                       |
| `apellidos`          | `string`          | No       |                                       |
| `email`              | `string`          | Sí       |                                       |
| `fechaNacimiento`    | `string (date)`   | No       | Formato `YYYY-MM-DD`                  |
| `genero`             | `Genero`          | No       | `masculino \| femenino \| otro`       |
| `telefono`           | `string`          | Sí       | 10 dígitos                            |
| `telefonoEmergencia` | `string`          | Sí       | 10 dígitos                            |
| `direccion`          | `string`          | Sí       |                                       |
| `ciudad`             | `string`          | Sí       |                                       |
| `provincia`          | `string`          | Sí       |                                       |
| `codigoPostal`       | `string`          | Sí       | 6 dígitos                             |
| `ocupacion`          | `string`          | Sí       |                                       |
| `estadoCivil`        | `EstadoCivil`     | Sí       | Ver enum abajo                        |
| `createdAt`          | `ISO 8601`        | No       |                                       |
| `updatedAt`          | `ISO 8601`        | No       |                                       |

### Enum `Genero`

| Valor       |
|-------------|
| `masculino` |
| `femenino`  |
| `otro`      |

### Enum `EstadoCivil`

| Valor         |
|---------------|
| `soltero`     |
| `casado`      |
| `divorciado`  |
| `viudo`       |
| `union_libre` |

---

## DTOs

### `CreatePatientDto`

| Campo                | Tipo          | Req | Validaciones                                          |
|----------------------|---------------|-----|-------------------------------------------------------|
| `cedula`             | `string`      | Sí  | 10 dígitos, algoritmo módulo 10 Ecuador               |
| `nombres`            | `string`      | Sí  | 2–100 chars                                           |
| `apellidos`          | `string`      | Sí  | 2–100 chars                                           |
| `fechaNacimiento`    | `string`      | Sí  | ISO date `YYYY-MM-DD`                                 |
| `genero`             | `Genero`      | Sí  | `masculino \| femenino \| otro`                       |
| `email`              | `string`      | No  | Email válido                                          |
| `telefono`           | `string`      | No  | Exactamente 10 dígitos                                |
| `telefonoEmergencia` | `string`      | No  | Exactamente 10 dígitos                                |
| `direccion`          | `string`      | No  | 1–255 chars                                           |
| `ciudad`             | `string`      | No  | 1–100 chars                                           |
| `provincia`          | `string`      | No  | 1–100 chars                                           |
| `codigoPostal`       | `string`      | No  | Exactamente 6 dígitos                                 |
| `ocupacion`          | `string`      | No  | 1–100 chars                                           |
| `estadoCivil`        | `EstadoCivil` | No  | `soltero \| casado \| divorciado \| viudo \| union_libre` |

### `UpdatePatientDto`

`PartialType(CreatePatientDto)` — todos los campos opcionales.

### `PatientQueryDto` (query params de `GET /patients`)

| Param    | Tipo     | Default | Descripción                                         |
|----------|----------|---------|-----------------------------------------------------|
| `page`   | `number` | `1`     | Página (mínimo 1)                                   |
| `limit`  | `number` | `20`    | Registros por página (máximo 100)                   |
| `search` | `string` | —       | Busca en `nombres`, `apellidos` y `email` (ILIKE)   |
| `cedula` | `string` | —       | Búsqueda exacta por cédula (10 dígitos)             |
| `genero` | `Genero` | —       | Filtra por género                                   |

---

## Endpoints

---

### `POST /api/v1/patients`

Crea un nuevo paciente.

**Roles:** `admin`, `medico`, `fisioterapeuta`

**Request body:**

```json
{
  "cedula": "1713175071",
  "nombres": "Juan Carlos",
  "apellidos": "Rodríguez Pérez",
  "fechaNacimiento": "1990-05-20",
  "genero": "masculino",
  "email": "juan@email.com",
  "telefono": "0991234567",
  "telefonoEmergencia": "0987654321",
  "direccion": "Av. 6 de Diciembre N24-567",
  "ciudad": "Quito",
  "provincia": "Pichincha",
  "codigoPostal": "170150",
  "ocupacion": "Ingeniero",
  "estadoCivil": "soltero"
}
```

**Response `201`:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "cedula": "1713175071",
  "nombres": "Juan Carlos",
  "apellidos": "Rodríguez Pérez",
  "email": "juan@email.com",
  "fechaNacimiento": "1990-05-20",
  "genero": "masculino",
  "telefono": "0991234567",
  "telefonoEmergencia": "0987654321",
  "direccion": "Av. 6 de Diciembre N24-567",
  "ciudad": "Quito",
  "provincia": "Pichincha",
  "codigoPostal": "170150",
  "ocupacion": "Ingeniero",
  "estadoCivil": "soltero",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

| Status | Descripción                                          |
|--------|------------------------------------------------------|
| `201`  | Paciente creado                                      |
| `400`  | Datos inválidos o cédula con dígito verificador erróneo |
| `401`  | Token ausente o inválido                             |
| `403`  | Rol insuficiente                                     |
| `409`  | Cédula ya registrada                                 |

---

### `GET /api/v1/patients`

Lista pacientes con paginación y filtros.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `LIST_PATIENTS`

**Query params:**

```
GET /api/v1/patients?page=1&limit=20&search=rodriguez&genero=masculino
GET /api/v1/patients?cedula=1713175071
```

**Response `200`:**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "cedula": "1713175071",
      "nombres": "Juan Carlos",
      "apellidos": "Rodríguez Pérez",
      "email": "juan@email.com",
      "fechaNacimiento": "1990-05-20",
      "genero": "masculino",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

| Status | Descripción              |
|--------|--------------------------|
| `200`  | Página de pacientes      |
| `400`  | Query params inválidos   |
| `401`  | Token ausente o inválido |
| `403`  | Rol insuficiente         |

---

### `GET /api/v1/patients/by-cedula/:cedula`

Busca un paciente por cédula exacta (10 dígitos).

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `READ_PATIENT`

**Path params:**

| Param    | Tipo     | Descripción           |
|----------|----------|-----------------------|
| `cedula` | `string` | Cédula exacta, 10 dígitos |

**Ejemplo:**

```
GET /api/v1/patients/by-cedula/1713175071
```

| Status | Descripción               |
|--------|---------------------------|
| `200`  | `Patient`                 |
| `401`  | Token ausente o inválido  |
| `403`  | Rol insuficiente          |
| `404`  | Paciente no encontrado    |

---

### `GET /api/v1/patients/:id`

Obtiene un paciente por UUID.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `READ_PATIENT`

**Path params:**

| Param | Tipo   | Descripción       |
|-------|--------|-------------------|
| `id`  | `uuid` | UUID del paciente |

| Status | Descripción               |
|--------|---------------------------|
| `200`  | `Patient`                 |
| `400`  | UUID con formato inválido |
| `401`  | Token ausente o inválido  |
| `403`  | Rol insuficiente          |
| `404`  | Paciente no encontrado    |

---

### `PATCH /api/v1/patients/:id`

Actualiza campos del paciente (actualización parcial).

**Roles:** `admin`, `medico`, `fisioterapeuta`

**Auditoría:** `UPDATE_PATIENT`

**Path params:**

| Param | Tipo   | Descripción       |
|-------|--------|-------------------|
| `id`  | `uuid` | UUID del paciente |

**Request body:** cualquier subconjunto de campos de `CreatePatientDto`.

```json
{
  "email": "nuevo@email.com",
  "telefono": "0981234567"
}
```

| Status | Descripción                          |
|--------|--------------------------------------|
| `200`  | `Patient` actualizado                |
| `400`  | UUID inválido o datos con error      |
| `401`  | Token ausente o inválido             |
| `403`  | Rol insuficiente                     |
| `404`  | Paciente no encontrado               |
| `409`  | Email ya registrado en otro paciente |

---

### `DELETE /api/v1/patients/:id`

Elimina un paciente permanentemente.

**Roles:** solo `admin`

**Auditoría:** `DELETE_PATIENT`

**Path params:**

| Param | Tipo   | Descripción       |
|-------|--------|-------------------|
| `id`  | `uuid` | UUID del paciente |

| Status | Descripción               |
|--------|---------------------------|
| `204`  | Eliminado — sin body      |
| `400`  | UUID con formato inválido |
| `401`  | Token ausente o inválido  |
| `403`  | Rol insuficiente          |
| `404`  | Paciente no encontrado    |

---

## Tabla de permisos

| Endpoint                          | admin | medico | fisioterapeuta | pasante |
|-----------------------------------|:-----:|:------:|:--------------:|:-------:|
| `POST /patients`                  | ✓     | ✓      | ✓              |         |
| `GET /patients`                   | ✓     | ✓      | ✓              | ✓       |
| `GET /patients/by-cedula/:cedula` | ✓     | ✓      | ✓              | ✓       |
| `GET /patients/:id`               | ✓     | ✓      | ✓              | ✓       |
| `PATCH /patients/:id`             | ✓     | ✓      | ✓              |         |
| `DELETE /patients/:id`            | ✓     |        |                |         |

---

## Notas

- Resultados de `GET /patients` ordenados por `apellidos ASC, nombres ASC`.
- `by-cedula/:cedula` y `GET /:id` están cacheados en Redis (TTL 10 min). Cambios via `PATCH`/`DELETE` invalidan el cache automáticamente.
- La cédula ecuatoriana se valida con el algoritmo módulo 10. Un dígito verificador incorrecto retorna `400`.

# Módulo: Patients

Base path: `/patients`

Todos los endpoints requieren `Authorization: Bearer <JWT>`.

---

## Entidad `Patient`

Tabla: `patients`

| Campo                | Tipo              | Constraints            | Descripción                           |
|----------------------|-------------------|------------------------|---------------------------------------|
| `id`                 | `uuid`            | PK, generado           |                                       |
| `userId`             | `uuid`            | nullable               | Referencia opcional a `users.id`      |
| `cedula`             | `varchar(10)`     | unique, not null       | Cédula ecuatoriana válida (10 dígitos)|
| `nombres`            | `varchar(100)`    | not null               |                                       |
| `apellidos`          | `varchar(100)`    | not null               |                                       |
| `email`              | `varchar(150)`    | nullable               |                                       |
| `fechaNacimiento`    | `date`            | not null               | Formato `YYYY-MM-DD`                  |
| `genero`             | `enum Genero`     | not null               | Ver enum abajo                        |
| `telefono`           | `varchar(15)`     | nullable               | 10 dígitos                            |
| `telefonoEmergencia` | `varchar(15)`     | nullable               | 10 dígitos                            |
| `direccion`          | `varchar(255)`    | nullable               |                                       |
| `ciudad`             | `varchar(100)`    | nullable               |                                       |
| `provincia`          | `varchar(100)`    | nullable               |                                       |
| `codigoPostal`       | `varchar(10)`     | nullable               | 6 dígitos                             |
| `ocupacion`          | `varchar(100)`    | nullable               |                                       |
| `estadoCivil`        | `enum EstadoCivil`| nullable               | Ver enum abajo                        |
| `createdAt`          | `timestamp`       | auto                   |                                       |
| `updatedAt`          | `timestamp`       | auto                   |                                       |

**Índices:** `cedula` (unique), `email`, `nombres`, `apellidos`

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

| Campo                | Tipo          | Requerido | Validaciones                                    |
|----------------------|---------------|-----------|-------------------------------------------------|
| `cedula`             | `string`      | Sí        | 10 dígitos, algoritmo módulo 10 (Ecuador)       |
| `nombres`            | `string`      | Sí        | 2–100 chars                                     |
| `apellidos`          | `string`      | Sí        | 2–100 chars                                     |
| `fechaNacimiento`    | `string`      | Sí        | ISO date `YYYY-MM-DD`                           |
| `genero`             | `Genero`      | Sí        | `masculino \| femenino \| otro`                 |
| `email`              | `string`      | No        | Email válido                                    |
| `telefono`           | `string`      | No        | Exactamente 10 dígitos                          |
| `telefonoEmergencia` | `string`      | No        | Exactamente 10 dígitos                          |
| `direccion`          | `string`      | No        | 1–255 chars                                     |
| `ciudad`             | `string`      | No        | 1–100 chars                                     |
| `provincia`          | `string`      | No        | 1–100 chars                                     |
| `codigoPostal`       | `string`      | No        | Exactamente 6 dígitos                           |
| `ocupacion`          | `string`      | No        | 1–100 chars                                     |
| `estadoCivil`        | `EstadoCivil` | No        | `soltero \| casado \| divorciado \| viudo \| union_libre` |

### `UpdatePatientDto`

`PartialType(CreatePatientDto)` — todos los campos de `CreatePatientDto` opcionales.

---

## Endpoints

### `POST /patients`

Crea un paciente nuevo.

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

**Responses:**

| Status | Descripción                                         |
|--------|-----------------------------------------------------|
| 201    | Paciente creado — body: `Patient`                   |
| 400    | Datos inválidos o cédula con dígito verificador erróneo |
| 401    | Token ausente o inválido                            |
| 403    | Rol insuficiente                                    |
| 409    | Cédula o email ya registrado                        |

---

### `GET /patients`

Lista todos los pacientes.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `LIST_PATIENTS`

**Responses:**

| Status | Descripción              |
|--------|--------------------------|
| 200    | Array de `Patient`       |
| 401    | Token ausente o inválido |
| 403    | Rol insuficiente         |

**Response body (200):**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userId": null,
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
]
```

---

### `GET /patients/:id`

Obtiene un paciente por UUID.

**Roles:** `admin`, `medico`, `fisioterapeuta`, `pasante`

**Auditoría:** `READ_PATIENT`

**Path params:**

| Param | Tipo   | Descripción       |
|-------|--------|-------------------|
| `id`  | `uuid` | UUID del paciente |

**Responses:**

| Status | Descripción               |
|--------|---------------------------|
| 200    | `Patient`                 |
| 400    | UUID con formato inválido |
| 401    | Token ausente o inválido  |
| 403    | Rol insuficiente          |
| 404    | Paciente no encontrado    |

---

### `PATCH /patients/:id`

Actualiza campos del paciente (parcial).

**Roles:** `admin`, `medico`, `fisioterapeuta`

**Auditoría:** `UPDATE_PATIENT`

**Path params:**

| Param | Tipo   | Descripción       |
|-------|--------|-------------------|
| `id`  | `uuid` | UUID del paciente |

**Request body:** `UpdatePatientDto` — cualquier subconjunto de campos de `CreatePatientDto`

**Responses:**

| Status | Descripción                            |
|--------|----------------------------------------|
| 200    | `Patient` actualizado                  |
| 400    | UUID inválido o datos con error        |
| 401    | Token ausente o inválido               |
| 403    | Rol insuficiente                       |
| 404    | Paciente no encontrado                 |
| 409    | Email ya registrado en otro paciente   |

---

### `DELETE /patients/:id`

Elimina un paciente permanentemente.

**Roles:** solo `admin`

**Auditoría:** `DELETE_PATIENT`

**Path params:**

| Param | Tipo   | Descripción       |
|-------|--------|-------------------|
| `id`  | `uuid` | UUID del paciente |

**Responses:**

| Status | Descripción               |
|--------|---------------------------|
| 204    | Eliminado, sin body       |
| 400    | UUID con formato inválido |
| 401    | Token ausente o inválido  |
| 403    | Rol insuficiente          |
| 404    | Paciente no encontrado    |

---

## Tabla de permisos

| Endpoint              | admin | medico | fisioterapeuta | pasante |
|-----------------------|:-----:|:------:|:--------------:|:-------:|
| `POST /patients`      | ✓     | ✓      | ✓              |         |
| `GET /patients`       | ✓     | ✓      | ✓              | ✓       |
| `GET /patients/:id`   | ✓     | ✓      | ✓              | ✓       |
| `PATCH /patients/:id` | ✓     | ✓      | ✓              |         |
| `DELETE /patients/:id`| ✓     |        |                |         |

---

## Eventos de auditoría

| Evento           | Endpoint              |
|------------------|-----------------------|
| `LIST_PATIENTS`  | `GET /patients`       |
| `READ_PATIENT`   | `GET /patients/:id`   |
| `UPDATE_PATIENT` | `PATCH /patients/:id` |
| `DELETE_PATIENT` | `DELETE /patients/:id`|

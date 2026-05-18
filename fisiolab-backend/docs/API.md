# Fisiolab Backend — API Reference

Base URL: `http://localhost:3000`

Prefix global: **`/api/v1`** — todos los endpoints usan este prefijo.

Swagger UI: `http://localhost:3000/api/docs`

---

## Módulos

| Módulo          | Archivo                                          | Descripción                                         |
|-----------------|--------------------------------------------------|-----------------------------------------------------|
| Auth            | [modules/auth.md](modules/auth.md)               | JWT con Clerk, guards, roles, decoradores           |
| Users           | [modules/users.md](modules/users.md)             | Gestión de usuarios, webhook Clerk                  |
| Patients        | [modules/patients.md](modules/patients.md)       | CRUD paginado de pacientes con control de acceso    |
| Antecedentes    | [modules/antecedentes.md](modules/antecedentes.md) | Historia clínica: antecedentes por tipo             |

---

## Autenticación global

Todos los endpoints protegidos requieren:

```
Authorization: Bearer <JWT>
```

JWT emitido por Clerk (RS256). Ver [modules/auth.md](modules/auth.md) para el flujo completo.

---

## Roles

| Rol              | Valor            |
|------------------|------------------|
| Admin            | `admin`          |
| Médico           | `medico`         |
| Fisioterapeuta   | `fisioterapeuta` |
| Pasante          | `pasante`        |
| Paciente         | `paciente`       |

---

## Resumen de endpoints

| Método   | Endpoint                                                        | Auth | Roles mínimo                             |
|----------|-----------------------------------------------------------------|------|------------------------------------------|
| `GET`    | `/api/v1/health`                                               | No   | Público                                  |
| `POST`   | `/api/v1/users/webhook/clerk`                                  | No   | Público                                  |
| `GET`    | `/api/v1/users`                                                | Sí   | `admin`                                  |
| `POST`   | `/api/v1/patients`                                             | Sí   | `admin \| medico \| fisioterapeuta`      |
| `GET`    | `/api/v1/patients`                                             | Sí   | `admin \| medico \| fisioterapeuta \| pasante` |
| `GET`    | `/api/v1/patients/by-cedula/:cedula`                           | Sí   | `admin \| medico \| fisioterapeuta \| pasante` |
| `GET`    | `/api/v1/patients/:id`                                         | Sí   | `admin \| medico \| fisioterapeuta \| pasante` |
| `PATCH`  | `/api/v1/patients/:id`                                         | Sí   | `admin \| medico \| fisioterapeuta`      |
| `DELETE` | `/api/v1/patients/:id`                                         | Sí   | `admin`                                  |
| `GET`    | `/api/v1/patients/:id/antecedentes`                            | Sí   | `admin \| medico \| fisioterapeuta \| pasante` |
| `GET`    | `/api/v1/patients/:id/antecedentes/heredofamiliares`           | Sí   | `admin \| medico \| fisioterapeuta \| pasante` |
| `PATCH`  | `/api/v1/patients/:id/antecedentes/heredofamiliares`           | Sí   | `admin \| medico \| fisioterapeuta`      |
| `GET`    | `/api/v1/patients/:id/antecedentes/patologicos`                | Sí   | `admin \| medico \| fisioterapeuta \| pasante` |
| `PATCH`  | `/api/v1/patients/:id/antecedentes/patologicos`                | Sí   | `admin \| medico \| fisioterapeuta`      |
| `GET`    | `/api/v1/patients/:id/antecedentes/no-patologicos`             | Sí   | `admin \| medico \| fisioterapeuta \| pasante` |
| `PATCH`  | `/api/v1/patients/:id/antecedentes/no-patologicos`             | Sí   | `admin \| medico \| fisioterapeuta`      |
| `GET`    | `/api/v1/patients/:id/antecedentes/gineco-obstetricos`         | Sí   | `admin \| medico \| fisioterapeuta \| pasante` |
| `PATCH`  | `/api/v1/patients/:id/antecedentes/gineco-obstetricos`         | Sí   | `admin \| medico \| fisioterapeuta`      |

---

## Errores comunes

| Status | Causa                                      |
|--------|--------------------------------------------|
| `400`  | Validación fallida (body, params inválidos)|
| `401`  | Token ausente, expirado o firma inválida   |
| `403`  | Rol insuficiente o restricción de negocio  |
| `404`  | Recurso no encontrado                      |
| `409`  | Conflicto — cédula o email duplicado       |
| `422`  | Entidad no procesable (class-validator)    |

Formato de error estándar de NestJS:

```json
{
  "statusCode": 404,
  "message": "Patient abc-123 not found",
  "error": "Not Found"
}
```

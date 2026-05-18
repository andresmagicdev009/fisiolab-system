# Fisiolab Backend — API Reference

Base URL: `http://localhost:3000`

Swagger UI: `http://localhost:3000/api/docs`

---

## Módulos

| Módulo    | Archivo                          | Descripción                                    |
|-----------|----------------------------------|------------------------------------------------|
| Auth      | [modules/auth.md](modules/auth.md)       | JWT con Clerk, guards, roles, decoradores      |
| Users     | [modules/users.md](modules/users.md)     | Gestión de usuarios, webhook Clerk             |
| Patients  | [modules/patients.md](modules/patients.md) | CRUD de pacientes con control de acceso por rol|

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

| Método   | Endpoint                    | Auth | Roles mínimo          |
|----------|-----------------------------|------|-----------------------|
| `POST`   | `/users/webhook/clerk`      | No   | Público               |
| `GET`    | `/users`                    | Sí   | `admin`               |
| `POST`   | `/patients`                 | Sí   | `admin \| medico \| fisioterapeuta` |
| `GET`    | `/patients`                 | Sí   | `admin \| medico \| fisioterapeuta \| pasante` |
| `GET`    | `/patients/:id`             | Sí   | `admin \| medico \| fisioterapeuta \| pasante` |
| `PATCH`  | `/patients/:id`             | Sí   | `admin \| medico \| fisioterapeuta` |
| `DELETE` | `/patients/:id`             | Sí   | `admin`               |

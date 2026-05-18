# Módulo: Users

Base path: `/users`

---

## Entidad `User`

Tabla: `users`

| Campo            | Tipo           | Constraints           | Descripción                                      |
|------------------|----------------|-----------------------|--------------------------------------------------|
| `id`             | `uuid`         | PK, generado          |                                                  |
| `email`          | `varchar`      | unique, not null      |                                                  |
| `externalAuthId` | `varchar`      | unique, nullable      | ID del usuario en Clerk (`user_xxx`)             |
| `role`           | `varchar`      | default `'paciente'`  | Sincronizado desde `public_metadata.role` en Clerk |
| `cedula`         | `varchar(10)`  | nullable              |                                                  |
| `nombres`        | `varchar(100)` | nullable              |                                                  |
| `apellidos`      | `varchar(100)` | nullable              |                                                  |
| `createdAt`      | `timestamp`    | auto                  |                                                  |
| `updatedAt`      | `timestamp`    | auto                  |                                                  |

### Roles válidos para `role`

| Valor            |
|------------------|
| `admin`          |
| `medico`         |
| `fisioterapeuta` |
| `pasante`        |
| `paciente`       |

---

## Endpoints

### `POST /users/webhook/clerk`

Webhook interno — Clerk llama este endpoint cuando se crea o actualiza un usuario.

**Autenticación:** ninguna (público, se asegura por secreto de webhook en Clerk)

**Request body:**

```json
{
  "type": "user.created | user.updated | user.deleted",
  "data": {
    "id": "user_abc123",
    "email_addresses": [
      {
        "email_address": "user@example.com",
        "id": "iea_xxx"
      }
    ],
    "public_metadata": {
      "role": "medico"
    }
  }
}
```

**Comportamiento por tipo:**

| `type`          | Acción                                          |
|-----------------|-------------------------------------------------|
| `user.created`  | Upsert en BD — crea si no existe por `externalAuthId` |
| `user.updated`  | Upsert en BD — actualiza email y rol si cambian |
| `user.deleted`  | No implementado (no-op)                         |

**Responses:**

| Status | Descripción                 |
|--------|-----------------------------|
| 200    | `{ "received": true }`      |
| 400    | Payload sin `type` o `data` |

---

### `GET /users`

Lista todos los usuarios registrados.

**Autenticación:** `Authorization: Bearer <JWT>`

**Roles:** solo `admin`

**Responses:**

| Status | Descripción              |
|--------|--------------------------|
| 200    | Array de `User`          |
| 401    | Token ausente o inválido |
| 403    | Rol insuficiente         |

**Response body (200):**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "medico@fisiolab.com",
    "externalAuthId": "user_abc123",
    "role": "medico",
    "cedula": null,
    "nombres": null,
    "apellidos": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## Tabla de permisos

| Endpoint                    | admin | Público |
|-----------------------------|:-----:|:-------:|
| `POST /users/webhook/clerk` |       | ✓       |
| `GET /users`                | ✓     |         |

---

## Notas

- El módulo no expone endpoints de creación manual. Los usuarios se crean exclusivamente vía webhook de Clerk.
- El campo `cedula`, `nombres` y `apellidos` en `User` son opcionales; la información completa del profesional puede residir en otras entidades.
- `externalAuthId` es nulo para usuarios pre-creados que aún no se han registrado en Clerk.

# Módulo: Auth

El módulo no expone endpoints propios. Provee la infraestructura de autenticación y autorización que consumen todos los demás módulos.

---

## Responsabilidades

- Validar JWTs emitidos por **Clerk** (estrategia `passport-jwt` con RS256)
- Extraer `userId`, `email` y `role` del token para inyectarlos en `req.user`
- Proteger rutas vía `JwtAuthGuard`
- Controlar acceso por rol vía `RolesGuard` + decorador `@Roles()`

---

## Flujo de autenticación

```
1. Usuario hace login en Clerk (frontend)
2. Clerk emite JWT firmado con clave privada RS256
3. Cliente envía JWT en cada request: Authorization: Bearer <token>
4. JwtAuthGuard intercepta el request
5. JwtStrategy obtiene la clave pública desde CLERK_JWKS_URI
6. Valida firma, expiración y presencia de campo "sub"
7. Extrae role desde payload.publicMetadata.role (o public_metadata.role)
8. Inyecta UserPayload en req.user
9. RolesGuard compara req.user.role contra @Roles() del endpoint
```

---

## JWT Payload (Clerk)

Clerk incluye estos campos relevantes en el token:

| Campo                     | Tipo     | Descripción                              |
|---------------------------|----------|------------------------------------------|
| `sub`                     | `string` | ID del usuario en Clerk (`user_xxx`)     |
| `email`                   | `string` | Email del usuario                        |
| `publicMetadata.role`     | `string` | Rol asignado desde el dashboard de Clerk |
| `public_metadata.role`    | `string` | Alias alternativo (mismo dato)           |
| `sid`                     | `string` | Session ID                               |
| `azp`                     | `string` | Authorized party (cliente Clerk)         |

Si `publicMetadata.role` no está presente, el sistema asigna `'paciente'` por defecto.

---

## `UserPayload` (objeto inyectado en `req.user`)

```typescript
interface UserPayload {
  userId: string;  // payload.sub
  email: string;   // payload.email
  role: string;    // payload.publicMetadata.role ?? 'paciente'
}
```

---

## Guards

### `JwtAuthGuard`

Extiende `AuthGuard('jwt')` de Passport. Aplicar con `@UseGuards(JwtAuthGuard)`.

- Rechaza con `401` si el token está ausente, expirado o con firma inválida.

### `RolesGuard`

Compara `req.user.role` contra los roles declarados con `@Roles()`.

- Rechaza con `403` si el rol no está permitido.
- Si el endpoint no tiene `@Roles()`, permite el acceso a cualquier usuario autenticado.

---

## Decoradores

### `@Roles(...roles: UserRole[])`

Declara qué roles pueden acceder al endpoint. Siempre se usa junto con `JwtAuthGuard` y `RolesGuard`.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MEDICO)
@Get()
findAll() { ... }
```

### `@Auditable(event: string)`

Registra un evento en `audit_logs` cuando el endpoint es invocado. Independiente de auth.

---

## Roles disponibles

Definidos en `src/common/enums/roles.enum.ts`:

| Enum                    | Valor            |
|-------------------------|------------------|
| `UserRole.ADMIN`        | `'admin'`        |
| `UserRole.MEDICO`       | `'medico'`       |
| `UserRole.FISIOTERAPEUTA` | `'fisioterapeuta'` |
| `UserRole.PASANTE`      | `'pasante'`      |
| `UserRole.PACIENTE`     | `'paciente'`     |

---

## Configuración requerida (variables de entorno)

| Variable          | Descripción                                              |
|-------------------|----------------------------------------------------------|
| `CLERK_JWKS_URI`  | URL del endpoint JWKS de Clerk para obtener clave pública |

Ejemplo:

```
CLERK_JWKS_URI=https://<tu-instancia>.clerk.accounts.dev/.well-known/jwks.json
```

---

## Notas

- El módulo no gestiona sesiones. Cada request es stateless — solo se valida el JWT.
- La clave pública se obtiene dinámicamente de Clerk con caché habilitado (máx. 10 requests/min al JWKS).
- El algoritmo de firma es **RS256** — no se aceptan tokens HS256.

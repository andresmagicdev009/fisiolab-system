# Fisiolab Constitution - Principios Arquitectónicos Inmutables

## Stack Enforcement
- Backend: NestJS + TypeORM + PostgreSQL (Neon)
- Frontend: React 18 + TypeScript + Chakra UI v2
- Auth: Clerk con RS256 JWKS
- Cache: Redis (Upstash REST) con TTLs definidos
- Storage: Cloudflare R2 con presigned URLs

## API Standards
- Prefix global: `/api/v1`
- ValidationPipe strict: `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`
- Errores HTTP: 400 validación, 401 auth, 403 permisos, 404 no encontrado, 409 conflictos, 422 reglas negocio
- Swagger autodocumentado en `/api/docs`

## Data Integrity Rules
- **NUNCA** permitir episodios sin tarjetero activo
- **NUNCA** editar episodios cerrados (usar endpoint `/close`)
- **NUNCA** modificar `codigoHc` post-creación
- **SIEMPRE** validar cédula ecuatoriana con algoritmo módulo 10
- **SIEMPRE** usar transacciones para operaciones multi-entidad

## State Machine Discipline
- Todos los estados deben usar Strategy Pattern
- Estados terminales son inmutables (archivado, cerrado, pagado)
- Transiciones deben tener métodos dedicados (`POST /close`, `POST /cancel`)

## Cache Strategy
- TTL.LIST = 300s (colecciones)
- TTL.RECORD = 600s (registros individuales)
- TTL.USER = 900s (usuarios Clerk)
- Siempre invalidar cache en writes

## Role-Based Access
- READERS = [ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE]
- WRITERS = [ADMIN, MEDICO, FISIOTERAPEUTA]
- NUNCA permitir a PACIENTE modificar datos clínicos

## Testing Requirements
- Unit tests para servicios con Strategy Pattern
- Integration tests para endpoints CRUD
- E2E tests para flujos críticos (state transitions)

## MSP Ecuador Compliance
- Tarjetero Índice Automatizado obligatorio
- Formato HC: `HC-YYYY-NNNN`
- Antecedentes gineco solo para género femenino
- Firmas digitales hacen documentos inmutables
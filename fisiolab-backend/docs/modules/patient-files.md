# Módulo: patient-files

Archivos del expediente del paciente (PDFs, imágenes, exámenes). Almacenamiento en **Cloudflare R2** vía SDK S3-compatible. Descarga mediante presigned URLs (15 min TTL) — los archivos nunca pasan por el backend.

---

## Patrón de diseño: Abstract Provider (Strategy)

```
FileStorageProvider (abstract class)
  └── R2StorageProvider   ← implementación activa (Cloudflare R2)
```

Inyectado por token `FILE_STORAGE_PROVIDER`. Swap a `LocalStorageProvider` sin cambiar service.

---

## Rutas

```
POST   /api/v1/patients/:patientId/files              WRITERS (multipart/form-data)
GET    /api/v1/patients/:patientId/files              READERS
GET    /api/v1/patients/:patientId/files/:fileId      READERS
GET    /api/v1/patients/:patientId/files/:fileId/url  READERS  ← presigned URL
DELETE /api/v1/patients/:patientId/files/:fileId      WRITERS  ← solo uploader o admin
```

**Roles:**
- `READERS` = ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE
- `WRITERS` = ADMIN, MEDICO, FISIOTERAPEUTA

---

## Entidad `PatientFile` (respuesta)

```typescript
{
  id: string
  patientId: string
  episodeId: string | null         // asociar a episodio clínico (opcional)
  uploadedBy: string               // UUID del profesional que subió
  filenameOriginal: string         // nombre original del archivo
  filenameStored: string           // UUID + extensión (en R2)
  storageKey: string               // clave completa en bucket: patients/{pid}/{categoria}/{uuid}.ext
  mimetype: string
  sizeBytes: number
  categoria: CategoriaArchivo
  descripcion: string | null
  createdAt: string
  updatedAt: string
}
```

**`CategoriaArchivo` enum:**
```
laboratorio | imagen | referencia | consentimiento | receta | otro
```

---

## Upload — `POST /patients/:patientId/files`

**Content-Type:** `multipart/form-data`

**Campos:**
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| `file` | binary | ✅ | PDF, JPEG, PNG, TIFF, DICOM |
| `categoria` | string (enum) | ❌ | default: `otro` |
| `descripcion` | string | ❌ | max 500 chars |
| `episodeId` | uuid | ❌ | asociar a episodio |

**Límites:**
- Tamaño máx: **20 MB**
- Tipos permitidos: `application/pdf`, `image/jpeg`, `image/png`, `image/tiff`, `application/dicom`

**Storage key:** `patients/{patientId}/{categoria}/{uuid}{ext}`

---

## Listado — `GET /patients/:patientId/files`

**Query params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | int | default 1 |
| `limit` | int | default 20, max 100 |
| `categoria` | CategoriaArchivo | filtrar por categoría |
| `episodeId` | uuid | filtrar por episodio |

**Respuesta:** `{ data: PatientFile[], meta: { total, page, limit, pages } }`  
Ordenado por `createdAt DESC`.

---

## Presigned URL — `GET /patients/:patientId/files/:fileId/url`

**Respuesta:**
```typescript
{
  url: string       // URL firmada de R2, válida 15 minutos
  expiresAt: string // ISO 8601 — fecha de expiración
}
```

El cliente descarga el archivo **directamente desde R2** usando esta URL. No proxy por backend.

---

## Delete — `DELETE /patients/:patientId/files/:fileId`

1. Verifica que el archivo exista y pertenezca al paciente
2. Si no es admin: verifica que `uploadedBy === currentUser.id`
3. Elimina objeto de R2 (`DeleteObjectCommand`)
4. Elimina registro de DB

---

## Reglas de negocio

1. Solo el profesional que subió el archivo puede eliminarlo (o admin)
2. Mimetypes no permitidos → 400 (validado en service, no en multer)
3. Archivos > 20MB rechazados por multer antes de llegar al service
4. `storageKey` no se expone en respuesta de presigned URL — solo la URL firmada
5. `firmaDigital` no aplica a este módulo

---

## Variables de entorno requeridas

```env
R2_ACCOUNT_ID=           # Cloudflare Account ID (Dashboard → sidebar)
R2_BUCKET_NAME=          # Nombre del bucket en R2
R2_ACCESS_KEY_ID=        # API Token Access Key
R2_SECRET_ACCESS_KEY=    # API Token Secret Key
```

**Permisos del API Token R2:**
- `Object:Read` (para presigned GET)
- `Object:Write` (para upload)
- `Object:Delete` (para delete)

---

## Archivos backend

```
src/modules/patient-files/
  interfaces/file-storage.provider.ts    ← abstract class + token
  providers/r2-storage.provider.ts       ← S3Client con endpoint R2
  entities/patient-file.entity.ts
  dto/
    upload-file.dto.ts
    file-query.dto.ts
  patient-files.service.ts
  patient-files.controller.ts
  patient-files.module.ts

src/database/migrations/1747440017000-CreatePatientFiles.ts
```

**Deps:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@types/multer`

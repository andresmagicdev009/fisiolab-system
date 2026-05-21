# Módulo: prescriptions + medications

Recetas médicas (Form 028 MSP Ecuador) dentro de un episodio clínico. Estructura de dos niveles: `Prescription` (cabecera) → `Medication[]` (ítems). Usa **Builder Pattern** para construcción de prescripciones con medicamentos.

**Restricción Ecuador:** Solo rol `MEDICO` (o `ADMIN`) puede crear y modificar. `FISIOTERAPEUTA` solo lectura.

---

## Patrón de diseño: Builder

`PrescriptionBuilder` construye la lista de medicamentos con orden auto-asignado:

```typescript
// POST con medications inline (flujo Form 028 — escribir todo de una vez)
const builder = new PrescriptionBuilder();
builder.withMedications(dto.medications);
const meds = builder.buildMedications(); // asigna orden 1,2,3... si omitido

// POST /medications — agregar uno por uno
builder.withMedication(dto);
const [built] = builder.buildMedications();
```

---

## Máquina de estados implícita

```
sin firma → con firmaDigital (PATCH rxId con firmaDigital)
```

- Prescripción firmada (`firmaDigital != null`) → **inmutable** (422 en PATCH/add/update/remove medications)
- No hay estado explícito — `firmaDigital` es el indicador de cierre

---

## Rutas

```
# Prescripciones
POST   /api/v1/patients/:patientId/episodes/:episodeId/prescriptions           MEDICO/ADMIN
GET    /api/v1/patients/:patientId/episodes/:episodeId/prescriptions           READERS
GET    /api/v1/patients/:patientId/episodes/:episodeId/prescriptions/:rxId     READERS
PATCH  /api/v1/patients/:patientId/episodes/:episodeId/prescriptions/:rxId     MEDICO/ADMIN

# Medicamentos
POST   /api/v1/patients/:patientId/episodes/:episodeId/prescriptions/:rxId/medications            MEDICO/ADMIN
PATCH  /api/v1/patients/:patientId/episodes/:episodeId/prescriptions/:rxId/medications/:medId     MEDICO/ADMIN
DELETE /api/v1/patients/:patientId/episodes/:episodeId/prescriptions/:rxId/medications/:medId     MEDICO/ADMIN
```

**Roles:**
- `READERS` = ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE
- `PRESCRIBERS` (escritura) = ADMIN, MEDICO **únicamente**

---

## Entidad `Prescription` (respuesta)

```typescript
{
  id: string
  episodeId: string
  codigoHc: string                  // 'HC-2024-0037' — desnormalizado
  pacienteId: string                // desnormalizado
  medicoId: string                  // UUID médico prescriptor
  numeroPrescripcion: number        // secuencial por episodio (1, 2, 3...)
  fechaPrescripcion: string         // 'YYYY-MM-DD'
  firmaDigital: string | null       // null = no firmada; presente = inmutable
  observaciones: string | null
  medications: Medication[]         // array ordenado por `orden` (solo en GET detalle)
  createdAt: string
  updatedAt: string
}
```

**Listado paginado** (`GET /prescriptions`): `medications` retorna `[]` para evitar N+1.  
**Detalle** (`GET /prescriptions/:rxId`): `medications` ordenados ASC por `orden`.

---

## Entidad `Medication` (respuesta)

```typescript
{
  id: string
  prescriptionId: string
  orden: number
  principioActivo: string           // requerido (min 2, max 255)
  nombreComercial: string | null
  concentracion: string | null      // ej: '400mg', '500mg/5ml'
  formaFarmaceutica: FormaFarmaceutica | null
  dosis: string | null              // ej: '1 tableta'
  viaAdministracion: ViaAdministracion  // default: 'oral'
  frecuencia: string | null         // ej: 'Cada 8 horas'
  duracionDias: number | null       // 1-365
  indicaciones: string | null       // max 1000 chars
  createdAt: string
  updatedAt: string
}
```

**`FormaFarmaceutica` enum:**
```
tableta | capsula | jarabe | ampolla | crema | parche | colirio | gotas | supositorio | polvo | aerosol | otro
```

**`ViaAdministracion` enum:**
```
oral | intravenosa | intramuscular | subcutanea | topica | inhalatoria | rectal | ocular | otro
```

---

## Crear prescripción — `POST`

**Body:**
```typescript
{
  medicoId: string                   // UUID médico (requerido)
  fechaPrescripcion: string          // 'YYYY-MM-DD' (requerido)
  observaciones?: string             // max 1000
  firmaDigital?: string              // max 2000 (base64 o hash)
  medications?: CreateMedicationDto[] // min 1 si se provee; Builder asigna orden auto
}
```

**`numeroPrescripcion`** auto-generado: `MAX(numero_prescripcion) + 1` por episodio en transacción.

**Prerequisito:** Episodio en `abierto` o `en_tratamiento` (422 si cerrado/archivado).

---

## Agregar medicamento — `POST /:rxId/medications`

**Body:**
```typescript
{
  principioActivo: string           // requerido
  nombreComercial?: string
  concentracion?: string
  formaFarmaceutica?: FormaFarmaceutica
  dosis?: string
  viaAdministracion?: ViaAdministracion  // default oral
  frecuencia?: string
  duracionDias?: number             // 1-365
  indicaciones?: string
  orden?: number                    // auto si omitido (MAX + 1)
}
```

---

## Listado — `GET /prescriptions`

**Query params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | int | default 1 |
| `limit` | int | default 20, max 100 |
| `medicoId` | uuid | filtrar por médico |
| `desde` | YYYY-MM-DD | fecha inicio |
| `hasta` | YYYY-MM-DD | fecha fin |

---

## Reglas de negocio

1. Solo `MEDICO` o `ADMIN` crea/modifica (403 si FISIOTERAPEUTA intenta escribir)
2. Prescripción firmada → inmutable (PATCH, add/update/remove medications → 422)
3. Solo el médico autor o admin puede modificar (`medicoId === currentUser.id`)
4. `numeroPrescripcion` generado por sistema — no enviar en body
5. `codigoHc` y `pacienteId` desnormalizados desde episodio al crear

---

## Cache Redis

| Clave | TTL | Invalidación |
|-------|-----|--------------|
| `rx:id:{id}` | 600s | PATCH, add/update/remove medication |

---

## Archivos backend

```
src/modules/prescriptions/
  builders/prescription.builder.ts
  entities/
    prescription.entity.ts
    medication.entity.ts
  dto/
    create-prescription.dto.ts   ← incluye medications[] opcional
    update-prescription.dto.ts
    create-medication.dto.ts
    update-medication.dto.ts
    prescription-query.dto.ts
  prescriptions.service.ts
  prescriptions.controller.ts
  prescriptions.module.ts

src/database/migrations/1747440018000-CreatePrescriptions.ts
```

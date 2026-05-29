# HU01-EPIC — Diseño: Episodio Clínico

## Contexto

El episodio clínico es el contenedor principal de la historia clínica de un paciente para una condición específica. Un paciente puede tener **N episodios activos simultáneos** (ej: episodio hombro + episodio mano). El módulo `clinical-episodes` ya está implementado en backend; este EPIC extiende y completa la funcionalidad.

---

## Modelo de Datos

### Entidad `ClinicalEpisode` — estado actual (implementado)

```typescript
{
  id: uuid
  tarjeteroId: uuid
  codigoHc: string                    // 'HC-2024-0037'
  pacienteId: uuid
  profesionalId: uuid
  estado: EstadoEpisodio
  motivoConsulta: string
  diagnosticoPrincipal: string | null
  codigoCie10: string | null          // 'M51.1'
  diagnosticoSecundario: string | null
  notaApertura: string | null
  notaCierre: string | null
  fechaApertura: string               // 'YYYY-MM-DD'
  fechaCierre: string | null
  appointmentId: uuid | null
}
```

### Extensiones requeridas (nuevas migraciones)

```sql
-- Migración: AddTherapeuticObjectivesToEpisodes
ALTER TABLE clinical_episodes
  ADD COLUMN objetivos_terapeuticos JSONB DEFAULT NULL,
  ADD COLUMN tipo_alta VARCHAR(50) DEFAULT NULL,
  ADD COLUMN recomendaciones_alta TEXT DEFAULT NULL,
  ADD COLUMN fecha_seguimiento DATE DEFAULT NULL,
  ADD COLUMN consentimiento_file_id UUID REFERENCES patient_files(id) ON DELETE SET NULL,
  ADD COLUMN diagnostico_diferencial TEXT DEFAULT NULL;
```

### Estructura JSONB `objetivos_terapeuticos`

```typescript
interface ObjetivoTerapeutico {
  id: string          // uuid local
  descripcion: string
  plazo: 'corto' | 'mediano' | 'largo'
  estado: 'pendiente' | 'logrado' | 'parcial' | 'no_logrado'
  fechaLogro: string | null
}

// campo en entity
objetivosTerapeuticos: ObjetivoTerapeutico[] | null
```

### Enum `TipoAlta`

```typescript
enum TipoAlta {
  ALTA_COMPLETA    = 'alta_completa',
  REFERIDO         = 'referido',
  ABANDONO         = 'abandono',
  ALTA_VOLUNTARIA  = 'alta_voluntaria',
  FALLECIMIENTO    = 'fallecimiento',
}
```

---

## Máquina de Estados

```
                    ┌──────────────┐
                    │    ABIERTO   │ ← POST /episodes (estado inicial)
                    └──────┬───────┘
                           │ auto: primera SOAP creada
                           ▼
                    ┌──────────────┐
                    │EN_TRATAMIENTO│
                    └──────┬───────┘
                           │ POST /episodes/:id/close
                           ▼
                    ┌──────────────┐
                    │   CERRADO    │ ← notaCierre + tipoAlta requeridos
                    └──────┬───────┘
                           │ PATCH (solo ADMIN)
                           ▼
                    ┌──────────────┐
                    │  ARCHIVADO   │ ← inmutable
                    └──────────────┘

Re-apertura (nueva HU):
  CERRADO → ABIERTO  via POST /episodes/:id/reopen (solo ADMIN|MEDICO)
             con campo motivoReapertura (min 20 chars)
```

---

## Arquitectura de Componentes Frontend

### Vista principal: `PatientTabs → HistoriaClinicaTab`

```
HistoriaClinicaTab
├── EpisodeListPanel                    ← lista episodios activos + historial
│   ├── EpisodeStatusBadge              ← chip color por estado
│   ├── EpisodeCreateButton             → EpisodeCreateModal
│   └── EpisodeCard (por episodio)
│       ├── EpisodeActiveCard           ← expandible, props: headerless, noBorder
│       ├── EpisodeDiagnosticoSection   ← CIE-10 + diagnóstico + diferencial
│       ├── EpisodeObjectivesSection    ← NEW: lista objetivos + progress bar
│       └── EpisodeActionsMenu
│           ├── → EpisodeUpdateModal
│           ├── → EpisodeDiagnosticoModal
│           ├── → EpisodeObjectivesModal  ← NEW
│           ├── → EpisodeCloseModal       ← extendido con tipoAlta
│           └── → EpisodeReopenModal      ← NEW
│
├── EpisodeMetricsPanel                 ← NEW: KPIs + gráficas evolución
│   ├── VasTrendChart                   ← escala dolor por sesión
│   ├── SessionProgressBar              ← sesiones completadas / estimadas
│   └── EpisodeSummaryKPIs             ← días activos, # SOAPs, # evaluaciones
│
└── EpisodeConsentBanner                ← NEW: banner si no hay consentimiento
```

### Modales nuevos / extendidos

| Modal | Estado | Cambio |
|---|---|---|
| `EpisodeCreateModal` | existente | agregar `objetivosTerapeuticos[]` opcional |
| `EpisodeCloseModal` | existente | agregar `tipoAlta` select + `recomendacionesAlta` + `fechaSeguimiento` |
| `EpisodeDiagnosticoModal` | existente | agregar `diagnosticoDiferencial` + buscador CIE-10 |
| `EpisodeObjectivesModal` | **NEW** | CRUD objetivos + marcar estado |
| `EpisodeReopenModal` | **NEW** | motivoReapertura text area |
| `EpisodeMetricsDrawer` | **NEW** | panel lateral con gráficas |

---

## Diseño de API — Extensiones

### Endpoints nuevos

```
POST  /patients/:pid/episodes/:id/reopen          — re-abrir episodio cerrado
PATCH /patients/:pid/episodes/:id/objectives      — upsert objetivos terapéuticos
GET   /patients/:pid/episodes/:id/metrics         — KPIs + datos para gráficas
GET   /cie10/search?q=lumbalgia&limit=10          — buscador CIE-10
```

### Respuesta `/metrics`

```typescript
{
  episodeId: string
  diasActivo: number
  sesionesCompletadas: number
  sesionesEstimadas: number | null
  progresoPorcentaje: number
  soapCount: number
  evaluacionCount: number
  planCount: number
  vasTrend: Array<{
    fecha: string        // 'YYYY-MM-DD'
    numeroSesion: number
    escalaDolor: number  // 0-10
  }>
  objetivosResumen: {
    total: number
    logrados: number
    parciales: number
    pendientes: number
  }
}
```

---

## Buscador CIE-10

Tabla `cie10_codes` (solo lectura, seeds):

```sql
CREATE TABLE cie10_codes (
  codigo VARCHAR(10) PRIMARY KEY,    -- 'M51.1'
  descripcion TEXT NOT NULL,         -- 'Degeneración de disco intervertebral lumbar'
  categoria VARCHAR(100)             -- 'Enfermedades del sistema musculoesquelético'
);
```

Endpoint `GET /cie10/search?q=<term>&limit=10` — búsqueda ILIKE en `codigo` y `descripcion`.

---

## Roles y Permisos

| Acción | ADMIN | MEDICO | FISIOTERAPEUTA | PASANTE |
|---|:---:|:---:|:---:|:---:|
| Abrir episodio | ✅ | ✅ | ✅ | ❌ |
| Actualizar diagnóstico | ✅ | ✅ | ✅ | ❌ |
| Gestionar objetivos | ✅ | ✅ | ✅ | ❌ |
| Cerrar episodio | ✅ | ✅ | ✅ | ❌ |
| Re-abrir episodio | ✅ | ✅ | ❌ | ❌ |
| Archivar episodio | ✅ | ❌ | ❌ | ❌ |
| Ver métricas | ✅ | ✅ | ✅ | ✅ |
| Ver consentimiento | ✅ | ✅ | ✅ | ✅ |

---

## Consideraciones Técnicas

- `objetivosTerapeuticos` usa JSONB para evitar tabla separada; máx 20 objetivos por episodio.
- Buscador CIE-10: tabla seeds independiente, no requiere módulo CRUD.
- `vasTrend` se calcula en service leyendo `soap_notes.subjetivo->>'escalaDolor'` + `fecha_sesion`.
- Re-apertura crea audit log con `motivoReapertura`.
- Consentimiento: FK a `patient_files`; si `null` → banner warning en UI, NO bloquea (MSP Ecuador no lo exige digitalmente aún).

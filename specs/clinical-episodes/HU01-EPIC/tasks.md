# HU01-EPIC — Tasks: Episodio Clínico

## Dependencias entre épicas

```
EP2 (CIE-10 DB) ──┐
EP1 (ciclo vida) ──┼──► EP3 (objetivos) ──► EP4 (alta estructurada) ──► EP5 (métricas)
                  │
                  └──► EP6 (consentimiento) ──► EP7 (dashboard + PDF)
```

---

## EP1 — Ciclo de vida (completar)

### Backend

- [ ] **T-EP1-B01** `PATCH /episodes/:id` — validar que `estado` no se puede enviar para transicionar a `cerrado` (solo via `/close`)
- [ ] **T-EP1-B02** Nuevo endpoint `POST /patients/:pid/episodes/:id/reopen`
  - Solo roles `ADMIN | MEDICO`
  - Body: `{ motivoReapertura: string (min 20) }`
  - Transición: `cerrado → abierto`
  - Registrar en audit log con `motivoReapertura`
  - Error 422 si estado !== `cerrado`
- [ ] **T-EP1-B03** Filtro `codigoCie10` en `GET /patients/:pid/episodes` y `GET /episodes`
- [ ] **T-EP1-B04** DTO `ReopenEpisodeDto` con validaciones

### Frontend

- [ ] **T-EP1-F01** Nuevo componente `EpisodeReopenModal.tsx`
  - TextArea `motivoReapertura` (min 20, max 500)
  - Confirmación explícita antes de submit
  - Disponible solo si `rol === ADMIN || MEDICO || FISIOTERAPEUTA` + `episode.estado === 'cerrado'`
- [ ] **T-EP1-F02** Hook `useReopenEpisode` en `useEpisodes.ts`
- [ ] **T-EP1-F03** `episodeService.ts` — agregar `reopenEpisode(patientId, episodeId, body)`
- [ ] **T-EP1-F04** Botón "Reabrir episodio" en `EpisodeActiveCard` menu de acciones (visible solo si cerrado + rol)
- [ ] **T-EP1-F05** Vista global de episodios por profesional (`/admin/episodes`) — tabla paginada con filtros estado / fecha / CIE-10

---

## EP2 — Diagnóstico clínico (extender)

### Backend

- [ ] **T-EP2-B01** Migración: tabla `cie10_codes (codigo PK, descripcion TEXT, categoria VARCHAR)`
- [ ] **T-EP2-B02** Seeds CIE-10 — cargar subset MSP Ecuador (mínimo capítulos M, S, G, R, Z — musculoesquelético + lesiones + neurológico + síntomas + factores salud)
- [ ] **T-EP2-B03** Nuevo módulo `cie10` (solo lectura)
  - `GET /cie10/search?q=<term>&limit=10` — ILIKE en `codigo` y `descripcion`
  - Cache Redis TTL 600s por query key
  - No requiere autenticación (o mismo guard que resto)
- [ ] **T-EP2-B04** Migración: `ALTER TABLE clinical_episodes ADD COLUMN diagnostico_diferencial TEXT`
- [ ] **T-EP2-B05** `UpdateEpisodeDto` — agregar `diagnosticoDiferencial?: string`
- [ ] **T-EP2-B06** Audit log en `ClinicalEpisodesService.update()` cuando cambia `diagnosticoPrincipal` o `codigoCie10`
- [ ] **T-EP2-B07** Validar formato `codigoCie10`: regex `/^[A-Z]\d{2}(\.\d{1,2})?$/` en DTO

### Frontend

- [ ] **T-EP2-F01** Componente `Cie10SearchInput.tsx`
  - Input con debounce 300ms → llama `GET /cie10/search`
  - Dropdown con resultados (código + descripción)
  - Al seleccionar: llena campo `codigoCie10` y `diagnosticoPrincipal` (si vacío)
- [ ] **T-EP2-F02** `cie10Service.ts` — `searchCie10(query: string)`
- [ ] **T-EP2-F03** Hook `useCie10Search(query)` con React Query `staleTime: 60000`
- [ ] **T-EP2-F04** Integrar `Cie10SearchInput` en `EpisodeDiagnosticoModal`
- [ ] **T-EP2-F05** Campo `diagnosticoDiferencial` TextArea en `EpisodeDiagnosticoModal`
- [ ] **T-EP2-F06** Actualizar tipo `ClinicalEpisode` en `models.ts` — agregar `diagnosticoDiferencial`

---

## EP3 — Objetivos terapéuticos

### Backend

- [ ] **T-EP3-B01** Migración: `ALTER TABLE clinical_episodes ADD COLUMN objetivos_terapeuticos JSONB DEFAULT NULL`
- [ ] **T-EP3-B02** Interface TypeScript `ObjetivoTerapeutico` en `clinical-episodes/interfaces/`
- [ ] **T-EP3-B03** Nuevo endpoint `PATCH /patients/:pid/episodes/:id/objectives`
  - Body: `{ objetivos: ObjetivoTerapeutico[] }` — reemplaza array completo (upsert)
  - Validar: max 20 items, descripción min 10 / max 300
  - Error 422 si episodio `cerrado` o `archivado`
  - Auto-set `fechaLogro = today` cuando `estado` cambia a `logrado`
- [ ] **T-EP3-B04** Incluir `objetivosTerapeuticos` y `objetivosResumen` en respuesta `GET /episodes/:id`
- [ ] **T-EP3-B05** `objetivosResumen` calculado en service: `{ total, logrados, parciales, pendientes }`
- [ ] **T-EP3-B06** Validar regla: objetivo en estado `logrado` no puede regresar a `pendiente`

### Frontend

- [ ] **T-EP3-F01** Nuevo componente `EpisodeObjectivesModal.tsx`
  - Lista de objetivos con chip de estado color-coded
  - Botones para cambiar estado de cada objetivo
  - Formulario inline para agregar nuevo objetivo
  - Drag & drop para reordenar (opcional, baja prioridad)
- [ ] **T-EP3-F02** Componente `EpisodeObjectivesSection.tsx` — sección colapsable dentro de episodio activo
  - Muestra progress bar: X/Y objetivos logrados
  - Lista compacta de objetivos con estado
  - Botón "Gestionar objetivos" → abre modal
- [ ] **T-EP3-F03** Hook `useUpdateObjectives` en `useEpisodes.ts`
- [ ] **T-EP3-F04** `episodeService.ts` — agregar `updateObjectives(patientId, episodeId, objectives)`
- [ ] **T-EP3-F05** Actualizar tipo `ClinicalEpisode` en `models.ts` — agregar `objetivosTerapeuticos`, `objetivosResumen`
- [ ] **T-EP3-F06** Integrar sección de objetivos en flujo de cierre (`EpisodeCloseModal`) como resumen read-only

---

## EP4 — Alta y resultado clínico

### Backend

- [ ] **T-EP4-B01** Migración: `ALTER TABLE clinical_episodes ADD COLUMN tipo_alta VARCHAR(50), ADD COLUMN recomendaciones_alta TEXT, ADD COLUMN fecha_seguimiento DATE`
- [ ] **T-EP4-B02** Enum `TipoAlta` en TypeORM entity
- [ ] **T-EP4-B03** `CloseEpisodeDto` — agregar `tipoAlta: TipoAlta (required)`, `recomendacionesAlta?: string (max 1000)`, `fechaSeguimiento?: string`
- [ ] **T-EP4-B04** Validación condicional en service: si `tipoAlta === 'referido'` → `recomendacionesAlta` requerido (min 20)
- [ ] **T-EP4-B05** Validación `fechaSeguimiento` > `fechaCierre` (si se provee)
- [ ] **T-EP4-B06** Incluir campos de alta en respuesta `GET /episodes/:id`

### Frontend

- [ ] **T-EP4-F01** Extender `EpisodeCloseModal.tsx`
  - Select `tipoAlta` (required) con opciones descriptivas
  - TextArea `recomendacionesAlta` (condicional required si `tipoAlta === 'referido'`)
  - DatePicker `fechaSeguimiento` (opcional, solo fechas futuras)
  - Sección read-only: resumen objetivos (de EP3)
- [ ] **T-EP4-F02** Actualizar tipo `ClinicalEpisode` en `models.ts` — agregar `tipoAlta`, `recomendacionesAlta`, `fechaSeguimiento`
- [ ] **T-EP4-F03** Mostrar badge `tipoAlta` en vista de episodio cerrado
- [ ] **T-EP4-F04** Mostrar `fechaSeguimiento` como recordatorio si es futura

---

## EP5 — Evolución y métricas

### Backend

- [ ] **T-EP5-B01** Nuevo endpoint `GET /patients/:pid/episodes/:id/metrics`
  - Calcula: `diasActivo`, `sesionesCompletadas`, `sesionesEstimadas`, `progresoPorcentaje`
  - Calcula: `soapCount`, `evaluacionCount`, `planCount`
  - Calcula: `vasTrend[]` — leer `soap_notes` JSONB campo `subjetivo->escalaDolor`
  - Calcula: `objetivosResumen` (si EP3 implementado)
  - Cache Redis `EPISODE_METRICS(id)` TTL 300s; invalidar en crear/actualizar SOAP, sesión, evaluación
- [ ] **T-EP5-B02** Comparativa evaluaciones: incluir primera y última `physical_evaluation` en respuesta metrics (`evaluacionInicial`, `evaluacionFinal`)

### Frontend

- [ ] **T-EP5-F01** Componente `EpisodeMetricsPanel.tsx`
  - Grid 2x3 con KPI cards (días activo, sesiones, progreso, SOAPs, evaluaciones, objetivos)
- [ ] **T-EP5-F02** Componente `VasTrendChart.tsx`
  - LineChart (Recharts) eje X = número sesión, eje Y = 0-10
  - Solo renderiza si `vasTrend.length >= 2`
  - Tooltip con fecha y valor
- [ ] **T-EP5-F03** `episodeService.ts` — agregar `getEpisodeMetrics(patientId, episodeId)`
- [ ] **T-EP5-F04** Hook `useEpisodeMetrics(patientId, episodeId)` en `useEpisodes.ts`
- [ ] **T-EP5-F05** Integrar `EpisodeMetricsPanel` + `VasTrendChart` en `EpisodeActiveCard` (tab o sección colapsable)

---

## EP6 — Consentimiento informado

### Backend

- [ ] **T-EP6-B01** Migración: `ALTER TABLE clinical_episodes ADD COLUMN consentimiento_file_id UUID REFERENCES patient_files(id) ON DELETE SET NULL`
- [ ] **T-EP6-B02** `UpdateEpisodeDto` — agregar `consentimientoFileId?: string (uuid)`
- [ ] **T-EP6-B03** Validar en service: el `patient_file` referenciado debe existir, pertenecer al mismo paciente, y tener `categoria = 'consentimiento'`
- [ ] **T-EP6-B04** Incluir `consentimientoFile` (objeto anidado) en respuesta `GET /episodes/:id`

### Frontend

- [ ] **T-EP6-F01** Componente `EpisodeConsentBanner.tsx`
  - Banner amarillo no bloqueante si `consentimientoFile === null`
  - Botón "Vincular consentimiento" → modal de selección
- [ ] **T-EP6-F02** Modal `EpisodeConsentLinkModal.tsx`
  - Lista `patient_files` del paciente filtrada por `categoria = 'consentimiento'`
  - Botón para subir nuevo archivo si no hay ninguno
  - Al seleccionar → PATCH episodio con `consentimientoFileId`
- [ ] **T-EP6-F03** Mostrar consentimiento vinculado con link de descarga (presigned URL de R2)

---

## EP7 — Dashboard y exportación

### Backend

- [ ] **T-EP7-B01** Endpoint `GET /patients/:pid/episodes/:id/export/pdf`
  - Genera PDF con: cabecera paciente, diagnóstico, objetivos, resumen SOAP (últimas 5), tipo alta, recomendaciones
  - Librería: `pdfmake` o `puppeteer` (evaluar tamaño bundle)
  - Retorna `Content-Type: application/pdf`
- [ ] **T-EP7-B02** Timeline ya existe: `GET /patients/:pid/timeline` — verificar incluye filtro por `episodeId`

### Frontend

- [ ] **T-EP7-F01** Botón "Exportar episodio PDF" en `EpisodeActiveCard` — disponible para todos los roles
- [ ] **T-EP7-F02** Filtro por `episodeId` en `HistoriaClinicaTab` timeline (si no existe)

---

## Orden de implementación sugerido

```
Semana 1: T-EP2-B01..07 + T-EP2-F01..06 (CIE-10 — base para resto)
Semana 2: T-EP3-B01..06 + T-EP3-F01..06 (Objetivos)
Semana 3: T-EP4-B01..06 + T-EP4-F01..04 (Alta estructurada)
Semana 4: T-EP1-B01..04 + T-EP1-F01..05 (Re-apertura + vista global)
Semana 5: T-EP5-B01..02 + T-EP5-F01..05 (Métricas + VAS)
Semana 6: T-EP6-B01..04 + T-EP6-F01..03 (Consentimiento)
Semana 7: T-EP7-B01..02 + T-EP7-F01..02 (PDF + export)
```

---

## Notas de implementación

- Todas las migraciones deben usar patrón `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` para enums.
- `ValidationPipe` en `main.ts` usa `whitelist: true` — todo campo nuevo en DTO debe estar decorado explícitamente.
- Cache Redis: invalidar `EPISODE_ID(id)` en toda operación de escritura sobre el episodio.
- TypeORM columns nullable: siempre declarar `type: 'varchar'` o tipo explícito para evitar `DataTypeNotSupportedError`.

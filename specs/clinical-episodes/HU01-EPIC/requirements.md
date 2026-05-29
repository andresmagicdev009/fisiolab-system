# HU01-EPIC — Requerimientos: Episodio Clínico

## Épicas del EPIC

| ID | Épica | Prioridad |
|---|---|:---:|
| EP1 | Ciclo de vida del episodio (completar) | Alta |
| EP2 | Diagnóstico clínico (extender) | Alta |
| EP3 | Objetivos terapéuticos | Alta |
| EP4 | Alta y resultado clínico estructurado | Alta |
| EP5 | Evolución y métricas del episodio | Media |
| EP6 | Consentimiento informado | Media |
| EP7 | Dashboard y exportación | Baja |

---

## EP1 — Ciclo de vida del episodio

### Requerimientos funcionales

**RF-EP1-01:** El profesional puede abrir un episodio clínico para un paciente que tenga tarjetero con estado `activo`.

**RF-EP1-02:** Un paciente puede tener múltiples episodios en estado `abierto` o `en_tratamiento` simultáneamente. El sistema NO debe restringir a un único episodio activo.

**RF-EP1-03:** El episodio transiciona automáticamente de `abierto` a `en_tratamiento` al crear la primera nota SOAP.

**RF-EP1-04:** Solo ADMIN o MEDICO puede re-abrir un episodio en estado `cerrado`. La re-apertura requiere campo `motivoReapertura` (mínimo 20 caracteres). El episodio vuelve a estado `abierto`.

**RF-EP1-05:** Solo ADMIN puede transicionar un episodio de `cerrado` a `archivado`. Un episodio archivado es inmutable.

**RF-EP1-06:** El profesional puede listar todos sus episodios asignados con filtros: estado, rango de fechas, código CIE-10.

**RF-EP1-07:** ADMIN puede ver la lista global de todos los episodios de todos los pacientes con los mismos filtros.

### Reglas de negocio

- Tarjetero con estado `inactivo` o `archivado` → 422 al intentar abrir episodio.
- Transiciones inválidas (ej: `abierto → cerrado` sin pasar por `en_tratamiento`) → 403.
- `fechaApertura` = fecha del sistema al crear; no editable.
- `fechaCierre` = fecha del sistema al cerrar vía `POST /close`; no editable.
- Re-apertura queda registrada en audit log con `motivoReapertura`.

---

## EP2 — Diagnóstico clínico

### Requerimientos funcionales

**RF-EP2-01:** Al crear o actualizar un episodio, el profesional puede ingresar diagnóstico principal como texto libre.

**RF-EP2-02:** El profesional puede buscar y seleccionar un código CIE-10 mediante buscador por código (ej: `M51`) o descripción (ej: `lumbalgia`). El buscador retorna máximo 10 resultados.

**RF-EP2-03:** El profesional puede ingresar diagnóstico secundario (texto libre) y diagnóstico diferencial (texto libre, nuevo campo).

**RF-EP2-04:** El diagnóstico puede actualizarse en cualquier momento mientras el episodio esté `abierto` o `en_tratamiento`.

**RF-EP2-05:** Un episodio cerrado o archivado no permite edición de diagnóstico → 422.

**RF-EP2-06:** El sistema registra en audit log cada cambio de diagnóstico principal o código CIE-10.

### Reglas de negocio

- `codigoCie10` debe seguir formato `[A-Z]\d{2}(\.\d{1,2})?` si se provee (ej: `M51.1`, `S82`).
- Buscador CIE-10 disponible para todos los roles que pueden editar episodios.

---

## EP3 — Objetivos terapéuticos

### Requerimientos funcionales

**RF-EP3-01:** El profesional puede definir hasta 20 objetivos terapéuticos por episodio. Cada objetivo tiene: descripción (requerido), plazo (`corto|mediano|largo`), estado (`pendiente|logrado|parcial|no_logrado`).

**RF-EP3-02:** Los objetivos pueden crearse al momento de abrir el episodio o agregarse/editarse después.

**RF-EP3-03:** El profesional puede marcar un objetivo como `logrado`, `parcial` o `no_logrado` en cualquier momento mientras el episodio esté activo.

**RF-EP3-04:** Al cerrar el episodio, el sistema muestra resumen de objetivos (X logrados / Y total) como parte del flujo de cierre.

**RF-EP3-05:** Un objetivo marcado como `logrado` registra automáticamente `fechaLogro` con la fecha del sistema.

**RF-EP3-06:** Los objetivos son visibles pero no editables en episodios `cerrados` o `archivados`.

### Reglas de negocio

- Máximo 20 objetivos por episodio (validado en backend).
- Descripción de objetivo: mínimo 10 caracteres, máximo 300.
- Un objetivo `logrado` no puede volver a `pendiente`.
- Orden de objetivos determinado por el profesional (índice array).

---

## EP4 — Alta y resultado clínico

### Requerimientos funcionales

**RF-EP4-01:** Al cerrar un episodio, el profesional debe seleccionar obligatoriamente el tipo de alta: `alta_completa | referido | abandono | alta_voluntaria | fallecimiento`.

**RF-EP4-02:** `notaCierre` sigue siendo requerida (mínimo 10 caracteres). Se complementa con los campos estructurados de alta.

**RF-EP4-03:** El profesional puede registrar recomendaciones post-alta (texto libre, hasta 1000 caracteres).

**RF-EP4-04:** El profesional puede registrar fecha sugerida de seguimiento post-alta (`fechaSeguimiento`, formato `YYYY-MM-DD`, debe ser futura).

**RF-EP4-05:** Si `tipoAlta = referido`, el campo `recomendacionesAlta` pasa a ser requerido (min 20 chars).

**RF-EP4-06:** El resumen de cierre (tipoAlta + notaCierre + recomendaciones + objetivos cumplidos) es visible en la vista de detalle del episodio cerrado.

### Reglas de negocio

- Cierre solo vía `POST /close` — el PATCH no puede transicionar a `cerrado`.
- `fechaSeguimiento` debe ser posterior a `fechaCierre`.
- Episodio cerrado no puede modificarse excepto para archivar (solo ADMIN).

---

## EP5 — Evolución y métricas

### Requerimientos funcionales

**RF-EP5-01:** La vista de episodio expone KPIs: días activos, sesiones completadas, sesiones estimadas, progreso porcentual, número de evaluaciones, número de notas SOAP.

**RF-EP5-02:** El sistema genera gráfica de tendencia de escala VAS/dolor a lo largo de las sesiones del episodio (eje X: número de sesión, eje Y: escala 0-10).

**RF-EP5-03:** La gráfica VAS solo se muestra si el episodio tiene 2 o más notas SOAP con `escalaDolor` registrado.

**RF-EP5-04:** Al cerrar el episodio, se muestra comparativa evaluación inicial vs última evaluación (ROM, fuerza MRC) si existen evaluaciones físicas.

**RF-EP5-05:** Las métricas son de solo lectura para todos los roles.

### Reglas de negocio

- `vasTrend` lee `soap_notes.subjetivo->>'escalaDolor'` + `fecha_sesion` ordenado por `numero_sesion`.
- Si `escalaDolor` es `null` en una sesión, se omite ese punto de la gráfica.
- Progreso = `sesionesCompletadas / sesionesEstimadas × 100`, máx 100%.

---

## EP6 — Consentimiento informado

### Requerimientos funcionales

**RF-EP6-01:** El profesional puede vincular un archivo de tipo `consentimiento` (del módulo `patient-files`) a un episodio.

**RF-EP6-02:** Si el episodio no tiene consentimiento vinculado, la UI muestra banner de advertencia no bloqueante.

**RF-EP6-03:** El consentimiento vinculado es visible y descargable desde la vista del episodio.

**RF-EP6-04:** Se puede desvincular o reemplazar el consentimiento mientras el episodio esté `abierto` o `en_tratamiento`.

### Reglas de negocio

- No bloquear flujo clínico por ausencia de consentimiento (MSP Ecuador no exige firma digital aún).
- Solo archivos de categoría `consentimiento` son elegibles para vincular.
- FK `consentimiento_file_id → patient_files.id ON DELETE SET NULL`.

---

## EP7 — Dashboard y exportación

### Requerimientos funcionales

**RF-EP7-01:** La vista de episodio muestra timeline consolidado de todos los artefactos (SOAPs, evaluaciones, sesiones, citas) ordenados por fecha DESC.

**RF-EP7-02:** El profesional puede filtrar el timeline por tipo de artefacto y rango de fechas.

**RF-EP7-03:** El profesional puede exportar el resumen del episodio a PDF (incluye: datos del paciente, diagnóstico, objetivos, notas SOAP resumidas, tipo de alta, recomendaciones).

**RF-EP7-04:** El PDF generado sigue formato compatible con referidos MSP Ecuador.

### Reglas de negocio

- Exportación disponible para episodios en cualquier estado.
- PDF no incluye información financiera (session-payments / invoices).

---

## Requerimientos No Funcionales

| ID | Requerimiento | Métrica |
|---|---|---|
| RNF-01 | Buscador CIE-10 responde en < 200ms | p95 < 200ms |
| RNF-02 | Métricas del episodio calculadas en < 500ms | p95 < 500ms |
| RNF-03 | Cache Redis para métricas y lista CIE-10 frecuente | TTL 300s |
| RNF-04 | Exportación PDF generada en < 3s | p95 < 3s |
| RNF-05 | Validación de rol en cada endpoint | 403 si no autorizado |
| RNF-06 | Audit log en toda transición de estado | 100% cobertura |
| RNF-07 | JSONB `objetivosTerapeuticos` validado en service layer | max 20 items |

---

## Restricciones

- Ecuador MSP: códigos CIE-10 compatibles con clasificación OPS/OMS.
- Cédula ecuatoriana ya validada en módulo `patients`.
- Roles: `ADMIN | MEDICO | FISIOTERAPEUTA | PASANTE` — no crear roles nuevos.
- Backend: NestJS + TypeORM + PostgreSQL. No usar ORM diferente.
- Frontend: React 18 + Chakra UI v2. No introducir librerías de componentes adicionales.
- Librerías de gráficas permitidas: Recharts (ya en proyecto) o similar.

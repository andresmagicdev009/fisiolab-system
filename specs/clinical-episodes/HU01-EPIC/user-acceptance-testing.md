# HU01-EPIC — User Acceptance Testing: Episodio Clínico

## Convenciones

- **Actor:** rol que ejecuta la acción
- **Estado inicial:** precondición antes del test
- **Resultado esperado:** lo que el sistema DEBE hacer
- **Resultado rechazado:** lo que el sistema NO debe hacer

Todos los tests asumen: paciente existe + tarjetero en estado `activo`.

---

## EP1 — Ciclo de vida del episodio

### UAT-EP1-01: Abrir episodio exitoso

**Actor:** FISIOTERAPEUTA  
**Estado inicial:** Paciente con tarjetero `activo`, sin episodios  
**Acción:** POST `{ motivoConsulta: "Dolor lumbar crónico", profesionalId: <id> }`  
**Resultado esperado:**
- HTTP 201
- Episodio creado con `estado: 'abierto'`
- `fechaApertura` = fecha sistema
- `fechaCierre = null`

---

### UAT-EP1-02: Múltiples episodios activos simultáneos

**Actor:** MEDICO  
**Estado inicial:** Paciente con episodio A en `en_tratamiento` (hombro)  
**Acción:** Abrir episodio B `{ motivoConsulta: "Dolor en mano derecha" }`  
**Resultado esperado:**
- HTTP 201 — episodio B creado correctamente
- `GET /patients/:pid/episodes` retorna ambos episodios activos
**Resultado rechazado:**
- HTTP 422 "ya tiene episodio activo" — este error NO debe ocurrir

---

### UAT-EP1-03: Bloqueo por tarjetero inactivo

**Actor:** FISIOTERAPEUTA  
**Estado inicial:** Paciente con tarjetero en estado `inactivo`  
**Acción:** POST crear episodio  
**Resultado esperado:** HTTP 422 con mensaje que indica tarjetero no activo

---

### UAT-EP1-04: Transición automática abierto → en_tratamiento

**Actor:** FISIOTERAPEUTA  
**Estado inicial:** Episodio en estado `abierto`  
**Acción:** POST crear primera nota SOAP para ese episodio  
**Resultado esperado:**
- SOAP creado HTTP 201
- `GET /episodes/:id` retorna `estado: 'en_tratamiento'`

---

### UAT-EP1-05: Cierre de episodio

**Actor:** MEDICO  
**Estado inicial:** Episodio en `en_tratamiento`  
**Acción:** `POST /episodes/:id/close { notaCierre: "Paciente dado de alta con mejoría", tipoAlta: "alta_completa" }`  
**Resultado esperado:**
- HTTP 200
- `estado: 'cerrado'`, `fechaCierre` = fecha sistema
- `tipoAlta: 'alta_completa'`
**Resultado rechazado:**
- Poder cerrar con PATCH enviando `{ estado: "cerrado" }` — debe retornar 422/403

---

### UAT-EP1-06: Re-apertura de episodio cerrado

**Actor:** MEDICO  
**Estado inicial:** Episodio en `cerrado`  
**Acción:** `POST /episodes/:id/reopen { motivoReapertura: "Paciente regresa con recidiva de síntomas" }`  
**Resultado esperado:**
- HTTP 200
- `estado: 'abierto'`
- Audit log registra re-apertura con `motivoReapertura`

---

### UAT-EP1-07: FISIOTERAPEUTA no puede re-abrir

**Actor:** FISIOTERAPEUTA  
**Estado inicial:** Episodio en `cerrado`  
**Acción:** `POST /episodes/:id/reopen`  
**Resultado esperado:** HTTP 403

---

### UAT-EP1-08: Archivar episodio — solo ADMIN

**Actor:** ADMIN  
**Estado inicial:** Episodio en `cerrado`  
**Acción:** `PATCH { estado: 'archivado' }`  
**Resultado esperado:** HTTP 200, `estado: 'archivado'`

**Actor:** MEDICO, misma acción  
**Resultado esperado:** HTTP 403

---

### UAT-EP1-09: Episodio archivado es inmutable

**Actor:** ADMIN  
**Estado inicial:** Episodio en `archivado`  
**Acción:** Cualquier PATCH sobre el episodio  
**Resultado esperado:** HTTP 422

---

## EP2 — Diagnóstico clínico

### UAT-EP2-01: Búsqueda CIE-10 por código

**Actor:** FISIOTERAPEUTA  
**Acción:** `GET /cie10/search?q=M51&limit=5`  
**Resultado esperado:**
- HTTP 200
- Array con máx 5 items, cada uno con `{ codigo, descripcion, categoria }`
- Todos los códigos empiezan con `M51`

---

### UAT-EP2-02: Búsqueda CIE-10 por descripción

**Actor:** MEDICO  
**Acción:** `GET /cie10/search?q=lumbalgia`  
**Resultado esperado:**
- Resultados cuya `descripcion` contenga "lumbalgia" (case insensitive)

---

### UAT-EP2-03: Actualizar diagnóstico en episodio activo

**Actor:** FISIOTERAPEUTA  
**Estado inicial:** Episodio `en_tratamiento`  
**Acción:** `PATCH { diagnosticoPrincipal: "Hernia discal L4-L5", codigoCie10: "M51.1", diagnosticoDiferencial: "Estenosis espinal" }`  
**Resultado esperado:** HTTP 200, campos actualizados

---

### UAT-EP2-04: Formato CIE-10 inválido rechazado

**Actor:** FISIOTERAPEUTA  
**Acción:** `PATCH { codigoCie10: "lumbalgia" }` (no es código válido)  
**Resultado esperado:** HTTP 400 con mensaje de formato inválido

---

### UAT-EP2-05: No editar diagnóstico en episodio cerrado

**Actor:** MEDICO  
**Estado inicial:** Episodio `cerrado`  
**Acción:** `PATCH { diagnosticoPrincipal: "Nuevo diagnóstico" }`  
**Resultado esperado:** HTTP 422

---

## EP3 — Objetivos terapéuticos

### UAT-EP3-01: Crear objetivos al abrir episodio

**Actor:** FISIOTERAPEUTA  
**Acción:** POST episodio con `objetivosTerapeuticos: [{ descripcion: "Reducir dolor VAS < 3", plazo: "corto" }]`  
**Resultado esperado:** Episodio creado, `objetivosTerapeuticos` guardado con `estado: 'pendiente'`

---

### UAT-EP3-02: Agregar objetivos post-creación

**Actor:** FISIOTERAPEUTA  
**Estado inicial:** Episodio `en_tratamiento` sin objetivos  
**Acción:** `PATCH /objectives` con array de 3 objetivos  
**Resultado esperado:** HTTP 200, 3 objetivos persistidos

---

### UAT-EP3-03: Marcar objetivo como logrado

**Actor:** MEDICO  
**Estado inicial:** Objetivo en estado `pendiente`  
**Acción:** `PATCH /objectives` enviando ese objetivo con `estado: 'logrado'`  
**Resultado esperado:**
- `estado: 'logrado'`
- `fechaLogro` = fecha sistema (no null)

---

### UAT-EP3-04: Objetivo logrado no regresa a pendiente

**Actor:** MEDICO  
**Estado inicial:** Objetivo en estado `logrado`  
**Acción:** `PATCH /objectives` enviando ese objetivo con `estado: 'pendiente'`  
**Resultado esperado:** HTTP 422 — transición inválida

---

### UAT-EP3-05: Límite de 20 objetivos

**Actor:** FISIOTERAPEUTA  
**Acción:** `PATCH /objectives` con array de 21 objetivos  
**Resultado esperado:** HTTP 400 — máximo 20 objetivos

---

### UAT-EP3-06: No editar objetivos en episodio cerrado

**Actor:** MEDICO  
**Estado inicial:** Episodio `cerrado`  
**Acción:** `PATCH /objectives`  
**Resultado esperado:** HTTP 422

---

### UAT-EP3-07: Resumen objetivos visible al cerrar

**Actor:** MEDICO  
**Estado inicial:** Episodio con 3 objetivos (1 logrado, 1 parcial, 1 pendiente)  
**Acción:** Flujo de cierre  
**Resultado esperado UI:** Sección en modal de cierre muestra "1/3 objetivos logrados"

---

## EP4 — Alta y resultado clínico

### UAT-EP4-01: Cierre con tipo de alta requerido

**Actor:** FISIOTERAPEUTA  
**Acción:** `POST /close { notaCierre: "Paciente mejorado" }` — sin `tipoAlta`  
**Resultado esperado:** HTTP 400 — `tipoAlta` requerido

---

### UAT-EP4-02: Cierre completo con todos los campos

**Actor:** MEDICO  
**Acción:** `POST /close { notaCierre: "Alta por mejoría funcional completa", tipoAlta: "alta_completa", recomendacionesAlta: "Continuar ejercicios en casa", fechaSeguimiento: "2026-06-30" }`  
**Resultado esperado:** HTTP 200, todos los campos persistidos

---

### UAT-EP4-03: Tipo alta "referido" requiere recomendaciones

**Actor:** MEDICO  
**Acción:** `POST /close { notaCierre: "Se refiere a especialista", tipoAlta: "referido" }` — sin `recomendacionesAlta`  
**Resultado esperado:** HTTP 400 — `recomendacionesAlta` requerido cuando `tipoAlta = referido`

---

### UAT-EP4-04: Fecha seguimiento debe ser futura

**Actor:** FISIOTERAPEUTA  
**Acción:** `POST /close { ..., fechaSeguimiento: "2020-01-01" }` (fecha pasada)  
**Resultado esperado:** HTTP 400 — fecha debe ser posterior a `fechaCierre`

---

### UAT-EP4-05: Tipo alta visible en vista episodio cerrado

**Actor:** cualquier rol  
**Estado inicial:** Episodio cerrado con `tipoAlta: 'referido'`  
**Acción:** `GET /episodes/:id`  
**Resultado esperado:** Respuesta incluye `tipoAlta`, `recomendacionesAlta`, `fechaSeguimiento`

---

## EP5 — Evolución y métricas

### UAT-EP5-01: Métricas básicas del episodio

**Actor:** FISIOTERAPEUTA  
**Estado inicial:** Episodio con 5 SOAPs, 2 evaluaciones, 1 plan (10 sesiones estimadas, 6 completadas)  
**Acción:** `GET /episodes/:id/metrics`  
**Resultado esperado:**
```json
{
  "soapCount": 5,
  "evaluacionCount": 2,
  "sesionesCompletadas": 6,
  "sesionesEstimadas": 10,
  "progresoPorcentaje": 60
}
```

---

### UAT-EP5-02: Tendencia VAS con datos suficientes

**Actor:** MEDICO  
**Estado inicial:** Episodio con 4 SOAPs con `escalaDolor`: [8, 7, 5, 3]  
**Acción:** `GET /episodes/:id/metrics`  
**Resultado esperado:**
```json
{
  "vasTrend": [
    { "numeroSesion": 1, "escalaDolor": 8 },
    { "numeroSesion": 2, "escalaDolor": 7 },
    { "numeroSesion": 3, "escalaDolor": 5 },
    { "numeroSesion": 4, "escalaDolor": 3 }
  ]
}
```

---

### UAT-EP5-03: VAS omite sesiones sin escalaDolor

**Actor:** MEDICO  
**Estado inicial:** Episodio con 3 SOAPs: escalaDolor [7, null, 4]  
**Acción:** `GET /episodes/:id/metrics`  
**Resultado esperado:** `vasTrend` tiene 2 puntos (sesiones 1 y 3), sesión 2 omitida

---

### UAT-EP5-04: Gráfica VAS no renderiza con < 2 puntos

**Actor:** cualquier rol — UI  
**Estado inicial:** Episodio con 1 SOAP con escalaDolor  
**Resultado esperado UI:** Gráfica VAS no aparece (componente retorna null / mensaje "datos insuficientes")

---

## EP6 — Consentimiento informado

### UAT-EP6-01: Vincular consentimiento

**Actor:** FISIOTERAPEUTA  
**Estado inicial:** Episodio `abierto`, paciente tiene archivo `categoria: 'consentimiento'` en patient_files  
**Acción:** `PATCH { consentimientoFileId: <fileId> }`  
**Resultado esperado:** HTTP 200, `GET /episodes/:id` retorna `consentimientoFile` anidado

---

### UAT-EP6-02: Solo archivos de categoría consentimiento

**Actor:** MEDICO  
**Acción:** `PATCH { consentimientoFileId: <fileId_de_categoria_laboratorio> }`  
**Resultado esperado:** HTTP 422 — categoría inválida

---

### UAT-EP6-03: Archivo de otro paciente rechazado

**Actor:** FISIOTERAPEUTA  
**Acción:** `PATCH { consentimientoFileId: <fileId_de_otro_paciente> }`  
**Resultado esperado:** HTTP 422 — archivo no pertenece al paciente

---

### UAT-EP6-04: Banner de advertencia en UI sin consentimiento

**Actor:** cualquier rol — UI  
**Estado inicial:** Episodio sin `consentimientoFile`  
**Resultado esperado UI:**
- Banner visible con texto de advertencia
- Banner NO bloquea creación de SOAP ni evaluaciones

---

### UAT-EP6-05: Desvincular consentimiento

**Actor:** MEDICO  
**Acción:** `PATCH { consentimientoFileId: null }`  
**Resultado esperado:** HTTP 200, `consentimientoFile: null`

---

## EP7 — Dashboard y exportación

### UAT-EP7-01: Exportar PDF episodio activo

**Actor:** MEDICO  
**Estado inicial:** Episodio `en_tratamiento` con datos  
**Acción:** `GET /episodes/:id/export/pdf`  
**Resultado esperado:**
- HTTP 200, `Content-Type: application/pdf`
- PDF contiene: nombre paciente, código HC, diagnóstico, objetivos, últimas 5 SOAPs

---

### UAT-EP7-02: Exportar PDF episodio cerrado

**Actor:** FISIOTERAPEUTA  
**Estado inicial:** Episodio `cerrado`  
**Acción:** `GET /episodes/:id/export/pdf`  
**Resultado esperado:** PDF incluye además `tipoAlta` y `recomendacionesAlta`

---

### UAT-EP7-03: PDF no incluye información financiera

**Actor:** cualquier rol  
**Resultado esperado:** PDF NO contiene montos, pagos, números de factura

---

## Criterios de aceptación globales

| Criterio | Obligatorio |
|---|:---:|
| Múltiples episodios activos simultáneos permitidos | ✅ |
| Cierre sin `tipoAlta` rechazado con 400 | ✅ |
| Re-apertura requiere rol ADMIN o MEDICO | ✅ |
| Episodio archivado inmutable (cualquier PATCH → 422) | ✅ |
| Audit log en toda transición de estado | ✅ |
| CIE-10 formato validado (regex) | ✅ |
| Objetivos: max 20, logrado no regresa a pendiente | ✅ |
| Consentimiento: solo categoría 'consentimiento', mismo paciente | ✅ |
| Banner consentimiento NO bloquea flujo clínico | ✅ |
| VAS chart no renderiza con < 2 puntos | ✅ |
| Roles PASANTE: solo lectura en toda la épica | ✅ |

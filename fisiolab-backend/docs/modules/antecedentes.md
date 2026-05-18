# Módulo: Antecedentes

Base path: `/api/v1/patients/:patientId/antecedentes`

Todos los endpoints requieren `Authorization: Bearer <JWT>`.

Los antecedentes son **recursos anidados** bajo un paciente. Siempre se accede en contexto de un `patientId`.

---

## Tipos de antecedentes

| Tipo                 | Ruta                    | Descripción                                          |
|----------------------|-------------------------|------------------------------------------------------|
| Resumen completo     | `/`                     | Los 4 tipos en un solo response                      |
| Heredofamiliares     | `/heredofamiliares`     | Enfermedades en familia directa                      |
| Personales patológicos | `/patologicos`        | Enfermedades, cirugías, alergias, hospitalizaciones  |
| Personales no patológicos | `/no-patologicos`  | Hábitos de vida, alimentación, exposición laboral    |
| Gineco-obstétricos   | `/gineco-obstetricos`   | **Solo pacientes femeninas.** Menstruación, embarazos, cirugías |

---

## Comportamiento general

- **No existe `POST`** — los registros se crean automáticamente vía trigger de DB al crear un paciente.
- Si el trigger no los creó (datos legacy), los endpoints `GET` hacen `findOrCreate` automáticamente.
- Solo operaciones `GET` (lectura) y `PATCH` (actualización parcial).
- Todos los campos en los `PATCH` son opcionales — enviar solo los que cambian.
- `registradoPor` se setea automáticamente desde el JWT del usuario autenticado.

---

## Permisos por operación

| Operación | Roles permitidos                                        |
|-----------|---------------------------------------------------------|
| `GET`     | `admin`, `medico`, `fisioterapeuta`, `pasante`          |
| `PATCH`   | `admin`, `medico`, `fisioterapeuta`                     |

---

## Endpoints

---

### `GET /api/v1/patients/:patientId/antecedentes`

Devuelve los 4 tipos en un solo objeto. Para pacientes masculinos, `ginecoObstetricos` es `null` (no lanza error).

**Auditoría:** `READ_ANTECEDENTES_ALL`

**Path params:**

| Param       | Tipo   | Descripción       |
|-------------|--------|-------------------|
| `patientId` | `uuid` | UUID del paciente |

**Response `200`:**

```json
{
  "heredofamiliares": { ... },
  "patologicos": { ... },
  "noPatologicos": { ... },
  "ginecoObstetricos": null
}
```

| Status | Descripción               |
|--------|---------------------------|
| `200`  | Antecedentes completos    |
| `401`  | Token inválido            |
| `403`  | Rol insuficiente          |
| `404`  | Paciente no encontrado    |

---

## Antecedentes Heredofamiliares

### Entidad

| Campo                           | Tipo       | Default | Descripción                              |
|---------------------------------|------------|---------|------------------------------------------|
| `id`                            | `uuid`     |         |                                          |
| `patientId`                     | `uuid`     |         |                                          |
| `diabetes`                      | `boolean`  | `false` |                                          |
| `diabetesFamiliar`              | `string`   | `null`  | Ej: `"madre, abuela"`                    |
| `diabetesNotas`                 | `string`   | `null`  |                                          |
| `hipertension`                  | `boolean`  | `false` |                                          |
| `hipertensionFamiliar`          | `string`   | `null`  |                                          |
| `hipertensionNotas`             | `string`   | `null`  |                                          |
| `cardiopatias`                  | `boolean`  | `false` |                                          |
| `cardiopatiasFamiliar`          | `string`   | `null`  |                                          |
| `cardiopatiasNotas`             | `string`   | `null`  |                                          |
| `cancer`                        | `boolean`  | `false` |                                          |
| `cancerTipo`                    | `string`   | `null`  | Ej: `"colorrectal"`                      |
| `cancerFamiliar`                | `string`   | `null`  |                                          |
| `cancerNotas`                   | `string`   | `null`  |                                          |
| `enfermedadesRespiratorias`     | `boolean`  | `false` |                                          |
| `enfermedadesRespiratoriasTipo` | `string`   | `null`  |                                          |
| `enfermedadesRespiratoriasFamiliar` | `string` | `null` |                                          |
| `enfermedadesRespiratoriastNotas` | `string` | `null`  |                                          |
| `enfermedadesRenales`           | `boolean`  | `false` |                                          |
| `enfermedadesRenalesFamiliar`   | `string`   | `null`  |                                          |
| `enfermedadesRenalesNotas`      | `string`   | `null`  |                                          |
| `enfermedadesNeurologicas`      | `boolean`  | `false` |                                          |
| `enfermedadesNeurologicasTipo`  | `string`   | `null`  |                                          |
| `enfermedadesNeurologicasFamiliar` | `string` | `null` |                                          |
| `enfermedadesNeurologicasNotas` | `string`   | `null`  |                                          |
| `enfermedadesMentales`          | `boolean`  | `false` |                                          |
| `enfermedadesMentalesTipo`      | `string`   | `null`  |                                          |
| `enfermedadesMentalesFamiliar`  | `string`   | `null`  |                                          |
| `enfermedadesMentalesNotas`     | `string`   | `null`  |                                          |
| `otros`                         | `array`    | `null`  | Ver estructura abajo                     |
| `registradoPorId`               | `uuid`     | `null`  | Usuario que registró/actualizó           |
| `fechaRegistro`                 | `ISO 8601` |         |                                          |
| `ultimaActualizacion`           | `ISO 8601` |         |                                          |

**Estructura de `otros`:**

```json
[
  {
    "enfermedad": "Artritis reumatoide",
    "familiar": "tío paterno",
    "notas": "diagnóstico a los 40 años"
  }
]
```

### `GET /api/v1/patients/:patientId/antecedentes/heredofamiliares`

**Auditoría:** `READ_ANTECEDENTES_HF`

### `PATCH /api/v1/patients/:patientId/antecedentes/heredofamiliares`

**Auditoría:** `UPDATE_ANTECEDENTES_HF`

**Request body (todos opcionales):**

```json
{
  "diabetes": true,
  "diabetesFamiliar": "madre, abuela materna",
  "diabetesNotas": "Diabetes tipo 2 en ambas",
  "hipertension": false,
  "cancer": true,
  "cancerTipo": "mama",
  "cancerFamiliar": "madre",
  "otros": [
    { "enfermedad": "Artritis", "familiar": "abuela paterna" }
  ]
}
```

---

## Antecedentes Personales Patológicos

### Campos principales

| Campo                                | Tipo      | Default | Descripción                                    |
|--------------------------------------|-----------|---------|------------------------------------------------|
| `diabetesMellitus`                   | `boolean` | `false` |                                                |
| `diabetesTipo`                       | `enum`    | `null`  | `TIPO_1 \| TIPO_2 \| GESTACIONAL \| OTRO`     |
| `diabetesAnioDiagnostico`            | `number`  | `null`  | Año entero ≥ 1900                              |
| `diabetesTratamiento`                | `string`  | `null`  |                                                |
| `diabetesControlada`                 | `boolean` | `null`  |                                                |
| `hipertensionArterial`               | `boolean` | `false` |                                                |
| `hipertensionAnioDiagnostico`        | `number`  | `null`  |                                                |
| `hipertensionTratamiento`            | `string`  | `null`  |                                                |
| `hipertensionControlada`             | `boolean` | `null`  |                                                |
| `cardiopatias`                       | `boolean` | `false` |                                                |
| `cancer`                             | `boolean` | `false` |                                                |
| `cancerTipo`                         | `string`  | `null`  |                                                |
| `cancerRemision`                     | `boolean` | `null`  |                                                |
| `tuberculosis`                       | `boolean` | `false` |                                                |
| `hepatitis`                          | `boolean` | `false` |                                                |
| `hepatitisTipo`                      | `enum`    | `null`  | `A \| B \| C \| D \| E`                       |
| `vihSida`                            | `boolean` | `false` |                                                |
| `covid19`                            | `boolean` | `false` |                                                |
| `covid19Fecha`                       | `string`  | `null`  | ISO date `YYYY-MM-DD`                          |
| `covid19Severidad`                   | `enum`    | `null`  | `LEVE \| MODERADO \| SEVERO \| CRITICO`        |
| `covid19Secuelas`                    | `string`  | `null`  |                                                |
| `epilepsia`                          | `boolean` | `false` |                                                |
| `accidenteCerebrovascular`           | `boolean` | `false` |                                                |
| `acvTipo`                            | `enum`    | `null`  | `ISQUEMICO \| HEMORRAGICO`                     |
| `depresion`                          | `boolean` | `false` |                                                |
| `ansiedad`                           | `boolean` | `false` |                                                |
| `transfusiones`                      | `boolean` | `false` |                                                |

### Campos JSONB

| Campo                  | Estructura de cada elemento                                             |
|------------------------|-------------------------------------------------------------------------|
| `cirugias`             | `{ tipo, fecha, hospital, complicaciones }`                             |
| `hospitalizaciones`    | `{ fecha, motivo, hospital, duracion_dias }`                            |
| `traumatismos`         | `{ zona, fecha, tipo, secuelas }`                                       |
| `alergiasMedicamentos` | `{ medicamento, reaccion, severidad }`                                  |
| `alergiasAlimentos`    | `{ alimento, reaccion, severidad }`                                     |
| `alergiasOtras`        | `{ tipo, reaccion }`                                                    |
| `transfusionesDetalle` | `{ fecha, motivo, reaccion }`                                           |
| `otrosPsiquiatricos`   | `{ diagnostico, tratamiento }`                                          |

### `GET /api/v1/patients/:patientId/antecedentes/patologicos`

**Auditoría:** `READ_ANTECEDENTES_PAT`

### `PATCH /api/v1/patients/:patientId/antecedentes/patologicos`

**Auditoría:** `UPDATE_ANTECEDENTES_PAT`

**Request body (ejemplo):**

```json
{
  "diabetesMellitus": true,
  "diabetesTipo": "TIPO_2",
  "diabetesAnioDiagnostico": 2018,
  "diabetesTratamiento": "Metformina 850mg",
  "diabetesControlada": true,
  "alergiasMedicamentos": [
    { "medicamento": "Penicilina", "reaccion": "urticaria", "severidad": "moderada" }
  ],
  "cirugias": [
    { "tipo": "Apendicectomía", "fecha": "2010-03-15", "hospital": "Hospital Vozandes", "complicaciones": null }
  ]
}
```

---

## Antecedentes Personales No Patológicos

### Campos principales

| Campo                       | Tipo      | Default | Descripción                                             |
|-----------------------------|-----------|---------|----------------------------------------------------------|
| `tabaquismo`                | `boolean` | `false` |                                                          |
| `tabaquismoTipo`            | `enum`    | `null`  | `FUMADOR_ACTIVO \| EX_FUMADOR \| NUNCA`                 |
| `tabaquismoCigarrillosDia`  | `number`  | `null`  |                                                          |
| `tabaquismoAniosFumando`    | `number`  | `null`  |                                                          |
| `alcoholismo`               | `boolean` | `false` |                                                          |
| `alcoholismoFrecuencia`     | `enum`    | `null`  | `DIARIO \| SEMANAL \| MENSUAL \| OCASIONAL \| NUNCA`    |
| `drogas`                    | `boolean` | `false` |                                                          |
| `cafe`                      | `boolean` | `false` |                                                          |
| `cafeTazasDia`              | `number`  | `null`  |                                                          |
| `actividadFisica`           | `boolean` | `false` |                                                          |
| `actividadFisicaTipo`       | `string`  | `null`  | Ej: `"natación, ciclismo"`                              |
| `actividadFisicaFrecuencia` | `enum`    | `null`  | `DIARIA \| SEMANAL \| MENSUAL \| RARA_VEZ \| NUNCA`     |
| `actividadFisicaDuracionMinutos` | `number` | `null` |                                                     |
| `actividadFisicaIntensidad` | `enum`    | `null`  | `LEVE \| MODERADA \| VIGOROSA`                          |
| `alimentacionTipo`          | `enum`    | `null`  | `OMNIVORA \| VEGETARIANA \| VEGANA \| OTRA`             |
| `alimentacionComidasDia`    | `number`  | `3`     |                                                          |
| `alimentacionHidratacionLitros` | `number` | `null` |                                                      |
| `horasSuenoPromedio`        | `number`  | `null`  | Ej: `7.5`                                               |
| `calidadSueno`              | `enum`    | `null`  | `EXCELENTE \| BUENA \| REGULAR \| MALA`                 |
| `trastornosSueno`           | `boolean` | `false` |                                                          |
| `tipoVivienda`              | `enum`    | `null`  | `PROPIA \| ALQUILADA \| FAMILIAR \| OTRA`               |
| `serviciosBasicos`          | `object`  | `null`  | `{ agua, luz, alcantarillado, internet }` (booleans)    |
| `hacinamiento`              | `boolean` | `false` |                                                          |
| `animalesDomesticos`        | `boolean` | `false` |                                                          |
| `exposicionQuimicos`        | `boolean` | `false` |                                                          |
| `exposicionRadiacion`       | `boolean` | `false` |                                                          |
| `exposicionRuido`           | `boolean` | `false` |                                                          |
| `trabajoForzado`            | `boolean` | `false` |                                                          |
| `trabajoTurnosRotativos`    | `boolean` | `false` |                                                          |
| `esquemaVacunacionCompleto` | `boolean` | `null`  |                                                          |

### Campos JSONB

| Campo           | Estructura de cada elemento                    |
|-----------------|------------------------------------------------|
| `viajesRecientes` | `{ pais, fecha, motivo }`                    |
| `vacunas`       | `{ nombre, dosis_total, ultima_dosis_fecha }` |

### `GET /api/v1/patients/:patientId/antecedentes/no-patologicos`

**Auditoría:** `READ_ANTECEDENTES_NP`

### `PATCH /api/v1/patients/:patientId/antecedentes/no-patologicos`

**Auditoría:** `UPDATE_ANTECEDENTES_NP`

**Request body (ejemplo):**

```json
{
  "tabaquismo": true,
  "tabaquismoTipo": "EX_FUMADOR",
  "tabaquismoAniosSinFumar": 5,
  "actividadFisica": true,
  "actividadFisicaTipo": "natación",
  "actividadFisicaFrecuencia": "SEMANAL",
  "actividadFisicaDuracionMinutos": 45,
  "actividadFisicaIntensidad": "MODERADA",
  "serviciosBasicos": { "agua": true, "luz": true, "alcantarillado": true, "internet": true },
  "vacunas": [
    { "nombre": "COVID-19 Pfizer", "dosis_total": 3, "ultima_dosis_fecha": "2022-08-10" }
  ]
}
```

---

## Antecedentes Gineco-Obstétricos

> **Solo disponible para pacientes con `genero = "femenino"`.**
> Intentar acceder con un paciente masculino retorna `403 Forbidden`.
> En `GET /antecedentes` (resumen), `ginecoObstetricos` aparece como `null` sin lanzar error.

### Campos principales

#### Menstruación

| Campo                       | Tipo      | Default | Descripción                                    |
|-----------------------------|-----------|---------|------------------------------------------------|
| `menarcaEdad`               | `number`  | `null`  | Edad en años                                   |
| `fechaUltimaMenstruacion`   | `string`  | `null`  | ISO date `YYYY-MM-DD`                          |
| `cicloMenstrualRegular`     | `boolean` | `null`  |                                                |
| `cicloMenstrualDuracionDias`| `number`  | `28`    |                                                |
| `menstruacionDuracionDias`  | `number`  | `5`     |                                                |
| `menstruacionCantidad`      | `enum`    | `null`  | `ESCASA \| MODERADA \| ABUNDANTE`              |
| `dismenorrea`               | `boolean` | `false` |                                                |
| `dismenorreaIntensidad`     | `enum`    | `null`  | `LEVE \| MODERADA \| SEVERA`                   |

#### Citología y Mamografía

| Campo                    | Tipo      | Default | Descripción                            |
|--------------------------|-----------|---------|----------------------------------------|
| `citologiaUltimaFecha`   | `string`  | `null`  | ISO date                               |
| `citologiaResultado`     | `enum`    | `null`  | `NORMAL \| ANORMAL \| PENDIENTE`       |
| `mamografiaUltimaFecha`  | `string`  | `null`  | ISO date                               |
| `mamografiaResultado`    | `enum`    | `null`  | `NORMAL \| ANORMAL \| PENDIENTE`       |

#### Fórmula obstétrica (GPAVM)

| Campo         | Tipo     | Default | Descripción                  |
|---------------|----------|---------|------------------------------|
| `gestas`      | `number` | `0`     | Total de embarazos           |
| `partos`      | `number` | `0`     | Partos vaginales             |
| `cesareas`    | `number` | `0`     |                              |
| `abortos`     | `number` | `0`     |                              |
| `hijosVivos`  | `number` | `0`     |                              |
| `hijosMuertos`| `number` | `0`     |                              |

#### Embarazo actual

| Campo                             | Tipo      | Default | Descripción          |
|-----------------------------------|-----------|---------|----------------------|
| `embarazoActual`                  | `boolean` | `false` |                      |
| `embarazoActualSemanas`           | `number`  | `null`  |                      |
| `embarazoActualFechaProbableParto`| `string`  | `null`  | ISO date             |
| `embarazoActualControlPrenatal`   | `boolean` | `null`  |                      |

#### Complicaciones obstétricas

| Campo                     | Tipo      | Default |
|---------------------------|-----------|---------|
| `preeclampsia`            | `boolean` | `false` |
| `eclampsia`               | `boolean` | `false` |
| `diabetesGestacional`     | `boolean` | `false` |
| `hemorragiaPostparto`     | `boolean` | `false` |
| `placentaPrevia`          | `boolean` | `false` |
| `lactanciaActual`         | `boolean` | `false` |

### Campos JSONB

| Campo                        | Estructura de cada elemento                              |
|------------------------------|----------------------------------------------------------|
| `embarazos`                  | `{ numero, fecha_parto, tipo_parto, peso_rn, complicaciones }` |
| `abortosTipo`                | `{ tipo, fecha, tratamiento }`                           |
| `metodosAnticonceptivosPrevios` | `{ metodo, tiempo_uso_meses }`                        |
| `itsHistorial`               | `{ enfermedad, fecha, tratamiento }`                     |
| `cirugiasGinecologicas`      | `{ tipo, fecha, hospital, complicaciones }`              |

### `GET /api/v1/patients/:patientId/antecedentes/gineco-obstetricos`

**Auditoría:** `READ_ANTECEDENTES_GO`

| Status | Descripción                              |
|--------|------------------------------------------|
| `200`  | Antecedentes gineco-obstétricos          |
| `403`  | Paciente no es de género femenino        |
| `404`  | Paciente no encontrado                   |

### `PATCH /api/v1/patients/:patientId/antecedentes/gineco-obstetricos`

**Auditoría:** `UPDATE_ANTECEDENTES_GO`

**Request body (ejemplo):**

```json
{
  "menarcaEdad": 13,
  "fechaUltimaMenstruacion": "2024-01-10",
  "cicloMenstrualRegular": true,
  "dismenorrea": true,
  "dismenorreaIntensidad": "LEVE",
  "gestas": 2,
  "partos": 1,
  "cesareas": 1,
  "hijosVivos": 2,
  "embarazoActual": false,
  "citologiaUltimaFecha": "2023-06-15",
  "citologiaResultado": "NORMAL",
  "embarazos": [
    { "numero": 1, "fecha_parto": "2018-05-20", "tipo_parto": "vaginal", "peso_rn": 3200 },
    { "numero": 2, "fecha_parto": "2021-11-03", "tipo_parto": "cesarea", "peso_rn": 3500 }
  ]
}
```

---

## Tabla de permisos

| Endpoint                              | admin | medico | fisioterapeuta | pasante |
|---------------------------------------|:-----:|:------:|:--------------:|:-------:|
| `GET /antecedentes`                   | ✓     | ✓      | ✓              | ✓       |
| `GET /antecedentes/heredofamiliares`  | ✓     | ✓      | ✓              | ✓       |
| `PATCH /antecedentes/heredofamiliares`| ✓     | ✓      | ✓              |         |
| `GET /antecedentes/patologicos`       | ✓     | ✓      | ✓              | ✓       |
| `PATCH /antecedentes/patologicos`     | ✓     | ✓      | ✓              |         |
| `GET /antecedentes/no-patologicos`    | ✓     | ✓      | ✓              | ✓       |
| `PATCH /antecedentes/no-patologicos`  | ✓     | ✓      | ✓              |         |
| `GET /antecedentes/gineco-obstetricos`| ✓     | ✓      | ✓              | ✓       |
| `PATCH /antecedentes/gineco-obstetricos`| ✓   | ✓      | ✓              |         |

---

## Eventos de auditoría

| Evento                    | Endpoint                           |
|---------------------------|------------------------------------|
| `READ_ANTECEDENTES_ALL`   | `GET /antecedentes`                |
| `READ_ANTECEDENTES_HF`    | `GET /antecedentes/heredofamiliares` |
| `UPDATE_ANTECEDENTES_HF`  | `PATCH /antecedentes/heredofamiliares` |
| `READ_ANTECEDENTES_PAT`   | `GET /antecedentes/patologicos`    |
| `UPDATE_ANTECEDENTES_PAT` | `PATCH /antecedentes/patologicos`  |
| `READ_ANTECEDENTES_NP`    | `GET /antecedentes/no-patologicos` |
| `UPDATE_ANTECEDENTES_NP`  | `PATCH /antecedentes/no-patologicos` |
| `READ_ANTECEDENTES_GO`    | `GET /antecedentes/gineco-obstetricos` |
| `UPDATE_ANTECEDENTES_GO`  | `PATCH /antecedentes/gineco-obstetricos` |

---

## Notas

- Cache Redis por tipo, TTL 10 min. `PATCH` invalida el tipo modificado y el resumen `GET /antecedentes`.
- Para el **resumen** (`GET /antecedentes`), los 4 tipos se consultan en paralelo. Si un tipo falla (ej. gineco en masculino), ese campo queda `null` sin romper la respuesta.
- Todos los campos de tipo `string` con valor `null` en DB se devuelven como `null` en JSON, no como string vacío.

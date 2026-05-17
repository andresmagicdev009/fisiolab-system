-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar timezone
SET timezone = 'America/Guayaquil';


CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    external_auth_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk user ID
    role VARCHAR(50) NOT NULL CHECK (role IN ('PACIENTE', 'FISIOTERAPEUTA', 'MEDICO', 'PASANTE', 'ADMIN')),
    cedula VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_cedula ON users(cedula);

-- Comentario
COMMENT ON TABLE users IS 'Usuarios del sistema sincronizados desde Clerk';
COMMENT ON COLUMN users.external_auth_id IS 'ID de usuario de Clerk (proveedor de autenticación)';



CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cedula VARCHAR(10) UNIQUE NOT NULL,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    fecha_nacimiento DATE NOT NULL,
    genero VARCHAR(20) NOT NULL CHECK (genero IN ('MASCULINO', 'FEMENINO', 'OTRO')),
    telefono VARCHAR(20),
    telefono_emergencia VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    codigo_postal VARCHAR(10),
    ocupacion VARCHAR(255),
    estado_civil VARCHAR(50) CHECK (estado_civil IN ('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION_LIBRE')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_patients_cedula ON patients(cedula);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_nombres ON patients(nombres);
CREATE INDEX idx_patients_apellidos ON patients(apellidos);
CREATE INDEX idx_patients_user_id ON patients(user_id);

-- Comentario
COMMENT ON TABLE patients IS 'Datos demográficos de pacientes según MSP Ecuador';
COMMENT ON COLUMN patients.email IS 'Email personal del paciente para notificaciones';


CREATE TABLE antecedentes_heredofamiliares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Diabetes
    diabetes BOOLEAN DEFAULT FALSE,
    diabetes_familiar VARCHAR(100),
    diabetes_notas TEXT,
    
    -- Hipertensión
    hipertension BOOLEAN DEFAULT FALSE,
    hipertension_familiar VARCHAR(100),
    hipertension_notas TEXT,
    
    -- Cardiopatías
    cardiopatias BOOLEAN DEFAULT FALSE,
    cardiopatias_familiar VARCHAR(100),
    cardiopatias_notas TEXT,
    
    -- Cáncer
    cancer BOOLEAN DEFAULT FALSE,
    cancer_tipo VARCHAR(255),
    cancer_familiar VARCHAR(100),
    cancer_notas TEXT,
    
    -- Enfermedades Respiratorias
    enfermedades_respiratorias BOOLEAN DEFAULT FALSE,
    enfermedades_respiratorias_tipo VARCHAR(255),
    enfermedades_respiratorias_familiar VARCHAR(100),
    enfermedades_respiratorias_notas TEXT,
    
    -- Enfermedades Renales
    enfermedades_renales BOOLEAN DEFAULT FALSE,
    enfermedades_renales_familiar VARCHAR(100),
    enfermedades_renales_notas TEXT,
    
    -- Enfermedades Neurológicas
    enfermedades_neurologicas BOOLEAN DEFAULT FALSE,
    enfermedades_neurologicas_tipo VARCHAR(255),
    enfermedades_neurologicas_familiar VARCHAR(100),
    enfermedades_neurologicas_notas TEXT,
    
    -- Enfermedades Mentales
    enfermedades_mentales BOOLEAN DEFAULT FALSE,
    enfermedades_mentales_tipo VARCHAR(255),
    enfermedades_mentales_familiar VARCHAR(100),
    enfermedades_mentales_notas TEXT,
    
    -- Otros (JSONB para flexibilidad)
    otros JSONB,
    
    -- Metadata
    registrado_por UUID REFERENCES users(id),
    fecha_registro TIMESTAMP DEFAULT NOW(),
    ultima_actualizacion TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_patient_heredofamiliares FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Índice
CREATE INDEX idx_heredofamiliares_patient ON antecedentes_heredofamiliares(patient_id);

-- Comentario
COMMENT ON TABLE antecedentes_heredofamiliares IS 'Antecedentes de enfermedades familiares según MSP Ecuador Form 028';
COMMENT ON COLUMN antecedentes_heredofamiliares.otros IS 'Array JSON para otras enfermedades heredofamiliares: [{enfermedad, familiar, notas}]';


CREATE TABLE antecedentes_personales_patologicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Diabetes Mellitus
    diabetes_mellitus BOOLEAN DEFAULT FALSE,
    diabetes_tipo VARCHAR(20) CHECK (diabetes_tipo IN ('TIPO_1', 'TIPO_2', 'GESTACIONAL', 'OTRO')),
    diabetes_anio_diagnostico INTEGER,
    diabetes_tratamiento TEXT,
    diabetes_controlada BOOLEAN,
    
    -- Hipertensión Arterial
    hipertension_arterial BOOLEAN DEFAULT FALSE,
    hipertension_anio_diagnostico INTEGER,
    hipertension_tratamiento TEXT,
    hipertension_controlada BOOLEAN,
    
    -- Cardiopatías
    cardiopatias BOOLEAN DEFAULT FALSE,
    cardiopatias_tipo VARCHAR(255),
    cardiopatias_anio_diagnostico INTEGER,
    cardiopatias_tratamiento TEXT,
    
    -- Enfermedades Respiratorias
    enfermedades_respiratorias BOOLEAN DEFAULT FALSE,
    enfermedades_respiratorias_tipo VARCHAR(255),
    enfermedades_respiratorias_anio_diagnostico INTEGER,
    enfermedades_respiratorias_tratamiento TEXT,
    
    -- Enfermedades Renales
    enfermedades_renales BOOLEAN DEFAULT FALSE,
    enfermedades_renales_tipo VARCHAR(255),
    enfermedades_renales_anio_diagnostico INTEGER,
    enfermedades_renales_tratamiento TEXT,
    
    -- Cáncer
    cancer BOOLEAN DEFAULT FALSE,
    cancer_tipo VARCHAR(255),
    cancer_anio_diagnostico INTEGER,
    cancer_tratamiento TEXT,
    cancer_remision BOOLEAN,
    
    -- Tuberculosis
    tuberculosis BOOLEAN DEFAULT FALSE,
    tuberculosis_anio INTEGER,
    tuberculosis_tratamiento_completo BOOLEAN,
    
    -- Hepatitis
    hepatitis BOOLEAN DEFAULT FALSE,
    hepatitis_tipo VARCHAR(10) CHECK (hepatitis_tipo IN ('A', 'B', 'C', 'D', 'E')),
    hepatitis_anio INTEGER,
    
    -- VIH/SIDA
    vih_sida BOOLEAN DEFAULT FALSE,
    vih_anio_diagnostico INTEGER,
    vih_tratamiento_antirretroviral BOOLEAN,
    
    -- COVID-19
    covid19 BOOLEAN DEFAULT FALSE,
    covid19_fecha DATE,
    covid19_severidad VARCHAR(50) CHECK (covid19_severidad IN ('LEVE', 'MODERADO', 'SEVERO', 'CRITICO')),
    covid19_secuelas TEXT,
    
    -- Epilepsia
    epilepsia BOOLEAN DEFAULT FALSE,
    epilepsia_controlada BOOLEAN,
    epilepsia_tratamiento TEXT,
    
    -- Accidente Cerebrovascular
    accidente_cerebrovascular BOOLEAN DEFAULT FALSE,
    accidente_cerebrovascular_fecha DATE,
    accidente_cerebrovascular_tipo VARCHAR(50) CHECK (accidente_cerebrovascular_tipo IN ('ISQUEMICO', 'HEMORRAGICO')),
    accidente_cerebrovascular_secuelas TEXT,
    
    -- Depresión
    depresion BOOLEAN DEFAULT FALSE,
    depresion_tratamiento TEXT,
    
    -- Ansiedad
    ansiedad BOOLEAN DEFAULT FALSE,
    ansiedad_tratamiento TEXT,
    
    -- Otros Psiquiátricos (JSONB)
    otros_psiquiatricos JSONB,
    
    -- Cirugías Previas (JSONB)
    cirugias JSONB,
    
    -- Hospitalizaciones (JSONB)
    hospitalizaciones JSONB,
    
    -- Traumatismos (JSONB)
    traumatismos JSONB,
    
    -- Alergias
    alergias_medicamentos JSONB,
    alergias_alimentos JSONB,
    alergias_otras JSONB,
    
    -- Transfusiones
    transfusiones BOOLEAN DEFAULT FALSE,
    transfusiones_detalle JSONB,
    
    -- Otros
    otros JSONB,
    
    -- Metadata
    registrado_por UUID REFERENCES users(id),
    fecha_registro TIMESTAMP DEFAULT NOW(),
    ultima_actualizacion TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_patient_patologicos FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Índice
CREATE INDEX idx_patologicos_patient ON antecedentes_personales_patologicos(patient_id);

-- Comentario
COMMENT ON TABLE antecedentes_personales_patologicos IS 'Historial de enfermedades, cirugías, alergias y hospitalizaciones';
COMMENT ON COLUMN antecedentes_personales_patologicos.cirugias IS 'Array JSON: [{tipo, fecha, hospital, complicaciones}]';
COMMENT ON COLUMN antecedentes_personales_patologicos.alergias_medicamentos IS 'Array JSON: [{medicamento, reaccion, severidad}]';

CREATE TABLE antecedentes_personales_no_patologicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Tabaquismo
    tabaquismo BOOLEAN DEFAULT FALSE,
    tabaquismo_tipo VARCHAR(50) CHECK (tabaquismo_tipo IN ('FUMADOR_ACTIVO', 'EX_FUMADOR', 'NUNCA')),
    tabaquismo_cigarrillos_dia INTEGER,
    tabaquismo_anios_fumando INTEGER,
    tabaquismo_anios_sin_fumar INTEGER,
    
    -- Alcoholismo
    alcoholismo BOOLEAN DEFAULT FALSE,
    alcoholismo_frecuencia VARCHAR(50) CHECK (alcoholismo_frecuencia IN ('DIARIO', 'SEMANAL', 'MENSUAL', 'OCASIONAL', 'NUNCA')),
    alcoholismo_cantidad VARCHAR(100),
    alcoholismo_tipo VARCHAR(100),
    
    -- Drogas
    drogas BOOLEAN DEFAULT FALSE,
    drogas_tipo VARCHAR(255),
    drogas_frecuencia VARCHAR(50),
    drogas_anios_consumo INTEGER,
    
    -- Café
    cafe BOOLEAN DEFAULT FALSE,
    cafe_tazas_dia INTEGER,
    
    -- Actividad Física
    actividad_fisica BOOLEAN DEFAULT FALSE,
    actividad_fisica_tipo VARCHAR(255),
    actividad_fisica_frecuencia VARCHAR(50) CHECK (actividad_fisica_frecuencia IN ('DIARIA', 'SEMANAL', 'MENSUAL', 'RARA_VEZ', 'NUNCA')),
    actividad_fisica_duracion_minutos INTEGER,
    actividad_fisica_intensidad VARCHAR(50) CHECK (actividad_fisica_intensidad IN ('LEVE', 'MODERADA', 'VIGOROSA')),
    
    -- Alimentación
    alimentacion_tipo VARCHAR(50) CHECK (alimentacion_tipo IN ('OMNIVORA', 'VEGETARIANA', 'VEGANA', 'OTRA')),
    alimentacion_comidas_dia INTEGER DEFAULT 3,
    alimentacion_hidratacion_litros DECIMAL(3,1),
    alimentacion_notas TEXT,
    
    -- Sueño
    horas_sueno_promedio DECIMAL(3,1),
    calidad_sueno VARCHAR(50) CHECK (calidad_sueno IN ('EXCELENTE', 'BUENA', 'REGULAR', 'MALA')),
    trastornos_sueno BOOLEAN DEFAULT FALSE,
    trastornos_sueno_tipo VARCHAR(255),
    
    -- Vivienda
    tipo_vivienda VARCHAR(50) CHECK (tipo_vivienda IN ('PROPIA', 'ALQUILADA', 'FAMILIAR', 'OTRA')),
    servicios_basicos JSONB DEFAULT '{"agua": true, "luz": true, "alcantarillado": true, "internet": false}',
    hacinamiento BOOLEAN DEFAULT FALSE,
    numero_personas_hogar INTEGER,
    
    -- Animales Domésticos
    animales_domesticos BOOLEAN DEFAULT FALSE,
    animales_tipo VARCHAR(255),
    
    -- Exposición Ocupacional
    exposicion_quimicos BOOLEAN DEFAULT FALSE,
    exposicion_quimicos_tipo TEXT,
    exposicion_radiacion BOOLEAN DEFAULT FALSE,
    exposicion_radiacion_tipo TEXT,
    exposicion_ruido BOOLEAN DEFAULT FALSE,
    trabajo_forzado BOOLEAN DEFAULT FALSE,
    trabajo_turnos_rotativos BOOLEAN DEFAULT FALSE,
    
    -- Viajes Recientes (JSONB)
    viajes_recientes JSONB,
    
    -- Vacunación
    esquema_vacunacion_completo BOOLEAN,
    vacunas JSONB,
    
    -- Otros Hábitos
    otros_habitos TEXT,
    
    -- Metadata
    registrado_por UUID REFERENCES users(id),
    fecha_registro TIMESTAMP DEFAULT NOW(),
    ultima_actualizacion TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_patient_no_patologicos FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Índice
CREATE INDEX idx_no_patologicos_patient ON antecedentes_personales_no_patologicos(patient_id);

-- Comentario
COMMENT ON TABLE antecedentes_personales_no_patologicos IS 'Hábitos de vida, alimentación, actividad física y condiciones socioeconómicas';
COMMENT ON COLUMN antecedentes_personales_no_patologicos.vacunas IS 'Array JSON: [{nombre, dosis_total, ultima_dosis_fecha}]';


CREATE TABLE antecedentes_gineco_obstetricos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Menstruación
    menarca_edad INTEGER,
    fecha_ultima_menstruacion DATE,
    ciclo_menstrual_regular BOOLEAN,
    ciclo_menstrual_duracion_dias INTEGER DEFAULT 28,
    ciclo_menstrual_notas TEXT,
    menstruacion_duracion_dias INTEGER DEFAULT 5,
    menstruacion_cantidad VARCHAR(50) CHECK (menstruacion_cantidad IN ('ESCASA', 'MODERADA', 'ABUNDANTE')),
    dismenorrea BOOLEAN DEFAULT FALSE,
    dismenorrea_intensidad VARCHAR(50) CHECK (dismenorrea_intensidad IN ('LEVE', 'MODERADA', 'SEVERA')),
    
    -- Menopausia
    menopausia BOOLEAN DEFAULT FALSE,
    menopausia_edad INTEGER,
    menopausia_sintomas TEXT,
    menopausia_terapia_reemplazo BOOLEAN DEFAULT FALSE,
    
    -- Vida Sexual
    inicio_vida_sexual_edad INTEGER,
    parejas_sexuales_numero INTEGER,
    metodo_anticonceptivo_actual VARCHAR(100),
    metodo_anticonceptivo_tiempo_uso_meses INTEGER,
    metodos_anticonceptivos_previos JSONB,
    
    -- Citología y Mamografía
    citologia_ultima_fecha DATE,
    citologia_resultado VARCHAR(50) CHECK (citologia_resultado IN ('NORMAL', 'ANORMAL', 'PENDIENTE')),
    citologia_notas TEXT,
    mamografia_ultima_fecha DATE,
    mamografia_resultado VARCHAR(50) CHECK (mamografia_resultado IN ('NORMAL', 'ANORMAL', 'PENDIENTE')),
    mamografia_notas TEXT,
    
    -- Infecciones Vaginales
    infecciones_vaginales BOOLEAN DEFAULT FALSE,
    infecciones_vaginales_tipo VARCHAR(255),
    infecciones_vaginales_frecuencia VARCHAR(50),
    
    -- Enfermedades Ginecológicas
    enfermedad_pelvica_inflamatoria BOOLEAN DEFAULT FALSE,
    enfermedad_pelvica_inflamatoria_fecha DATE,
    endometriosis BOOLEAN DEFAULT FALSE,
    endometriosis_tratamiento TEXT,
    miomatosis_uterina BOOLEAN DEFAULT FALSE,
    miomatosis_uterina_cantidad INTEGER,
    miomatosis_uterina_tratamiento TEXT,
    quistes_ovaricos BOOLEAN DEFAULT FALSE,
    quistes_ovaricos_tipo VARCHAR(100),
    quistes_ovaricos_tratamiento TEXT,
    sindrome_ovario_poliquistico BOOLEAN DEFAULT FALSE,
    
    -- ITS (JSONB)
    its_historial JSONB,
    
    -- Cirugías Ginecológicas (JSONB)
    cirugias_ginecologicas JSONB,
    
    -- OBSTÉTRICOS
    gestas INTEGER DEFAULT 0,
    partos INTEGER DEFAULT 0,
    cesareas INTEGER DEFAULT 0,
    abortos INTEGER DEFAULT 0,
    abortos_tipo JSONB,
    hijos_vivos INTEGER DEFAULT 0,
    hijos_muertos INTEGER DEFAULT 0,
    
    -- Embarazos (JSONB detallado)
    embarazos JSONB,
    
    -- Embarazo Actual
    embarazo_actual BOOLEAN DEFAULT FALSE,
    embarazo_actual_semanas INTEGER,
    embarazo_actual_fecha_probable_parto DATE,
    embarazo_actual_control_prenatal BOOLEAN,
    embarazo_actual_complicaciones TEXT,
    
    -- Complicaciones Obstétricas Previas
    preeclampsia BOOLEAN DEFAULT FALSE,
    eclampsia BOOLEAN DEFAULT FALSE,
    diabetes_gestacional BOOLEAN DEFAULT FALSE,
    hemorragia_postparto BOOLEAN DEFAULT FALSE,
    ruptura_prematura_membranas BOOLEAN DEFAULT FALSE,
    placenta_previa BOOLEAN DEFAULT FALSE,
    
    -- Lactancia
    lactancia_actual BOOLEAN DEFAULT FALSE,
    
    -- Otros
    otros TEXT,
    
    -- Metadata
    registrado_por UUID REFERENCES users(id),
    fecha_registro TIMESTAMP DEFAULT NOW(),
    ultima_actualizacion TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_patient_gineco_obstetricos FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Índice
CREATE INDEX idx_gineco_obstetricos_patient ON antecedentes_gineco_obstetricos(patient_id);

-- Constraint: Solo para pacientes femeninas
ALTER TABLE antecedentes_gineco_obstetricos
ADD CONSTRAINT chk_paciente_femenino CHECK (
    (SELECT genero FROM patients WHERE id = patient_id) = 'FEMENINO'
);

-- Comentario
COMMENT ON TABLE antecedentes_gineco_obstetricos IS 'Antecedentes ginecológicos y obstétricos para pacientes femeninas según MSP Ecuador';
COMMENT ON COLUMN antecedentes_gineco_obstetricos.embarazos IS 'Array JSON detallado: [{numero, fecha_parto, tipo_parto, peso_rn, ...}]';
COMMENT ON COLUMN antecedentes_gineco_obstetricos.gestas IS 'Fórmula obstétrica G - número total de embarazos';


CREATE TABLE tarjetero_indice (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    codigo_historia VARCHAR(50) UNIQUE NOT NULL,
    fecha_primera_consulta DATE,
    profesional_asignado_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tarjetero_patient ON tarjetero_indice(patient_id);
CREATE INDEX idx_tarjetero_codigo ON tarjetero_indice(codigo_historia);
CREATE INDEX idx_tarjetero_profesional ON tarjetero_indice(profesional_asignado_id);

-- Comentario
COMMENT ON TABLE tarjetero_indice IS 'Sistema de índice rápido de historias clínicas';
COMMENT ON COLUMN tarjetero_indice.codigo_historia IS 'Código único formato: HC-YYYY-NNNN';

CREATE TABLE clinical_episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id),
    fecha_inicio DATE NOT NULL,
    fecha_cierre DATE,
    motivo_consulta TEXT NOT NULL,
    diagnostico_principal VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'CERRADO')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_episodes_patient ON clinical_episodes(patient_id);
CREATE INDEX idx_episodes_professional ON clinical_episodes(professional_id);
CREATE INDEX idx_episodes_estado ON clinical_episodes(estado);

-- Comentario
COMMENT ON TABLE clinical_episodes IS 'Episodios clínicos que agrupan consultas relacionadas al mismo problema de salud';
COMMENT ON COLUMN clinical_episodes.diagnostico_principal IS 'Código CIE-10 del diagnóstico principal';


CREATE TABLE soap_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES clinical_episodes(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id),
    fecha_nota DATE NOT NULL,
    subjetivo TEXT,
    objetivo TEXT,
    analisis TEXT,
    plan TEXT,
    firma_digital TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_soap_episode ON soap_notes(episode_id);
CREATE INDEX idx_soap_professional ON soap_notes(professional_id);
CREATE INDEX idx_soap_fecha ON soap_notes(fecha_nota);

-- Comentario
COMMENT ON TABLE soap_notes IS 'Notas de evolución usando metodología SOAP';
COMMENT ON COLUMN soap_notes.firma_digital IS 'Hash SHA-256 de contenido + userId para inmutabilidad';

CREATE TABLE physical_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES clinical_episodes(id) ON DELETE CASCADE,
    fecha_evaluacion DATE NOT NULL,
    rango_movimiento JSONB,
    fuerza_muscular JSONB,
    escala_dolor INTEGER CHECK (escala_dolor BETWEEN 0 AND 10),
    pruebas_especificas JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_evaluations_episode ON physical_evaluations(episode_id);
CREATE INDEX idx_evaluations_fecha ON physical_evaluations(fecha_evaluacion);

-- Comentario
COMMENT ON TABLE physical_evaluations IS 'Evaluaciones físicas fisioterapéuticas detalladas';
COMMENT ON COLUMN physical_evaluations.rango_movimiento IS 'JSONB: {hombro_flexion: 120, hombro_extension: 50, ...}';


CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id),
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    tipo_cita VARCHAR(50) CHECK (tipo_cita IN ('PRIMERA_VEZ', 'SEGUIMIENTO', 'INTERCONSULTA')),
    estado VARCHAR(50) DEFAULT 'CONFIRMADA' CHECK (estado IN ('CONFIRMADA', 'CANCELADA', 'COMPLETADA')),
    motivo TEXT,
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_estado ON appointments(estado);

-- Comentario
COMMENT ON TABLE appointments IS 'Sistema de agendamiento de citas';


CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES clinical_episodes(id) ON DELETE CASCADE,
    objetivo_terapeutico TEXT NOT NULL,
    duracion_estimada_semanas INTEGER,
    frecuencia_semanal INTEGER,
    fecha_inicio DATE,
    fecha_fin DATE,
    progreso_porcentaje DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_treatment_plans_episode ON treatment_plans(episode_id);

-- Comentario
COMMENT ON TABLE treatment_plans IS 'Planes de tratamiento fisioterapéutico';

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    series INTEGER,
    repeticiones INTEGER,
    orden INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_exercises_plan ON exercises(plan_id);

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES clinical_episodes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES users(id),
    fecha_prescripcion DATE NOT NULL,
    firma_digital TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_prescriptions_episode ON prescriptions(episode_id);
CREATE INDEX idx_prescriptions_medico ON prescriptions(medico_id);


CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    principio_activo VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    concentracion VARCHAR(100),
    forma_farmaceutica VARCHAR(100),
    dosis VARCHAR(100),
    via_administracion VARCHAR(50),
    frecuencia VARCHAR(100),
    duracion_dias INTEGER,
    indicaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_medications_prescription ON medications(prescription_id);


CREATE TABLE session_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    monto DECIMAL(10,2) NOT NULL,
    estado_pago VARCHAR(50) DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'PARCIAL')),
    metodo_pago VARCHAR(50) CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'SEGURO')),
    fecha_pago TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payments_appointment ON session_payments(appointment_id);
CREATE INDEX idx_payments_estado ON session_payments(estado_pago);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES session_payments(id) ON DELETE SET NULL,
    numero_factura VARCHAR(50) UNIQUE,
    ruc_emisor VARCHAR(13),
    clave_acceso VARCHAR(49),
    autorizacion_sri VARCHAR(50),
    xml_factura TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_invoices_payment ON invoices(payment_id);
CREATE INDEX idx_invoices_numero ON invoices(numero_factura);


CREATE TABLE interconsults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES clinical_episodes(id) ON DELETE CASCADE,
    solicitante_id UUID NOT NULL REFERENCES users(id),
    destinatario_id UUID NOT NULL REFERENCES users(id),
    motivo TEXT NOT NULL,
    hallazgos_relevantes TEXT,
    pregunta_clinica TEXT,
    estado VARCHAR(50) DEFAULT 'SOLICITADA' CHECK (estado IN ('SOLICITADA', 'EN_PROCESO', 'RESPONDIDA')),
    respuesta TEXT,
    fecha_respuesta TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_interconsults_episode ON interconsults(episode_id);
CREATE INDEX idx_interconsults_solicitante ON interconsults(solicitante_id);
CREATE INDEX idx_interconsults_destinatario ON interconsults(destinatario_id);
CREATE INDEX idx_interconsults_estado ON interconsults(estado);


CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- Comentario
COMMENT ON TABLE audit_logs IS 'Registro inmutable de accesos a historias clínicas según Ley de Protección de Datos Ecuador';
COMMENT ON COLUMN audit_logs.action IS 'Acciones: READ_HC, UPDATE_HC, DELETE_HC, AI_QUERY, PRESCRIPTION_CREATE, etc.';


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at 
BEFORE UPDATE ON patients
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();


CREATE OR REPLACE FUNCTION create_initial_antecedentes()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear antecedentes heredofamiliares vacíos
    INSERT INTO antecedentes_heredofamiliares (patient_id)
    VALUES (NEW.id);
    
    -- Crear antecedentes personales patológicos vacíos
    INSERT INTO antecedentes_personales_patologicos (patient_id)
    VALUES (NEW.id);
    
    -- Crear antecedentes personales no patológicos vacíos
    INSERT INTO antecedentes_personales_no_patologicos (patient_id)
    VALUES (NEW.id);
    
    -- Crear antecedentes gineco-obstétricos solo si es mujer
    IF NEW.genero = 'FEMENINO' THEN
        INSERT INTO antecedentes_gineco_obstetricos (patient_id)
        VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_patient_antecedentes 
AFTER INSERT ON patients
FOR EACH ROW 
EXECUTE FUNCTION create_initial_antecedentes();


CREATE TRIGGER update_heredofamiliares_updated_at 
BEFORE UPDATE ON antecedentes_heredofamiliares
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patologicos_updated_at 
BEFORE UPDATE ON antecedentes_personales_patologicos
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_no_patologicos_updated_at 
BEFORE UPDATE ON antecedentes_personales_no_patologicos
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gineco_obstetricos_updated_at 
BEFORE UPDATE ON antecedentes_gineco_obstetricos
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();


CREATE OR REPLACE VIEW v_paciente_antecedentes_completos AS
SELECT 
    p.id AS patient_id,
    p.cedula,
    p.nombres,
    p.apellidos,
    p.email,
    p.genero,
    p.fecha_nacimiento,
    EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) AS edad,
    
    -- Heredofamiliares
    ahf.diabetes AS hf_diabetes,
    ahf.hipertension AS hf_hipertension,
    ahf.cancer AS hf_cancer,
    ahf.otros AS hf_otros,
    
    -- Patológicos
    app.diabetes_mellitus AS pat_diabetes,
    app.hipertension_arterial AS pat_hipertension,
    app.alergias_medicamentos AS pat_alergias_medicamentos,
    app.cirugias AS pat_cirugias,
    
    -- No Patológicos
    apnp.tabaquismo,
    apnp.alcoholismo,
    apnp.actividad_fisica,
    apnp.esquema_vacunacion_completo,
    
    -- Gineco-obstétricos (null si es hombre)
    ago.gestas,
    ago.partos,
    ago.cesareas,
    ago.embarazo_actual,
    ago.fecha_ultima_menstruacion
    
FROM patients p
LEFT JOIN antecedentes_heredofamiliares ahf ON p.id = ahf.patient_id
LEFT JOIN antecedentes_personales_patologicos app ON p.id = app.patient_id
LEFT JOIN antecedentes_personales_no_patologicos apnp ON p.id = apnp.patient_id
LEFT JOIN antecedentes_gineco_obstetricos ago ON p.id = ago.patient_id;


-- 1. Obtener pacientes con diabetes familiar
SELECT p.nombres, p.apellidos, ahf.diabetes_familiar, ahf.diabetes_notas
FROM patients p
INNER JOIN antecedentes_heredofamiliares ahf ON p.id = ahf.patient_id
WHERE ahf.diabetes = TRUE;

-- 2. Pacientes alérgicos a penicilina
SELECT p.nombres, p.apellidos, p.email
FROM patients p
INNER JOIN antecedentes_personales_patologicos app ON p.id = app.patient_id
WHERE app.alergias_medicamentos @> '[{"medicamento": "Penicilina"}]'::jsonb;

-- 3. Pacientes fumadores activos
SELECT p.nombres, p.apellidos, apnp.tabaquismo_cigarrillos_dia
FROM patients p
INNER JOIN antecedentes_personales_no_patologicos apnp ON p.id = apnp.patient_id
WHERE apnp.tabaquismo_tipo = 'FUMADOR_ACTIVO';

-- 4. Pacientes embarazadas actualmente
SELECT p.nombres, p.apellidos, ago.embarazo_actual_semanas, ago.embarazo_actual_fecha_probable_parto
FROM patients p
INNER JOIN antecedentes_gineco_obstetricos ago ON p.id = ago.patient_id
WHERE ago.embarazo_actual = TRUE;

-- 5. Citas confirmadas para hoy de un profesional
SELECT 
    a.id,
    a.scheduled_at,
    p.nombres || ' ' || p.apellidos AS paciente,
    a.motivo
FROM appointments a
INNER JOIN patients p ON a.patient_id = p.id
WHERE a.professional_id = 'UUID_DEL_PROFESIONAL'
  AND DATE(a.scheduled_at) = CURRENT_DATE
  AND a.estado = 'CONFIRMADA'
ORDER BY a.scheduled_at;

-- 6. Episodios activos de un paciente
SELECT 
    ce.id,
    ce.fecha_inicio,
    ce.motivo_consulta,
    ce.diagnostico_principal,
    u.email AS profesional
FROM clinical_episodes ce
INNER JOIN users u ON ce.professional_id = u.id
WHERE ce.patient_id = 'UUID_DEL_PACIENTE'
  AND ce.estado = 'ACTIVO';


  -- Insertar usuario admin
INSERT INTO users (id, email, external_auth_id, role, cedula)
VALUES 
    (uuid_generate_v4(), 'admin@fisiolab.ec', 'fisiolab123', 'ADMIN', '1234567890');

-- Insertar fisioterapeuta
INSERT INTO users (id, email, external_auth_id, role, cedula)
VALUES 
    (uuid_generate_v4(), 'fisio@fisiolab.ec', 'fisiolab123', 'FISIOTERAPEUTA', '0987654321');

-- Insertar médico
INSERT INTO users (id, email, external_auth_id, role, cedula)
VALUES 
    (uuid_generate_v4(), 'medico@fisiolab.ec', 'fisiolab123', 'MEDICO', '1122334455');

-- Insertar paciente de prueba
INSERT INTO patients (cedula, nombres, apellidos, email, fecha_nacimiento, genero)
VALUES 
    ('1020304050', 'Juan Carlos', 'Pérez García', 'juan.perez@email.com', '1985-03-15', 'MASCULINO');
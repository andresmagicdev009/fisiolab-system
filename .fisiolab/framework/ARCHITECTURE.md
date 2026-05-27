# Arquitectura Fisiolab

## Backend Layers

Controllers (validación + guards)
↓
Services (lógica negocio + orchestration)
↓
Repositories (TypeORM)
↓
PostgreSQL (Neon)

## Patrones Usados
- **Strategy + Factory**: Estados (appointments, sessions, payments, antecedentes)
- **State Machine**: Episodios, citas, sesiones, interconsultas
- **Cache-Aside**: Redis invalidation en writes
- **Builder**: Prescriptions
- **Abstract Provider**: Patient files (storage)

## Módulos Críticos (20 total)
auth → users → patients → tarjetero-indice → clinical-episodes → [treatment-plans, soap-notes, evaluations, sessions] → appointments → payments → invoices

## Relaciones Clave
- Patient 1:1 TarjeteroIndice (prerequisito episodios)
- Patient 1:N ClinicalEpisode (N activos simultáneos ✅)
- ClinicalEpisode 1:N TreatmentPlan → 1:N Session
- Appointment (completada) → auto-creates SessionPayment
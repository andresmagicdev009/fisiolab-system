export const CK = {
  PATIENTS_ALL: 'patients:all',
  PATIENT_ID: (id: string) => `patients:id:${id}`,
  PATIENT_CEDULA: (cedula: string) => `patients:cedula:${cedula}`,
  USERS_ALL: 'users:all',
  USER_ID: (id: string) => `users:id:${id}`,
  USER_EXT: (extId: string) => `users:ext:${extId}`,
  USER_EMAIL: (email: string) => `users:email:${email}`,
  // antecedentes — keyed by patientId
  ANT_HEREDOFAMILIAR: (pid: string) => `ant:heredofamiliar:${pid}`,
  ANT_PATOLOGICO: (pid: string) => `ant:patologico:${pid}`,
  ANT_NO_PATOLOGICO: (pid: string) => `ant:no-patologico:${pid}`,
  ANT_GINECO: (pid: string) => `ant:gineco:${pid}`,
  ANT_ALL: (pid: string) => `ant:all:${pid}`,
  // tarjetero-indice
  TARJETERO_PATIENT: (pid: string) => `tarjetero:patient:${pid}`,
  TARJETERO_CODIGO: (codigo: string) => `tarjetero:codigo:${codigo}`,
  TARJETERO_LIST: 'tarjetero:list',
  // clinical-episodes
  EPISODE_ID: (id: string) => `episode:id:${id}`,
  // soap-notes
  SOAP_ID: (id: string) => `soap:id:${id}`,
  // physical-evaluations
  EVAL_ID: (id: string) => `eval:id:${id}`,
  // sessions
  SESSION_ID: (id: string) => `session:id:${id}`,
  // treatment-plans
  PLAN_ID: (id: string) => `plan:id:${id}`,
  // exercises
  EXERCISE_ID: (id: string) => `exercise:id:${id}`,
  // appointments
  APPT_ID: (id: string) => `appt:id:${id}`,
  APPT_PATIENT: (pid: string) => `appt:patient:${pid}`,
  // interconsults
  IC_ID: (id: string) => `ic:id:${id}`,
  // prescriptions
  RX_ID: (id: string) => `rx:id:${id}`,
  // session-payments
  PAYMENT_ID: (id: string) => `payment:id:${id}`,
  // invoices
  INVOICE_ID: (id: string) => `invoice:id:${id}`,
} as const;

export const TTL = {
  LIST: 300,    // 5 min — collections change more often
  RECORD: 600,  // 10 min — individual patient records
  USER: 900,    // 15 min — Clerk-managed users rarely change
} as const;

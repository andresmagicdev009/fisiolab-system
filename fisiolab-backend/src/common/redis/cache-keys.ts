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
} as const;

export const TTL = {
  LIST: 300,    // 5 min — collections change more often
  RECORD: 600,  // 10 min — individual patient records
  USER: 900,    // 15 min — Clerk-managed users rarely change
} as const;

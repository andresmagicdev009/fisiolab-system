import { useAuth, useUser } from '@clerk/clerk-react';

type UserResource = NonNullable<ReturnType<typeof useUser>['user']>;

export type UserRole = 'paciente' | 'fisioterapeuta' | 'medico' | 'pasante' | 'admin';

const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/admin/default',
  fisioterapeuta: '/admin/default',
  medico: '/admin/default',
  pasante: '/admin/default',
  paciente: '/admin/default',
};

export function getRoleRedirect(role: string | undefined): string {
  if (!role) return '/admin/default';
  return ROLE_REDIRECTS[role as UserRole] ?? '/admin/default';
}

/**
 * publicMetadata solo escribible desde backend (CLERK_SECRET_KEY).
 * unsafeMetadata es lo que el frontend guarda en signup.
 * Leemos publicMetadata primero (fuente autoritativa del backend),
 * con fallback a unsafeMetadata (datos del registro del usuario).
 */
export function getUserRole(user: UserResource): string | undefined {
  return (
    (user.publicMetadata?.role as string | undefined) ??
    (user.unsafeMetadata?.role as string | undefined)
  );
}

export function getUserCedula(user: UserResource): string | undefined {
  return (
    (user.publicMetadata?.cedula as string | undefined) ??
    (user.unsafeMetadata?.cedula as string | undefined)
  );
}

export function useAuthToken() {
  const { getToken } = useAuth();

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return { getToken, getAuthHeader };
}


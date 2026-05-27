import { Navigate, Outlet } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { useCurrentDbUser } from 'hooks/useCurrentUser';

const CLINICAL_ROLES = ['medico', 'fisioterapeuta', 'pasante'];

export function OnboardingGuard() {
  const { data: user, isLoading } = useCurrentDbUser();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="green.600" thickness="3px" />
      </Center>
    );
  }

  if (user && CLINICAL_ROLES.includes(user.role) && !user.hasAvailability) {
    return <Navigate to="/onboarding/disponibilidad" replace />;
  }

  return <Outlet />;
}

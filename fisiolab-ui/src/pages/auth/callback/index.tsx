import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Flex, Spinner } from '@chakra-ui/react';
import { getRoleRedirect, getUserRole } from 'utils/auth';

function AuthCallback() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user) {
      navigate(getRoleRedirect(getUserRole(user)), { replace: true });
    } else {
      navigate('/auth/sign-in', { replace: true });
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  return (
    <Flex minH='100vh' align='center' justify='center'>
      <Spinner size='xl' color='brand.500' />
    </Flex>
  );
}

export default AuthCallback;

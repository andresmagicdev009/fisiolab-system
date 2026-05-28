import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import AuthLayout from './components/layouts/auth';
import AdminLayout from './components/layouts/admin';
import RTLLayout from './components/layouts/rtl';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import { CalendarPreview } from './pages/preview/CalendarPreview';
import { ChakraProvider, Flex, Spinner } from '@chakra-ui/react';
import initialTheme from './theme/theme';
import { useState, useEffect } from 'react';
import { getUserRole, getRoleRedirect } from './utils/auth';
import { useCurrentDbUser } from './hooks/useCurrentUser';
import { VerificationCodeInputPreview } from 'pages/preview/VerificationCodeInputPreview';

function DevTokenLogger(): null {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;
    getToken().then((token) => {
      console.log('%c[DEV] Clerk JWT:', 'color: #6C47FF; font-weight: bold;', token);
    });
  }, [isSignedIn, getToken]);

  return null;
}

function RootRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <Flex minH='100vh' align='center' justify='center'>
        <Spinner size='xl' color='brand.500' />
      </Flex>
    );
  }

  if (isSignedIn && user) {
    const role = getUserRole(user);
    return <Navigate to={getRoleRedirect(role)} replace />;
  }

  return <Navigate to='/auth/sign-in' replace />;
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to='/auth/sign-in' replace />;
  return children;
}

const CLINICAL_ROLES = ['medico', 'fisioterapeuta', 'pasante'];

function AdminGuardedLayout(props: { theme: any; setTheme: any }) {
  const { data: user, isLoading } = useCurrentDbUser();

  if (isLoading) {
    return (
      <Flex h='100vh' align='center' justify='center'>
        <Spinner size='xl' color='brand.500' />
      </Flex>
    );
  }

  if (user && CLINICAL_ROLES.includes(user.role) && !user.hasAvailability) {
    return <Navigate to='/onboarding/disponibilidad' replace />;
  }

  return <AdminLayout theme={props.theme} setTheme={props.setTheme} />;
}

function GuestRoute({ children }: { children: JSX.Element }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn && user) {
    const role = getUserRole(user);
    return <Navigate to={getRoleRedirect(role)} replace />;
  }

  return children;
}

export default function Main() {
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

  return (
    <ChakraProvider theme={currentTheme}>
      <DevTokenLogger />
      <Routes>
        <Route
          path='auth/*'
          element={
            <GuestRoute>
              <AuthLayout />
            </GuestRoute>
          }
        />
        {/* Onboarding — accessible to all authenticated users, no sidebar */}
        <Route
          path='onboarding/disponibilidad'
          element={
            <ProtectedRoute>
              <OnboardingWizard />
            </ProtectedRoute>
          }
        />

        <Route path='preview/verification-code' element={<VerificationCodeInputPreview />} />

        <Route
          path='admin/*'
          element={
            <ProtectedRoute>
              <AdminGuardedLayout theme={currentTheme} setTheme={setCurrentTheme} />
            </ProtectedRoute>
          }
        />
        <Route
          path='rtl/*'
          element={
            <ProtectedRoute>
              <RTLLayout theme={currentTheme} setTheme={setCurrentTheme} />
            </ProtectedRoute>
          }
        />
        <Route path='preview/calendar' element={<CalendarPreview />} />
        <Route path='/' element={<RootRedirect />} />
      </Routes>
    </ChakraProvider>
  );
}

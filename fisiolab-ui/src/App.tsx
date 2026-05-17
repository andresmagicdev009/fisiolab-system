import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import AuthLayout from './layouts/auth';
import AdminLayout from './layouts/admin';
import RTLLayout from './layouts/rtl';
import { ChakraProvider } from '@chakra-ui/react';
import initialTheme from './theme/theme';
import { useState, useEffect } from 'react';

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

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to='/auth/sign-in' replace />;
  return children;
}

export default function Main() {
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

  return (
    <ChakraProvider theme={currentTheme}>
      <DevTokenLogger />
      <Routes>
        <Route path='auth/*' element={<AuthLayout />} />
        <Route
          path='admin/*'
          element={
            <ProtectedRoute>
              <AdminLayout theme={currentTheme} setTheme={setCurrentTheme} />
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
        <Route path='/' element={<Navigate to='/auth/sign-in' replace />} />
      </Routes>
    </ChakraProvider>
  );
}

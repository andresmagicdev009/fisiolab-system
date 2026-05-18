import { Icon } from '@chakra-ui/react';
import {
  MdHome,
  MdPerson,
  MdLock,
  MdDashboard,
  MdPeople,
} from 'react-icons/md';
import { Navigate } from 'react-router-dom';

// Dashboard views per role
import AdminDashboard from 'views/admin/adminDashboard';
import FisioDashboard from 'views/admin/fisioDashboard';
import MedicoDashboard from 'views/admin/medicoDashboard';

// Shared views
import Profile from 'views/admin/profile';
import PatientsView from 'views/admin/patients';
import PatientDetail from 'views/admin/patients/PatientDetail';

// Auth views
import SignInCentered from 'views/auth/signIn';
import AuthCallback from 'views/auth/callback';

const routes: RoutesType[] = [
  // ── Admin ────────────────────────────────────────────────
  {
    name: 'Dashboard',
    layout: '/admin',
    path: '/dashboard',
    icon: <Icon as={MdDashboard} width='20px' height='20px' color='inherit' />,
    component: <AdminDashboard />,
    roles: ['admin'],
  },

  // ── Fisioterapeuta / Pasante ──────────────────────────────
  {
    name: 'Dashboard',
    layout: '/admin',
    path: '/fisio',
    icon: <Icon as={MdHome} width='20px' height='20px' color='inherit' />,
    component: <FisioDashboard />,
    roles: ['fisioterapeuta', 'pasante'],
  },

  // ── Médico ───────────────────────────────────────────────
  {
    name: 'Dashboard',
    layout: '/admin',
    path: '/medico',
    icon: <Icon as={MdHome} width='20px' height='20px' color='inherit' />,
    component: <MedicoDashboard />,
    roles: ['medico'],
  },

  // ── Pacientes ────────────────────────────────────────────
  {
    name: 'Pacientes',
    layout: '/admin',
    path: '/patients',
    icon: <Icon as={MdPeople} width='20px' height='20px' color='inherit' />,
    component: <PatientsView />,
    roles: ['admin', 'fisioterapeuta', 'medico', 'pasante'],
  },
  {
    name: 'Detalle Paciente',
    layout: '/admin',
    path: '/patients/:id',
    icon: '',
    component: <PatientDetail />,
    roles: ['admin', 'fisioterapeuta', 'medico', 'pasante'],
    hidden: true,
  },

  // ── Perfil (todos los roles) ──────────────────────────────
  {
    name: 'Perfil',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson} width='20px' height='20px' color='inherit' />,
    component: <Profile />,
    roles: ['admin', 'fisioterapeuta', 'medico', 'pasante', 'paciente'],
  },

  // ── Auth ─────────────────────────────────────────────────
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    icon: <Icon as={MdLock} width='20px' height='20px' color='inherit' />,
    component: <SignInCentered />,
  },
  {
    name: 'Sign Up',
    layout: '/auth',
    path: '/sign-up',
    icon: <Icon as={MdLock} width='20px' height='20px' color='inherit' />,
    component: <Navigate to='/auth/sign-in' replace />,
  },
  {
    name: 'Auth Callback',
    layout: '/auth',
    path: '/callback',
    icon: <Icon as={MdLock} width='20px' height='20px' color='inherit' />,
    component: <AuthCallback />,
  },
];

export default routes;

import { Icon } from '@chakra-ui/react';
import {
  MdHome,
  MdPerson,
  MdLock,
  MdDashboard,
  MdPeople,
  MdCalendarMonth,
} from 'react-icons/md';
import { Navigate } from 'react-router-dom';

// Dashboard views per role
import AdminDashboard from 'pages/admin/adminDashboard';
import FisioDashboard from 'pages/professional/fisioDashboard';
import MedicoDashboard from 'pages/professional/medicoDashboard';

// Shared views
import Profile from 'pages/professional/profile';
import PatientsView from 'pages/professional/patients';
import PatientDetail from 'pages/professional/patients/PatientDetail';


// Auth views
import SignInCentered from 'pages/auth/signIn';
import AuthCallback from 'pages/auth/callback';
import { CalendarPreview } from 'pages/preview/CalendarPreview';

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
  {
    name: 'Calendar Preview Test',
    layout: "/preview",
    path: "/preview/calendar",
    icon: <Icon as={MdCalendarMonth} width='20px' height='20px' color='inherit' />,
    component: <CalendarPreview />,
  }
];

export default routes;

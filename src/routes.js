import React from 'react';

import { Icon } from '@chakra-ui/react';
import { 
  MdPerson,
  MdPeople,
  MdHome,
  MdEventAvailable,
  MdSchedule,
  MdWork,
  MdCalendarToday,
  MdLock,
  MdSecurity,
  MdBusiness,
  MdSwapCalls,
  MdHistory,
} from 'react-icons/md';

// Admin Imports
import MainDashboard from 'views/admin/default';
import Profile from 'views/admin/profile';
import UsersAdmin from 'views/admin/users';
import AccessControlAdmin from 'views/admin/accessControl';
import AppointmentsAdmin from 'views/admin/appointments';
import DoctorSchedule from 'views/admin/schedule';
import EmployeeSchedule from 'views/admin/employeeSchedule';
import Departments from 'views/admin/departments';
import MyAppointments from 'views/admin/myAppointments';
import ReferredAppointments from 'views/admin/referred';
import PatientHistory from 'views/admin/patientHistory';
import RTL from 'views/admin/rtl';

// Auth Imports
import SignInCentered from 'views/auth/signIn';




const routes = [
  {
    name: 'Main Dashboard',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <MainDashboard />,
  },
  // {
  //   name: 'NFT Marketplace',
  //   layout: '/admin',
  //   path: '/nft-marketplace',
  //   icon: (
  //     <Icon
  //       as={MdOutlineShoppingCart}
  //       width="20px"
  //       height="20px"
  //       color="inherit"
  //     />
  //   ),
  //   component: <NFTMarketplace />,
  //   secondary: true,
  // },
  // {
  //   name: 'Data Tables',
  //   layout: '/admin',
  //   icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
  //   path: '/data-tables',
  //   component: <DataTables />,
  // },
  {
    name: 'Profile',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <Profile />,
  },
  {
    name: 'Users',
    layout: '/admin',
    path: '/users',
    icon: <Icon as={MdPeople} width="20px" height="20px" color="inherit" />,
    component: <UsersAdmin />,
  },
  {
    name: 'Access Control',
    layout: '/admin',
    path: '/access-control',
    icon: <Icon as={MdSecurity} width="20px" height="20px" color="inherit" />,
    component: <AccessControlAdmin />,
  },
  {
    name: 'Appointments',
    layout: '/admin',
    path: '/appointments',
    icon: <Icon as={MdEventAvailable} width="20px" height="20px" color="inherit" />,
    component: <AppointmentsAdmin />,
  },
  {
    name: 'Referred',
    layout: '/admin',
    path: '/referred',
    icon: <Icon as={MdSwapCalls} width="20px" height="20px" color="inherit" />,
    component: <ReferredAppointments />,
  },
  {
    name: 'Patient History',
    layout: '/admin',
    path: '/patient-history',
    icon: <Icon as={MdHistory} width="20px" height="20px" color="inherit" />,
    component: <PatientHistory />,
  },
  {
    name: 'Schedule',
    layout: '/admin',
    path: '/schedule',
    icon: <Icon as={MdSchedule} width="20px" height="20px" color="inherit" />,
    component: <DoctorSchedule />,
  },
  {
    name: 'Employee Schedule',
    layout: '/admin',
    path: '/employee-schedule',
    icon: <Icon as={MdWork} width="20px" height="20px" color="inherit" />,
    component: <EmployeeSchedule />,
  },
  {
    name: 'Departments',
    layout: '/admin',
    path: '/departments',
    icon: <Icon as={MdBusiness} width="20px" height="20px" color="inherit" />,
    component: <Departments />,
  },
  {
    name: 'My Appointments',
    layout: '/admin',
    path: '/my-appointments',
    icon: <Icon as={MdCalendarToday} width="20px" height="20px" color="inherit" />,
    component: <MyAppointments />,
  },
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
  },
  {
    name: 'RTL Admin',
    layout: '/rtl',
    path: '/rtl-default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <RTL />,
  },
];

export default routes;

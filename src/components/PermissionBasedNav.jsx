import React from 'react';
import { useAuth } from 'contexts/AuthContext';
import routes from '../routes';

const PermissionBasedNav = () => {
  const { user } = useAuth();

  // Define permission requirements for each route
  const routePermissions = {
    '/default': [], // Main dashboard - visible to all authenticated users
    '/profile': [], // Profile - visible to all authenticated users
    '/users': ['MANAGE_USERS'], // Users management
    '/access-control': ['MANAGE_USERS'], // Access control
    '/appointments': ['MANAGE_APPOINTMENTS'], // Appointments management
    '/referred': ['MANAGE_APPOINTMENTS'], // Referred appointments
    '/patient-history': ['VIEW_REPORTS'], // Patient history
    '/schedule': ['MANAGE_APPOINTMENTS'], // Doctor schedule
    '/employee-schedule': ['MANAGE_APPOINTMENTS'], // Employee schedule
    '/departments': ['MANAGE_DEPARTMENTS'], // Departments management
    '/my-appointments': [], // My appointments - visible to all authenticated users
  };

  // Filter routes based on user permissions
  const filteredRoutes = routes.filter(route => {
    const requiredPermissions = routePermissions[route.path] || [];
    
    // If no permissions required, show to all authenticated users
    if (requiredPermissions.length === 0) {
      return true;
    }
    
    // Check if user has all required permissions
    return requiredPermissions.some(permission => 
      user?.permissions?.includes(permission)
    );
  });

  // Additional filter to hide Users route if user doesn't have MANAGE_USERS permission
  const finalRoutes = filteredRoutes.filter(route => {
    if (route.path === '/users') {
      return user?.permissions?.includes('MANAGE_USERS') || false;
    }
    return true;
  });

  return finalRoutes;
};

export default PermissionBasedNav;

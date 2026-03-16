// Chakra imports
import { Portal, Box, useDisclosure } from '@chakra-ui/react';
import Footer from 'components/footer/FooterAdmin.js';
// Layout components
import Navbar from 'components/navbar/NavbarAdmin.js';
import Sidebar from 'components/sidebar/Sidebar.js';
import { SidebarContext } from 'contexts/SidebarContext';
import React, { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import routes from 'routes.js';
import { useAuth } from 'contexts/AuthContext';

// Custom Chakra theme
export default function Dashboard(props) {
  const { ...rest } = props;
  const { user } = useAuth();
  
  // states and functions
  const [fixed] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  
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
  const getFilteredRoutes = () => {
    return routes.filter(route => {
      const requiredPermissions = routePermissions[route.path] || [];
      
      // If no permissions required, show to all authenticated users
      if (requiredPermissions.length === 0) {
        return true;
      }
      
      // Check if user has any of the required permissions
      return requiredPermissions.some(permission => 
        user?.permissions?.includes(permission)
      );
    });
  };
  // functions for changing the states from components
  const getRoute = () => {
    return window.location.pathname !== '/admin/full-screen-maps';
  };
  const getActiveRoute = (filteredRoutes) => {
    let activeRoute = 'Default Brand Text';
    for (let i = 0; i < filteredRoutes.length; i++) {
      if (filteredRoutes[i].collapse) {
        let collapseActiveRoute = getActiveRoute(filteredRoutes[i].items);
        if (collapseActiveRoute !== activeRoute) {
          return collapseActiveRoute;
        }
      } else if (filteredRoutes[i].category) {
        let categoryActiveRoute = getActiveRoute(filteredRoutes[i].items);
        if (categoryActiveRoute !== activeRoute) {
          return categoryActiveRoute;
        }
      } else {
        if (
          window.location.href.indexOf(filteredRoutes[i].layout + filteredRoutes[i].path) !== -1
        ) {
          return filteredRoutes[i].name;
        }
      }
    }
    return activeRoute;
  };
  const getActiveNavbar = (filteredRoutes) => {
    let activeNavbar = false;
    for (let i = 0; i < filteredRoutes.length; i++) {
      if (filteredRoutes[i].collapse) {
        let collapseActiveNavbar = getActiveNavbar(filteredRoutes[i].items);
        if (collapseActiveNavbar !== activeNavbar) {
          return collapseActiveNavbar;
        }
      } else if (filteredRoutes[i].category) {
        let categoryActiveNavbar = getActiveNavbar(filteredRoutes[i].items);
        if (categoryActiveNavbar !== activeNavbar) {
          return categoryActiveNavbar;
        }
      } else {
        if (
          window.location.href.indexOf(filteredRoutes[i].layout + filteredRoutes[i].path) !== -1
        ) {
          return filteredRoutes[i].secondary;
        }
      }
    }
    return activeNavbar;
  };
  const getActiveNavbarText = (filteredRoutes) => {
    let activeNavbar = false;
    for (let i = 0; i < filteredRoutes.length; i++) {
      if (filteredRoutes[i].collapse) {
        let collapseActiveNavbar = getActiveNavbarText(filteredRoutes[i].items);
        if (collapseActiveNavbar !== activeNavbar) {
          return collapseActiveNavbar;
        }
      } else if (filteredRoutes[i].category) {
        let categoryActiveNavbar = getActiveNavbarText(filteredRoutes[i].items);
        if (categoryActiveNavbar !== activeNavbar) {
          return categoryActiveNavbar;
        }
      } else {
        if (
          window.location.href.indexOf(filteredRoutes[i].layout + filteredRoutes[i].path) !== -1
        ) {
          return filteredRoutes[i].messageNavbar;
        }
      }
    }
    return activeNavbar;
  };
  const getRoutes = (filteredRoutes) => {
    return filteredRoutes.map((route, key) => {
      if (route.layout === '/admin') {
        return (
          <Route path={`${route.path}`} element={route.component} key={key} />
        );
      }
      if (route.collapse) {
        return getRoutes(route.items);
      } else {
        return null;
      }
    });
  };
  document.documentElement.dir = 'ltr';
  const { onOpen } = useDisclosure();
  document.documentElement.dir = 'ltr';
  
  const filteredRoutes = getFilteredRoutes();
  
  return (
    <Box>
      <Box>
        <SidebarContext.Provider
          value={{
            toggleSidebar,
            setToggleSidebar,
          }}
        >
          <Sidebar routes={filteredRoutes} display="none" {...rest} />
          <Box
            float="right"
            minHeight="100vh"
            height="100%"
            overflow="auto"
            position="relative"
            maxHeight="100%"
            w={{ base: '100%', xl: 'calc( 100% - 290px )' }}
            maxWidth={{ base: '100%', xl: 'calc( 100% - 290px )' }}
            transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
            transitionDuration=".2s, .2s, .35s"
            transitionProperty="top, bottom, width"
            transitionTimingFunction="linear, linear, ease"
          >
            <Portal>
              <Box>
                <Navbar
                  onOpen={onOpen}
                  logoText={'DocManager'}
                  brandText={getActiveRoute(filteredRoutes)}
                  secondary={getActiveNavbar(filteredRoutes)}
                  message={getActiveNavbarText(filteredRoutes)}
                  fixed={fixed}
                  {...rest}
                />
              </Box>
            </Portal>

            {getRoute() ? (
              <Box
                mx="auto"
                p={{ base: '20px', md: '30px' }}
                pe="20px"
                minH="100vh"
                pt="50px"
              >
                <Routes>
                  {getRoutes(filteredRoutes)}
                  <Route
                    path="/"
                    element={<Navigate to="/admin/default" replace />}
                  />
                </Routes>
              </Box>
            ) : null}
            <Box>
              <Footer />
            </Box>
          </Box>
        </SidebarContext.Provider>
      </Box>
    </Box>
  );
}

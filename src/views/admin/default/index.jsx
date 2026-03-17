import {
  Avatar,
  Box,
  Flex,
  FormLabel,
  Icon,
  Select,
  SimpleGrid,
  useColorModeValue,
  Button,
} from "@chakra-ui/react";
// Assets
import Usa from "assets/img/dashboards/usa.png";
// Custom components
import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import React, { useState, useEffect, useMemo } from "react";
import {
  MdAddTask,
  MdAttachMoney,
  MdBarChart,
  MdFileCopy,
  MdPeople,
  MdCalendarToday,
  MdAssignment,
  MdHistory,
  MdBusiness,
  MdSwapCalls,
  MdRefresh,
} from "react-icons/md";
import { useAuth } from 'contexts/AuthContext';

// Import conditional components
import TotalSpent from "views/admin/default/components/TotalSpent";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";

export default function UserReports() {
  // Chakra Color Mode
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const { user } = useAuth();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalAppointments: 0,
    totalReports: 0,
    totalPatients: 0,
    totalDepartments: 0,
    totalReferrals: 0,
    earnings: 0,
    spendThisMonth: 0,
    sales: 0,
    balance: 0,
    newTasks: 0,
    totalProjects: 0,
    loading: true,
    error: null
  });

  // Memoize permission checks to prevent infinite re-renders
  const permissions = useMemo(() => ({
    canManageUsers: user?.permissions?.includes('MANAGE_USERS') || false,
    canManageAppointments: user?.permissions?.includes('MANAGE_APPOINTMENTS') || false,
    canViewReports: user?.permissions?.includes('VIEW_REPORTS') || false,
    canManageDepartments: user?.permissions?.includes('MANAGE_DEPARTMENTS') || false,
  }), [user?.permissions]);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      // Get token using the same logic as AuthContext
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      // Fetch different data based on permissions
      const fetchPromises = [];

      // Common data for all users
      fetchPromises.push(
        fetch('http://localhost:8002/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
          .then(async res => {
            if (!res.ok) {
              const errorText = await res.text();
              console.error('Dashboard stats error response:', errorText);
              throw new Error(`Failed to fetch dashboard stats: ${res.status} ${errorText}`);
            }
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const errorText = await res.text();
              console.error('Non-JSON response:', errorText);
              throw new Error('Server returned non-JSON response');
            }
            return res.json();
          })
          .then(data => ({ earnings: data.earnings || 0, spendThisMonth: data.spendThisMonth || 0, sales: data.sales || 0, balance: data.balance || 0, newTasks: data.newTasks || 0, totalProjects: data.totalProjects || 0 }))
          .catch(err => ({ error: err.message }))
      );

      // User management data
      if (permissions.canManageUsers) {
        fetchPromises.push(
          fetch('http://localhost:8002/api/admin/users/count', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          .then(async res => {
            if (!res.ok) {
              const errorText = await res.text();
              console.error('User count error response:', errorText);
              throw new Error(`Failed to fetch user count: ${res.status} ${errorText}`);
            }
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const errorText = await res.text();
              console.error('Non-JSON response:', errorText);
              throw new Error('Server returned non-JSON response');
            }
            return res.json();
          })
          .then(data => ({ totalUsers: data.count || 0, totalDepartments: data.departments || 0 }))
          .catch(err => ({ error: err.message }))
        );
      }

      // Appointment data
      if (permissions.canManageAppointments) {
        fetchPromises.push(
          fetch('http://localhost:8002/api/admin/appointments/count', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          .then(async res => {
            if (!res.ok) {
              const errorText = await res.text();
              console.error('Appointment count error response:', errorText);
              throw new Error(`Failed to fetch appointment count: ${res.status} ${errorText}`);
            }
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const errorText = await res.text();
              console.error('Non-JSON response:', errorText);
              throw new Error('Server returned non-JSON response');
            }
            return res.json();
          })
          .then(data => ({ totalAppointments: data.total || 0, totalReferrals: data.referrals || 0 }))
          .catch(err => ({ error: err.message }))
        );
      }

      // Report data
      if (permissions.canViewReports) {
        fetchPromises.push(
          fetch('http://localhost:8002/api/admin/reports/count', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          .then(async res => {
            if (!res.ok) {
              const errorText = await res.text();
              console.error('Report count error response:', errorText);
              throw new Error(`Failed to fetch report count: ${res.status} ${errorText}`);
            }
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const errorText = await res.text();
              console.error('Non-JSON response:', errorText);
              throw new Error('Server returned non-JSON response');
            }
            return res.json();
          })
          .then(data => ({ totalReports: data.count || 0, totalPatients: data.patients || 0 }))
          .catch(err => ({ error: err.message }))
        );
      }

      // Wait for all fetches to complete
      const results = await Promise.allSettled(fetchPromises);
      
      // Combine all results
      const combinedData = {
        totalUsers: 0,
        totalAppointments: 0,
        totalReports: 0,
        totalPatients: 0,
        totalDepartments: 0,
        totalReferrals: 0,
        earnings: 0,
        spendThisMonth: 0,
        sales: 0,
        balance: 0,
        newTasks: 0,
        totalProjects: 0,
        loading: false,
        error: null
      };

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(combinedData, result.value);
        } else if (result.reason) {
          combinedData.error = result.reason.message || 'Failed to fetch data';
        }
      });

      setDashboardData(combinedData);
    } catch (error) {
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []); // Load only on page mount

  // Manual refresh function
  const handleRefresh = () => {
    fetchDashboardStats();
  };

  if (dashboardData.loading) {
    return (
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap='20px' mb='20px'>
          {[...Array(6)].map((_, index) => (
            <MiniStatistics key={index} name="Loading..." value="..." />
          ))}
        </SimpleGrid>
      </Box>
    );
  }

  if (dashboardData.error) {
    return (
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        <Box textAlign="center" py="40px">
          <Icon as={MdBarChart} w="48px" h="48px" color="red.500" mb="16px" />
          <Box color="red.500" fontSize="lg" fontWeight="medium">
            Error loading dashboard data
          </Box>
          <Box color="gray.500" mt="8px">
            {dashboardData.error}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Refresh Button */}
      <Flex justify="flex-end" mb="20px">
        <Button
          leftIcon={<MdRefresh />}
          onClick={handleRefresh}
          isLoading={dashboardData.loading}
          colorScheme="blue"
          variant="solid"
        >
          Refresh Data
        </Button>
      </Flex>
      
      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3, "2xl": 6 }}
        gap='20px'
        mb='20px'>
        
        {/* Admin Statistics - Only for users with MANAGE_USERS */}
        {permissions.canManageUsers && (
          <>
            <MiniStatistics
              startContent={
                <IconBox
                  w='56px'
                  h='56px'
                  bg={boxBg}
                  icon={
                    <Icon w='32px' h='32px' as={MdPeople} color={brandColor} />
                  }
                />
              }
              name='Total Users'
              value={dashboardData.totalUsers}
            />
            <MiniStatistics
              startContent={
                <IconBox
                  w='56px'
                  h='56px'
                  bg={boxBg}
                  icon={
                    <Icon w='32px' h='32px' as={MdBusiness} color={brandColor} />
                  }
                />
              }
              name='Departments'
              value={dashboardData.totalDepartments}
            />
          </>
        )}

        {/* Appointment Statistics - For users with MANAGE_APPOINTMENTS */}
        {permissions.canManageAppointments && (
          <>
            <MiniStatistics
              startContent={
                <IconBox
                  w='56px'
                  h='56px'
                  bg={boxBg}
                  icon={
                    <Icon w='32px' h='32px' as={MdCalendarToday} color={brandColor} />
                  }
                />
              }
              name='Total Appointments'
              value={dashboardData.totalAppointments}
            />
            <MiniStatistics
              startContent={
                <IconBox
                  w='56px'
                  h='56px'
                  bg={boxBg}
                  icon={
                    <Icon w='32px' h='32px' as={MdSwapCalls} color={brandColor} />
                  }
                />
              }
              name='Referrals'
              value={dashboardData.totalReferrals}
            />
          </>
        )}

        {/* Report Statistics - For users with VIEW_REPORTS */}
        {permissions.canViewReports && (
          <>
            <MiniStatistics
              startContent={
                <IconBox
                  w='56px'
                  h='56px'
                  bg={boxBg}
                  icon={
                    <Icon w='32px' h='32px' as={MdAssignment} color={brandColor} />
                  }
                />
              }
              name='Total Reports'
              value={dashboardData.totalReports}
            />
            <MiniStatistics
              startContent={
                <IconBox
                  w='56px'
                  h='56px'
                  bg={boxBg}
                  icon={
                    <Icon w='32px' h='32px' as={MdHistory} color={brandColor} />
                  }
                />
              }
              name='Patient History'
              value={dashboardData.totalPatients}
            />
          </>
        )}

        {/* Financial Statistics - For all users */}
        {/* <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdBarChart} color={brandColor} />
              }
            />
          }
          name='Earnings'
          value={`Rs ${dashboardData.earnings.toFixed(2)}`}
        /> */}
        {/* <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdAttachMoney} color={brandColor} />
              }
            />
          }
          name='Spend this month'
          value={`Rs ${dashboardData.spendThisMonth.toFixed(2)}`}
        /> */}
        
        {/* Task Statistics - For all users */}
        <MiniStatistics growth='+23%' name='Sales' value={`Rs ${dashboardData.sales.toFixed(2)}`} />
        <MiniStatistics
          endContent={
            <Flex me='-16px' mt='10px'>
              <FormLabel htmlFor='balance'>
                <Avatar src={Usa} />
              </FormLabel>
              <Select
                id='balance'
                variant='mini'
                mt='5px'
                me='0px'
                defaultValue='usd'>
                <option value='usd'>USD</option>
                <option value='eur'>EUR</option>
                <option value='gba'>GBA</option>
              </Select>
            </Flex>
          }
          name='Your balance'
          value={`Rs ${dashboardData.balance.toFixed(2)}`}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg='linear-gradient(90deg, #4481EB 0%, #04BEFE 100%)'
              icon={<Icon w='28px' h='28px' as={MdAddTask} color='white' />}
            />
          }
          name='New Tasks'
          value={dashboardData.newTasks}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='56px'
              h='56px'
              bg={boxBg}
              icon={
                <Icon w='32px' h='32px' as={MdFileCopy} color={brandColor} />
              }
            />
          }
          name='Total Projects'
          value={dashboardData.totalProjects}
        />
      </SimpleGrid>

      {/* Financial Charts - Only for users with MANAGE_DEPARTMENTS or admin */}
      {(permissions.canManageDepartments || permissions.canManageUsers) && (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='20px' mb='20px'>
          <TotalSpent />
          <WeeklyRevenue />
        </SimpleGrid>
      )}
    </Box>
  );
}

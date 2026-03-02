import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  Switch,
  Text,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Badge,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE = 'http://localhost:8002/api';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIME_SLOTS = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30',
  '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

export default function EmployeeSchedule() {
  const { token, user } = useAuth();
  const toast = useToast();

  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(user?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();

  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    isAvailable: true
  });

  const fetchSchedules = useCallback(async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/employees/${userId}/schedules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSchedules(data);
      else toast({ title: 'Failed to fetch schedules', status: 'error' });
    } catch (err) {
      toast({ title: 'Error fetching schedules', status: 'error' });
    }
  }, [token, toast]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dayOfWeek || !formData.startTime || !formData.endTime) {
      toast({ title: 'Please fill all required fields', status: 'warning' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/employees/${selectedEmployee}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast({ 
          title: isEditing ? 'Schedule updated' : 'Schedule created', 
          status: 'success' 
        });
        resetForm();
        fetchSchedules(selectedEmployee);
      } else {
        const err = await res.json();
        toast({ 
          title: 'Failed to save schedule', 
          description: err.error || err.message, 
          status: 'error' 
        });
      }
    } catch (err) {
      toast({ title: 'Error saving schedule', status: 'error' });
    }
  };

  const handleEdit = (schedule) => {
    setIsEditing(true);
    setFormData({
      dayOfWeek: schedule.dayOfWeek.toString(),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isAvailable: schedule.isAvailable
    });
  };

  const handleDelete = (scheduleId) => {
    setScheduleToDelete(scheduleId);
    onOpen();
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees/${selectedEmployee}/schedules/${scheduleToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast({ title: 'Schedule deleted', status: 'success' });
        fetchSchedules(selectedEmployee);
      } else {
        toast({ title: 'Failed to delete schedule', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error deleting schedule', status: 'error' });
    } finally {
      onClose();
      setScheduleToDelete(null);
    }
  };

  const handleCreateDefaultSchedule = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/employees/${selectedEmployee}/default-schedule`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast({ title: 'Default schedule created', status: 'success' });
        fetchSchedules(selectedEmployee);
      } else {
        const err = await res.json();
        toast({ 
          title: 'Failed to create default schedule', 
          description: err.error, 
          status: 'error' 
        });
      }
    } catch (err) {
      toast({ title: 'Error creating default schedule', status: 'error' });
    }
  };

  const handleCreateDefaultSchedulesForAll = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/employees/create-default-schedules`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        toast({ 
          title: 'Default schedules created', 
          description: `Created schedules for ${data.usersProcessed} users (${data.totalSchedulesCreated} total schedules)`, 
          status: 'success' 
        });
        fetchEmployees();
      } else {
        const err = await res.json();
        toast({ 
          title: 'Failed to create default schedules', 
          description: err.error, 
          status: 'error' 
        });
      }
    } catch (err) {
      toast({ title: 'Error creating default schedules', status: 'error' });
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormData({
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      isAvailable: true
    });
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchSchedules(selectedEmployee);
    }
  }, [selectedEmployee, fetchSchedules]);

  const canManageOtherEmployees = user?.role === 'SUPER_ADMIN';
  const currentEmployeeName = employees.find(e => e.id === selectedEmployee)?.name || 'Select Employee';

  return (
    <Box pt={{ base: '130px', md: '80px' }} px={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Employee Schedule Management</Heading>

        {/* Employee Selection (for admins) */}
        {canManageOtherEmployees && (
          <Card maxW="400px">
            <CardBody>
              <FormControl>
                <FormLabel>Select Employee</FormLabel>
                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Choose an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.email}) - {employee.role?.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </CardBody>
          </Card>
        )}

        {/* Default Schedule Actions */}
        {selectedEmployee && canManageOtherEmployees && (
          <Card>
            <CardHeader>
              <Heading size="md">Default Schedule Actions</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="start">
                <Text fontSize="sm" color="gray.600">
                  Default working hours: Monday-Friday, 9:00 AM - 5:00 PM
                </Text>
                <HStack spacing={4}>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={handleCreateDefaultSchedule}
                  >
                    Create Default for {currentEmployeeName}
                  </Button>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="green"
                    onClick={handleCreateDefaultSchedulesForAll}
                  >
                    Create Default for All Employees
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {selectedEmployee && (
          <>
            {/* Schedule Form */}
            <Card maxW="500px">
              <CardHeader>
                <Heading size="md">
                  {isEditing ? 'Edit Schedule' : 'Add Schedule'} - {currentEmployeeName}
                </Heading>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Day of Week</FormLabel>
                      <Select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                      >
                        <option value="">Select day</option>
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <HStack spacing={4} w="100%">
                      <FormControl isRequired>
                        <FormLabel>Start Time</FormLabel>
                        <Select
                          value={formData.startTime}
                          onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        >
                          <option value="">Select time</option>
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>End Time</FormLabel>
                        <Select
                          value={formData.endTime}
                          onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        >
                          <option value="">Select time</option>
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </HStack>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Available</FormLabel>
                      <Switch
                        isChecked={formData.isAvailable}
                        onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                      />
                    </FormControl>

                    <HStack spacing={4}>
                      <Button type="submit" colorScheme="blue">
                        {isEditing ? 'Update' : 'Add'} Schedule
                      </Button>
                      {isEditing && (
                        <Button type="button" variant="outline" onClick={resetForm}>
                          Cancel
                        </Button>
                      )}
                    </HStack>
                  </VStack>
                </form>
              </CardBody>
            </Card>

            {/* Schedules Table */}
            <Card>
              <CardHeader>
                <Heading size="md">Current Schedules</Heading>
              </CardHeader>
              <CardBody>
                {schedules.length === 0 ? (
                  <Text color="gray.500">No schedules found</Text>
                ) : (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Day</Th>
                        <Th>Start Time</Th>
                        <Th>End Time</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {schedules.map((schedule) => (
                        <Tr key={schedule.id}>
                          <Td>
                            {DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label}
                          </Td>
                          <Td>{schedule.startTime}</Td>
                          <Td>{schedule.endTime}</Td>
                          <Td>
                            <Badge
                              colorScheme={schedule.isAvailable ? 'green' : 'red'}
                            >
                              {schedule.isAvailable ? 'Available' : 'Unavailable'}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                size="sm"
                                icon={<EditIcon />}
                                onClick={() => handleEdit(schedule)}
                                aria-label="Edit schedule"
                              />
                              <IconButton
                                size="sm"
                                icon={<DeleteIcon />}
                                onClick={() => handleDelete(schedule.id)}
                                aria-label="Delete schedule"
                                colorScheme="red"
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Schedule
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete this schedule? This action cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Box>
  );
}

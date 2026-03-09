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
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
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
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
];

const EmployeeSchedule = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    isAvailable: true,
  });
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/doctors-patients`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [user?.token]);

  const fetchSchedules = useCallback(async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/employees/${selectedEmployee}/schedules`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        toast({
          title: 'Error fetching schedules',
          description: 'Unable to load employee schedules',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch schedules',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, user?.token, toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchSchedules();
    }
  }, [selectedEmployee, fetchSchedules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingSchedule 
        ? `${API_BASE}/employees/${selectedEmployee}/schedules/${editingSchedule.id}`
        : `${API_BASE}/employees/${selectedEmployee}/schedules`;
      
      const method = editingSchedule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: editingSchedule ? 'Schedule updated' : 'Schedule created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setFormData({ dayOfWeek: '', startTime: '', endTime: '', isAvailable: true });
        setEditingSchedule(null);
        fetchSchedules();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to save schedule',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save schedule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      dayOfWeek: schedule.dayOfWeek.toString(),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isAvailable: schedule.isAvailable,
    });
  };

  const handleDelete = async (scheduleId) => {
    try {
      const response = await fetch(`${API_BASE}/employees/${selectedEmployee}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Schedule deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchSchedules();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete schedule',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    onClose();
  };

  const getDayLabel = (dayValue) => {
    const day = DAYS_OF_WEEK.find(d => d.value === parseInt(dayValue));
    return day ? day.label : 'Unknown';
  };

  return (
    <Box p={8}>
      <Heading mb={6}>Employee Schedule Management</Heading>
      
      <VStack spacing={6} align="stretch">
        {/* Employee Selection */}
        <Card>
          <CardHeader>
            <Heading size="md">Select Employee</Heading>
          </CardHeader>
          <CardBody>
            <FormControl>
              <FormLabel>Employee</FormLabel>
              <Select
                placeholder="Select an employee"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </Select>
            </FormControl>
          </CardBody>
        </Card>

        {selectedEmployee && (
          <>
            {/* Schedule Form */}
            <Card>
              <CardHeader>
                <Heading size="md">
                  {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
                </Heading>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={4}>
                    <HStack spacing={4} width="100%">
                      <FormControl isRequired>
                        <FormLabel>Day of Week</FormLabel>
                        <Select
                          value={formData.dayOfWeek}
                          onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                        >
                          {DAYS_OF_WEEK.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Start Time</FormLabel>
                        <Select
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        >
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>End Time</FormLabel>
                        <Select
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        >
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </HStack>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="isAvailable" mb="0">
                        Available
                      </FormLabel>
                      <Switch
                        id="isAvailable"
                        isChecked={formData.isAvailable}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      />
                    </FormControl>

                    <HStack spacing={4}>
                      <Button type="submit" colorScheme="blue">
                        {editingSchedule ? 'Update' : 'Add'} Schedule
                      </Button>
                      {editingSchedule && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingSchedule(null);
                            setFormData({ dayOfWeek: '', startTime: '', endTime: '', isAvailable: true });
                          }}
                        >
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
                {loading ? (
                  <Text>Loading schedules...</Text>
                ) : schedules.length === 0 ? (
                  <Text>No schedules found for this employee.</Text>
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
                          <Td>{getDayLabel(schedule.dayOfWeek)}</Td>
                          <Td>{schedule.startTime}</Td>
                          <Td>{schedule.endTime}</Td>
                          <Td>
                            <Badge colorScheme={schedule.isAvailable ? 'green' : 'red'}>
                              {schedule.isAvailable ? 'Available' : 'Unavailable'}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                icon={<EditIcon />}
                                size="sm"
                                onClick={() => handleEdit(schedule)}
                                aria-label="Edit schedule"
                              />
                              <IconButton
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                onClick={() => {
                                  setEditingSchedule(schedule);
                                  onOpen();
                                }}
                                aria-label="Delete schedule"
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
      </VStack>

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
              <Button
                colorScheme="red"
                onClick={() => handleDelete(editingSchedule.id)}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default EmployeeSchedule;

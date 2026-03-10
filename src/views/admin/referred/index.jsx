import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Textarea,
  useToast,
  VStack,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Card,
  CardBody,
  Spinner
} from '@chakra-ui/react';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE = 'http://localhost:8002/api';

export default function ReferredAppointments() {
  const { token, user } = useAuth();
  const toast = useToast();

  const [referredAppointments, setReferredAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Form states
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'CASH' });
  const [scheduleForm, setScheduleForm] = useState({ doctorId: '', selectedDate: '', dateTime: '', notes: '' });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    fetchReferredAppointments();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (scheduleForm.doctorId && scheduleForm.selectedDate) {
      // Ensure the date is in YYYY-MM-DD format for the API
      const dateForApi = new Date(scheduleForm.selectedDate).toISOString().split('T')[0];
      fetchAvailableSlots(scheduleForm.doctorId, dateForApi);
    }
  }, [scheduleForm.doctorId, scheduleForm.selectedDate]);

  const fetchReferredAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/admin/referred-appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReferredAppointments(data);
      } else {
        toast({ title: 'Failed to fetch referred appointments', status: 'error' });
      }
    } catch (error) {
      console.error('Error fetching referred appointments:', error);
      toast({ title: 'Error fetching appointments', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      setIsLoadingSlots(true);
      const response = await fetch(`${API_BASE}/doctors/${doctorId}/availability?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Extract availableSlots from the response
        setAvailableSlots(data.availableSlots || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleProcessPayment = (appointment) => {
    setSelectedAppointment(appointment);
    setPaymentForm({ amount: '', paymentMethod: 'CASH' });
    setIsPaymentModalOpen(true);
  };

  const submitPayment = async () => {
    if (!paymentForm.amount || !paymentForm.paymentMethod || !selectedAppointment) {
      toast({ title: 'Payment amount, method, and appointment are required', status: 'error' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/appointments/${selectedAppointment.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          patientId: selectedAppointment.patientId,
          description: `Payment for scheduled appointment - ${selectedAppointment.patient?.name}`
        }),
      });

      if (response.ok) {
        toast({ title: 'Payment processed successfully', status: 'success' });
        setIsPaymentModalOpen(false);
        fetchReferredAppointments(); // Refresh the list
      } else {
        const error = await response.json();
        toast({ title: 'Payment failed', description: error.error, status: 'error' });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({ title: 'Payment failed', description: error.message, status: 'error' });
    }
  };

  const handleScheduleAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    
    // Filter doctors by referred department
    const referredDeptId = appointment.referredToDoctor?.department?.id;
    const filtered = referredDeptId 
      ? doctors.filter(doctor => doctor.department?.id === referredDeptId)
      : doctors; // Fallback to all doctors if no department specified
    
    setFilteredDoctors(filtered);
    
    setScheduleForm({ 
      doctorId: appointment.referredTo || '', 
      selectedDate: '',
      dateTime: '', 
      notes: `Referral appointment for ${appointment.patient?.name}` 
    });
    setAvailableSlots([]);
    setIsScheduleModalOpen(true);
  };

  const submitSchedule = async () => {
    if (!scheduleForm.doctorId || !scheduleForm.dateTime || !selectedAppointment) {
      toast({ title: 'Doctor, date/time, and appointment are required', status: 'error' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: selectedAppointment.patientId,
          doctorId: scheduleForm.doctorId,
          dateTime: scheduleForm.dateTime,
          notes: scheduleForm.notes,
          referredFrom: selectedAppointment.id // Link to original referral
        }),
      });

      if (response.ok) {
        const newAppointment = await response.json();
        
        // Update original appointment status to PENDING_PAYMENT
        await fetch(`${API_BASE}/appointments/${selectedAppointment.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'PENDING_PAYMENT'
          }),
        });

        toast({ 
          title: 'Appointment scheduled successfully', 
          description: `Visit #${newAppointment.visitNumber} created. Payment can now be processed.`,
          status: 'success' 
        });
        
        setIsScheduleModalOpen(false);
        fetchReferredAppointments(); // Refresh the list
      } else {
        const error = await response.json();
        toast({ title: 'Failed to schedule appointment', description: error.error, status: 'error' });
      }
    } catch (error) {
      console.error('Schedule error:', error);
      toast({ title: 'Failed to schedule appointment', description: error.message, status: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REFERRED': return 'purple';
      case 'PENDING_PAYMENT': return 'yellow';
      case 'SCHEDULED': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'REFERRED': return 'Referred';
      case 'PENDING_PAYMENT': return 'Pending Payment';
      case 'SCHEDULED': return 'Scheduled';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <Box p={6}>
      <Heading mb={6} size="lg">Referred Appointments Management</Heading>
      
      <Card>
        <CardBody>
          {isLoading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" />
              <Text mt={4}>Loading referred appointments...</Text>
            </Box>
          ) : referredAppointments.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="lg" color="gray.500">No referred appointments found</Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Patient</Th>
                  <Th>Original Doctor</Th>
                  <Th>Referred To</Th>
                  <Th>Visit #</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {referredAppointments.map((apt) => (
                  <Tr key={apt.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{apt.patient?.name}</Text>
                        <Text fontSize="sm" color="gray.600">{apt.patient?.email}</Text>
                        <Text fontSize="sm" color="gray.600">{apt.patient?.phone}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text>{apt.doctor?.name}</Text>
                        <Text fontSize="sm" color="gray.600">{apt.doctor?.department?.name}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      {apt.referredToDoctor ? (
                        <VStack align="start" spacing={1}>
                          <Text>{apt.referredToDoctor.name}</Text>
                          <Text fontSize="sm" color="gray.600">{apt.referredToDoctor.department?.name}</Text>
                        </VStack>
                      ) : (
                        <Text color="gray.500">Not assigned</Text>
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">Visit #{apt.visitNumber}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(apt.status)}>
                        {getStatusText(apt.status)}
                      </Badge>
                    </Td>
                    <Td>
                      {apt.dateTime ? new Date(apt.dateTime).toLocaleDateString() : '-'}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        {apt.status === 'REFERRED' && (
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleScheduleAppointment(apt)}
                          >
                            Schedule
                          </Button>
                        )}
                        {apt.status === 'PENDING_PAYMENT' && (
                          <Button
                            size="sm"
                            colorScheme="yellow"
                            onClick={() => handleProcessPayment(apt)}
                          >
                            Process Payment
                          </Button>
                        )}
                        {apt.status === 'SCHEDULED' && (
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => {
                              // Navigate to complete appointment functionality
                              window.location.href = `/admin/appointments?complete=${apt.id}`;
                            }}
                          >
                            Complete
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Process Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box>
                <Text fontWeight="bold">Patient:</Text>
                <Text>{selectedAppointment?.patient?.name}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Referred to:</Text>
                <Text>{selectedAppointment?.referredToDoctor?.name || 'Not assigned'}</Text>
              </Box>
              <FormControl isRequired>
                <FormLabel>Amount</FormLabel>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="ONLINE">Online</option>
                  <option value="INSURANCE">Insurance</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={submitPayment}>
              Process Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Schedule Referral Appointment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box>
                <Text fontWeight="bold">Patient:</Text>
                <Text>{selectedAppointment?.patient?.name}</Text>
              </Box>
              {selectedAppointment?.referredToDoctor?.department && (
                <Box>
                  <Text fontWeight="bold">Referred Department:</Text>
                  <Text>{selectedAppointment.referredToDoctor.department.name}</Text>
                </Box>
              )}
              <FormControl isRequired>
                <FormLabel>Assign to Doctor</FormLabel>
                <Select
                  value={scheduleForm.doctorId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, doctorId: e.target.value, selectedDate: '', dateTime: '' })}
                  placeholder="Select doctor"
                >
                  {filteredDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} - {doctor.department?.name}
                    </option>
                  ))}
                </Select>
                {filteredDoctors.length === 0 && (
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    No doctors available in the referred department
                  </Text>
                )}
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={scheduleForm.selectedDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, selectedDate: e.target.value, dateTime: '' })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Time Slot</FormLabel>
                <Select
                  value={scheduleForm.dateTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, dateTime: e.target.value })}
                  placeholder="Select time slot"
                  isDisabled={!scheduleForm.doctorId || !scheduleForm.selectedDate || isLoadingSlots}
                >
                  {availableSlots.map((slot) => (
                    <option key={slot.id} value={slot.startTime}>
                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </option>
                  ))}
                </Select>
                {isLoadingSlots && (
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    Loading available time slots...
                  </Text>
                )}
                {!isLoadingSlots && scheduleForm.doctorId && scheduleForm.selectedDate && availableSlots.length === 0 && (
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    No available time slots for selected date
                  </Text>
                )}
              </FormControl>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  placeholder="Add any notes for this appointment"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={submitSchedule}>
              Schedule Appointment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

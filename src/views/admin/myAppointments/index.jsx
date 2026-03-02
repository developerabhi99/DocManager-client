import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  //CardHeader,
  CardBody,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  //Divider,
  useToast,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  //Table,
  //Thead,
  //Tbody,
  //Tr,
  //Th,
  //Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useDisclosure,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { 
  //CalendarIcon,
  //TimeIcon,
  //CheckCircleIcon,
  //WarningIcon,
  ViewIcon,
  //EditIcon,
  //ExternalLinkIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE = 'http://localhost:8002/api';

export default function MyAppointments() {
  const { token, user } = useAuth();
  const toast = useToast();
  
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isCompleteOpen, onOpen: onCompleteOpen, onClose: onCompleteClose } = useDisclosure();
  const { isOpen: isReferOpen, onOpen: onReferOpen, onClose: onReferClose } = useDisclosure();
  
  const [completeForm, setCompleteForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    paymentDescription: ''
  });
  
  const [referForm, setReferForm] = useState({
    referredTo: '',
    notes: ''
  });

  const fetchMyAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/my-appointments`;
      const params = new URLSearchParams();
      
      if (user.role === 'SUPER_ADMIN') {
        if (selectedDoctor) params.append('doctorId', selectedDoctor);
        if (selectedPatient) params.append('patientId', selectedPatient);
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
        
        // Calculate summary
        const scheduled = data.filter(apt => apt.status === 'SCHEDULED').length;
        const completed = data.filter(apt => apt.status === 'COMPLETED').length;
        const cancelled = data.filter(apt => apt.status === 'CANCELLED').length;
        const referred = data.filter(apt => apt.status === 'REFERRED').length;
        
        setSummary({
          total: data.length,
          scheduled,
          completed,
          cancelled,
          referred
        });
      } else {
        toast({ title: 'Failed to fetch appointments', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error fetching appointments', status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, toast, user.role, selectedDoctor, selectedPatient]);

  const fetchDoctorsAndPatients = useCallback(async () => {
    if (user.role !== 'SUPER_ADMIN') return;
    
    try {
      const res = await fetch(`${API_BASE}/admin/doctors-patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
        setPatients(data.patients || []);
      } else {
        toast({ title: 'Failed to fetch doctors and patients', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error fetching doctors and patients', status: 'error' });
    }
  }, [token, toast, user.role]);

  const handleCompleteAppointment = async () => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${selectedAppointment.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(completeForm)
      });

      if (res.ok) {
        toast({ title: 'Appointment completed successfully', status: 'success' });
        onCompleteClose();
        fetchMyAppointments();
      } else {
        const err = await res.json();
        toast({ title: 'Failed to complete appointment', description: err.error, status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error completing appointment', status: 'error' });
    }
  };

  const handleReferPatient = async () => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${selectedAppointment.id}/refer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(referForm)
      });

      if (res.ok) {
        toast({ title: 'Patient referred successfully', status: 'success' });
        onReferClose();
        fetchMyAppointments();
      } else {
        const err = await res.json();
        toast({ title: 'Failed to refer patient', description: err.error, status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error referring patient', status: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      case 'REFERRED': return 'orange';
      default: return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    fetchMyAppointments();
    fetchDoctorsAndPatients();
  }, [fetchMyAppointments, fetchDoctorsAndPatients]);

  if (loading) {
    return (
      <Box pt={{ base: '130px', md: '80px' }} px={6} display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>{user.role === 'SUPER_ADMIN' ? 'Loading all appointments...' : 'Loading your appointments...'}</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px' }} px={6}>
      <VStack spacing={6} align="stretch">
        <Heading>
          {user.role === 'SUPER_ADMIN' ? 'All Appointments' : 'My Appointments'}
        </Heading>

        {/* Super Admin Filters */}
        {user.role === 'SUPER_ADMIN' && (
          <Card>
            <CardBody>
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Filter by Doctor</FormLabel>
                  <Select
                    placeholder="All Doctors"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                  >
                    <option value="">All Doctors</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} ({doctor.email})
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Filter by Patient</FormLabel>
                  <Select
                    placeholder="All Patients"
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                  >
                    <option value="">All Patients</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} {patient.phone && `(${patient.phone})`}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  mt={6}
                  onClick={() => {
                    setSelectedDoctor('');
                    setSelectedPatient('');
                  }}
                >
                  Clear Filters
                </Button>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Stat>
            <StatLabel>Total Appointments</StatLabel>
            <StatNumber>{summary.total}</StatNumber>
            <StatHelpText>All time</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Scheduled</StatLabel>
            <StatNumber color="blue.500">{summary.scheduled}</StatNumber>
            <StatHelpText>Upcoming</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Completed</StatLabel>
            <StatNumber color="green.500">{summary.completed}</StatNumber>
            <StatHelpText>Finished</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Cancelled</StatLabel>
            <StatNumber color="red.500">{summary.cancelled}</StatNumber>
            <StatHelpText>Cancelled</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Referred</StatLabel>
            <StatNumber color="orange.500">{summary.referred}</StatNumber>
            <StatHelpText>Referred</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Appointments Tabs */}
        <Tabs>
          <TabList>
            <Tab>Scheduled ({summary.scheduled})</Tab>
            <Tab>Completed ({summary.completed})</Tab>
            <Tab>Cancelled ({summary.cancelled})</Tab>
            <Tab>Referred ({summary.referred})</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <AppointmentList 
                appointments={appointments.filter(apt => apt.status === 'SCHEDULED')}
                status="SCHEDULED"
                user={user}
                onViewDetails={(apt) => { setSelectedAppointment(apt); onDetailsOpen(); }}
                onComplete={(apt) => { setSelectedAppointment(apt); onCompleteOpen(); }}
                onRefer={(apt) => { setSelectedAppointment(apt); onReferOpen(); }}
              />
            </TabPanel>
            <TabPanel>
              <AppointmentList 
                appointments={appointments.filter(apt => apt.status === 'COMPLETED')}
                status="COMPLETED"
                user={user}
                onViewDetails={(apt) => { setSelectedAppointment(apt); onDetailsOpen(); }}
              />
            </TabPanel>
            <TabPanel>
              <AppointmentList 
                appointments={appointments.filter(apt => apt.status === 'CANCELLED')}
                status="CANCELLED"
                user={user}
                onViewDetails={(apt) => { setSelectedAppointment(apt); onDetailsOpen(); }}
              />
            </TabPanel>
            <TabPanel>
              <AppointmentList 
                appointments={appointments.filter(apt => apt.status === 'REFERRED')}
                status="REFERRED"
                user={user}
                onViewDetails={(apt) => { setSelectedAppointment(apt); onDetailsOpen(); }}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Appointment Details Modal */}
        <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Appointment Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedAppointment && (
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Status:</Text>
                    <Badge colorScheme={getStatusColor(selectedAppointment.status)}>
                      {selectedAppointment.status}
                    </Badge>
                  </HStack>
                  
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Visit Number:</Text>
                    <Text>Visit #{selectedAppointment.visitNumber}</Text>
                  </HStack>

                  <HStack justify="space-between">
                    <Text fontWeight="bold">Date & Time:</Text>
                    <Text>{formatDate(selectedAppointment.dateTime)}</Text>
                  </HStack>

                  {user.role === 'SUPER_ADMIN' ? (
                    <>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Patient:</Text>
                        <Text>{selectedAppointment.patient?.name}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Patient Contact:</Text>
                        <Text>{selectedAppointment.patient?.phone || 'N/A'}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Patient Email:</Text>
                        <Text>{selectedAppointment.patient?.email || 'N/A'}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Doctor:</Text>
                        <Text>{selectedAppointment.doctor?.name}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Doctor Email:</Text>
                        <Text>{selectedAppointment.doctor?.email || 'N/A'}</Text>
                      </HStack>
                    </>
                  ) : user.role === 'DOCTOR' ? (
                    <>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Patient:</Text>
                        <Text>{selectedAppointment.patient?.name}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Patient Contact:</Text>
                        <Text>{selectedAppointment.patient?.phone || 'N/A'}</Text>
                      </HStack>
                    </>
                  ) : (
                    <>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Doctor:</Text>
                        <Text>{selectedAppointment.doctor?.name}</Text>
                      </HStack>
                    </>
                  )}

                  {selectedAppointment.notes && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Notes:</Text>
                      <Text bg="gray.50" p={3} rounded="md">
                        {selectedAppointment.notes}
                      </Text>
                    </Box>
                  )}

                  {selectedAppointment.transactions && selectedAppointment.transactions.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Transactions:</Text>
                      <VStack spacing={2} align="stretch">
                        {selectedAppointment.transactions.map((transaction) => (
                          <HStack key={transaction.id} justify="space-between" bg="gray.50" p={2} rounded="md">
                            <Text>${transaction.amount}</Text>
                            <Badge colorScheme={transaction.status === 'PAID' ? 'green' : 'yellow'}>
                              {transaction.status}
                            </Badge>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {selectedAppointment.reports && selectedAppointment.reports.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Medical Reports:</Text>
                      <VStack spacing={2} align="stretch">
                        {selectedAppointment.reports.map((report) => (
                          <Box key={report.id} bg="gray.50" p={3} rounded="md">
                            <Text fontWeight="bold">Diagnosis:</Text>
                            <Text>{report.diagnosis || 'Not specified'}</Text>
                            {report.prescription && (
                              <>
                                <Text fontWeight="bold" mt={2}>Prescription:</Text>
                                <Text>{report.prescription}</Text>
                              </>
                            )}
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onDetailsClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Complete Appointment Modal */}
        <Modal isOpen={isCompleteOpen} onClose={onCompleteClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Complete Appointment</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Appointment Fee</FormLabel>
                  <Input
                    type="number"
                    value={completeForm.amount}
                    onChange={(e) => setCompleteForm({...completeForm, amount: e.target.value})}
                    placeholder="Enter amount"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    value={completeForm.paymentMethod}
                    onChange={(e) => setCompleteForm({...completeForm, paymentMethod: e.target.value})}
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="ONLINE">Online</option>
                    <option value="INSURANCE">Insurance</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={completeForm.paymentDescription}
                    onChange={(e) => setCompleteForm({...completeForm, paymentDescription: e.target.value})}
                    placeholder="Payment description (optional)"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={onCompleteClose}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={handleCompleteAppointment}>
                Complete & Create Transaction
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Refer Patient Modal */}
        <Modal isOpen={isReferOpen} onClose={onReferClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Refer Patient</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Refer To</FormLabel>
                  <Input
                    value={referForm.referredTo}
                    onChange={(e) => setReferForm({...referForm, referredTo: e.target.value})}
                    placeholder="Doctor name or department"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Referral Notes</FormLabel>
                  <Textarea
                    value={referForm.notes}
                    onChange={(e) => setReferForm({...referForm, notes: e.target.value})}
                    placeholder="Reason for referral"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={onReferClose}>
                Cancel
              </Button>
              <Button colorScheme="orange" onClick={handleReferPatient}>
                Refer Patient
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
}

function AppointmentList({ appointments, status, user, onViewDetails, onComplete, onRefer }) {
  if (appointments.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">
          {user.role === 'SUPER_ADMIN' 
            ? 'No appointments found in the system' 
            : `No ${status.toLowerCase()} appointments found`
          }
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {appointments.map((appointment) => (
        <Card key={appointment.id}>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">
                    {user.role === 'SUPER_ADMIN' 
                      ? `${appointment.patient?.name} - ${appointment.doctor?.name}`
                      : (user.role === 'DOCTOR' ? appointment.patient?.name : appointment.doctor?.name)
                    }
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {formatDate(appointment.dateTime)}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Visit #{appointment.visitNumber}
                  </Text>
                  {user.role === 'SUPER_ADMIN' && (
                    <Text fontSize="xs" color="gray.500">
                      Patient: {appointment.patient?.email} | Doctor: {appointment.doctor?.email}
                    </Text>
                  )}
                </VStack>
                <Badge colorScheme={getStatusColor(status)}>
                  {status}
                </Badge>
              </HStack>

              {appointment.notes && (
                <Text fontSize="sm" color="gray.700" noOfLines={2}>
                  {appointment.notes}
                </Text>
              )}

              <HStack spacing={2}>
                <Button
                  size="sm"
                  leftIcon={<ViewIcon />}
                  onClick={() => onViewDetails(appointment)}
                >
                  View Details
                </Button>
                
                {user.role === 'DOCTOR' && status === 'SCHEDULED' && (
                  <>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => onComplete(appointment)}
                    >
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="orange"
                      onClick={() => onRefer(appointment)}
                    >
                      Refer
                    </Button>
                  </>
                )}
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'SCHEDULED': return 'blue';
    case 'COMPLETED': return 'green';
    case 'CANCELLED': return 'red';
    case 'REFERRED': return 'orange';
    default: return 'gray';
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

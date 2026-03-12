import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  useToast,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE = 'http://localhost:8002/api';

export default function PatientHistory() {
  const { token, user } = useAuth();
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/admin/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        toast({ title: 'Failed to fetch patients', status: 'error' });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({ title: 'Error fetching patients', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientHistory = async (patientId) => {
    try {
      setIsHistoryLoading(true);
      const response = await fetch(`${API_BASE}/admin/patients/${patientId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatientHistory(data);
      } else {
        toast({ title: 'Failed to fetch patient history', status: 'error' });
        setPatientHistory(null);
      }
    } catch (error) {
      console.error('Error fetching patient history:', error);
      toast({ title: 'Error fetching patient history', status: 'error' });
      setPatientHistory(null);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    fetchPatientHistory(patient.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'REFERRED': return 'purple';
      case 'SCHEDULED': return 'blue';
      case 'PENDING_PAYMENT': return 'yellow';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'REFERRED': return 'Referred';
      case 'SCHEDULED': return 'Scheduled';
      case 'PENDING_PAYMENT': return 'Pending Payment';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  return (
    <Box p={6}>
      <Heading mb={6} size="lg">Patient History Management</Heading>
      
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <Heading size="md">Select Patient</Heading>
          </CardHeader>
          <CardBody>
            <FormControl mb={4}>
              <FormLabel>Search Patients</FormLabel>
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormControl>
            
            {isLoading ? (
              <Box textAlign="center" py={4}>
                <Spinner size="lg" />
                <Text mt={2}>Loading patients...</Text>
              </Box>
            ) : (
              <VStack spacing={2} maxH="400px" overflowY="auto">
                {filteredPatients.map((patient) => (
                  <Card
                    key={patient.id}
                    p={3}
                    cursor="pointer"
                    bg={selectedPatient?.id === patient.id ? "blue.50" : "white"}
                    border={selectedPatient?.id === patient.id ? "2px solid" : "1px solid"}
                    borderColor={selectedPatient?.id === patient.id ? "blue.500" : "gray.200"}
                    onClick={() => handlePatientSelect(patient)}
                    _hover={{ bg: "gray.50" }}
                  >
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">{patient.name}</Text>
                      <Text fontSize="sm" color="gray.600">{patient.email}</Text>
                      <Text fontSize="sm" color="gray.600">{patient.phone}</Text>
                      <Text fontSize="sm" color="gray.500">
                        Age: {patient.age} | Gender: {patient.gender}
                      </Text>
                    </VStack>
                  </Card>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>

        {/* Patient History */}
        <Card gridColumn={{ lg: "span 2" }}>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">
                {selectedPatient ? `${selectedPatient.name}'s History` : 'Patient History'}
              </Heading>
              {selectedPatient && (
                <Badge colorScheme="blue" fontSize="sm">
                  {patientHistory?.totalVisits || 0} Total Visits
                </Badge>
              )}
            </HStack>
          </CardHeader>
          <CardBody>
            {isHistoryLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" />
                <Text mt={4}>Loading patient history...</Text>
              </Box>
            ) : !selectedPatient ? (
              <Box textAlign="center" py={8}>
                <Text fontSize="lg" color="gray.500">Select a patient to view their history</Text>
              </Box>
            ) : !patientHistory ? (
              <Box textAlign="center" py={8}>
                <Text fontSize="lg" color="gray.500">No history found for this patient</Text>
              </Box>
            ) : (
              <Tabs>
                <TabList>
                  <Tab>Treatment Groups</Tab>
                  <Tab>All Visits</Tab>
                </TabList>
                
                <TabPanels>
                  <TabPanel>
                    <Accordion allowMultiple>
                      {patientHistory.treatmentGroups.map((group, index) => (
                        <AccordionItem key={group.id}>
                          <h2>
                            <AccordionButton>
                              <Box flex="1" textAlign="left">
                                <VStack align="start" spacing={1}>
                                  <HStack>
                                    <Text fontWeight="bold">{group.title}</Text>
                                    <Badge colorScheme={group.status === 'ACTIVE' ? 'green' : 'gray'}>
                                      {group.status}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600">
                                    {group.visits.length} visits | 
                                    {new Date(group.startDate).toLocaleDateString()} - 
                                    {new Date(group.endDate).toLocaleDateString()}
                                  </Text>
                                  {group.description && (
                                    <Text fontSize="sm" color="gray.500">{group.description}</Text>
                                  )}
                                </VStack>
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={4}>
                            <VStack spacing={4}>
                              {group.visits.map((visit, visitIndex) => (
                                <Card key={visit.id} p={4} border="1px solid" borderColor="gray.200">
                                  <VStack align="start" spacing={3}>
                                    <HStack justify="space-between" w="full">
                                      <HStack>
                                        <Text fontWeight="bold">Visit #{visit.visitNumber}</Text>
                                        <Badge colorScheme={getStatusColor(visit.status)}>
                                          {getStatusText(visit.status)}
                                        </Badge>
                                      </HStack>
                                      <Text fontSize="sm" color="gray.500">
                                        {new Date(visit.dateTime).toLocaleString()}
                                      </Text>
                                    </HStack>
                                    
                                    <Divider />
                                    
                                    <SimpleGrid columns={2} spacing={4} w="full">
                                      <Box>
                                        <Text fontSize="sm" fontWeight="600" color="gray.600">Doctor</Text>
                                        <Text>{visit.doctor?.name || 'N/A'}</Text>
                                        {visit.doctor?.department && (
                                          <Text fontSize="sm" color="gray.500">
                                            {visit.doctor.department.name}
                                          </Text>
                                        )}
                                      </Box>
                                      
                                      <Box>
                                        <Text fontSize="sm" fontWeight="600" color="gray.600">Payment</Text>
                                        {visit.payment ? (
                                          <VStack align="start" spacing={1}>
                                            <Text>${visit.payment.amount} - {visit.payment.paymentMethod}</Text>
                                            <Text fontSize="sm" color="gray.500">
                                              {new Date(visit.payment.createdAt).toLocaleDateString()}
                                            </Text>
                                          </VStack>
                                        ) : (
                                          <Text fontSize="sm" color="gray.500">No payment recorded</Text>
                                        )}
                                      </Box>
                                    </SimpleGrid>
                                    
                                    {visit.notes && (
                                      <Box>
                                        <Text fontSize="sm" fontWeight="600" color="gray.600">Notes</Text>
                                        <Text fontSize="sm">{visit.notes}</Text>
                                      </Box>
                                    )}
                                    
                                    {visit.referredTo && (
                                      <Box>
                                        <Text fontSize="sm" fontWeight="600" color="purple.600">Referred To</Text>
                                        <Text fontSize="sm" color="purple.500">{visit.referredTo}</Text>
                                      </Box>
                                    )}
                                    
                                    {visit.medicalReport && (
                                      <Box w="full">
                                        <Text fontSize="sm" fontWeight="600" color="gray.600" mb={2}>Medical Report</Text>
                                        <SimpleGrid columns={2} spacing={3} w="full">
                                          {visit.medicalReport.diagnosis && (
                                            <Box>
                                              <Text fontSize="sm" fontWeight="500">Diagnosis</Text>
                                              <Text fontSize="sm">{visit.medicalReport.diagnosis}</Text>
                                            </Box>
                                          )}
                                          {visit.medicalReport.symptoms && (
                                            <Box>
                                              <Text fontSize="sm" fontWeight="500">Symptoms</Text>
                                              <Text fontSize="sm">{visit.medicalReport.symptoms}</Text>
                                            </Box>
                                          )}
                                          {visit.medicalReport.treatment && (
                                            <Box>
                                              <Text fontSize="sm" fontWeight="500">Treatment</Text>
                                              <Text fontSize="sm">{visit.medicalReport.treatment}</Text>
                                            </Box>
                                          )}
                                          {visit.medicalReport.prescription && (
                                            <Box>
                                              <Text fontSize="sm" fontWeight="500">Prescription</Text>
                                              <Text fontSize="sm">{visit.medicalReport.prescription}</Text>
                                            </Box>
                                          )}
                                        </SimpleGrid>
                                      </Box>
                                    )}
                                  </VStack>
                                </Card>
                              ))}
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabPanel>
                  
                  <TabPanel>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Visit #</Th>
                          <Th>Date</Th>
                          <Th>Doctor</Th>
                          <Th>Status</Th>
                          <Th>Department</Th>
                          <Th>Payment</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {patientHistory.treatmentGroups.flatMap(group => 
                          group.visits.map(visit => (
                            <Tr key={visit.id}>
                              <Td>
                                <Badge colorScheme="blue" fontSize="sm">
                                  #{visit.visitNumber}
                                </Badge>
                              </Td>
                              <Td>{new Date(visit.dateTime).toLocaleDateString()}</Td>
                              <Td>{visit.doctor?.name || 'N/A'}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(visit.status)}>
                                  {getStatusText(visit.status)}
                                </Badge>
                              </Td>
                              <Td>{visit.doctor?.department?.name || 'N/A'}</Td>
                              <Td>
                                {visit.payment ? (
                                  <Text fontSize="sm">
                                    ${visit.payment.amount} ({visit.payment.paymentMethod})
                                  </Text>
                                ) : (
                                  <Text fontSize="sm" color="gray.500">No payment</Text>
                                )}
                              </Td>
                            </Tr>
                          ))
                        )}
                      </Tbody>
                    </Table>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
}

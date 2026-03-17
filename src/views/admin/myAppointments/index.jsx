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
  Progress,
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
const BASE = 'http://localhost:8002';

// Utility functions
const getStatusColor = (status) => {
  switch (status) {
    case 'SCHEDULED': return 'blue';
    case 'COMPLETED': return 'green';
    case 'CANCELLED': return 'red';
    case 'REFERRED': return 'orange';
    default: return 'gray';
  }
};

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString();
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

function MyAppointments() {
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
  
  const [departments, setDepartments] = useState([]);
  const [completionForm, setCompletionForm] = useState({ 
    notes: '', 
    diagnosis: '', 
    symptoms: '', 
    treatment: '', 
    prescription: '', 
    reportFile: null,
    shouldRefer: false,
    referralDepartment: '',
    referralTarget: '',
    referralNotes: ''
  });

  // Additional state for modals and file upload
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [users, setUsers] = useState([]);

  // Modal state management
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose
  } = useDisclosure();

  const {
    isOpen: isCompleteOpen,
    onOpen: onCompleteOpen,
    onClose: onCompleteClose
  } = useDisclosure();

  const {
    isOpen: isReferOpen,
    onOpen: onReferOpen,
    onClose: onReferClose
  } = useDisclosure();

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

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("department ",data);
        setDepartments(data || []);
      } else {
        toast({ title: 'Failed to fetch departments', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error fetching departments', status: 'error' });
    }
  }, [token, toast]);

  const handleViewDetails = async (appointment) => {
    setSelectedAppointment(appointment);
    setIsLoadingDetails(true);
    
    try {
      // Fetch comprehensive appointment details including reports and referral information
      const response = await fetch(`${API_BASE}/appointments/${appointment.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointmentDetails(data);
      } else {
        // Fallback to basic appointment data if detailed endpoint fails
        setAppointmentDetails(appointment);
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      // Fallback to basic appointment data
      setAppointmentDetails(appointment);
    } finally {
      setIsLoadingDetails(false);
      setIsViewDetailsModalOpen(true);
    }
  };

  const handleCompleteAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setCompletionForm({ 
      notes: '', 
      diagnosis: '', 
      symptoms: '', 
      treatment: '', 
      prescription: '', 
      reportFile: null,
      shouldRefer: false,
      referralDepartment: '',
      referralTarget: '',
      referralNotes: ''
    });
    setUploadProgress(0);
    setIsUploading(false);
    setIsCompletionModalOpen(true);
  };

  const submitCompletion = async () => {
    if (!completionForm.notes || !completionForm.diagnosis) {
      toast({ title: 'Notes and diagnosis are required', status: 'error' });
      return;
    }

    // Additional validation for referral
    if (completionForm.shouldRefer && (!completionForm.referralTarget || !completionForm.referralNotes)) {
      toast({ title: 'Referral target and notes are required when referring', status: 'error' });
      return;
    }

    try {
      console.log('🚀 Starting completion/referral submission...');
      console.log('📋 Form data:', {
        notes: completionForm.notes,
        diagnosis: completionForm.diagnosis,
        symptoms: completionForm.symptoms,
        treatment: completionForm.treatment,
        prescription: completionForm.prescription,
        shouldRefer: completionForm.shouldRefer,
        referralTarget: completionForm.referralTarget,
        referralNotes: completionForm.referralNotes,
        hasReportFile: !!completionForm.reportFile
      });

      // Get the patient's medical report group if available
      let medicalReportGroupId = null;
      try {
        const patientResponse = await fetch(`${API_BASE}/patients/${selectedAppointment.patientId}/report-groups`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          // Get the most recent active medical report group
          const activeGroups = patientData.filter(group => group.status === 'ACTIVE');
          if (activeGroups.length > 0) {
            medicalReportGroupId = activeGroups[0].id;
          }
        }
      } catch (error) {
        console.warn('Could not fetch medical report groups:', error);
      }

      // Create FormData for the request
      const formData = new FormData();
      
      // Add all form fields
      formData.append('notes', completionForm.notes);
      formData.append('diagnosis', completionForm.diagnosis);
      formData.append('symptoms', completionForm.symptoms);
      formData.append('treatment', completionForm.treatment);
      formData.append('prescription', completionForm.prescription);
      formData.append('isReferred', completionForm.shouldRefer ? 'true' : 'false');
      formData.append('referredTo', completionForm.shouldRefer ? completionForm.referralTarget : '');
      formData.append('referralReason', completionForm.shouldRefer ? completionForm.referralNotes : '');
      
      // Include medical report group if available
      if (medicalReportGroupId) {
        formData.append('medicalReportGroupId', medicalReportGroupId);
      }
      
      // Add file if it exists
      if (completionForm.reportFile) {
        console.log('📎 Adding file to payload:', {
          name: completionForm.reportFile.name,
          size: completionForm.reportFile.size,
          type: completionForm.reportFile.type
        });
        formData.append('reportFile', completionForm.reportFile);
      }

      console.log('📤 Sending FormData with fields:', {
        fieldCount: Array.from(formData.keys()).length,
        fields: Array.from(formData.keys()),
        hasFile: formData.has('reportFile'),
        fileName: completionForm.reportFile?.name
      });

      // Send the request
      const completionRes = await fetch(`${API_BASE}/appointments/${selectedAppointment.id}/complete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData - browser sets it automatically with boundary
        },
        body: formData,
      });
      
      console.log('📡 Completion response status:', completionRes.status);
      const completionData = await completionRes.json();
      console.log('📊 Completion response data:', completionData);
      
      if (!completionRes.ok) {
        const err = completionData;
        console.error('❌ Completion failed:', err);
        toast({ title: 'Failed to complete appointment', description: err.error, status: 'error' });
        return;
      }

      // If referral was requested, the backend already handled it
      if (completionForm.shouldRefer) {
        console.log('✅ Referral processed successfully');
        toast({ title: 'Appointment completed and referred successfully', status: 'success' });
        
        // Optionally, you can create a referral appointment immediately
        if (completionData.medicalReportGroupId) {
          const referralAppointmentPayload = {
            patientId: selectedAppointment.patientId,
            doctorId: completionForm.referralTarget,
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            notes: `Referral from Dr. ${selectedAppointment}. ${completionForm.referralNotes}`,
            referredFrom: selectedAppointment.id,
            medicalReportGroupId: completionData.medicalReportGroupId
          };

          console.log('🔄 Creating referral appointment:', referralAppointmentPayload);

          try {
            const referralRes = await fetch(`${API_BASE}/appointments/referral`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(referralAppointmentPayload),
            });

            if (referralRes.ok) {
              const referralData = await referralRes.json();
              console.log('✅ Referral appointment created:', referralData);
              toast({ 
                title: 'Referral appointment created successfully', 
                description: `Visit #${referralData.visitNumber} scheduled`, 
                status: 'success' 
              });
            } else {
              const err = await referralRes.json();
              console.error('❌ Referral creation failed:', err);
              toast({ 
                title: 'Referral appointment creation failed', 
                description: err.error, 
                status: 'warning' 
              });
            }
          } catch (error) {
            console.error('❌ Failed to create referral appointment:', error);
            toast({ 
              title: 'Failed to create referral appointment', 
              description: error.message, 
              status: 'warning' 
            });
          }
        }
      } else {
        console.log('✅ Appointment completed successfully');
        toast({ title: 'Appointment completed successfully', status: 'success' });
      }

      // Close modal and reset form
      setIsCompletionModalOpen(false);
      setCompletionForm({
        notes: '', 
        diagnosis: '', 
        symptoms: '', 
        treatment: '', 
        prescription: '', 
        reportFile: null,
        shouldRefer: false,
        referralDepartment: '',
        referralTarget: '',
        referralNotes: ''
      });
      setUploadProgress(0);
      setIsUploading(false);
      
      // Refresh appointments list
      fetchMyAppointments();
      
    } catch (error) {
      console.error('❌ Submission error:', error);
      toast({ 
        title: 'Failed to complete appointment', 
        description: error.message, 
        status: 'error' 
      });
    }
  };

  const submitReferral = async () => {
    // This function is now integrated into submitCompletion
    // Kept for backward compatibility but should not be used directly
    await submitCompletion();
  };

  const handleReferPatient = async () => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${selectedAppointment.id}/refer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          referredTo: completionForm.referredTo,
          notes: completionForm.referNotes
        })
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

  const handleFileUpload = async (file) => {
    console.log('🚀 Starting file upload process...');
    console.log('📤 Upload parameters:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      appointmentId: selectedAppointment?.id,
      hasToken: !!token
    });
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('appointmentId', selectedAppointment?.id);
    
    console.log('📦 FormData created:', {
      hasFile: formData.has('file'),
      hasAppointmentId: formData.has('appointmentId'),
      appointmentId: selectedAppointment?.id
    });
    
    try {
      const xhr = new XMLHttpRequest();
      const uploadUrl = `${API_BASE}/appointments/${selectedAppointment?.id}/upload-report`;
      console.log('🌐 Upload URL:', uploadUrl);
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          console.log('📈 Upload progress:', {
            loaded: e.loaded,
            total: e.total,
            progress: Math.round(progress) + '%'
          });
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        console.log('📡 Upload completed:', {
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText
        });
        
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload successful:', response);
            setCompletionForm({ ...completionForm, reportFile: response.fileUrl });
            setUploadProgress(100);
            toast({ title: 'File uploaded successfully', status: 'success' });
          } catch (parseError) {
            console.error('❌ Failed to parse response:', parseError);
            console.log('Raw response:', xhr.responseText);
            toast({ title: 'Upload response error', status: 'error' });
          }
        } else {
          console.error('❌ Upload failed with status:', xhr.status);
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.log('Error response:', errorResponse);
            toast({ 
              title: 'Upload failed', 
              description: errorResponse.message || `Status: ${xhr.status}`,
              status: 'error' 
            });
          } catch (e) {
            console.log('Raw error response:', xhr.responseText);
            toast({ 
              title: 'Upload failed', 
              description: `Status: ${xhr.status}`,
              status: 'error' 
            });
          }
        }
      });
      
      xhr.addEventListener('error', (error) => {
        console.error('❌ Network error during upload:', error);
        toast({ title: 'Upload failed', description: 'Network error', status: 'error' });
      });
      
      xhr.addEventListener('timeout', () => {
        console.error('⏰ Upload timeout');
        toast({ title: 'Upload timeout', status: 'error' });
      });
      
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      console.log('🔐 Authorization header set:', token ? 'Bearer [TOKEN]' : 'NO TOKEN');
      
      console.log('📤 Sending request...');
      xhr.send(formData);
      
    } catch (error) {
      console.error('❌ Upload setup error:', error);
      toast({ title: 'Upload error', description: error.message, status: 'error' });
    } finally {
      setTimeout(() => {
        console.log('🏁 Upload process finished');
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const resetCompletionForm = () => {
    setCompletionForm({
      notes: '', 
      diagnosis: '', 
      symptoms: '', 
      treatment: '', 
      prescription: '', 
      reportFile: null,
      shouldRefer: false,
      referralDepartment: '',
      referralTarget: '',
      referralNotes: ''
    });
  };

  const fetchAppointmentDetails = async (appointmentId) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`${API_BASE}/appointments/${appointmentId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setAppointmentDetails(data);
      } else {
        toast({ title: 'Failed to fetch appointment details', status: 'error' });
      }
    } catch (error) {
      toast({ title: 'Error fetching appointment details', status: 'error' });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        toast({ title: 'Failed to fetch users', status: 'error' });
      }
    } catch (error) {
      toast({ title: 'Error fetching users', status: 'error' });
    }
  }, [token, toast]);

  useEffect(() => {
    fetchMyAppointments();
    fetchDoctorsAndPatients();
  }, [token, user.role]);

  useEffect(() => {
    if (departments.length > 0) {
      fetchUsers();
    }
  }, [departments, fetchUsers]);

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
                onViewDetails={(apt) => handleViewDetails(apt)}
                onComplete={(apt) => handleCompleteAppointment(apt)}
                onRefer={(apt) => { setSelectedAppointment(apt); onReferOpen(); }}
              />
            </TabPanel>
            <TabPanel>
              <AppointmentList 
                appointments={appointments.filter(apt => apt.status === 'COMPLETED')}
                status="COMPLETED"
                user={user}
                onViewDetails={(apt) => handleViewDetails(apt)}
              />
            </TabPanel>
            <TabPanel>
              <AppointmentList 
                appointments={appointments.filter(apt => apt.status === 'CANCELLED')}
                status="CANCELLED"
                user={user}
                onViewDetails={(apt) => handleViewDetails(apt)}
              />
            </TabPanel>
            <TabPanel>
              <AppointmentList 
                appointments={appointments.filter(apt => apt.status === 'REFERRED')}
                status="REFERRED"
                user={user}
                onViewDetails={(apt) => handleViewDetails(apt)}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Appointment Details Modal */}
         {/* Completion Modal */}
      <Modal 
        isOpen={isCompletionModalOpen} 
        onClose={() => setIsCompletionModalOpen(false)} 
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Complete Appointment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Patient/Doctor/Date Info */}
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontSize="md" fontWeight="bold" mb={2}>Appointment Information</Text>
                <Text>
                  <strong>Patient:</strong> {selectedAppointment?.patient?.name}<br />
                  <strong>Doctor:</strong> {selectedAppointment?.doctor?.name}<br />
                  <strong>Date:</strong> {selectedAppointment ? formatDateTime(selectedAppointment.dateTime) : ''}
                </Text>
              </Box>

              
              {/* Completion Fields */}
              <Box>
                <Text fontSize="md" fontWeight="bold" mb={3}>Completion Details</Text>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Notes *</FormLabel>
                    <Textarea
                      value={completionForm.notes}
                      onChange={(e) => setCompletionForm({ ...completionForm, notes: e.target.value })}
                      placeholder="Enter completion notes"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Diagnosis *</FormLabel>
                    <Textarea
                      value={completionForm.diagnosis}
                      onChange={(e) => setCompletionForm({ ...completionForm, diagnosis: e.target.value })}
                      placeholder="Enter diagnosis"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Symptoms</FormLabel>
                    <Textarea
                      value={completionForm.symptoms}
                      onChange={(e) => setCompletionForm({ ...completionForm, symptoms: e.target.value })}
                      placeholder="Enter symptoms (optional)"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Treatment</FormLabel>
                    <Textarea
                      value={completionForm.treatment}
                      onChange={(e) => setCompletionForm({ ...completionForm, treatment: e.target.value })}
                      placeholder="Enter treatment (optional)"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Prescription</FormLabel>
                    <Textarea
                      value={completionForm.prescription}
                      onChange={(e) => setCompletionForm({ ...completionForm, prescription: e.target.value })}
                      placeholder="Enter prescription (optional)"
                    />
                  </FormControl>
                </VStack>
              </Box>

              {/* Report File Upload */}
              <Box>
                <Text fontSize="md" fontWeight="bold" mb={3}>Report File</Text>
                <VStack spacing={3} align="stretch">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      console.log('📁 File selected:', file);
                      console.log('📊 File details:', {
                        name: file?.name,
                        size: file?.size,
                        type: file?.type,
                        lastModified: file?.lastModified
                      });
                      
                      if (file) {
                        // Validate file type
                        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
                        
                        // Check file extension
                        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                        const isValidExtension = allowedExtensions.includes(fileExtension);
                        console.log('🔍 File extension validation:', {
                          extension: fileExtension,
                          isValid: isValidExtension,
                          allowed: allowedExtensions
                        });
                        
                        // Check file size (10MB = 10 * 1024 * 1024 bytes)
                        const isValidSize = file.size <= 10 * 1024 * 1024;
                        console.log('📏 File size validation:', {
                          size: file.size,
                          sizeMB: (file.size / (1024 * 1024)).toFixed(2),
                          maxSize: 10 * 1024 * 1024,
                          isValid: isValidSize
                        });
                        
                        if (!isValidExtension) {
                          console.error('❌ Invalid file format:', fileExtension);
                          toast({ 
                            title: 'Invalid file format', 
                            description: 'Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max: 10MB)', 
                            status: 'error' 
                          });
                          return;
                        }
                        
                        if (!isValidSize) {
                          console.error('❌ File too large:', file.size);
                          toast({ 
                            title: 'File too large', 
                            description: 'Maximum file size is 10MB', 
                            status: 'error' 
                          });
                          return;
                        }
                        
                        console.log('✅ File validation passed, storing in form state...');
                        // Store file directly in form state - no separate upload
                        setCompletionForm({ 
                          ...completionForm, 
                          reportFile: file 
                        });
                      } else {
                        console.log('⚠️ No file selected');
                      }
                    }}
                    isDisabled={isUploading}
                    display="none"
                    id="report-file-upload"
                  />
                  <Button
                    as="label"
                        htmlFor="report-file-upload"
                        colorScheme="blue"
                        variant="outline"
                        cursor="pointer"
                        isDisabled={isUploading}
                        isLoading={isUploading}
                      >
                        {isUploading ? 'Uploading...' : 'Choose File'}
                      </Button>
                      
                      {isUploading && (
                        <Box>
                          <Text fontSize="sm" mb={2}>Upload Progress: {Math.round(uploadProgress)}%</Text>
                          <Progress value={uploadProgress} size="sm" colorScheme="blue" />
                        </Box>
                      )}
                      
                      {completionForm.reportFile && (
                        <Box p={3} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm" color="green.800" fontWeight="medium">
                                  ✓ File uploaded successfully
                                </Text>
                                {typeof completionForm.reportFile === 'string' ? (
                                  <Text fontSize="xs" color="gray.600">
                                    {completionForm.reportFile.split('/').pop()} {/* Extract filename from URL */}
                                  </Text>
                                ) : (
                                  <Text fontSize="xs" color="gray.600">
                                    {completionForm.reportFile?.name || 'Uploaded file'}
                                  </Text>
                                )}
                              </VStack>
                              <Button
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => {
                                  setCompletionForm({ ...completionForm, reportFile: null });
                                  setUploadProgress(0);
                                }}
                              >
                                Remove
                              </Button>
                            </HStack>
                            {typeof completionForm.reportFile === 'string' && (
                              <Button
                                size="xs"
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => {
                                  // Open file in new tab
                                  window.open(`${API_BASE}${completionForm.reportFile}`, '_blank');
                                }}
                              >
                                View File
                              </Button>
                            )}
                            {typeof completionForm.reportFile !== 'string' && completionForm.reportFile && (
                              <Button
                                size="xs"
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => {
                                  // Create object URL for viewing
                                  const fileUrl = URL.createObjectURL(completionForm.reportFile);
                                  window.open(fileUrl, '_blank');
                                }}
                              >
                                View File
                              </Button>
                            )}
                          </VStack>
                        </Box>
                      )}
                      
                      <Text fontSize="xs" color="gray.500">
                        Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max: 10MB)
                      </Text>
                    </VStack>
              </Box>
              {/* Action Selection */}
              <Box>
                <Text fontSize="md" fontWeight="bold" mb={3}>Action Selection</Text>
                <HStack spacing={4}>
                  <Button 
                    colorScheme={completionForm.shouldRefer ? "gray" : "green"}
                    variant={completionForm.shouldRefer ? "outline" : "solid"}
                    onClick={() => setCompletionForm({ ...completionForm, shouldRefer: false })}
                  >
                    Complete Only
                  </Button>
                  <Button 
                    colorScheme={completionForm.shouldRefer ? "purple" : "gray"}
                    variant={completionForm.shouldRefer ? "solid" : "outline"}
                    onClick={async () => {
                      setCompletionForm({ ...completionForm, shouldRefer: true });
                      await fetchDepartments();
                    }}
                  >
                    Complete & Refer
                  </Button>
                </HStack>
              </Box>


              {/* Divider */}
              <Box border="1px solid" borderColor="gray.200" />

              {/* Referral Fields */}
              {completionForm.shouldRefer && (
              <Box>
                <Text fontSize="md" fontWeight="bold" mb={3}>Referral Information</Text>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Department *</FormLabel>
                    <Select
                      value={completionForm.referralDepartment}
                      onChange={(e) => setCompletionForm({ ...completionForm, referralDepartment: e.target.value, referralTarget: '' })}
                      placeholder="Select department"
                      isDisabled={!completionForm.shouldRefer}
                      bg={!completionForm.shouldRefer ? "gray.100" : "white"}
                    >
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} (ID: {dept.id})
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Referral Target *</FormLabel>
                    <Select
                      value={completionForm.referralTarget}
                      onChange={(e) => setCompletionForm({ ...completionForm, referralTarget: e.target.value })}
                      placeholder="Select employee"
                      isDisabled={!completionForm.shouldRefer || !completionForm.referralDepartment}
                      bg={!completionForm.shouldRefer || !completionForm.referralDepartment ? "gray.100" : "white"}
                    >
                      {/* Show users from the selected department */}
                      {completionForm.referralDepartment && (() => {
                        console.log('Selected department ID:', completionForm.referralDepartment);
                        console.log('Departments data:', departments);
                        
                        const selectedDepartment = departments.find(dept => dept.id === completionForm.referralDepartment);
                        console.log('Selected department object:', selectedDepartment);
                        
                        const departmentUsers = selectedDepartment?.users || [];
                        console.log('Department users:', departmentUsers);
                        
                        return departmentUsers;
                      })().map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                      
                      {/* Fallback: Show all users if no department users found */}
                      {completionForm.referralDepartment && (() => {
                        const selectedDepartment = departments.find(dept => dept.id === completionForm.referralDepartment);
                        const departmentUsers = selectedDepartment?.users || [];
                        
                        if (departmentUsers.length === 0) {
                          console.log('No users found in department, showing all users as fallback');
                          return users;
                        }
                        return [];
                      })().map(user => (
                        <option key={user.id} value={user.id}>{user.name} (All Users)</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Referral Notes *</FormLabel>
                    <Textarea
                      value={completionForm.referralNotes}
                      onChange={(e) => setCompletionForm({ ...completionForm, referralNotes: e.target.value })}
                      placeholder="Enter referral notes"
                      isDisabled={!completionForm.shouldRefer}
                      bg={!completionForm.shouldRefer ? "gray.100" : "white"}
                    />
                  </FormControl>
                </VStack>
              </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={() => setIsCompletionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              colorScheme={completionForm.shouldRefer ? "purple" : "green"} 
              onClick={completionForm.shouldRefer ? submitReferral : submitCompletion}
              isDisabled={!completionForm.notes || !completionForm.diagnosis || (completionForm.shouldRefer && (!completionForm.referralTarget || !completionForm.referralNotes)) || isUploading}
            >
              {completionForm.shouldRefer ? 'Refer Appointment' : 'Complete Appointment'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Details Modal */}
      <Modal 
        isOpen={isViewDetailsModalOpen} 
        onClose={() => setIsViewDetailsModalOpen(false)}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>Complete Appointment Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="600px" overflowY="auto">
            {isLoadingDetails ? (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" />
                <Text mt={4}>Loading appointment details...</Text>
              </Box>
            ) : appointmentDetails ? (
              <VStack spacing={4} align="stretch">
                {/* Patient Information */}
                <Box p={4} bg="gray.50" borderRadius="md">
                  <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.600">Patient Information</Text>
                  <VStack spacing={2} align="start">
                    <HStack>
                      <Text fontWeight="600" w="120px">Name:</Text>
                      <Text>{appointmentDetails.patient?.name || 'N/A'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="120px">Email:</Text>
                      <Text>{appointmentDetails.patient?.email || 'N/A'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="120px">Phone:</Text>
                      <Text>{appointmentDetails.patient?.phone || 'N/A'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="120px">Age:</Text>
                      <Text>{appointmentDetails.patient?.age || 'N/A'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="120px">Gender:</Text>
                      <Text>{appointmentDetails.patient?.gender || 'N/A'}</Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* Doctor Information */}
                <Box p={4} bg="blue.50" borderRadius="md">
                  <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.600">Doctor Information</Text>
                  <VStack spacing={2} align="start">
                    <HStack>
                      <Text fontWeight="600" w="120px">Name:</Text>
                      <Text>{appointmentDetails.doctor?.name || 'N/A'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="120px">Email:</Text>
                      <Text>{appointmentDetails.doctor?.email || 'N/A'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="120px">Department:</Text>
                      <Text>{appointmentDetails.doctor?.department?.name || 'N/A'}</Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* Appointment Details */}
                <Box p={4} bg="green.50" borderRadius="md">
                  <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.600">Appointment Details</Text>
                  <VStack spacing={2} align="start">
                    <HStack>
                      <Text fontWeight="600" w="120px">Date & Time:</Text>
                      <Text>{appointmentDetails.dateTime ? new Date(appointmentDetails.dateTime).toLocaleString() : 'N/A'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="120px">Status:</Text>
                      <Badge colorScheme={
                        appointmentDetails.status === 'COMPLETED' ? 'green' :
                        appointmentDetails.status === 'SCHEDULED' ? 'blue' :
                        appointmentDetails.status === 'CANCELLED' ? 'red' :
                        appointmentDetails.status === 'REFERRED' ? 'purple' :
                        'yellow'
                      }>
                        {appointmentDetails.status}
                      </Badge>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="120px">Visit Number:</Text>
                      <Text>Visit #{appointmentDetails.visitNumber || 1}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="120px">Notes:</Text>
                      <Text>{appointmentDetails.notes || 'No notes'}</Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* Referral Information */}
                {(appointmentDetails.referredTo || appointmentDetails.referredFrom) && (
                  <Box p={4} bg="purple.50" borderRadius="md">
                    <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.600">Referral Information</Text>
                    <VStack spacing={3} align="start">
                      {appointmentDetails.referredTo && (
                        <Box>
                          <Text fontWeight="600" mb={2}>Referred To:</Text>
                          {appointmentDetails.referredToDoctor ? (
                            <VStack spacing={1} align="start" ml={4}>
                              <Text>Dr. {appointmentDetails.referredToDoctor.name}</Text>
                              <Text fontSize="sm" color="gray.600">{appointmentDetails.referredToDoctor.department?.name || 'Department N/A'}</Text>
                              <Text fontSize="sm" color="gray.600">{appointmentDetails.referredToDoctor.email}</Text>
                            </VStack>
                          ) : (
                            <Text ml={4}>{appointmentDetails.referredTo}</Text>
                          )}
                        </Box>
                      )}
                      
                      {appointmentDetails.referredFrom && (
                        <Box>
                          <Text fontWeight="600" mb={2}>Referred From:</Text>
                          <Text ml={4}>{appointmentDetails.referredFrom}</Text>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Medical Report Details */}
                {appointmentDetails.reports && appointmentDetails.reports.length > 0 && (
                  <Box p={4} bg="purple.50" borderRadius="md">
                    <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.600">Medical Report Details</Text>
                    <VStack spacing={3} align="start">
                      {appointmentDetails.reports.map((report) => (
                        <Box key={report.id} p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                          <VStack spacing={2} align="start">
                            <HStack>
                              <Text fontWeight="500" w="100px">Diagnosis:</Text>
                              <Text>{report.diagnosis || 'N/A'}</Text>
                            </HStack>
                            <HStack>
                              <Text fontWeight="500" w="100px">Symptoms:</Text>
                              <Text>{report.symptoms || 'N/A'}</Text>
                            </HStack>
                            <HStack>
                              <Text fontWeight="500" w="100px">Treatment:</Text>
                              <Text>{report.treatment || 'N/A'}</Text>
                            </HStack>
                            <HStack>
                              <Text fontWeight="500" w="100px">Prescription:</Text>
                              <Text>{report.prescription || 'N/A'}</Text>
                            </HStack>
                            <HStack>
                              <Text fontWeight="500" w="100px">Notes:</Text>
                              <Text>{report.notes || 'N/A'}</Text>
                            </HStack>
                            {report.reportUrl && (
                              <HStack>
                                <Text fontWeight="500" w="100px">Report File:</Text>
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={() => {
                                    window.open(`${BASE}${report.reportUrl}`, '_blank');
                                  }}
                                >
                                  View Report
                                </Button>
                              </HStack>
                            )}
                            {report.isReferred && (
                              <Box mt={2} p={2} bg="purple.100" borderRadius="md">
                                <Text fontWeight="500" mb={2}>Referral Details:</Text>
                                <VStack spacing={1} align="start">
                                  <HStack>
                                    <Text fontWeight="500" w="120px">Referred:</Text>
                                    <Badge colorScheme="purple">Yes</Badge>
                                  </HStack>
                                  <HStack>
                                    <Text fontWeight="500" w="120px">Referral Target:</Text>
                                    <Text>{report.referredTo || 'N/A'}</Text>
                                  </HStack>
                                  <HStack>
                                    <Text fontWeight="500" w="120px">Referral Notes:</Text>
                                    <Text>{report.referralNotes || 'N/A'}</Text>
                                  </HStack>
                                </VStack>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Medical Report Group */}
                {appointmentDetails.medicalReportGroup && (
                  <Box p={4} bg="orange.50" borderRadius="md">
                    <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.600">Medical Report Group</Text>
                    <VStack spacing={2} align="start">
                      <HStack>
                        <Text fontWeight="600" w="120px">Group Title:</Text>
                        <Text>{appointmentDetails.medicalReportGroup.title || 'Untitled Group'}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="600" w="120px">Description:</Text>
                        <Text>{appointmentDetails.medicalReportGroup.description || 'No description'}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="600" w="120px">Status:</Text>
                        <Badge colorScheme={
                          appointmentDetails.medicalReportGroup.status === 'ACTIVE' ? 'blue' :
                          appointmentDetails.medicalReportGroup.status === 'COMPLETED' ? 'green' :
                          'gray'
                        }>
                          {appointmentDetails.medicalReportGroup.status}
                        </Badge>
                      </HStack>
                      <HStack>
                        <Text fontWeight="600" w="120px">Started:</Text>
                        <Text>{new Date(appointmentDetails.medicalReportGroup.startDate).toLocaleDateString()}</Text>
                      </HStack>
                    </VStack>
                  </Box>
                )}

                {/* All Reports in Visit Cycle */}
                {appointmentDetails.allReportsInGroup && appointmentDetails.allReportsInGroup.length > 0 && (
                  <Box p={4} bg="teal.50" borderRadius="md">
                    <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.600">Complete Visit Cycle - All Reports</Text>
                    <VStack spacing={3} align="stretch">
                      {appointmentDetails.allReportsInGroup.map((report) => (
                        <Box key={report.id} p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                          <HStack justify="space-between" mb={2}>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="500">Visit #{report.appointment?.visitNumber}</Text>
                              <Text fontSize="sm" color="gray.600">
                                Dr. {report.doctor?.name} - {new Date(report.createdAt).toLocaleDateString()}
                              </Text>
                            </VStack>
                            <Badge colorScheme={report.appointment?.status === 'COMPLETED' ? 'green' : 'blue'}>
                              {report.appointment?.status}
                            </Badge>
                          </HStack>
                          <VStack spacing={1} align="start">
                            <Text fontSize="sm"><strong>Diagnosis:</strong> {report.diagnosis || 'N/A'}</Text>
                            <Text fontSize="sm"><strong>Treatment:</strong> {report.treatment || 'N/A'}</Text>
                            <Text fontSize="sm"><strong>Notes:</strong> {report.notes || 'N/A'}</Text>
                            {report.isReferred && (
                              <Text fontSize="sm" color="purple.600">
                                <strong>Referred to:</strong> {report.referredTo || 'N/A'}
                              </Text>
                            )}
                            {report.reportUrl && (
                              <Button
                                size="xs"
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => {
                                  window.open(`${BASE}${report.reportUrl}`, '_blank');
                                }}
                                mt={2}
                              >
                                View Report File
                              </Button>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Timestamps */}
                <Box p={4} bg="gray.100" borderRadius="md">
                  <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.600">Timestamps</Text>
                  <VStack spacing={2} align="start">
                    <HStack>
                      <Text fontWeight="600" w="120px">Created:</Text>
                      <Text>{appointmentDetails.createdAt ? new Date(appointmentDetails.createdAt).toLocaleString() : 'N/A'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="120px">Updated:</Text>
                      <Text>{appointmentDetails.updatedAt ? new Date(appointmentDetails.updatedAt).toLocaleString() : 'N/A'}</Text>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            ) : (
              <Box textAlign="center" py={8}>
                <Text>No appointment details available</Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={() => setIsViewDetailsModalOpen(false)}>
              Close
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
    <VStack spacing={4}>
      {appointments.map((appointment) => (
        <Card key={appointment.id} mb={4}>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold" fontSize="lg">
                  Visit #{appointment.visitNumber || 1}
                </Text>
                <Badge colorScheme={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
              </HStack>
              
              <HStack justify="space-between" mb={2}>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="600">Patient:</Text>
                  <Text>{appointment.patient?.name || 'N/A'}</Text>
                </VStack>
                <Text fontSize="sm" color="gray.600">
                  {formatDate(appointment.dateTime)}
                </Text>
              </HStack>

              <HStack justify="space-between">
                <Text fontWeight="600">Doctor:</Text>
                <Text>{appointment.doctor?.name || 'N/A'}</Text>
              </HStack>

              {appointment.notes && (
                <Text fontSize="sm" color="gray.600" mt={2}>
                  <strong>Notes:</strong> {appointment.notes}
                </Text>
              )}
            </VStack>

            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<ViewIcon />}
                onClick={() => onViewDetails(appointment)}
              >
                View Details
              </Button>
              
              { status === 'SCHEDULED' && (
                <>
    
                  <Button 
                    colorScheme="purple"
                    variant="outline"
                    onClick={() => {
                      // Use the onComplete prop which should handle the completion modal
                      onComplete(appointment);
                    }}
                  >
                    Complete & Refer
                  </Button>
                </>
              )}
            </HStack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );
}

export default MyAppointments;

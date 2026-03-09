import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Grid,
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
  Badge,
  VStack,
  HStack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Progress,
} from '@chakra-ui/react';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE = 'http://localhost:8002/api';

export default function AppointmentsAdmin() {
  const { token, user } = useAuth();
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Super admin filtering states
  const [allDoctors, setAllDoctors] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');

  const [patientForm, setPatientForm] = useState({ name: '', email: '', phone: '', address: '', age: '', gender: '' });
  const [appointmentForm, setAppointmentForm] = useState({ patientId: '', doctorId: '', selectedDate: '', dateTime: '', notes: '' });

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Form states for modals
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'CASH', patientId: '', description: '' });
  const [completionForm, setCompletionForm] = useState({ 
    notes: '', 
    diagnosis: '', 
    symptoms: '', 
    treatment: '', 
    prescription: '', 
    reportFile: null,
    shouldRefer: false,
    referralTarget: '',
    referralNotes: ''
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [referralForm, setReferralForm] = useState({ referredTo: '', notes: '' });
  const [refundForm, setRefundForm] = useState({ reason: '', amount: '' });
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Transaction states
  const [transactions, setTransactions] = useState([]);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionFilters, setTransactionFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    patientId: '',
    paymentMethod: ''
  });
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [transactionStats, setTransactionStats] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: transactionPage.toString(),
        limit: '10',
        ...(transactionFilters.status && { status: transactionFilters.status }),
        ...(transactionFilters.startDate && { startDate: transactionFilters.startDate }),
        ...(transactionFilters.endDate && { endDate: transactionFilters.endDate }),
        ...(transactionFilters.patientId && { patientId: transactionFilters.patientId }),
        ...(transactionFilters.paymentMethod && { paymentMethod: transactionFilters.paymentMethod })
      });
      
      const res = await fetch(`${API_BASE}/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || data);
      } else {
        toast({ title: 'Error fetching transactions', status: 'error' });
      }
    } catch (error) {
      toast({ title: 'Error fetching transactions', status: 'error' });
    }
  }, [token, transactionPage, transactionFilters, toast]);

  const fetchTransactionStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/transactions/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTransactionStats(data);
      } else {
        toast({ title: 'Error fetching transaction stats', status: 'error' });
      }
    } catch (error) {
      toast({ title: 'Error fetching transaction stats', status: 'error' });
    }
  }, [token, toast]);

  const processRefund = async () => {
    if (!selectedTransaction || !refundForm.reason || !refundForm.amount) {
      toast({ title: 'Please fill all required fields', status: 'warning' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/transactions/${selectedTransaction.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(refundForm.amount),
          reason: refundForm.reason
        })
      });
      
      if (res.ok) {
        toast({ title: 'Refund processed successfully', status: 'success' });
        setIsRefundModalOpen(false);
        setRefundForm({ reason: '', amount: '' });
        setSelectedTransaction(null);
        fetchTransactions();
      } else {
        const error = await res.json();
        toast({ title: 'Error processing refund', description: error.message, status: 'error' });
      }
    } catch (error) {
      toast({ title: 'Error processing refund', status: 'error' });
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) {
      toast({ title: 'Please select a file', status: 'warning' });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File size must be less than 10MB', status: 'error' });
      return;
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Only PDF, JPG, PNG, and Word documents are allowed', status: 'error' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('appointmentId', selectedAppointment.id);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setCompletionForm({ ...completionForm, reportFile: response.fileUrl });
          toast({ title: 'File uploaded successfully', status: 'success' });
        } else {
          toast({ title: 'File upload failed', status: 'error' });
        }
        setIsUploading(false);
        setUploadProgress(0);
      });

      // Handle error
      xhr.addEventListener('error', () => {
        toast({ title: 'File upload failed', status: 'error' });
        setIsUploading(false);
        setUploadProgress(0);
      });

      // Send request
      xhr.open('POST', `${API_BASE}/admin/upload-report`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      toast({ title: 'File upload failed', status: 'error' });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/patients`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setPatients(data);
      else toast({ title: 'Failed to fetch patients', status: 'error' });
    } catch (err) {
      toast({ title: 'Error fetching patients', status: 'error' });
    }
  }, [token, toast]);

  const fetchAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (user.role === 'SUPER_ADMIN') {
        if (selectedDoctor) params.append('doctorId', selectedDoctor);
        if (selectedPatient) params.append('patientId', selectedPatient);
      }
      
      const res = await fetch(`${API_BASE}/admin/appointments?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setAppointments(data);
      else toast({ title: 'Failed to fetch appointments', status: 'error' });
    } catch (err) {
      toast({ title: 'Error fetching appointments', status: 'error' });
    }
  }, [token, toast, user.role, selectedDoctor, selectedPatient]);

  const fetchDoctorsAndPatients = useCallback(async () => {
    if (user.role !== 'SUPER_ADMIN') return;
    
    try {
      const [doctorsRes, patientsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/patients`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const doctorsData = await doctorsRes.json();
      const patientsData = await patientsRes.json();
      
      if (doctorsRes.ok) setAllDoctors(doctorsData.users || []);
      if (patientsRes.ok) setAllPatients(patientsData);
    } catch (err) {
      toast({ title: 'Error fetching data for filters', status: 'error' });
    }
  }, [token, toast, user.role]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setDoctors(data.users || []);
      else toast({ title: 'Failed to fetch doctors', status: 'error' });
    } catch (err) {
      toast({ title: 'Error fetching doctors', status: 'error' });
    }
  }, [token, toast]);

  const fetchAvailableSlots = useCallback(async (doctorId, date) => {
    if (!doctorId || !date) {
      setAvailableSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    try {
      const res = await fetch(`${API_BASE}/doctors/${doctorId}/availability?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        console.log('Available slots received:', data.availableSlots);
        // Filter out past slots on client side
        const filteredSlots = data.availableSlots.filter(slot => new Date(slot.startTime) > new Date());
        console.log('Filtered slots:', filteredSlots);
        setAvailableSlots(filteredSlots);
      } else {
        setAvailableSlots([]);
        toast({ title: 'Failed to fetch availability', status: 'error' });
      }
    } catch (err) {
      setAvailableSlots([]);
      toast({ title: 'Error fetching availability', status: 'error' });
    } finally {
      setIsLoadingSlots(false);
    }
  }, [token, toast]);

  const handleCreatePatient = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...patientForm, age: patientForm.age ? Number(patientForm.age) : null }),
      });
      if (res.ok) {
        toast({ title: 'Patient created successfully', status: 'success' });
        setPatientForm({ name: '', email: '', phone: '', address: '', age: '', gender: '' });
        fetchPatients();
      } else {
        const err = await res.json();
        toast({ title: 'Failed to create patient', description: err.error, status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error creating patient', status: 'error' });
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(appointmentForm),
      });
      if (res.ok) {
        toast({ title: 'Appointment scheduled successfully', status: 'success' });
        setAppointmentForm({ patientId: '', doctorId: '', selectedDate: '', dateTime: '', notes: '' });
        fetchAppointments();
      } else {
        const err = await res.json();
        toast({ title: 'Failed to schedule appointment', description: err.error, status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error scheduling appointment', status: 'error' });
    }
  };

  const handleProcessPayment = (appointment) => {
    setSelectedAppointment(appointment);
    setPaymentForm({ amount: '', paymentMethod: 'CASH', patientId: '', description: '' });
    setIsPaymentModalOpen(true);
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
      referralTarget: '',
      referralNotes: ''
    });
    setUploadProgress(0);
    setIsUploading(false);
    setIsCompletionModalOpen(true);
  };

  const handleReferAppointment = async (appointment) => {
    setSelectedAppointment(appointment);
    setReferralForm({ referredTo: '', notes: '' });
    setIsReferralModalOpen(true);
  };

  const handleViewDetails = (appointment) => {
    toast({ 
      title: 'Appointment Details', 
      description: `Patient: ${appointment.patient?.name}, Doctor: ${appointment.doctor?.name}, Status: ${appointment.status}`,
      status: 'info' 
    });
  };

  const submitPayment = async () => {
    if (!paymentForm.amount || !paymentForm.paymentMethod || (!selectedAppointment && !paymentForm.patientId)) {
      toast({ title: 'Payment amount, method, and patient are required', status: 'error' });
      return;
    }

    try {
      let url, payload;
      
      if (selectedAppointment) {
        // Payment for existing appointment
        url = `${API_BASE}/appointments/${selectedAppointment.id}/payment`;
        payload = { 
          amount: parseFloat(paymentForm.amount), 
          paymentMethod: paymentForm.paymentMethod 
        };
      } else {
        // Standalone transaction
        url = `${API_BASE}/admin/transactions`;
        payload = {
          patientId: paymentForm.patientId,
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          description: paymentForm.description
        };
      }
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        toast({ title: selectedAppointment ? 'Payment processed successfully' : 'Transaction created successfully', status: 'success' });
        setIsPaymentModalOpen(false);
        setIsTransactionModalOpen(false);
        setPaymentForm({ amount: '', paymentMethod: 'CASH', patientId: '', description: '' });
        setSelectedAppointment(null);
        fetchAppointments();
        fetchTransactions();
      } else {
        const err = await res.json();
        toast({ title: 'Failed to process payment', description: err.error, status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error processing payment', status: 'error' });
    }
  };

  const submitCompletion = async () => {
    if (!completionForm.notes || !completionForm.diagnosis || !completionForm.reportFile) {
      toast({ title: 'Notes, diagnosis, and report file are required', status: 'error' });
      return;
    }

    try {
      // First complete the appointment
      const completionPayload = {
        notes: completionForm.notes,
        diagnosis: completionForm.diagnosis,
        symptoms: completionForm.symptoms,
        treatment: completionForm.treatment,
        prescription: completionForm.prescription,
        reportUrl: completionForm.reportFile
      };

      const completionRes = await fetch(`${API_BASE}/appointments/${selectedAppointment.id}/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(completionPayload),
      });
      
      if (!completionRes.ok) {
        const err = await completionRes.json();
        toast({ title: 'Failed to complete appointment', description: err.error, status: 'error' });
        return;
      }

      // If referral is also requested, process the referral
      if (completionForm.shouldRefer) {
        if (!completionForm.referralTarget || !completionForm.referralNotes) {
          toast({ title: 'Referral target and notes are required when referring', status: 'error' });
          return;
        }

        const referralPayload = {
          referredTo: completionForm.referralTarget,
          notes: completionForm.referralNotes
        };

        const referralRes = await fetch(`${API_BASE}/appointments/${selectedAppointment.id}/refer`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(referralPayload),
        });
        
        if (referralRes.ok) {
          toast({ title: 'Appointment completed and referred successfully', status: 'success' });
        } else {
          const err = await referralRes.json();
          toast({ title: 'Appointment completed but referral failed', description: err.error, status: 'warning' });
        }
      } else {
        toast({ title: 'Appointment completed successfully', status: 'success' });
      }

      setIsCompletionModalOpen(false);
      // Reset form
      setCompletionForm({ 
        notes: '', 
        diagnosis: '', 
        symptoms: '', 
        treatment: '', 
        prescription: '', 
        reportFile: null,
        shouldRefer: false,
        referralTarget: '',
        referralNotes: ''
      });
      setUploadProgress(0);
      setIsUploading(false);
      fetchAppointments();
    } catch (err) {
      toast({ title: 'Error completing appointment', status: 'error' });
    }
  };

  const submitReferral = async () => {
    // This function is now integrated into submitCompletion
    // Kept for backward compatibility but should not be used directly
    await submitCompletion();
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchAppointments();
    fetchTransactions();
    if (user.role === 'SUPER_ADMIN') {
      fetchDoctorsAndPatients();
    }
  }, [fetchPatients, fetchDoctors, fetchAppointments, fetchTransactions, fetchDoctorsAndPatients, user.role]);

  useEffect(() => {
    if (transactionPage > 1) {
      fetchTransactions();
    }
  }, [transactionPage, fetchTransactions]);

  useEffect(() => {
    if (appointmentForm.doctorId && appointmentForm.selectedDate) {
      // Ensure the date is in YYYY-MM-DD format for the API
      const dateForApi = new Date(appointmentForm.selectedDate).toISOString().split('T')[0];
      fetchAvailableSlots(appointmentForm.doctorId, dateForApi);
    }
  }, [appointmentForm.doctorId, appointmentForm.selectedDate, fetchAvailableSlots]);

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };


  return (
    <Box pt={{ base: '130px', md: '80px' }} px={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Appointment Management</Heading>

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
                    {allDoctors.map((doctor) => (
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
                    {allPatients.map((patient) => (
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

        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          {/* Patient Creation Card */}
          <Card>
            <CardHeader>
              <Heading size="md">Create Patient</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    value={patientForm.name}
                    onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                    placeholder="Enter patient name"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Address</FormLabel>
                  <Input
                    value={patientForm.address}
                    onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </FormControl>
                <HStack spacing={4} width="100%">
                  <FormControl>
                    <FormLabel>Age</FormLabel>
                    <Input
                      type="number"
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                      placeholder="Enter age"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                      placeholder="Select gender"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </Select>
                  </FormControl>
                </HStack>
                <Button colorScheme="blue" onClick={handleCreatePatient} width="100%">
                  Create Patient
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {/* Appointment Creation Card */}
          <Card>
            <CardHeader>
              <Heading size="md">Schedule Appointment</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    value={appointmentForm.patientId}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
                    placeholder="Select patient"
                  >
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Doctor</FormLabel>
                  <Select
                    value={appointmentForm.doctorId}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}
                    placeholder="Select doctor"
                  >
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={appointmentForm.selectedDate}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, selectedDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Time Slot</FormLabel>
                  <Select
                    value={appointmentForm.dateTime}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, dateTime: e.target.value })}
                    placeholder="Select time slot"
                    isDisabled={!appointmentForm.doctorId || !appointmentForm.selectedDate || isLoadingSlots}
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot.id} value={slot.startTime}>
                        {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                    placeholder="Enter appointment notes"
                  />
                </FormControl>
                <Button colorScheme="green" onClick={handleCreateAppointment} width="100%">
                  Schedule Appointment
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        <Card>
          <CardHeader>
            <Heading size="md">Appointments</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date & Time</Th>
                  <Th>Patient</Th>
                  <Th>Doctor</Th>
                  <Th>Status</Th>
                  <Th>Notes</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {appointments.map((appt) => (
                  <Tr key={appt.id}>
                    <Td>{formatDateTime(appt.dateTime)}</Td>
                    <Td>{appt.patient?.name}</Td>
                    <Td>{appt.doctor?.name}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          appt.status === 'COMPLETED' ? 'green' : 
                          appt.status === 'CANCELLED' ? 'red' : 
                          appt.status === 'PENDING_PAYMENT' ? 'yellow' : 
                          appt.status === 'REFERRED' ? 'purple' : 'blue'
                        }
                      >
                        {appt.status === 'PENDING_PAYMENT' ? 'Pending Payment' : 
                         appt.status === 'SCHEDULED' ? 'Scheduled' :
                         appt.status === 'COMPLETED' ? 'Completed' :
                         appt.status === 'CANCELLED' ? 'Cancelled' :
                         appt.status === 'REFERRED' ? 'Referred' : appt.status}
                      </Badge>
                    </Td>
                    <Td>{appt.notes || '-'}</Td>
                    <Td>
                      <HStack spacing={2}>
                        {appt.status === 'PENDING_PAYMENT' && (
                          <Button 
                            size="sm" 
                            colorScheme="yellow" 
                            onClick={() => handleProcessPayment(appt)}
                          >
                            Process Payment
                          </Button>
                        )}
                        {appt.status === 'SCHEDULED' && (
                          <Button 
                            size="sm" 
                            colorScheme="green" 
                            onClick={() => handleCompleteAppointment(appt)}
                          >
                            Complete
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          colorScheme="purple" 
                          onClick={() => handleReferAppointment(appt)}
                        >
                          Refer
                        </Button>
                        <Button 
                          size="sm" 
                          colorScheme="blue" 
                          onClick={() => handleViewDetails(appt)}
                        >
                          View
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Transaction Section */}
        <Card>
          <CardHeader>
            <Heading size="md">Transactions</Heading>
            <HStack spacing={4}>
              <Button 
                colorScheme="blue" 
                onClick={() => {
                  fetchTransactionStats();
                  setIsStatsModalOpen(true);
                }}
              >
                View Stats
              </Button>
              <Button 
                colorScheme="green" 
                onClick={() => setIsTransactionModalOpen(true)}
              >
                Create Transaction
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            {/* Transaction Filters */}
            <VStack spacing={4} mb={6}>
              <HStack spacing={4} wrap="wrap">
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={transactionFilters.status}
                    onChange={(e) => setTransactionFilters({ ...transactionFilters, status: e.target.value })}
                    placeholder="Filter by status"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="REFUNDED">Refunded</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    value={transactionFilters.paymentMethod}
                    onChange={(e) => setTransactionFilters({ ...transactionFilters, paymentMethod: e.target.value })}
                    placeholder="Filter by payment method"
                  >
                    <option value="">All Methods</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="ONLINE">Online</option>
                    <option value="INSURANCE">Insurance</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    value={transactionFilters.startDate}
                    onChange={(e) => setTransactionFilters({ ...transactionFilters, startDate: e.target.value })}
                    placeholder="Start date"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    type="date"
                    value={transactionFilters.endDate}
                    onChange={(e) => setTransactionFilters({ ...transactionFilters, endDate: e.target.value })}
                    placeholder="End date"
                  />
                </FormControl>
              </HStack>
              
              <Button 
                colorScheme="blue" 
                onClick={fetchTransactions}
              >
                Apply Filters
              </Button>
            </VStack>

            {/* Transactions Table */}
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Patient</Th>
                  <Th>Amount</Th>
                  <Th>Method</Th>
                  <Th>Status</Th>
                  <Th>Description</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((transaction) => (
                  <Tr key={transaction.id}>
                    <Td>{new Date(transaction.createdAt).toLocaleDateString()}</Td>
                    <Td>{transaction.patient?.name}</Td>
                    <Td>${transaction.amount.toFixed(2)}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          transaction.paymentMethod === 'CASH' ? 'green' : 
                          transaction.paymentMethod === 'CARD' ? 'blue' : 
                          transaction.paymentMethod === 'ONLINE' ? 'purple' : 'orange'
                        }
                      >
                        {transaction.paymentMethod}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          transaction.status === 'PAID' ? 'green' : 
                          transaction.status === 'PENDING' ? 'yellow' : 
                          transaction.status === 'REFUNDED' ? 'red' : 'gray'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </Td>
                    <Td>{transaction.description}</Td>
                    <Td>
                      <HStack spacing={2}>
                        {transaction.status === 'PAID' && (
                          <Button 
                            size="sm" 
                            colorScheme="red" 
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setRefundForm({ reason: '', amount: transaction.amount });
                              setIsRefundModalOpen(true);
                            }}
                          >
                            Refund
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          colorScheme="blue" 
                          onClick={() => {
                            setSelectedTransaction(transaction);
                          }}
                        >
                          View
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {/* Pagination */}
            {transactions.length > 0 && (
              <HStack justify="space-between" mt={4}>
                <Text>
                  Page {transactionPage} of {Math.ceil(transactions.length / 10)}
                </Text>
                <HStack spacing={2}>
                  <Button 
                    size="sm" 
                    onClick={() => setTransactionPage(Math.max(1, transactionPage - 1))}
                    isDisabled={transactionPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setTransactionPage(transactionPage + 1)}
                    isDisabled={transactions.length < 10}
                  >
                    Next
                  </Button>
                </HStack>
              </HStack>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Transaction Modals */}
      {/* Transaction Stats Modal */}
      <Modal 
        isOpen={isStatsModalOpen} 
        onClose={() => setIsStatsModalOpen(false)}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction Statistics</ModalHeader>
          <ModalBody>
            {transactionStats && (
              <VStack spacing={6}>
                <Box p={4} bg="gray.50" borderRadius="md">
                  <Heading size="sm" mb={4}>Summary</Heading>
                  <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                    <Box>
                      <Text fontWeight="bold">Total Transactions</Text>
                      <Text fontSize="2xl">{transactionStats.summary.totalTransactions}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Total Revenue</Text>
                      <Text fontSize="2xl" color="green.600">${transactionStats.summary.totalRevenue.toFixed(2)}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Average Value</Text>
                      <Text fontSize="2xl">${transactionStats.summary.averageTransactionValue.toFixed(2)}</Text>
                    </Box>
                  </Grid>
                </Box>

                <Box p={4} bg="blue.50" borderRadius="md">
                  <Heading size="sm" mb={4}>Status Breakdown</Heading>
                  <VStack spacing={3} align="stretch">
                    {transactionStats.statusBreakdown.map((status) => (
                      <Box key={status.status} p={3} bg="white" borderRadius="md">
                        <HStack justify="space-between">
                          <Text fontWeight="bold">{status.status}</Text>
                          <Badge colorScheme={
                            status.status === 'PAID' ? 'green' : 
                            status.status === 'PENDING' ? 'yellow' : 
                            status.status === 'REFUNDED' ? 'red' : 'gray'
                          }>
                            {status._count.status} transactions
                          </Badge>
                        </HStack>
                        <Text>${status._sum.amount?.toFixed(2) || '0.00'}</Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>

                <Box p={4} bg="purple.50" borderRadius="md">
                  <Heading size="sm" mb={4}>Payment Methods</Heading>
                  <VStack spacing={3} align="stretch">
                    {transactionStats.paymentMethodBreakdown.map((method) => (
                      <Box key={method.paymentMethod} p={3} bg="white" borderRadius="md">
                        <HStack justify="space-between">
                          <Text fontWeight="bold">{method.paymentMethod}</Text>
                          <Badge colorScheme="blue">
                            {method._count.paymentMethod} transactions
                          </Badge>
                        </HStack>
                        <Text>${method._sum.amount?.toFixed(2) || '0.00'}</Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setIsStatsModalOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Transaction Modal */}
      <Modal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setIsTransactionModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Transaction</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Patient</FormLabel>
                <Select
                  value={paymentForm.patientId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, patientId: e.target.value })}
                  placeholder="Select patient"
                >
                  {allPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Amount</FormLabel>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Enter amount"
                  step="0.01"
                />
              </FormControl>
              
              <FormControl>
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
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  placeholder="Enter description"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={() => setIsTransactionModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={submitPayment}>
              Create Transaction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Refund Modal */}
      <Modal 
        isOpen={isRefundModalOpen} 
        onClose={() => setIsRefundModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Refund Transaction</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                <strong>Transaction ID:</strong> {selectedTransaction?.id}<br />
                <strong>Original Amount:</strong> ${selectedTransaction?.amount?.toFixed(2)}<br />
                <strong>Patient:</strong> {selectedTransaction?.patient?.name}
              </Text>
              
              <FormControl>
                <FormLabel>Refund Amount</FormLabel>
                <Input
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  placeholder="Enter refund amount"
                  step="0.01"
                  max={selectedTransaction?.amount}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Refund Reason</FormLabel>
                <Textarea
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  placeholder="Enter refund reason"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={() => setIsRefundModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={processRefund}>
              Process Refund
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Payment Modal */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Process Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                <strong>Patient:</strong> {selectedAppointment?.patient?.name}<br />
                <strong>Doctor:</strong> {selectedAppointment?.doctor?.name}<br />
                <strong>Date:</strong> {selectedAppointment ? formatDateTime(selectedAppointment.dateTime) : ''}
              </Text>
              <FormControl>
                <FormLabel>Payment Amount</FormLabel>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </FormControl>
              <FormControl>
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
            <Button colorScheme="gray" mr={3} onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="yellow" onClick={submitPayment}>
              Process Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
                  <FormControl isRequired>
                    <FormLabel>Report File *</FormLabel>
                    <VStack spacing={3} align="stretch">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleFileUpload(file);
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
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="green.800">
                              ✓ File uploaded successfully
                            </Text>
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
                        </Box>
                      )}
                      
                      <Text fontSize="xs" color="gray.500">
                        Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max: 10MB)
                      </Text>
                    </VStack>
                  </FormControl>
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
                    onClick={() => setCompletionForm({ ...completionForm, shouldRefer: true })}
                  >
                    Complete & Refer
                  </Button>
                </HStack>
              </Box>

              {/* Divider */}
              <Box border="1px solid" borderColor="gray.200" />

              {/* Referral Fields */}
              <Box>
                <Text fontSize="md" fontWeight="bold" mb={3}>Referral Information</Text>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Referral Target *</FormLabel>
                    <Input
                      value={completionForm.referralTarget}
                      onChange={(e) => setCompletionForm({ ...completionForm, referralTarget: e.target.value })}
                      placeholder="Enter doctor ID or department name"
                      isDisabled={!completionForm.shouldRefer}
                      bg={!completionForm.shouldRefer ? "gray.100" : "white"}
                    />
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
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={() => setIsCompletionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              colorScheme={completionForm.shouldRefer ? "purple" : "green"} 
              onClick={completionForm.shouldRefer ? submitReferral : submitCompletion}
              isDisabled={!completionForm.notes || !completionForm.diagnosis || !completionForm.reportFile || (completionForm.shouldRefer && (!completionForm.referralTarget || !completionForm.referralNotes)) || isUploading}
            >
              {completionForm.shouldRefer ? 'Complete & Refer Appointment' : 'Complete Appointment'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Referral Modal */}
      <Modal 
        isOpen={isReferralModalOpen} 
        onClose={() => setIsReferralModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Refer Appointment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                <strong>Patient:</strong> {selectedAppointment?.patient?.name}<br />
                <strong>Doctor:</strong> {selectedAppointment?.doctor?.name}<br />
                <strong>Date:</strong> {selectedAppointment ? formatDateTime(selectedAppointment.dateTime) : ''}
              </Text>
              <FormControl isRequired>
                <FormLabel>Referral Target *</FormLabel>
                <Input
                  value={referralForm.referredTo}
                  onChange={(e) => setReferralForm({ ...referralForm, referredTo: e.target.value })}
                  placeholder="Enter doctor ID or department name"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Referral Notes *</FormLabel>
                <Textarea
                  value={referralForm.notes}
                  onChange={(e) => setReferralForm({ ...referralForm, notes: e.target.value })}
                  placeholder="Enter referral notes"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={() => setIsReferralModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={submitReferral}>
              Refer Appointment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

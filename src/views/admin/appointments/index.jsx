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
} from '@chakra-ui/react';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE = 'http://localhost:8002/api';

export default function AppointmentsAdmin() {
  const { token } = useAuth();
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [patientForm, setPatientForm] = useState({ name: '', email: '', phone: '', address: '', age: '', gender: '' });
  const [appointmentForm, setAppointmentForm] = useState({ patientId: '', doctorId: '', dateTime: '', notes: '' });

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
      const res = await fetch(`${API_BASE}/admin/appointments`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setAppointments(data);
      else toast({ title: 'Failed to fetch appointments', status: 'error' });
    } catch (err) {
      toast({ title: 'Error fetching appointments', status: 'error' });
    }
  }, [token, toast]);

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

  const handleCreatePatient = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...patientForm, age: patientForm.age ? Number(patientForm.age) : null }),
      });
      if (res.ok) {
        toast({ title: 'Patient created', status: 'success' });
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
        toast({ title: 'Appointment scheduled', status: 'success' });
        setAppointmentForm({ patientId: '', doctorId: '', dateTime: '', notes: '' });
        fetchAppointments();
      } else {
        const err = await res.json();
        toast({ title: 'Failed to schedule appointment', description: err.error, status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error scheduling appointment', status: 'error' });
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
    fetchDoctors();
  }, [fetchPatients, fetchAppointments, fetchDoctors]);

  return (
    <Box pt={{ base: '130px', md: '80px' }} px={6}>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} mb={8}>
        <Card>
          <CardHeader>
            <Heading size="md">Create Patient</Heading>
          </CardHeader>
          <CardBody>
            <FormControl mb={3}>
              <FormLabel>Name</FormLabel>
              <Input value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Phone</FormLabel>
              <Input value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Address</FormLabel>
              <Input value={patientForm.address} onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Age</FormLabel>
              <Input type="number" value={patientForm.age} onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Gender</FormLabel>
              <Select value={patientForm.gender} onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </FormControl>
            <Button colorScheme="blue" onClick={handleCreatePatient} isDisabled={!patientForm.name}>
              Create Patient
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Schedule Appointment</Heading>
          </CardHeader>
          <CardBody>
            <FormControl mb={3}>
              <FormLabel>Patient</FormLabel>
              <Select value={appointmentForm.patientId} onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}>
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Doctor</FormLabel>
              <Select value={appointmentForm.doctorId} onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}>
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                ))}
              </Select>
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Date & Time</FormLabel>
              <Input type="datetime-local" value={appointmentForm.dateTime} onChange={(e) => setAppointmentForm({ ...appointmentForm, dateTime: e.target.value })} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Notes</FormLabel>
              <Textarea value={appointmentForm.notes} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} />
            </FormControl>
            <Button colorScheme="green" onClick={handleCreateAppointment} isDisabled={!appointmentForm.patientId || !appointmentForm.doctorId || !appointmentForm.dateTime}>
              Schedule Appointment
            </Button>
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
              </Tr>
            </Thead>
            <Tbody>
              {appointments.map((appt) => (
                <Tr key={appt.id}>
                  <Td>{new Date(appt.dateTime).toLocaleString()}</Td>
                  <Td>{appt.patient?.name}</Td>
                  <Td>{appt.doctor?.name}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        appt.status === 'COMPLETED' ? 'green' : appt.status === 'CANCELLED' ? 'red' : 'blue'
                      }
                    >
                      {appt.status}
                    </Badge>
                  </Td>
                  <Td>{appt.notes || '-'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </Box>
  );
}

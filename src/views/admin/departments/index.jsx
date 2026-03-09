import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Select,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE = 'http://localhost:8002/api';

const Departments = () => {
  const { user, token } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [assignFormData, setAssignFormData] = useState({
    userId: '',
    departmentId: '',
  });
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isAssignModalOpen, onOpen: onAssignModalOpen, onClose: onAssignModalClose } = useDisclosure();
  const cancelRef = React.useRef();

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
        setLastUpdated(new Date());
      } else {
        toast({
          title: 'Error fetching departments',
          description: 'Unable to load departments',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch departments',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  const fetchUnassignedEmployees = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/employees/without-department`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUnassignedEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching unassigned employees:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
    fetchUnassignedEmployees();
  }, [fetchDepartments, fetchUnassignedEmployees]);

  // Auto-refresh when window gains focus (user switches back to this tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDepartments();
        fetchUnassignedEmployees();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchDepartments, fetchUnassignedEmployees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingDepartment 
        ? `${API_BASE}/admin/departments/${editingDepartment.id}`
        : `${API_BASE}/admin/departments`;
      
      const method = editingDepartment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: editingDepartment ? 'Department updated' : 'Department created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setFormData({ name: '', description: '' });
        setEditingDepartment(null);
        onModalClose();
        fetchDepartments();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save department',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: 'Error',
        description: 'Failed to save department',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAssignEmployee = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE}/admin/departments/assign-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(assignFormData),
      });

      if (response.ok) {
        toast({
          title: 'Employee assigned to department',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setAssignFormData({ userId: '', departmentId: '' });
        onAssignModalClose();
        fetchDepartments();
        fetchUnassignedEmployees();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to assign employee',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error assigning employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign employee',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
    });
    onModalOpen();
  };

  const handleDelete = async (departmentId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/departments/${departmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Department deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchDepartments();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete department',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete department',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    onDeleteClose();
  };

  const handleRemoveEmployee = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/departments/remove-employee/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Employee removed from department',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchDepartments();
        fetchUnassignedEmployees();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove employee from department',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove employee from department',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openAssignModal = (departmentId) => {
    setAssignFormData({ ...assignFormData, departmentId });
    onAssignModalOpen();
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box p={8} pt="80px">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading>Department Management</Heading>
            {lastUpdated && (
              <Text fontSize="sm" color="gray.500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Text>
            )}
          </VStack>
          <HStack>
            <Button
              leftIcon={<RepeatIcon />}
              variant="outline"
              onClick={() => {
                fetchDepartments();
                fetchUnassignedEmployees();
              }}
              isLoading={loading}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={() => {
                setEditingDepartment(null);
                setFormData({ name: '', description: '' });
                onModalOpen();
              }}
            >
              Add Department
            </Button>
          </HStack>
        </HStack>

        {loading ? (
          <Text>Loading departments...</Text>
        ) : departments.length === 0 ? (
          <Card>
            <CardBody textAlign="center" py={8}>
              <Text color="gray.500" mb={4}>No departments found</Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={() => {
                  setEditingDepartment(null);
                  setFormData({ name: '', description: '' });
                  onModalOpen();
                }}
              >
                Create First Department
              </Button>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={4}>
            {departments.map((department) => (
              <Card key={department.id} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                <CardHeader>
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <Heading size="md">{department.name}</Heading>
                      {department.description && (
                        <Text color="gray.600" fontSize="sm">{department.description}</Text>
                      )}
                      <Badge colorScheme={department.isActive ? 'green' : 'red'}>
                        {department.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </VStack>
                    <HStack>
                      <Button
                        size="sm"
                        leftIcon={<AddIcon />}
                        onClick={() => openAssignModal(department.id)}
                      >
                        Assign Employee
                      </Button>
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => handleEdit(department)}
                        aria-label="Edit department"
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => {
                          setEditingDepartment(department);
                          onDeleteOpen();
                        }}
                        aria-label="Delete department"
                      />
                    </HStack>
                  </HStack>
                </CardHeader>
                {department.users && department.users.length > 0 && (
                  <CardBody>
                    <Text fontWeight="bold" mb={3}>Employees ({department.users.length})</Text>
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Email</Th>
                          <Th>Employee ID</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {department.users.map((user) => (
                          <Tr key={user.id}>
                            <Td>{user.name}</Td>
                            <Td>{user.email}</Td>
                            <Td>{user.empId || '-'}</Td>
                            <Td>
                              <Button
                                size="xs"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleRemoveEmployee(user.id)}
                              >
                                Remove
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </CardBody>
                )}
              </Card>
            ))}
          </VStack>
        )}
      </VStack>

      {/* Add/Edit Department Modal */}
      <Modal isOpen={isModalOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingDepartment ? 'Edit Department' : 'Add New Department'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Department Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter department name"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter department description"
                    rows={3}
                  />
                </FormControl>
                <HStack spacing={4} width="100%">
                  <Button type="submit" colorScheme="blue" flex={1}>
                    {editingDepartment ? 'Update' : 'Create'} Department
                  </Button>
                  <Button variant="outline" onClick={onModalClose} flex={1}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Assign Employee Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={onAssignModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Employee to Department</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleAssignEmployee}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Employee</FormLabel>
                  <Select
                    value={assignFormData.userId}
                    onChange={(e) => setAssignFormData({ ...assignFormData, userId: e.target.value })}
                    placeholder="Select an employee"
                  >
                    {unassignedEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.email}) - {employee.role?.name}
                      </option>
                    ))}
                  </Select>
                  {unassignedEmployees.length === 0 && (
                    <Text fontSize="sm" color="gray.500">No unassigned employees available</Text>
                  )}
                </FormControl>
                <HStack spacing={4} width="100%">
                  <Button 
                    type="submit" 
                    colorScheme="blue" 
                    flex={1}
                    isDisabled={unassignedEmployees.length === 0}
                  >
                    Assign Employee
                  </Button>
                  <Button variant="outline" onClick={onAssignModalClose} flex={1}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Department
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{editingDepartment?.name}"? This action cannot be undone.
              {editingDepartment?.users?.length > 0 && (
                <Text color="red.500" mt={2}>
                  Warning: This department has {editingDepartment.users.length} employee(s) assigned. 
                  Please reassign them first.
                </Text>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => handleDelete(editingDepartment.id)}
                ml={3}
                isDisabled={editingDepartment?.users?.length > 0}
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

export default Departments;

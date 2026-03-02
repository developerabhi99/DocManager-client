import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
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
  Card,
  CardHeader,
  CardBody,
  Heading,
  useToast,
  Textarea,
} from '@chakra-ui/react';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE = 'http://localhost:8002/api';

export default function TransactionsAdmin() {
  const { token } = useAuth();
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionFilters, setTransactionFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    patientId: '',
    paymentMethod: ''
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [createForm, setCreateForm] = useState({
    patientId: '',
    amount: '',
    paymentMethod: 'CASH',
    description: ''
  });
  const [refundForm, setRefundForm] = useState({ reason: '', amount: '' });

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: transactionPage,
        limit: '10',
        ...transactionFilters
      });
      
      const res = await fetch(`${API_BASE}/admin/transactions?${params}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      if (res.ok) setTransactions(data.transactions || data);
      else toast({ title: 'Failed to fetch transactions', status: 'error' });
    } catch (err) {
      toast({ title: 'Error fetching transactions', status: 'error' });
    }
  }, [token, toast, transactionPage, transactionFilters]);

  const processRefund = useCallback(async () => {
    if (!selectedTransaction || !refundForm.reason) {
      toast({ title: 'Transaction and refund reason are required', status: 'error' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/transactions/${selectedTransaction.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(refundForm)
      });

      if (res.ok) {
        toast({ title: 'Transaction refunded successfully', status: 'success' });
        setIsRefundModalOpen(false);
        setRefundForm({ reason: '', amount: '' });
        setSelectedTransaction(null);
        fetchTransactions();
      } else {
        const err = await res.json();
        toast({ title: 'Failed to refund transaction', description: err.error, status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error refunding transaction', status: 'error' });
    }
  }, [selectedTransaction, refundForm, token, toast, fetchTransactions]);

  const createTransaction = useCallback(async () => {
    if (!createForm.patientId || !createForm.amount || !createForm.paymentMethod) {
      toast({ title: 'Patient, amount, and payment method are required', status: 'error' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      });

      if (res.ok) {
        toast({ title: 'Transaction created successfully', status: 'success' });
        setIsCreateModalOpen(false);
        setCreateForm({ patientId: '', amount: '', paymentMethod: 'CASH', description: '' });
        fetchTransactions();
      } else {
        const err = await res.json();
        toast({ title: 'Failed to create transaction', description: err.error, status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error creating transaction', status: 'error' });
    }
  }, [createForm, token, toast, fetchTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Box p={4}>
      <VStack spacing={6}>
        <HStack justify="space-between" mb={6}>
          <Heading size="lg">Transactions</Heading>
          <Button 
            colorScheme="green" 
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Transaction
          </Button>
        </HStack>

        {/* Filters */}
        <Card>
          <CardHeader>
            <Heading size="md">Filters</Heading>
          </CardHeader>
          <CardBody>
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
                    <Td>{formatCurrency(transaction.amount)}</Td>
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
                            // View details logic here
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

      {/* Create Transaction Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Transaction</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Patient</FormLabel>
                <Select
                  value={createForm.patientId}
                  onChange={(e) => setCreateForm({ ...createForm, patientId: e.target.value })}
                  placeholder="Select patient"
                >
                  <option value="">Select a patient</option>
                  {/* This would need to be populated with actual patients */}
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Amount</FormLabel>
                <Input
                  type="number"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  placeholder="Enter amount"
                  step="0.01"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  value={createForm.paymentMethod}
                  onChange={(e) => setCreateForm({ ...createForm, paymentMethod: e.target.value })}
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
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Enter description"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={createTransaction}>
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
                <strong>Original Amount:</strong> {formatCurrency(selectedTransaction?.amount)}<br />
                <strong>Patient:</strong> {selectedTransaction?.patient?.name}
              </Text>
              
              <FormControl isRequired>
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
    </Box>
  );
}

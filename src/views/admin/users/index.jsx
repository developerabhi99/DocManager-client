import React from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import Card from "components/card/Card";
import { useAuth } from "contexts/AuthContext";

export default function UsersAdmin() {
  const { token } = useAuth();
  const [roles, setRoles] = React.useState([]);
  const [userTypes, setUserTypes] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [users, setUsers] = React.useState([]);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    empId: "",
    roleId: "",
    userTypeId: "",
    departmentId: "",
    isActive: true,
  });

  const [editingUser, setEditingUser] = React.useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");

  const borderColor = useColorModeValue("#E6ECFA", "rgba(135, 140, 189, 0.3)");

  const apiBaseUrl =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8002";

  const selectedRole = React.useMemo(() => {
    return roles.find((r) => r.id === form.roleId) || null;
  }, [roles, form.roleId]);

  const loadAll = React.useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [rolesRes, userTypesRes, usersRes, departmentsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/roles`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/user-types`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/users`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/departments`, { headers }),
      ]);

      const rolesData = await rolesRes.json().catch(() => null);
      const userTypesData = await userTypesRes.json().catch(() => null);
      const usersData = await usersRes.json().catch(() => null);
      const departmentsData = await departmentsRes.json().catch(() => null);

      if (!rolesRes.ok) {
        throw new Error(rolesData?.message || "Failed to load roles");
      }
      if (!userTypesRes.ok) {
        throw new Error(userTypesData?.message || "Failed to load user types");
      }
      if (!usersRes.ok) {
        throw new Error(usersData?.message || "Failed to load users");
      }
      if (!departmentsRes.ok) {
        throw new Error(departmentsData?.message || "Failed to load departments");
      }

      setRoles(Array.isArray(rolesData?.roles) ? rolesData.roles : []);
      setUserTypes(
        Array.isArray(userTypesData?.userTypes) ? userTypesData.userTypes : []
      );
      setUsers(Array.isArray(usersData?.users) ? usersData.users : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);

      setForm((prev) => {
        const nextRoleId = prev.roleId || (rolesData?.roles?.[0]?.id || "");
        return { ...prev, roleId: nextRoleId };
      });
    } catch (e) {
      setErrorMessage(e?.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [token, apiBaseUrl]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          empId: form.empId || undefined,
          roleId: form.roleId,
          userTypeId: form.userTypeId || undefined,
          departmentId: form.departmentId || undefined,
          isActive: form.isActive,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to create user");
      }

      setSuccessMessage("User created successfully");
      setForm((prev) => ({
        ...prev,
        name: "",
        email: "",
        password: "",
        empId: "",
        departmentId: "",
      }));

      await loadAll();
    } catch (e) {
      setErrorMessage(e?.message || "Failed to create user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      empId: user.empId || "",
      roleId: user.role.id,
      userTypeId: user.userType?.id || "",
      departmentId: user.department?.id || "",
      isActive: user.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!token || !editingUser) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          empId: form.empId || undefined,
          roleId: form.roleId,
          userTypeId: form.userTypeId || undefined,
          departmentId: form.departmentId || undefined,
          isActive: form.isActive,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update user");
      }

      setSuccessMessage("User updated successfully");
      setIsEditModalOpen(false);
      setEditingUser(null);
      await loadAll();
    } catch (e) {
      setErrorMessage(e?.message || "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: "20px", xl: "20px" }}>
        <Card p="20px">
          <Text fontSize="lg" fontWeight="700" mb="10px">
            Create User
          </Text>
          {errorMessage ? (
            <Text color="red.400" mb="10px">
              {errorMessage}
            </Text>
          ) : null}
          {successMessage ? (
            <Text color="green.400" mb="10px">
              {successMessage}
            </Text>
          ) : null}

          <Box as="form" onSubmit={handleCreate}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing="12px">
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Full name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@example.com"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Set initial password"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Employee ID</FormLabel>
                <Input
                  value={form.empId}
                  onChange={(e) => handleChange("empId", e.target.value)}
                  placeholder="Optional"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select
                  value={form.roleId}
                  onChange={(e) => handleChange("roleId", e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>User Type</FormLabel>
                <Select
                  value={form.userTypeId}
                  onChange={(e) => handleChange("userTypeId", e.target.value)}
                >
                  <option value="">Auto (match role)</option>
                  {userTypes.map((ut) => (
                    <option key={ut.id} value={ut.id}>
                      {ut.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Department</FormLabel>
                <Select
                  value={form.departmentId}
                  onChange={(e) => handleChange("departmentId", e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <Switch
                  isChecked={form.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  me="10px"
                />
                <FormLabel m="0">Active</FormLabel>
              </FormControl>
            </SimpleGrid>

            <Box mt="14px" p="12px" border="1px solid" borderColor={borderColor} borderRadius="12px">
              <Text fontWeight="700" mb="6px">
                Permissions (from role)
              </Text>
              <Text fontSize="sm" color="gray.500">
                {selectedRole?.permissions?.length
                  ? selectedRole.permissions.join(", ")
                  : "No permissions"}
              </Text>
            </Box>

            <Flex mt="14px" justify="flex-end">
              <Button
                type="submit"
                variant="brand"
                isLoading={isSaving}
                isDisabled={isLoading || !token}
              >
                Create User
              </Button>
            </Flex>
          </Box>
        </Card>

        <Card p="20px">
          <Flex justify="space-between" align="center" mb="10px">
            <Text fontSize="lg" fontWeight="700">
              Users
            </Text>
            <Button onClick={loadAll} isLoading={isLoading} variant="outline">
              Refresh
            </Button>
          </Flex>

          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Department</Th>
                  <Th>Active</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((u) => (
                  <Tr key={u.id}>
                    <Td>{u.name}</Td>
                    <Td>{u.email}</Td>
                    <Td>{u?.role?.name || ""}</Td>
                    <Td>{u?.department?.name || "Not Assigned"}</Td>
                    <Td>{u.isActive ? "Yes" : "No"}</Td>
                    <Td>
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => handleEdit(u)}
                        aria-label="Edit user"
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Card>
      </SimpleGrid>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {errorMessage ? (
              <Text color="red.400" mb="10px">
                {errorMessage}
              </Text>
            ) : null}
            {successMessage ? (
              <Text color="green.400" mb="10px">
                {successMessage}
              </Text>
            ) : null}

            <Box as="form" onSubmit={handleUpdate}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing="12px">
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Full name"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Leave blank to keep current password"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Employee ID</FormLabel>
                  <Input
                    value={form.empId}
                    onChange={(e) => handleChange("empId", e.target.value)}
                    placeholder="Optional"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={form.roleId}
                    onChange={(e) => handleChange("roleId", e.target.value)}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>User Type</FormLabel>
                  <Select
                    value={form.userTypeId}
                    onChange={(e) => handleChange("userTypeId", e.target.value)}
                  >
                    <option value="">Auto (match role)</option>
                    {userTypes.map((ut) => (
                      <option key={ut.id} value={ut.id}>
                        {ut.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Department</FormLabel>
                  <Select
                    value={form.departmentId}
                    onChange={(e) => handleChange("departmentId", e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <Switch
                    isChecked={form.isActive}
                    onChange={(e) => handleChange("isActive", e.target.checked)}
                    me="10px"
                  />
                  <FormLabel m="0">Active</FormLabel>
                </FormControl>
              </SimpleGrid>

              <Flex mt="14px" justify="flex-end">
                <Button
                  type="submit"
                  variant="brand"
                  isLoading={isSaving}
                  isDisabled={isLoading || !token}
                >
                  Update User
                </Button>
              </Flex>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

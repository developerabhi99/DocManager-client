import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card";
import { useAuth } from "contexts/AuthContext";

export default function AccessControlAdmin() {
  const { token } = useAuth();
  const apiBaseUrl =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8002";

  const [roles, setRoles] = React.useState([]);
  const [permissions, setPermissions] = React.useState([]);
  const [userTypes, setUserTypes] = React.useState([]);

  const [roleForm, setRoleForm] = React.useState({
    name: "",
    description: "",
  });
  const [permissionForm, setPermissionForm] = React.useState({
    key: "",
    description: "",
  });
  const [userTypeForm, setUserTypeForm] = React.useState({
    name: "",
    parentId: "",
  });

  const [selectedRoleId, setSelectedRoleId] = React.useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = React.useState([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");

  const borderColor = useColorModeValue("#E6ECFA", "rgba(135, 140, 189, 0.3)");

  const headers = React.useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const loadAll = React.useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const [rolesRes, permissionsRes, userTypesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/roles`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/permissions`, { headers }),
        fetch(`${apiBaseUrl}/api/admin/user-types`, { headers }),
      ]);

      const rolesData = await rolesRes.json().catch(() => null);
      const permissionsData = await permissionsRes.json().catch(() => null);
      const userTypesData = await userTypesRes.json().catch(() => null);

      if (!rolesRes.ok) {
        throw new Error(rolesData?.message || "Failed to load roles");
      }
      if (!permissionsRes.ok) {
        throw new Error(permissionsData?.message || "Failed to load permissions");
      }
      if (!userTypesRes.ok) {
        throw new Error(userTypesData?.message || "Failed to load user types");
      }

      const nextRoles = Array.isArray(rolesData?.roles) ? rolesData.roles : [];
      const nextPerms = Array.isArray(permissionsData?.permissions)
        ? permissionsData.permissions
        : [];
      const nextUserTypes = Array.isArray(userTypesData?.userTypes)
        ? userTypesData.userTypes
        : [];

      setRoles(nextRoles);
      setPermissions(nextPerms);
      setUserTypes(nextUserTypes);

      setSelectedRoleId((prev) => prev || nextRoles?.[0]?.id || "");
    } catch (e) {
      setErrorMessage(e?.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [token, apiBaseUrl, headers]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectedRole = React.useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  React.useEffect(() => {
    const ids = Array.isArray(selectedRole?.permissionIds)
      ? selectedRole.permissionIds
      : [];
    setSelectedPermissionIds(ids);
  }, [selectedRoleId, selectedRole]);

  const togglePermission = (permissionId) => {
    setSelectedPermissionIds((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((x) => x !== permissionId);
      }
      return [...prev, permissionId];
    });
  };

  const postJson = async (url, body) => {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Request failed");
    }
    return data;
  };

  const putJson = async (url, body) => {
    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Request failed");
    }
    return data;
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await postJson(`${apiBaseUrl}/api/admin/roles`, {
        name: roleForm.name,
        description: roleForm.description || undefined,
        permissionIds: [],
      });
      setRoleForm({ name: "", description: "" });
      setSuccessMessage("Role created");
      await loadAll();
    } catch (e) {
      setErrorMessage(e?.message || "Failed to create role");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!token || !selectedRoleId) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await putJson(
        `${apiBaseUrl}/api/admin/roles/${selectedRoleId}/permissions`,
        { permissionIds: selectedPermissionIds }
      );
      setSuccessMessage("Role permissions updated");
      await loadAll();
    } catch (e) {
      setErrorMessage(e?.message || "Failed to update role permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePermission = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await postJson(`${apiBaseUrl}/api/admin/permissions`, {
        key: permissionForm.key,
        description: permissionForm.description || undefined,
      });
      setPermissionForm({ key: "", description: "" });
      setSuccessMessage("Permission created");
      await loadAll();
    } catch (e) {
      setErrorMessage(e?.message || "Failed to create permission");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUserType = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await postJson(`${apiBaseUrl}/api/admin/user-types`, {
        name: userTypeForm.name,
        parentId: userTypeForm.parentId || undefined,
      });
      setUserTypeForm({ name: "", parentId: "" });
      setSuccessMessage("User type created");
      await loadAll();
    } catch (e) {
      setErrorMessage(e?.message || "Failed to create user type");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card p="20px">
        <Flex justify="space-between" align="center" mb="10px">
          <Text fontSize="lg" fontWeight="700">
            Access Control
          </Text>
          <Button onClick={loadAll} isLoading={isLoading} variant="outline">
            Refresh
          </Button>
        </Flex>

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

        <Tabs>
          <TabList>
            <Tab>Roles</Tab>
            <Tab>Permissions</Tab>
            <Tab>User Types</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="20px">
                <Box>
                  <Text fontWeight="700" mb="10px">
                    Create Role
                  </Text>
                  <Box as="form" onSubmit={handleCreateRole}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing="12px">
                      <FormControl isRequired>
                        <FormLabel>Name</FormLabel>
                        <Input
                          value={roleForm.name}
                          onChange={(e) =>
                            setRoleForm((p) => ({ ...p, name: e.target.value }))
                          }
                          placeholder="e.g. ADMIN"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <Input
                          value={roleForm.description}
                          onChange={(e) =>
                            setRoleForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Optional"
                        />
                      </FormControl>
                    </SimpleGrid>
                    <Flex mt="12px" justify="flex-end">
                      <Button type="submit" variant="brand" isLoading={isSaving}>
                        Create
                      </Button>
                    </Flex>
                  </Box>

                  <Box mt="20px">
                    <Text fontWeight="700" mb="10px">
                      Assign Permissions to Role
                    </Text>
                    <FormControl>
                      <FormLabel>Role</FormLabel>
                      <Select
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <Box
                      mt="12px"
                      p="12px"
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="12px"
                      maxH="320px"
                      overflowY="auto"
                    >
                      {permissions.map((p) => (
                        <Flex key={p.id} align="center" mb="6px">
                          <Checkbox
                            isChecked={selectedPermissionIds.includes(p.id)}
                            onChange={() => togglePermission(p.id)}
                            me="10px"
                          />
                          <Text fontSize="sm">{p.key}</Text>
                        </Flex>
                      ))}
                    </Box>

                    <Flex mt="12px" justify="flex-end">
                      <Button
                        variant="brand"
                        onClick={handleSaveRolePermissions}
                        isLoading={isSaving}
                        isDisabled={!selectedRoleId}
                      >
                        Save Permissions
                      </Button>
                    </Flex>
                  </Box>
                </Box>

                <Box>
                  <Text fontWeight="700" mb="10px">
                    Roles List
                  </Text>
                  <Box overflowX="auto">
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Description</Th>
                          <Th>Permissions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {roles.map((r) => (
                          <Tr key={r.id}>
                            <Td>{r.name}</Td>
                            <Td>{r.description || ""}</Td>
                            <Td>
                              <Text fontSize="xs" color="gray.500">
                                {Array.isArray(r.permissions) && r.permissions.length
                                  ? r.permissions.join(", ")
                                  : "-"}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              </SimpleGrid>
            </TabPanel>

            <TabPanel>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="20px">
                <Box>
                  <Text fontWeight="700" mb="10px">
                    Create Permission
                  </Text>
                  <Box as="form" onSubmit={handleCreatePermission}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing="12px">
                      <FormControl isRequired>
                        <FormLabel>Key</FormLabel>
                        <Input
                          value={permissionForm.key}
                          onChange={(e) =>
                            setPermissionForm((p) => ({
                              ...p,
                              key: e.target.value,
                            }))
                          }
                          placeholder="e.g. MANAGE_USERS"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <Input
                          value={permissionForm.description}
                          onChange={(e) =>
                            setPermissionForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Optional"
                        />
                      </FormControl>
                    </SimpleGrid>
                    <Flex mt="12px" justify="flex-end">
                      <Button type="submit" variant="brand" isLoading={isSaving}>
                        Create
                      </Button>
                    </Flex>
                  </Box>
                </Box>

                <Box>
                  <Text fontWeight="700" mb="10px">
                    Permissions List
                  </Text>
                  <Box overflowX="auto">
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Key</Th>
                          <Th>Description</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {permissions.map((p) => (
                          <Tr key={p.id}>
                            <Td>{p.key}</Td>
                            <Td>{p.description || ""}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              </SimpleGrid>
            </TabPanel>

            <TabPanel>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="20px">
                <Box>
                  <Text fontWeight="700" mb="10px">
                    Create User Type
                  </Text>
                  <Box as="form" onSubmit={handleCreateUserType}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing="12px">
                      <FormControl isRequired>
                        <FormLabel>Name</FormLabel>
                        <Input
                          value={userTypeForm.name}
                          onChange={(e) =>
                            setUserTypeForm((p) => ({
                              ...p,
                              name: e.target.value,
                            }))
                          }
                          placeholder="e.g. MANAGER"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Parent</FormLabel>
                        <Select
                          value={userTypeForm.parentId}
                          onChange={(e) =>
                            setUserTypeForm((p) => ({
                              ...p,
                              parentId: e.target.value,
                            }))
                          }
                        >
                          <option value="">None</option>
                          {userTypes.map((ut) => (
                            <option key={ut.id} value={ut.id}>
                              {ut.name}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </SimpleGrid>
                    <Flex mt="12px" justify="flex-end">
                      <Button type="submit" variant="brand" isLoading={isSaving}>
                        Create
                      </Button>
                    </Flex>
                  </Box>
                </Box>

                <Box>
                  <Text fontWeight="700" mb="10px">
                    User Types List
                  </Text>
                  <Box overflowX="auto">
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Parent</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {userTypes.map((ut) => (
                          <Tr key={ut.id}>
                            <Td>{ut.name}</Td>
                            <Td>
                              {ut.parentId
                                ? userTypes.find((x) => x.id === ut.parentId)
                                    ?.name || ""
                                : ""}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>
    </Box>
  );
}

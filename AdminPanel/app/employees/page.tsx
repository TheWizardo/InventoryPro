"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck, UserX, Edit, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Employee } from "@/lib/types";
import { employeeService } from "@/lib/services";
import { useLicense } from "@/components/license-provider";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewEmployeeOpen, setIsNewEmployeeOpen] = useState(false);
  const [isDeleteErrorOpen, setIsDeleteErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "_id">>({
    name: "",
    isEmployeed: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { fetchLicense } = useLicense()

  useEffect(() => {
    fetchEmployees();
    fetchLicense();
  }, []);

  useEffect(() => {
    const filtered = employees.filter((employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.fetchAll();
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof Employee,
    value: string | boolean
  ) => {
    setNewEmployee({ ...newEmployee, [field]: value });
  };

  const handleEditInputChange = (
    field: keyof Employee,
    value: string | boolean
  ) => {
    if (!editingEmployee) return;
    setEditingEmployee({ ...editingEmployee, [field]: value });
  };

  const handleCreateEmployee = async () => {
    if (!newEmployee.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter an employee name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await employeeService.addEmployee(newEmployee as Employee);
      if (response.ok) {
        await fetchEmployees();
        setNewEmployee({ name: "", isEmployeed: true });
        setIsNewEmployeeOpen(false);
        toast({
          title: "Success",
          description: "Employee created successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create employee");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      const response = await employeeService.deleteEmployee(id);
      const msg = await response.text();
      try {
        JSON.parse(msg);
        toast({
          title: "Success",
          description: `Employee deleted successfully`,
        });
        fetchEmployees()
      } catch (error) {
        if ((error as SyntaxError).name === "SyntaxError") {
          setErrorMessage(msg)
          setIsDeleteErrorOpen(true);
        }
        else {
          throw Error();
        }
      }
    }
    catch (err) {
      console.log(err)
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  function DeleteErrorModal({ isOpen, onOpenChange, handleSubmit, message }: { isOpen: boolean, onOpenChange: (open: boolean) => void, handleSubmit: () => void, message: string }) {
    const parseMessage = (message: string) => {
      return <div dangerouslySetInnerHTML={{ __html: message }} />
    }

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Unable to delete employee
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {parseMessage(message)}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleDeleteErrorSubmit = () => setIsDeleteErrorOpen(false);

  const handleUpdateEmployee = async () => {
    if (!editingEmployee || !editingEmployee.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter an employee name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await employeeService.editEmployee(editingEmployee._id, {
        name: editingEmployee.name,
        isEmployeed: editingEmployee.isEmployeed,
      });

      if (response.ok) {
        await fetchEmployees();
        setEditingEmployee(null);
        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update employee");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee({ ...employee });
  };

  const resetForms = () => {
    setNewEmployee({ name: "", isEmployeed: true });
    setEditingEmployee(null);
    setIsNewEmployeeOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading employees...
      </div>
    );
  }

  const activeEmployees = filteredEmployees.filter((emp) => emp.isEmployeed);
  const inactiveEmployees = filteredEmployees.filter((emp) => !emp.isEmployeed);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <p className="text-muted-foreground">Manage your company employees</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              Active Employees
              <Badge variant="default">{activeEmployees.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeEmployees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEmployees.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell className="font-medium">
                        <span
                          style={{
                            color: employeeService.generateColor(employee._id),
                          }}
                        >
                          {employee.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-2" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active employees found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Inactive Employees
              <Badge variant="outline">{inactiveEmployees.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inactiveEmployees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveEmployees.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell className="font-medium">
                        <span
                          style={{
                            color: employeeService.generateColor(employee._id),
                          }}
                        >
                          {employee.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800"
                        >
                          Inactive
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-2" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No inactive employees found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Dialog open={isNewEmployeeOpen} onOpenChange={setIsNewEmployeeOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="px-8">
              <Plus className="h-5 w-5 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Employee Name *</Label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter employee name"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isEmployeed"
                  checked={newEmployee.isEmployeed}
                  onChange={(e) =>
                    handleInputChange("isEmployeed", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isEmployeed">Active Employee</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateEmployee}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? "Adding..." : "Add Employee"}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForms}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DeleteErrorModal
        isOpen={isDeleteErrorOpen}
        onOpenChange={setIsDeleteErrorOpen}
        handleSubmit={handleDeleteErrorSubmit}
        message={errorMessage} />

      {/* Edit Employee Dialog */}
      <Dialog
        open={!!editingEmployee}
        onOpenChange={() => setEditingEmployee(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Employee Name *</Label>
                <Input
                  id="editName"
                  value={editingEmployee.name}
                  onChange={(e) =>
                    handleEditInputChange("name", e.target.value)
                  }
                  placeholder="Enter employee name"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsEmployeed"
                  checked={editingEmployee.isEmployeed}
                  onChange={(e) =>
                    handleEditInputChange("isEmployeed", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="editIsEmployeed">Active Employee</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleUpdateEmployee}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? "Updating..." : "Update Employee"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingEmployee(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  User,
  Package,
  Hash,
  Trash2,
  Settings,
  CheckCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  assemblyService,
  productService,
  employeeService,
  projectService,
  inventoryService,
  logService,
} from "@/lib/services";
import { InventoryItem, AssembledItem, Project, Employee, LogRegistryBackend } from "@/lib/types"; // adjust import paths

type SortField =
  | "serialNumber"
  | "itemName"
  | "employeeName"
  | "projectName"
  | "productionDate";
type SortDirection = "asc" | "desc";

export default function AssemblyPage() {
  const [assemblies, setAssemblies] = useState<AssembledItem[]>([]);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isNewAssemblyOpen, setIsNewAssemblyOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [serialNumberModal, setSerialNumberModal] = useState<{
    open: boolean;
    serialNumber: string;
  }>({
    open: false,
    serialNumber: "",
  });
  const [newAssembly, setNewAssembly] = useState({
    item: "",
    employee: "",
    project: "",
    productionDate: "",
    serialNumber: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("productionDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const { toast } = useToast();

  useEffect(() => {
    fetchAssemblies();
    fetchEmployees();
    fetchProjects();

    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    setNewAssembly((prev) => ({ ...prev, productionDate: today }));
  }, []);

  const fetchAssemblies = async () => {
    try {
      const response = await assemblyService.fetchAll();
      const data = await response.json();
      setAssemblies(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch assemblies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateItemsByProject = async (projectId: string) => {
    const projectProducts = projects.filter(p => p._id === projectId)[0].products;
    const response = await inventoryService.fetchSeveral(projectProducts.map(p => p.item as string));
    setAvailableItems(await response.json())
  }

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.fetchAll();
      const data = await response.json();
      const activeEmployees = data.filter((emp: Employee) => emp.isEmployeed);
      setEmployees(activeEmployees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.fetchAll();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const handleInputChange = (field: keyof AssembledItem, value: string) => {
    if (field === "project") updateItemsByProject(value);
    setNewAssembly({ ...newAssembly, [field]: value });
  };

  const handleCreateAssembly = async () => {
    if (!newAssembly.item || !newAssembly.employee || !newAssembly.project) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        item: newAssembly.item,
        employee: newAssembly.employee,
        project: newAssembly.project,
        productionDate: newAssembly.productionDate,
      };

      if (showAdvanced && newAssembly.serialNumber) {
        payload.serialNumber = newAssembly.serialNumber;
      }

      const response = await assemblyService.addAssembly(payload);
      if (response.ok) {
        const itemResponse = await inventoryService.fetchOne(
          newAssembly.item
        );
        const newAssembledItem: InventoryItem = await itemResponse.json()
        const stockAdjustments = inventoryService
          .flattenToLeafComponents(newAssembledItem)
          .map((a) => {
            return { _id: a._id, amount: 0 - a.amount };
          });
        await inventoryService.adjustStock(stockAdjustments);
        const createdAssembly: AssembledItem = await response.json();
        const logRegistry: LogRegistryBackend = {
          items: stockAdjustments.map(e => ({ item: e._id, quantity: e.amount * -1 })),
          description: `Created Assembly '${createdAssembly.item.itemName}' for ${createdAssembly.project.name}`,
          employee: createdAssembly.employee,
          registrationDate: (new Date()).toISOString()
        }
        await logService.registerLog(logRegistry);
        await fetchAssemblies();
        setNewAssembly({
          item: "",
          employee: "",
          project: "",
          productionDate: "",
          serialNumber: "",
        });
        setIsNewAssemblyOpen(false);
        setShowAdvanced(false);
        setSerialNumberModal({
          open: true,
          serialNumber: createdAssembly.serialNumber,
        });
        toast({
          title: "Success",
          description: "Assembly created successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create assembly");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create assembly",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssembly = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assembly?")) return;

    try {
      const response = await assemblyService.deleteAssembly(id);
      if (response.ok) {
        await fetchAssemblies();
        toast({
          title: "Success",
          description: "Assembly deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assembly",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDateFilteredAssemblies = () => {
    if (dateFilter === "all") return assemblies;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastYear = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate()
    );

    return assemblies.filter((assembly) => {
      const assemblyDate = new Date(assembly.productionDate);

      switch (dateFilter) {
        case "today":
          return assemblyDate >= today;
        case "yesterday":
          return assemblyDate >= yesterday && assemblyDate < today;
        case "last-month":
          return assemblyDate >= lastMonth;
        case "last-year":
          return assemblyDate >= lastYear;
        default:
          return true;
      }
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedAssemblies = (items: AssembledItem[]) => {
    return [...items].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "serialNumber":
          aValue = a.serialNumber;
          bValue = b.serialNumber;
          break;
        case "itemName":
          aValue = a.item.itemName;
          bValue = b.item.itemName;
          break;
        case "employeeName":
          aValue = a.employee.name;
          bValue = b.employee.name;
          break;
        case "projectName":
          aValue = a.project?.name || "";
          bValue = b.project?.name || "";
          break;
        case "productionDate":
          aValue = new Date(a.productionDate).getTime();
          bValue = new Date(b.productionDate).getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getFilteredAndSortedAssemblies = () => {
    const dateFiltered = getDateFilteredAssemblies();
    return getSortedAssemblies(dateFiltered);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading assemblies...
      </div>
    );
  }

  const displayedAssemblies = getFilteredAndSortedAssemblies();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Assembly Management</h1>
        <p className="text-muted-foreground">
          Track and manage product assemblies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={dateFilter === "all" ? "default" : "outline"}
              onClick={() => setDateFilter("all")}
            >
              All Time
            </Button>
            <Button
              variant={dateFilter === "today" ? "default" : "outline"}
              onClick={() => setDateFilter("today")}
            >
              Today
            </Button>
            <Button
              variant={dateFilter === "yesterday" ? "default" : "outline"}
              onClick={() => setDateFilter("yesterday")}
            >
              Yesterday
            </Button>
            <Button
              variant={dateFilter === "last-month" ? "default" : "outline"}
              onClick={() => setDateFilter("last-month")}
            >
              Last Month
            </Button>
            <Button
              variant={dateFilter === "last-year" ? "default" : "outline"}
              onClick={() => setDateFilter("last-year")}
            >
              Last Year
            </Button>
            <Badge variant="outline" className="h-10 flex items-center ml-auto">
              {displayedAssemblies.length} assemblies shown
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              All Assemblies
              <Badge variant="secondary">{displayedAssemblies.length}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {displayedAssemblies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("serialNumber")}
                  >
                    Serial Number <SortIcon field="serialNumber" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("itemName")}
                  >
                    Product <SortIcon field="itemName" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("employeeName")}
                  >
                    Employee <SortIcon field="employeeName" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("projectName")}
                  >
                    Project <SortIcon field="projectName" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("productionDate")}
                  >
                    Production Date <SortIcon field="productionDate" />
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAssemblies.map((assembly) => (
                  <TableRow key={assembly._id}>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        {assembly.serialNumber}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {assembly.item.itemName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span
                          style={{
                            color: employeeService.generateColor(
                              assembly.employee._id
                            ),
                          }}
                        >
                          {assembly.employee.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assembly.project ? assembly.project.name : "No Project"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(assembly.productionDate.toString())}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAssembly(assembly._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No assemblies found
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first assembly to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Dialog open={isNewAssemblyOpen} onOpenChange={setIsNewAssemblyOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="px-8">
              <Plus className="h-5 w-5 mr-2" />
              New Assembly
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Assembly</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={newAssembly.project}
                  onValueChange={(value) => handleInputChange("project", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => !p.isCompleted).map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select
                  value={newAssembly.employee}
                  onValueChange={(value) =>
                    handleInputChange("employee", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        <span
                          style={{
                            color: employeeService.generateColor(employee._id),
                          }}
                        >
                          {employee.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item">Product *</Label>
                <Select
                  value={newAssembly.item}
                  onValueChange={(value) => handleInputChange("item", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item.itemName} ({item.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showAdvanced ? "Hide Advanced" : "Show Advanced"}
                </Button>
              </div>

              {showAdvanced && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="productionDate">Production Date</Label>
                    <Input
                      id="productionDate"
                      type="date"
                      value={newAssembly.productionDate}
                      onChange={(e) =>
                        handleInputChange("productionDate", e.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use today's date
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={newAssembly.serialNumber}
                      onChange={(e) =>
                        handleInputChange("serialNumber", e.target.value)
                      }
                      placeholder="Leave empty for auto-generation"
                    />
                    <p className="text-xs text-muted-foreground">
                      If left empty, the backend will automatically generate a
                      serial number
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateAssembly}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? "Creating..." : "Create Assembly"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsNewAssemblyOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={serialNumberModal.open}
        onOpenChange={(open) =>
          setSerialNumberModal({ ...serialNumberModal, open })
        }
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Assembly Created</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Serial Number:
              </p>
              <div className="font-mono text-3xl font-bold bg-muted p-4 rounded-lg border-2 border-primary/20 tracking-wider">
                {serialNumberModal.serialNumber}
              </div>
            </div>
            <Button
              onClick={() =>
                setSerialNumberModal({ open: false, serialNumber: "" })
              }
              className="w-full"
            >
              Printed Label
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

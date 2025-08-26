"use client";

import React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  Plus,
  Search,
  Edit,
  Calendar,
  ChevronDown,
  ChevronRight,
  Package,
  X,
} from "lucide-react";
import {
  projectService,
  productService,
  inventoryService,
  assemblyService
} from "@/lib/services";
import { Project, InventoryItem, StockAdjustment, AssembledItem, ProductComponent } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isPredictedStockOpen, setIsPredictedStockOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Omit<Project, "_id">>({
    name: "",
    dueDate: "",
    products: [] as Array<ProductComponent>,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [assemblyData, setAssemblyData] = useState<
    Record<string, AssembledItem[]>
  >({});
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryAdjustments, setInventoryAdjustments] = useState<
    StockAdjustment[]
  >([]);
  const [showOverdue, setShowOverdue] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true)
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const response = await inventoryService.fetchAll();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
    }

    try {
      const response = await productService.fetchAll();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.fetchAll();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Project[] = await response.json();
      setProjects(data);
      for (const p of data) {
        await fetchAssemblyData(p._id);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssemblyData = async (projectId: string) => {
    try {
      const response = await assemblyService.fetchByProject(projectId);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: AssembledItem[] = await response.json();
      console.log("Assembly data for project", projectId, ":", data);
      setAssemblyData((prev) => ({ ...prev, [projectId]: data }));
    } catch (error) {
      console.error("Failed to fetch assembly data:", error);
    }
  };

  const toggleRowExpansion = (projectId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(projectId)) {
      newExpandedRows.delete(projectId);
    } else {
      newExpandedRows.add(projectId);
      if (!assemblyData[projectId]) {
        fetchAssemblyData(projectId);
      }
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.dueDate ||
      formData.products?.length === 0
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const rawFormAdjustments = [...formData.products];
      const rawAdjustments = await Promise.all(
        rawFormAdjustments.map(async (p) => {
          const fetchedItem = await inventoryService.fetchOne(p.item as string);
          const item = await fetchedItem.json();
          return {
            item,
            quantity: p.quantity,
          };
        })
      );
      const stockAdjustmentsArr = await Promise.all(
        rawAdjustments.map(async (a) =>
          inventoryService.flattenToLeafComponents(a.item, a.quantity)
        )
      );
      const stockAdjustments = inventoryService.aggregateAdjustments(stockAdjustmentsArr).map(a => { return { _id: a._id, amount: 0 - a.amount } });
      setInventoryAdjustments(stockAdjustments);
      setIsPredictedStockOpen(true);

      const response = await (editingProject
        ? projectService.updateProject(editingProject._id, formData)
        : projectService.addProject(formData as Project));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: `Project ${editingProject ? "updated" : "created"
          } successfully`,
      });

      setFormData({ name: "", dueDate: "", products: [] });
      setIsNewProjectOpen(false);
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      console.error("Failed to save project:", error);
      toast({
        title: "Error",
        description: `Failed to ${editingProject ? "update" : "create"
          } project`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      dueDate: new Date(project.dueDate).toISOString().split("T")[0],
      products: project.products.map((p) => ({
        item: (p.item as InventoryItem)._id,
        quantity: p.quantity,
      })),
    });
    setIsNewProjectOpen(true);
  };

  const handleNewProject = () => {
    setEditingProject(null);
    setFormData({ name: "", dueDate: "", products: [] });
    setIsNewProjectOpen(true);
  };

  const addProductComponent = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { item: "", quantity: 1 }],
    });
  };

  const removeProductComponent = (index: number) => {
    setFormData({
      ...formData,
      products: formData.products.filter((_, i) => i !== index),
    });
  };

  const updateProductComponent = (
    index: number,
    field: "item" | "quantity",
    value: string | number
  ) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setFormData({ ...formData, products: updatedProducts });
  };

  const getAssemblyProgress = (
    projectId: string,
    productId: string,
    targetQuantity: number
  ) => {
    const projectAssemblies = assemblyData[projectId] || [];
    console.log(
      "Looking for product",
      productId,
      "in assemblies:",
      projectAssemblies
    );

    const assembled = projectAssemblies.filter(
      (a) => (a.item._id === productId)
    ).length;

    console.log(
      "Assembly progress for product",
      productId,
      ":",
      assembled,
      "/",
      targetQuantity
    );
    return { assembled, target: targetQuantity };
  };

  const getProjectStatus = (dueDate: string, products: Project["products"], projectId: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isCompleted = products.every((product) => {

      const { assembled, target } = getAssemblyProgress(projectId, (product.item as InventoryItem)._id, product.quantity)
      return assembled >= target
    })

    if (isCompleted) {
      return {
        status: "Completed",
        variant: "default" as const,
        bgColor: "bg-green-100 text-green-800 border-green-200",
      }
    } else if (diffDays < 0) {
      return { status: "Overdue", variant: "destructive" as const, bgColor: "" };
    } else if (diffDays <= 7) {
      return { status: "Due Soon", variant: "secondary" as const, bgColor: "" };
    } else {
      return { status: "Active", variant: "default" as const, bgColor: "" };
    }
  };

  const StockAdjustmentDialog = ({
    isOpen,
    onOpenChange,
    adjustments,
  }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    adjustments: StockAdjustment[];
  }) => {
    function compareStocks(item: InventoryItem): "GT" | "EQ" | "LT" {
      const inventoryItems = inventory.filter(i => i._id == item._id);
      if (inventoryItems.length !== 1) throw new Error(`Item ${item.itemName} is not a part of the inventory`);
      if (inventoryItems[0].stock == item.stock) return "EQ";
      if (inventoryItems[0].stock > item.stock) return "GT";
      if (inventoryItems[0].stock < item.stock) return "LT";
      throw new Error(`Item ${item.itemName} is not a part of the inventory`);
    }

    function getBadgeByStockAdjustment(item: InventoryItem) {
      if ((item.minStock === undefined && item.stock <= 0) || (item.stock <= item.minStock)) {
        return (
          <Badge variant="destructive" className="text-xs">
            Low
          </Badge>)
      }
      switch (compareStocks(item)) {
        case "GT":
          return <Badge variant="outline" className="text-xs">
            Used
          </Badge>
        case "LT":
          return <Badge variant="secondary" className="text-xs">
            Added
          </Badge>
        default:
          return <></>
      }
    }

    const predictedInventory = inventoryService.applyStockAdjustments(
      inventory,
      adjustments,
    );
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Predicted Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Predicted Quantity</TableHead>
                  <TableHead># to be used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictedInventory.map((inventoryItem, index) => (
                  <TableRow key={`item-${index}`}>
                    <TableCell>
                      <Label htmlFor="name">{inventoryItem.itemName}</Label>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="w-20 text-center">
                          {inventoryItem.stock}
                        </span>
                        {getBadgeByStockAdjustment(inventoryItem)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-center">
                          {adjustments.filter(a => a._id === inventoryItem._id).length > 0 && adjustments.filter(a => a._id === inventoryItem._id)[0]?.amount * -1}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              type="submit"
              onClick={() => setIsPredictedStockOpen(false)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    const { status } = getProjectStatus(project.dueDate.toString(), project.products, project._id)
    console.log(project.name, status);

    if (!showOverdue && status === "Overdue") return false;
    if (!showCompleted && status === "Completed") return false;

    return true
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your project timeline and deadlines
          </p>
        </div>
        <Button onClick={handleNewProject}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            All Projects ({filteredProjects.length})
          </CardTitle>
          <CardDescription>
            Track project progress and manage deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showOverdue ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOverdue(!showOverdue)}
              >
                Show Overdue
              </Button>
              <Button
                variant={showCompleted ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                Show Completed
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => {
                    const { status, variant, bgColor } = getProjectStatus(
                      project.dueDate.toString(),
                      project.products,
                      project._id
                    );
                    const isExpanded = expandedRows.has(project._id);
                    return (
                      <React.Fragment key={project._id}>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(project._id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {project.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(project.dueDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {status === "Completed" ? (
                              <Badge className={bgColor}>{status}</Badge>
                            ) : (
                              <Badge variant={variant}>{status}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {project.products.length} products
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(project)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={7} className="p-0">
                              <div className="bg-muted/30 p-4 border-t">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  Project Products
                                </h4>
                                {project.products.length === 0 ? (
                                  <p className="text-muted-foreground text-sm">
                                    No products assigned to this project
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {project.products.map((product, index) => {
                                      const { assembled, target } =
                                        getAssemblyProgress(
                                          project._id,
                                          (product.item as InventoryItem)._id,
                                          product.quantity
                                        );
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between bg-background p-3 rounded-md border"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="font-medium">
                                              {(product.item as InventoryItem).itemName}
                                            </span>
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {(product.item as InventoryItem).sku}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <span className="text-sm text-muted-foreground">
                                              Assembly Progress: {assembled}/
                                              {target}
                                            </span>
                                            <div className="w-20 bg-muted rounded-full h-2">
                                              <div
                                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                  width: `${target > 0
                                                    ? (assembled / target) *
                                                    100
                                                    : 0
                                                    }%`,
                                                }}
                                              ></div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update the project details below."
                : "Add a new project to track progress and deadlines."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate as string}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Project Products</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProductComponent}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
                {formData.products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No products added yet
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {formData.products.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-md"
                      >
                        <div className="flex-1">
                          <Label
                            htmlFor={`product-${index}`}
                            className="text-sm"
                          >
                            Product
                          </Label>
                          <select
                            id={`product-${index}`}
                            value={product.item as string}
                            onChange={(e) =>
                              updateProductComponent(
                                index,
                                "item",
                                e.target.value
                              )
                            }
                            className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                            required
                          >
                            <option value="">Select a product</option>
                            {products.map((item) => (
                              <option key={item._id} value={item._id}>
                                {item.itemName} ({item.sku})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <Label
                            htmlFor={`quantity-${index}`}
                            className="text-sm"
                          >
                            Quantity
                          </Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) =>
                              updateProductComponent(
                                index,
                                "quantity",
                                Number.parseInt(e.target.value) || 1
                              )
                            }
                            className="mt-1"
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProductComponent(index)}
                          className="mt-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewProjectOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingProject ? "Update Project" : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {inventoryAdjustments && inventory && (
        <StockAdjustmentDialog
          isOpen={isPredictedStockOpen}
          onOpenChange={setIsPredictedStockOpen}
          adjustments={inventoryAdjustments}
        />
      )}
    </div>
  );
}

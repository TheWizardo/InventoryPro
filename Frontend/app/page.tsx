"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Plus, Minus, Save, X, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { VendorAutocomplete } from "@/components/vendor-autocomplete";
import { inventoryService, logService, employeeService } from "@/lib/services";
import { InventoryItem, Employee, LogRegistryBackend } from "@/lib/types";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface StockAdjustmentString {
  _id: string;
  quantity: string; // Changed from number to string to prevent flickering
}

interface StockEdit {
  _id: string;
  newStock: number;
}

type SortField = "itemName" | "sku" | "stock" | "vendor";
type SortDirection = "asc" | "desc";

const StockAdjustmentDialog = ({
  isOpen,
  onOpenChange,
  isRemoval,
  stockAdjustments,
  inventory,
  employees,
  updateStockAdjustment,
  removeStockAdjustmentRow,
  addStockAdjustmentRow,
  handleStockAdjustment,
  setEmployee,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isRemoval: boolean;
  stockAdjustments: StockAdjustmentString[];
  inventory: InventoryItem[];
  employees: Employee[];
  updateStockAdjustment: (
    index: number,
    field: keyof StockAdjustmentString,
    value: string | number
  ) => void;
  removeStockAdjustmentRow: (index: number) => void;
  addStockAdjustmentRow: () => void;
  handleStockAdjustment: (isRemoval: boolean) => void;
  setEmployee: (id: string) => void;
}) => {
  const [validationErrors, setValidationErrors] = useState<{
    [key: number]: { item?: boolean; quantity?: boolean };
  }>({});

  const validateRow = (index: number, adjustment: StockAdjustmentString) => {
    const errors: { item?: boolean; quantity?: boolean } = {};

    if (!adjustment._id) {
      errors.item = true;
    }

    const quantity = Number(adjustment.quantity);
    if (!adjustment.quantity || quantity <= 0 || isNaN(quantity)) {
      errors.quantity = true;
    }

    setValidationErrors((prev) => ({
      ...prev,
      [index]: errors,
    }));

    return Object.keys(errors).length === 0;
  };

  const handleItemChange = (index: number, value: string) => {
    updateStockAdjustment(index, "_id", value);
    // Clear item error when user selects an item
    setValidationErrors((prev) => ({
      ...prev,
      [index]: { ...prev[index], item: false },
    }));
  };

  const handleQuantityChange = (index: number, value: string) => {
    updateStockAdjustment(index, "quantity", value);
    // Clear quantity error when user types
    setValidationErrors((prev) => ({
      ...prev,
      [index]: { ...prev[index], quantity: false },
    }));
  };

  const handleSubmit = () => {
    let hasErrors = false;
    stockAdjustments.forEach((adjustment, index) => {
      if (!validateRow(index, adjustment)) {
        hasErrors = true;
      }
    });

    if (!hasErrors) {
      handleStockAdjustment(isRemoval);
      setValidationErrors({}); // Clear errors on successful submit
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isRemoval ? "Remove from Stock" : "Add to Stock"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockAdjustments.map((adjustment, index) => (
                <TableRow key={`adjustment-${index}`}>
                  <TableCell>
                    <div className="space-y-1">
                      <Select
                        value={adjustment._id}
                        onValueChange={(value) =>
                          handleItemChange(index, value)
                        }
                      >
                        <SelectTrigger
                          className={
                            validationErrors[index]?.item
                              ? "border-red-500 focus:border-red-500"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((item) => (
                            <SelectItem key={item._id} value={item._id}>
                              {item.itemName} (Stock: {item.stock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors[index]?.item && (
                        <p className="text-xs text-red-500">
                          Please select an item
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Input
                        type="number"
                        min="1"
                        value={adjustment.quantity}
                        onChange={(e) =>
                          handleQuantityChange(index, e.target.value)
                        }
                        placeholder="Enter quantity"
                        className={
                          validationErrors[index]?.quantity
                            ? "border-red-500 focus:border-red-500"
                            : ""
                        }
                      />
                      {validationErrors[index]?.quantity && (
                        <p className="text-xs text-red-500">
                          Please enter a valid quantity
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeStockAdjustmentRow(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex gap-2">
            <Button onClick={addStockAdjustmentRow} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee">Employee *</Label>
          <Select
            onValueChange={(value) => setEmployee(value)}
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
        <div className="flex gap-2">
          <Button onClick={handleSubmit}>
            {isRemoval ? "Remove Stock" : "Add Stock"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>();
  const [stockEdits, setStockEdits] = useState<StockEdit[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustmentString[]>(
    []
  );
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isRemoveStockOpen, setIsRemoveStockOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false); // Add state for new item dialog
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("itemName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isStockEditable, setIsStockEditable] = useState(false);
  const [showNonSupported, setShowNonSupported] = useState(false);
  const newItemTemplate = {
    itemName: "",
    sku: "",
    vendor: "",
    link: "",
    isSupported: true,
    isAssembledProduct: false,
    stock: 0,
    minStock: 0,
  }
  const [newItem, setNewItem] = useState<Omit<InventoryItem, "_id">>({
    itemName: "",
    sku: "",
    vendor: "",
    link: "",
    isSupported: true,
    isAssembledProduct: false,
    stock: 0,
    minStock: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
    fetchEmployees();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await inventoryService.fetchAll();
      const data = await response.json();
      // Backend now filters items with no components, so no need to filter here
      setInventory(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch inventory data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.fetchAll();
      const data = await response.json();
      const activeEmployees = data.filter((emp: Employee) => emp.isEmployeed);
      setAllEmployees(activeEmployees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const handleStockChange = (itemId: string, newStock: number) => {
    setStockEdits((prev) => {
      const existing = prev.find((edit) => edit._id === itemId);
      if (existing) {
        return prev.map((edit) =>
          edit._id === itemId ? { ...edit, newStock } : edit
        );
      } else {
        return [...prev, { _id: itemId, newStock }];
      }
    });
  };

  const getCurrentStock = (item: InventoryItem) => {
    const edit = stockEdits.find((edit) => edit._id === item._id);
    return edit ? edit.newStock : item.stock;
  };

  const getMinStock = (item: InventoryItem) => {
    if (item.minStock === undefined) return 0;
    return item.minStock;
  };

  const handleSaveAllChanges = async () => {
    if (employeeId === "" || employeeId === undefined) {
      toast({
        title: "Error",
        description: "Please fill out employee",
        variant: "destructive",
      });
      return;
    }

    if (stockEdits.length === 0) {
      toast({
        title: "No Changes",
        description: "No stock changes to save",
      });
      return;
    }

    try {
      const response = await inventoryService.overrideStock(stockEdits);
      const logRegistry: LogRegistryBackend = {
        items: stockEdits.map(e => ({ item: e._id, quantity: e.newStock })),
        description: "Stock Overwrite",
        employee: employeeId,
        registrationDate: (new Date()).toISOString()
      }
      await logService.registerLog(logRegistry);
      if (response.ok) {
        await fetchInventory();
        setStockEdits([]);
        setIsStockEditable(false); // Reset editing mode after save
        toast({
          title: "Success",
          description: `Updated stock for ${stockEdits.length} items`,
        });
      }
      setEmployeeId(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    }
  };

  const handleCancelAllChanges = () => {
    setStockEdits([]);
    setIsStockEditable(false); // Reset editing mode on cancel
    toast({
      title: "Changes Cancelled",
      description: "All stock changes have been cancelled",
    });
  };

  const updateStockAdjustment = useCallback(
    (index: number, field: keyof StockAdjustmentString, value: string | number) => {
      setStockAdjustments((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const addStockAdjustmentRow = useCallback(() => {
    setStockAdjustments((prev) => [...prev, { _id: "", quantity: "" }]);
  }, []);

  const removeStockAdjustmentRow = useCallback((index: number) => {
    setStockAdjustments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleStockAdjustment = async (isRemoval: boolean) => {
    if (employeeId === "" || employeeId === undefined) {
      toast({
        title: "Error",
        description: "Please fill out employee",
        variant: "destructive",
      });
      return;
    }

    const validAdjustments = stockAdjustments.filter((adj) => {
      const quantity = Number(adj.quantity);
      return adj._id && quantity > 0 && !isNaN(quantity);
    });

    if (validAdjustments.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid adjustment",
        variant: "destructive",
      });
      return;
    }

    try {
      const adjustments = validAdjustments.map((adj) => ({
        _id: adj._id,
        amount: isRemoval ? -Number(adj.quantity) : Number(adj.quantity), // Parse to number here
      }));

      const response = await inventoryService.adjustStock(adjustments);
      const logRegistry: LogRegistryBackend = {
        items: adjustments.map(e => ({ item: e._id, quantity: e.amount * (isRemoval ? -1 : 1) })),
        description: isRemoval ? "Removed Items" : "Added Items",
        employee: employeeId,
        registrationDate: (new Date()).toISOString()
      }
      await logService.registerLog(logRegistry);
      if (response.ok) {
        await fetchInventory();
        setStockAdjustments([]);
        setIsAddStockOpen(false);
        setIsRemoveStockOpen(false);
        toast({
          title: "Success",
          description: `Stock ${isRemoval ? "removed" : "added"} successfully`,
        });
      }
      setEmployeeId(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to adjust stock",
        variant: "destructive",
      });
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedInventory = (items: InventoryItem[]) => {
    return [...items].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getFilteredAndSortedInventory = () => {
    let filtered = inventory;
    if (!showNonSupported) {
      filtered = inventory.filter((item) => item.isSupported);
    }
    return getSortedInventory(filtered);
  };

  const getItemRowClassName = (item: InventoryItem) => {
    let baseClass = "hover:bg-muted/50";

    if (!item.isSupported) {
      baseClass +=
        " opacity-60 text-muted-foreground bg-gray-50/50 hover:bg-gray-100/50";
    } else if (item.isAssembledProduct) {
      // Products - subtle blue tint (only when supported)
      baseClass += " bg-blue-50/50 hover:bg-blue-100/50";
    } else if (item.components && item.components.length > 0) {
      // Complex items - subtle green tint (only when supported)
      baseClass += " bg-green-50/50 hover:bg-green-100/50";
    }

    return baseClass;
  };


  const handleCreateItem = async () => {
    // Add function to create new item
    if (!newItem.itemName || !newItem.sku || !newItem.vendor || !newItem.stock || !newItem.minStock) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const newItemToAdd = {
        ...newItem,
        isAssembledProduct: false, // Always false for items
        components: undefined, // No components for items
        _id: undefined
      } as unknown as InventoryItem;
      const response = await inventoryService.addItem(newItemToAdd);

      if (response.ok) {
        await fetchInventory();
        setIsNewItemOpen(false);
        setNewItem({ ...newItemTemplate });
        toast({
          title: "Success",
          description: "Item created successfully",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create item",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  const displayedInventory = getFilteredAndSortedInventory();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your inventory stock levels and adjustments
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">
              Current Inventory
            </CardTitle>
            <div className="flex gap-2 items-center">
              <Button
                variant={showNonSupported ? "default" : "outline"}
                size="sm"
                onClick={() => setShowNonSupported(!showNonSupported)}
              >
                {showNonSupported ? "Hide Non-Supported" : "Show Non-Supported"}
              </Button>
              <Dialog open={isNewItemOpen} onOpenChange={setIsNewItemOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="itemName">Item Name *</Label>
                      <Input
                        id="itemName"
                        value={newItem.itemName}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            itemName: e.target.value,
                          }))
                        }
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={newItem.sku}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            sku: e.target.value,
                          }))
                        }
                        placeholder="Enter SKU"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock *</Label>
                      <Input
                        id="stock"
                        value={newItem.stock}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            stock: +e.target.value,
                          }))
                        }
                        placeholder="Enter current stock"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Minimum Stock *</Label>
                      <Input
                        id="minStock"
                        value={newItem.minStock}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            minStock: +e.target.value,
                          }))
                        }
                        placeholder="Enter minimum allowed stock"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Vendor *</Label>
                      <VendorAutocomplete
                        value={newItem.vendor}
                        onChange={(value) =>
                          setNewItem((prev) => ({ ...prev, vendor: value }))
                        }
                        placeholder="Enter vendor name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link">Link (Optional)</Label>
                      <Input
                        id="link"
                        value={newItem.link}
                        onChange={(e) =>
                          setNewItem((prev) => ({
                            ...prev,
                            link: e.target.value,
                          }))
                        }
                        placeholder="Enter item link"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isSupported"
                        checked={newItem.isSupported}
                        onCheckedChange={(checked) =>
                          setNewItem((prev) => ({
                            ...prev,
                            isSupported: !!checked,
                          }))
                        }
                      />
                      <Label htmlFor="isSupported">
                        This item is supported
                      </Label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsNewItemOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateItem}>Create Item</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {!isStockEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStockEditable(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Stocks
                </Button>
              )}
              {isStockEditable && (
                <>
                  <Button variant="outline" onClick={handleCancelAllChanges}>
                    Cancel Changes
                  </Button>
                  <Button onClick={handleSaveAllChanges}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("itemName")}
                >
                  Item Name
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("sku")}
                >
                  SKU
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("stock")}
                >
                  Stock
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("vendor")}
                >
                  Vendor
                </TableHead>
                <TableHead>Supported</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedInventory.map((item) => {

                return (
                  <TableRow
                    key={item._id}
                    className={getItemRowClassName(item)}
                  >
                    <TableCell className="font-medium">
                      {item.itemName}
                    </TableCell>
                    <TableCell>
                      {item.sku}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isStockEditable ? (
                          <Input
                            type="number"
                            value={getCurrentStock(item)}
                            onChange={(e) =>
                              handleStockChange(
                                item._id,
                                Number.parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20"
                            min="0"
                          />
                        ) : (
                          <span className="w-20 text-center">
                            {getCurrentStock(item)}
                          </span>
                        )}
                        {getCurrentStock(item) <= getMinStock(item) && (
                          <Badge variant="destructive" className="text-xs">
                            Low
                          </Badge>
                        )}
                        {stockEdits.find((edit) => edit._id === item._id) && (
                          <Badge variant="secondary" className="text-xs">
                            Modified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.vendor}
                    </TableCell>
                    <TableCell>
                      <Checkbox checked={item.isSupported} disabled />
                    </TableCell>
                    <TableCell>
                      <Link href={`/${item._id}`}>
                        <Button size="sm" className="w-full">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {isStockEditable && <div className="space-y-2">
            <Label htmlFor="employee">Employee *</Label>
            <Select
              onValueChange={(value) => setEmployeeId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {allEmployees.map((employee) => (
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
          </div>}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setStockAdjustments([{ _id: "", quantity: "" }])}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Stock
            </Button>
          </DialogTrigger>
        </Dialog>

        <Dialog open={isRemoveStockOpen} onOpenChange={setIsRemoveStockOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              onClick={() => setStockAdjustments([{ _id: "", quantity: "" }])}
            >
              <Minus className="h-4 w-4 mr-2" />
              Remove from Stock
            </Button>
          </DialogTrigger>
        </Dialog>

        <StockAdjustmentDialog
          isOpen={isAddStockOpen}
          onOpenChange={setIsAddStockOpen}
          isRemoval={false}
          stockAdjustments={stockAdjustments}
          inventory={inventory}
          employees={allEmployees}
          updateStockAdjustment={updateStockAdjustment}
          removeStockAdjustmentRow={removeStockAdjustmentRow}
          addStockAdjustmentRow={addStockAdjustmentRow}
          handleStockAdjustment={handleStockAdjustment}
          setEmployee={setEmployeeId}
        />

        <StockAdjustmentDialog
          isOpen={isRemoveStockOpen}
          onOpenChange={setIsRemoveStockOpen}
          isRemoval={true}
          stockAdjustments={stockAdjustments}
          inventory={inventory}
          employees={allEmployees}
          updateStockAdjustment={updateStockAdjustment}
          removeStockAdjustmentRow={removeStockAdjustmentRow}
          addStockAdjustmentRow={addStockAdjustmentRow}
          handleStockAdjustment={handleStockAdjustment}
          setEmployee={setEmployeeId}
        />
      </div>
    </div>
  );
}

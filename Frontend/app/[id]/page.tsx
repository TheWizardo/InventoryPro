"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { VendorAutocomplete } from "@/components/vendor-autocomplete";
import { ArrowLeft, Save, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Employee, InventoryItem, LogRegistryBackend } from "@/lib/types";
import { employeeService, inventoryService, logService } from "@/lib/services";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState<InventoryItem | null>(null);
  const [employeeId, setEmployeeId] = useState<string>();
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedProduct, setEditedProduct] = useState<InventoryItem | null>(
    null
  );

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
      fetchEmployees();
    }
  }, [params.id]);

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
  const fetchProduct = async (id: string) => {
    try {
      const response = await inventoryService.fetchOne(id);
      const data = await response.json();
      setProduct(data);
      setEditedProduct({ ...data });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof InventoryItem,
    value: string | boolean | number
  ) => {
    if (!editedProduct) return;
    setEditedProduct({ ...editedProduct, [field]: value });
  };

  const handleSave = async () => {
    if (!editedProduct) return;

    if (editedProduct.stock !== product?.stock) {
      if (employeeId === "" || employeeId === undefined) {
        toast({
          title: "Error",
          description: "Please fill out employee",
          variant: "destructive",
        });
        return;
      }
      const logRegistry: LogRegistryBackend = {
        items: [{ item: editedProduct._id, quantity: editedProduct.stock }],
        description: "Stock Overwrite",
        employee: employeeId,
        registrationDate: (new Date()).toISOString()
      }
      await logService.registerLog(logRegistry);
    }

    setSaving(true);
    try {
      const productToSave = {
        ...editedProduct,
        components: editedProduct.components?.map((component) => ({
          item:
            typeof component.item === "string"
              ? component.item
              : component.item._id,
          quantity: component.quantity,
        })),
      };

      const response = await inventoryService.updateItem(
        editedProduct._id,
        productToSave
      );
      if (response.ok) {
        const updatedProduct = await response.json();
        setProduct(updatedProduct);
        setEditedProduct({ ...updatedProduct });
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        throw new Error("Failed to update product");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading product details...
      </div>
    );
  }

  if (!product || !editedProduct) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Item not found</h3>
            <Link href="/">
              <Button>Back to Inventory</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.itemName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">SKU: {product.sku}</Badge>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Item Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                value={editedProduct.itemName || ""}
                onChange={(e) => handleInputChange("itemName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={editedProduct.sku || ""}
                onChange={(e) => handleInputChange("sku", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <VendorAutocomplete
                value={editedProduct.vendor}
                onChange={(value) => handleInputChange("vendor", value)}
                placeholder="Enter vendor name"
              />
            </div>
            <div className="space-y-2">
              <div className="flex">
                <Label htmlFor="stock">Stock</Label>
                {editedProduct?.stock !== product?.stock && <Badge variant="secondary" className="text-xs">
                  Modified
                </Badge>}
              </div>
              <Input
                id="stock"
                type="number"
                value={editedProduct.stock || 0}
                onChange={(e) =>
                  handleInputChange(
                    "stock",
                    +e.target.value
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input
                id="minStock"
                type="number"
                value={editedProduct.minStock || 0}
                onChange={(e) =>
                  handleInputChange(
                    "minStock",
                    +e.target.value
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="link"
                  value={editedProduct.link || ""}
                  onChange={(e) => handleInputChange("link", e.target.value)}
                  placeholder="https://..."
                />
                {editedProduct.link && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={editedProduct.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Item Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isSupported"
                checked={editedProduct.isSupported || false}
                onChange={(e) =>
                  handleInputChange("isSupported", e.target.checked)
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="isSupported">Supported Product</Label>
            </div>
            {editedProduct?.stock !== product?.stock && <div className="space-y-2">
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
      </div>
    </div>
  );
}

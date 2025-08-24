"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VendorAutocomplete } from "@/components/vendor-autocomplete";
import { ArrowLeft, Save, Plus, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem, ProductComponent } from "@/lib/types";
import { inventoryService, productService } from "@/lib/services";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<InventoryItem | null>(null);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedProduct, setEditedProduct] = useState<InventoryItem | null>(
    null
  );

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
      fetchAvailableItems();
    }
  }, [params.id]);

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

  const fetchAvailableItems = async () => {
    try {
      const basicItemsResponse = await inventoryService.fetchAll();
      if (!basicItemsResponse.ok) {
        throw new Error(
          `Failed to fetch basic items: ${basicItemsResponse.statusText}`
        );
      }
      const basicItems = await basicItemsResponse.json();

      const complexItemsResponse = await productService.fetchComplexItems();
      if (!complexItemsResponse.ok) {
        throw new Error(
          `Failed to fetch complex items: ${complexItemsResponse.statusText}`
        );
      }
      const complexItems = await complexItemsResponse.json();

      const allAvailableItems = [
        ...basicItems.filter((item: InventoryItem) => item._id !== params.id),
        ...complexItems.filter(
          (item: InventoryItem) =>
            item._id !== params.id && !item.isAssembledProduct
        ),
      ];

      setAvailableItems(allAvailableItems);
    } catch (error) {
      console.error("Failed to fetch available items:", error);
      toast({
        title: "Error",
        description: "Failed to load available components",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (
    field: keyof InventoryItem,
    value: string | boolean
  ) => {
    if (!editedProduct) return;
    setEditedProduct({ ...editedProduct, [field]: value });
  };

  const handleComponentChange = (
    index: number,
    field: keyof ProductComponent,
    value: string | number
  ) => {
    if (!editedProduct || !editedProduct.components) return;
    const updatedComponents = [...editedProduct.components];
    updatedComponents[index] = { ...updatedComponents[index], [field]: value };
    setEditedProduct({ ...editedProduct, components: updatedComponents });
  };

  const addComponent = () => {
    if (!editedProduct) return;
    const components = editedProduct.components || [];
    setEditedProduct({
      ...editedProduct,
      components: [...components, { item: "", quantity: 1 }],
    });
  };

  const removeComponent = (index: number) => {
    if (!editedProduct || !editedProduct.components) return;
    const updatedComponents = editedProduct.components.filter(
      (_, i) => i !== index
    );
    setEditedProduct({ ...editedProduct, components: updatedComponents });
  };

  const handleSave = async () => {
    if (!editedProduct) return;

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
            <h3 className="text-lg font-semibold mb-2">Product not found</h3>
            <Link href="/products">
              <Button>Back to Products</Button>
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
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.itemName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={product.isAssembledProduct ? "default" : "outline"}
              >
                {product.isAssembledProduct ? "Assembly Product" : "Component"}
              </Badge>
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
            <CardTitle>Product Information</CardTitle>
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
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={editedProduct.stock || 0}
                onChange={(e) =>
                  handleInputChange(
                    "stock",
                    Number.parseInt(e.target.value) || 0
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
            <CardTitle>Product Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAssembledProduct"
                checked={editedProduct.isAssembledProduct || false}
                onChange={(e) =>
                  handleInputChange("isAssembledProduct", e.target.checked)
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="isAssembledProduct">Assembly Product</Label>
            </div>
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
          </CardContent>
        </Card>
      </div>

      {editedProduct.isAssembledProduct && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Components</CardTitle>
              <Button onClick={addComponent} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editedProduct.components && editedProduct.components.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editedProduct.components.map((component, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={
                            typeof component.item === "string"
                              ? component.item
                              : component.item._id
                          }
                          onValueChange={(value) =>
                            handleComponentChange(index, "item", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select component" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableItems.map((item) => (
                              <SelectItem key={item._id} value={item._id}>
                                <div className="flex items-center gap-2">
                                  <span>{item.itemName}</span>
                                  <Badge
                                    variant={
                                      item.isSupported ? "default" : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {item.isSupported
                                      ? "Supported"
                                      : "Non-supported"}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    (Stock: {item.stock})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={component.quantity || 1}
                          onChange={(e) =>
                            handleComponentChange(
                              index,
                              "quantity",
                              Number.parseInt(e.target.value) || 1
                            )
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeComponent(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No components added yet. Click "Add Component" to get started.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

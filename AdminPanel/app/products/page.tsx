"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { VendorAutocomplete } from "@/components/vendor-autocomplete"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Package, Settings, Plus, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem } from "@/lib/types";
import { inventoryService, productService } from "@/lib/services";
import { useLicense } from "@/components/license-provider";

export default function ProductsPage() {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [complexItems, setComplexItems] = useState<InventoryItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryItem[]>([]);
  const [filteredComplexItems, setFilteredComplexItems] = useState<
    InventoryItem[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isDeleteErrorOpen, setIsDeleteErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [newProduct, setNewProduct] = useState<Omit<InventoryItem, "_id">>({
    itemName: "",
    stock: 1,
    minStock: 0,
    sku: "",
    vendor: "v-armed", // Default vendor to "v-armed"
    link: "",
    isAssembledProduct: false,
    isSupported: true,
    components: [
      { item: "", quantity: 1 },
      { item: "", quantity: 1 },
    ], // Always start with 2 components by default
  });
  const [showNonSupported, setShowNonSupported] = useState(false); // Added state for showing Unsupported items
  const [availableComponents, setAvailableComponents] = useState<
    InventoryItem[]
  >([]); // Added state for available components
  const { toast } = useToast();
  const { fetchLicense } = useLicense()

  useEffect(() => {
    fetchProducts();
    fetchAvailableComponents(); // Fetch available components on mount
    fetchLicense();
  }, []);

  useEffect(() => {
    const filteredProds = products.filter(
      (product) =>
        product.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredComplex = complexItems.filter(
      (item) =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filteredProds);
    setFilteredComplexItems(filteredComplex);
  }, [products, complexItems, searchTerm]);

  const fetchAvailableComponents = async () => {
    try {
      const itemsResponse = await inventoryService.fetchAll();
      if (!itemsResponse.ok) {
        throw new Error(
          `Failed to fetch items: ${itemsResponse.status} ${itemsResponse.statusText}`
        );
      }
      const itemsData = await itemsResponse.json();

      const complexResponse = await productService.fetchComplexItems();
      if (!complexResponse.ok) {
        throw new Error(
          `Failed to fetch complex items: ${complexResponse.status} ${complexResponse.statusText}`
        );
      }
      const complexData = await complexResponse.json();

      const availableForComponents = [
        ...itemsData, // Items with no components
        ...complexData.filter(
          (item: InventoryItem) => item.components && item.components.length > 0
        ), // Complex items with components
      ];

      setAvailableComponents(availableForComponents);
    } catch (error) {
      console.error("Failed to fetch available components:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available components for dropdown",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const productsResponse = await productService.fetchAll();
      if (!productsResponse.ok) {
        throw new Error(
          `Failed to fetch products: ${productsResponse.status} ${productsResponse.statusText}`
        );
      }
      const productsData = await productsResponse.json();

      const complexResponse = await productService.fetchComplexItems();
      if (!complexResponse.ok) {
        throw new Error(
          `Failed to fetch complex items: ${complexResponse.status} ${complexResponse.statusText}`
        );
      }
      const complexData = await complexResponse.json();

      const filteredProducts = showNonSupported
        ? productsData
        : productsData.filter((item: InventoryItem) => item.isSupported);

      const filteredComplex = showNonSupported
        ? complexData.filter(
          (item: InventoryItem) =>
            item.components && item.components.length > 0
        )
        : complexData.filter(
          (item: InventoryItem) =>
            item.isSupported && item.components && item.components.length > 0
        );

      setProducts(filteredProducts);
      setComplexItems(filteredComplex);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [showNonSupported]);

  const addComponentRow = () => {
    setNewProduct((prev) => ({
      ...prev,
      components: [...(prev.components || []), { item: "", quantity: 1 }],
    }));
  };

  const updateComponent = (
    index: number,
    field: "item" | "quantity",
    value: string | number
  ) => {
    setNewProduct((prev) => ({
      ...prev,
      components: prev.components?.map((comp, i) =>
        i === index ? { ...comp, [field]: value } : comp
      ),
    }));
  };

  const removeComponent = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      components: prev.components?.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await productService.deleteProduct(id);
      const msg = await response.text();
      try {
        JSON.parse(msg);
        toast({
          title: "Success",
          description: `Product deleted successfully`,
        });
        fetchProducts()
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
        description: "Failed to delete project",
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
              Unable to delete project
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

  const handleCreateProduct = async () => {
    if (!newProduct.itemName || !newProduct.sku || !newProduct.vendor) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newProduct.components && newProduct.components.length < 2) {
      toast({
        title: "Error",
        description: "Product must have at least two components",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await inventoryService.addItem({
        ...newProduct,
        stock: 0,
      } as InventoryItem);

      if (response.ok) {
        await fetchProducts();
        fetchAvailableComponents();
        setIsNewProductOpen(false);
        setNewProduct({
          itemName: "",
          sku: "",
          stock: 0,
          minStock: 0,
          vendor: "v-armed", // Reset to default vendor
          link: "",
          isAssembledProduct: false,
          isSupported: true,
          components: [
            { item: "", quantity: 1 },
            { item: "", quantity: 1 },
          ], // Reset with 2 components
        });
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading products...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Products Management</h1>
          <p className="text-muted-foreground">
            Manage Complex items and Product blueprints
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showNonSupported ? "default" : "outline"}
            onClick={() => setShowNonSupported(!showNonSupported)}
          >
            {showNonSupported
              ? "Hide Unsupported"
              : "Show Unsupported Items"}
          </Button>
          <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemName">Product Name *</Label>
                    <Input
                      id="itemName"
                      value={newProduct.itemName}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          itemName: e.target.value,
                        }))
                      }
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={newProduct.sku}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          sku: e.target.value,
                        }))
                      }
                      placeholder="Enter SKU"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor *</Label>
                    <VendorAutocomplete
                      value={newProduct.vendor}
                      onChange={(value) =>
                        setNewProduct((prev) => ({ ...prev, vendor: value }))
                      }
                      placeholder="Enter vendor name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link">Link (Optional)</Label>
                    <Input
                      id="link"
                      value={newProduct.link}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          link: e.target.value,
                        }))
                      }
                      placeholder="Enter product link"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAssembledProduct"
                    checked={newProduct.isAssembledProduct}
                    onCheckedChange={(checked) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        isAssembledProduct: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="isAssembledProduct">
                    This is an assembly product
                  </Label>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Components</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addComponentRow}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Component
                    </Button>
                  </div>

                  {newProduct.components?.map((component, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select
                          value={component.item as string}
                          onValueChange={(value) =>
                            updateComponent(index, "item", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select component" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableComponents.map((item) => (
                              <SelectItem key={item._id} value={item._id}>
                                <span>{item.itemName}</span>
                                {item.components && <Badge
                                  variant={"outline"}
                                  className="text-xs"
                                >
                                  Complex
                                </Badge>}
                                {!item.isSupported && <Badge
                                  variant={"destructive"}
                                  className="text-xs"
                                >
                                  Not-supported
                                </Badge>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="1"
                          value={component.quantity}
                          onChange={(e) =>
                            updateComponent(
                              index,
                              "quantity",
                              Number.parseInt(e.target.value) || 1
                            )
                          }
                          placeholder="Qty"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeComponent(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsNewProductOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProduct}>Create Product</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products by name, SKU, or vendor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Products</h2>
          <Badge variant="secondary">{filteredProducts.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product._id}
              className="hover:shadow-md transition-shadow relative"
            >
              {product.isSupported && inventoryService.doesItemUsesNonSupportedComponents(product) && <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                    >
                      !
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This product contains unsupported sub-items</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Link href={`/products/${product._id}`}>
                      <CardTitle
                        className={
                          "text-lg cursor-pointer transition-colors" +
                          (product.isSupported
                            ? " text-primary"
                            : " text-muted-foreground")
                        }
                      >
                        {product.itemName}
                        {!product.isSupported && <Badge variant="secondary">Not-Supported</Badge>}
                      </CardTitle>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.sku}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.components && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Components:</span>
                    <span className="font-medium">
                      {product.components.length}
                    </span>
                  </div>
                )}
                <div className="w-full flex justify-evenly">
                  <Link href={`/products/${product._id}`} className="w-4/9">
                    <Button size="sm" className="w-full">
                      <Settings className="h-4 w-2 mr-2" />
                      Manage
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product._id)}
                    className="text-destructive hover:text-destructive w-4/9"
                  >
                    <Trash2 className="h-4 w-2 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Complex Items</h2>
          <Badge variant="outline">{filteredComplexItems.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComplexItems.map((item) => (
            <Card key={item._id} className="hover:shadow-md transition-shadow relative">
              {item.isSupported && inventoryService.doesItemUsesNonSupportedComponents(item) && <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                    >
                      !
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This product contains unsupported sub-items</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Link href={`/products/${item._id}`}>
                      <CardTitle
                        className={
                          "text-lg cursor-pointer transition-colors" +
                          (item.isSupported
                            ? " text-primary"
                            : " text-muted-foreground")
                        }
                      >
                        {item.itemName}
                        {!item.isSupported && <Badge variant="secondary">Not-Supported</Badge>}
                      </CardTitle>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vendor:</span>
                  <span className="font-medium">{item.vendor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Components:</span>
                  <span className="font-medium">
                    {item.components?.length || 0}
                  </span>
                </div>
                <Link href={`/products/${item._id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <DeleteErrorModal
        isOpen={isDeleteErrorOpen}
        onOpenChange={setIsDeleteErrorOpen}
        handleSubmit={handleDeleteErrorSubmit}
        message={errorMessage} />

      {filteredProducts.length === 0 &&
        filteredComplexItems.length === 0 &&
        !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No products available"}
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

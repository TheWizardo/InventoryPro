export interface ProductComponent {
  item: InventoryItem;
  quantity: number;
}

export interface InventoryItem {
  _id: string;
  itemName: string;
  sku: string;
  stock: number;
  minStock: number;
  vendor: string;
  link?: string;
  isAssembledProduct: boolean;
  isSupported: boolean;
  components?: ProductComponent[];
}

export interface AssembledItem {
  _id: string;
  item: InventoryItem;
  employee: Employee;
  project: Project;
  productionDate: Date;
  serialNumber: string;
}

export interface Employee {
  _id: string;
  name: string;
  isEmployeed: boolean;
}

export interface Project {
  _id: string;
  name: string;
  dueDate: Date;
  products: ProductComponent[];
}

export interface BackendProject {
  name: string;
  dueDate: string;
  products: { item: string, quantity: number }[];
}

export interface StockAdjustment {
  _id: string;
  amount: number
}
export interface ProductComponent {
  item: InventoryItem | string;
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
  dueDate: Date | string;
  products: ProductComponent[];
  isCompleted: boolean;
}

export interface StockAdjustment {
  _id: string;
  amount: number
}

export interface LogRegistry {
  _id: string
  items: ProductComponent[];
  employee: Employee;
  description: string;
  registrationDate: Date;
}

export interface LogRegistryBackend {
  items: ProductComponent[];
  employee: Employee | string;
  description: string;
  registrationDate: Date | string;
}
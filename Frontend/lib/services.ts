import {
  InventoryItem,
  Employee,
  AssembledItem,
  ProductComponent,
  Project,
  StockAdjustment,
  BackendProject,
} from "./types";
import { getApiUrl, API_CONFIG } from "./config";

class BaseService {
  constructor() { }

  public async fetch(
    uri: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    payload: any = undefined
  ): Promise<Response> {
    if (method === "GET") {
      return await fetch(getApiUrl(uri));
    }
    return await fetch(getApiUrl(uri), {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  public async update<T>(
    uri: string,
    itemId: string,
    edits: Partial<T>
  ): Promise<Response> {
    return await this.fetch(uri, "PUT", edits);
  }

  public async add<T>(uri: string, newItem: T): Promise<Response> {
    return await this.fetch(uri, "POST", newItem);
  }
}

class InventoryService extends BaseService {
  constructor() {
    super();
  }

  public async fetchAll(): Promise<Response> {
    return await super.fetch(API_CONFIG.ENDPOINTS.INVENTORY);
  }

  public async fetchOne(id: string): Promise<Response> {
    return await super.fetch(`${API_CONFIG.ENDPOINTS.INVENTORY}/${id}`);
  }

  public async updateItem(
    itemId: string,
    edits: Partial<InventoryItem>
  ): Promise<Response> {
    return await super.update<InventoryItem>(
      `${API_CONFIG.ENDPOINTS.INVENTORY}/${itemId}`,
      itemId,
      edits
    );
  }

  public async addItem(newItem: InventoryItem): Promise<Response> {
    return await super.add<InventoryItem>(
      API_CONFIG.ENDPOINTS.INVENTORY,
      newItem
    );
  }

  public async overrideStock(edits: any): Promise<Response> {
    return await super.fetch(
      `${API_CONFIG.ENDPOINTS.INVENTORY}/override-stock`,
      "PATCH",
      edits
    );
  }

  public async adjustStock(adjustments: StockAdjustment[]): Promise<Response> {
    return await super.fetch(
      `${API_CONFIG.ENDPOINTS.INVENTORY}/adjust-stock`,
      "PATCH",
      adjustments
    );
  }

  public async getVendors(): Promise<Response> {
    return await super.fetch(`${API_CONFIG.ENDPOINTS.INVENTORY}/vendors`);
  }

  public flattenToLeafComponents(
    item: InventoryItem,
    multiplier = 1
  ): StockAdjustment[] {
    const result: Record<string, ProductComponent> = {};

    function recurse(current: InventoryItem, qty: number) {
      if (!current.components || current.components.length === 0) {
        // Leaf node → accumulate quantity
        const id = current._id.toString();
        if (!result[id]) {
          result[id] = { item: current, quantity: 0 };
        }
        result[id].quantity += qty;
      } else {
        // Complex → recurse into children
        for (const comp of current.components) {
          recurse(comp.item as InventoryItem, qty * comp.quantity);
        }
      }
    }

    recurse(item, multiplier);
    const results = Object.values(result);
    return results.map((i) => {
      return { _id: i.item._id, amount: i.quantity };
    });
  }

  public aggregateAdjustments(nested: StockAdjustment[][]): StockAdjustment[] {
    const map = new Map<string, number>();

    for (const arr of nested) {
      for (const adj of arr) {
        map.set(adj._id, (map.get(adj._id) || 0) + adj.amount);
      }
    }

    return Array.from(map, ([id, amount]) => ({ _id: id, amount }));
  }

  public applyStockAdjustments(
    items: InventoryItem[],
    adjustments: StockAdjustment[]
  ): InventoryItem[] {
    // Convert adjustments to a Map for quick lookup
    const adjMap = new Map(adjustments.map(a => [a._id, a.amount]));

    // Return new array with adjusted stock values
    return items.map(item => {
      const adjustment = adjMap.get(item._id) || 0;
      return {
        ...item,
        stock: item.stock + adjustment,
      };
    });
  }
}

class EmployeeService extends BaseService {
  constructor() {
    super();
  }

  public async fetchAll(): Promise<Response> {
    return await super.fetch(API_CONFIG.ENDPOINTS.EMPLOYEES);
  }

  public async addEmployee(newEmployee: Employee): Promise<Response> {
    return await super.add<Employee>(
      API_CONFIG.ENDPOINTS.EMPLOYEES,
      newEmployee
    );
  }

  public async editEmployee(
    id: string,
    edits: Partial<Employee>
  ): Promise<Response> {
    return await super.update<Employee>(
      `${API_CONFIG.ENDPOINTS.EMPLOYEES}/${id}`,
      id,
      edits
    );
  }

  public generateColor(employeeId: string): string {
    // Create a simple hash from the employee ID
    let hash = 0;
    for (let i = 0; i < employeeId.length; i++) {
      const char = employeeId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to positive number
    const positiveHash = Math.abs(hash);

    // Generate HSL values from hash
    const hue = (positiveHash * 1.5) % 360; // Full range 0-360
    const saturation = 0.5 + (positiveHash % 50) / 100; // Range 0.5-1.0
    const luminosity = 0.5 + ((positiveHash >> 8) % 50) / 100; // Range 0.5-1.0

    return `hsl(${hue}, ${Math.round(saturation * 100)}%, ${Math.round(
      luminosity * 100
    )}%)`;
  }
}

class AssemblyService extends BaseService {
  constructor() {
    super();
  }

  public async fetchAll(): Promise<Response> {
    return await super.fetch(API_CONFIG.ENDPOINTS.ASSEMBLY);
  }

  public async addAssembly(newAssembly: AssembledItem): Promise<Response> {
    return await super.add<AssembledItem>(
      API_CONFIG.ENDPOINTS.ASSEMBLY,
      newAssembly
    );
  }

  public async deleteAssembly(id: string): Promise<Response> {
    return await super.fetch(
      `${API_CONFIG.ENDPOINTS.ASSEMBLY}/${id}`,
      "DELETE"
    );
  }

  public async fetchByProject(id: string): Promise<Response> {
    return await super.fetch(`${API_CONFIG.ENDPOINTS.ASSEMBLY}/project/${id}`);
  }
}

class ProjectService extends BaseService {
  constructor() {
    super();
  }

  public async fetchAll(): Promise<Response> {
    return await super.fetch(API_CONFIG.ENDPOINTS.PROJECTS);
  }

  public async fetchOne(id: string): Promise<Response> {
    return await super.fetch(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`);
  }

  public async updateProject(
    id: string,
    edits: Partial<BackendProject>
  ): Promise<Response> {
    return await super.update<BackendProject>(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`,
      id,
      edits
    );
  }

  public async addProject(newProject: BackendProject): Promise<Response> {
    return await super.add<BackendProject>(API_CONFIG.ENDPOINTS.PROJECTS, newProject);
  }
}

class ProductService extends BaseService {
  constructor() {
    super();
  }

  public async fetchAll(): Promise<Response> {
    return await super.fetch(API_CONFIG.ENDPOINTS.PRODUCTS, "POST", {
      isAssembledProduct: true,
    });
  }

  public async fetchComplexItems(): Promise<Response> {
    return await super.fetch(API_CONFIG.ENDPOINTS.PRODUCTS, "POST", {
      isAssembledProduct: false,
    });
  }
}

export const inventoryService = new InventoryService();
export const employeeService = new EmployeeService();
export const assemblyService = new AssemblyService();
export const productService = new ProductService();
export const projectService = new ProjectService();

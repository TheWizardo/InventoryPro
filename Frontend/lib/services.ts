import {
  InventoryItem,
  Employee,
  AssembledItem,
  ProductComponent,
  Project,
  StockAdjustment,
  LogRegistry,
  LogRegistryBackend,
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

  public async add<T>(uri: string, newItem: Omit<T, "_id">): Promise<Response> {
    return await this.fetch(uri, "POST", newItem);
  }
}

class InventoryService {
  constructor() {
  }

  public async fetchAll(): Promise<Response> {
    return await baseService.fetch(API_CONFIG.ENDPOINTS.INVENTORY);
  }

  public async fetchOne(id: string): Promise<Response> {
    return await baseService.fetch(`${API_CONFIG.ENDPOINTS.INVENTORY}/${id}`);
  }

  public async fetchSeveral(idArr: string[]): Promise<Response> {
    return await baseService.fetch(`${API_CONFIG.ENDPOINTS.INVENTORY}/many`, "POST", { ids: idArr });
  }

  public async updateItem(
    itemId: string,
    edits: Partial<InventoryItem>
  ): Promise<Response> {
    return await baseService.update<InventoryItem>(
      `${API_CONFIG.ENDPOINTS.INVENTORY}/${itemId}`,
      itemId,
      edits
    );
  }

  public async addItem(newItem: InventoryItem): Promise<Response> {
    return await baseService.add<InventoryItem>(
      API_CONFIG.ENDPOINTS.INVENTORY,
      newItem
    );
  }

  public async overrideStock(edits: any): Promise<Response> {
    return await baseService.fetch(
      `${API_CONFIG.ENDPOINTS.INVENTORY}/override-stock`,
      "PATCH",
      edits
    );
  }

  public async adjustStock(adjustments: StockAdjustment[]): Promise<Response> {
    return await baseService.fetch(
      `${API_CONFIG.ENDPOINTS.INVENTORY}/adjust-stock`,
      "PATCH",
      adjustments
    );
  }

  public async getVendors(): Promise<Response> {
    return await baseService.fetch(`${API_CONFIG.ENDPOINTS.INVENTORY}/vendors`);
  }

  public flattenToLeafComponents(
    item: InventoryItem,
    multiplier = 1
  ): StockAdjustment[] {
    const result: Record<string, ProductComponent> = {};

    function recurse(current: InventoryItem, qty: number) {
      if (!current.components || current.components.length === 0) {
        // Leaf node → accumulate quantity
        const id = current._id?.toString();
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
      return { _id: (i.item as InventoryItem)._id, amount: i.quantity };
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

  public doesItemUsesNonSupportedComponents(complexItem: InventoryItem): boolean {
    if (!complexItem?.components) {
      return !complexItem.isSupported;
    }
    const allSubitemsSupportedArr = complexItem.components.map(c => this.doesItemUsesNonSupportedComponents(c.item as InventoryItem) || !(c.item as InventoryItem).isSupported);
    const allSubitemsSupported = !allSubitemsSupportedArr.every(v => !v);
    return allSubitemsSupported;
  }
}

class EmployeeService {
  constructor() {
  }

  public async fetchAll(): Promise<Response> {
    return await baseService.fetch(API_CONFIG.ENDPOINTS.EMPLOYEES);
  }

  public async addEmployee(newEmployee: Employee): Promise<Response> {
    return await baseService.add<Employee>(
      API_CONFIG.ENDPOINTS.EMPLOYEES,
      newEmployee
    );
  }

  public async editEmployee(
    id: string,
    edits: Partial<Employee>
  ): Promise<Response> {
    return await baseService.update<Employee>(
      `${API_CONFIG.ENDPOINTS.EMPLOYEES}/${id}`,
      id,
      edits
    );
  }

  public generateColor(employeeId: string): string {
    function generateHash(id: string): number {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    }
    const hash = Math.abs(generateHash(employeeId));

    // Distribute hue more evenly
    const hue = hash % 360;
    // Spread saturation between 50–90%
    const saturation = 50 + (hash % 41); // 50–90
    // Spread lightness between 40–70%
    const lightness = 40 + ((hash >> 3) % 31); // 40–70

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}

class AssemblyService {
  constructor() {
  }

  public async fetchAll(): Promise<Response> {
    return await baseService.fetch(API_CONFIG.ENDPOINTS.ASSEMBLY);
  }

  public async addAssembly(newAssembly: AssembledItem): Promise<Response> {
    return await baseService.add<AssembledItem>(
      API_CONFIG.ENDPOINTS.ASSEMBLY,
      newAssembly
    );
  }

  public async deleteAssembly(id: string): Promise<Response> {
    return await baseService.fetch(
      `${API_CONFIG.ENDPOINTS.ASSEMBLY}/${id}`,
      "DELETE"
    );
  }

  public async fetchByProject(id: string): Promise<Response> {
    return await baseService.fetch(`${API_CONFIG.ENDPOINTS.ASSEMBLY}/project/${id}`);
  }
}

class ProjectService {
  constructor() {
  }

  public async fetchAll(): Promise<Response> {
    return await baseService.fetch(API_CONFIG.ENDPOINTS.PROJECTS);
  }

  public async fetchOne(id: string): Promise<Response> {
    return await baseService.fetch(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`);
  }

  public async updateProject(
    id: string,
    edits: Partial<Project>
  ): Promise<Response> {
    return await baseService.update<Project>(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/${id}`,
      id,
      edits
    );
  }

  public async addProject(newProject: Project): Promise<Response> {
    return await baseService.add<Project>(API_CONFIG.ENDPOINTS.PROJECTS, newProject);
  }

  public async getProjectProgress(id: string): Promise<Response> {
    return await baseService.fetch(`${API_CONFIG.ENDPOINTS.PROJECTS}/${id}/progress`);
  }
}

class ProductService {
  constructor() {
  }

  public async fetchAll(): Promise<Response> {
    return await baseService.fetch(API_CONFIG.ENDPOINTS.PRODUCTS, "POST", {
      isAssembledProduct: true,
    });
  }

  public async fetchComplexItems(): Promise<Response> {
    return await baseService.fetch(API_CONFIG.ENDPOINTS.PRODUCTS, "POST", {
      isAssembledProduct: false,
    });
  }
}

class LogService {
  constructor() {
  }

  public async fetchAll(): Promise<Response> {
    return await baseService.fetch(API_CONFIG.ENDPOINTS.LOGS);
  }

  public async registerLog(logEntry: LogRegistryBackend): Promise<Response> {
    return await baseService.fetch(API_CONFIG.ENDPOINTS.LOGS, "POST", logEntry);
  }

  public async deletryRegistry(id: string): Promise<Response> {
    return await baseService.fetch(`${API_CONFIG.ENDPOINTS.LOGS}/${id}`, "DELETE");
  }
}

class LicenseService {
  private LicenseEnd: { licenseEnd: Date } | null;
  constructor() {
    this.LicenseEnd = null;
  }

  public getLicenseEnd(): { licenseEnd: Date } | null {
    return this.LicenseEnd
  }

  public setLicenseEnd(l: { licenseEnd: Date }) {
    this.LicenseEnd = l
  }

  public async fetchDate(): Promise<Response> {
    return await baseService.fetch(API_CONFIG.ENDPOINTS.LICENSE);
  }

  public isValid(): boolean {
    const now = new Date();
    if (this.LicenseEnd === null) return false;
    return (this.LicenseEnd.licenseEnd.getTime() - now.getTime()) > 0;
  }
}

const baseService = new BaseService();
export const inventoryService = new InventoryService();
export const employeeService = new EmployeeService();
export const assemblyService = new AssemblyService();
export const productService = new ProductService();
export const projectService = new ProjectService();
export const logService = new LogService();
export const licenseService = new LicenseService();

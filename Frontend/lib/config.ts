export const API_CONFIG = {
  BASE_URL: "http://127.0.0.1:6001",
  ENDPOINTS: {
    PRODUCTS: "/api/inventory/products",
    INVENTORY: "/api/inventory",
    EMPLOYEES: "/api/employees",
    ASSEMBLY: "/api/assemblies",
    PROJECTS: "/api/projects", // Added projects endpoint for project management functionality
  },
} as const

// Helper function to build full API URLs
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

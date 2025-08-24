import { Types } from "mongoose";
import LogRegistry, { ILogRegistry } from "../Models/LogRegistry-Model";


async function populateRegistry(
  logRegistry: ILogRegistry
): Promise<ILogRegistry> {
  // Populate components one level
  await logRegistry.populate({ path: "items.item", model: "InventoryItem" });
  await logRegistry.populate("employee");

  return logRegistry;
}

// Get all registries
async function getAllRegistries(): Promise<ILogRegistry[]> {
  const allRegistries = await LogRegistry.find();
  await Promise.all(allRegistries.map((a) => populateRegistry(a)));
  return allRegistries;
}


// Add a new registry
async function addRegistry(logRegistry: ILogRegistry): Promise<ILogRegistry> {
  const addedRegistry = await LogRegistry.create(logRegistry);
  const populated = await populateRegistry(addedRegistry);
  return populated;
}

// Delete assembly by ID
async function deleteRegistry(
  id: string | Types.ObjectId
): Promise<ILogRegistry | null> {
  return await LogRegistry.findByIdAndDelete(id);
}

export default {
  getAllRegistries,
  addRegistry,
  deleteRegistry
};

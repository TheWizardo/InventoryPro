import InventoryItem, { IInventoryItem } from "../Models/InventoryItem-Model";
import AssembledItem from "../Models/Assembly-Model";
import LogRegistry from "../Models/LogRegistry-Model";
import Project from "../Models/Project-Model";
import { Types } from "mongoose";
import { ForbiddenError, InvalidData } from "../Models/client-errors";

function isItemId(
  item: Types.ObjectId | IInventoryItem
): item is Types.ObjectId {
  if (typeof item === "string") return true;
  return item instanceof Types.ObjectId;
}

async function itemDependencies(itemId: Types.ObjectId | string): Promise<string> {
  let dep = "<p>";

  // 1. Check if used in any Project
  const projects = await Project.find(
    { "products.item": itemId },
    { name: 1 } // projection: return only projectName
  );
  console.log("projects", projects);
  if (projects.length > 0) dep += `Projects:<ul>${projects.map(p => `<li><i>- ${p.name}</i></li>`).join("")}</ul>`;

  // 2. Check if used in any AssembledItem
  const assemblies = await AssembledItem.find({ item: itemId }, { serialNumber: 1 });
  if (assemblies.length > 0) dep += `Assemblies:<ul>${assemblies.map(a => `<li><i>- ${a.serialNumber}</i></li>`).join("")}</ul>`;

  // 3. Check if used in any LogRegistry
  const logs = await LogRegistry.find({ "items.item": itemId }, { registrationDate: 1 });
  if (logs.length > 0) dep += `Logs:<ul>${logs.map(l => `<li><i>- ${(new Date(l.registrationDate)).toUTCString()}</i></li>`).join("")}</ul>`;

  // 4. Check if used as component of another InventoryItem
  const inventoryItems = await InventoryItem.find({ "components.item": itemId }, { itemName: 1 });
  if (inventoryItems.length > 0) dep += `Inventory Items:<ul>${inventoryItems.map(i => `<li><i>- ${i.itemName}</i></li>`).join("")}</ul>`;

  return dep.trim() + "</p>";
}

async function deleteItem(itemId: Types.ObjectId | string): Promise<IInventoryItem | null> {
  const deps = await itemDependencies(itemId);
  if (deps.length > 7) throw new ForbiddenError(`<p>Item has the following dependencies:</p>${deps}`);

  const deletedItem = await InventoryItem.findByIdAndDelete(itemId);
  return deletedItem;
}

async function populateItemDeep(item: IInventoryItem): Promise<IInventoryItem> {
  if (!item.components?.length) return item;

  // Populate components one level
  await item.populate("components.item");

  for (const comp of item.components) {
    if (!isItemId(comp.item)) {
      // comp.item is now a full IInventoryItem
      await populateItemDeep(comp.item);
    }
  }

  return item;
}

function filterComplex(
  arr: IInventoryItem[],
  isComplex: boolean
): IInventoryItem[] {
  const filtered = arr.filter((i) => {
    if (isComplex) {
      return i.components?.length > 0;
    } else {
      return i.components === undefined;
    }
  });
  return filtered;
}

async function getItemsByAssembled(yes: boolean): Promise<IInventoryItem[]> {
  const assembledItems = await InventoryItem.find({ isAssembledProduct: yes });
  // Await the population of all items
  await Promise.all(assembledItems.map((item) => populateItemDeep(item)));
  return filterComplex(assembledItems, true);
}

// Get all inventory items
async function getAllInventoryItems(): Promise<IInventoryItem[]> {
  const allItems = await InventoryItem.find();

  // Await the population of all items
  await Promise.all(allItems.map((item) => populateItemDeep(item)));

  return filterComplex(allItems, false);
}

// Get single inventory item by ID
async function getInventoryItemById(
  _id: string | Types.ObjectId
): Promise<IInventoryItem | null> {
  const item = await InventoryItem.findById(_id);
  const populated = await populateItemDeep(item);
  return populated;
}

// Get several inventory items by array of IDs
async function getSeveralInventoryItems(
  ids: (string | Types.ObjectId)[]
): Promise<IInventoryItem[]> {
  const items = await InventoryItem.find({ _id: { $in: ids } });

  // Await the population of all items
  await Promise.all(items.map((item) => populateItemDeep(item)));

  return items;
}

// Add a new inventory item
async function addInventoryItem(
  inventoryItem: IInventoryItem
): Promise<IInventoryItem> {
  const addedItem = await InventoryItem.create(inventoryItem);
  const populated = await populateItemDeep(addedItem);
  return populated;
}

// Update an existing inventory item
async function updateInventoryItem(
  _id: string | Types.ObjectId,
  updates: Partial<IInventoryItem>
): Promise<IInventoryItem | null> {
  updates.components?.forEach((c) => {
    if (!isItemId(c.item)) {
      throw new InvalidData(_id.toString());
    }
  });
  const updatedInventoryItem = await InventoryItem.findByIdAndUpdate(
    _id,
    updates,
    {
      new: true, // return updated document
      runValidators: true, // validate against schema
    }
  );
  return updatedInventoryItem;
}

async function adjustStock(
  adjustments: { _id: string | Types.ObjectId; amount: number }[]
): Promise<IInventoryItem[]> {
  const bulkOps = adjustments.map((adj) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(adj._id) },
      update: { $inc: { stock: adj.amount } },
    },
  }));

  if (bulkOps.length > 0) {
    await InventoryItem.bulkWrite(bulkOps);
  }
  return getSeveralInventoryItems(adjustments.map((a) => a._id));
}

async function overrideStock(
  overrides: { _id: string | Types.ObjectId; newStock: number }[]
): Promise<IInventoryItem[]> {
  const ids: Types.ObjectId[] = [];

  const bulkOps = overrides.map((o) => {
    const objId = new Types.ObjectId(o._id);
    ids.push(objId);
    return {
      updateOne: {
        filter: { _id: objId },
        update: { $set: { stock: o.newStock } },
      },
    };
  });

  if (bulkOps.length > 0) {
    await InventoryItem.bulkWrite(bulkOps);
  }

  return getSeveralInventoryItems(overrides.map((o) => o._id));
}

async function getAllVendors(): Promise<string[]> {
  return InventoryItem.distinct("vendor");
}

export default {
  deleteItem,
  getAllInventoryItems,
  getInventoryItemById,
  getSeveralInventoryItems,
  getItemsByAssembled,
  addInventoryItem,
  updateInventoryItem,
  adjustStock,
  overrideStock,
  getAllVendors,
  itemDependencies,
};

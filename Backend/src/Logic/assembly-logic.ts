import AssembledItem, { IAssembledItem } from "../Models/Assembly-Model";
import { IProductComponent } from "../Models/InventoryItem-Model";
import { IProject } from "../Models/Project-Model";
import * as projectsLogic from "./projects-logic";
import { Types } from "mongoose";

function generateSerial(date: Date) {
  const length = 2;
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var result = `${date.getFullYear() % 10}${chars[date.getMonth()]}`;
  for (var i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += `${date.getDate()}`.padStart(2, "0");
  return result;
}

async function populateAssembly(
  assembly: IAssembledItem
): Promise<IAssembledItem> {
  // Populate components one level
  await assembly.populate("item");
  await assembly.populate("employee");
  await assembly.populate("project");

  return assembly;
}

// Get all assemblies
async function getAllAssembly(): Promise<IAssembledItem[]> {
  const allAssemblies = await AssembledItem.find();
  await Promise.all(allAssemblies.map((a) => populateAssembly(a)));
  return allAssemblies;
}

// Get assembly by ID
async function getAssemblyById(
  id: string | Types.ObjectId
): Promise<IAssembledItem | null> {
  const assembly = await AssembledItem.findById(id);
  const populated = await populateAssembly(assembly);
  return populated;
}

async function getAssembliesByProject(
  projectId: string | Types.ObjectId
): Promise<IAssembledItem[]> {
  const assemblies = await AssembledItem.find({ project: projectId });
  await Promise.all(assemblies.map((a) => populateAssembly(a)));
  return assemblies;
}

async function getAssembliesByEmployee(
  employeeId: string | Types.ObjectId
): Promise<IAssembledItem[]> {
  const assemblies = await AssembledItem.find({ employee: employeeId });
  await Promise.all(assemblies.map((a) => populateAssembly(a)));
  return assemblies;
}

function areItemQuantitiesEqual(
  arr1: { item: string, quantity: number }[],
  arr2: { item: string, quantity: number }[]
): boolean {
  if (arr1.length !== arr2.length) return false;

  // Build maps for quick lookup
  const map1 = new Map(arr1.map(({ item, quantity }) => [item, quantity]));
  const map2 = new Map(arr2.map(({ item, quantity }) => [item, quantity]));

  if (map1.size !== map2.size) return false;

  for (const [item, quantity] of map1) {
    if (map2.get(item) !== quantity) {
      return false;
    }
  }

  return true;
}

// Add a new assembly
async function addAssembly(assembly: IAssembledItem): Promise<IAssembledItem> {
  let sn;
  let itemBysn = {} as unknown as IAssembledItem;
  while (itemBysn != null) {
    sn = generateSerial(assembly.productionDate);
    itemBysn = await AssembledItem.findOne({ sn });
  }
  assembly.serialNumber = sn;
  const addedAssembly = await AssembledItem.create(assembly);
  const populated = await populateAssembly(addedAssembly);
  const targetComponents = [...(populated.project as IProject).products].map(c => ({ item: c.item.toString(), quantity: c.quantity }));
  const projectProgress = (await projectsLogic.getProjectProductsProgress(populated.project._id)).map(c => ({ item: c.item._id.toString(), quantity: c.quantity }));
  if (areItemQuantitiesEqual(targetComponents, projectProgress)) {
    projectsLogic.markCompletedAs(populated.project._id, true)
  }
  return populated;
}

// Delete assembly by ID
async function deleteAssembly(
  id: string | Types.ObjectId
): Promise<IAssembledItem | null> {
  const populated = await getAssemblyById(id);
  const deletedAssembly = await AssembledItem.findByIdAndDelete(id);
  const targetComponents = [...(populated.project as IProject).products].map(c => ({ item: c.item.toString(), quantity: c.quantity }));
  const projectProgress = (await projectsLogic.getProjectProductsProgress(populated.project._id)).map(c => ({ item: c.item._id.toString(), quantity: c.quantity }));
  if (!areItemQuantitiesEqual(targetComponents, projectProgress)) {
    projectsLogic.markCompletedAs(populated.project._id, false)
  }
  return deletedAssembly;
}

export default {
  getAllAssembly,
  getAssemblyById,
  addAssembly,
  deleteAssembly,
  getAssembliesByProject,
  getAssembliesByEmployee
};

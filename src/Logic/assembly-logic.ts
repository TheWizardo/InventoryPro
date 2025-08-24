import AssembledItem, { IAssembledItem } from "../Models/Assembly-Model";
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
  return populated;
}

// Delete assembly by ID
async function deleteAssembly(
  id: string | Types.ObjectId
): Promise<IAssembledItem | null> {
  return await AssembledItem.findByIdAndDelete(id);
}

export default {
  getAllAssembly,
  getAssemblyById,
  addAssembly,
  deleteAssembly,
  getAssembliesByProject,
  getAssembliesByEmployee
};

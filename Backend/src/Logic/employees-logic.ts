import { ForbiddenError } from "../Models/client-errors";
import Employee, { IEmployee } from "../Models/Employee-Model";
import AssembledItem from "../Models/Assembly-Model";
import LogRegistry from "../Models/LogRegistry-Model";
import { Types } from "mongoose";

async function getAllEmployees(): Promise<IEmployee[]> {
  const employees = await Employee.find().lean();
  return employees;
}

async function addEmployee(employee: IEmployee): Promise<IEmployee> {
  const newEmployee = await Employee.create(employee);
  return newEmployee;
}

export async function updateEmployee(
  id: string | Types.ObjectId,
  updates: Partial<IEmployee>
): Promise<IEmployee | null> {
  const updatedEmployee = await Employee.findByIdAndUpdate(id, updates, {
    new: true, // return the updated document
    runValidators: true, // validate against schema
  });
  return updatedEmployee;
}

export async function employeeDependencies(empId: Types.ObjectId | string): Promise<string> {
  let dep = "<p>";

  // 1. Check if used in any AssembledItem
  const assemblies = await AssembledItem.find({ employee: empId }, { serialNumber: 1 });
  if (assemblies.length > 0) dep += `Assemblies:<ul>${assemblies.map(a => `<li><i>- ${a.serialNumber}</i></li>`).join("")}</ul>`;

  // 2. Check if used in any LogRegistry
  const logs = await LogRegistry.find({ employee: empId }, { registrationDate: 1 });
  if (logs.length > 0) dep += `Logs:<ul>${logs.map(l => `<li><i>- ${(new Date(l.registrationDate)).toUTCString()}</i></li>`).join("")}</ul>`;

  return dep.trim() + "</p>";
}

async function deleteEmployee(id: Types.ObjectId | string): Promise<IEmployee | null> {
  const deps = await employeeDependencies(id);
  if (deps.length > 7) throw new ForbiddenError(`<p>Employee cannot be deleted. Employee has the following dependencies:</p>${deps}`);

  const deletedEmployee = await Employee.findByIdAndDelete(id);
  return deletedEmployee;
}

export default {
  getAllEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee
};

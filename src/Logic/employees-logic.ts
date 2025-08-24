import Employee, { IEmployee } from "../Models/Employee-Model";
import { Types } from "mongoose";
import config from "../Utils/config";

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

export default {
  getAllEmployees,
  addEmployee,
  updateEmployee
};

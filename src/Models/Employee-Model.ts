import BaseDocument from "./BaseDocument";
import mongoose, { Schema } from "mongoose";

export interface IEmployee extends BaseDocument {
  name: string;
  isEmployeed: boolean;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true },
    isEmployeed: { type: Boolean, required: true },
  },
  {
    versionKey: false,
  }
);

export default mongoose.model<IEmployee>(
  "Employee",
  EmployeeSchema,
  "Employees"
);

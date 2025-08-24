import BaseDocument from "./BaseDocument";
import mongoose, { Schema, Types } from "mongoose";
import { IProductComponent, ProductComponentSchema } from "./InventoryItem-Model";
import { IEmployee } from "./Employee-Model";

export interface ILogRegistry extends BaseDocument {
  items: IProductComponent[];
  employee: Types.ObjectId | IEmployee;
  description: string;
  registrationDate: Date;
}

const LogRegistrySchema = new Schema<ILogRegistry>(
  {
    items: {
      type: [ProductComponentSchema],
      required: true,
      default: [],
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    description: {
      type: String,
      maxLength: 100,
      required: true,
    },
    registrationDate: { type: Date, required: true }
  },
  {
    versionKey: false,
  }
);

export default mongoose.model<ILogRegistry>(
  "LogRegistry",
  LogRegistrySchema,
  "InventoryLog"
);

import BaseDocument from "./BaseDocument";
import mongoose, { Schema, Types } from "mongoose";
import { IInventoryItem } from "./InventoryItem-Model";
import { IEmployee } from "./Employee-Model";
import { IProject } from "./Project-Model";

export interface IAssembledItem extends BaseDocument {
  item: Types.ObjectId | IInventoryItem;
  employee: Types.ObjectId | IEmployee;
  project: Types.ObjectId | IProject;
  productionDate: Date;
  serialNumber: string;
}

const AssembledItemSchema = new Schema<IAssembledItem>(
  {
    item: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    productionDate: { type: Date, required: true },
    serialNumber: { type: String, required: true, unique: true },
  },
  {
    versionKey: false,
  }
);

export default mongoose.model<IAssembledItem>(
  "AssembledItem",
  AssembledItemSchema,
  "Assembly"
);

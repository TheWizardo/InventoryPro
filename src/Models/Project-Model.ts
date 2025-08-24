import BaseDocument from "./BaseDocument";
import {IProductComponent, ProductComponentSchema} from "./InventoryItem-Model"
import mongoose, { Schema } from "mongoose";

export interface IProject extends BaseDocument {
  name: string;
  dueDate: Date;
  products: IProductComponent[];
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    dueDate: { type: Date, required: true },
    products: {
      type: [ProductComponentSchema],
      required: true
    }
  },
  {
    versionKey: false,
  }
);

export default mongoose.model<IProject>(
  "Project",
  ProjectSchema,
  "Projects"
);

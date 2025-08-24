import BaseDocument from "./BaseDocument";
import mongoose, { Schema, Types } from "mongoose";

export interface IProductComponent {
  item: Types.ObjectId | IInventoryItem;
  quantity: number;
}

export interface IInventoryItemBase extends BaseDocument {
  itemName: string;
  sku: string;
  stock: number;
  minStock: number;
  vendor: string;
  link?: string;
  isAssembledProduct: boolean;
  isSupported: boolean;
}

export interface IInventoryItem extends IInventoryItemBase {
  components?: IProductComponent[];
}


export const ProductComponentSchema = new Schema<IProductComponent>(
  {
    item: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

// Inventory Item Schema
export const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    itemName: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    stock: { type: Number, required: true, min: 0 },
    minStock : { type: Number, required: true, min: 0 },
    vendor: { type: String, required: true },
    link: { type: String },
    isAssembledProduct: { type: Boolean, required: true },
    isSupported: { type: Boolean, required: true },
    components: {
      type: [ProductComponentSchema],
      required: false,
      default: undefined,
    },
  },
  { versionKey: false }
);

InventoryItemSchema.pre("validate", function (next) {
  if (this.components?.length === 0) {
    return next(new Error("Complex items must have at least one component"));
  }
  next();
});

export default mongoose.model<IInventoryItem>(
  "InventoryItem",
  InventoryItemSchema,
  "Inventory"
);

import mongoose, { Types } from "mongoose";

export default interface BaseDocument extends mongoose.Document {
  _id: Types.ObjectId;
}

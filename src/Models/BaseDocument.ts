import mongoose from "mongoose";

export default interface BaseDocument extends mongoose.Document {
  _id: Types.ObjectId;
}

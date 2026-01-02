import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    type: { type: String, required: true },
    image: { type: String }, 
  },
  { timestamps: true }
);

 const Item = mongoose.model("Item", ItemSchema);
export default Item
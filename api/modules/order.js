const mongoose = require("mongoose");


// Function to get the current date in IST
const OrderSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productPrice:{type:Number },
  quantity: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, default: "Pending" }, // E.g., "Pending", "Shipped", "Delivered"
  statusFlag: { type: String, default: null }, // E.g., "Accept" : 1, "Reject" : 0
  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Order", OrderSchema);

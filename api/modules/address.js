const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = new Schema(
  {
   _id: mongoose.Schema.Types.ObjectId,
   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    buildingName: { type: String, required: true },
    roadName: { type: String, required: true },
    type: { type: String, required: true },
  },
);

module.exports = mongoose.model('Address', AddressSchema);

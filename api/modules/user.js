const mongoose =require('mongoose');

const UserSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    firstname :{ type: String ,required:true},
    lastname  : { type: String ,required:true},
    email:{type:String, required:true},
    password:{type:String,required:true},
    type: { type: String ,required:true},
    selectedDeliveryAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        default: null,
      },
});

module.exports=mongoose.model('User',UserSchema);

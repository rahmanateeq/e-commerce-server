const express = require("express");
const router = express.Router();
const User = require('../modules/user');
const Order = require('../modules/order');
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');

router.post('/signup',(req,res,next)=>{
    User.find({email:req.body.email})
    .then(user =>{
        if(user.length>=1){
            return res.status(409).json({
                message:"user already existing "
            })
        }else{
            bcrypt.hash(req.body.password,10,(error,hash)=>{
                if(error){
                    res.status(500).json({
                        error:error
                    })
                }else{
                    const user = new User({
                        _id:new mongoose.Types.ObjectId(),
                        firstname:req.body.firstname,
                        lastname: req.body.lastname,
                        email:req.body.email,
                        type:req.body.type,
                        password:hash
                    })
                    user.save()
                    .then(result =>{
                        // console.log(result)
                        res.status(201).json({
                        message:"User successfully created"
                    })
                    })
                    .catch(error =>{
                        res.status(500).json({
                            error:error
                        })
                    })
                }
            })

        }
    })
    .catch(error =>{
        res.status(500).json({
            error:error
        })
    })
});

router.post('/login',(req,res)=>{
    User.find({email:req.body.email})
    // .select('firstname lastname token')
    .exec()
    .then(user =>{
        if(user.length < 1){
            return res.status(401).json({
                status:false,
                message:"Authentication Failed, User not found"
            })}
                bcrypt.compare(req.body.password,user[0].password,(error, result)=>{
                    if(error){
                    return res.status(401).json({
                        status: false,
                        message:"Auth failed"
                        })
                    }
                    if(result){
                    
                        const token = jwt.sign({
                            email: user[0].email,
                             userId:user[0]._id,
                             userType: user[0].type
                            },
                           process.env.SECRET, 
                            { 
                                expiresIn: '12h' 
                            });

                            const { _id: userId, firstname, lastname, email, type } = user[0];
                            const fullName = `${firstname} ${lastname}`;
                            
                            // Build the response object
                            const response = {
                              message: "Authentication successful",
                              success: true,  // Using a boolean for clarity
                              data: {
                                token,      // The JWT or authentication token
                                user: {     // The user information in a nested object
                                  userId,
                                  fullName,
                                  email,
                                  type
                                }
                              }
                            };
                            // Send the response with a 200 OK status
                        return res.status(200).json(response);
                    }
        res.status(402).json({
            message:"Auth failed wrong password"
        })
      })
    })
    .catch(error =>{
        res.status(401).json({
            error:error
        })
    })
})

router.delete("/:userId", async (req, res) => {
    const id = req.params.userId;
  
    try {
      // First, delete all orders associated with the user
      await Order.deleteMany({ userId: mongoose.Types.ObjectId(id) });
  
      // Then, delete the user
      const result = await User.findByIdAndRemove(id);
  
      if (!result) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({
        message: "User and associated orders deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });
  
module.exports=router;
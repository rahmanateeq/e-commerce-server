const express = require("express");
const router = express.Router();
const userAuth = require("../middlewere/user-auth");
const Category = require("../modules/category");
const mongoose = require("mongoose");
const product = require("../modules/product");

// Add a new category
router.post("/", async (req, res) => {
  try {
    const category = new Category({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
    });

    await category.save();
    res
      .status(201)
      .json({ error: false, 
        message: "Category added successfully",
        category 
        });
  } catch (error) {
    res
      .status(500)
      .json({
        error: true,
        message: "Internal Server Error",
        details: error.message,
      });
  }
});

// Get all categories
router.get("/", (req, res) => {
    Category.find()
    .exec()
    .then(result =>{
         const response ={
            categories:result.map(doc =>{
                return{
                id:doc._id,
                name:doc.name
            }    
            })
         }
         res.status(200).json(response)
    })
    .catch(error =>{
        res.status(500).json({error:error})
    })
});
router.patch('/:categoryId',(req,res,next)=>{
    const id = req.params.categoryId;

    const updatedItem = req.body; // Take the entire body

    Category.updateOne({ _id: id }, { $set: updatedItem })
    .exec()
    .then(result =>{
        console.log(result)
        res.status(200).json({
            error:false,
            message:"Category Updated successfully",
            category:result  
        })
    })
    .catch(error =>{
    res.status(500).json({
          error: true,
          message: "Internal Server Error",
          details: error.message,
          });
      })
})
//delete category
router.delete("/:categoryId", async (req, res, next) => {
    const id = req.params.categoryId;
  
    try {
      // Check if the category is used in the Product collection
      const categoryInUse = await product.findOne({ categoryId: id }).exec();
  
      if (categoryInUse) {
        // If the category is used in the Product collection, send a response
        return res.status(405).json({
            error: true,
          message: "Category is used in products. Unable to delete.",
        });
      }
  
      // If not in use, proceed to delete the category
      const result = await Category.findByIdAndRemove({ _id: id }).exec();
  
      if (result) {
        return res.status(200).json({
          message: "Category deleted successfully.",
        });
      } else {
        return res.status(404).json({
          message: "Category not found.",
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "An error occurred while deleting the category.",
        error: error.message,
      });
    }
  });
  

module.exports = router;

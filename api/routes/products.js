const express = require("express");
const router = express.Router();
const userAuth = require("../middlewere/user-auth");
const Product = require("../modules/product");
const Category = require("../modules/category")
const mongoose= require("mongoose");
const upload = require("../middlewere/uploadMiddleware");

router.get('/', async (req, res, next) => {
    try {
        const products = await Product.find()
            .exec();
            const response = {
            count: products.length,
            products: products.map((doc) => ({
                id: doc._id,
                name: doc.name,
                price: doc.price,
                categoryId: doc.categoryId,
                description:doc.description, 
                productImages: doc.productImages || [], // Include images
              })),
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/", upload.array("productImages", 10), async (req, res, next) => {
   
    const io = req.app.get("io"); // Access the `io` instance from the app

    try {
        const { name, price, description, categoryId } = req.body;

        // Check if the categoryId exists
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            return res.status(400).json({
                error: true,
                message: `Category with ID ${categoryId} does not exist.`,
            });
        }

        // Save image paths
        const imagePaths = req.files.map((file) => file.path);

        // Create a new product
        const product = new Product({
            _id: new mongoose.Types.ObjectId(),
            name,
            price,
            description,
            categoryId,
            productImages: imagePaths, // Save array of image paths
        });

        const result = await product.save();
        res.status(201).json({
            message: "Product created successfully!",
            product: result,
        });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});
router.get('/:productId', async (req, res, next) => {
    const id = req.params.productId;

    try {
        const product = await Product.findById(id)
        .populate('categoryId', 'name'); // Populate categoryId with the 'name' field from Category

        if (product) {
            res.status(200).json({
                product: {
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    category: {
                        categoryId: product.categoryId._id,
                        categoryName: product.categoryId.name
                    },
                    productImages: product.productImages || [], // Include images
                }
            });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ error });
    }
});

// router.patch('/:productId',(req,res,next)=>{
//     const id = req.params.productId;
//     const updatedProduct = req.body; 
//     Product.updateOne({ _id: id }, { $set: updatedProduct })
//     .exec()
//     .then(result =>{
//         // console.log(result)
//         res.status(200).json({
//             message:"Product Updated successfully",    
//         })
//     }).catch(error =>{
//         res.status(500).json({
//             "message":"some error occured when updating function",
//              error: error
//              });
//     })
// })

router.patch("/:productId", upload.array("productImages", 10), async (req, res, next) => {
    const id = req.params.productId;
    const io = req.app.get("io"); // Access the `io` instance from the app

    // Extract existing images from req.body (sent by the frontend)
    const { existingImages } = req.body; // Existing image URLs
    const updatedProduct = { ...req.body }; // Copy req.body for updating the product
  
    // Parse existing images (if any)
    let existingImageArray = [];
    if (existingImages) {
      // Ensure it's an array, as multiple existing images can be sent
      existingImageArray = Array.isArray(existingImages) ? existingImages : [existingImages];
    }
  
    // Handle new uploaded images
    let newImages = [];
    if (req.files && req.files.length > 0) {
      // Extract paths of newly uploaded images
      newImages = req.files.map((file) => file.path);
    }
  
    // Combine existing and new images
    updatedProduct.productImages = [...existingImageArray, ...newImages];
  
    try {
      // Update product in the database
      const result = await Product.updateOne({ _id: id }, { $set: updatedProduct });
      io.emit("productUpdated", {
        product : result
    });
      // Send success response
      res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
      // Send error response in case of failure
      res.status(500).json({ message: "Error updating product", error });
    }
  });
  

router.delete("/:productId",userAuth,(req,res,next)=>{
    const id = req.params.productId;
    Product.findByIdAndRemove({_id:id})
    .exec()
    .then(result =>{
        // console.log(result)
        res.status(200).json({
        message:"product deleted successfully ",
     
    }) 
    })
    .catch(error =>{
        res.status(500).json({
            "message":'Authontication failed',
            error:error
        })
    })
   
})

// Delete a specific product image
router.delete("/:productId/image", async (req, res, next) => {
    const { productId } = req.params;
    const { imagePath } = req.body; // Pass the image path in the request body

    try {
        // Find the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: true, message: "Product not found" });
        }

        // Check if the image exists in the productImages array
        if (!product.productImages.includes(imagePath)) {
            return res.status(400).json({ error: true, message: "Image not found in the product" });
        }

        // Remove the image from the array
        product.productImages = product.productImages.filter((img) => img !== imagePath);

        // Save the updated product
        await product.save();

        // Optionally: Remove the image file from the server
        const fs = require("fs");
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error("Error deleting image file:", err.message);
            }
        });

        res.status(200).json({
            message: "Image removed successfully from the product",
            product,
        });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

module.exports=router;





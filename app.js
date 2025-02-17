const express = require("express");
const cors = require('cors');
const fs = require("fs")
const app = express();


const path = require("path");
const morgon = require("morgan");
const mongoose = require("mongoose");
const ChatBotRouter = require('./api/routes/chatbot')
const ProductRouter = require("./api/routes/products");
const OrderRouter = require("./api/routes/orders");
  const UserRouter = require('./api/routes/user');
const CategoryRouter = require("./api/routes/category")
const AddressRouter = require("./api/routes/address");
const bodyParser = require("body-parser");
require("dotenv").config();
// 
// Check if the uploads directory exists, and create it if not
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Uploads directory created successfully!");
} else {
  console.log("Uploads directory already exists.");
}

mongoose.connect(
    "mongodb+srv://Atiqurrahman:" +
      process.env.MONGO_ATLAS_PASSWORD +
      "@loginsignup.17srspt.mongodb.net/?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
    })
    .then((result) => console.log("Database Connected"))
    .catch((error) => console.log("Somthing went wrong", error));


    // Use the CORS middleware
app.use(cors());
// use bodyParder on incoming req
// apply only on simple body
app.use(morgon("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/products", ProductRouter);
app.use('/user',UserRouter)
app.use('/category',CategoryRouter)
app.use('/orders',OrderRouter)
app.use('/addresses',AddressRouter)
app.use('/api',ChatBotRouter)

app.use("/uploads", express.static("uploads")); // for image upload 
//Apply error handling on incoming request
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});
module.exports = app;

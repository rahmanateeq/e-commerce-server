const express = require("express");
const Order = require("../modules/order");
const mongoose = require("mongoose");
const User = require("../modules/user");
const order = require("../modules/order");
const Product = require("../modules/product");
const nodemailer = require("nodemailer")
const router = express.Router();
 const PDFDocument = require('pdfkit')
 
const transporter = nodemailer.createTransport({
    service: "Gmail", // You can use other services like Yahoo, Outlook, etc.
    auth: {
      user: "atiqur.rehman@ennomail.com", // Replace with your email
      pass: "aczl uapu ukru pqxx", // Replace with your email password or app password
    },
  });

// Fetch orders by userId
router.get("/user/:userId", async (req, res) => {
    const { userId } = req.params; // Extract userId from the request params
  
    try {
      // Find the user by userId
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      let orders;
  
      // Check if the user is an ADMIN
      if (user.type === "ADMIN") {
        // Fetch all orders if the user is an ADMIN
        orders = await Order.find().populate("productId", "name price");
      } else {
        // Fetch only the orders belonging to the specific user
        orders = await Order.find({ userId }).populate("productId", "name price");
      }
  
      if (orders.length === 0) {
        return res.status(404).json({ message: "No orders found" });
      }
  
      // Map orders to the desired format
      const formattedOrders = orders.map((order) => ({
        id: order._id,
        productId: order.productId._id,
        productName: order.productId.name,
        productPrice: order.productPrice,
        quantity: order.quantity,
        userId: order.userId,
        status: order.status,
        statusFlag: order.statusFlag,
        createdAt: order.createdAt,
      }));
  
      res.status(200).json({ orders: formattedOrders });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
router.post("/", async (req, res) => {
    const { productId, quantity, userId } = req.body;
    const io = req.app.get("io"); // Access the `io` instance from the app

    try {

         // Fetch the product price based on the productId
    const product = await Product.findById(productId);
      const totalPrice = product.price * quantity ;

        // Fetch the user details based on the userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const order = new Order({
        _id: new mongoose.Types.ObjectId(),
        productId,
        quantity,
        productPrice: totalPrice,
        userId,
      });
  
      const result = await order.save();

      const mailOptions = {
        from: "atiqur.rehman@ennomail.com", // Replace with your email
        to: user.email, // User's email
        subject: "Order Confirmation",
        html: `
          <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333;">
              <h2 style="color: #4CAF50;">Order Confirmation</h2>
              <p>Dear <strong>${user.firstname + user.lastname}</strong>,</p>
              <p>Thank you for your order! Here are the details:</p>
              <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                  <tr style="background-color: #f2f2f2;">
                      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
                      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Quantity</th>
                      <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Total Price</th>
                  </tr>
                  <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">${product.name}</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${quantity}</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">₹${totalPrice}</td>
                  </tr>
                 
                     <tr>
                          <td style="padding: 20px; font-size: 16px; color: #333;" colspan="2">
                            <p style="margin-top: 20px; margin-bottom: 10px;">Thank you for shopping with us!</p>
                            <p style="margin: 0;">Best Regards,</p>
                            <p style="margin: 0;"><strong>CEO : Rahul Kumar</strong></p>
                          </td>
                        </tr>
              </table>
              <p>We will notify you once your order is shipped.</p>
              <br>
              <p style="font-size: 14px; color: #777;">If you have any questions, feel free to contact our support team.</p>
          </div>
        `,
      };

      // Notify all clients about the new order
        io.emit("newOrder", { order: result });
     ///////////////////////// uncomment for e4mail
      // transporter.sendMail(mailOptions, (error, info) => {
      //   if (error) {
      //     console.error("Error sending email:", error.message);
      //   } else {
      //     console.log("Email sent:", info.response);
      //   }
      // });
      res.status(201).json({
        message: "Order created successfully",
        order: result,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.get("/:orderId", async (req, res) => {
    const { orderId } = req.params;
  
    try {
      const order = await Order.findById(orderId)
      .populate("productId", "name price");
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      } 

      res.status(200).json({ 
        order:{
            id: order._id,
            productId: order.productId._id,
            productName: order.productId.name,
            productPrice: productPrice,
            quantity: order.quantity,
            userId: order.userId,
            status: order.status,
            createdAt: order.createdAt,
          }
        
       });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
router.patch("/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { status, statusFlag } = req.body;
    const io = req.app.get("io"); // Access the `io` instance from the app

    // Validate the status if provided
    const validStatuses = ["Pending", "Processing", "Shipped","Out for Delivery", "Delivered", "Cancelled"];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Valid statuses: ${validStatuses.join(", ")}` });
    }

    try {
        // Find the order to update
        const order = await Order.findById(orderId).populate("productId", "name price").populate("userId", "firstname email");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Update the status and statusFlag if provided
        if (status) order.status = status;
        if (statusFlag !== undefined) order.statusFlag = statusFlag;

        // Save the updated order
        await order.save();

        if (status || statusFlag ) {
           
            // Assuming `io` is initialized and available globally
            io.emit("orderSatusUpdated", {
                userId: order.userId,
               status: order.status
            });
        }
        // Send email notification if the status was updated
        if (status) {
            const user = await User.findById(order.userId);
                if (!user) {
                return res.status(404).json({ message: "User not found" });
                }
            const product = order.productId; // Populated product details

            // Configure email content
            const mailOptions = {
                from: "atiqur.rehman@ennomail.com", // Your email
                // to: "abhinavtiwari3056@gmail.com", // Recipient's email
                to: user.email, // User's email
                subject: `Order Status Updated: ${status}`,
                html: `
                  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <table style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                      <thead style="background-color: #4CAF50; color: white; text-align: center;">
                        <tr>
                          <th style="padding: 15px; font-size: 24px;" colspan="2">Order Status Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="padding: 20px; font-size: 16px; color: #333;" colspan="2">
                            <p>Hello <strong>${user.firstname + user.lastname}</strong>,</p>
                            <p>Your order status has been updated. Below are the updated details of your order:</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Product</td>
                          <td style="padding: 10px; border: 1px solid #ddd;">${product.name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Quantity</td>
                          <td style="padding: 10px; border: 1px solid #ddd;">${order.quantity}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Total Price</td>
                          <td style="padding: 10px; border: 1px solid #ddd;">₹${order.productPrice}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Order Status</td>
                          <td style="padding: 10px; border: 1px solid #ddd; color: #4CAF50;"><strong>${status}</strong></td>
                        </tr>
                        <tr>
                          <td style="padding: 20px; font-size: 16px; color: #333;" colspan="2">
                            <p style="margin-top: 20px; margin-bottom: 10px;">Thank you for shopping with us!</p>
                            <p style="margin: 0;">Best Regards,</p>
                            <p style="margin: 0;"><strong>CEO Rahul Kumar</strong></p>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot style="background-color: #f9f9f9; text-align: center; padding: 15px; color: #777; font-size: 14px;">
                        <tr>
                          <td colspan="2" style="padding: 15px;">
                            If you have any questions, feel free to <a href="mailto:rahul.kumar@ennomail.com" style="color: #4CAF50; text-decoration: none;">contact us</a>.
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                `,
              };
              
            // transporter.sendMail(mailOptions, (error, info) => {   //uncomment for email
            //     if (error) {
            //         console.error("Error sending email:", error.message);
            //     } else {
            //         console.log("Email sent successfully:", info.response);
            //     }
            // });

        }

        res.status(200).json({
            message: "Order updated successfully",
            order,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

  router.delete("/:orderId", async (req, res) => {
    const { orderId } = req.params;
  
    try {
      const order = await Order.findByIdAndDelete(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint to get order details based on orderId
router.get("/view/:orderId", async (req, res) => {
    const id = req.params.orderId; // Extract orderId from request params
    try {
       
      const order = await Order.findById(id)
        .populate("productId", "name price") // Populate product details
        .populate("userId", "firstname lastname email type"); // Populate user details
  
      if (order) {
          const formattedOrder = {
            id: order._id,
            productId: order.productId._id,
            productName: order.productId.name,
            productPrice: order.productPrice,
            quantity: order.quantity,
            userId: order.userId._id,
            userFirstName: order.userId.firstname,
            userLastName: order.userId.lastname,
            userEmail: order.userId.email,
            userType: order.userId.type,
            status: order.status,
            statusFlag: order.statusFlag,
            createdAt: order.createdAt,
          };
      
          res.status(200).json({ order: formattedOrder });
       
      }else{
       
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "An unexpected error occurred. Please try again later.", error });
    }

  });
  
 // Endpoint to download the invoice
// Endpoint to download the invoice
router.get("/download-invoice/:orderId", async (req, res) => {
  const id = req.params.orderId;

  try {
    const order = await Order.findById(id)
      .populate("productId", "name price")
      .populate("userId", "firstname lastname email type");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status.toLowerCase() !== "delivered") {
      return res.status(400).json({ message: "Invoice can only be downloaded for delivered orders." });
    }

    const doc = new PDFDocument({ margin: 40 });
    const filename = `invoice_${id}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");

    // Pipe the document to the response
    doc.pipe(res);

    // Add watermark first
    doc
      .font("Helvetica-Bold")
      .fontSize(50)
      .fillColor("lightgray")
      .opacity(0.3) // Set opacity to make it look like a background
      .rotate(-45, { origin: [300, 400] }) // Rotate the text
      .text("CEO Rahul Kumar", 100, 300, {
        align: "center",
        width: 500,
      })
      .rotate(45, { origin: [300, 400] }) // Reset rotation
      .opacity(1); // Reset opacity

    // Add content on top of the watermark

    // Header Section
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#333333")
      .text("INVOICE", { align: "center" })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Order ID: ${order._id}`, { align: "right" })
      .text(`Date: ${new Date(order.createdAt).toLocaleString()}`, { align: "right" })
      .moveDown(1);

    // Divider Line
    doc
      .moveTo(40, doc.y)
      .lineTo(550, doc.y)
      .stroke("#cccccc")
      .moveDown(0.5);

    // Customer Details
    doc
      .fontSize(14)
      .fillColor("#333333")
      .text("Customer Details", { underline: true })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Name: ${order.userId.firstname} ${order.userId.lastname}`)
      .text(`Email: ${order.userId.email}`)
      .moveDown(1);

    // Product Details
    doc
      .fontSize(14)
      .fillColor("#333333")
      .text("Product Details", { underline: true })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Product Name: ${order.productId.name}`)
      .text(`Price per Unit: INR ${order.productId.price}`)
      .text(`Quantity: ${order.quantity}`)
      .text(`Total Price: INR ${order.quantity * order.productId.price}`)
      .moveDown(1);

    // Order Summary
    doc
      .fontSize(14)
      .fillColor("#333333")
      .text("Order Summary", { underline: true })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("green") // Set text color to green
      .text(`Order Status: ${order.status}`)
      .moveDown(1);

    // Footer Section
    doc
      .moveTo(40, doc.y)
      .lineTo(550, doc.y)
      .stroke("#cccccc")
      .moveDown(1);

    doc
      .font("Helvetica-Oblique")
      .fontSize(10)
      .fillColor("#555555")
      .text("Thank you for your purchase!", { align: "center" });

    doc
      .font("Helvetica-Oblique")
      .fontSize(12)
      .fillColor("#555555")
      .text("CEO Rahul Kumar", { align: "center" });

    // Finalize the document
    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ message: "An unexpected error occurred while generating the invoice.", error });
  }
});


module.exports=router;
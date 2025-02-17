const mongoose = require('mongoose');
const Address = require('../modules/address');
const User = require('../modules/user');

const express = require('express');
const router = express.Router();
// Create a new address for a specific user
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, pincode, state, city, buildingName, roadName, type } = req.body;

    const newAddress = new Address({
      _id: new mongoose.Types.ObjectId(),
      userId,
      name,
      phone,
      pincode,
      state,
      city,
      buildingName,
      roadName,
      type,
    });

    const savedAddress = await newAddress.save();
    return res.status(201).json(savedAddress);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get all addresses for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch all addresses belonging to the user
    const addresses = await Address.find({ userId }).lean();

    // Transform addresses as needed (e.g., rename _id to id)
    const transformedAddresses = addresses.map(address => ({
      id: address._id,
      name: address.name,
      userId: address.userId,
      phone: address.phone,
      pincode: address.pincode,
      state: address.state,
      city: address.city,
      buildingName: address.buildingName,
      roadName: address.roadName,
      type: address.type,
    }));

    // Retrieve the selected address from the User model
    const user = await User.findById(userId).lean();
    const selectedAddressId = user ? user.selectedDeliveryAddress : null;

    return res.status(200).json({
      selectedAddressId,
      addresses: transformedAddresses
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Update the selected delivery address for a specific user
router.patch('/:userId/selected-address', async (req, res) => {
  try {
    const { userId } = req.params;
    const { selectedAddressId } = req.body;

    // Update the selectedDeliveryAddress field in the User model
    const user = await User.findByIdAndUpdate(
      userId,
      { selectedDeliveryAddress: selectedAddressId },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      message: 'Selected address updated successfully',
      selectedDeliveryAddress: user.selectedDeliveryAddress,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Update a specific address for a specific user
router.patch('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: id},
      updateData,
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }
    return res.status(200).json(updatedAddress);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete a specific address for a user and update selectedDeliveryAddress if needed
router.delete('/:id', async (req, res) => {
  try {
    const addressId = req.params.id;
    
    // Find the address document first
    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    const userId = address.userId;
    
    // Check if this address is the user's selected delivery address
    const user = await User.findById(userId);
    if (user && user.selectedDeliveryAddress && user.selectedDeliveryAddress.toString() === addressId) {
      // If it is, set selectedDeliveryAddress to null
      user.selectedDeliveryAddress = null;
      await user.save();
    }
    
    // Now delete the address
    await Address.findByIdAndDelete(addressId);
    
    return res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});


module.exports=router;
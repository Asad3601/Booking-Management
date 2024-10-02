const mongoose = require('mongoose');

// Define the destination schema
const destinationSchema = new mongoose.Schema({
    destination_name: {
        type: String,
        required: true,
        unique: true, // Ensure the destination name is unique
    },
    destination_image: {
        type: String,
        required: true,
    },
}, {
    timestamps: true // Automatically adds createdAt and updatedAt timestamps
});

// Create the Destination model
const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination;
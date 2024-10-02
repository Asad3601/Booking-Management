const mongoose = require('mongoose');

// Tours Schema
const toursSchema = new mongoose.Schema({
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: String, // You can store duration as "3 days", "1 week", etc.
        required: true
    },
    place: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    start_date: {
        type: Date,
        required: true,
        set: function(value) {
            // Convert the input date to UTC, ensuring only the date part is saved
            const date = new Date(value);
            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        }
    },
    end_date: {
        type: Date,
        required: true,
        set: function(value) {
            // Convert the input date to UTC, ensuring only the date part is saved
            const date = new Date(value);
            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        }
    },
    departure_loc: {
        type: String,
        required: true
    },
    return_on: {
        type: String, // You can store duration as "3 days", "1 week", etc.
        required: true
    },
    facilities: {
        type: [String], // Array of strings for facilities
        default: ['Free Wi-Fi', 'Air Conditioning', 'Meals Included', 'Tour Guide', 'Accommodation', 'Transport Included'] // Default 6 facilities
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Destination', // Reference to Destination model
        required: true
    },
    tourImages: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TourImages' // Reference to the TourImages model
    }
});

module.exports = mongoose.model('Tour', toursSchema);
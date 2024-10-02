const mongoose = require('mongoose');

// ToursImages Schema
const toursImagesSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour', // Reference to the Tour model
        required: true
    },
    images: {
        type: [String], // Array of image file names or paths
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TourImages', toursImagesSchema);
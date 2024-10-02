const mongoose = require('mongoose');

// Tours Schema
const BookTourSchema = new mongoose.Schema({
    adults: {
        type: Number,
        required: true
    },
    childs: {
        type: Number,
        required: true
    },
    phone_no: {
        type: String,
        required: true
    },
    payment: {
        type: Number, // This will store float values
        required: true,
        default: 0
    },
    payment_status: {
        type: String,
        enum: ['Paid', 'UnPaid'],
        default: 'UnPaid'
    },
    tour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('BookTour', BookTourSchema);
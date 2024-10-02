const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdminController = require('../controller/AdminController');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'media/');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });
router.get('/destination', AdminController.DestinationForm);
router.post('/destination', upload.single('destination_image'), AdminController.createDestination);

//add tours

const tour_storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'media/tours/');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname); // Append the date to avoid overwriting
    }
});

const tour_upload = multer({ storage: tour_storage });
router.get('/add_tour', AdminController.AddTourForm);
router.post('/add_tour', tour_upload.array('tour_images', 5), AdminController.createTour);
router.get('/get_tours', AdminController.getAllTours);

module.exports = router;
const Destination = require('../models/Destination');
const path = require('path');
const fs = require('fs');
const Tour = require('../models/Tours');
const TourImages = require('../models/TourImages');
const { getTours } = require('../functions')
    // Controller for adding a new destination
exports.DestinationForm = (req, res) => {
    res.render('admin', {
        user: req.user,
        MainView: 'admin/destination_form'
    })
}
exports.createDestination = async(req, res) => {
    try {
        const { destination_name } = req.body;

        // Check if image is uploaded
        if (!req.file) {
            return res.status(400).send('Please upload an image.');
        }

        // File uploaded path
        const destination_image = req.file.filename;

        // Create new destination
        const newDestination = new Destination({
            destination_name,
            destination_image,
        });

        await newDestination.save();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.AddTourForm = async(req, res) => {
    const destinations = await Destination.find({});
    res.render('admin', {
        user: req.user,
        destinations,
        MainView: 'admin/add_tour'
    })
}
exports.createTour = async(req, res) => {
    try {
        // Extract form data
        const { price, duration, place, description, start_date, end_date, departure_loc, return_on, destination } = req.body;

        // Ensure destination exists
        const destinationData = await Destination.findById(destination);
        if (!destinationData) {
            return res.status(400).send('Invalid destination selected.');
        }

        // Create the tour object (without the images first)
        const newTour = new Tour({
            price,
            duration,
            place,
            description,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            departure_loc,
            return_on,
            destination: destinationData._id, // Referencing the Destination model
        });

        // Save the tour data to the database
        const savedTour = await newTour.save();

        // Handling image uploads (if any)
        if (req.files && req.files.length > 0) {
            const imagePaths = [];

            // Loop through each file and store the filenames
            req.files.forEach(file => {
                const filePath = file.filename;
                imagePaths.push(filePath);
            });

            // Create a TourImages document with references to the uploaded images
            const tourImages = new TourImages({
                tour: savedTour._id,
                images: imagePaths,
            });

            // Save the TourImages document
            const savedTourImages = await tourImages.save();

            // Update the tour with the reference to the TourImages
            savedTour.tourImages = savedTourImages._id;
            await savedTour.save();
        }

        res.redirect('/tours'); // Redirect to the tours listing page or another appropriate page
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error. Could not create the tour.');
    }
};

exports.getAllTours = async(req, res) => {
    try {
        // Find all tours and populate both the destination's name and the tourImages
        const allTours = await getTours();
        res.send(allTours);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error. Could not retrieve tours.');
    }
};
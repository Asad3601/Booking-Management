const Tour = require('./models/Tours'); // Assuming this is your Tour model

// Function to retrieve all tours with populated destination_name and tourImages
const getTours = async() => {
    try {
        // Find all tours and populate both the destination's name and the tourImages
        const allTours = await Tour.find({})
            .populate({
                path: 'destination', // Populating the 'destination' field
                select: 'destination_name' // Select only the 'destination_name' field
            })
            .populate({
                path: 'tourImages', // Populating the 'tourImages' field
                select: 'images' // Select only the 'images' field from TourImages
            });

        // Check if tours were found
        if (!allTours || allTours.length === 0) {
            return { message: 'No tours found' };
        }

        // Limit description to 10 words for each tour
        const toursWithLimitedDescription = allTours.map(tour => {
            const limitedDescription = tour.description.split(' ').slice(0, 15).join(' ');
            return {
                ...tour._doc,
                description: limitedDescription, // Set the limited description
            };
        });

        // Return the list of all tours with limited descriptions
        return toursWithLimitedDescription;
    } catch (error) {
        console.error(error);
        throw new Error('Server error. Could not retrieve tours.');
    }
};

module.exports = {
    getTours
};
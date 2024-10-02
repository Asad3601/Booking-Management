const UserModel = require('../models/User');
const TourModel = require('../models/Tours');
const BookTour = require('../models/BookTour');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { configDotenv } = require('dotenv');
const stripe = require('stripe')(process.env.stripe_secret_key);
const axios = require('axios');
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
exports.UserRegisterForm = (req, res) => {
    res.render('register', {
        errors: ''
    });
}

exports.UserLoginForm = (req, res) => {
    res.render('login');
}


// Register User Controller
exports.RegisterUser = [
    // Validation Rules
    body('first_name')
    .notEmpty().withMessage('First Name is required')
    .isLength({ max: 50 }).withMessage('First Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s\-]+$/).withMessage('First Name can only contain alphabets, spaces, and hyphens'),
    body('last_name')
    .notEmpty().withMessage('Last Name is required')
    .isLength({ max: 50 }).withMessage('Last Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s\-]+$/).withMessage('Last Name can only contain alphabets, spaces, and hyphens'),
    body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
    body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).withMessage('Password must contain at least 8 characters, including alphabets, numbers, and special characters'),
    body('confirm_password')
    .notEmpty().withMessage('Confirm Password is required')
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),


    // Handle form submission
    async(req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('register', {
                title: 'Register',
                errors: errors.array(),
                userData: req.body
            });
        }

        try {
            const { first_name, last_name, email, password } = req.body;
            const newUser = new UserModel({
                first_name,
                last_name,
                email,
                password
                // Make sure to hash the password before saving
            });
            // Create a new user
            if (req.user && req.user.role === 'admin') {
                // Save the user
                await newUser.save();
                return res.redirect('/users');
            }

            // Save the user
            await newUser.save();

            // Redirect or respond with success
            res.redirect('/login'); // Redirect to login or another page after successful registration
        } catch (error) {
            console.error('Error occurred during user registration:', error);
            res.status(500).send('Server Error');
        }
    }
];

exports.LoginUser = async(req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await UserModel.findOne({ email });

        if (!user) {
            res.render('login', { message: 'Plz Register Your Self' })
        } else {
            if (user.password == password) {
                const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '2h' });
                res.cookie('jwt', token, { httpOnly: true });
                res.redirect('/');
            } else {
                res.render('login', { message: 'Your Enter Incorrect Password' })
            }
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Server Error');
    }
};
exports.LogoutUser = (req, res) => {
    res.clearCookie('jwt'); // Clear the JWT cookie
    res.redirect('/login');
}

exports.TourBookForm = async(req, res) => {
    let tour_id = req.params.id;
    res.render('index', {
        user: req.user,
        title: 'Tour Book',
        tour_id,
        MainView: 'Layouts/book_tour'
    })
}

// Tour booking controller
exports.TourBook = async(req, res) => {
    let { tour_id, phone_no, adults, childs } = req.body;
    let user = req.user;

    // Validate required fields
    if (!tour_id || !user || !phone_no || !adults || !childs) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        // Check if the tour exists
        let tour_data = await TourModel.findById(tour_id).populate({
                path: 'destination', // Populating the 'destination' field
                select: 'destination_name' // Select only the 'destination_name' field
            })
            .populate({
                path: 'tourImages', // Populating the 'tourImages' field
                select: 'images' // Select only the 'images' field from TourImages
            });

        if (!tour_data) {
            return res.status(404).json({ message: "Tour not found" });
        }

        // Create the new booking
        let save_tour = new BookTour({
            tour: tour_id,
            user: user._id,
            phone_no,
            adults: parseInt(adults), // Ensure these are numbers
            childs: parseInt(childs)
        });

        // Save the booking in DB
        await save_tour.save();

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${tour_data.place} - ${tour_data.destination.destination_name}`,
                    },
                    unit_amount: tour_data.price * 100, // Amount in cents (assuming price is in USD)
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${process.env.base_url}/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${save_tour._id}`,
            cancel_url: `${process.env.base_url}/failed`,
        });

        // Redirect to Stripe checkout page
        if (session && session.url) {
            return res.redirect(session.url);
        } else {
            return res.status(500).json({ message: "Failed to create Stripe session" });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred while booking the tour" });
    }
};
exports.PaymentSuccess = async(req, res) => {
    let session_id = req.query.session_id;
    let booking_id = req.query.booking_id; // Get the booking ID from the query

    if (!session_id || !booking_id) {
        return res.status(400).json({ message: "Session ID or Booking ID is missing" });
    }

    try {
        // Optionally, retrieve the session from Stripe if you need additional details
        const session = await stripe.checkout.sessions.retrieve(session_id);

        // Extract relevant payment information
        const amount_paid = session.amount_total / 100; // Convert back from cents to USD (assuming Stripe uses cents)
        const currency = session.currency.toUpperCase(); // Currency will be "USD" or another currency

        // console.log(`Payment successful. Amount paid: ${amount_paid} ${currency}`);

        // Update the corresponding BookTour with the payment information
        let updatedBooking = await BookTour.findByIdAndUpdate(
            booking_id, // Use booking_id from query
            {
                $set: {
                    payment: amount_paid,
                    payment_status: 'paid'
                }
            }, { new: true } // Return the updated document
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Send response with payment success and updated booking info
        res.json({
            message: "Payment successful"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to retrieve payment session or update booking" });
    }
};


exports.MyTours = async(req, res) => {
    try {
        let user_id = req.user._id;
        if (user_id) {
            let tours = await BookTour.find({ user: user_id })
                .populate({
                    path: 'tour',
                    populate: [{
                            path: 'destination',
                            select: 'destination_name' // Modify as needed
                        },
                        {
                            path: 'tourImages',
                            select: 'images' // Modify as needed
                        }
                    ]
                });

            // Mapping over the tours to limit the description
            const toursWithLimitedDescription = tours.map(tour => {
                // Ensure that tour and tour.tour are properly accessed
                const limitedDescription = tour.tour.description.split(' ').slice(0, 15).join(' '); // Limit to first 10 words
                return {
                    ...tour._doc, // Spread the original tour document
                    tour: {
                        ...tour.tour._doc, // Spread the nested tour document
                        description: limitedDescription // Set the limited description
                    }
                };
            });

            // console.log(JSON.stringify(toursWithLimitedDescription, null, 2)); // For debugging

            res.render('index', {
                title: 'My Tours',
                tours: toursWithLimitedDescription, // Render the limited description tours
                user: req.user || '', // Ensure user is passed to the view
                MainView: 'Layouts/user_tours' // Render the correct layout
            });
        }
    } catch (error) {
        console.error(error); // Error handling
        res.status(500).send('Server error');
    }
};

exports.EditTourBookForm = async(req, res) => {
    let tour_id = req.params.id;
    console.log("Tour ID:", tour_id); // Log the tour_id to check its value

    // Validate the ID format
    if (!mongoose.isValidObjectId(tour_id)) {
        return res.status(400).send('Invalid Tour ID');
    }

    let tour = await BookTour.findById(tour_id);
    res.render('index', {
        user: req.user,
        title: 'Edit Booking',
        tour,
        MainView: 'Layouts/edit_booktour'
    });
}

exports.UpdateTourBook = async(req, res) => {
    try {
        let { tour_id, childs, adults, phone_no } = req.body;
        if (req.user && tour_id) {
            await BookTour.findByIdAndUpdate(tour_id, {
                $set: {
                    childs,
                    adults,
                    phone_no
                }
            }, {
                new: true
            })
            res.redirect('/my_tours')
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
}

exports.TourDetail = async(req, res) => {
    let tour_id = req.params.id;
    if (req.user && tour_id) {
        let tour = await BookTour.findById(tour_id)
            .populate({
                path: 'tour',
                populate: [{
                        path: 'destination',
                        select: 'destination_name' // Modify as needed
                    },
                    {
                        path: 'tourImages',
                        select: 'images' // Modify as needed
                    }
                ]
            });
        let startDate = new Date(tour.tour.start_date).toISOString().split('T')[0];
        let endDate = new Date(tour.tour.end_date).toISOString().split('T')[0];

        const response = await axios.get(WEATHER_API_URL, {
            params: {
                q: tour.tour.destination.destination_name,
                appid: WEATHER_API_KEY,
                units: 'metric', // Use 'imperial' for Fahrenheit
            }
        });

        const weatherData = response.data.list;

        // Log the weather data for debugging
        // console.log("Weather Data:", weatherData);

        const dateMap = new Map();
        weatherData.forEach(entry => {
            const entryDate = new Date(entry.dt * 1000);
            const formattedDate = entryDate.toISOString().split('T')[0];
            if (formattedDate >= startDate && formattedDate <= endDate) {
                if (!dateMap.has(formattedDate)) {
                    dateMap.set(formattedDate, []);
                }
                // Push temperature and icon to the map
                dateMap.get(formattedDate).push({ temp: entry.main.temp, icon: entry.weather[0].icon });
            }
        });

        // Calculate daily average temperatures and include the icon
        const dailyTemps = [];
        dateMap.forEach((data, date) => {
            const temps = data.map(item => item.temp);
            const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
            const icon = data[0].icon; // Use the first icon for the day (icons are usually consistent for the day)
            dailyTemps.push({ date, avgTemp: Math.floor(avgTemp), icon });
        });

        res.render('index', {
            tour,
            user: req.user,
            dailyTemps,
            title: 'Tour Detail',
            MainView: 'Layouts/tour_detail'
        })
    } else {
        res.send('not found');
    }
}

exports.DeleteBookTour = async(req, res) => {
    try {
        let tour_id = req.params.id;
        if (req.user && tour_id) {
            await BookTour.findByIdAndDelete(tour_id);
            res.redirect('/my_tours')
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
}
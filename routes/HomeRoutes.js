const app = require('express').Router();
const Destination = require('../models/Destination')
const Tour = require('../models/Tours')
const axios = require('axios');
const { getTours } = require('../functions');
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
app.get('/', async(req, res) => {
    const destinations = await Destination.find({});
    const allTours = await getTours();
    // console.log(req.user);
    if (req.user && req.user.role == 'user') {
        res.render('index', {
            title: 'Home',
            destinations,
            allTours,
            user: req.user,
            MainView: 'base'
        });
    } else if (req.user && req.user.role == 'admin') {
        res.render('admin', {
            user: req.user,
            MainView: 'admin/main'
        });

    } else {
        res.render('index', {
            title: 'Home',
            destinations,
            allTours,
            user: '',
            MainView: 'base'
        });
    }
})
app.get('/tours', async(req, res) => {
    const allTours = await getTours();

    res.render('index', {
        title: 'Tours Packages',
        allTours,
        query: '',
        user: req.user || '',
        MainView: 'Layouts/packages'
    });

})
app.get('/about', (req, res) => {

    res.render('index', {
        user: req.user || '',
        title: "About Us",
        MainView: 'Layouts/about'
    });

})
app.get('/services', (req, res) => {

    res.render('index', {
        user: req.user || '',
        title: 'Services',
        MainView: 'Layouts/services'
    });

});
app.get('/contact', (req, res) => {
    res.render('index', {
        title: "Contact Us",
        user: req.user || '',
        MainView: 'Layouts/contact'
    });
})
app.get('/destinations', async(req, res) => {
    const destinations = await Destination.find({});
    res.render('index', {
        title: "Destinations",
        destinations,
        user: req.user || '',
        MainView: 'Layouts/destinations'
    });

})

app.get('/tour/:id', async(req, res) => {
    try {
        const tour = await Tour.findOne({ _id: req.params.id })
            .populate({
                path: 'destination',
                select: 'destination_name'
            })
            .populate({
                path: 'tourImages',
                select: 'images'
            });

        // Format startDate and endDate to 'YYYY-MM-DD'
        let startDate = new Date(tour.start_date).toISOString().split('T')[0];
        let endDate = new Date(tour.end_date).toISOString().split('T')[0];

        const response = await axios.get(WEATHER_API_URL, {
            params: {
                q: tour.destination.destination_name,
                appid: WEATHER_API_KEY,
                units: 'metric', // Use 'imperial' for Fahrenheit
            }
        });

        const weatherData = response.data.list;

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
            user: req.user || '',
            tour,
            dailyTemps,
            title: 'Tour',
            MainView: 'Layouts/package'
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).render('index', {
            user: req.user || '',
            title: 'Error',
            MainView: 'Layouts/error' // Consider creating an error view
        });
    }
});

app.post('/search_tours', async(req, res) => {
    try {
        const { destination, from_date, to_date, price } = req.body;

        let query = {};
        let searchQuery = {};

        // Add destination filter
        if (destination) {
            const destinationRecord = await Destination.findOne({
                destination_name: { $regex: new RegExp(destination, 'i') }
            }).select('_id');

            if (destinationRecord) {
                query['destination'] = destinationRecord._id;
                searchQuery.destination = destination; // Store for displaying query in EJS
            } else {
                return res.status(404).json({ message: 'Destination not found' });
            }
        }

        // Add date range filter and format the dates
        if (from_date && to_date) {
            query['start_date'] = { $gte: new Date(from_date), $lte: new Date(to_date) };
            searchQuery.from_date = new Date(from_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
            searchQuery.to_date = new Date(to_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } else if (from_date) {
            query['start_date'] = { $gte: new Date(from_date) };
            searchQuery.from_date = new Date(from_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } else if (to_date) {
            query['start_date'] = { $lte: new Date(to_date) };
            searchQuery.to_date = new Date(to_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        }

        // Add price filter
        if (price) {
            const [minPrice, maxPrice] = price.split('-').map(Number);
            if (maxPrice) {
                query.price = { $gte: minPrice, $lte: maxPrice };
            } else {
                query.price = { $gte: minPrice };
            }
            searchQuery.price = price;
        }

        // Fetch tours
        const filteredTours = await Tour.find(query)
            .populate('destination', 'destination_name')
            .populate('tourImages', 'images');

        // Handle if no tours found
        if (!filteredTours || filteredTours.length === 0) {
            return res.render('index', {
                allTours: '',
                query: searchQuery, // Pass query to EJS
                title: 'Search',
                MainView: 'Layouts/packages',
                user: req.user || '',
            });
        }

        // Limit description
        const toursWithLimitedDescription = filteredTours.map(tour => {
            const limitedDescription = tour.description.split(' ').slice(0, 15).join(' ');
            return {...tour._doc, description: limitedDescription };
        });

        // Render filtered tours
        res.render('index', {
            allTours: toursWithLimitedDescription,
            query: searchQuery, // Pass query to EJS
            title: 'Search',
            MainView: 'Layouts/packages',
            user: req.user || '',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error. Could not retrieve tours.' });
    }
});






module.exports = app;
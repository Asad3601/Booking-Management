require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { OpenWeatherAPI } = require("openweather-api-node")
const UserRoute = require('./routes/UserRoute');
const AdminRoute = require('./routes/AdminRoute');
const HomeRoutes = require('./routes/HomeRoutes.js');
const authenticateJWT = require('./middlewares/authenticateJWT.js');
const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authenticateJWT);
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static('public')); // Ensure CSS files are in 'public/css'
app.use(express.static(path.join(__dirname, 'media')));
mongoose.connect(process.env.db)
    .then((res) => {
        console.log('Connect With DB');
    })
    .catch((err) => {
        console.log(err);
    })

app.use(UserRoute);
app.use(AdminRoute);
app.use(HomeRoutes);

// function display(sum) {
//     return sum;
// }

// function Calculate(a, b, callback) {
//     let s = a + b;
//     return callback(s);
// }
// let res = Calculate(3, 4, display);
// console.log(res);
// function outerfunction() {
//     let message = "World!";

//     function innerfunction() {
//         console.log("Hello " + message);
//     }
//     return innerfunction;
// }
// let myfun = outerfunction();
// console.log(myfun());

// currin
// function sum(a) {
//     return (b) => {
//         return (c) => {
//             return a + b + c;
//         }
//     }
// }
// console.log(sum(1)(2)(3));

// hosting
x = 4;
console.log(x);
greet();


function greet() {
    console.log(x);
    var x;
}

app.listen(process.env.port, () => {
    console.log(`Server Runs On Port ${process.env.port}`)
})
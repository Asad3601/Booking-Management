const router = require('express').Router();
const UserController = require('../controller/UserController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');


router.get('/register', UserController.UserRegisterForm);
router.post('/register', UserController.RegisterUser);
router.post('/login', UserController.LoginUser);
router.get('/login', UserController.UserLoginForm);
router.get('/logout', UserController.LogoutUser);
router.get('/book_tour/:id', AuthMiddleware.CheckLogin, UserController.TourBookForm);
router.post('/book_tour', AuthMiddleware.CheckLogin, UserController.TourBook);
router.get('/success/:session_id?', UserController.PaymentSuccess);
router.get('/my_tours', AuthMiddleware.CheckLogin, UserController.MyTours);
router.get('/edit_tour_booking/:id', AuthMiddleware.CheckLogin, UserController.EditTourBookForm);
router.get('/tour_detail/:id', AuthMiddleware.CheckLogin, UserController.TourDetail);
router.post('/update_tour_booking', AuthMiddleware.CheckLogin, UserController.UpdateTourBook);
router.get('/delete_booking_tour/:id', AuthMiddleware.CheckLogin, UserController.DeleteBookTour);


module.exports = router;
const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

router.use(authController.isLoggedIn);

router.get(
	'/',
	// bookingController.createBookingCheckout, // temporary solution
	authController.isLoggedIn,
	viewsController.getOverview
);
router.get('/tours/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get(
	'/me',
	authController.protectRoute,
	viewsController.getAccountSettingsPage
);
router.get(
	'/my-tours',
	authController.protectRoute,
	viewsController.getMyTours
);

module.exports = router;

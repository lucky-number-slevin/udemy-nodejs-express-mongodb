const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
	// 1. get tour data from collection
	const tours = await Tour.find();

	res.status(200).render('overview', {
		title: 'All Tours',
		tours
	});
});

exports.getTour = catchAsync(async (req, res, next) => {
	// 1. get the data for the requested tour (include reviews and quides)
	const tour = await Tour.findOne({ slug: req.params.slug }).populate({
		path: 'reviews',
		fields: 'reivew rating user'
	});
	if (!tour) {
		return next(new AppError('There is no tour with that name', 404));
	}
	res.status(200).render('tour', {
		title: tour.name,
		tour
	});
});

exports.getLoginForm = (req, res) => {
	res.status(200).render('login', {
		title: 'Login'
	});
};

exports.getAccountSettingsPage = async (req, res, next) => {
	res.status(200).render('account', {
		title: 'My Account'
	});
};

exports.getMyTours = catchAsync(async (req, res, next) => {
	// 1. Find all bookings
	const bookings = await Booking.find({ user: req.user.id });

	// 2. Find tours with the returned IDs
	const tourIDs = bookings.map(element => element.tour);
	const tours = await Tour.find({ _id: { $in: tourIDs } });

	res.status(200).render('overview', {
		title: 'My Tours',
		tours
	});
});

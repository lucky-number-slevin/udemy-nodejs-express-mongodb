const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');

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

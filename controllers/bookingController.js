const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
	// 1. get currently booked tour
	const tour = await Tour.findById(req.params.tourId);

	// 2. create checkout session
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		success_url: `${req.protocol}://${req.get('host')}/?tour=${
			req.params.tourId
		}&user=${req.user.id}&price=${tour.price}`,
		cancel_url: `${req.protocol}://${req.get('host')}/toru/${tour.slug}`,
		customer_email: req.user.email,
		client_reference_id: req.params.tourId,
		line_items: [
			{
				name: `${tour.name} Tour`,
				description: tour.summary,
				images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
				amount: tour.price * 100, // amount is exprected in cents
				currency: 'usd',
				quantity: 1
			}
		]
	});

	// 3. create session as response
	res.status(200).json({
		status: 'success',
		session
	});
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
	// this is only TEMPORARY, bacause it's UNSECURE - everyone
	// could book a tour without paying
	const { tour, user, price } = req.query;

	if (!tour && !user && !price) return next();

	await Booking.create({ tour, user, price });

	res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = handlerFactory.getAll(Booking);
exports.createBooking = handlerFactory.createOne(Booking);
exports.getBooking = handlerFactory.getOne(Booking);
exports.updateBooking = handlerFactory.updateOne(Booking);
exports.deleteBooking = handlerFactory.deleteOne(Booking);

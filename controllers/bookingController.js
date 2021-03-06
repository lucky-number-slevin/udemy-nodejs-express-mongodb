const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
	// 1. get currently booked tour
	const tour = await Tour.findById(req.params.tourId);

	// 2. create checkout session
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		// temporary solution (before going into production)
		// success_url: `${req.protocol}://${req.get('host')}/?tour=${
		// 	req.params.tourId
		// }&user=${req.user.id}&price=${tour.price}`,
		success_url: `${req.protocol}://${req.get('host')}/my-tours`,
		cancel_url: `${req.protocol}://${req.get('host')}/toru/${tour.slug}`,
		customer_email: req.user.email,
		client_reference_id: req.params.tourId,
		line_items: [
			{
				name: `${tour.name} Tour`,
				description: tour.summary,
				images: [
					`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
				],
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

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
// 	// this is only TEMPORARY, bacause it's UNSECURE - everyone
// 	// could book a tour without paying
// 	const { tour, user, price } = req.query;

// 	if (!tour && !user && !price) return next();

// 	await Booking.create({ tour, user, price });

// 	res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async session => {
	console.log('STRIPE SESSION', session); // TODO: DELETE
	const tour = session.client_reference_id;
	const user = await User.findOne({ email: session.customer_email });
	if (!user) {
		console.log('Cannot find user with email: ', session.customer_email);
		return;
	}
	const price = session.display_items[0].amount / 100;
	await Booking.create({ tour, user: user.id, price });
};

exports.webhookCheckout = (req, res, next) => {
	const signature = req.headers['stripe-signature'];

	let event;
	try {
		event = stripe.webhooks.constructEvent(
			req.body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET
		);
	} catch (err) {
		return res.status(400).send(`Webhook error: ${err.message}`);
	}

	if (event.type === 'checkout.session.completed') {
		createBookingCheckout(event.data.object);
	}
	res.status(200).json({ received: true });
};

exports.getAllBookings = handlerFactory.getAll(Booking);
exports.createBooking = handlerFactory.createOne(Booking);
exports.getBooking = handlerFactory.getOne(Booking);
exports.updateBooking = handlerFactory.updateOne(Booking);
exports.deleteBooking = handlerFactory.deleteOne(Booking);

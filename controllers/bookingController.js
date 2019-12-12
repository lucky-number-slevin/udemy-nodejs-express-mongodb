const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./handlerFactory');
const axios = require('axios');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. get currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2. create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
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

const createBookingCheckout = async session => {
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

exports.getAllBookings = catchAsync(async (req, res, next) => {
  const BOOKINGS_URL =
    'https://x6t6qzt6xg.execute-api.eu-central-1.amazonaws.com/dev/bookings';
  const bookings = (await axios(BOOKINGS_URL)).data.Items;

  res.status(200).json({
    status: 'success',
    message: 'THESE BOOKINGS ARE COMING FROM SERVERLESS APPLICATION',
    results: bookings.length,
    data: bookings
  });
});

exports.getBooking = catchAsync(async (req, res, next) => {
  const BOOKINGS_URL = `https://x6t6qzt6xg.execute-api.eu-central-1.amazonaws.com/dev/bookings/${req.params.id}`;
  const booking = (await axios(BOOKINGS_URL)).data;

  if (!booking) {
    return next(
      new AppError(`No document found with ID ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'THIS BOOKING IS COMING FROM SERVERLESS APPLICATION',
    data: booking
  });
});

exports.createBooking = catchAsync(async (req, res, next) => {
  const BOOKINGS_URL =
    'https://x6t6qzt6xg.execute-api.eu-central-1.amazonaws.com/dev/bookings';
  const response = await axios.post(BOOKINGS_URL, req.body);

  res.status(201).json({
    status: 'success',
    data: response.data
  });
});

exports.deleteBooking = catchAsync(async (req, res, next) => {
  const BOOKINGS_URL = `https://x6t6qzt6xg.execute-api.eu-central-1.amazonaws.com/dev/bookings/${req.params.id}`;
  const response = await axios.delete(BOOKINGS_URL);

  console.log(response);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

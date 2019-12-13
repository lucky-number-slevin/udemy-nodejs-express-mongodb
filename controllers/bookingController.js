const catchAsync = require('./../utils/catchAsync');
const axios = require('axios');

exports.getAllBookings = catchAsync(async (req, res, next) => {
  const bookings = (await axios(process.env.BOOKINGS_API_URL)).data.Items;

  res.status(200).json({
    status: 'success',
    message: 'THESE BOOKINGS ARE COMING FROM SERVERLESS APPLICATION',
    results: bookings.length,
    data: bookings
  });
});

exports.getBooking = catchAsync(async (req, res, next) => {
  const BOOKINGS_URL = `${process.env.BOOKINGS_API_URL}/${req.params.id}`;
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
  const response = await axios.post(process.env.BOOKINGS_API_URL, req.body);

  res.status(201).json({
    status: 'success',
    data: response.data
  });
});

exports.deleteBooking = catchAsync(async (req, res, next) => {
  const BOOKINGS_URL = `${process.env.BOOKINGS_API_URL}/${req.params.id}`;
  const response = await axios.delete(BOOKINGS_URL);

  console.log(response);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';
import dotenv from 'dotenv';

dotenv.config({ path: './../../config.env' });

console.log('BOOKINGS_API_URL', process.env.BOOKINGS_API_URL);
console.log('BOOKINGS_API_URL', process.env.STRIPE_KEY);
const stripe = Stripe(process.env.STRIPE_KEY);

export const bookTour = async tourId => {
  try {
    // 1. get the checkout session from the server (API)
    const sessionUrl = `${process.env.BOOKINGS_API_URL}/checkout-session`;
    console.log(`SESSION: ${sessionUrl}/${tourId}`);
    const session = await axios.get(`${sessionUrl}/${tourId}`);

    // 2 Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

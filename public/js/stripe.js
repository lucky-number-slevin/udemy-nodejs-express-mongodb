/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe('pk_test_YmprdTa57CkXANzE4eUTa8Ml00hvPMwGpC');

export const bookTour = async tourId => {
  try {
    // 1. get the checkout session from the server (API)
    const sessionUrl =
      'https://5t5oik79za.execute-api.eu-central-1.amazonaws.com/dev/bookings/checkout-session';
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

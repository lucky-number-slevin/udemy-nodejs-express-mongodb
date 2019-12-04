/* esling-disable */

import '@babel/polyfill';
import { login, logout } from './auth';
import { displayMap } from './mapbox';
import { updateUserSettings } from './userSettings';
import { bookTour } from './stripe';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.login-form form');
const logoutButton = document.querySelector('.nav__el--logout');
const userSettingsForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookButton = document.getElementById('book-tour-btn');

if (mapBox) {
	const locations = JSON.parse(mapBox.dataset.locations);
	displayMap(locations);
}

if (loginForm) {
	loginForm.addEventListener('submit', event => {
		event.preventDefault();
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;
		login(email, password);
	});
}

if (logoutButton) {
	logoutButton.addEventListener('click', logout);
}

if (userSettingsForm) {
	userSettingsForm.addEventListener('submit', event => {
		event.preventDefault();
		// create multipart form
		const form = new FormData();
		form.append('name', document.getElementById('name').value);
		form.append('email', document.getElementById('email').value);
		form.append('photo', document.getElementById('photo').files[0]);

		updateUserSettings(form);
	});
}

if (userPasswordForm) {
	userPasswordForm.addEventListener('submit', async event => {
		event.preventDefault();
		const submitButton = document.getElementById('update-password-btn');
		const submitButtonText = submitButton.textContent;
		submitButton.textContent = 'Updating...';

		const passwordCurrent = document.getElementById('password-current').value;
		const password = document.getElementById('password').value;
		const passwordConfirm = document.getElementById('password-confirm').value;
		await updateUserSettings(
			{ passwordCurrent, password, passwordConfirm },
			'password'
		);
		document.getElementById('password-current').value = '';
		document.getElementById('password').value = '';
		document.getElementById('password-confirm').value = '';
		submitButton.textContent = submitButtonText;
	});
}

if (bookButton) {
	bookButton.addEventListener('click', event => {
		event.target.textContent = 'Processing...';
		const { tourId } = event.target.dataset;
		bookTour(tourId);
	});
}

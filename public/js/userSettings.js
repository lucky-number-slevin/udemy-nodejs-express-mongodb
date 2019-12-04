/* esling-disable */

import axios from 'axios';

import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateUserSettings = async (data, type = 'data') => {
	try {
		const urlEndpoint = type === 'data' ? 'update-me' : 'update-my-password';
		const res = await axios({
			method: 'PATCH',
			url: `/api/v1/users/${urlEndpoint}`,
			data
		});

		if (res.data.status === 'success') {
			showAlert('success', `${type.toUpperCase()} updated successfully`, true);
		}
	} catch (err) {
		showAlert('error', err.response.data.message);
	}
};

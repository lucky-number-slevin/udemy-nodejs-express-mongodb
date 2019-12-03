/* esling-disable */

const login = async (email, password) => {
	console.log('EMAIL', email, 'PASSWORD', password);
	try {
		const res = await axios({
			method: 'POST',
			url: 'http://localhost:3000/api/v1/users/login',
			data: {
				email,
				password
			}
		});

		if (res.data.status === 'success') {
			alert('Logged in successfully');
			window.setTimeout(() => {
				location.assign('/');
			}, 1500);
		}
	} catch (err) {
		alert(err.response.data.message);
	}
};

document.querySelector('.login-form form').addEventListener('submit', event => {
	event.preventDefault();
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;
	login(email, password);
});

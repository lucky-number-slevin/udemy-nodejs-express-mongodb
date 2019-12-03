/* esling-disable */

// type is 'succes' or 'error'
export const showAlert = (type, message) => {
	removeAlerts();
	const markup = `<div class="alert alert--${type}">${message}</div>`;
	document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
	window.setTimeout(removeAlerts, 4000);
};

export const removeAlerts = () => {
	const element = document.querySelector('.alert');
	if (element) element.parentElement.removeChild(element);
};

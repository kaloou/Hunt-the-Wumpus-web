const up = document.querySelector('#up');
const down = document.querySelector('#down');
const left = document.querySelector('#left');
const right = document.querySelector('#right');

document.addEventListener('keydown', (e) => {
	if (e.key === 'ArrowUp') {
		up.click();
	}

	if (e.key === 'ArrowDown') {
		down.click();
	}

	if (e.key === 'ArrowLeft') {
		left.click();
	}

	if (e.key === 'ArrowRight') {
		right.click();
	}

	if (e.key === ' ') {
		// espace pour tirer
		shoot.click();
	}
});

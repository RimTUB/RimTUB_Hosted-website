const header = document.querySelector('.header');
const headerContainer = header.querySelector('.header__container');
const root = document.documentElement;

const headerHeight = getComputedStyle(header).height;
const headerContainerPadding = getComputedStyle(headerContainer).paddingBlock;

document.addEventListener('DOMContentLoaded', () => {
	root.style.setProperty('--header-height', `${headerHeight}`);
	root.style.setProperty('--header-padding', `${headerContainerPadding}`);
})
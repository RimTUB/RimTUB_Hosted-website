class Menu {
	selectors = {
		header: '.header',
		burger: '.burger',
		menu: '.menu'
	}

	constructor() {
		this.burger = document.querySelector(this.selectors.burger)
		this.menu = document.querySelector(this.selectors.menu)
		this.header = document.querySelector(this.selectors.header)
		this.body = document.body

		this.init()
	}

	init() {
		this.burger.addEventListener('click', () => {
			if (this.header.classList.contains('open')) {
				this.closeMenu()
			}
			else {
				this.openMenu()
			}
		})
	}

	openMenu() {
		this.header.classList.add('open')
		this.burger.setAttribute('aria-expanded', 'true')
		this.body.classList.add('disabled-scroll')
	}

	closeMenu() {
		this.header.classList.remove('open')
		this.burger.setAttribute('aria-expanded', 'false')
		this.body.classList.remove('disabled-scroll')
	}
}

new Menu()
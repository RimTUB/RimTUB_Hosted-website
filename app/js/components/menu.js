class Menu {
	selectors = {
		header: '.header',
		burger: '.burger',
		menu: '.menu',
		links: '.menu__link'
	}

	constructor() {
		this.burger = document.querySelector(this.selectors.burger)
		this.menu = document.querySelector(this.selectors.menu)
		this.header = document.querySelector(this.selectors.header)
		this.body = document.body
		this.links = document.querySelectorAll(this.selectors.links)

		this.scrollPos = 0

		this.init()
	}

	closeMenuClickLink() {
		this.links.forEach((e) => {
			e.addEventListener('click', () => {
				this.closeMenu()
			})
		})
	}

	init() {
		this.closeMenuClickLink()

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
  this.scrollPos = window.scrollY

  this.body.style.top = `-${this.scrollPos}px`
  this.body.classList.add('disabled-scroll')
  this.header.classList.add('open')
  this.burger.setAttribute('aria-expanded', 'true')
	}

	closeMenu() {
  this.header.classList.remove('open')
  this.burger.setAttribute('aria-expanded', 'false')
  this.body.classList.remove('disabled-scroll')
  this.body.style.top = ''
  window.scrollTo({
		top: this.scrollPos,
		behavior: 'instant'
	})
	}
}

new Menu()
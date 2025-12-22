import TransferElements from 'transfer-elements';

class Translate {
	selectors = {
		translate: '.translate',
		choose: '.translate__choose',
		list: '.translate__list'
	}

	constructor() {
		this.translate = document.querySelector(this.selectors.translate)
		this.choose = this.translate.querySelector(this.selectors.choose)
		this.list = this.translate.querySelector(this.selectors.list)
		this.init()

	}

	init() {
		this.translate.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				this.openMenu()
			}

			if (e.key === 'Escape') {
				this.closeMenu()
				this.choose.focus()
			}
		})

		this.translate.addEventListener('focusout', (e) => {
			if (!this.translate.contains(e.relatedTarget)) {
				this.closeMenu()
			}
		})

		this.translate.addEventListener('mouseenter', () => {
			this.openMenu(false)
		})

		this.translate.addEventListener('mouseleave', () => {
			this.closeMenu(false)
		})
	}

	openMenu(attribute = true) {
		this.translate.classList.add('open')
		if (attribute) {
			this.choose.setAttribute('aria-expanded', 'true')
		}
		this.list.hidden = false
	}

	closeMenu(attribute = true) {
		this.translate.classList.remove('open')
		if (attribute) {
			this.choose.setAttribute('aria-expanded', 'false')
		}
		this.list.hidden = true
	}

}

new Translate();

new TransferElements({
	sourceElement: document.querySelector('.translate'),
	breakpoints: {
		1024: {
			targetElement: document.querySelector('.menu'),
			targetPosition: 1
		}
	}
})
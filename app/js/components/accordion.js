class Accordion {
	constructor(element) {
		this.element = element
		this.openButton = element.querySelector('.accordion__open')
		this.content = element.querySelector('.accordion__content')

		if (!this.openButton || !this.content) return

		this.element.addEventListener('click', this.init.bind(this))
	}

	init() {
		const isOpen = this.element.classList.toggle('open')

		if (isOpen) {
			this.open()
		} else {
			this.close()
		}
	}

	open() {
		this.openButton.setAttribute('aria-expanded', 'true')
		this.content.setAttribute('aria-hidden', 'false')
		this.content.style.maxHeight = this.content.scrollHeight + 'px'
	}

	close() {
		this.openButton.setAttribute('aria-expanded', 'false')
		this.content.setAttribute('aria-hidden', 'true')
		this.content.style.maxHeight = this.content.scrollHeight + 'px'

		requestAnimationFrame(() => {
			this.content.style.maxHeight = '0'
		})
	}
}

document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.accordion').forEach(el => new Accordion(el))
})
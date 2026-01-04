import TransferElements from 'transfer-elements';

class TranslateMenu {
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

class Translate {
	constructor(defaultLang = 'ru') {
		this.currentLang = sessionStorage.getItem('lang') || defaultLang
		this.translations = {}
		this.availableLanguages = this.getAvailableLanguages()
	}

	getAvailableLanguages() {
		const langLinks = document.querySelectorAll('[data-lang-switch]')
		const languages = []

		langLinks.forEach(link => {
			const lang = link.dataset.langSwitch
			if (lang && !languages.includes(lang)) {
				languages.push(lang)
			}
		})

		return languages
	}

	async loadLanguage(lang) {
		if (this.translations[lang]) {
			return this.translations[lang]
		}

		try {
			const response = await fetch(`resources/locales/${lang}.json`)

			if (!response.ok) {
				throw new Error(`Failed to load ${lang}`)
			}

			this.translations[lang] = await response.json()
			return this.translations[lang]
		} catch (error) {
			console.error(`Error loading language ${lang}:`, error)
			return null
		}
	}

	getTranslation(key) {
		const keys = key.split('.')
		let value = this.translations[this.currentLang]

		for (const k of keys) {
			if (value && typeof value === 'object') {
				value = value[k]
			} else {
				return key
			}
		}

		return value || key
	}

	async changeLanguage(lang) {
		if (!this.availableLanguages.includes(lang)) {
			console.error(`Language ${lang} is not available`)
			return
		}

		await this.loadLanguage(lang)
		this.currentLang = lang

		sessionStorage.setItem('lang', lang)

		const html = document.documentElement
		html.setAttribute('lang', lang)
		html.lang = lang

		this.updatePage()
		this.updateActiveMenuItem(lang)
		this.updateChooseButton(lang)
	}

	replaceTextNodes(element, translation) {
		// Сохраняем все дочерние элементы (кнопки, ссылки и т.д.)
		const childElements = Array.from(element.children)

		// Если есть плейсхолдеры типа {0}, {1}, {2}
		if (/\{(\d+)(?::([^}]+))?\}/.test(translation)) {
			// Создаем временный контейнер для парсинга перевода
			const temp = document.createElement('div')

			// Заменяем плейсхолдеры на временные маркеры
			let processedTranslation = translation
			const placeholders = translation.match(/\{(\d+)(?::([^}]+))?\}/g) || []

			placeholders.forEach(placeholder => {
				const match = placeholder.match(/\{(\d+)(?::([^}]+))?\}/)
				const index = parseInt(match[1])
				const innerText = match[2] // текст для замены внутри элемента

				const marker = `<span data-placeholder="${index}" data-inner-text="${innerText || ''}"></span>`
				processedTranslation = processedTranslation.replace(placeholder, marker)
			})

			temp.innerHTML = processedTranslation

			// Заменяем маркеры на реальные элементы
			temp.querySelectorAll('[data-placeholder]').forEach(marker => {
				const index = parseInt(marker.getAttribute('data-placeholder'))
				const innerText = marker.getAttribute('data-inner-text')

				if (childElements[index]) {
					const clonedElement = childElements[index].cloneNode(true)

					// Если указан текст для замены внутри элемента
					if (innerText) {
						clonedElement.textContent = innerText
					}

					marker.replaceWith(clonedElement)
				}
			})

			element.innerHTML = temp.innerHTML
		} else {
			// Если плейсхолдеров нет, просто заменяем текстовые узлы
			const walker = document.createTreeWalker(
				element,
				NodeFilter.SHOW_TEXT,
				null,
				false
			)

			const textNodes = []
			let node
			while (node = walker.nextNode()) {
				if (node.nodeValue.trim()) {
					textNodes.push(node)
				}
			}

			if (textNodes.length === 1) {
				textNodes[0].nodeValue = translation
			} else if (textNodes.length > 0) {
				textNodes[0].nodeValue = translation
				for (let i = 1; i < textNodes.length; i++) {
					textNodes[i].nodeValue = ''
				}
			}
		}
	}

	updatePage() {
		document.querySelectorAll('[data-lang]').forEach(element => {
			const key = element.getAttribute('data-lang')
			const translation = this.getTranslation(key)

			if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
				element.placeholder = translation
			} else {
				// Проверяем, есть ли внутри элемента HTML-теги
				const hasHtmlTags = element.children.length > 0

				if (hasHtmlTags) {
					// Если в переводе есть HTML-теги, используем innerHTML
					if (/<[^>]+>/.test(translation)) {
						element.innerHTML = translation
					} else {
						// Если нет, заменяем только текст, сохраняя структуру
						this.replaceTextNodes(element, translation)
					}
				} else {
					// Если нет тегов, используем textContent
					element.textContent = translation
				}
			}
		})

		document.dispatchEvent(new CustomEvent('languageChanged', {
			detail: { lang: this.currentLang }
		}))
	}

	updateActiveMenuItem(lang) {
		document.querySelectorAll('.translate__item').forEach(item => {
			const link = item.querySelector('[data-lang-switch]')
			if (link && link.dataset.langSwitch === lang) {
				item.classList.add('active')
			} else {
				item.classList.remove('active')
			}
		})
	}

	updateChooseButton(lang) {
		const chooseButton = document.querySelector('.translate__choose')

		if (chooseButton) {
			const langLink = document.querySelector(`[data-lang-switch="${lang}"]`)
			if (langLink) {
				chooseButton.textContent = langLink.textContent
				chooseButton.lang = lang
			}
		}
	}

	async init() {
		await this.loadLanguage(this.currentLang)

		this.availableLanguages.forEach(lang => {
			if (lang !== this.currentLang) {
				this.loadLanguage(lang)
			}
		})

		const html = document.documentElement
		html.setAttribute('lang', this.currentLang)
		html.lang = this.currentLang

		this.updatePage()
		this.updateActiveMenuItem(this.currentLang)
		this.updateChooseButton(this.currentLang)

		document.querySelectorAll('[data-lang-switch]').forEach(link => {
			link.addEventListener('click', (e) => {
				e.preventDefault()
				const lang = link.dataset.langSwitch
				this.changeLanguage(lang)
			})
		})
	}
}

new TranslateMenu()
const translator = new Translate('ru')

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => translator.init())
} else {
	translator.init()
}

new TransferElements({
	sourceElement: document.querySelector('.translate'),
	breakpoints: {
		1024: {
			targetElement: document.querySelector('.menu'),
			targetPosition: 1
		}
	}
})
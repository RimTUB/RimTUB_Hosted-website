import TransferElements from 'transfer-elements'

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
		this.currentLang = localStorage.getItem('lang') || defaultLang
		this.defaultLang = defaultLang
		this.translations = {}
		this.availableLanguages = []
		this.languageTitles = {}
		this.basePath = this.getBasePath()
	}

	getBasePath() {
		const depth = (window.location.pathname.match(/\//g) || []).length - 1
		return depth > 0 ? '../'.repeat(depth) : './'
	}

	async loadManifest() {
		try {
			const response = await fetch(`${this.basePath}resources/locales/manifest.json`)
			if (!response.ok) {
				throw new Error('Manifest not found')
			}

			const manifest = await response.json()

			if (manifest.languages && Array.isArray(manifest.languages)) {
				this.availableLanguages = manifest.languages.map(lang => lang.code)

				manifest.languages.forEach(lang => {
					this.languageTitles[lang.code] = lang.title
				})

				return manifest.languages
			}

			return []
		} catch (error) {
			console.error('Error loading manifest:', error)
			console.warn('Запустите gulp сборку для генерации manifest.json')
			return []
		}
	}

	generateLanguageMenu(languages) {
		const translateContainer = document.querySelector('.translate')
		if (!translateContainer) return

		const list = translateContainer.querySelector('.translate__list')
		if (!list) return

		list.innerHTML = ''

		languages.forEach(lang => {
			const li = document.createElement('li')
			li.className = 'translate__item'

			if (lang.code === this.currentLang) {
				li.classList.add('active')
			}

			const link = document.createElement('a')
			link.className = 'translate__link'
			link.href = ''
			link.target = '_self'
			link.lang = lang.code
			link.dataset.langSwitch = lang.code
			link.textContent = lang.title

			link.addEventListener('click', (e) => {
				e.preventDefault()
				this.changeLanguage(lang.code)
			})

			li.appendChild(link)
			list.appendChild(li)
		})
	}

	async loadLanguage(lang) {
		if (this.translations[lang]) {
			return this.translations[lang]
		}

		try {
			const response = await fetch(`${this.basePath}resources/locales/${lang}.json`)

			if (!response.ok) {
				throw new Error(`Failed to load ${lang}`)
			}

			const data = await response.json()
			this.translations[lang] = data

			if (data.__title__) {
				this.languageTitles[lang] = data.__title__
			}

			return data
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

		localStorage.setItem('lang', lang)

		const html = document.documentElement
		html.setAttribute('lang', lang)
		html.lang = lang

		const translateBlock = document.querySelector('.translate')
		if (translateBlock) {
			translateBlock.setAttribute('lang', lang)
		}

		this.updatePage()
		this.updateActiveMenuItem(lang)
		this.updateChooseButton(lang)
	}

	replaceTextNodes(element, translation) {
		const childElements = Array.from(element.children)

		if (/\{(\d+)(?::([^}]+))?\}/.test(translation)) {
			const temp = document.createElement('div')

			let processedTranslation = translation
			const placeholders = translation.match(/\{(\d+)(?::([^}]+))?\}/g) || []

			placeholders.forEach(placeholder => {
				const match = placeholder.match(/\{(\d+)(?::([^}]+))?\}/)
				const index = parseInt(match[1])
				const innerText = match[2]

				const marker = `<span data-placeholder="${index}" data-inner-text="${innerText || ''}"></span>`
				processedTranslation = processedTranslation.replace(placeholder, marker)
			})

			temp.innerHTML = processedTranslation

			temp.querySelectorAll('[data-placeholder]').forEach(marker => {
				const index = parseInt(marker.getAttribute('data-placeholder'))
				const innerText = marker.getAttribute('data-inner-text')

				if (childElements[index]) {
					const clonedElement = childElements[index].cloneNode(true)

					if (innerText) {
						clonedElement.textContent = innerText
					}

					marker.replaceWith(clonedElement)
				}
			})

			element.innerHTML = temp.innerHTML
		} else {
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
				const hasHtmlTags = element.children.length > 0

				if (hasHtmlTags) {
					if (/<[^>]+>/.test(translation)) {
						element.innerHTML = translation
					} else {
						this.replaceTextNodes(element, translation)
					}
				} else {
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
			const title = this.languageTitles[lang] || lang.toUpperCase()
			chooseButton.textContent = title
			chooseButton.lang = lang
		}
	}

	async init() {
		const languages = await this.loadManifest()

		if (languages.length === 0) {
			console.error('No languages found. Run gulp build.')
			return
		}

		if (!this.availableLanguages.includes(this.currentLang)) {
			console.warn(`Saved language ${this.currentLang} not found. Using default: ${this.defaultLang}`)
			this.currentLang = this.defaultLang
			localStorage.setItem('lang', this.defaultLang)
		}

		this.generateLanguageMenu(languages)
		await this.loadLanguage(this.currentLang)

		const html = document.documentElement
		html.setAttribute('lang', this.currentLang)
		html.lang = this.currentLang

		const translateBlock = document.querySelector('.translate')
		if (translateBlock) {
			translateBlock.setAttribute('lang', this.currentLang)
		}

		this.updatePage()
		this.updateActiveMenuItem(this.currentLang)
		this.updateChooseButton(this.currentLang)
	}
}

new TranslateMenu()
const translator = new Translate('ru')

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => translator.init())
} else {
	translator.init()
}

const menuOther = document.querySelector('.menu')

if (menuOther) {
	new TransferElements({
	sourceElement: document?.querySelector('.translate'),
	breakpoints: {
		1024: {
			targetElement: document?.querySelector('.menu'),
			targetPosition: 1
		}
	}
})
}

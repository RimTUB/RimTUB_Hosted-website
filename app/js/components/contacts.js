document.addEventListener('DOMContentLoaded', function () {
	document.querySelectorAll('[data-dynamic-link]').forEach(link => {
		const path = link.getAttribute('data-dynamic-link')
		const fullUrl = window.location.origin + path 

		link.href = fullUrl
		const hostName = window.location.hostname + path
		const span = link?.querySelector('span')
		if (span) {
			span.textContent = hostName;
		}
	})
})
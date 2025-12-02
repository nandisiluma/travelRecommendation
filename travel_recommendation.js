// --- Search functionality for navbar ---
document.addEventListener('DOMContentLoaded', function() {
	const form = document.getElementById('search-form') || document.querySelector('#navbar form');
	if (!form) {
		console.warn('Search form not found on page. Aborting search initialization.');
		return;
	}
	const searchInput = document.getElementById('search-input') || form.querySelector('input[type="search"]');
	const searchButton = document.getElementById('search-button') || form.querySelector('button[type="submit"]');
	const clearButton = document.getElementById('clear-button') || form.querySelector('button[type="button"]');
	let recommendations = null;

	// Fetch recommendations once and store
	fetch('travel_recommendation_api.json')
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		})
		.then(data => {
			recommendations = data;
			console.log('Recommendation Results:', data);
		})
		.catch(error => {
			console.error('Error fetching recommendation results:', error);
		});

	searchButton.addEventListener('click', function(e) {
		e.preventDefault();
		if (!recommendations) {
			console.warn('Recommendations data not yet loaded');
			return;
		}
		const keyword = searchInput.value.trim().toLowerCase();
		let results = [];

		// Keyword variations
		if (["beach", "beaches"].includes(keyword)) {
			results = Array.isArray(recommendations.beaches) ? recommendations.beaches : [];
		} else if (["temple", "temples"].includes(keyword)) {
			results = Array.isArray(recommendations.temples) ? recommendations.temples : [];
		} else {
			// Check for country match (case-insensitive, partial match)
			const countries = Array.isArray(recommendations.countries) ? recommendations.countries : [];
			results = countries.filter(country =>
				country && country.name && country.name.toLowerCase().includes(keyword)
			);
			// If not found in countries, check in cities
			if (results.length === 0) {
				countries.forEach(country => {
					if (!country || !Array.isArray(country.cities)) return;
					country.cities.forEach(city => {
						if (city && city.name && city.name.toLowerCase().includes(keyword)) {
							results.push({
								name: city.name,
								imageUrl: city.imageUrl,
								description: city.description
							});
						}
					});
				});
			}
		}

		displayResults(results);
	});

		clearButton.addEventListener('click', function(e) {
			e.preventDefault();
			searchInput.value = '';
			clearResults();
		});

		function clearResults() {
			let resultsDiv = document.getElementById('search-results');
			if (resultsDiv) {
				resultsDiv.innerHTML = '';
			}
		}

		function displayResults(results) {
			let resultsDiv = document.getElementById('search-results');
			if (!resultsDiv) {
				resultsDiv = document.createElement('div');
				resultsDiv.id = 'search-results';
				document.body.insertBefore(resultsDiv, document.getElementById('main-content').nextSibling);
			}
			resultsDiv.innerHTML = '';
			if (!results || results.length === 0) {
				resultsDiv.textContent = 'No results found.';
				return;
			}

			// Simple mapping of country to IANA timezone
			const countryTimezones = {
				'australia': 'Australia/Sydney',
				'japan': 'Asia/Tokyo',
				'brazil': 'America/Sao_Paulo',
				'cambodia': 'Asia/Phnom_Penh',
				'india': 'Asia/Kolkata',
				'french polynesia': 'Pacific/Tahiti'
			};

			function getCountryFromName(name) {
				// Try to extract country from the name string
				const lower = name.toLowerCase();
				for (const country in countryTimezones) {
					if (lower.includes(country)) return country;
				}
				return null;
			}

			function getLocalTime(countryKey) {
				if (!countryKey || !countryTimezones[countryKey]) return '';
				try {
					const now = new Date();
					return now.toLocaleTimeString('en-US', { timeZone: countryTimezones[countryKey], hour: '2-digit', minute: '2-digit' });
				} catch {
					return '';
				}
			}

			results.forEach(item => {
				if (!item || typeof item !== 'object') return; // defensive
				const card = document.createElement('div');
				card.style.border = '1px solid #ccc';
				card.style.margin = '10px';
				card.style.padding = '10px';
				card.style.borderRadius = '8px';
				card.style.background = '#f9f9f9';
				let img = '';
				const itemName = item.name || item.title || 'Unknown';
				if (item.imageUrl) {
					img = `<img src="${item.imageUrl}" alt="${itemName}" style="width:100px;height:auto;">`;
				}
				// Get country from name and show time if available
				const countryKey = getCountryFromName(itemName);
				const localTime = getLocalTime(countryKey);
				let timeHtml = '';
				if (localTime) {
					timeHtml = `<p><strong>Local time:</strong> ${localTime}</p>`;
				}
				const description = item.description || item.summary || '';
				card.innerHTML = `${img}<h3>${itemName}</h3><p>${description}</p>${timeHtml}`;
				resultsDiv.appendChild(card);
			});
		}
});


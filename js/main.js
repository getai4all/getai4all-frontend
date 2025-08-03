// JavaScript für das mobile Navigationsmenü (Hamburger-Icon), Countdown, Chatbot und Tool-Vergleichsfunktionalität
document.addEventListener('DOMContentLoaded', () => {
    // === GLOBALE VARIABLEN & HELPER-FUNKTIONEN FÜR ALLE SEITEN ===
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const countdownElement = document.getElementById('countdown-timer'); // Haupt-Countdown (Startseite)

    // Countdown-Elemente für AI-Driven Markets Seite
    const countdownMarketsStep1 = document.getElementById('countdown-timer-markets-step1');
    const countdownMarketsStep2 = document.getElementById('countdown-timer-markets-step2');
    const countdownCoinPage = document.getElementById('countdown-timer-coin'); // NEU: Countdown für Coin-Seite

    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatbotPopup = document.getElementById('chatbot-popup');
    const closeChatbotBtn = document.getElementById('close-chatbot');

    const compareFloatBtn = document.getElementById('compare-float-btn');
    const selectedCountSpan = document.getElementById('selected-count');
    const comparePopup = document.getElementById('compare-popup');
    const closeComparePopupBtn = document.getElementById('close-compare-popup');
    const comparisonDetailsGrid = document.querySelector('.comparison-details-grid');
    const noToolsSelectedMsg = comparePopup ? comparePopup.querySelector('.no-tools-selected') : null;
    let selectedToolsData = []; // Speichert die Daten der aktuell für den Vergleich ausgewählten Tools (stabil)

    // Formulare
    const newsletterForm = document.getElementById('newsletter-form');
    const contactForm = document.getElementById('contact-form-about');

    // Basis-URL für dein Backend (lokale Entwicklung)
   const BACKEND_API_BASE_URL = 'https://getai4all-backend.onrender.com/api'; //

    // Helper-Funktion: Aktualisiert den Zähler und die Sichtbarkeit des Vergleichsbuttons
    const updateCompareButton = () => {
        if (selectedCountSpan) {
            selectedCountSpan.textContent = selectedToolsData.length;
        }
        if (compareFloatBtn) {
            if (selectedToolsData.length >= 2 && selectedToolsData.length <= 3) {
                compareFloatBtn.classList.add('active');
            } else {
                compareFloatBtn.classList.remove('active');
            }
        }
    };
    // Helper-Funktion: Sammelt Daten aus einer Tool-Karte für den Vergleich
    const getToolDataFromCard = (toolCard) => {
        // Diese Funktion sammelt nur die im DOM sichtbaren Daten der Tool-Card
        // Für das Popup holen wir die detaillierten Daten vom Backend
        return {
            id: toolCard.dataset.toolld,
            imgSrc: toolCard.querySelector('.tool-logo').src,
            toolName: toolCard.querySelector('h3').textContent,
            toolDescription: toolCard.querySelector('.tool-description').textContent,
            toolFeaturesHtml: toolCard.querySelector('.tool-features').innerHTML,
            toolPriceText: toolCard.querySelector('.tool-price').textContent,
            visitLink: toolCard.querySelector('.btn-primary').href
        };
    };

    // Handler-Funktion: Wird aufgerufen, wenn sich der Zustand einer Compare-Checkbox ändert
    const handleCompareCheckboxChange = (event) => {
        const checkbox = event.target;
        const toolCard = checkbox.closest('.tool-card');
        const toolId = toolCard.dataset.toolld;

        if (checkbox.checked) {
            if (selectedToolsData.length < 3) { // Max. 3 Tools
                // Beim Hinzufügen zum Vergleich, hole nur Basis-Daten.
                // Detaillierte Daten für das Vergleichs-Popup werden erst beim Öffnen des Popups geladen,
                // falls wir eine separate API dafür hätten oder sie direkt in selectedToolsData speichern wollten.
                // Für den jetzigen Zweck reicht es, die Tool-ID zu speichern.
                const toolData = { id: toolId, ...getToolDataFromCard(toolCard) };
                selectedToolsData.push(toolData);
            } else {
                checkbox.checked = false; // Checkbox zurücksetzen, wenn Limit erreicht
                alert('You can select a maximum of 3 tools for comparison.');
            }
        } else {
            selectedToolsData = selectedToolsData.filter(tool => tool.id !== toolId);
        }
        updateCompareButton();
    };

    // Funktion: Generiert die Vergleichsansicht im Popup
    const generateComparisonView = async () => { // Async, da wir Daten vom Backend holen könnten
        if (comparisonDetailsGrid && noToolsSelectedMsg) {
            comparisonDetailsGrid.innerHTML = ""; // Alten Inhalt leeren
            noToolsSelectedMsg.style.display = 'none'; // Nachricht ausblenden

            if (selectedToolsData.length === 0) {
                noToolsSelectedMsg.style.display = 'block';
                return;
            }

            // Hole detaillierte Daten für jedes ausgewählte Tool
            const detailedTools = [];
            for (const tool of selectedToolsData) {
                try {
                    const response = await fetch(`${BACKEND_API_BASE_URL}/tools/${tool.id}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const toolDetails = await response.json();
                    detailedTools.push(toolDetails);
                } catch (error) {
                    console.error(`Error loading details for tool ${tool.id}:`, error);
                    // Füge eine Fallback-Karte hinzu oder überspringe das Tool
                    detailedTools.push({
                        name: tool.toolName || 'Unknown Tool',
                        description: 'Could not load details.',
                        logoUrl: tool.imgSrc,
                        features: ['Details unavailable'],
                        priceDetails: 'N/A',
                        visitLink: '#',
                        // Füge alle Felder hinzu, die im compCard Template verwendet werden, mit Fallbacks
                    });
                }
            }


            detailedTools.forEach(toolDetails => { // Jetzt verwenden wir detailedTools
                const compCard = document.createElement('div');
                compCard.classList.add('comparison-card');
                compCard.innerHTML = `
                    <img src="${toolDetails.logoUrl}" alt="${toolDetails.name} Logo" class="comp-tool-logo">
                    <h4>${toolDetails.name}</h4>
                    <p class="comp-tool-description">${toolDetails.description}</p>
                    <ul class="comp-tool-features">
                        ${toolDetails.features && toolDetails.features.length > 0 ?
                            toolDetails.features.map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`).join('') :
                            '<li><i class="fas fa-info-circle"></i> No specific features listed.</li>'
                        }
                    </ul>
                    <div class="tool-price">${toolDetails.price === 0 ? 'Free' : `$${toolDetails.price}/month`} <br> <small>${toolDetails.priceDetails || ''}</small></div>
                    <a href="${toolDetails.visitLink}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Visit Tool</a>
                `;
                comparisonDetailsGrid.appendChild(compCard);
            });
        }
    };

    // Funktion, um den Checked-Status der Checkboxen im DOM mit selectedToolsData zu synchronisieren
    function syncCompareCheckboxStates() {
        document.querySelectorAll('.tool-card').forEach(toolCardElement => {
            const checkbox = toolCardElement.querySelector('.compare-checkbox');
            if (checkbox) {
                const toolId = toolCardElement.dataset.toolld;
                checkbox.checked = selectedToolsData.some(tool => tool.id === toolId);
            }
        });
        updateCompareButton(); // Checkboxen mit ausgewählten Tools synchronisieren
    }

    // === Dynamisches Laden der Tools vom Backend ===
    const toolGrid = document.querySelector('.tool-grid'); // Der Container für die Tools
    async function loadAndDisplayTools() {
        if (!toolGrid) return;
        const currentCategory = toolGrid.dataset.category;
        const searchInput = document.querySelector('.search-input');
        const typeFilter = document.getElementById('type-filter');
        const sortByFilter = document.getElementById('sort-by-filter');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const typeValue = typeFilter ? typeFilter.value : '';
        const sortByValue = sortByFilter ? sortByFilter.value : '';

        let url = `${BACKEND_API_BASE_URL}/tools?category=${currentCategory}`;
        if (searchTerm) url += `&searchTerm=${searchTerm}`;
        if (typeValue) url += `&type=${typeValue}`;
        if (sortByValue) url += `&sortBy=${sortByValue}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
            }
            const tools = await response.json();
            toolGrid.innerHTML = ''; // Alten Inhalt des Grids leeren

            if (tools.length === 0) {
                toolGrid.innerHTML = '<p style="text-align: center; color: #bbb; grid-column: 1/-1; padding: 50px;">No tools found matching your criteria.</p>';
                return;
            }

            tools.forEach(tool => {
                const toolCard = document.createElement('div');
                toolCard.classList.add('tool-card');
                toolCard.dataset.type = tool.type;
                toolCard.dataset.price = tool.price;
                toolCard.dataset.toolld = tool.dataToolId; // Wichtig für More Infos und Vergleich

                toolCard.innerHTML = `
                    <div class="tool-badges-left">
                        ${tool.type === 'open-source' ? '<span class="tool-badge open-source-badge">Open Source</span>' : ''}
                        ${tool.type === 'free' ? '<span class="tool-badge free-badge">Free Tier</span>' : ''}
                    </div>
                    <div class="tool-compare-right">
                        <label class="compare-checkbox-container">
                            <input type="checkbox" class="compare-checkbox">
                            <span class="checkmark"></span> Compare
                        </label>
                    </div>
                    <img src="${tool.logoUrl}" alt="${tool.name} Logo" class="tool-logo">
                    <div class="tool-header">
                        <h3>${tool.name}</h3>
                    </div>
                    <p class="tool-description">${tool.description}</p>
                    <ul class="tool-features">
                        ${tool.features.map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`).join('')}
                    </ul>
                    <div class="tool-price">${tool.price === 0 ? 'Free' : `$${tool.price}/month`} <br> <small>${tool.priceDetails}</small></div>
                    <a href="${tool.visitLink}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Visit Tool</a>
                    <button class="btn btn-secondary more-infos-btn" data-tool-id="${tool.dataToolId}">More Infos</button>
                `;
                toolGrid.appendChild(toolCard);
            });
            // Event Listener für Compare Checkboxen hinzufügen/erneuern
            document.querySelectorAll('.compare-checkbox').forEach(checkbox => {
                checkbox.removeEventListener('change', handleCompareCheckboxChange); // Alte Listener entfernen, um Duplikate zu vermeiden
                checkbox.addEventListener('change', handleCompareCheckboxChange);
            });
            syncCompareCheckboxStates(); // Checkboxen mit ausgewählten Tools synchronisieren

            // Event Listener für "More Infos" Buttons
            document.querySelectorAll('.more-infos-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Verhindert, dass Klick auf Karte das Popup schließt
                    const toolId = event.target.dataset.toolId;
                    try {
                        const response = await fetch(`${BACKEND_API_BASE_URL}/tools/${toolId}`);
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
                        }
                        const toolDetails = await response.json();

                        // Populate popup with toolDetails
                        const infoPopup = document.getElementById('tool-info-popup');
                        const infoToolLogo = document.getElementById('info-tool-logo');
                        const infoToolName = document.getElementById('info-tool-name');
                        const infoDescription = document.getElementById('info-description');
                        const infoPopupToolPrice = document.getElementById('info-popup-tool-price');
                        const infoPopupToolFeatures = document.getElementById('info-popup-tool-features');
                        const infoCompanyName = document.getElementById('info-company-name');
                        const infoCompanyWebsite = document.getElementById('info-company-website');
                        const infoCompanyDescription = document.getElementById('info-company-description');
                        const infoHeadquarters = document.getElementById('info-headquarters');
                        const infoCEO = document.getElementById('info-ceo');
                        const infoTeamSize = document.getElementById('info-team-size');
                        const infoKeyInvestors = document.getElementById('info-key-investors');
                        const infoVisitToolLink = document.getElementById('info-visit-tool-link');


                        if (infoPopup && infoToolName) { // Check if popup elements exist on page
                            infoToolLogo.src = toolDetails.logoUrl || '';
                            infoToolLogo.alt = toolDetails.name + ' Logo';
                            infoToolName.textContent = toolDetails.name;
                            infoDescription.textContent = toolDetails.description;
                            // NEU: Preis und Features direkt von toolDetails nutzen
                            if (infoPopupToolPrice) {
                                infoPopupToolPrice.textContent = toolDetails.price === 0 ? 'Free' : `$${toolDetails.price}/month`;
                                if (toolDetails.priceDetails) {
                                    infoPopupToolPrice.innerHTML += ` <br> <small>${toolDetails.priceDetails}</small>`;
                                }
                            }
                            if (infoPopupToolFeatures) {
                                infoPopupToolFeatures.innerHTML = toolDetails.features && toolDetails.features.length > 0 ? toolDetails.features.map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`).join('') :
                                    '<li><i class="fas fa-info-circle"></i> No specific features listed.</li>';
                            }


                            // Hilfsfunktion zum Toggeln von Infos im Tool Info Popup
                            const toggleToolInfoRow = (elementSpan, value, suffix = '', fieldType = null) => {
                                let pContainer = elementSpan.closest('p');
                                if (!pContainer) return;
                                if (fieldType === 'link') {
                                    if (value && value !== 'N/A' && value !== '') {
                                        elementSpan.innerHTML = `<a href="${value}" target="_blank" rel="noopener noreferrer" style="color:#00B8D4;">${elementSpan.dataset.labelText || 'View Link'}</a>`;
                                        pContainer.style.display = 'flex';
                                    } else {
                                        pContainer.style.display = 'none';
                                    }
                                    return;
                                } else if (fieldType === 'array') {
                                    if (Array.isArray(value) && value.length > 0) {
                                        elementSpan.textContent = value.join(', ');
                                        pContainer.style.display = 'flex';
                                    } else {
                                        pContainer.style.display = 'none';
                                    }
                                    return;
                                }

                                if (value !== undefined && value !== null && value !== 'N/A' && value !== '') {
                                    elementSpan.textContent = `${value}${suffix}`;
                                    pContainer.style.display = 'flex';
                                } else {
                                    pContainer.style.display = 'none';
                                }
                            };
                            toggleToolInfoRow(infoCompanyName, toolDetails.companyName);
                            toggleToolInfoRow(infoCompanyWebsite, toolDetails.companyWebsite, '', 'link');
                            toggleToolInfoRow(infoCompanyDescription, toolDetails.companyDescription);
                            toggleToolInfoRow(infoHeadquarters, toolDetails.headquarters);
                            toggleToolInfoRow(infoCEO, toolDetails.ceo);
                            toggleToolInfoRow(infoTeamSize, toolDetails.teamSize);
                            toggleToolInfoRow(infoKeyInvestors, toolDetails.keyInvestors, '', 'array');
                            infoVisitToolLink.href = toolDetails.visitLink || '#';

                            infoPopup.classList.add('active'); // Popup anzeigen
                        }
                    } catch (error) {
                        console.error('ERROR loading tool details for popup:', error);
                        alert('Could not load tool details. Please try again later.');
                    }
                });
            });

        } catch (error) {
            console.error('ERROR in loadAndDisplayTools:', error);
            toolGrid.innerHTML = '<p style="text-align: center; color: #bbb; grid-column: 1/-1; padding: 50px;">Tools could not be loaded. Please try again later.</p>';
        }
    }

    // === Dynamisches Laden des News-Tickers vom Backend (Header & NEU: News-Seite) ===
    async function loadNewsTicker() {
        const newsTickerElements = document.querySelectorAll('.news-ticker'); // Wählt alle Ticker-Elemente aus
        if (newsTickerElements.length === 0) return;
        try {
            const response = await fetch(`${BACKEND_API_BASE_URL}/news/ticker`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
            }
            const newsItems = await response.json();
            newsTickerElements.forEach(newsTicker => { // Iteriert über alle gefundenen Ticker
                newsTicker.innerHTML = '<span>LATEST NEWS:</span>';
                if (newsItems.length === 0) {
                    newsTicker.innerHTML += ' No current news.';
                    return;
                }

                newsItems.forEach(item => {
                    newsTicker.innerHTML += `<a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a><span> &nbsp; &bull; &nbsp; </span>`;
                });
            });
        } catch (error) {
            console.error('ERROR in loadNewsTicker:', error);
            newsTickerElements.forEach(newsTicker => {
                newsTicker.innerHTML = '<span>LATEST NEWS:</span> Error loading news.';
            });
        }
    }

    // === Dynamisches Laden ALLER News für die News-Seite ===
    async function loadAllNews() {
        const newsListGrid = document.querySelector('.news-list-grid');
        const loadingStatus = document.getElementById('news-loading-status');
        const categoryFilter = document.getElementById('news-category-filter');

        if (!newsListGrid) return;

        if (loadingStatus) loadingStatus.textContent = 'Loading news...';
        newsListGrid.innerHTML = ''; // Vorherige Inhalte entfernen

        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
        let url = `${BACKEND_API_BASE_URL}/news`;
        if (selectedCategory !== 'all') {
            url += `?category=${encodeURIComponent(selectedCategory)}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
            }
            const newsItems = await response.json();
            if (loadingStatus) loadingStatus.style.display = 'none'; // Lade-Status ausblenden

            if (newsItems.length === 0) {
                newsListGrid.innerHTML = '<p style="text-align: center; color: #bbb; grid-column: 1/-1; padding: 50px;">No news articles available yet for this category.</p>';
                return;
            }

            newsItems.forEach(item => {
                const newsArticle = document.createElement('article');
                newsArticle.classList.add('news-card');
                newsArticle.innerHTML = `
                    <h3><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a></h3>
                    <p class="news-meta">Source: ${item.source} | Date: ${new Date(item.date).toLocaleDateString()} | Category: ${item.category || 'General'}</p>
                    <div class="news-comments-placeholder">
                        <p>Comments are coming soon! (Future feature)</p>
                    </div>
                `;
                newsListGrid.appendChild(newsArticle);
            });
        } catch (error) {
            console.error('ERROR in loadAllNews:', error);
            if (loadingStatus) loadingStatus.textContent = 'Error loading news articles. Please try again later.';
            newsListGrid.innerHTML = '<p style="text-align: center; color: #bbb; padding: 50px; grid-column: 1 / -1;">Error loading news articles. Please try again later.</p>';
        }
    }

    // === INITIALISIERUNG VON SEITEN-SPEZIFISCHEN FUNKTIONALITÄTEN ===

    // Mobile Navigationsmenü (Hamburger-Icon)
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenu.classList.remove('active');
                }
            });
        });
    }

    // Countdown-Funktion (nur auf der Startseite)
    if (countdownElement) {
        const launchDate = new Date('August 31, 2025 21:00:00 GMT+0200').getTime();
        const updateCountdown = setInterval(() => {
            const now = new Date().getTime();
            const distance = launchDate - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance %
                (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (distance < 0) {
                clearInterval(updateCountdown);
                countdownElement.innerHTML = "LAUNCHED!";
            } else {
                countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            }
        }, 1000);
    }

    // Zweiter Countdown für AI-Driven Markets Seite
    const updateMarketsCountdown = (countdownElementId, targetDate, stepInfo) => {
        const element = document.getElementById(countdownElementId);
        if (!element) return;

        const launchDate = new Date(targetDate).getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = launchDate - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance %
                (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (distance < 0) {
                clearInterval(interval);
                element.innerHTML = stepInfo + " LIVE!";
            } else {
                element.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            }
        }, 1000);
    };

    if (document.getElementById('countdown-timer-markets-step1')) {
        updateMarketsCountdown('countdown-timer-markets-step1', 'August 31, 2025 21:00:00 GMT+0200', 'Step 1: AI Markets Initial Launch');
    }
    if (document.getElementById('countdown-timer-markets-step2')) {
        updateMarketsCountdown('countdown-timer-markets-step2', 'September 06, 2025 21:00:00 GMT+0200', 'Step 2: Full Market Data & Features');
    }

    // NEU: Countdown für die Coin-Seite hinzufügen
    if (document.getElementById('countdown-timer-coin')) {
        updateMarketsCountdown('countdown-timer-coin', 'August 31, 2025 21:00:00 GMT+0200', '$A4A Coin');
    }

    // === Formular-Funktionalität ===
    // Handler für das Absenden von Formularen
    const handleFormSubmit = async (event, endpoint, form) => {
        event.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const jsonData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${BACKEND_API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                form.reset();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    };

    // Newsletter-Formular auf der Startseite
    if (newsletterForm) {
        // === NEU: Validierung per JavaScript (übergeht Browsereinstellungen) ===
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        emailInput.addEventListener('invalid', function(event) {
            event.preventDefault();
            if (this.validity.valueMissing) {
                this.setCustomValidity("Please enter an email address.");
            } else if (this.validity.typeMismatch) {
                this.setCustomValidity("Please enter a valid email address.");
            } else {
                this.setCustomValidity(""); // Setzt die Meldung zurück
            }
            this.reportValidity();
        });
        emailInput.addEventListener('input', function() {
            this.setCustomValidity(""); // Löscht die Meldung, sobald der Benutzer anfängt zu tippen
        });
        // === Ende der Validierung ===

        newsletterForm.addEventListener('submit', (event) => {
            handleFormSubmit(event, '/forms/subscribe', newsletterForm);
        });
    }

    // Kontaktformular auf der About Us Seite
    if (contactForm) {
        // === NEU: Validierung per JavaScript (übergeht Browsereinstellungen) ===
        const emailInput = contactForm.querySelector('#email');
        emailInput.addEventListener('invalid', function(event) {
            event.preventDefault();
            if (this.validity.valueMissing) {
                this.setCustomValidity("Please enter an email address.");
            } else if (this.validity.typeMismatch) {
                this.setCustomValidity("Please enter a valid email address.");
            } else {
                this.setCustomValidity("");
            }
            this.reportValidity();
        });
        emailInput.addEventListener('input', function() {
            this.setCustomValidity("");
        });
        // === Ende der Validierung ===
        contactForm.addEventListener('submit', (event) => {
            handleFormSubmit(event, '/forms/contact', contactForm);
        });
    }

    // Chatbot Popup Funktionalität
    if (chatbotIcon && chatbotPopup && closeChatbotBtn) {
        chatbotIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            chatbotPopup.classList.add('active');
        });
        closeChatbotBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            chatbotPopup.classList.remove('active');
        });
        document.addEventListener('click', (event) => {
            const isClickInsideChatbot = chatbotPopup && (chatbotPopup.contains(event.target) ||
                chatbotIcon.contains(event.target));
            const isClickInsideCompare = comparePopup && (comparePopup.contains(event.target) ||
                compareFloatBtn.contains(event.target));
            const isClickInsideToolInfo = toolInfoPopup && toolInfoPopup.contains(event.target);


            if (chatbotPopup.classList.contains('active') && !isClickInsideChatbot && !isClickInsideCompare && !isClickInsideToolInfo) {
                chatbotPopup.classList.remove('active');
            }
        });
    }

    // Initialisiere die Event-Listener für den schwebenden "Compare Selected" Button
    if (compareFloatBtn && comparePopup && closeComparePopupBtn &&
        comparisonDetailsGrid && noToolsSelectedMsg !== null) {
        compareFloatBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (selectedToolsData.length >= 2 && selectedToolsData.length <= 3) {
                generateComparisonView();
                comparePopup.classList.add('active');
            } else {
                alert('Please select 2 or 3 tools to compare.');
            }
        });
        closeComparePopupBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            comparePopup.classList.remove('active');
        });
        document.addEventListener('click', (event) => {
            const isClickInsideChatbot = chatbotPopup && (chatbotPopup.contains(event.target) ||
                chatbotIcon.contains(event.target));
            const isClickInsideCompare = comparePopup && (comparePopup.contains(event.target) ||
                compareFloatBtn.contains(event.target));
            const isClickInsideToolInfo = toolInfoPopup && toolInfoPopup.contains(event.target);


            if (comparePopup.classList.contains('active') && !isClickInsideCompare && !isClickInsideChatbot && !isClickInsideToolInfo) {
                comparePopup.classList.remove('active');
            }
        });
        updateCompareButton();
    }

    // Tool Info Popup schließen
    const toolInfoPopup = document.getElementById('tool-info-popup');
    const closeToolInfoPopupBtn = document.getElementById('close-tool-info-popup');

    if (toolInfoPopup && closeToolInfoPopupBtn) {
        closeToolInfoPopupBtn.addEventListener('click', () => {
            toolInfoPopup.classList.remove('active');
        });
        document.addEventListener('click', (event) => {
            // Check if the click is inside any active popup
            const isClickInsideAnyPopup =
                (toolInfoPopup.classList.contains('active') && toolInfoPopup.contains(event.target)) ||
                (chatbotPopup && chatbotPopup.classList.contains('active') && chatbotPopup.contains(event.target)) ||
                (comparePopup && comparePopup.classList.contains('active') && comparePopup.contains(event.target));


            // Check if the click originated from a button that opens a popup
            const isTriggerButton =
                event.target.classList.contains('more-infos-btn') ||
                event.target.classList.contains('chatbot-widget') ||
                event.target.closest('.chatbot-widget') ||
                event.target.classList.contains('btn-compare-float');

            // Close toolInfoPopup if it's active AND the click is NOT inside it AND NOT a trigger button
            if (toolInfoPopup.classList.contains('active') && !isClickInsideAnyPopup && !isTriggerButton) {
                toolInfoPopup.classList.remove('active');
            }
        });
    }


    // === Filter- und Sortierfunktionalität für Tool-Seiten ===
    const searchInput = document.querySelector('.search-input');
    const typeFilter = document.getElementById('type-filter');
    const sortByFilter = document.getElementById('sort-by-filter');

    if (searchInput) searchInput.addEventListener('input', loadAndDisplayTools);
    if (typeFilter) typeFilter.addEventListener('change', loadAndDisplayTools);
    if (sortByFilter) sortByFilter.addEventListener('change', loadAndDisplayTools);
    // Setze Sortierung auf 'price-asc' als Standard, wenn das Element existiert
    if (sortByFilter) {
        sortByFilter.value = 'price-asc';
    }

    // === Filter für News-Seite ===
    const newsCategoryFilter = document.getElementById('news-category-filter');
    if (newsCategoryFilter) {
        newsCategoryFilter.addEventListener('change', loadAllNews);
    }

    // === FAQ Akkordeon Funktionalität auf About Us und Coin Seite ===
    document.querySelectorAll('.faq-item summary').forEach(summary => {
        summary.addEventListener('click', function(event) {
            const detailElement = this.closest('details');
            if (detailElement && detailElement.open) {
                // Wenn es geöffnet ist und geklickt wird, soll es sich nicht sofort schließen.
                // Wir fügen einen kleinen Delay hinzu, um die Transition zu ermöglichen.
                // Der Browser handhabt das open/close automatisch, wir wollen nur die Transition.
            }
        });
    });
    // Initialisiere Seiten-spezifische Ladefunktionen
    if (toolGrid) { // Lade Tools, wenn auf einer Tool-Vergleichsseite
        loadAndDisplayTools();
    }
    // Lade News-Ticker, wenn auf Startseite oder News-Seite
    if (document.querySelector('.news-ticker-section')) {
        loadNewsTicker();
    }
    if (document.querySelector('.news-list-grid')) { // Lade alle News, wenn auf News-Seite
        loadAllNews();
    }

    // === Particles.js Konfiguration (für Startseite) ===
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#00B8D4" // Türkis/Cyan
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    },
                    "polygon": {
                        "nb_sides": 5
                    },
                    "image": {
                        "src": "",
                        "width": 100,
                        "height": 100
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#00B8D4", // Türkis/Cyan
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 6,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    }
});
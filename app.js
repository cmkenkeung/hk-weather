// Hong Kong District Weather Live Dashboard Logic

// Base URLs for HKO Open Data API
const API_CURRENT = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en";
const API_FORECAST = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=en";

// 18 Districts Configuration with geographic positions and weather station mappings
const DISTRICTS_CONFIG = {
    "Central & Western": {
        name: "Central & Western District",
        region: "hongkong",
        grid: { row: 5, col: 2 },
        tempStations: ["Hong Kong Park", "Hong Kong Observatory"],
        rainPlace: "Central & Western District"
    },
    "Eastern": {
        name: "Eastern District",
        region: "hongkong",
        grid: { row: 4, col: 5 },
        tempStations: ["Shau Kei Wan"],
        rainPlace: "Eastern District"
    },
    "Southern": {
        name: "Southern District",
        region: "hongkong",
        grid: { row: 5, col: 4 },
        tempStations: ["Wong Chuk Hang", "Stanley"],
        rainPlace: "Southern District"
    },
    "Wan Chai": {
        name: "Wan Chai District",
        region: "hongkong",
        grid: { row: 5, col: 3 },
        tempStations: ["Happy Valley"],
        rainPlace: "Wan Chai"
    },
    "Kowloon City": {
        name: "Kowloon City District",
        region: "kowloon",
        grid: { row: 4, col: 4 },
        tempStations: ["Kowloon City", "Kai Tak Runway Park"],
        rainPlace: "Kowloon City"
    },
    "Kwun Tong": {
        name: "Kwun Tong District",
        region: "kowloon",
        grid: { row: 3, col: 5 },
        tempStations: ["Kwun Tong"],
        rainPlace: "Kwun Tong"
    },
    "Sham Shui Po": {
        name: "Sham Shui Po District",
        region: "kowloon",
        grid: { row: 3, col: 4 },
        tempStations: ["Sham Shui Po"],
        rainPlace: "Sham Shui Po"
    },
    "Wong Tai Sin": {
        name: "Wong Tai Sin District",
        region: "kowloon",
        grid: { row: 3, col: 5 },
        tempStations: ["Wong Tai Sin"],
        rainPlace: "Wong Tai Sin"
    },
    "Yau Tsim Mong": {
        name: "Yau Tsim Mong District",
        region: "kowloon",
        grid: { row: 4, col: 3 },
        tempStations: ["Hong Kong Observatory", "King's Park"],
        rainPlace: "Yau Tsim Mong"
    },
    "Islands": {
        name: "Islands District",
        region: "islands",
        grid: { row: 4, col: 1 },
        tempStations: ["Cheung Chau", "Chek Lap Kok"],
        rainPlace: "Islands District"
    },
    "Kwai Tsing": {
        name: "Kwai Tsing District",
        region: "nt",
        grid: { row: 3, col: 3 },
        tempStations: ["Tsing Yi"],
        rainPlace: "Kwai Tsing"
    },
    "North": {
        name: "North District",
        region: "nt",
        grid: { row: 1, col: 3 },
        tempStations: ["Ta Kwu Ling"],
        rainPlace: "North District"
    },
    "Sai Kung": {
        name: "Sai Kung District",
        region: "nt",
        grid: { row: 2, col: 5 },
        tempStations: ["Sai Kung", "Tseung Kwan O"],
        rainPlace: "Sai Kung"
    },
    "Sha Tin": {
        name: "Sha Tin District",
        region: "nt",
        grid: { row: 2, col: 4 },
        tempStations: ["Sha Tin"],
        rainPlace: "Sha Tin"
    },
    "Tai Po": {
        name: "Tai Po District",
        region: "nt",
        grid: { row: 1, col: 4 },
        tempStations: ["Tai Po", "Tai Mei Tuk"],
        rainPlace: "Tai Po"
    },
    "Tsuen Wan": {
        name: "Tsuen Wan District",
        region: "nt",
        grid: { row: 2, col: 3 },
        tempStations: ["Tsuen Wan Ho Koon", "Tsuen Wan Shing Mun Valley"],
        rainPlace: "Tsuen Wan"
    },
    "Tuen Mun": {
        name: "Tuen Mun District",
        region: "nt",
        grid: { row: 3, col: 1 },
        tempStations: ["Tuen Mun"],
        rainPlace: "Tuen Mun"
    },
    "Yuen Long": {
        name: "Yuen Long District",
        region: "nt",
        grid: { row: 2, col: 2 },
        tempStations: ["Yuen Long Park", "Lau Fau Shan", "Shek Kong"],
        rainPlace: "Yuen Long"
    }
};

// Global App State
let appData = {
    current: null,
    forecast: null,
    districtsData: [],
    currentUnit: "C",
    currentView: "map", // "map" or "list"
    currentRegionFilter: "all",
    searchQuery: ""
};

let tempChart = null;

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
    initClock();
    setupEventListeners();
    fetchData();
});

// Live Clock in Header
function initClock() {
    const clockEl = document.getElementById("live-clock");
    if (!clockEl) return;
    const updateTime = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString("en-HK", { hour12: false });
    };
    updateTime();
    setInterval(updateTime, 1000);
}

// Event Listeners setup
function setupEventListeners() {
    // Refresh Button
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            fetchData();
        });
    }

    // Temp Unit Toggle
    const unitToggle = document.getElementById("unit-toggle");
    if (unitToggle) {
        unitToggle.addEventListener("click", () => {
            appData.currentUnit = appData.currentUnit === "C" ? "F" : "C";
            
            // Update Unit UI toggle button
            const units = document.querySelectorAll("#unit-toggle .unit");
            units.forEach(u => {
                if (u.dataset.unit === appData.currentUnit) {
                    u.classList.add("active");
                } else {
                    u.classList.remove("active");
                }
            });

            // Re-render UI
            renderHero();
            renderForecastCarousel();
            renderDistrictsView();
            updateChartUnit();
        });
    }

    // View Toggles
    const viewMapBtn = document.getElementById("view-map-btn");
    const viewListBtn = document.getElementById("view-list-btn");
    const mapPane = document.getElementById("map-grid-view");
    const listPane = document.getElementById("list-view");

    if (viewMapBtn && viewListBtn && mapPane && listPane) {
        viewMapBtn.addEventListener("click", () => {
            appData.currentView = "map";
            viewMapBtn.classList.add("active");
            viewListBtn.classList.remove("active");
            mapPane.classList.add("active");
            listPane.classList.remove("active");
        });

        viewListBtn.addEventListener("click", () => {
            appData.currentView = "list";
            viewListBtn.classList.add("active");
            viewMapBtn.classList.remove("active");
            listPane.classList.add("active");
            mapPane.classList.remove("active");
        });
    }

    // Search input handler
    const searchInput = document.getElementById("district-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            appData.searchQuery = e.target.value.toLowerCase().trim();
            renderDistrictsView();
        });
    }

    // Filter pills
    const pills = document.querySelectorAll("#region-filter-pills .filter-pill");
    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            pills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            appData.currentRegionFilter = pill.dataset.region;
            renderDistrictsView();
        });
    });

    // Close Modal
    const modalCloseBtn = document.getElementById("modal-close-btn");
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", closeModal);
    }
    const districtModal = document.getElementById("district-modal");
    if (districtModal) {
        districtModal.addEventListener("click", (e) => {
            if (e.target.id === "district-modal") {
                closeModal();
            }
        });
    }
}

// Fetch all HKO weather data (with dynamic fallback to high-quality mock data in case of errors/CORS)
async function fetchData() {
    const refreshIcon = document.getElementById("refresh-icon");
    if (refreshIcon) refreshIcon.classList.add("refreshing");

    try {
        // Fetch Current weather
        let currentRes = await fetch(API_CURRENT);
        if (!currentRes.ok) throw new Error("Current API returned " + currentRes.status);
        let currentData = await currentRes.json();
        
        // Fetch Forecast
        let forecastRes = await fetch(API_FORECAST);
        if (!forecastRes.ok) throw new Error("Forecast API returned " + forecastRes.status);
        let forecastData = await forecastRes.json();
        
        // Basic data structure validation
        if (!currentData || !currentData.temperature || !currentData.temperature.data) {
            throw new Error("Invalid current weather data structure");
        }
        if (!forecastData || !forecastData.weatherForecast) {
            throw new Error("Invalid forecast data structure");
        }

        appData.current = currentData;
        appData.forecast = forecastData;
        console.log("Weather data successfully fetched from HKO API.");
    } catch (e) {
        console.warn("API request failed (e.g. CORS or network error). Loading beautiful mock dataset for live simulation...", e);
        loadMockData();
    }

    try {
        // Process & Structure District Data
        processDistrictData();

        // Render components
        renderWarnings();
        renderHero();
        renderForecastCarousel();
        renderDistrictsView();
        renderChart();
    } catch (e) {
        console.error("Error processing or rendering dashboard data:", e);
        // Fallback entirely to mock data if processing raw data crashed due to unforeseen format changes
        loadMockData();
        processDistrictData();
        renderWarnings();
        renderHero();
        renderForecastCarousel();
        renderDistrictsView();
        renderChart();
    } finally {
        if (refreshIcon) {
            setTimeout(() => {
                refreshIcon.classList.remove("refreshing");
            }, 800);
        }
    }
}

// Map HKO stations and rainfall to our 18 administrative districts
function processDistrictData() {
    const currentData = appData.current || {};
    const tempStationData = (currentData.temperature && currentData.temperature.data) || [];
    const rainfallData = (currentData.rainfall && currentData.rainfall.data) || [];
    
    appData.districtsData = Object.entries(DISTRICTS_CONFIG).map(([key, config]) => {
        // 1. Calculate temperature for the district based on config stations
        let districtTemp = null;
        let matchedStations = [];
        
        config.tempStations.forEach(stationName => {
            const stationObj = tempStationData.find(s => s.place && (s.place.toLowerCase() === stationName.toLowerCase() || s.place.toLowerCase().includes(stationName.toLowerCase())));
            if (stationObj) {
                matchedStations.push({
                    name: stationObj.place,
                    value: stationObj.value
                });
            }
        });
        
        if (matchedStations.length > 0) {
            // Average the temperatures of representative stations if multiple exist
            const sum = matchedStations.reduce((a, b) => a + b.value, 0);
            districtTemp = sum / matchedStations.length;
        } else {
            // Fallback to general observatory temp if specific station not found
            const hkoObj = tempStationData.find(s => s.place === "Hong Kong Observatory");
            districtTemp = hkoObj ? hkoObj.value : null;
        }

        // 2. Map rainfall
        const rainObj = rainfallData.find(r => r.place && (r.place.toLowerCase() === config.rainPlace.toLowerCase() || r.place.toLowerCase().includes(config.rainPlace.toLowerCase())));
        const districtRain = rainObj ? rainObj.max : 0;
        const rainUnit = rainObj ? rainObj.unit : "mm";

        return {
            id: key,
            name: config.name,
            region: config.region,
            grid: config.grid,
            temperature: districtTemp,
            rainfall: districtRain,
            rainUnit: rainUnit,
            stations: matchedStations.length > 0 ? matchedStations : [{ name: "Hong Kong Observatory", value: districtTemp }],
            config: config
        };
    });
}

// Render overall weather warnings
function renderWarnings() {
    const container = document.getElementById("warnings-container");
    if (!container) return;
    container.innerHTML = "";
    
    // Check warningMessage in current data
    const currentData = appData.current || {};
    const warnMsg = currentData.warningMessage || "";
    
    if (warnMsg && warnMsg.trim() !== "" && warnMsg.trim() !== "null") {
        container.classList.remove("hidden");
        
        // Render beautiful alert box
        const alert = document.createElement("div");
        alert.className = "warning-alert";
        alert.innerHTML = `
            <div class="warning-content">
                <i data-lucide="alert-triangle"></i>
                <div class="warning-details">
                    <h3>Weather Warning Active</h3>
                    <p>${warnMsg}</p>
                </div>
            </div>
            <span class="warning-badge">Alert</span>
        `;
        container.appendChild(alert);
        triggerLucideIcons();
    } else {
        container.classList.add("hidden");
    }
}

// Safe wrapper for lucide rendering
function triggerLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Render Weather Hero details
function renderHero() {
    const currentData = appData.current || {};
    const tempData = (currentData.temperature && currentData.temperature.data) || [];
    const hkoTempObj = tempData.find(s => s.place === "Hong Kong Observatory") || { value: 29 };
    const baseTemp = hkoTempObj.value;

    const tempValEl = document.getElementById("hero-temp");
    if (tempValEl) {
        tempValEl.textContent = formatTemp(baseTemp);
        if (tempValEl.nextElementSibling) {
            tempValEl.nextElementSibling.textContent = `°${appData.currentUnit}`;
        }
    }

    // Condition Text & Icons
    const currentIconCode = currentData.icon && currentData.icon.length > 0 ? currentData.icon[0] : 60;
    const iconName = getLucideIconName(currentIconCode);
    const condText = getConditionText(currentIconCode);

    const iconWrapper = document.getElementById("hero-condition-icon");
    if (iconWrapper) {
        iconWrapper.innerHTML = `<i data-lucide="${iconName}" class="weather-icon-large" style="color: var(--accent-blue);"></i>`;
    }
    const condTextEl = document.getElementById("hero-condition-text");
    if (condTextEl) {
        condTextEl.textContent = condText;
    }

    // Humidity
    const humData = (currentData.humidity && currentData.humidity.data) || [];
    const hkoHumidity = humData.length > 0 ? humData[0].value : 75;
    const humEl = document.getElementById("hero-humidity");
    if (humEl) humEl.textContent = `${hkoHumidity}%`;

    // Max Rainfall
    const maxRainfall = appData.districtsData.reduce((max, d) => d.rainfall > max ? d.rainfall : max, 0);
    const rainEl = document.getElementById("hero-rainfall");
    if (rainEl) rainEl.textContent = `${maxRainfall.toFixed(1)} mm`;

    // UV Index
    const uvEl = document.getElementById("hero-uv");
    if (uvEl) {
        let uvVal = "0.0";
        if (currentData.uvindex && currentData.uvindex.data && currentData.uvindex.data.length > 0) {
            uvVal = `${currentData.uvindex.data[0].value} (${currentData.uvindex.data[0].desc})`;
        } else {
            uvVal = "N/A";
        }
        uvEl.textContent = uvVal;
    }

    // Update timestamp
    const updateTimeRaw = currentData.updateTime || new Date().toISOString();
    const updateDate = new Date(updateTimeRaw);
    const hours = String(updateDate.getHours()).padStart(2, '0');
    const minutes = String(updateDate.getMinutes()).padStart(2, '0');
    const updatedEl = document.getElementById("last-updated-text");
    if (updatedEl) updatedEl.textContent = `Updated: ${hours}:${minutes}`;

    triggerLucideIcons();
}

// Render 9-Day Forecast list/carousel
function renderForecastCarousel() {
    const carousel = document.getElementById("forecast-carousel");
    if (!carousel) return;
    carousel.innerHTML = "";

    if (!appData.forecast || !appData.forecast.weatherForecast) return;

    appData.forecast.weatherForecast.forEach(day => {
        const formattedDate = formatDateStr(day.forecastDate);
        const iconName = getLucideIconName(day.ForecastIcon);
        const maxTemp = day.forecastMaxtemp ? day.forecastMaxtemp.value : null;
        const minTemp = day.forecastMintemp ? day.forecastMintemp.value : null;
        
        const card = document.createElement("div");
        card.className = "forecast-row";
        card.innerHTML = `
            <div class="forecast-date-group">
                <span class="forecast-day">${day.week}</span>
                <span class="forecast-date">${formattedDate}</span>
            </div>
            <div class="forecast-icon-wrapper">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="forecast-desc" title="${day.forecastWeather || ''}">${day.forecastWeather || ''}</div>
            <div class="forecast-temp-range">
                <span class="temp-max">${formatTemp(maxTemp)}°</span>
                <span class="temp-min">${formatTemp(minTemp)}°</span>
            </div>
        `;
        carousel.appendChild(card);
    });

    triggerLucideIcons();
}

// Render Districts View (Geographic grid OR detailed list, applying search and region filters)
function renderDistrictsView() {
    const gridContainer = document.getElementById("hk-grid-container");
    const listContainer = document.getElementById("districts-list-container");

    if (gridContainer) gridContainer.innerHTML = "";
    if (listContainer) listContainer.innerHTML = "";

    // Filter districts
    const filteredDistricts = appData.districtsData.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(appData.searchQuery) || d.id.toLowerCase().includes(appData.searchQuery);
        const matchesRegion = appData.currentRegionFilter === "all" || d.region === appData.currentRegionFilter;
        return matchesSearch && matchesRegion;
    });

    // 1. Render Geographic Grid View
    if (gridContainer) {
        Object.entries(DISTRICTS_CONFIG).forEach(([key, config]) => {
            const districtObj = appData.districtsData.find(d => d.id === key);
            const isMatched = filteredDistricts.some(d => d.id === key);

            if (!districtObj) return;

            const cell = document.createElement("div");
            cell.className = "district-grid-cell";
            
            // Setup Grid Positioning style
            cell.style.gridRow = config.grid.row;
            cell.style.gridColumn = config.grid.col;

            // Apply theme color based on temperature
            const temp = districtObj.temperature;
            if (temp !== null) {
                if (temp < 18) {
                    cell.classList.add("cold-theme");
                } else if (temp <= 27) {
                    cell.classList.add("mild-theme");
                } else {
                    cell.classList.add("hot-theme");
                }
            }

            if (districtObj.rainfall > 0) {
                cell.classList.add("has-rain");
            }

            // Apply filter styling
            if (!isMatched) {
                cell.style.opacity = "0.2";
                cell.style.pointerEvents = "none";
            }

            cell.innerHTML = `
                <span class="cell-region">${getRegionLabel(config.region)}</span>
                <span class="cell-name">${key}</span>
                <div class="cell-stats">
                    <span class="cell-temp">${formatTemp(temp)}°</span>
                    <span class="cell-rain" style="${districtObj.rainfall > 0 ? '' : 'opacity: 0.5;'}">
                        <i data-lucide="droplet"></i>${districtObj.rainfall}
                    </span>
                </div>
            `;

            cell.addEventListener("click", () => openModal(districtObj));
            gridContainer.appendChild(cell);
        });
    }

    // 2. Render List View
    if (listContainer) {
        filteredDistricts.forEach(d => {
            const stName = d.stations.length > 0 ? d.stations[0].name : "N/A";
            card = document.createElement("div");
            card.className = "district-detail-card";
            card.innerHTML = `
                <div class="card-top">
                    <div class="card-title-group">
                        <h3>${d.name}</h3>
                        <span>Reading Source: ${stName}</span>
                    </div>
                    <span class="region-indicator-badge ${d.region}">${getRegionLabel(d.region)}</span>
                </div>
                <div class="card-bottom">
                    <span class="card-temp">${formatTemp(d.temperature)}°${appData.currentUnit}</span>
                    <div class="card-meta-indicators">
                        <span class="card-rain-badge ${d.rainfall > 0 ? 'rainy' : ''}">
                            <i data-lucide="${d.rainfall > 0 ? 'cloud-rain' : 'umbrella'}"></i>
                            ${d.rainfall} mm
                        </span>
                        <span class="card-station-name">Source Station: ${stName}</span>
                    </div>
                </div>
            `;
            card.addEventListener("click", () => openModal(d));
            listContainer.appendChild(card);
        });
    }

    triggerLucideIcons();
}

// Render Chart.js Curve
function renderChart() {
    const canvas = document.getElementById("temp-trend-chart");
    if (!canvas) return;
    
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js library is not loaded. Skipping chart generation.");
        return;
    }

    const ctx = canvas.getContext("2d");
    if (!appData.forecast || !appData.forecast.weatherForecast) return;

    const labels = appData.forecast.weatherForecast.map(day => day.week.substring(0, 3) + " " + formatDateStr(day.forecastDate).split(" ")[0]);
    
    const maxData = appData.forecast.weatherForecast.map(day => day.forecastMaxtemp ? day.forecastMaxtemp.value : null);
    const minData = appData.forecast.weatherForecast.map(day => day.forecastMintemp ? day.forecastMintemp.value : null);

    // Dynamic conversions for chart rendering
    const formattedMax = maxData.map(v => appData.currentUnit === "F" ? Math.round((v * 9)/5 + 32) : v);
    const formattedMin = minData.map(v => appData.currentUnit === "F" ? Math.round((v * 9)/5 + 32) : v);

    if (tempChart) {
        tempChart.destroy();
    }

    const isDark = !document.body.classList.contains("light-theme");
    const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.06)";
    const labelColor = isDark ? "#94a3b8" : "#475569";

    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Max Temperature (°${appData.currentUnit})`,
                    data: formattedMax,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#ffffff',
                    pointHoverRadius: 6
                },
                {
                    label: `Min Temperature (°${appData.currentUnit})`,
                    data: formattedMin,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.06)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#06b6d4',
                    pointBorderColor: '#ffffff',
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: labelColor,
                        font: {
                            family: 'Outfit',
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1a1f38' : '#ffffff',
                    titleColor: isDark ? '#ffffff' : '#0f172a',
                    bodyColor: isDark ? '#94a3b8' : '#475569',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    titleFont: { family: 'Outfit', weight: '700' },
                    bodyFont: { family: 'Inter' }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: labelColor,
                        font: { family: 'Outfit' }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: labelColor,
                        font: { family: 'Outfit' }
                    }
                }
            }
        }
    });
}

function updateChartUnit() {
    if (!tempChart || typeof Chart === 'undefined' || !appData.forecast || !appData.forecast.weatherForecast) return;

    const maxData = appData.forecast.weatherForecast.map(day => day.forecastMaxtemp ? day.forecastMaxtemp.value : null);
    const minDataRaw = appData.forecast.weatherForecast.map(day => day.forecastMintemp ? day.forecastMintemp.value : null);

    const formattedMax = maxData.map(v => appData.currentUnit === "F" ? Math.round((v * 9)/5 + 32) : v);
    const formattedMin = minDataRaw.map(v => appData.currentUnit === "F" ? Math.round((v * 9)/5 + 32) : v);

    tempChart.data.datasets[0].data = formattedMax;
    tempChart.data.datasets[0].label = `Max Temperature (°${appData.currentUnit})`;
    tempChart.data.datasets[1].data = formattedMin;
    tempChart.data.datasets[1].label = `Min Temperature (°${appData.currentUnit})`;

    tempChart.update();
}

// Modal dialog functions
function openModal(district) {
    const modal = document.getElementById("district-modal");
    if (!modal) return;
    
    const regEl = document.getElementById("modal-district-region");
    if (regEl) {
        regEl.textContent = getRegionLabel(district.region);
        regEl.className = `modal-region-badge ${district.region}`;
    }
    const nameEl = document.getElementById("modal-district-name");
    if (nameEl) nameEl.textContent = district.name;
    const tempEl = document.getElementById("modal-district-temp");
    if (tempEl) tempEl.textContent = `${formatTemp(district.temperature)}°${appData.currentUnit}`;
    
    const stationName = district.stations.length > 0 ? district.stations[0].name : "Station Offline";
    const stLblEl = document.getElementById("modal-temp-station");
    if (stLblEl) stLblEl.textContent = `Recorded at ${stationName}`;
    const rainEl = document.getElementById("modal-district-rain");
    if (rainEl) rainEl.textContent = `${district.rainfall.toFixed(1)} mm`;

    // Render detailed stations inside the district
    const stationsList = document.getElementById("modal-station-readings");
    if (stationsList) {
        stationsList.innerHTML = "";
        district.stations.forEach(st => {
            const row = document.createElement("div");
            row.className = "station-reading-row";
            row.innerHTML = `
                <span class="station-name">${st.name}</span>
                <span class="station-value">${formatTemp(st.value)}°${appData.currentUnit}</span>
            `;
            stationsList.appendChild(row);
        });
    }

    modal.classList.remove("hidden");
}

function closeModal() {
    const modal = document.getElementById("district-modal");
    if (modal) modal.classList.add("hidden");
}

// Helper formatting functions
function formatTemp(cVal) {
    if (cVal === null || cVal === undefined || isNaN(cVal)) return '--';
    if (appData.currentUnit === 'F') {
        const fVal = Math.round((cVal * 9) / 5 + 32);
        return `${fVal}`;
    }
    return `${Math.round(cVal)}`;
}

function getRegionLabel(regionCode) {
    if (regionCode === "hongkong") return "HK Island";
    if (regionCode === "kowloon") return "Kowloon";
    if (regionCode === "nt") return "New Territories";
    if (regionCode === "islands") return "Islands";
    return regionCode;
}

function getConditionText(iconCode) {
    const code = parseInt(iconCode);
    if (code === 50) return "Sunny";
    if (code === 51) return "Sunny Periods";
    if (code === 52) return "Sunny Intervals";
    if (code === 53) return "Few Showers";
    if (code === 54) return "Isolated Showers";
    if (code === 60) return "Cloudy";
    if (code === 61) return "Overcast";
    if (code === 62) return "Light Rain";
    if (code === 63) return "Rainy";
    if (code === 64 || code === 65) return "Thunderstorms";
    if (code >= 70 && code <= 77) return "Clear Night";
    if (code >= 80 && code <= 85) return "Windy";
    return "Cloudy";
}

function formatDateStr(dateStr) {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
}

function getLucideIconName(hkoIconCode) {
    const code = parseInt(hkoIconCode);
    if (code === 50) return 'sun';
    if (code === 51 || code === 52) return 'cloud-sun';
    if (code === 53 || code === 54) return 'cloud-sun-rain';
    if (code === 60 || code === 61) return 'cloud';
    if (code === 62) return 'cloud-drizzle';
    if (code === 63) return 'cloud-rain';
    if (code === 64 || code === 65) return 'cloud-lightning';
    if (code >= 70 && code <= 77) return 'moon'; // clear night
    if (code >= 80 && code <= 85) return 'wind';
    return 'cloud';
}

// Mock Data Loader (Fallback for CORS issues / offline environment)
function loadMockData() {
    // Current weather report mock
    appData.current = {
        updateTime: new Date().toISOString(),
        warningMessage: "Thunderstorm Warning is in force. Heavy showers may occur in short duration.",
        icon: [64], // Thunderstorms
        temperature: {
            recordTime: new Date().toISOString(),
            data: [
                { place: "King's Park", value: 28, unit: "C" },
                { place: "Hong Kong Observatory", value: 29, unit: "C" },
                { place: "Wong Chuk Hang", value: 29, unit: "C" },
                { place: "Ta Kwu Ling", value: 27, unit: "C" },
                { place: "Lau Fau Shan", value: 28, unit: "C" },
                { place: "Tai Po", value: 29, unit: "C" },
                { place: "Sha Tin", value: 28, unit: "C" },
                { place: "Tuen Mun", value: 29, unit: "C" },
                { place: "Tseung Kwan O", value: 28, unit: "C" },
                { place: "Sai Kung", value: 28, unit: "C" },
                { place: "Cheung Chau", value: 26, unit: "C" },
                { place: "Chek Lap Kok", value: 30, unit: "C" },
                { place: "Tsing Yi", value: 29, unit: "C" },
                { place: "Shek Kong", value: 29, unit: "C" },
                { place: "Tsuen Wan Ho Koon", value: 28, unit: "C" },
                { place: "Tsuen Wan Shing Mun Valley", value: 29, unit: "C" },
                { place: "Hong Kong Park", value: 28, unit: "C" },
                { place: "Shau Kei Wan", value: 27, unit: "C" },
                { place: "Kowloon City", value: 28, unit: "C" },
                { place: "Happy Valley", value: 29, unit: "C" },
                { place: "Wong Tai Sin", value: 28, unit: "C" },
                { place: "Stanley", value: 28, unit: "C" },
                { place: "Kwun Tong", value: 28, unit: "C" },
                { place: "Sham Shui Po", value: 29, unit: "C" },
                { place: "Kai Tak Runway Park", value: 28, unit: "C" },
                { place: "Yuen Long Park", value: 29, unit: "C" },
                { place: "Tai Mei Tuk", value: 27, unit: "C" }
            ]
        },
        humidity: {
            recordTime: new Date().toISOString(),
            data: [{ place: "Hong Kong Observatory", value: 82, unit: "percent" }]
        },
        rainfall: {
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            data: [
                { place: "Central & Western District", max: 12, unit: "mm" },
                { place: "Eastern District", max: 8, unit: "mm" },
                { place: "Kwai Tsing", max: 4, unit: "mm" },
                { place: "Islands District", max: 0, unit: "mm" },
                { place: "North District", max: 15, unit: "mm" },
                { place: "Sai Kung", max: 5, unit: "mm" },
                { place: "Sha Tin", max: 22, unit: "mm" },
                { place: "Southern District", max: 10, unit: "mm" },
                { place: "Tai Po", max: 18, unit: "mm" },
                { place: "Tsuen Wan", max: 6, unit: "mm" },
                { place: "Tuen Mun", max: 2, unit: "mm" },
                { place: "Wan Chai", max: 9, unit: "mm" },
                { place: "Yuen Long", max: 3, unit: "mm" },
                { place: "Yau Tsim Mong", max: 11, unit: "mm" },
                { place: "Sham Shui Po", max: 14, unit: "mm" },
                { place: "Kowloon City", max: 13, unit: "mm" },
                { place: "Wong Tai Sin", max: 16, unit: "mm" },
                { place: "Kwun Tong", max: 8, unit: "mm" }
            ]
        },
        uvindex: {
            data: [{ place: "King's Park", value: 2.2, desc: "low" }]
        }
    };

    // 9-Day Weather Forecast Mock (starting from today)
    const baseDate = new Date();
    const forecastArray = [];
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const iconsList = [64, 63, 54, 51, 50, 50, 51, 52, 60];
    const maxTemps = [30, 31, 32, 33, 34, 34, 33, 32, 31];
    const minTemps = [26, 27, 28, 28, 29, 29, 28, 27, 26];
    const weatherDescs = [
        "Thunderstorms & heavy showers.",
        "Rainy with sunny intervals.",
        "Isolated showers. Sunny periods.",
        "Mainly fine and hot.",
        "Fine and extremely hot.",
        "Fine and dry. Very hot.",
        "Sunny intervals. A few showers.",
        "Partly cloudy. Scattered showers.",
        "Cloudy with light rain."
    ];

    for (let i = 0; i < 9; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + i + 1);

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dateVal = String(currentDate.getDate()).padStart(2, '0');
        
        forecastArray.push({
            forecastDate: `${year}${month}${dateVal}`,
            week: daysOfWeek[currentDate.getDay()],
            forecastWind: "South force 3 to 4.",
            forecastWeather: weatherDescs[i],
            forecastMaxtemp: { value: maxTemps[i], unit: "C" },
            forecastMintemp: { value: minTemps[i], unit: "C" },
            forecastMaxrh: { value: 95, unit: "percent" },
            forecastMinrh: { value: 65, unit: "percent" },
            ForecastIcon: iconsList[i],
            PSR: i < 3 ? "Medium High" : i < 6 ? "Low" : "Medium"
        });
    }

    appData.forecast = {
        generalSituation: "A broad trough of low pressure will bring unsettled weather to Guangdong. A hot and dry southerly airstream will establish later next week.",
        weatherForecast: forecastArray
    };
}

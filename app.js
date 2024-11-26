const API_BASE = "https://www.randyconnolly.com/funwebdev/3rd/api/f1";

// DOM Elements
const homeView = document.querySelector('#homeView');
const racesView = document.querySelector('#racesView');
const raceDetails = document.querySelector('#raceDetails');
const favoritesDialog = document.querySelector('#favoritesDialog');
const seasonSelect = document.querySelector('#seasonSelect');
const raceList = document.querySelector("#raceList");
const homeBtn = document.querySelector('#homeBtn');
const favoritesBtn = document.querySelector('#favoritesBtn');
const favoriteDriversList = document.querySelector('#favoriteDriversList');
const favoriteConstructorsList = document.querySelector('#favoriteConstructorsList');

// Local Storage Keys
const STORAGE_KEYS = {
    results: "results",
    qualifying: "qualifying",
    races: "races",
    drivers: "drivers",
    constructors: "constructors",
    circuits: "circuits",
};

const API_ENDPOINTS = {
    QUALIFYING: '/qualifying.php',
    RESULTS: '/results.php',
    RACES: '/races.php/',
    DRIVERS: '/drivers.php',
    CONSTRUCTORS: '/constructors.php',
    CIRCUITS: '/circuits.php'
}

// Fetch and Cache
async function fetchAndCache(url, key) {
    return fetch(url)
        .then((response) => response.json())
        .then((data) => {
            localStorage.setItem(key, JSON.stringify(data));
            return data;
        });
}

function getCachedOrFetch(url, key) {
    const cached = localStorage.getItem(key);
    return cached ? Promise.resolve(JSON.parse(cached)) : fetchAndCache(url, key);
}

function clearChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// Event Listeners
seasonSelect.addEventListener("change", () => {
    const season = seasonSelect.value;
    if (season) {
        loadRacesForSeason(season);
    }
});

homeBtn.addEventListener("click", () => {
    racesView.style.display = "none";
    raceDetails.style.display = "none";
    homeView.style.display = "block";
});

favoritesBtn.addEventListener("click", () => {
    favoritesDialog.showModal();
});

// Data Loading Functions
function loadRacesForSeason(season) {
    getCachedOrFetch(`${API_BASE}/races.php?season=${season}`, `${STORAGE_KEYS.races}_${season}`)
        .then((races) => {
            displayRaces(races);
            homeView.style.display = "none";
            racesView.style.display = "block";
        });
}

function displayRaces(races) {
    clearChildren(raceList);
    races.forEach((race) => {
        const li = document.createElement("li");
        li.textContent = `${race.round}: ${race.name} (${race.date})`;
        li.addEventListener("click", () => showRaceDetails(race));
        raceList.appendChild(li);
    });
}

async function showRaceDetails(race) {
    let raceDetails = document.querySelector('#raceDetails');
    if (!raceDetails) {
        raceDetails = document.createElement('div');
        raceDetails.id = 'raceDetails';
        document.querySelector('#racesView').appendChild(raceDetails);
    }

    raceDetails.innerHTML = `
        <img src="https://1000logos.net/wp-content/uploads/2021/06/F1-logo.png" alt="F1-logo" height="100px">
        <div class="race-header">
            <h2>${race.name}</h2>
            <div class="race-info">
                <p><strong>Round:</strong> ${race.round}</p>
                <p><strong>Year:</strong> ${race.year}</p>
                <p class="circuit-name" style="cursor: pointer;"><strong>Circuit:</strong> ${race.circuit?.name || 'Unknown'}</p>
                <p><strong>Date:</strong> ${race.date}</p>
                <p><strong>More Info:</strong> <a href="${race.url}" target="_blank">F1 Website</a></p>
            </div>
        </div>

        <div class="race-details-sections">
            <section class="qualifying-section">
                <h3>Qualifying Results</h3>
                <div id="qualifyingData">Loading qualifying data...</div>
            </section>

            <section class="results-section">
                <h3>Race Results</h3>
                <div id="raceResults">Loading race results...</div>
            </section>
        </div>
    `;

    // Event handler for circuit name
    const circuitElement = raceDetails.querySelector('.circuit-name');
    circuitElement.addEventListener('click', () => {
        if (race.circuit) {
            showCircuitDetails(race.circuit);
        }
    });

    // Fetches qualifying data using race ID
    const qualifying = await getCachedOrFetch(
        `${API_BASE}${API_ENDPOINTS.QUALIFYING}?race=${race.id}`,
        `${STORAGE_KEYS.qualifying}_${race.id}`
    );

    // Fetches final results using race ID
    const results = await getCachedOrFetch(
        `${API_BASE}${API_ENDPOINTS.RESULTS}?race=${race.id}`,
        `${STORAGE_KEYS.results}_${race.id}`
    );

    displayQualifying(qualifying);
    displayResults(results);

    // Ensures races details section is displayed
    raceDetails.style.display = 'block';
    racesView.style.display = 'none';
}

// Adds driver dialog to HTML
const driverDialog = document.createElement('dialog');
driverDialog.id = 'driverModal';
driverDialog.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="driverName"></h2>
            <button class="close-btn" onclick="this.closest('dialog').close()">&times;</button>
        </div>
        <div class="modal-body">
            <p><strong>Date of Birth:</strong> <span id="driverDob"></span></p>
            <p><strong>Age:</strong> <span id="driverAge"></span></p>
            <p><strong>Number:</strong> <span id="driverNumber"></span></p>
            <p><strong>Nationality:</strong> <span id="driverNationality"></span></p>
            <a id="driverUrl" href="" target="_blank">View on F1 Website</a>
            <button id="addDriverFav">Add to Favorites</button>
        </div>
    </div>
`;
document.body.appendChild(driverDialog);

async function showDriverDetails(driverId) {
    const dialog = document.querySelector('#driverModal');

    // Fetches full driver details
    const driver = await getCachedOrFetch(
        `${API_BASE}${API_ENDPOINTS.DRIVERS}?id=${driverId}`,
        `${STORAGE_KEYS.drivers}_${driverId}`
    );

    // Calculates age
    const dateofb = new Date(driver.dob);
    const age = new Date().getFullYear() - dateofb.getFullYear();

    dialog.querySelector('#driverName').textContent = `${driver.forename} ${driver.surname}`;
    dialog.querySelector('#driverNationality').textContent = driver.nationality;
    dialog.querySelector('#driverDob').textContent = driver.dob;
    dialog.querySelector('#driverAge').textContent = age;
    dialog.querySelector('#driverNumber').textContent = driver.number;
    dialog.querySelector('#driverUrl').href = driver.url;

    // Add to favorites button
    const addFavoriteBtn = dialog.querySelector('#addDriverFav');
    dialog.showModal();
}

// Adds constructor dialog to HTML
const constructorDialog = document.createElement('dialog');
constructorDialog.id = 'constructorModal';
constructorDialog.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="constructorName"></h2>
            <button class="close-btn" onclick="this.closest('dialog').close()">&times;</button>
        </div>
        <div class="modal-body">
            <p><strong>Nationality:</strong> <span id="constructorNationality"></span></p>
            <a id="constructorUrl" href="" target="_blank">View on F1 Website</a>
            <button id="addConstrFav">Add to Favorites</button>
        </div>
    </div>
`;
document.body.appendChild(constructorDialog);

async function showConstructorDetails(constructorId) {
    const dialog = document.querySelector('#constructorModal');

    // Fetch full constructor details
    const constructor = await getCachedOrFetch(
        `${API_BASE}/constructors.php?id=${constructorId}`,
        `${STORAGE_KEYS.constructors}_${constructorId}`
    );

    const constructorNameElement = dialog.querySelector('#constructorName');
    const constructorNationalityElement = dialog.querySelector('#constructorNationality');
    const constructorUrlElement = dialog.querySelector('#constructorUrl');

    // Sets constructor details
    constructorNameElement.textContent = constructor.name;
    constructorNationalityElement.textContent = constructor.nationality;
    constructorUrlElement.href = constructor.url;

    // Added to favourites button
    const addFavoriteBtn = dialog.querySelector('#addConstrFav');
    addFavoriteBtn.onclick = () => addFavorite('constructor', constructor);

    dialog.showModal();
}

// Added circuit dialog to HTML
const circuitDialog = document.createElement('dialog');
circuitDialog.id = 'circuitModal';
circuitDialog.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="circuitName"></h2>
            <button class="close-btn" onclick="this.closest('dialog').close()">&times;</button>
        </div>
        <div class="modal-body">
            <p><strong>Name:</strong> <span id="circuitName"></span></p>
            <p><strong>Location:</strong> <span id="circuitLocation"></span></p>
            <p><strong>Country:</strong> <span id="circuitCountry"></span></p>
            <p><strong>URL:</strong> <span id="circuitUrl"></span></p>
        </div>
    </div>
`;
document.body.appendChild(circuitDialog);

// Quali display function
function displayQualifying(qualifying) {
    const qualifyingDiv = document.querySelector('#qualifyingData');

    const table = `
        <table class="quali-table">
            <thead>
                <tr>
                    <th>Position</th>
                    <th>Driver</th>
                    <th>Constructor</th>
                </tr>
            </thead>
            <tbody>
                ${qualifying.map(q => `
                    <tr>
                        <td>${q.position}</td>
                        <td>${q.driver?.forename} ${q.driver?.surname}</td>
                        <td>${q.constructor?.name}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    qualifyingDiv.innerHTML = table;

    // Added event handlers to driver names
    qualifyingDiv.querySelectorAll('td:nth-child(2)').forEach(cell => {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
            const quali = qualifying.find(q => 
                `${q.driver?.forename} ${q.driver?.surname}` === cell.textContent
            );
            if (quali) showDriverDetails(quali.driver?.id);
        });
    });

    // Added event handlers to constructor names
    qualifyingDiv.querySelectorAll('td:nth-child(3)').forEach(cell => {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
            const quali = qualifying.find(r => 
                r.constructor?.name === cell.textContent
            );
            if (quali) showConstructorDetails(quali.constructor?.id);
        });
    });
}

async function showCircuitDetails(circuit) {
    const dialog = document.querySelector('#circuitModal');

    dialog.querySelector('#circuitName').textContent = circuit.name;
    dialog.querySelector('#circuitLocation').textContent = circuit.location;
    dialog.querySelector('#circuitCountry').textContent = circuit.country;
    dialog.querySelector('#circuitUrl').href = circuit.url;

    dialog.showModal();
}

function displayResults(results) {
    const resultsDiv = document.querySelector('#raceResults');

    // Podium
    const podiumPositions = results
        .filter(r => r.position <= 3)
        .sort((a, b) => a.position - b.position);

    const table = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Position</th>
                    <th>Driver</th>
                    <th>Constructor</th>
                    <th>Laps</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(r => `
                    <tr class="${r.position <= 3 ? 'podium-position-' + r.position : ''}">
                        <td>${r.position}</td>
                        <td>${r.driver?.forename} ${r.driver?.surname}</td>
                        <td>${r.constructor?.name}</td>
                        <td>${r.laps}</td>
                        <td>${r.points}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="podium">
            <h3>Podium</h3>
            <div class="podium-container">
                ${podiumPositions.map(r => `
                    <div class="podium-position position-${r.position}">
                        <div class="position-number">${r.position}<sup>${getOrdinal(r.position)}</sup></div>
                        <div class="driver-info">
                            <div class="driver-name">${r.driver?.forename} ${r.driver?.surname}</div>
                            <div class="constructor-name">${r.constructor?.name}</div>
                            <div class="finish-time">${r.time || 'DNF'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = table;

    // Addes event handlers to driver names
    resultsDiv.querySelectorAll('td:nth-child(2)').forEach(cell => {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
            const result = results.find(r => 
                `${r.driver?.forename} ${r.driver?.surname}` === cell.textContent
            );
            if (result) showDriverDetails(result.driver?.id);
        });
    });

    // Added some event handlers to construcor names
    resultsDiv.querySelectorAll('td:nth-child(3)').forEach(cell => {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
            const result = results.find(r => 
                r.constructor?.name === cell.textContent
            );
            if (result) showConstructorDetails(result.constructor?.id);
        });
    });
}

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}
function initialize() {
    console.log("App initialized.");
}

initialize();
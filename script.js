// ----------------------
// CONFIG
// ----------------------
const runsDir = "./runs";
const productPrefix = "weathernext_prate_f";   // image naming pattern
const minF = 6;
const maxF = 360;
const fStep = 6;

// ----------------------
// DOM ELEMENTS
// ----------------------
const cycleSelect = document.getElementById("cycle-select");
const cyclePrev = document.getElementById("prev-cycle");
const cycleNext = document.getElementById("next-cycle");
const slider = document.getElementById("fhour-slider");
const sliderLabel = document.getElementById("fhour-label");
const mapImg = document.getElementById("map-image");

// ----------------------
// GLOBAL STATE
// ----------------------
let cycles = [];            // loaded from index.json
let currentCycle = null;    // e.g. "2025120206"
let currentFhour = 6;       // slider-selected forecast hour

// ----------------------
// HELPERS
// ----------------------

// Parse "YYYYMMDDHH" → JS Date
function parseCycle(cycleStr) {
    const y = parseInt(cycleStr.substring(0, 4));
    const m = parseInt(cycleStr.substring(4, 6)) - 1;
    const d = parseInt(cycleStr.substring(6, 8));
    const h = parseInt(cycleStr.substring(8, 10));
    return new Date(Date.UTC(y, m, d, h, 0));
}

// Return a new fhour so valid time stays unchanged
function computeAdjustedFhour(oldCycle, newCycle, oldFhour) {
    const oldInit = parseCycle(oldCycle);
    const newInit = parseCycle(newCycle);

    // target valid time = oldInit + oldFhour
    const targetValid = new Date(oldInit.getTime() + oldFhour * 3600 * 1000);

    // new fhour = difference in hours between targetValid and newInit
    let newF = Math.round((targetValid - newInit) / (3600 * 1000));

    // Snap to nearest 6-hour step & clamp bounds
    newF = Math.round(newF / fStep) * fStep;
    if (newF < minF) newF = minF;
    if (newF > maxF) newF = maxF;

    return newF;
}

function updateImage() {
    const src = `${runsDir}/${currentCycle}/${productPrefix}${currentFhour}.png`;
    mapImg.src = src;
}

// Parse "YYYYMMDDHH" → JS Date (UTC)
function parseCycle(cycleStr) {
    const y = parseInt(cycleStr.substring(0, 4));
    const m = parseInt(cycleStr.substring(4, 6)) - 1;
    const d = parseInt(cycleStr.substring(6, 8));
    const h = parseInt(cycleStr.substring(8, 10));
    return new Date(Date.UTC(y, m, d, h, 0));
}

// Format Date as YYYY-MM-DD HHZ
function formatValidTime(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}Z`;
}

// New: Update label with valid datetime
function updateSliderLabel() {
    const initTime = parseCycle(currentCycle);
    const validTime = new Date(initTime.getTime() + currentFhour * 3600 * 1000);
    sliderLabel.textContent = `Valid: ${formatValidTime(validTime)}`;
}

// Parse "YYYYMMDDHH" → JS Date (UTC)
function parseCycle(cycleStr) {
    const y = parseInt(cycleStr.substring(0, 4));
    const m = parseInt(cycleStr.substring(4, 6)) - 1;
    const d = parseInt(cycleStr.substring(6, 8));
    const h = parseInt(cycleStr.substring(8, 10));
    return new Date(Date.UTC(y, m, d, h, 0));
}

// Format Date as YYYY-MM-DD HHZ (e.g., 2025-12-27 12Z)
function formatCycleDate(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}Z`;
}

// ----------------------
// EVENT HANDLERS
// ----------------------

// Slider moved
slider.addEventListener("input", () => {
    currentFhour = parseInt(slider.value);
    updateSliderLabel();
    updateImage();
});

// Manual cycle dropdown change
cycleSelect.addEventListener("change", () => {
    const newCycle = cycleSelect.value;

    const newFhour = computeAdjustedFhour(currentCycle, newCycle, currentFhour);

    currentCycle = newCycle;
    currentFhour = newFhour;

    slider.value = currentFhour;
    updateSliderLabel();
    updateImage();
});

// Previous cycle arrow
cyclePrev.addEventListener("click", () => {
    const idx = cycles.indexOf(currentCycle);
    if (idx < cycles.length - 1) {
        const newCycle = cycles[idx + 1];
        const newF = computeAdjustedFhour(currentCycle, newCycle, currentFhour);

        currentCycle = newCycle;
        currentFhour = newF;

        cycleSelect.value = newCycle;
        slider.value = currentFhour;
        updateSliderLabel();
        updateImage();
    }
});

// Next cycle arrow
cycleNext.addEventListener("click", () => {
    const idx = cycles.indexOf(currentCycle);
    if (idx > 0) {
        const newCycle = cycles[idx - 1];
        const newF = computeAdjustedFhour(currentCycle, newCycle, currentFhour);

        currentCycle = newCycle;
        currentFhour = newF;

        cycleSelect.value = newCycle;
        slider.value = currentFhour;
        updateSliderLabel();
        updateImage();
    }
});

// ----------------------
// INITIAL LOAD
// ----------------------
async function init() {
    const res = await fetch(`${runsDir}/index.json`);
    const json = await res.json();

    cycles = json.cycles;    // e.g. ["2025120206","2025120200","2025120118"]

    // Populate dropdown
    cycleSelect.innerHTML = "";
    cycles.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;  // keep raw value for logic

        const initDate = parseCycle(c);
        opt.textContent = formatCycleDate(initDate);
        // For even nicer look: opt.textContent = formatCycleDateNice(initDate);

        cycleSelect.appendChild(opt);
    });

    // Default = newest cycle (first in list)
    currentCycle = cycles[0];
    cycleSelect.value = currentCycle;

    // Configure slider
    slider.min = minF;
    slider.max = maxF;
    slider.step = fStep;
    slider.value = currentFhour;

    updateSliderLabel();
    updateImage();
}

// ----------------------
// QUICK HOUR BUTTONS
// ----------------------
const quickButtons = document.querySelectorAll('#quick-hour-buttons button');

quickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const newFhour = parseInt(btn.getAttribute('data-fhour'));

        // Update state
        currentFhour = newFhour;

        // Update slider and label
        slider.value = newFhour;
        updateSliderLabel();

        // Update image
        updateImage();

        // Visual feedback: highlight active button
        quickButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Highlight initial button on load
function updateActiveQuickButton() {
    quickButtons.forEach(btn => {
        const btnFhour = parseInt(btn.getAttribute('data-fhour'));
        if (btnFhour === currentFhour) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Call this in updateImage() or after changing fhour
// Modify your existing updateImage function to also update button:
function updateImage() {
    const src = `${runsDir}/${currentCycle}/${productPrefix}${currentFhour}.png`;
    mapImg.src = src;
    updateActiveQuickButton();  // Add this line
}

// Also update on slider move
slider.addEventListener("input", () => {
    currentFhour = parseInt(slider.value);
    updateSliderLabel();
    updateImage();  // This will now also update button highlight
});

// Initial highlight after load
// Add to init() after setting initial values:
updateActiveQuickButton();

init();

// --- Firebase SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, getDocs, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- State Variables ---
let isRunning = false;
let isProcessing = false; // Prevents new item from starting while another is on the belt
let intervalId;
const wasteCounts = {
    recycled: {'plastic': 0, 'paper': 0, 'metal': 0},
    dumped: {'organic': 0, 'unknown': 0}
};

// --- Firebase Variables ---
let db, auth, userId, appId, wasteLogCollection;

// --- DOM Elements ---
const recycledCounterEl = document.getElementById('recycled-counter');
const dumpedCounterEl = document.getElementById('dumped-counter');
const totalCounterEl = document.getElementById('total-counter');
const recycledCardEl = document.getElementById('recycled-card');
const dumpedCardEl = document.getElementById('dumped-card');
const logListEl = document.getElementById('log-list');
const currentItemEl = document.getElementById('current-item');
const statusLightEl = document.getElementById('status-light');
const emergencyStopBtn = document.getElementById('emergency-stop-btn');
const systemStatusText = document.getElementById('system-status-text');
const conveyorBtn = document.getElementById('conveyor-btn');
const clearLogBtn = document.getElementById('clear-log-btn');
const mainDashboardViewEl = document.getElementById('main-dashboard-view');
const detailedViewEl = document.getElementById('detailed-view');
const backBtn = document.getElementById('back-btn');
const pageTitleEl = document.getElementById('page-title');
const breakdownListEl = document.getElementById('breakdown-list');

// --- Backend Logic Simulation ---
const IR_SIGNATURES = { "organic": 680, "plastic": 850, "paper": 920, "metal": 1050, "unknown": 0 };
const sortingStages = [
    { material: "organic", category: "dumped", destination: "dumping pits" },
    { material: "plastic", category: "recycled", destination: "crushers" },
    { material: "paper", category: "recycled", destination: "recycling belt" },
    { material: "metal", category: "recycled", destination: "melting process" }
];

function simulateIrSensor() {
    const materialTypes = Object.keys(IR_SIGNATURES);
    let randomMaterial;
    if (Math.random() < 0.9) {
        const knownMaterials = materialTypes.filter(m => m !== "unknown");
        randomMaterial = knownMaterials[Math.floor(Math.random() * knownMaterials.length)];
    } else {
        randomMaterial = "unknown";
    }
    return IR_SIGNATURES[randomMaterial];
}

function getMaterialFromSignature(signature) {
    for (const material in IR_SIGNATURES) {
        if (IR_SIGNATURES[material] === signature) return material;
    }
    return "unknown";
}

// --- Core Simulation Function ---
async function runSortingSimulation() {
    if (isProcessing || !isRunning) return;
    isProcessing = true;

    const sensorReading = simulateIrSensor();
    const identifiedMaterial = getMaterialFromSignature(sensorReading);
    const currentItemName = identifiedMaterial.charAt(0).toUpperCase() + identifiedMaterial.slice(1);
    
    currentItemEl.textContent = currentItemName;
    
    let itemSorted = false;
    let stageIndex = 0;

    const processNextStage = async () => {
        if (stageIndex >= sortingStages.length || !isRunning) {
            if (!itemSorted) await handleUnsortedItem(identifiedMaterial, sensorReading);
            isProcessing = false;
            return;
        }

        const stage = sortingStages[stageIndex];
        updateSensorUI(stageIndex, 'active');
        
        await new Promise(resolve => setTimeout(resolve, 800));

        if (identifiedMaterial === stage.material) {
            itemSorted = true;
            updateSensorUI(stageIndex, 'success');
            await saveWasteData({
                material: identifiedMaterial,
                category: stage.category,
                destination: stage.destination,
                ir_signature: sensorReading
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            isProcessing = false;
        } else {
            stageIndex++;
            processNextStage();
        }
    };
    processNextStage();
}

async function handleUnsortedItem(material, sensorReading) {
    updateManualInspectionUI('active');
    await saveData({
        material: material, // will be 'unknown' in this case
        category: 'dumped',
        destination: 'manual inspection',
        ir_signature: sensorReading
    });
    setTimeout(() => updateManualInspectionUI('idle'), 500);
}

async function saveWasteData(data) {
    if (!wasteLogCollection) return;
    try {
        await addDoc(wasteLogCollection, {
            ...data,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error writing document to Firestore: ", error);
    }
}

// --- Firebase Initialization and Listeners ---
async function initializeFirebase() {
    try {
        appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                console.log("User is signed in with UID:", userId);
                setupRealtimeListener();
            }
        });

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error)
    {
        console.error("Firebase initialization failed:", error);
        systemStatusText.textContent = "Database connection failed.";
        systemStatusText.classList.add('text-red-500');
    }
}

function setupRealtimeListener() {
    wasteLogCollection = collection(db, `artifacts/${appId}/public/data/waste_log`);
    const q = query(wasteLogCollection, orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        let recycled = 0;
        let dumped = 0;
        logListEl.innerHTML = '';
        Object.keys(wasteCounts.recycled).forEach(k => wasteCounts.recycled[k] = 0);
        Object.keys(wasteCounts.dumped).forEach(k => wasteCounts.dumped[k] = 0);

        const docs = snapshot.docs.reverse(); // to display oldest first

        docs.forEach(doc => {
            const data = doc.data();
            const displayName = data.material.charAt(0).toUpperCase() + data.material.slice(1);
            const message = `${data.category === 'recycled' ? 'Recycled' : 'Dumped'}: ${displayName} (Sent to ${data.destination})`;
            createLogEntry(message, data.timestamp);

            if (data.category === 'recycled') {
                recycled++;
                if (wasteCounts.recycled.hasOwnProperty(data.material)) {
                    wasteCounts.recycled[data.material]++;
                }
            } else {
                dumped++;
                if (wasteCounts.dumped.hasOwnProperty(data.material)) {
                    wasteCounts.dumped[data.material]++;
                }
            }
        });

        recycledCounterEl.textContent = recycled;
        dumpedCounterEl.textContent = dumped;
        totalCounterEl.textContent = recycled + dumped;
    });
}

function createLogEntry(message, timestamp) {
    const logItem = document.createElement('li');
    logItem.className = 'flex items-center space-x-2 p-3 bg-white rounded-lg shadow-sm border border-gray-100';
    const date = timestamp ? timestamp.toDate().toLocaleTimeString() : new Date().toLocaleTimeString();
    logItem.innerHTML = `<span class="text-gray-400 text-xs">${date}</span><span class="text-sm font-medium text-gray-700">${message}</span>`;
    if (message.includes('Recycled')) logItem.classList.add('border-emerald-200');
    else if (message.includes('Dumped')) logItem.classList.add('border-red-200');
    
    if (logListEl.firstChild) {
        logListEl.insertBefore(logItem, logListEl.firstChild);
    } else {
        logListEl.appendChild(logItem);
    }
}

async function clearLog() {
    if (!wasteLogCollection) return;
    const snapshot = await getDocs(wasteLogCollection);
    snapshot.docs.forEach(doc => {
        deleteDoc(doc.ref);
    });
}

// --- UI Functions ---
function updateSensorUI(index, status) {
    const sensorEl = document.getElementById(`sensor-stage-${index}`);
    const lightEl = sensorEl ? sensorEl.querySelector('.sensor-light') : null;
    if (!lightEl) return;
    document.querySelectorAll('.sensor-light').forEach(el => el.className = 'sensor-light w-8 h-8 mx-auto rounded-full bg-gray-500');
    if (status === 'active') {
        lightEl.classList.remove('bg-gray-500');
        lightEl.classList.add('bg-blue-400', 'animate-pulse');
    } else if (status === 'success') {
        lightEl.classList.remove('bg-blue-400', 'animate-pulse');
        lightEl.classList.add('bg-green-400');
    }
}

function updateManualInspectionUI(status) {
    const lightEl = document.getElementById('manual-inspection-stage').querySelector('.sensor-light');
    if (status === 'active') {
        lightEl.classList.remove('bg-gray-500');
        lightEl.classList.add('bg-yellow-400', 'animate-pulse');
    } else {
        lightEl.className = 'sensor-light w-8 h-8 mx-auto rounded-full bg-gray-500';
    }
}

function toggleConveyor() {
    if (isRunning) {
        isRunning = false;
        clearInterval(intervalId);
        conveyorBtn.textContent = 'START CONVEYOR';
        statusLightEl.classList.remove('bg-blue-500', 'animate-pulse');
        statusLightEl.classList.add('bg-yellow-400');
        systemStatusText.textContent = 'Conveyor paused';
        currentItemEl.textContent = 'PAUSED';
    } else {
        isRunning = true;
        intervalId = setInterval(runSortingSimulation, 3000);
        conveyorBtn.textContent = 'STOP CONVEYOR';
        statusLightEl.classList.remove('bg-yellow-400', 'bg-gray-400');
        statusLightEl.classList.add('bg-blue-500', 'animate-pulse');
        systemStatusText.textContent = 'System operating normally';
        currentItemEl.textContent = 'Awaiting item...';
    }
}

function toggleEmergencyStop() {
    if (isRunning) {
        isRunning = false;
        clearInterval(intervalId);
        emergencyStopBtn.textContent = 'RESUME SYSTEM';
        emergencyStopBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        emergencyStopBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        statusLightEl.classList.remove('bg-blue-500', 'bg-yellow-400', 'animate-pulse');
        statusLightEl.classList.add('bg-red-500');
        systemStatusText.textContent = 'SYSTEM TERMINATED';
        currentItemEl.textContent = 'STOPPED';
        conveyorBtn.disabled = true;
        conveyorBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        emergencyStopBtn.textContent = 'EMERGENCY STOP';
        emergencyStopBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        emergencyStopBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        statusLightEl.classList.remove('bg-red-500');
        statusLightEl.classList.add('bg-gray-400');
        systemStatusText.textContent = 'System offline. Press Start.';
        conveyorBtn.disabled = false;
        conveyorBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function showDetailedView(category, data) {
    mainDashboardViewEl.classList.add('hidden');
    detailedViewEl.classList.remove('hidden');
    pageTitleEl.textContent = `${category} Waste Breakdown`;
    breakdownListEl.innerHTML = '';
    const subcategories = Object.keys(data);
    if (subcategories.length === 0 || Object.values(data).every(count => count === 0)) {
        breakdownListEl.innerHTML = `<p class="text-center text-gray-500 mt-8">No items processed yet.</p>`;
        return;
    }
    subcategories.forEach(item => {
        const count = data[item];
        const displayName = item.charAt(0).toUpperCase() + item.slice(1);
        const card = document.createElement('div');
        card.className = `bg-white rounded-xl p-6 shadow-md flex items-center justify-between border-l-4 ${category === 'Recycled' ? 'border-emerald-500' : 'border-red-500'}`;
        card.innerHTML = `<div><h3 class="text-xl font-bold text-gray-800">${displayName}</h3><p class="text-sm text-gray-500">Items processed</p></div><p class="text-5xl font-bold text-gray-900">${count}</p>`;
        breakdownListEl.appendChild(card);
    });
}

// --- Event Listeners ---
recycledCardEl.addEventListener('click', () => { showDetailedView('Recycled', wasteCounts.recycled); });
dumpedCardEl.addEventListener('click', () => { showDetailedView('Non-Recyclable', wasteCounts.dumped); });
backBtn.addEventListener('click', () => {
    detailedViewEl.classList.add('hidden');
    mainDashboardViewEl.classList.remove('hidden');
});
conveyorBtn.addEventListener('click', toggleConveyor);
emergencyStopBtn.addEventListener('click', toggleEmergencyStop);
clearLogBtn.addEventListener('click', clearLog);

// --- Initial Load ---
window.onload = initializeFirebase;

// Initial setup
currentItemEl.textContent = 'System is offline';

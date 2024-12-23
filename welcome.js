const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "sessionName",
        "outputs": [{"internalType": "string","name": "","type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }
];

async function getSessionName(address) {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(address, CONTRACT_ABI, provider);
        return await contract.sessionName();
    } catch (error) {
        console.error("Error getting session name:", error);
        return 'Unnamed Session';
    }
}

function selectSession(address, updateHistory = false) {
    if(updateHistory) {
        addToRecent(address);
    }
    localStorage.setItem('selectedContract', address);
    window.location.href = 'dashboard.html';
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function accessByAddress(event) {
    event.preventDefault();
    const address = document.getElementById('contractAddress').value;
    selectSession(address, true);
}

async function addToRecent(address) {
    const recent = JSON.parse(localStorage.getItem('recentSessions') || '[]');
    const timestamp = Date.now();
    
    // Try to get name from votingSessions if exists
    const name = await getSessionName(address);
    
    // Create new session object
    const newSession = {
        address,
        name,
        lastAccessed: timestamp
    };
    
    // Remove if already exists
    const filtered = recent.filter(s => s.address !== address);
    
    // Add to beginning
    filtered.unshift(newSession);
    
    // Keep only last 5
    const limited = filtered.slice(0, 5);
    localStorage.setItem('recentSessions', JSON.stringify(limited));
}

function renderRecent() {
    const recentList = document.getElementById('recentList');
    const recent = JSON.parse(localStorage.getItem('recentSessions') || '[]');

    if (recent.length === 0) {
        recentList.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <p>Belum ada sesi yang diakses.</p>
            </div>`;
        return;
    }

    recentList.innerHTML = recent.map(session => `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-center">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800">${session.name}</h3>
                    <p class="text-xs text-gray-500">Terakhir diakses: ${formatDate(session.lastAccessed)}</p>
                    <p class="font-mono text-xs text-gray-400 truncate mt-1">${session.address}</p>
                </div>
                <button onclick="selectSession('${session.address}', true)"
                    class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors ml-4">
                    Masuk
                </button>
            </div>
        </div>
    `).join('');
}

function renderSessions() {
    const sessionList = document.getElementById('sessionList');
    const sessions = JSON.parse(localStorage.getItem('votingSessions') || '[]');

    if (sessions.length === 0) {
        sessionList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>Belum ada sesi pemilihan.</p>
                <p>Klik tombol "Buat Sesi Baru" untuk memulai.</p>
            </div>`;
        return;
    }

    // Sort sessions by timestamp (newest first)
    sessions.sort((a, b) => b.timestamp - a.timestamp);

    sessionList.innerHTML = sessions.map(session => `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-semibold text-lg text-gray-800">${session.name}</h3>
                    <p class="text-sm text-gray-500">Dibuat: ${formatDate(session.timestamp)}</p>
                </div>
                <button onclick="selectSession('${session.address}', true)"
                    class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors">
                    Masuk
                </button>
            </div>
        </div>
    `).join('');
}

function clearRecent() {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat akses?')) {
        localStorage.removeItem('recentSessions');
        renderRecent();
    }
}

function clearSessions() {
    if (confirm('Apakah Anda yakin ingin menghapus semua sesi yang dibuat?')) {
        localStorage.removeItem('votingSessions');
        renderSessions();
    }
}

// Initial render
window.addEventListener('load', () => {
    renderSessions();
    renderRecent();
});
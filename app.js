// Contract ABI and Address
const dApp = {
    contract: null,
    contractABI: [
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "_sessionName",
                    "type": "string"
                },
                {
                    "internalType": "string[]",
                    "name": "_options",
                    "type": "string[]"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [{"internalType": "string","name": "_option","type": "string"}],
            "name": "vote",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "sessionName",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },    
        {
            "inputs": [{"internalType": "string","name": "option","type": "string"}],
            "name": "getVotes",
            "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "address","name": "","type": "address"}],
            "name": "hasVoted",
            "outputs": [{"internalType": "bool","name": "","type": "bool"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getOptions",
            "outputs": [{"internalType": "string[]","name": "","type": "string[]"}],
            "stateMutability": "view",
            "type": "function"
        }
    ],
    contractAddress: localStorage.getItem('selectedContract')
};

const COLORS = [
    'purple-500',
    'red-500',
    'blue-500',
    'green-500',
    'yellow-500',
    'pink-500',
    'indigo-500'
];

let isInitialized = false;

async function renderCandidates() {
    if (!dApp.contract) return;
    
    try {
        const candidatesContainer = document.getElementById('candidatesContainer');
        candidatesContainer.innerHTML = '';
        const options = await dApp.contract.getOptions();

        const cardsHTML = await Promise.all(options.map(async (option, i) => {
            const colorIndex = i % COLORS.length;
            const votes = await dApp.contract.getVotes(option);
            
            return `
                <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <button onclick="vote('${option}')" 
                        class="w-full bg-${COLORS[colorIndex]} hover:bg-${COLORS[colorIndex].replace('500', '600')} text-white py-3 rounded-lg mb-4 transition-colors">
                        Pilih ${option}
                    </button>
                    <div class="text-center">
                        <span id="count${i}" class="text-2xl font-bold text-${COLORS[colorIndex]}">${votes.toString()} Suara</span>
                    </div>
                </div>
            `;
        }));

        candidatesContainer.innerHTML = cardsHTML.join('');
    } catch (error) {
        console.error("Error rendering candidates:", error);
    }
}

async function switchAccount() {
    try {
        await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
        });
        await initDApp();
    } catch (error) {
        console.error("Terdapat kesalahan saat mengganti akun:", error);
    }
}


async function updateVoterDisplay() {
    if (!dApp.contract) return;
    
    const voterAddressSpan = document.getElementById('voterAddress');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // Reset content first
    voterAddressSpan.textContent = address;
    
    // Check if current account has voted
    const hasVoted = await dApp.contract.hasVoted(address);
    if (hasVoted && !voterAddressSpan.textContent.includes('(Sudah memilih)')) {
        voterAddressSpan.textContent += ' (Sudah memilih)';
    }
}

async function getVoteCounts() {
    try {
        if (!dApp.contract) await initDApp();
        const options = await dApp.contract.getOptions();
        
        for (let i = 0; i < options.length; i++) {
            const votes = await dApp.contract.getVotes(options[i]);
            document.getElementById(`count${i}`).textContent = `${votes.toString()} Suara`;
        }
    } catch (error) {
        console.error("Terdapat kesalahan mengambil data suara:", error);
        document.getElementById('result').innerHTML = `Terdapat kesalahan mengambil data suara: ${error.message}`;
    }
}

async function vote(option) {
    try {
        if (!dApp.contract) await initDApp();
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        
        // Check hasVoted mapping
        const voted = await dApp.contract.hasVoted(userAddress);
        if (voted) {
            throw new Error("Anda sudah memilih!");
        }

        const tx = await dApp.contract.vote(option, {
            gasLimit: 100000
        });
        
        document.getElementById('result').innerHTML = `Pemilihan sedang diproses...`;
        await tx.wait();
        document.getElementById('result').innerHTML = `Telah berhasil memilih ${option}`;
        await getVoteCounts();
        
    } catch (error) {
        console.error("Voting error:", error);
        document.getElementById('result').innerHTML = `Error: ${error.message}`;
    }
}

async function initDApp() {
    if (isInitialized) return;
    
    try {
        if (typeof window.ethereum === "undefined") {
            throw new Error("MetaMask not installed!");
        }
        
        if (!localStorage.getItem('selectedContract')) {
            window.location.href = 'contracts.html';
            return;
        }

        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Initialize contract
        dApp.contract = new ethers.Contract(
            dApp.contractAddress, 
            dApp.contractABI, 
            signer
        );
        
        // Verify contract deployment
        const code = await provider.getCode(dApp.contractAddress);
        if (code === "0x") {
            throw new Error("Contract not deployed at this address!");
        }
        
        const sessionName = await dApp.contract.sessionName();
        document.getElementById('sessionTitle').textContent = sessionName;
        document.title = `${sessionName}`;
        
        isInitialized = true;
        
        await renderCandidates();
        await updateVoterDisplay();
        await getVoteCounts();
    } catch (error) {
        console.error("Kesalahan Inisialisasi:", error);
        document.getElementById('result').innerHTML = `Kesalahan Inisialisasi: ${error.message}`;
    }
}

if (window.ethereum) {
    window.ethereum.on('accountsChanged', async () => {
        isInitialized = false;
        await initDApp();
    });
}

window.addEventListener('load', () => {
    initDApp();
    setInterval(getVoteCounts, 30000);
});
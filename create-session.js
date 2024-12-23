// Contract Configuration
const dApp = {
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
            "inputs": [],
            "name": "sessionName",
            "outputs": [{"internalType": "string","name": "","type": "string"}],
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
    ]
};

async function handleSubmit(event) {
    event.preventDefault();
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = 'Sedang membuat kontrak...';

    try {
        if (!window.ethereum) throw new Error("Mohon install MetaMask");
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await provider.getSigner();
        
        // Get session name and candidates from form
        const sessionName = document.getElementById('sessionName').value;
        const candidates = Array.from(document.getElementsByName('candidates[]'))
            .map(input => input.value)
            .filter(value => value);

        if (candidates.length < 2) {
            throw new Error("Minimal harus ada 2 kandidat");
        }

        // Deploy contract
        const factory = new ethers.ContractFactory(
            dApp.contractABI,
            CONTRACT_BYTECODE,
            signer
        );

        const contract = await factory.deploy(sessionName, candidates);
        const deployedContract = await contract.waitForDeployment();
        const address = await deployedContract.getAddress();

        // Save to local storage
        const sessions = JSON.parse(localStorage.getItem('votingSessions') || '[]');
        sessions.push({
            name: sessionName,
            address: address,
            timestamp: Date.now()
        });
        localStorage.setItem('votingSessions', JSON.stringify(sessions));

        // Show success message
        resultDiv.innerHTML = `
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mt-4">
                <p>Kontrak berhasil dibuat!</p>
                <p class="font-mono mt-2">Alamat Kontrak: ${address}</p>
                <a href="index.html" class="text-green-600 hover:text-green-800 underline mt-2 block">
                    Kembali ke Daftar Sesi
                </a>
            </div>`;

    } catch (error) {
        resultDiv.innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                Error: ${error.message}
            </div>`;
    }
}

function addCandidateField() {
    const candidatesList = document.getElementById('candidatesList');
    const newField = document.createElement('div');
    newField.className = 'flex gap-2';
    newField.innerHTML = `
        <input type="text" name="candidates[]" required
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nama Kandidat">
        <button type="button" onclick="removeCandidateField(this)"
            class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
            Hapus
        </button>
    `;
    candidatesList.appendChild(newField);
}

function removeCandidateField(button) {
    button.parentElement.remove();
}
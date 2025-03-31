// Handy Memo Application Logic

// DOM Elements
const selectFileButton = document.getElementById('select-file');
const createFileButton = document.getElementById('create-file');
const currentFileNameSpan = document.getElementById('current-file-name');
const memoListDiv = document.getElementById('memo-list'); // Needed later
const newMemoInput = document.getElementById('new-memo-input'); // Needed later
const addMemoButton = document.getElementById('add-memo'); // Needed later

// Application State
/** @type {FileSystemFileHandle | null} */
let currentFileHandle = null;
let memos = []; // Array to hold parsed memos

// --- Function Definitions ---

/**
 * Updates the UI to show the name of the currently selected file.
 * @param {string | null} fileName - The name of the file, or null if none selected.
 */
function updateCurrentFileName(fileName) {
    if (fileName) {
        currentFileNameSpan.textContent = `ファイル: ${fileName}`;
        currentFileNameSpan.style.fontStyle = 'normal'; // Remove italic style
    } else {
        currentFileNameSpan.textContent = 'ファイルが選択されていません';
        currentFileNameSpan.style.fontStyle = 'italic';
    }
}

/**
 * Handles the selection of an existing file.
 */
async function handleSelectFile() {
    console.log('Attempting to select file...');
    try {
        // Request the user to select a file.
        // We suggest '.md' files but allow others.
        const [fileHandle] = await window.showOpenFilePicker({
            types: [
                {
                    description: 'Markdown Files',
                    accept: {
                        'text/markdown': ['.md', '.markdown'],
                        'text/plain': ['.txt'], // Also allow plain text
                    },
                },
            ],
            multiple: false, // Only allow selecting one file
        });
        currentFileHandle = fileHandle;
        currentFileHandle = fileHandle;
        updateCurrentFileName(currentFileHandle.name);
        console.log('File selected:', currentFileHandle.name);
        // Read file content and display memos
        await readFileAndDisplayMemos();
    } catch (error) {
        // Handle errors, including the user canceling the picker
        if (error.name === 'AbortError') {
            console.log('File selection aborted by user.');
        } else {
            console.error('Error selecting file:', error);
            alert(`ファイル選択エラー: ${error.message}`);
        }
        // Ensure state is clean if selection fails
        // currentFileHandle = null; // Keep existing handle if selection fails after one was open? Or clear? Let's clear for now.
        // updateCurrentFileName(null);
    }
}

/**
 * Handles the creation of a new file.
 */
async function handleCreateFile() {
    console.log('Attempting to create file...');
    try {
        // Request the user where to save the new file.
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: 'handy-memo.md',
            types: [
                {
                    description: 'Markdown File',
                    accept: { 'text/markdown': ['.md'] },
                },
            ],
        });
        currentFileHandle = fileHandle;
        updateCurrentFileName(currentFileHandle.name);
        console.log('File created/selected for saving:', currentFileHandle.name);
        // TODO: Optionally write initial content or just prepare for adding memos
        // Clear memo display as it's a new file
        memoListDiv.innerHTML = '';
        memos = [];
    } catch (error) {
        // Handle errors, including the user canceling the picker
        if (error.name === 'AbortError') {
            console.log('File creation aborted by user.');
        } else {
            console.error('Error creating file:', error);
            alert(`ファイル作成エラー: ${error.message}`);
        }
        // Ensure state is clean if creation fails
        // currentFileHandle = null; // Keep existing handle if creation fails after one was open? Or clear? Let's clear for now.
        // updateCurrentFileName(null);
    }
}


/**
 * Reads the content of the current file handle, parses it, and displays the memos.
 */
async function readFileAndDisplayMemos() {
    if (!currentFileHandle) {
        console.warn('No file selected.');
        memoListDiv.innerHTML = '<p>ファイルを選択してください。</p>'; // Inform user
        memos = [];
        return;
    }

    try {
        const content = await readFileContent(currentFileHandle);
        memos = parseMemos(content);
        displayMemos(memos);
        console.log(`Read and displayed ${memos.length} memos.`);
    } catch (error) {
        console.error('Error reading or displaying file content:', error);
        alert(`ファイル内容の読み込みまたは表示エラー: ${error.message}`);
        memoListDiv.innerHTML = '<p style="color: var(--color-error);">メモの読み込みに失敗しました。</p>';
        memos = []; // Clear memos on error
    }
}

/**
 * Reads the text content of a file handle.
 * @param {FileSystemFileHandle} fileHandle - The handle to the file.
 * @returns {Promise<string>} The text content of the file.
 */
async function readFileContent(fileHandle) {
    const file = await fileHandle.getFile();
    return await file.text();
}

/**
 * Parses the raw text content into an array of memo objects.
 * Expected format per line: "- YYYY-MM-DDTHH:MM:SS Memo content"
 * @param {string} content - The raw text content from the file.
 * @returns {Array<{timestamp: Date, text: string}>} An array of memo objects.
 */
function parseMemos(content) {
    const lines = content.split('\n');
    const parsedMemos = [];
    // Regex to capture timestamp and memo text
    // Allows for optional space after '-' and captures the rest as text
    const memoRegex = /^- ?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}) (.*)$/;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue; // Skip empty lines

        const match = trimmedLine.match(memoRegex);
        if (match) {
            const timestampStr = match[1];
            const text = match[2].trim(); // Trim trailing spaces from memo text
            try {
                const timestamp = new Date(timestampStr);
                // Check if the date is valid (Date constructor can be lenient)
                if (!isNaN(timestamp.getTime())) {
                    parsedMemos.push({ timestamp, text });
                } else {
                    console.warn(`Invalid date format found: "${timestampStr}" in line: "${line}"`);
                }
            } catch (e) {
                console.warn(`Error parsing date: "${timestampStr}" in line: "${line}"`, e);
            }
        } else {
            // Handle lines that don't match the expected format (optional)
            // Could potentially treat them as continuation lines or log a warning
            console.log(`Skipping line (does not match format): "${line}"`);
        }
    }
    return parsedMemos;
}

/**
 * Displays the memos in the UI, sorted by timestamp descending (newest first).
 * @param {Array<{timestamp: Date, text: string}>} memosToDisplay - The array of memo objects.
 */
function displayMemos(memosToDisplay) {
    // Sort memos: newest first
    memosToDisplay.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    memoListDiv.innerHTML = ''; // Clear previous content

    if (memosToDisplay.length === 0) {
        memoListDiv.innerHTML = '<p>メモはありません。</p>';
        return;
    }

    const list = document.createElement('ul');
    list.style.listStyle = 'none'; // Remove default bullet points
    list.style.padding = '0';

    memosToDisplay.forEach(memo => {
        const listItem = document.createElement('li');

        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'memo-timestamp'; // For styling
        // Format timestamp for display (e.g., YYYY/MM/DD HH:MM)
        timestampSpan.textContent = memo.timestamp.toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        const textNode = document.createTextNode(memo.text); // Use textNode for safety

        listItem.appendChild(timestampSpan);
        listItem.appendChild(textNode);
        list.appendChild(listItem);
    });

    memoListDiv.appendChild(list);
}


// (Implement functions based on PLAN.md steps 5, 6, 10)

// --- Event Listeners ---
selectFileButton.addEventListener('click', handleSelectFile);
createFileButton.addEventListener('click', handleCreateFile);
// (Add event listeners based on PLAN.md step 5)

// --- Initial Setup ---
// (Code to run on page load, e.g., load history from localStorage - step 6)

console.log("Handy Memo app.js loaded and initialized.");

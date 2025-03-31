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
        updateCurrentFileName(currentFileHandle.name);
        console.log('File selected:', currentFileHandle.name);
        // TODO: Read file content and display memos (Step 4)
        // await readFileAndDisplayMemos();
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

// (Implement functions based on PLAN.md steps 4, 5, 6, 10)

// --- Event Listeners ---
selectFileButton.addEventListener('click', handleSelectFile);
createFileButton.addEventListener('click', handleCreateFile);
// (Add event listeners based on PLAN.md step 5)

// --- Initial Setup ---
// (Code to run on page load, e.g., load history from localStorage - step 6)

console.log("Handy Memo app.js loaded and initialized.");

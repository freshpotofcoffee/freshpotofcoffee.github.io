// darkMode.js

import { auth, db } from './main.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

function toggleDarkMode() {
    const isDarkMode = !document.body.classList.contains('dark-mode');
    applyDarkMode(isDarkMode);
    
    if (auth.currentUser) {
        saveUserPreferences(isDarkMode);
    } else {
        localStorage.setItem('localDarkMode', isDarkMode);
    }
    
    updateDarkModeUI();
}

function applyDarkMode(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

async function initDarkMode() {
    let darkModePreference = false;

    if (auth.currentUser) {
        try {
            const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (docSnap.exists() && docSnap.data().hasOwnProperty('darkMode')) {
                darkModePreference = docSnap.data().darkMode;
            }
        } catch (error) {
            console.error("Error fetching dark mode preference:", error);
        }
    } else {
        darkModePreference = localStorage.getItem('localDarkMode') === 'true';
    }

    applyDarkMode(darkModePreference);
    updateDarkModeUI();
}

function updateDarkModeUI() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Disable Dark Mode' : 'Enable Dark Mode';
    }
}

async function saveUserPreferences(isDarkMode) {
    if (!auth.currentUser) return;

    try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
            darkMode: isDarkMode
        }, { merge: true });
        console.log("Dark mode preference saved to cloud");
    } catch (error) {
        console.error("Error saving dark mode preference:", error);
    }
}

export { toggleDarkMode, applyDarkMode, initDarkMode, updateDarkModeUI, saveUserPreferences };
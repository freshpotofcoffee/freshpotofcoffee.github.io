// auth.js

import { auth, db, cloudData, localData, skills, activities, quests, rewards, user } from './main.js';
import { loadCloudData, loadLocalData, saveCloudData, resetToLocalData, clearCloudData } from './data.js';
import { updateUIComponents, hideLoginOverlay } from './ui.js';
import { applyDarkMode, initDarkMode } from './darkMode.js';
import { loadSection } from './navigation.js';
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

function initAuth() {
    auth.onAuthStateChanged((currentUser) => {
        if (currentUser) {
            console.log("User is signed in");
            loadCloudData().then(() => {
                if (cloudData.hasOwnProperty('darkMode')) {
                    applyDarkMode(cloudData.darkMode);
                }
                updateUIComponents();
            });
            hideLoginOverlay();
        } else {
            console.log("No user signed in");
            loadLocalData();
        }
    });
}

function signIn() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("User signed in:", result.user);
            loadCloudData().then(() => {
                initDarkMode(); // Load dark mode preference from cloud
                updateUIComponents();
            });
            hideLoginOverlay();
        }).catch((error) => {
            console.error("Error during sign in:", error);
        });
}

async function userSignOut() {
    try {
        await signOut(auth);
        console.log("User signed out");
        clearCloudData();
        await resetToLocalData();
        
        initDarkMode(); // Load dark mode preference from local storage
        
        updateUIComponents();
        
        // Force a re-render of the current section
        const currentSection = document.querySelector('.nav-btn.active').dataset.section;
        loadSection(currentSection);
    } catch (error) {
        console.error("Error during sign out:", error);
    }
}

function isUserLoggedIn() {
    return !!auth.currentUser;
}

export { initAuth, signIn, userSignOut, isUserLoggedIn };
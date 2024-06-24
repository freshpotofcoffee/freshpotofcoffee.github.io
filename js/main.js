// main.js

import { initAuth, signIn, userSignOut } from './auth.js';
import { loadData, saveData, loadLocalData, loadCloudData } from './data.js';
import { initializeDashboard, updateUIComponents, showSettingsMenu, showLoginOverlay, hideLoginOverlay } from './ui.js';
import { initDarkMode } from './darkMode.js';
import { showWelcomeModal, startWalkthrough } from './tutorial.js';
import { createDefaultUser } from './utils.js';
import { loadSection } from './navigation.js';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// Global variables
let skills = {};
let activities = [];
let quests = [];
let rewards = [];
let user = createDefaultUser();
let localData = { user: null, skills: {}, activities: [], quests: [], rewards: [] };
let cloudData = { user: null, skills: {}, activities: [], quests: [], rewards: [] };
let scrollbars = {};

const firebaseConfig = {
    apiKey: "AIzaSyC4Bvfckp0t73HbLMmVF9exusaagGgSLOw",
    authDomain: "habit-adventure-3c33a.firebaseapp.com",
    projectId: "habit-adventure-3c33a",
    storageBucket: "habit-adventure-3c33a.appspot.com",
    messagingSenderId: "867216530393",
    appId: "1:867216530393:web:091c437f5b19796562d7c8",
    measurementId: "G-EJXWRH8SPP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
        console.log('The current browser does not support all of the features required to enable persistence');
    }
});

document.addEventListener("DOMContentLoaded", function() {
    initAuth();
    initDarkMode();

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettingsMenu);
    } else {
        console.error('Settings button not found');
    }

    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    } else {
        console.error('Home button not found');
    }

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const navButtons = document.querySelectorAll('.nav-btn');

    function toggleSidebar() {
        sidebar.classList.toggle('sidebar-open');
        if (sidebar.classList.contains('sidebar-open')) {
            openSidebar();
        } else {
            closeSidebar();
        }
    }

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', toggleSidebar);

        document.addEventListener('click', function(event) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggleButton = event.target === sidebarToggle;
            
            if (!isClickInsideSidebar && !isClickOnToggleButton && sidebar.classList.contains('sidebar-open')) {
                toggleSidebar();
            }
        });

        sidebar.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            loadSection(button.dataset.section);
            if (window.innerWidth <= 768 && sidebar) {
                toggleSidebar();
            }
        });
    });

    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');

    if (signInBtn) signInBtn.addEventListener('click', signIn);
    if (signOutBtn) signOutBtn.addEventListener('click', userSignOut);

    if (!localStorage.getItem('tutorialCompleted')) {
        showWelcomeModal();
    }

    document.getElementById('helpBtn').addEventListener('click', startWalkthrough);

    // Initialize with the overview section
    loadSection('overview');
});

function openSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebar) {
        sidebar.classList.add('sidebar-open');
        sidebar.style.transform = 'translateX(0)';
        sidebar.style.left = '0';
        if (sidebarToggle) {
            sidebarToggle.classList.add('active');
        }
    }
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebar) {
        sidebar.classList.remove('sidebar-open');
        sidebar.style.transform = 'translateX(-100%)';
        sidebar.style.left = '-100%';
        if (sidebarToggle) {
            sidebarToggle.classList.remove('active');
        }
    }
}

// Export all variables and functions that need to be accessed by other modules
export { 
    skills, 
    activities, 
    quests, 
    rewards, 
    user, 
    scrollbars, 
    localData, 
    cloudData, 
    auth, 
    db 
};
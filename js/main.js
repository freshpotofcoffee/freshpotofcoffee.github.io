// main.js

import { initAuth, signIn, userSignOut } from './auth.js';
import { loadData, saveData, loadLocalData, loadCloudData } from './data.js';
import { showSettingsMenu, showNotificationHistory } from './ui.js';
import { initDarkMode } from './darkMode.js';
import { showWelcomeModal, startWalkthrough } from './tutorial.js';
import { createDefaultUser } from './utils.js';
import { loadSection } from './navigation.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { showNotification } from './notifications.js';

// Global variables
export let skills = {};
export let activities = [];
export let quests = [];
export let rewards = [];
export let user = createDefaultUser();
export let localData = { user: null, skills: {}, activities: [], quests: [], rewards: [] };
export let cloudData = { user: null, skills: {}, activities: [], quests: [], rewards: [] };
export let scrollbars = {};

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
export const auth = getAuth(app);
export const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
        console.log('The current browser does not support all of the features required to enable persistence');
    }
});

function initializeUI() {
    const userProfileMini = document.getElementById('userProfileMini');
    const mobileUserProfileMini = document.getElementById('mobileUserProfileMini');

    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadSection(link.dataset.section);
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
        if (mobileMenu && mobileMenu.classList.contains('open') && 
            !mobileMenu.contains(event.target) && 
            event.target !== mobileMenuToggle) {
            mobileMenu.classList.remove('open');
        }
    });

    // Add notification container to the body if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    // Update user profile
    function updateUserProfile() {
        const profileContent = user ? `
                    <img src="${user.avatar}" alt="${user.name}" class="mini-avatar">
            <span class="mini-username">${user.name}</span>
        ` : '<span class="mini-profile-signin">Sign In</span>';

        if (userProfileMini) userProfileMini.innerHTML = profileContent;
        if (mobileUserProfileMini) mobileUserProfileMini.innerHTML = profileContent;
    }

    updateUserProfile();
}

function initializeMenu() {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    function handleNavLinkClick(e) {
        e.preventDefault();
        const section = this.getAttribute('data-section');
        if (section) {
            loadSection(section);
        } else {
            console.error('No section specified for nav link:', this);
        }
    }

    navLinks.forEach(link => {
        link.removeEventListener('click', handleNavLinkClick);
        link.addEventListener('click', handleNavLinkClick);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    initAuth();
    initDarkMode();
    initializeUI();
    initializeMenu();
    
    console.log("DOM fully loaded");

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const sideDrawer = document.getElementById('sideDrawer');
    const drawerLinks = document.querySelectorAll('.drawer-link');
    const notificationsBtn = document.getElementById('notificationsBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const mobileNotificationsBtn = document.getElementById('mobileNotificationsBtn');
    const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
    const drawerOverlay = document.getElementById('drawerOverlay');

    function toggleDrawer() {
        const isOpen = sideDrawer.classList.toggle('open');
        drawerOverlay.classList.toggle('open', isOpen);
        console.log('Toggling drawer. Is open:', isOpen);
        console.log('Side drawer classes:', sideDrawer.className);
    }

    function closeDrawer() {
        sideDrawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
        console.log('Closing drawer');
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleDrawer);
        console.log('Hamburger button listener added');
    } else {
        console.error('Hamburger button not found');
    }

    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', closeDrawer);
    } else {
        console.error('Close drawer button not found');
    }

    drawerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            closeDrawer();
            const section = this.dataset.section;
            if (typeof loadSection === 'function') {
                loadSection(section);
            } else {
                console.error('loadSection function not found');
            }
        });
    });

    drawerOverlay.addEventListener('click', closeDrawer);

    if (mobileNotificationsBtn) {
        mobileNotificationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof showNotificationHistory === 'function') {
                showNotificationHistory();
            } else {
                console.error('showNotificationHistory function not found');
            }
        });
    }

    if (mobileSettingsBtn) {
        mobileSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof showSettingsMenu === 'function') {
                showSettingsMenu();
            } else {
                console.error('showSettingsMenu function not found');
            }
        });
    }

    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof showNotificationHistory === 'function') {
                showNotificationHistory();
            } else {
                console.error('showNotificationHistory function not found');
            }
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof showSettingsMenu === 'function') {
                showSettingsMenu();
            } else {
                console.error('showSettingsMenu function not found');
            }
        });
    }

    function updateActiveLink(section) {
        drawerLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === section);
        });
    }

    window.addEventListener('sectionloaded', function(e) {
        updateActiveLink(e.detail.section);
    });

    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', startWalkthrough);
    } else {
        console.error('Help button not found');
    }

    loadSection('overview');
});

export { showNotification };
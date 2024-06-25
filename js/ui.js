// ui.js

import { user, skills, activities, quests, rewards, auth } from './main.js';
import { signIn, userSignOut } from './auth.js';
import { saveData, loadData } from './data.js';
import { loadSection } from './navigation.js';
import { toggleDarkMode } from './darkMode.js';
import { showDebugOptions } from './debug.js';
import { showEditSkillForm, deleteSkill } from './skills.js';
import { showEditActivityForm, deleteActivity, completeActivity } from './activities.js';
import { showEditQuestForm, deleteQuest, claimQuestReward } from './quests.js';
import { showAddMilestoneForm, claimReward } from './rewards.js';
import { XP_PER_LEVEL, MAX_SKILL_LEVEL, calculateLevel, xpForNextLevel } from './utils.js';
import { getNotificationHistory, clearNotificationHistory } from './notifications.js';

function initializeDashboard() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            loadSection(button.dataset.section);
        });
    });

    loadData();
    loadSection('overview');
}

function showLoginOverlay() {
    let overlay = document.getElementById('loginOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loginOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        const loginPrompt = document.createElement('div');
        loginPrompt.style.cssText = `
            background-color: var(--background-color);
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
        `;
        loginPrompt.innerHTML = `
            <h2>Create an Account</h2>
            <p>Create an account to sync your data across devices.</p><br />
            <button id="loginBtn" class="action-btn">Register / Log In</button>
            <button id="continueLocalBtn" class="secondary-btn">Continue without account</button>
        `;

        overlay.appendChild(loginPrompt);
        document.body.appendChild(overlay);

        document.getElementById('loginBtn').addEventListener('click', signIn);
        document.getElementById('continueLocalBtn').addEventListener('click', hideLoginOverlay);
    } else {
        overlay.style.display = 'flex';
    }
}

function hideLoginOverlay() {
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'none';
    }
}

function updateUIComponents() {
    updateUserInfoDisplay();
    updateMiniProfile();
    loadSection('overview');
}

function updateMiniProfile() {
    const miniProfileElement = document.getElementById('userProfileMini');
    const currentUser = auth.currentUser;

    if (currentUser && user) {
        miniProfileElement.innerHTML = `
            <img src="${user.avatar}" alt="Profile Picture" class="mini-profile-pic">
            <span class="mini-profile-name">${user.name}</span>
            <button id="miniSignOutBtn" class="mini-sign-out-btn">Sign Out</button>
        `;
        document.getElementById('miniSignOutBtn').addEventListener('click', userSignOut);
    } else {
        miniProfileElement.innerHTML = `
            <span class="mini-profile-signin">Not signed in</span>
            <button id="miniSignInBtn" class="mini-sign-in-btn">Sign In</button>
        `;
        document.getElementById('miniSignInBtn').addEventListener('click', signIn);
    }
}

function showSettingsMenu() {
    const currentUser = auth.currentUser;
    let content;

    if (currentUser) {
        content = `
            <div class="user-profile-summary">
                <img src="${user.avatar}" alt="Profile Picture" class="profile-pic">
                <p class="user-name">${user.name}</p>
                <p class="user-email">${currentUser.email}</p>
            </div>
            <ul class="settings-menu">
                <li><button id="editProfileBtn" class="settings-option">Edit Profile</button></li>
                <li><button id="exportDataBtn" class="settings-option">Export Data</button></li>
                <li><button id="importDataBtn" class="settings-option">Import Data</button></li>
                <li><button id="debugOptionsBtn" class="settings-option">Debug Options</button></li>
                <li><button id="darkModeToggle" class="settings-option">
                    ${document.body.classList.contains('dark-mode') ? 'Disable' : 'Enable'} Dark Mode
                </button></li>
            </ul>
            <button id="signOutBtn" class="action-btn sign-out-btn">Sign Out</button>
        `;
    } else {
        content = `
            <div class="user-profile-summary">
                <img src="${user.avatar}" alt="Profile Picture" class="profile-pic">
                <p class="user-name">${user.name}</p>
                <p class="user-status">Using Local Data</p>
            </div>
            <ul class="settings-menu">
                <li><button id="editProfileBtn" class="settings-option">Edit Profile</button></li>
                <li><button id="exportDataBtn" class="settings-option">Export Data</button></li>
                <li><button id="importDataBtn" class="settings-option">Import Data</button></li>
                <li><button id="debugOptionsBtn" class="settings-option">Debug Options</button></li>
                <li><button id="darkModeToggle" class="settings-option">
                    ${document.body.classList.contains('dark-mode') ? 'Disable' : 'Enable'} Dark Mode
                </button></li>
            </ul>
            <button id="signInBtn" class="action-btn sign-in-btn">Sign In</button>
        `;
    }

    const settingsMenu = createModal('Settings', content);

    // Add event listeners
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        showEditProfileForm();
    });
    document.getElementById('exportDataBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        exportData();
    });
    document.getElementById('importDataBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        importData();
    });
    document.getElementById('debugOptionsBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        showDebugOptions();
    });
    document.getElementById('darkModeToggle').addEventListener('click', () => {
        toggleDarkMode();
        closeModal(settingsMenu);
        showSettingsMenu(); // Reopen the menu to reflect the change
    });
    
    if (currentUser) {
        document.getElementById('signOutBtn').addEventListener('click', () => {
            closeModal(settingsMenu);
            userSignOut();
        });
    } else {
        document.getElementById('signInBtn').addEventListener('click', () => {
            closeModal(settingsMenu);
            signIn();
        });
    }
}

function updateUserInfoDisplay() {
    const userNameElement = document.getElementById('userName');
    const userLevelElement = document.getElementById('userLevel');
    const avatarImg = document.getElementById('userAvatar');
    const xpFill = document.getElementById('xpFill');
    const xpInfo = document.getElementById('xpInfo');

    if (user) {
        if (userNameElement) userNameElement.textContent = user.name || "Adventurer";
        if (userLevelElement) userLevelElement.textContent = 'Level ' + (user.level || 1);
        
        if (avatarImg) {
            avatarImg.src = user.avatar || '../images/default-avatar.webp';
            avatarImg.onerror = function() {
                this.src = '../images/default-avatar.webp';
            };
        }
        
        const nextLevelXP = xpForNextLevel(user.level || 1);
        const currentLevelXP = nextLevelXP - XP_PER_LEVEL;
        const xpProgress = ((user.xp || 0) - currentLevelXP) / XP_PER_LEVEL * 100;
        
        if (xpFill) {
            xpFill.style.width = xpProgress + '%';
        }
        
        if (xpInfo) {
            xpInfo.textContent = `${(user.xp || 0) - currentLevelXP} / ${XP_PER_LEVEL} XP to next level`;
        }
    } else {
        // Handle case when user is null
        if (userNameElement) userNameElement.textContent = "Adventurer";
        if (userLevelElement) userLevelElement.textContent = 'Level 1';
        if (avatarImg) avatarImg.src = '../images/default-avatar.webp';
        if (xpFill) xpFill.style.width = '0%';
        if (xpInfo) xpInfo.textContent = '0 / 100 XP to next level';
    }
}

function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>${title}</h2>
            ${content}
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
        closeModal(modal);
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal(modal);
        }
    };

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent.offsetHeight > window.innerHeight) {
        modalContent.style.height = '90vh';
        modalContent.style.overflowY = 'auto';
    }

    return modal;
}

function closeModal(modal) {
    modal.style.display = 'none';
    modal.remove();
}

function showEditProfileForm() {
    const modal = createModal('Edit Profile', `
        <form id="editProfileForm">
            <div class="form-group">
                <label for="editUserName">Name:</label>
                <input type="text" id="editUserName" value="${user.name}" required>
            </div>
            <div class="form-group">
                <label for="editUserAvatar">Avatar URL:</label>
                <input type="text" id="editUserAvatar" value="${user.avatar}">
            </div>
            <button type="submit" class="action-btn">Update Profile</button>
        </form>
    `);

    document.getElementById('editProfileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        user.name = document.getElementById('editUserName').value.trim();
        const newAvatar = document.getElementById('editUserAvatar').value.trim();
        if (newAvatar) {
            user.avatar = newAvatar;
        }
        saveData();
        updateUserInfoDisplay();
        updateMiniProfile();
        closeModal(modal);
    });
}

function exportData() {
    const data = {
        user: user,
        skills: skills,
        activities: activities,
        quests: quests,
        rewards: rewards
    };

    const dataStr = JSON.stringify(data);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'habit_adventure_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');

        reader.onload = readerEvent => {
            const content = readerEvent.target.result;
            try {
                const parsedData = JSON.parse(content);
                
                // Replace existing data with imported data
                user = parsedData.user;
                skills = parsedData.skills;
                activities = parsedData.activities;
                quests = parsedData.quests;
                rewards = parsedData.rewards;

                saveData();
                updateUserInfoDisplay();
                loadSection('overview');

                showNotification('Data imported successfully!');
            } catch (error) {
                console.error('Error parsing imported data:', error);
                showNotification('Error importing data. Please make sure the file is a valid JSON export from Habit Adventure.');
            }
        }
    }

    input.click();
}

export function showNotificationHistory() {
    const history = getNotificationHistory();
    
    const modalContent = `
        <div class="notification-history-list">
            ${history.length > 0 ? history.map(notification => `
                <div class="notification-history-item ${notification.type}">
                    <div class="notification-history-icon">
                        <i class="fas ${getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-history-content">
                        <div class="notification-history-time">${formatDate(notification.timestamp)}</div>
                        <div class="notification-history-message">${notification.message}</div>
                    </div>
                </div>
            `).reverse().join('') : '<p class="no-notifications">No notifications yet.</p>'}
        </div>
        <button id="clearHistoryBtn" class="action-btn">Clear History</button>
    `;

    const modal = createModal('Notification History', modalContent);
    modal.classList.add('notification-history-modal');

    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        clearNotificationHistory();
        closeModal(modal);
        showNotificationHistory(); // Reopen to show empty history
    });
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'error': return 'fa-times-circle';
        default: return 'fa-info-circle';
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

export { showLoginOverlay, hideLoginOverlay, updateUIComponents, updateMiniProfile, showSettingsMenu, updateUserInfoDisplay, createModal, closeModal, showEditProfileForm, exportData, importData, initializeDashboard };
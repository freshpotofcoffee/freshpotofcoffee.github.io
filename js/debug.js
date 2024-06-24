// debug.js

import { skills, activities, quests, rewards, user } from './main.js';
import { saveData } from './data.js';
import { createModal, updateUserInfoDisplay, updateMiniProfile } from './ui.js';
import { createDefaultUser } from './utils.js';
import { loadSection } from './navigation.js';

function showDebugOptions() {
    const debugModal = createModal('Debug Options', `
        <div class="debug-options">
            <h3>Purge Data</h3>
            <button id="purgeAllBtn" class="action-btn">Purge All Data</button>
            <button id="purgeSkillsBtn" class="action-btn">Purge Skills</button>
            <button id="purgeActivitiesBtn" class="action-btn">Purge Activities</button>
            <button id="purgeQuestsBtn" class="action-btn">Purge Quests</button>
            <button id="purgeRewardsBtn" class="action-btn">Purge Rewards</button>
            <button id="clearLocalStorageBtn" class="action-btn">Clear Local Storage</button>
        </div>
    `);

    document.getElementById('purgeAllBtn').addEventListener('click', () => purgeData('all'));
    document.getElementById('purgeSkillsBtn').addEventListener('click', () => purgeData('skills'));
    document.getElementById('purgeActivitiesBtn').addEventListener('click', () => purgeData('activities'));
    document.getElementById('purgeQuestsBtn').addEventListener('click', () => purgeData('quests'));
    document.getElementById('purgeRewardsBtn').addEventListener('click', () => purgeData('rewards'));
    document.getElementById('clearLocalStorageBtn').addEventListener('click', clearLocalStorage);
}

async function purgeData(dataType) {
    if (!confirm(`Are you sure you want to purge ${dataType}? This action cannot be undone.`)) {
        return;
    }

    switch(dataType) {
        case 'all':
            Object.assign(user, createDefaultUser());
            Object.keys(skills).forEach(key => delete skills[key]);
            activities.length = 0;
            quests.length = 0;
            rewards.length = 0;
            break;
        case 'skills':
            Object.keys(skills).forEach(key => delete skills[key]);
            break;
        case 'activities':
            activities.length = 0;
            break;
        case 'quests':
            quests.length = 0;
            break;
        case 'rewards':
            rewards.length = 0;
            break;
    }

    try {
        await saveData();
        console.log(`${dataType} data purged and synced`);
    } catch (error) {
        console.error("Error syncing purged data:", error);
    }

    alert(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} have been purged.`);
    
    // Refresh the current section
    const currentSection = document.querySelector('.nav-btn.active').dataset.section;
    loadSection(currentSection);
    
    // Update user info if 'all' was purged
    if (dataType === 'all') {
        updateUserInfoDisplay();
        updateMiniProfile();
    }
}

function clearLocalStorage() {
    localStorage.removeItem('habitAdventureData');
    console.log('Local storage cleared');
    alert('Local storage has been cleared.');
}

export { showDebugOptions, purgeData, clearLocalStorage };
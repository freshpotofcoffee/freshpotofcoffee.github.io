// data.js

import { auth, db, user, skills, activities, quests, rewards, localData, cloudData } from './main.js';
import { getDoc, doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { updateUIComponents } from './ui.js';
import { createDefaultUser } from './utils.js';

function loadData() {
    if (auth.currentUser) {
        return loadCloudData();
    } else {
        return loadLocalData();
    }
}

function saveData() {
    if (auth.currentUser) {
        return saveCloudData();
    } else {
        return saveLocalData();
    }
}

function loadLocalData() {
    const storedData = localStorage.getItem('habitAdventureData');
    if (storedData) {
        const parsedData = JSON.parse(storedData);
        updateGlobalVariables(parsedData);
    } else {
        resetToDefaultData();
    }
    updateUIComponents();
}

function saveLocalData() {
    const dataToSave = {
        user,
        skills,
        activities,
        quests,
        rewards
    };
    localStorage.setItem('habitAdventureData', JSON.stringify(dataToSave));
}

async function loadCloudData() {
    try {
        const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            updateGlobalVariables(data);
        } else {
            resetToDefaultData();
            await saveCloudData();
        }
        updateUIComponents();
    } catch (error) {
        console.error("Error loading cloud data:", error);
        resetToDefaultData();
    }
}

async function resetToLocalData() {
    const storedData = localStorage.getItem('habitAdventureData');
    if (storedData) {
        const parsedData = JSON.parse(storedData);
        await updateGlobalVariables(parsedData);
    } else {
        await resetToDefaultData();
    }
    clearCloudData();
}

function clearCloudData() {
    Object.keys(cloudData).forEach(key => {
        if (key === 'user') {
            cloudData[key] = null;
        } else if (Array.isArray(cloudData[key])) {
            cloudData[key].length = 0;
        } else if (typeof cloudData[key] === 'object') {
            Object.keys(cloudData[key]).forEach(subKey => {
                delete cloudData[key][subKey];
            });
        }
    });
}

async function saveCloudData() {
    try {
        const dataToSave = {
            user,
            skills,
            activities,
            quests,
            rewards,
            darkMode: document.body.classList.contains('dark-mode')
        };
        await setDoc(doc(db, 'users', auth.currentUser.uid), dataToSave);
        console.log("Cloud data saved successfully");
    } catch (error) {
        console.error("Error saving cloud data:", error);
    }
}

async function updateGlobalVariables(data) {
    Object.assign(user, data.user || await createDefaultUser());
    
    // Clear existing skills and copy new ones
    Object.keys(skills).forEach(key => delete skills[key]);
    Object.assign(skills, data.skills || {});
    
    activities.length = 0;
    activities.push(...(data.activities || []));
    quests.length = 0;
    quests.push(...(data.quests || []));
    rewards.length = 0;
    rewards.push(...(data.rewards || []));
}

async function resetToDefaultData() {
    Object.assign(user, await createDefaultUser());
    Object.keys(skills).forEach(key => delete skills[key]);
    activities.length = 0;
    quests.length = 0;
    rewards.length = 0;
}

export { loadData, saveData, loadLocalData, saveLocalData, loadCloudData, saveCloudData, resetToLocalData, clearCloudData };




// quests.js

import { quests, activities } from './main.js';
import { saveData } from './data.js';
import { createModal, closeModal, updateUserInfoDisplay } from './ui.js';
import { generateUniqueId } from './utils.js';
import { addXP, checkAchievements } from './rewards.js';
import { showNotification } from './notifications.js';


function loadQuestsSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="section-header">
            <h2>Your Quests</h2>
            <button id="addQuestBtn" class="action-btn">Add New Quest</button>
        </div>
        <div id="questsList" class="quest-group"></div>
    `;

    document.getElementById('addQuestBtn')?.addEventListener('click', showAddQuestForm);
    updateQuestsList();
}

function updateQuestsList() {
    const questsList = document.getElementById('questsList');
    if (!questsList) return;

    if (quests.length === 0) {
        questsList.innerHTML = '<p>You haven\'t added any quests yet. Click "Add New Quest" to get started!</p>';
        return;
    }

    questsList.innerHTML = `
        <div class="grid-list">
            ${quests.map(quest => {
                const completedActivities = quest.activities.filter(actId => 
                    activities.find(a => a.id === actId && a.completed)
                ).length;
                const totalActivities = quest.activities.length;
                const isCompleted = completedActivities === totalActivities;
                const progressPercentage = (completedActivities / totalActivities) * 100;

                return `
                <div class="grid-item ${quest.completed ? 'completed' : ''}" id="quest-${quest.id}">
                <div class="item-content">
                    <h3>${quest.name}</h3>
                    <p>${quest.description}</p>
                    <div class="quest-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%;"></div>
                        </div>
                        <p class="progress-text">${completedActivities} / ${totalActivities} activities</p>
                    </div>
                    <p>Reward: ${quest.reward || 'None'}</p>
                </div>
                <div class="item-actions">
                    ${!quest.completed && isCompleted ? 
                        `<button class="claim-btn" data-quest="${quest.id}">Claim Reward</button>` : 
                        ''}
                    <button class="edit-btn" data-quest="${quest.id}">Edit</button>
                    <button class="delete-btn" data-quest="${quest.id}">Delete</button>
                </div>
            </div>
            `;
            }).join('')}
        </div>
    `;

    questsList.querySelectorAll('.claim-btn').forEach(btn => {
        btn.addEventListener('click', () => claimQuestReward(btn.dataset.quest));
    });

    questsList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditQuestForm(btn.dataset.quest));
    });

    questsList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteQuest(btn.dataset.quest));
    });
}

function claimQuestReward(questId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;

    const allActivitiesCompleted = quest.activities.every(actId => 
        activities.find(a => a.id === actId && a.completed)
    );

    if (!allActivitiesCompleted) {
        showNotification('You need to complete all activities in this quest before claiming the reward.');
        return;
    }

    quest.completed = true;
    
    addXP(50);

    if (quest.reward) {
        showNotification(`Congratulations! You've completed the quest "${quest.name}" and earned the reward: ${quest.reward}`);
    } else {
        showNotification(`Congratulations! You've completed the quest "${quest.name}"`);
    }
    saveData();
    updateQuestsList();
    updateUserInfoDisplay();
}

function showAddQuestForm() {
    const modal = createModal('Add New Quest', `
        <form id="addQuestForm">
            <div class="form-group">
                <label for="questName">Quest Name:</label>
                <input type="text" id="questName" required>
            </div>
            <div class="form-group">
                <label for="questDescription">Description:</label>
                <textarea id="questDescription" required></textarea>
            </div>
            <div class="form-group">
                <label for="questActivities">Activities:</label>
                <select id="questActivities" multiple required>
                    ${activities.map(activity => `<option value="${activity.id}">${activity.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="questReward">Reward (optional):</label>
                <input type="text" id="questReward">
            </div>
            <button type="submit" class="action-btn">Add Quest</button>
        </form>
    `);

    document.getElementById('addQuestForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const questName = document.getElementById('questName').value.trim();
        const questDescription = document.getElementById('questDescription').value.trim();
        const selectedActivities = Array.from(document.getElementById('questActivities').selectedOptions).map(option => option.value);
        const questReward = document.getElementById('questReward').value.trim();

        if (!questName || !questDescription || selectedActivities.length === 0) {
            showNotification('Please fill in all required fields.');
            return;
        }

        const newQuest = { 
            id: generateUniqueId(),
            name: questName, 
            description: questDescription, 
            activities: selectedActivities,
            reward: questReward,
            completed: false
        };
        
        quests.push(newQuest);
        
        saveData();
        closeModal(modal);
        updateQuestsList();
        addXP(15);
    });
}

function showEditQuestForm(questId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const modal = createModal('Edit Quest', `
        <form id="editQuestForm">
            <input type="hidden" id="editQuestId" value="${questId}">
            <div class="form-group">
                <label for="editQuestName">Quest Name:</label>
                <input type="text" id="editQuestName" value="${quest.name}" required>
            </div>
            <div class="form-group">
                <label for="editQuestDescription">Description:</label>
                <textarea id="editQuestDescription" required>${quest.description}</textarea>
            </div>
            <div class="form-group">
                <label for="editQuestActivities">Activities:</label>
                <select id="editQuestActivities" multiple required>
                    ${activities.map(activity => `<option value="${activity.id}" ${quest.activities.includes(activity.id) ? 'selected' : ''}>${activity.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="editQuestReward">Reward (optional):</label>
                <input type="text" id="editQuestReward" value="${quest.reward || ''}">
            </div>
            <button type="submit" class="action-btn">Update Quest</button>
        </form>
    `);

    document.getElementById('editQuestForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const questId = document.getElementById('editQuestId').value;
        const questName = document.getElementById('editQuestName').value.trim();
        const questDescription = document.getElementById('editQuestDescription').value.trim();
        const selectedActivities = Array.from(document.getElementById('editQuestActivities').selectedOptions).map(option => option.value);
        const questReward = document.getElementById('editQuestReward').value.trim();

        if (!questName || !questDescription || selectedActivities.length === 0) {
            showNotification('Please fill in all required fields.');
            return;
        }

        const questIndex = quests.findIndex(q => q.id === questId);
        if (questIndex !== -1) {
            quests[questIndex] = { 
                ...quests[questIndex],
                name: questName, 
                description: questDescription, 
                activities: selectedActivities,
                reward: questReward
            };
            saveData();
            closeModal(modal);
            loadQuestsSection();
        }
    });
}

function deleteQuest(questId) {
    if (confirm('Are you sure you want to delete this quest? This action cannot be undone.')) {
        const index = quests.findIndex(q => q.id === questId);
        if (index !== -1) {
            quests.splice(index, 1);  // Remove the quest from the array
        }

        saveData();        updateQuestsList();
    }
}

function completeQuest(questId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;

    quest.completed = true;
    
    quest.activities.forEach(activityId => {
        completeActivity(activityId);
    });
    
    addXP(50);

    if (quest.reward) {
        showNotification(`Congratulations! You've completed the quest "${quest.name}" and earned the reward: ${quest.reward}`);
    } else {
        showNotification(`Congratulations! You've completed the quest "${quest.name}"`);
    }
    saveData();
    updateQuestsList();
    updateUserInfoDisplay();
    checkAchievements();
}

export { loadQuestsSection, updateQuestsList, claimQuestReward, showAddQuestForm, showEditQuestForm, deleteQuest, completeQuest };
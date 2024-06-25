// quests.js

import { quests, activities } from './main.js';
import { saveData } from './data.js';
import { createModal, closeModal, updateUserInfoDisplay } from './ui.js';
import { generateUniqueId } from './utils.js';
import { addXP, checkAchievements } from './rewards.js';
import { showNotification } from './notifications.js';
import { updateDashboard } from './overview.js';

let currentSort = { column: 'name', direction: 'asc' };

export function isQuestCompleted(quest) {
    return quest.activities.every(actId => {
        const activity = activities.find(a => a.id === actId);
        return activity && (activity.status === 'completed' || (activity.repeatable && activity.completionCount > 0));
    });
}

export function updateQuestCompletion(questId) {
    const quest = quests.find(q => q.id === questId);
    if (quest) {
        quest.completed = isQuestCompleted(quest);
        saveData();
        updateQuestsList();
        updateDashboard();
    }
}

function loadQuestsSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="section-header">
            <h2>Quest Log</h2>
            <button id="addQuestBtn" class="primary-action-btn">Embark on a New Quest</button>
        </div>
        <div class="quests-container">
            <div class="quests-controls">
                <div class="search-bar">
                    <input type="text" id="quest-filter" placeholder="Search quests...">
                </div>
                <select id="status-filter">
                    <option value="all">All Quests</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <div class="quests-table-container">
                <table class="quests-table">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="name">Quest Name</th>
                            <th class="hide-mobile">Description</th>
                            <th class="sortable" data-sort="progress">Progress</th>
                            <th>Reward</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="questsList">
                        <!-- Quests will be inserted here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('addQuestBtn').addEventListener('click', showAddQuestForm);
    document.getElementById('quest-filter').addEventListener('input', filterQuests);
    document.getElementById('status-filter').addEventListener('change', filterQuests);
    
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => sortQuests(th.dataset.sort));
    });

    updateQuestsList();
}

function updateQuestsList() {
    const questsList = document.getElementById('questsList');
    if (!questsList) return;

    if (quests.length === 0) {
        questsList.innerHTML = '<tr><td colspan="5">Your quest log is empty. Click "Embark on a New Quest" to begin your journey!</td></tr>';
        return;
    }

    questsList.innerHTML = quests.map(quest => {
        const progress = calculateQuestProgress(quest);
        const completedActivities = Math.round(progress * quest.activities.length);
        const totalActivities = quest.activities.length;
        const progressPercentage = progress * 100;
        const activeQuests = quests.filter(q => !isQuestCompleted(q));
        const isCompleted = quest.completed;

        return `
            <tr class="quest-row ${isCompleted ? 'completed' : ''}" data-quest-id="${quest.id}">
                <td>
                    <i class="fas ${isCompleted ? 'fa-trophy' : 'fa-scroll'} quest-icon"></i>
                    ${quest.name}
                </td>
                <td class="hide-mobile">${quest.description}</td>
                <td>
                    <div class="quest-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%;"></div>
                        </div>
                        <span class="progress-text">${completedActivities}/${totalActivities}</span>
                    </div>
                </td>
                <td>${quest.reward || 'None'}</td>
                <td>
                    <div class="action-buttons">
                        ${getActionButtons(quest, completedActivities, totalActivities)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    addEventListenersToButtons();

    // Update sort indicators
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === currentSort.column) {
            th.classList.add(`sort-${currentSort.direction}`);
        }
    });
}

function getActionButtons(quest, completedActivities, totalActivities) {
    if (quest.completed) {
        return `
            <button class="action-btn edit-btn" data-quest="${quest.id}" title="Edit"><i class="fas fa-edit"></i> Edit</button>
            <button class="action-btn delete-btn" data-quest="${quest.id}" title="Delete"><i class="fas fa-trash"></i> Del</button>
        `;
    } else if (completedActivities === totalActivities) {
        return `
            <button class="action-btn claim-btn" data-quest="${quest.id}" title="Claim"><i class="fas fa-check"></i> Claim</button>
            <button class="action-btn edit-btn" data-quest="${quest.id}" title="Edit"><i class="fas fa-edit"></i> Edit</button>
            <button class="action-btn delete-btn" data-quest="${quest.id}" title="Delete"><i class="fas fa-trash"></i> Del</button>
        `;
    } else {
        return `
            <button class="action-btn edit-btn" data-quest="${quest.id}" title="Edit"><i class="fas fa-edit"></i> Edit</button>
            <button class="action-btn delete-btn" data-quest="${quest.id}" title="Delete"><i class="fas fa-trash"></i> Del</button>
        `;
    }
}

function addEventListenersToButtons() {
    document.querySelectorAll('.claim-btn').forEach(btn => {
        btn.addEventListener('click', () => claimQuestReward(btn.dataset.quest));
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditQuestForm(btn.dataset.quest));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteQuest(btn.dataset.quest));
    });
}

function filterQuests() {
    const filterText = document.getElementById('quest-filter').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;

    document.querySelectorAll('.quest-row').forEach(row => {
        const questName = row.querySelector('td:first-child').textContent.toLowerCase();
        const isCompleted = row.classList.contains('completed');
        const matchesFilter = questName.includes(filterText);
        const matchesStatus = statusFilter === 'all' || 
                              (statusFilter === 'completed' && isCompleted) ||
                              (statusFilter === 'in-progress' && !isCompleted);

        row.style.display = matchesFilter && matchesStatus ? '' : 'none';
    });
}

function claimQuestReward(questId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;

    const allActivitiesCompleted = quest.activities.every(actId => {
        const activity = activities.find(a => a.id === actId);
        return activity && (activity.status === 'completed' || (activity.repeatable && activity.completionCount > 0));
    });

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
            <button type="submit" class="primary-action-btn">Add Quest</button>
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
            <button type="submit" class="primary-action-btn">Update Quest</button>
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

function sortQuests(column) {
    const direction = column === currentSort.column && currentSort.direction === 'asc' ? 'desc' : 'asc';
    currentSort = { column, direction };

    quests.sort((a, b) => {
        let valueA, valueB;
        switch (column) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'progress':
                valueA = calculateQuestProgress(a);
                valueB = calculateQuestProgress(b);
                break;
            default:
                return 0;
        }

        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    updateQuestsList();
}

function calculateQuestProgress(quest) {
    const completedActivities = quest.activities.filter(actId => {
        const activity = activities.find(a => a.id === actId);
        return activity && (activity.status === 'completed' || (activity.repeatable && activity.completionCount > 0));
    }).length;
    return completedActivities / quest.activities.length;
}

export { loadQuestsSection, updateQuestsList, claimQuestReward, showAddQuestForm, showEditQuestForm, deleteQuest, completeQuest };
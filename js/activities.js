// activities.js

import { skills, activities, quests, user } from './main.js';
import { saveData } from './data.js';
import { createModal, closeModal, updateUserInfoDisplay } from './ui.js';
import { generateUniqueId, XP_PER_LEVEL, MAX_SKILL_LEVEL } from './utils.js';
import { addXP, checkAchievements } from './rewards.js';
import { updateQuestsList } from './quests.js';
import { showNotification } from './notifications.js';

function loadActivitiesSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="section-header">
            <h2>Your Activities</h2>
            <button id="add-activity-btn" class="action-btn">Add New Activity</button>
        </div>
        <div class="activities-container">
            <div class="activities-controls">
                <div class="search-bar">
                    <input type="text" id="activity-filter" placeholder="Filter activities...">
                </div>
                <select id="status-filter">
                    <option value="all">All Statuses</option>
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <div class="activities-table-container">
                <table class="activities-table">
                    <thead>
                        <tr>
                            <th>Activity Name</th>
                            <th class="hide-mobile">Related Skill</th>
                            <th class="hide-small">XP</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="activities-list">
                        <!-- Activities will be inserted here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('add-activity-btn').addEventListener('click', showAddActivityForm);
    document.getElementById('activity-filter').addEventListener('input', filterActivities);
    document.getElementById('status-filter').addEventListener('change', filterActivities);

    updateActivitiesList();
}

function updateActivitiesList() {
    const activitiesList = document.getElementById('activities-list');
    if (!activitiesList) return;

    if (activities.length === 0) {
        activitiesList.innerHTML = '<tr><td colspan="6">No activities yet. Click "Add New Activity" to get started!</td></tr>';
        return;
    }

    const groupedActivities = {};
    activities.forEach(activity => {
        const skillId = activity.skillId;
        if (!groupedActivities[skillId]) {
            groupedActivities[skillId] = [];
        }
        groupedActivities[skillId].push(activity);
    });

    const sortedSkills = Object.keys(groupedActivities).sort((a, b) => {
        return skills[a].name.localeCompare(skills[b].name);
    });

    let html = '';
    sortedSkills.forEach(skillId => {
        const skill = skills[skillId];
        const skillActivities = groupedActivities[skillId];

        html += `
            <tr class="skill-group" data-skill-id="${skillId}">
                <td colspan="6">
                    <h3 class="skill-name">${skill.name} <span class="toggle-skill">[-]</span></h3>
                </td>
            </tr>
        `;

        html += skillActivities.map(activity => `
            <tr class="activity-row" data-activity-id="${activity.id}" data-skill-id="${skillId}">
                <td>${activity.name}</td>
                <td class="hide-mobile">${skill.name}</td>
                <td class="hide-small">${activity.xp} XP</td>
                <td><span class="status-badge ${activity.status}">${getStatusLabel(activity.status)}</span></td>
                <td>
                    <span class="activity-type ${activity.repeatable ? 'repeatable' : 'one-time'}">
                        ${activity.repeatable ? 'Repeatable' : 'One-time'}
                    </span>
                    ${activity.repeatable ? `<span class="completion-count">(Done ${activity.completionCount || 0} times)</span>` : ''}
                </td>
                <td>
                    <div class="action-buttons">
                        ${getActionButtons(activity)}
                    </div>
                </td>
            </tr>
        `).join('');
    });

    activitiesList.innerHTML = html;

    // Add event listeners
    activitiesList.querySelectorAll('.skill-group').forEach(group => {
        group.addEventListener('click', toggleSkillGroup);
    });
    activitiesList.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.classList[1].split('-')[0]; // 'start', 'complete', 'undo', 'edit', or 'delete'
            const activityId = btn.closest('.activity-row').dataset.activityId;
            switch(action) {
                case 'start': startActivity(activityId); break;
                case 'complete': completeActivity(activityId); break;
                case 'undo': undoActivityCompletion(activityId); break;
                case 'edit': showEditActivityForm(activityId); break;
                case 'delete': deleteActivity(activityId); break;
            }
        });
    });
}


function getStatusLabel(status) {
    switch (status) {
        case 'not-started': return 'Not Started';
        case 'in-progress': return 'In Progress';
        case 'completed': return 'Completed';       
        default: return 'Unknown';
    }
}

function getActionButtons(activity) {
    if (activity.repeatable) {
        return `
            <button class="action-btn complete-btn" data-activity="${activity.id}">Complete</button>
            <button class="action-btn edit-btn" data-activity="${activity.id}">Edit</button>
            <button class="action-btn delete-btn" data-activity="${activity.id}">Delete</button>
        `;
    } else {
        switch (activity.status) {
            case 'not-started':
                return `
                    <button class="action-btn start-btn" data-activity="${activity.id}">Start</button>
                    <button class="action-btn edit-btn" data-activity="${activity.id}">Edit</button>
                    <button class="action-btn delete-btn" data-activity="${activity.id}">Delete</button>
                `;
            case 'in-progress':
                return `
                    <button class="action-btn complete-btn" data-activity="${activity.id}">Complete</button>
                    <button class="action-btn edit-btn" data-activity="${activity.id}">Edit</button>
                    <button class="action-btn delete-btn" data-activity="${activity.id}">Delete</button>
                `;
            case 'completed':
                return `
                    <button class="action-btn undo-btn" data-activity="${activity.id}">Undo</button>
                    <button class="action-btn edit-btn" data-activity="${activity.id}">Edit</button>
                    <button class="action-btn delete-btn" data-activity="${activity.id}">Delete</button>
                `;            default:
                return '';
        }
    }
}

function toggleSkillGroup(event) {
    const skillGroup = event.currentTarget;
    const skillId = skillGroup.dataset.skillId;
    const activityRows = document.querySelectorAll(`.activity-row[data-skill-id="${skillId}"]`);
    const toggleSpan = skillGroup.querySelector('.toggle-skill');

    activityRows.forEach(row => {
        row.classList.toggle('hidden');
    });

    toggleSpan.textContent = toggleSpan.textContent === '[-]' ? '[+]' : '[-]';
}

function filterActivities() {
    const filterText = document.getElementById('activity-filter').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;

    document.querySelectorAll('.activity-row').forEach(row => {
        const activityName = row.querySelector('td:first-child').textContent.toLowerCase();
        const activityStatus = row.querySelector('.status-badge').classList[1];
        const matchesFilter = activityName.includes(filterText);
        const matchesStatus = statusFilter === 'all' || activityStatus === statusFilter;

        row.style.display = matchesFilter && matchesStatus ? '' : 'none';
    });

    // Show/hide skill groups based on visible activities
    document.querySelectorAll('.skill-group').forEach(group => {
        const skillId = group.dataset.skillId;
        const hasVisibleActivities = document.querySelector(`.activity-row[data-skill-id="${skillId}"]:not([style*="display: none"])`);
        group.style.display = hasVisibleActivities ? '' : 'none';
    });
}

function startActivity(activityId) {
    const activity = activities.find(a => a.id === activityId);
    if (activity && activity.status === 'not-started') {
        activity.status = 'in-progress';
        saveData();
        updateActivitiesList();
    }
}

function completeActivity(activityId) {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const skill = skills[activity.skillId];
    if (!skill) return;

    let xpGained = activity.xp;

    if (activity.repeatable) {
        activity.completionCount = (activity.completionCount || 0) + 1;
    } else if (activity.status === 'completed') {
        return;
    } else {
        activity.status = 'completed';
    }
    
    activity.lastUpdated = Date.now();

    // Function to handle XP gain and level up
    const addXPAndLevelUp = (amount) => {
        skill.xp += amount;
        let levelsGained = 0;
        while (skill.xp >= XP_PER_LEVEL && skill.level < MAX_SKILL_LEVEL) {
            skill.level++;
            skill.xp -= XP_PER_LEVEL;
            levelsGained++;
        }
        if (skill.level === MAX_SKILL_LEVEL) {
            skill.xp = XP_PER_LEVEL;
        }
        if (levelsGained > 0) {
            showNotification(`${skill.name} leveled up to ${skill.level}!`, 'success');
            addXP(20 * levelsGained); // Bonus XP for leveling up
        }
    };

    // Add XP to the skill
    addXPAndLevelUp(xpGained);

    // Add XP to the user
    addXP(xpGained);
    
    showNotification(`Completed ${activity.name} for ${xpGained} XP!`, 'success');

    checkQuestsCompletion();
    saveData();
    updateStreak();
    updateActivitiesList();
    updateUserInfoDisplay();
    checkAchievements();
}

function undoActivityCompletion(activityId) {
    const activity = activities.find(a => a.id === activityId);
    if (activity && !activity.repeatable && activity.status === 'completed') {
        activity.status = 'in-progress';
        saveData();
        updateActivitiesList();
    }
}

function showAddActivityForm() {
    const modal = createModal('Add New Activity', `
        <form id="addActivityForm">
            <div class="form-group">
                <label for="activityName">Activity Name:</label>
                <input type="text" id="activityName" required>
            </div>
            <div class="form-group">
                <label for="activityXP">XP Reward:</label>
                <input type="number" id="activityXP" required min="1">
            </div>
            <div class="form-group">
                <label for="activitySkill">Related Skill:</label>
                <select id="activitySkill" required>
                    ${Object.entries(skills).map(([id, skill]) => `<option value="${id}">${skill.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="activityRepeatable">
                    Repeatable
                </label>
            </div>
            <button type="submit" class="action-btn">Add Activity</button>
        </form>
    `);

    document.getElementById('addActivityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const newActivity = { 
            id: generateUniqueId(),
            name: document.getElementById('activityName').value.trim(),
            xp: parseInt(document.getElementById('activityXP').value),
            skillId: document.getElementById('activitySkill').value,
            repeatable: document.getElementById('activityRepeatable').checked,
            status: 'not-started',
            completionCount: 0,
            lastUpdated: Date.now()
        };
        activities.push(newActivity);
        
        saveData();
        closeModal(modal);
        updateActivitiesList();
        addXP(5);
    });
}

function showEditActivityForm(activityId) {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const modal = createModal('Edit Activity', `
        <form id="editActivityForm">
            <input type="hidden" id="editActivityId" value="${activityId}">
            <div class="form-group">
                <label for="editActivityName">Activity Name:</label>
                <input type="text" id="editActivityName" value="${activity.name}" required>
            </div>
            <div class="form-group">
                <label for="editActivityXP">XP Reward:</label>
                <input type="number" id="editActivityXP" value="${activity.xp}" required min="1">
            </div>
            <div class="form-group">
                <label for="editActivitySkill">Related Skill:</label>
                <select id="editActivitySkill" required>
                    ${Object.entries(skills).map(([id, skill]) => `<option value="${id}" ${activity.skillId === id ? 'selected' : ''}>${skill.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="editActivityRepeatable" ${activity.repeatable ? 'checked' : ''}>
                    Repeatable
                </label>
            </div>
            <button type="submit" class="action-btn">Update Activity</button>
        </form>
    `);

    document.getElementById('editActivityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const activityIndex = activities.findIndex(a => a.id === activityId);
        if (activityIndex !== -1) {
            activities[activityIndex] = { 
                ...activities[activityIndex],
                name: document.getElementById('editActivityName').value.trim(),
                xp: parseInt(document.getElementById('editActivityXP').value),
                skillId: document.getElementById('editActivitySkill').value,
                repeatable: document.getElementById('editActivityRepeatable').checked,
                lastUpdated: Date.now()
            };
            saveData();
            closeModal(modal);
            updateActivitiesList();
        }
    });
}

function deleteActivity(activityId) {
    if (confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
        const index = activities.findIndex(a => a.id === activityId);
        if (index !== -1) {
            activities.splice(index, 1);  // Remove the activity from the array
        }

        // Update quests that might reference this activity
        quests.forEach(quest => {
            quest.activities = quest.activities.filter(id => id !== activityId);
        });

        saveData();
        updateActivitiesList();
        updateQuestsList();
    }
}

function updateStreak() {
    const today = new Date().toDateString();
    if (user.lastActivityDate === today) {
        return;
    }

    if (user.lastActivityDate === new Date(Date.now() - 86400000).toDateString()) {
        user.currentStreak++;
        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }
    } else {
        user.currentStreak = 1;
    }

    user.lastActivityDate = today;

    if (user.currentStreak % 7 === 0) {
        addXP(50);
        showNotification(`Congratulations! You've maintained a ${user.currentStreak}-day streak! Bonus 50 XP awarded!`);
    } else if (user.currentStreak % 3 === 0) {
        addXP(20);
        showNotification(`Great job! You've maintained a ${user.currentStreak}-day streak! Bonus 20 XP awarded!`);
    }
    saveData();
}

function checkQuestsCompletion() {
    quests.forEach(quest => {
        if (!quest.completed) {
            const allActivitiesCompleted = quest.activities.every(actId => 
                activities.find(a => a.id === actId && (a.status === 'completed' || (a.repeatable && a.completionCount > 0)))
            );
            if (allActivitiesCompleted) {
                showNotification(`You've completed all activities for the quest "${quest.name}"! You can now claim your reward.`);
            }
        }
    });
    updateQuestsList();
}

export { 
    loadActivitiesSection, 
    updateActivitiesList, 
    showAddActivityForm, 
    showEditActivityForm, 
    deleteActivity, 
    completeActivity,
    startActivity,
    undoActivityCompletion,
    updateStreak 
};
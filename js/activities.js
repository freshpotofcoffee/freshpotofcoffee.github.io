// activities.js

import { skills, activities, quests, user } from './main.js';
import { saveData } from './data.js';
import { createModal, closeModal, updateUserInfoDisplay } from './ui.js';
import { generateUniqueId, XP_PER_LEVEL, MAX_SKILL_LEVEL } from './utils.js';
import { addXP, checkAchievements } from './rewards.js';
import { updateQuestCompletion, updateQuestsList } from './quests.js';
import { showNotification } from './notifications.js';

let currentSort = { column: 'name', direction: 'asc' };

const ACTIVITY_ICONS = [
    'fa-tasks', 'fa-running', 'fa-book', 'fa-brain',
    'fa-pencil-alt', 'fa-code', 'fa-dumbbell', 'fa-palette',
    'fa-music', 'fa-chess', 'fa-microscope', 'fa-heart',
    'fa-utensils', 'fa-language', 'fa-camera'
];

const ACTIVITY_STATUSES = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    RECURRING: 'recurring'
};

function loadActivitiesSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="section-header">
            <h2>Your Activities</h2>
            <button id="add-activity-btn" class="primary-action-btn">Add New Activity</button>
        </div>
        <div class="activities-container">
            <div class="activities-controls">
                <div class="search-bar">
                    <input type="text" id="activity-filter" placeholder="Filter activities...">
                </div>
                <select id="status-filter">
                    <option value="all">All Statuses</option>
                    <option value="${ACTIVITY_STATUSES.ACTIVE}">Active</option>
                    <option value="${ACTIVITY_STATUSES.COMPLETED}">Completed</option>
                    <option value="${ACTIVITY_STATUSES.RECURRING}">Recurring</option>
                </select>
            </div>
            <div class="activities-table-container">
                <table class="activities-table">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="name">Activity Name</th>
                            <th class="sortable" data-sort="xp">XP</th>
                            <th class="sortable" data-sort="status">Status</th>
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
    
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => sortActivities(th.dataset.sort));
    });

    updateActivitiesList();
}

function sortActivities(column) {
    const direction = column === currentSort.column && currentSort.direction === 'asc' ? 'desc' : 'asc';
    currentSort = { column, direction };

    const sortedActivities = activities.sort((a, b) => {
        let valueA, valueB;
        switch (column) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'xp':
                valueA = a.xp;
                valueB = b.xp;
                break;
            case 'status':
                valueA = getStatusSortValue(a);
                valueB = getStatusSortValue(b);
                break;
            default:
                return 0;
        }

        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    updateActivitiesList(sortedActivities);
}

function getStatusSortValue(activity) {
    if (activity.repeatable) {
        return 2; // Recurring
    } else if (activity.status === ACTIVITY_STATUSES.COMPLETED) {
        return 3; // Completed
    } else {
        return 1; // Active
    }
}

function updateActivitiesList(sortedActivities = activities) {
    const activitiesList = document.getElementById('activities-list');
    if (!activitiesList) return;

    if (sortedActivities.length === 0) {
        activitiesList.innerHTML = '<tr><td colspan="5">No activities yet. Click "Add New Activity" to get started!</td></tr>';
        return;
    }

    const groupedActivities = {};
    sortedActivities.forEach(activity => {
        const skillId = activity.skillId;
        if (!groupedActivities[skillId]) {
            groupedActivities[skillId] = [];
        }
        groupedActivities[skillId].push(activity);
    });

    const sortedSkills = Object.keys(skills).sort((a, b) => skills[a].name.localeCompare(skills[b].name));

    let html = '';
    sortedSkills.forEach(skillId => {
        if (groupedActivities[skillId] && groupedActivities[skillId].length > 0) {
            const skill = skills[skillId];
            html += `
                <tr class="skill-group" data-skill-id="${skillId}">
                    <td colspan="5">
                        <h3 class="skill-name">${skill.name} <span class="toggle-skill">[-]</span></h3>
                    </td>
                </tr>
            `;

            html += groupedActivities[skillId].map(activity => {
                const isCompleted = activity.status === ACTIVITY_STATUSES.COMPLETED || (activity.repeatable && activity.completionCount > 0);
                return `
                    <tr class="activity-row ${isCompleted ? 'completed' : ''}" data-activity-id="${activity.id}" data-skill-id="${skillId}">
                        <td>
                            <i class="fas ${activity.icon || 'fa-tasks'} activity-icon"></i>
                            ${activity.name}
                        </td>
                        <td>${activity.xp} XP</td>
                        <td>${getCombinedStatusLabel(activity)}</td>
                        <td>
                            <div class="action-buttons">
                                ${getActionButtons(activity)}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
    }
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

    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === currentSort.column) {
            th.classList.add(`sort-${currentSort.direction}`);
        }
    });
}

function getCombinedStatusLabel(activity) {
    if (activity.repeatable) {
        const count = activity.completionCount || 0;
        return `
            <span class="status-badge ${ACTIVITY_STATUSES.RECURRING}">
                Recurring (${count}x)
            </span>
        `;
    } else {
        const status = activity.status === ACTIVITY_STATUSES.COMPLETED ? ACTIVITY_STATUSES.COMPLETED : ACTIVITY_STATUSES.ACTIVE;
        return `
            <span class="status-badge ${status}">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        `;
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'in-progress': return 'Active';
        case 'completed': return 'Finished';       
        default: return 'Unknown';
    }
}

function getActionButtons(activity) {
    if (activity.repeatable) {
        return `
            <div class="action-buttons">
                <button class="action-btn complete-btn" data-activity="${activity.id}" title="Complete"><i class="fas fa-check"></i> Do</button>
                <button class="action-btn edit-btn" data-activity="${activity.id}" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                <button class="action-btn delete-btn" data-activity="${activity.id}" title="Delete"><i class="fas fa-trash"></i> Del</button>
            </div>
        `;
    } else {
        switch (activity.status) {
            case ACTIVITY_STATUSES.ACTIVE:
                return `
                    <div class="action-buttons">
                        <button class="action-btn complete-btn" data-activity="${activity.id}" title="Complete"><i class="fas fa-check"></i> Do</button>
                        <button class="action-btn edit-btn" data-activity="${activity.id}" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                        <button class="action-btn delete-btn" data-activity="${activity.id}" title="Delete"><i class="fas fa-trash"></i> Del</button>
                    </div>
                `;
            case ACTIVITY_STATUSES.COMPLETED:
                return `
                    <div class="action-buttons">
                        <button class="action-btn undo-btn" data-activity="${activity.id}" title="Undo"><i class="fas fa-undo"></i> Undo</button>
                        <button class="action-btn edit-btn" data-activity="${activity.id}" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                        <button class="action-btn delete-btn" data-activity="${activity.id}" title="Delete"><i class="fas fa-trash"></i> Del</button>
                    </div>
                `;
            default:
                return `
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" data-activity="${activity.id}" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                        <button class="action-btn delete-btn" data-activity="${activity.id}" title="Delete"><i class="fas fa-trash"></i> Del</button>
                    </div>
                `;
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
        const statusBadge = row.querySelector('.status-badge');
        const statusText = statusBadge.classList[1]; // Get the status from the class
        
        const matchesFilter = activityName.includes(filterText);
        const matchesStatus = 
            statusFilter === 'all' || 
            statusFilter === statusText;

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
        activity.status = ACTIVITY_STATUSES.RECURRING;
    } else {
        activity.status = ACTIVITY_STATUSES.COMPLETED;
    }
    
    activity.lastUpdated = Date.now();

    quests.forEach(quest => {
        if (quest.activities.includes(activityId)) {
            updateQuestCompletion(quest.id);
        }
    });    

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
    if (activity && !activity.repeatable && activity.status === ACTIVITY_STATUSES.COMPLETED) {
        activity.status = ACTIVITY_STATUSES.ACTIVE;
        saveData();
        updateActivitiesList();
        showNotification(`"${activity.name}" has been marked as active again.`, 'info');
    }
    quests.forEach(quest => {
        if (quest.activities.includes(activityId)) {
            updateQuestCompletion(quest.id);
        }
    });
}

function showAddActivityForm() {
    const modal = createModal('Add New Activity', `
        <form id="addActivityForm">
            <div class="form-group">
                <label for="activityName">Activity Name:</label>
                <input type="text" id="activityName" required>
            </div>
            <div class="form-group">
                <label for="activityIcon">Activity Icon:</label>
                <select id="activityIcon" required>
                    ${ACTIVITY_ICONS.map(icon => `<option value="${icon}"><i class="fas ${icon}"></i> ${icon.replace('fa-', '')}</option>`).join('')}
                </select>
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
            <button type="submit" class="primary-action-btn">Add Activity</button>
        </form>
    `);

    document.getElementById('addActivityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const newActivity = { 
            id: generateUniqueId(),
            name: document.getElementById('activityName').value.trim(),
            icon: document.getElementById('activityIcon').value,
            xp: parseInt(document.getElementById('activityXP').value),
            skillId: document.getElementById('activitySkill').value,
            repeatable: document.getElementById('activityRepeatable').checked,
            status: ACTIVITY_STATUSES.ACTIVE,  // Set the initial status to ACTIVE
            completionCount: 0,
            lastUpdated: Date.now()
        };
        activities.push(newActivity);
        
        saveData();
        closeModal(modal);
        updateActivitiesList();
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
                <label for="editActivityIcon">Activity Icon:</label>
                <select id="editActivityIcon" required>
                    ${ACTIVITY_ICONS.map(icon => `<option value="${icon}" ${activity.icon === icon ? 'selected' : ''}><i class="fas ${icon}"></i> ${icon.replace('fa-', '')}</option>`).join('')}
                </select>
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
            <button type="submit" class="primary-action-btn">Update Activity</button>
        </form>
    `);

    document.getElementById('editActivityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const activityIndex = activities.findIndex(a => a.id === activityId);
        if (activityIndex !== -1) {
            activities[activityIndex] = { 
                ...activities[activityIndex],
                name: document.getElementById('editActivityName').value.trim(),
                icon: document.getElementById('editActivityIcon').value,
                xp: parseInt(document.getElementById('editActivityXP').value),
                skillId: document.getElementById('editActivitySkill').value,
                repeatable: document.getElementById('editActivityRepeatable').checked,
                lastUpdated: Date.now(),
                status: activities[activityIndex].status, // Preserve the existing status

            };
            saveData();
            closeModal(modal);
            updateActivitiesList();
            showNotification('Activity updated successfully!', 'success');
        }
    });
}

function deleteActivity(activityId) {
    if (confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
        const index = activities.findIndex(a => a.id === activityId);
        if (index !== -1) {
            const deletedActivity = activities[index]; // Store the activity before deleting
            activities.splice(index, 1);  // Remove the activity from the array

            // Update quests that might reference this activity
            quests.forEach(quest => {
                quest.activities = quest.activities.filter(id => id !== activityId);
            });

            saveData();
            updateActivitiesList();
            updateQuestsList();
            showNotification(`"${deletedActivity.name}" has been deleted.`, 'info');
        } else {
            showNotification('Activity not found.', 'error');
        }
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
    undoActivityCompletion,
    updateStreak 
};
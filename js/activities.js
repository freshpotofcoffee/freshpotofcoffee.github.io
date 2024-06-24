// activities.js

import { skills, activities, quests, user } from './main.js';
import { saveData } from './data.js';
import { createModal, closeModal, updateUserInfoDisplay } from './ui.js';
import { generateUniqueId, MAX_SKILL_LEVEL, XP_PER_LEVEL } from './utils.js';
import { addXP, checkAchievements } from './rewards.js';
import { updateQuestsList } from './quests.js';

function loadActivitiesSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="section-header">
            <h2>Your Activities</h2>
            <button id="addActivityBtn" class="action-btn">Add New Activity</button>
        </div>
        <div id="activitiesList"></div>
    `;

    document.getElementById('addActivityBtn')?.addEventListener('click', showAddActivityForm);
    updateActivitiesList();
}

function updateActivitiesList() {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;

    if (activities.length === 0) {
        activitiesList.innerHTML = '<p>You haven\'t added any activities yet. Click "Add New Activity" to get started!</p>';
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

    const html = sortedSkills.map(skillId => {
        const skill = skills[skillId];
        const skillActivities = groupedActivities[skillId];

        return `
            <div class="skill-group">
                <h3 class="skill-name">${skill.name}</h3>
                <div class="grid-list">
                    ${skillActivities.map(activity => `
                        <div class="grid-item ${activity.completed ? 'completed' : ''}" id="activity-${activity.id}">
                            <div class="item-content">
                                <h4>${activity.name}</h4>
                                <p>${activity.xp} XP</p>
                                ${!activity.completed ? '<p class="activity-status"><span class="status todo">To-Do</span></p>' : ''}
                            </div>
                            <div class="item-actions">
                                ${activity.completed ? 
                                    '' : 
                                    `<button class="complete-btn" data-activity="${activity.id}">Complete</button>`}
                                <button class="edit-btn" data-activity="${activity.id}">Edit</button>
                                <button class="delete-btn" data-activity="${activity.id}">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    activitiesList.innerHTML = html;

    activitiesList.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', () => completeActivity(btn.dataset.activity));
    });

    activitiesList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditActivityForm(btn.dataset.activity));
    });

    activitiesList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteActivity(btn.dataset.activity));
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
        const activityName = document.getElementById('activityName').value.trim();
        const activityXP = parseInt(document.getElementById('activityXP').value);
        const selectedSkill = document.getElementById('activitySkill').value;
        const isRepeatable = document.getElementById('activityRepeatable').checked;

        if (!activityName) {
            alert('Please enter an activity name.');
            return;
        }

        if (isNaN(activityXP) || activityXP <= 0) {
            alert('Please enter a valid XP reward (must be a positive number).');
            return;
        }

        const newActivity = { 
            id: generateUniqueId(),
            name: activityName, 
            xp: activityXP, 
            skillId: selectedSkill, 
            repeatable: isRepeatable,
            completed: false,
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
        const activityId = document.getElementById('editActivityId').value;
        const activityName = document.getElementById('editActivityName').value.trim();
        const activityXP = parseInt(document.getElementById('editActivityXP').value);
        const selectedSkill = document.getElementById('editActivitySkill').value;
        const isRepeatable = document.getElementById('editActivityRepeatable').checked;

        if (!activityName) {
            alert('Please enter an activity name.');
            return;
        }

        if (isNaN(activityXP) || activityXP <= 0) {
            alert('Please enter a valid XP reward (must be a positive number).');
            return;
        }

        const activityIndex = activities.findIndex(a => a.id === activityId);
        if (activityIndex !== -1) {
            activities[activityIndex] = { 
                ...activities[activityIndex],
                name: activityName, 
                xp: activityXP, 
                skillId: selectedSkill, 
                repeatable: isRepeatable
            };
            saveData();
            closeModal(modal);
            loadActivitiesSection();
        }
    });
}

function deleteActivity(activityId) {
    console.log('Attempting to delete activity:', activityId);
    if (confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
        const initialCount = activities.length;
        activities = activities.filter(a => a.id !== activityId);
        const finalCount = activities.length;

        if (initialCount === finalCount) {
            console.error('Activity not found:', activityId);
            alert('Error: Activity not found.');
            return;
        }

        quests.forEach(quest => {
            const initialQuestActivities = quest.activities.length;
            quest.activities = quest.activities.filter(id => id !== activityId);
            if (initialQuestActivities !== quest.activities.length) {
                console.log('Removed activity from quest:', quest.id);
            }
        });

        updateActivitiesList();
        saveData();
        updateQuestsList();
        console.log('Activity deleted successfully:', activityId);
        alert('Activity deleted successfully.');
    }
}

function completeActivity(activityId) {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    if (activity.repeatable) {
        activity.completionCount = (activity.completionCount || 0) + 1;
    } else if (!activity.completed) {
        activity.completed = true;
    }
    
    activity.lastUpdated = Date.now();

    const skill = skills[activity.skillId];
    if (skill && skill.level < MAX_SKILL_LEVEL) {
        skill.xp += activity.xp;
        addXP(activity.xp);
        while (skill.xp >= XP_PER_LEVEL && skill.level < MAX_SKILL_LEVEL) {
            skill.level++;
            skill.xp -= XP_PER_LEVEL;
            alert(`Congratulations! You've leveled up ${skill.name} to level ${skill.level}!`);
            addXP(20);
        }
        if (skill.level === MAX_SKILL_LEVEL) {
            skill.xp = XP_PER_LEVEL;
        }
    }
    
    const activityElement = document.getElementById(`activity-${activityId}`);
    if (activityElement) {
        activityElement.classList.add('activity-completed-animation');
        setTimeout(() => {
            activityElement.classList.remove('activity-completed-animation');
        }, 500);
    }

    checkQuestsCompletion();
    saveData();
    updateStreak();
    updateActivitiesList();
    updateUserInfoDisplay();
    checkAchievements();
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
        alert(`Congratulations! You've maintained a ${user.currentStreak}-day streak! Bonus 50 XP awarded!`);
    } else if (user.currentStreak % 3 === 0) {
        addXP(20);
        alert(`Great job! You've maintained a ${user.currentStreak}-day streak! Bonus 20 XP awarded!`);
    }
    saveData();
}

function checkQuestsCompletion() {
    quests.forEach(quest => {
        if (!quest.completed) {
            const allActivitiesCompleted = quest.activities.every(actId => 
                activities.find(a => a.id === actId && a.completed)
            );
            if (allActivitiesCompleted) {
                alert(`You've completed all activities for the quest "${quest.name}"! You can now claim your reward.`);
            }
        }
    });
    updateQuestsList();
}

export { loadActivitiesSection, updateActivitiesList, showAddActivityForm, showEditActivityForm, deleteActivity, completeActivity, updateStreak };

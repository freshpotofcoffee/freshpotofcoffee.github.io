// rewards.js

import { user, skills, activities, quests, rewards } from './main.js';
import { saveData } from './data.js';
import { createModal, closeModal, updateUserInfoDisplay } from './ui.js';
import { generateUniqueId, MAX_SKILL_LEVEL, XP_PER_LEVEL, calculateLevel } from './utils.js';

const ACHIEVEMENTS = [
    { id: 'first_skill', name: 'Skill Starter', description: 'Create your first skill', check: () => Object.keys(skills).length >= 1 },
    { id: 'five_skills', name: 'Skill Collector', description: 'Create five skills', check: () => Object.keys(skills).length >= 5 },
    { id: 'ten_skills', name: 'Skill Master', description: 'Create ten skills', check: () => Object.keys(skills).length >= 10 },
    { id: 'first_activity', name: 'Go-Getter', description: 'Complete your first activity', check: () => activities.some(a => a.completed) },
    { id: 'ten_activities', name: 'Busy Bee', description: 'Complete 10 activities', check: () => activities.filter(a => a.completed).length >= 10 },
    { id: 'fifty_activities', name: 'Productivity King', description: 'Complete 50 activities', check: () => activities.filter(a => a.completed).length >= 50 },
    { id: 'first_quest', name: 'Questor', description: 'Complete your first quest', check: () => quests.some(q => q.completed) },
    { id: 'five_quests', name: 'Quest Conqueror', description: 'Complete 5 quests', check: () => quests.filter(q => q.completed).length >= 5 },
    { id: 'skill_level_10', name: 'Skilled Practitioner', description: 'Reach level 10 in any skill', check: () => Object.values(skills).some(s => s.level >= 10) },
    { id: 'skill_level_20', name: 'Expert', description: 'Reach level 20 in any skill', check: () => Object.values(skills).some(s => s.level >= 20) },
    { id: 'skill_level_max', name: 'Grand Master', description: 'Reach max level in any skill', check: () => Object.values(skills).some(s => s.level >= MAX_SKILL_LEVEL) },
    { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', check: () => user.currentStreak >= 7 },
    { id: 'streak_30', name: 'Monthly Motivator', description: 'Maintain a 30-day streak', check: () => user.currentStreak >= 30 },
    { id: 'level_5', name: 'Apprentice', description: 'Reach level 5', check: () => user.level >= 5 },
    { id: 'level_10', name: 'Rising Star', description: 'Reach level 10', check: () => user.level >= 10 },
    { id: 'level_20', name: 'Habit Hero', description: 'Reach level 20', check: () => user.level >= 20 },
    { id: 'level_20', name: 'Habit Master', description: 'Reach level 50', check: () => user.level >= 50 },
    { id: 'diverse_skiller', name: 'Renaissance Person', description: 'Level up 5 different skills in a single day', check: checkDiverseSkiller },
    { id: 'night_owl', name: 'Night Owl', description: 'Complete an activity between 12 AM and 4 AM', check: checkNightOwl },
    { id: 'early_bird', name: 'Early Bird', description: 'Complete an activity between 5 AM and 7 AM', check: checkEarlyBird },
];

function checkDiverseSkiller() {
    // Check if 5 different skills were leveled up in the last 24 hours
    const lastDay = Date.now() - 24 * 60 * 60 * 1000;
    const skilledLeveledUp = new Set();
    activities.forEach(activity => {
        if (activity.completed && activity.lastUpdated >= lastDay) {
            skilledLeveledUp.add(activity.skillId);
        }
    });
    return skilledLeveledUp.size >= 5;
}

function checkNightOwl() {
    return activities.some(activity => {
        if (activity.completed) {
            const completionTime = new Date(activity.lastUpdated);
            const hours = completionTime.getHours();
            return hours >= 0 && hours < 4;
        }
        return false;
    });
}

function checkEarlyBird() {
    return activities.some(activity => {
        if (activity.completed) {
            const completionTime = new Date(activity.lastUpdated);
            const hours = completionTime.getHours();
            return hours >= 5 && hours < 7;
        }        return false;
    });
}

function loadRewardsSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="section-header">
            <h2>Achievements and Milestones</h2>
            <button id="addMilestoneBtn" class="action-btn">Add New Milestone</button>
        </div>
        <div id="achievementsList"></div>
        <div id="milestonesList"></div>
    `;

    document.getElementById('addMilestoneBtn').addEventListener('click', showAddMilestoneForm);
    updateRewardsList();
}

function updateRewards() {
    Object.entries(skills).forEach(([skillId, skill]) => {
        const newRewards = [
            { level: 5, name: `${skill.name} Novice`, description: `Reached level 5 in ${skill.name}` },
            { level: 10, name: `${skill.name} Adept`, description: `Reached level 10 in ${skill.name}` },
            { level: 20, name: `${skill.name} Expert`, description: `Reached level 20 in ${skill.name}` },
            { level: MAX_SKILL_LEVEL, name: `${skill.name} Master`, description: `Mastered ${skill.name}` },
        ];

        newRewards.forEach(reward => {
            if (skill.level >= reward.level && !rewards.some(r => r.name === reward.name)) {
                rewards.push({
                    id: generateUniqueId(),
                    ...reward,
                    skillId: skillId,
                    type: 'Achievement',
                    claimed: false
                });
            }
        });
    });

    saveData();
}

function updateRewardsList() {
    updateAchievementsList();
    updateMilestonesList();
}

function updateAchievementsList() {
    const achievementsList = document.getElementById('achievementsList');
    if (!achievementsList) return;

    if (!user || !user.achievements) {
        user = user || createDefaultUser();
        user.achievements = user.achievements || [];
    }

    achievementsList.innerHTML = `
        <h3>Achievements</h3>
        <div class="grid-list">
            ${ACHIEVEMENTS.map(achievement => {
                const isCompleted = user.achievements.includes(achievement.id);
                return `
                    <div class="grid-item ${isCompleted ? 'completed' : ''}" id="achievement-${achievement.id}">
                        <div class="item-content">
                            <h4>${achievement.name}</h4>
                            <p>${achievement.description}</p>
                        </div>
                        ${!isCompleted ? 
                            '<div class="item-actions"><p class="achievement-status"><span class="status todo">Not Completed</span></p></div>' : 
                            ''
                        }
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function updateMilestonesList() {
    const milestonesList = document.getElementById('milestonesList');
    if (!milestonesList) return;

    const milestones = rewards.filter(reward => reward.type === 'Milestone');

    milestonesList.innerHTML = `
        <h3>Milestones</h3>
        <div class="grid-list">
            ${milestones.map(milestone => `
                <div class="grid-item ${milestone.claimed ? 'completed' : ''}" id="milestone-${milestone.id}">
                    <div class="item-content">
                        <h4>${milestone.name}</h4>
                        <p>${milestone.description}</p>
                        <p>Required Level: ${milestone.level} in ${skills[milestone.skillId]?.name || 'Unknown Skill'}</p>
                    </div>
                    <div class="item-actions">
                        ${milestone.claimed 
                            ? ''
                            : (skills[milestone.skillId]?.level >= milestone.level 
                                ? `<button class="claim-btn" data-reward="${milestone.id}">Claim Reward</button>`
                                : `<p>Keep improving your ${skills[milestone.skillId]?.name || 'skill'} to unlock!</p>`
                              )
                        }
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    milestonesList.querySelectorAll('.claim-btn').forEach(btn => {
        btn.addEventListener('click', () => claimReward(btn.dataset.reward));
    });
}

function showAddMilestoneForm() {
    const modal = createModal('Add New Milestone', `
        <form id="addMilestoneForm">
            <div class="form-group">
                <label for="milestoneName">Milestone Name:</label>
                <input type="text" id="milestoneName" required>
            </div>
            <div class="form-group">
                <label for="milestoneDescription">Description:</label>
                <textarea id="milestoneDescription" required></textarea>
            </div>
            <div class="form-group">
                <label for="milestoneSkill">Related Skill:</label>
                <select id="milestoneSkill" required>
                    ${Object.entries(skills).map(([id, skill]) => `<option value="${id}">${skill.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="milestoneLevel">Required Level:</label>
                <input type="number" id="milestoneLevel" min="1" max="${MAX_SKILL_LEVEL}" required>
            </div>
            <button type="submit" class="action-btn">Add Milestone</button>
        </form>
    `);
    document.getElementById('addMilestoneForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const newMilestone = {
            id: generateUniqueId(),
            name: document.getElementById('milestoneName').value.trim(),
            description: document.getElementById('milestoneDescription').value.trim(),
            skillId: document.getElementById('milestoneSkill').value,
            level: parseInt(document.getElementById('milestoneLevel').value),
            type: 'Milestone',
            claimed: false
        };

        rewards.push(newMilestone);
        saveData();
        closeModal(modal);
        updateRewardsList();
    });
}

function claimReward(rewardId) {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    const skill = skills[reward.skillId];
    if (skill && skill.level >= reward.level) {
        reward.claimed = true;
        alert(`Congratulations! You've claimed the reward: ${reward.name}`);
        addXP(30);
        saveData();
        updateRewardsList();
        updateUserInfoDisplay();
    } else {
        alert(`You haven't reached the required level to claim this reward yet.`);
    }
}

function addXP(amount) {
    if (!user) {
        user = createDefaultUser();
    }
    const oldLevel = user.level;
    user.xp += amount;
    user.level = calculateLevel(user.xp);
    
    if (user.level > oldLevel) {
        alert(`Congratulations! You've reached level ${user.level}!`);
    }
    checkAchievements();
    saveData();
    updateUserInfoDisplay();
}

function checkAchievements() {
    let achievementsUnlocked = false;
    ACHIEVEMENTS.forEach(achievement => {
        if (!user.achievements.includes(achievement.id) && achievement.check()) {
            user.achievements.push(achievement.id);
            alert(`Achievement Unlocked: ${achievement.name}\n${achievement.description}`);
            achievementsUnlocked = true;
        }
    });
    if (achievementsUnlocked) {
        saveData();
    }
}

export { 
    ACHIEVEMENTS,
    loadRewardsSection, 
    updateRewards, 
    updateRewardsList, 
    updateAchievementsList, 
    updateMilestonesList, 
    showAddMilestoneForm, 
    claimReward, 
    addXP, 
    checkAchievements 
};
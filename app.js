// Global variables
let skills = {};
let activities = [];
let quests = [];
let rewards = [];
let user = {
    name: "Adventurer",
    xp: 0,
    level: 1,
    achievements: [],
    avatar: 'default-avatar.webp' // Default avatar image
};

const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
const ACHIEVEMENTS = [
    { id: 'first_skill', name: 'Skill Starter', description: 'Create your first skill', check: () => Object.keys(skills).length >= 1 },
    { id: 'five_skills', name: 'Skill Collector', description: 'Create five skills', check: () => Object.keys(skills).length >= 5 },
    { id: 'first_activity', name: 'Go-Getter', description: 'Complete your first activity', check: () => activities.some(a => a.completed) },
    { id: 'level_5', name: 'Apprentice', description: 'Reach level 5', check: () => user.level >= 5 },
    { id: 'first_quest', name: 'Questor', description: 'Complete your first quest', check: () => quests.some(q => q.completed) },
];

document.addEventListener("DOMContentLoaded", function() {
    loadFromLocalStorage();
    initializeDashboard();
    updateUserInfoDisplay();
    document.getElementById('editProfileBtn').addEventListener('click', showEditProfileForm);
});

function initializeDashboard() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            loadSection(button.dataset.section);
        });
    });

    loadSection('overview');
}

function loadSection(sectionName) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '';

    switch(sectionName) {
        case 'overview':
            loadOverviewSection();
            break;
        case 'skills':
            loadSkillsSection();
            break;
        case 'activities':
            loadActivitiesSection();
            break;
        case 'quests':
            loadQuestsSection();
            break;
        case 'rewards':
            loadRewardsSection();
            break;
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionName);
    });
}

function loadOverviewSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h2>Adventure Overview</h2>
        <div class="overview-grid">
            <div class="overview-card">
                <h3>Skills in Progress</h3>
                <p>${Object.keys(skills).length}</p>
            </div>
            <div class="overview-card">
                <h3>Activities Completed</h3>
                <p>${activities.filter(a => a.completed).length} / ${activities.length}</p>
            </div>
            <div class="overview-card">
                <h3>Quests Completed</h3>
                <p>${quests.filter(q => q.completed).length} / ${quests.length}</p>
            </div>
            <div class="overview-card">
                <h3>Rewards Claimed</h3>
                <p>${rewards.filter(r => r.claimed).length} / ${rewards.length}</p>
            </div>
        </div>
        <div class="overview-details">
            <div class="in-progress-quests">
                <h3>Quests in Progress</h3>
                <ul>
                    ${quests.filter(q => !q.completed).slice(0, 5).map(q => `<li>${q.name}</li>`).join('') || '<li>No quests in progress</li>'}
                </ul>
            </div>
            <div class="recent-activities">
                <h3>Recent Activities</h3>
                <ul>
                    ${activities.slice(-5).reverse().map(a => `<li>${a.name} - ${a.completed ? 'Completed' : 'In Progress'}</li>`).join('') || '<li>No recent activities</li>'}
                </ul>
            </div>
            <div class="recent-achievements">
                <h3>Recent Achievements</h3>
                <ul>
                    ${user.achievements.slice(-5).reverse().map(id => {
                        const achievement = ACHIEVEMENTS.find(a => a.id === id);
                        return achievement ? `<li>${achievement.name}</li>` : '';
                    }).join('') || '<li>No achievements yet</li>'}
                </ul>
            </div>
        </div>
    `;
}

function loadSkillsSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h2>Your Skills</h2>
        <button id="addSkillBtn" class="action-btn">Add New Skill</button>
        <div class="sort-controls">
            <label>
                <input type="checkbox" id="sortSkillsCompleted"> Show Mastered Skills First
            </label>
        </div>
        <div class="skills-grid" id="skillsGrid"></div>
    `;

    document.getElementById('addSkillBtn').addEventListener('click', showAddSkillForm);
    document.getElementById('sortSkillsCompleted').addEventListener('change', updateSkillsGrid);
    updateSkillsGrid();
}

function updateSkillsGrid() {
    const skillsGrid = document.getElementById('skillsGrid');
    const showMasteredFirst = document.getElementById('sortSkillsCompleted').checked;
    
    const sortedSkills = Object.entries(skills).sort((a, b) => {
        const aCompleted = a[1].level > 1;
        const bCompleted = b[1].level > 1;
        return showMasteredFirst ? (bCompleted - aCompleted) : (aCompleted - bCompleted);
    });

    skillsGrid.innerHTML = sortedSkills.map(([name, data]) => `
        <div class="skill-card ${data.level > 1 ? 'mastered' : ''}">
            <h3>${name}</h3>
            <p>Level ${data.level}</p>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${(data.xp / data.threshold) * 100}%"></div>
            </div>
            <p>${data.xp} / ${data.threshold} XP</p>
        </div>
    `).join('');
}

function loadActivitiesSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h2>Your Activities</h2>
        <button id="addActivityBtn" class="action-btn">Add New Activity</button>
        <div class="sort-controls">
            <label>
                <input type="checkbox" id="sortActivitiesCompleted"> Show Completed Activities First
            </label>
        </div>
        <div class="activities-list" id="activitiesList"></div>
    `;

    document.getElementById('addActivityBtn').addEventListener('click', showAddActivityForm);
    document.getElementById('sortActivitiesCompleted').addEventListener('change', updateActivitiesList);
    updateActivitiesList();
}

function updateActivitiesList() {
    const activitiesList = document.getElementById('activitiesList');
    const showCompletedFirst = document.getElementById('sortActivitiesCompleted').checked;
    
    const sortedActivities = [...activities].sort((a, b) => {
        return showCompletedFirst ? (b.completed - a.completed) : (a.completed - b.completed);
    });

    activitiesList.innerHTML = sortedActivities.map(activity => `
        <div class="activity-item ${activity.completed ? 'completed' : ''}">
            <h3>${activity.name}</h3>
            <p>${activity.xp} XP - ${activity.skill}</p>
            ${activity.completed ? '<span class="status">Completed</span>' : 
              `<button class="complete-btn" data-activity="${activity.name}">Complete</button>`}
        </div>
    `).join('');

    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', () => completeActivity(btn.dataset.activity));
    });
}

function loadQuestsSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h2>Your Quests</h2>
        <button id="addQuestBtn" class="action-btn">Add New Quest</button>
        <div class="sort-controls">
            <label>
                <input type="checkbox" id="sortQuestsCompleted"> Show Completed Quests First
            </label>
        </div>
        <div class="quests-list" id="questsList"></div>
    `;

    document.getElementById('addQuestBtn').addEventListener('click', showAddQuestForm);
    document.getElementById('sortQuestsCompleted').addEventListener('change', updateQuestsList);
    updateQuestsList();
}

function updateQuestsList() {
    const questsList = document.getElementById('questsList');
    const showCompletedFirst = document.getElementById('sortQuestsCompleted').checked;
    
    const sortedQuests = [...quests].sort((a, b) => {
        return showCompletedFirst ? (b.completed - a.completed) : (a.completed - b.completed);
    });

    questsList.innerHTML = sortedQuests.map(quest => `
        <div class="quest-item ${quest.completed ? 'completed' : ''}">
            <h3>${quest.name}</h3>
            <p>${quest.description}</p>
            <p>Activities: ${quest.activities.join(', ')}</p>
            ${quest.completed ? '<span class="status">Completed</span>' : 
              `<button class="complete-btn" data-quest="${quest.name}">Complete Quest</button>`}
        </div>
    `).join('');

    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', () => completeQuest(btn.dataset.quest));
    });
}

function loadRewardsSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h2>Your Rewards</h2>
        <button id="addRewardBtn" class="action-btn">Add New Reward</button>
        <div class="sort-controls">
            <label>
                <input type="checkbox" id="sortRewardsClaimed"> Show Claimed Rewards First
            </label>
        </div>
        <div class="rewards-list" id="rewardsList"></div>
    `;

    document.getElementById('addRewardBtn').addEventListener('click', showAddRewardForm);
    document.getElementById('sortRewardsClaimed').addEventListener('change', updateRewardsList);
    updateRewardsList();
}

function updateRewardsList() {
    const rewardsList = document.getElementById('rewardsList');
    const showClaimedFirst = document.getElementById('sortRewardsClaimed').checked;
    
    const sortedRewards = [...rewards].sort((a, b) => {
        return showClaimedFirst ? (b.claimed - a.claimed) : (a.claimed - b.claimed);
    });

    rewardsList.innerHTML = sortedRewards.map(reward => `
        <div class="reward-item ${reward.claimed ? 'claimed' : ''}">
            <h3>${reward.name}</h3>
            <p>Unlocks at Level ${reward.level} for ${reward.skill}</p>
            ${reward.claimed ? '<span class="status">Claimed</span>' : 
              `<button class="claim-btn" data-reward="${reward.name}">Claim Reward</button>`}
        </div>
    `).join('');

    document.querySelectorAll('.claim-btn').forEach(btn => {
        btn.addEventListener('click', () => claimReward(btn.dataset.reward));
    });
}

function showAddSkillForm() {
    const modal = createModal('Add New Skill', `
        <form id="addSkillForm">
            <div class="form-group">
                <label for="skillName">Skill Name:</label>
                <input type="text" id="skillName" required>
            </div>
            <div class="form-group">
                <label for="skillThreshold">XP Threshold:</label>
                <input type="number" id="skillThreshold" value="100" required>
            </div>
            <button type="submit" class="action-btn">Add Skill</button>
        </form>
    `);

    document.getElementById('addSkillForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const skillName = document.getElementById('skillName').value;
        const threshold = parseInt(document.getElementById('skillThreshold').value);
        
        if (skills[skillName]) {
            alert('Skill already exists!');
            return;
        }

        skills[skillName] = { xp: 0, level: 1, threshold: threshold };
        saveToLocalStorage();
        closeModal(modal);
        loadSection('skills');
        addXP(10); // Award XP for creating a new skill
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
                <input type="number" id="activityXP" required>
            </div>
            <div class="form-group">
                <label for="activitySkill">Related Skill:</label>
                <select id="activitySkill" required>
                    ${Object.keys(skills).map(skill => `<option value="${skill}">${skill}</option>`).join('')}
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
        const activityName = document.getElementById('activityName').value;
        const activityXP = parseInt(document.getElementById('activityXP').value);
        const selectedSkill = document.getElementById('activitySkill').value;
        const isRepeatable = document.getElementById('activityRepeatable').checked;

        const newActivity = { 
            name: activityName, 
            xp: activityXP, 
            skill: selectedSkill, 
            repeatable: isRepeatable,
            completed: false,
            completionCount: 0
        };
        activities.push(newActivity);
        saveToLocalStorage();
        closeModal(modal);
        loadSection('activities');
        addXP(5); // Award XP for creating a new activity
    });
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
                <label for="questActivities">Related Activities:</label>
                <select id="questActivities" multiple required>
                    ${activities.map(activity => `<option value="${activity.name}">${activity.name}</option>`).join('')}
                </select>
            </div>
            <button type="submit" class="action-btn">Add Quest</button>
        </form>
    `);

    document.getElementById('addQuestForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const questName = document.getElementById('questName').value;
        const questDescription = document.getElementById('questDescription').value;
        const selectedActivities = Array.from(document.getElementById('questActivities').selectedOptions).map(option => option.value);

        const newQuest = { 
            name: questName, 
            description: questDescription, 
            activities: selectedActivities,
            completed: false
        };
        quests.push(newQuest);
        saveToLocalStorage();
        closeModal(modal);
        loadSection('quests');
        addXP(15); // Award XP for creating a new quest
    });
}

function showAddRewardForm() {
    const modal = createModal('Add New Reward', `
        <form id="addRewardForm">
            <div class="form-group">
                <label for="rewardName">Reward Name:</label>
                <input type="text" id="rewardName" required>
            </div>
            <div class="form-group">
                <label for="rewardSkill">Related Skill:</label>
                <select id="rewardSkill" required>
                    ${Object.keys(skills).map(skill => `<option value="${skill}">${skill}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="rewardLevel">Required Level:</label>
                <input type="number" id="rewardLevel" required>
            </div>
            <button type="submit" class="action-btn">Add Reward</button>
        </form>
    `);

    document.getElementById('addRewardForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const rewardName = document.getElementById('rewardName').value;
        const rewardSkill = document.getElementById('rewardSkill').value;
        const rewardLevel = parseInt(document.getElementById('rewardLevel').value);

        const newReward = { 
            name: rewardName, 
            skill: rewardSkill, 
            level: rewardLevel,
            claimed: false
        };
        rewards.push(newReward);
        saveToLocalStorage();
        closeModal(modal);
        loadSection('rewards');
    });
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
    modal.style.display = 'block';

    modal.querySelector('.close').onclick = function() {
        closeModal(modal);
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal(modal);
        }
    };

    return modal;
}

function closeModal(modal) {
    modal.style.display = 'none';
    modal.remove();
}

function completeActivity(activityName) {
    const activity = activities.find(a => a.name === activityName);
    if (activity) {
        if (activity.repeatable) {
            activity.completionCount++;
        } else if (!activity.completed) {
            activity.completed = true;
        }
        
        // Award XP
        const skill = skills[activity.skill];
        if (skill) {
            skill.xp += activity.xp;
            addXP(activity.xp); // Add XP to user
            if (skill.xp >= skill.threshold) {
                skill.level++;
                skill.xp -= skill.threshold;
                skill.threshold = Math.round(skill.threshold * 1.1); // Increase threshold by 10%
                alert(`Congratulations! You've leveled up ${activity.skill} to level ${skill.level}!`);
                addXP(20); // Bonus XP for leveling up a skill
            }
        }
        
        saveToLocalStorage();
        loadSection('activities');
        updateUserInfoDisplay();
    }
}

function completeQuest(questName) {
    const quest = quests.find(q => q.name === questName);
    if (quest && !quest.completed) {
        quest.completed = true;
        
        // Complete all activities in the quest
        quest.activities.forEach(activityName => {
            completeActivity(activityName);
        });
        
        addXP(50); // Bonus XP for completing a quest
        saveToLocalStorage();
        loadSection('quests');
        updateUserInfoDisplay();
    }
}

function claimReward(rewardName) {
    const reward = rewards.find(r => r.name === rewardName);
    if (reward) {
        const skill = skills[reward.skill];
        if (skill && skill.level >= reward.level) {
            reward.claimed = true;
            alert(`Congratulations! You've claimed the reward: ${reward.name}`);
            addXP(30); // Bonus XP for claiming a reward
            saveToLocalStorage();
            loadSection('rewards');
            updateUserInfoDisplay();
        } else {
            alert(`You haven't reached the required level to claim this reward yet.`);
        }
    }
}

function addXP(amount) {
    user.xp += amount;
    checkLevelUp();
    checkAchievements();
    updateUserInfoDisplay();
    saveToLocalStorage();
}

function checkLevelUp() {
    while (user.level < LEVEL_THRESHOLDS.length && user.xp >= LEVEL_THRESHOLDS[user.level]) {
        user.level++;
        alert(`Congratulations! You've reached level ${user.level}!`);
    }
}

function checkAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
        if (!user.achievements.includes(achievement.id) && achievement.check()) {
            user.achievements.push(achievement.id);
            alert(`Achievement Unlocked: ${achievement.name}\n${achievement.description}`);
        }
    });
}

function updateUserInfoDisplay() {
    const userNameElement = document.querySelector('.user-info h2');
    const userLevelElement = document.querySelector('.user-info p');
    const avatarImg = document.querySelector('.user-avatar');
    const xpProgressBar = document.querySelector('.user-xp-progress');

    if (userNameElement) userNameElement.textContent = user.name;
    if (userLevelElement) userLevelElement.textContent = `Level ${user.level}`;
    if (avatarImg) avatarImg.src = user.avatar || 'default_avatar.png';

    if (xpProgressBar) {
        const currentLevelXP = LEVEL_THRESHOLDS[user.level - 1] || 0;
        const nextLevelXP = LEVEL_THRESHOLDS[user.level] || user.xp;
        const progress = ((user.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        xpProgressBar.style.width = `${progress}%`;
    }
}

function showEditProfileForm() {
    const modal = createModal('Edit Profile', `
        <form id="editProfileForm">
            <div class="form-group">
                <label for="userNameInput">Adventurer Name:</label>
                <input type="text" id="userNameInput" value="${user.name}" required>
            </div>
            <div class="form-group">
                <label for="userAvatar">Avatar URL:</label>
                <input type="text" id="userAvatar" value="${user.avatar || ''}">
            </div>
            <button type="submit" class="action-btn">Update Profile</button>
        </form>
    `);

    document.getElementById('editProfileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        user.name = document.getElementById('userNameInput').value;
        user.avatar = document.getElementById('userAvatar').value || 'default_avatar.png';
        saveToLocalStorage();
        updateUserInfoDisplay();
        closeModal(modal);
        loadSection('overview');
    });
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('skills', JSON.stringify(skills));
        localStorage.setItem('activities', JSON.stringify(activities));
        localStorage.setItem('quests', JSON.stringify(quests));
        localStorage.setItem('rewards', JSON.stringify(rewards));
        console.log('Data saved to local storage successfully');
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if (savedUser) {
            user = {...user, ...savedUser};
        }
        skills = JSON.parse(localStorage.getItem('skills')) || {};
        activities = JSON.parse(localStorage.getItem('activities')) || [];
        quests = JSON.parse(localStorage.getItem('quests')) || [];
        rewards = JSON.parse(localStorage.getItem('rewards')) || [];

        updateUserInfoDisplay();
        console.log('Data loaded from local storage successfully');
    } catch (error) {
        console.error('Error loading from local storage:', error);
    }
}
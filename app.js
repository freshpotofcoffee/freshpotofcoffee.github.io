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
    avatar: 'default-avatar.webp',
    lastActivityDate: null,
    currentStreak: 0,
    longestStreak: 0
};
let scrollbars = {};


const XP_PER_LEVEL = 100;
const MAX_SKILL_LEVEL = 50;
const ACHIEVEMENTS = [
    { id: 'first_skill', name: 'Skill Starter', description: 'Create your first skill', check: () => Object.keys(skills).length >= 1 },
    { id: 'five_skills', name: 'Skill Collector', description: 'Create five skills', check: () => Object.keys(skills).length >= 5 },
    { id: 'first_activity', name: 'Go-Getter', description: 'Complete your first activity', check: () => activities.some(a => a.completed) },
    { id: 'level_5', name: 'Apprentice', description: 'Reach level 5', check: () => user.level >= 5 },
    { id: 'first_quest', name: 'Questor', description: 'Complete your first quest', check: () => quests.some(q => q.completed) },
];

const SKILL_ICONS = [
    'fa-book', 'fa-dumbbell', 'fa-brain', 'fa-paint-brush', 'fa-code', 
    'fa-music', 'fa-heart', 'fa-running', 'fa-utensils', 'fa-language',
    'fa-camera', 'fa-chess', 'fa-microscope', 'fa-hammer', 'fa-leaf'
];

function generateUniqueId() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

document.addEventListener("DOMContentLoaded", function() {
    loadFromLocalStorage();
    initializeDashboard();
    updateUserInfoDisplay(); 

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettingsMenu);
    } else {
        console.error('Settings button not found');
    }

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const navButtons = document.querySelectorAll('.nav-btn');

    sidebarToggle.addEventListener('click', toggleSidebar);

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            loadSection(button.dataset.section);
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });

    function toggleSidebar() {
        sidebar.classList.toggle('sidebar-open');
        if (sidebar.classList.contains('sidebar-open')) {
            sidebar.style.transform = 'translateX(0)';
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        } else {
            sidebar.style.transform = 'translateX(-100%)';
            document.body.style.overflow = ''; // Restore scrolling when menu is closed
        }
    }
});

document.addEventListener('click', function(event) {
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnToggleButton = event.target === sidebarToggle;
    
    if (!isClickInsideSidebar && !isClickOnToggleButton && sidebar.classList.contains('sidebar-open')) {
        toggleSidebar();
    }
});

sidebar.addEventListener('click', function(event) {
    event.stopPropagation();
});

function showSettingsMenu() {
    const settingsMenu = createModal('Settings', `
        <ul class="settings-menu">
            <li><button id="editProfileBtn" class="settings-option">Edit Profile</button></li>
            <li><button id="changePasswordBtn" class="settings-option">Change Password</button></li>
            <li><button id="privacySettingsBtn" class="settings-option">Privacy Settings</button></li>
            <li><button id="debugOptionsBtn" class="settings-option">Debug Options</button></li>
        </ul>
    `);

    document.getElementById('editProfileBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        showEditProfileForm();
    });

    document.getElementById('debugOptionsBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        showDebugOptions();
    });

    // Add other settings options functionality here
}

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
    if (!mainContent) {
        console.error('Main content element not found');
        return;
    }
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
        default:
            console.error('Unknown section:', sectionName);
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionName);
    });
}

function loadOverviewSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    const nextLevelXP = xpForNextLevel(user.level);
    const currentLevelXP = nextLevelXP - XP_PER_LEVEL;
    const xpProgress = ((user.xp - currentLevelXP) / XP_PER_LEVEL) * 100;
    const masteredSkillsCount = Object.values(skills).filter(s => s.level >= MAX_SKILL_LEVEL).length;
    const totalSkills = Object.keys(skills).length;
    const completedQuests = quests.filter(q => q.completed).length;
    const totalQuests = quests.length;
    const recentActivities = activities
        .sort((a, b) => b.lastUpdated - a.lastUpdated)
        .slice(0, 5);

    const topSkills = Object.entries(skills)
        .sort((a, b) => b[1].level - a[1].level)
        .slice(0, 3);

    const topSkillsLimit = 3;
    const recentActivitiesLimit = 5;
    const activeQuestsLimit = 3;

    const topSkillsHtml = topSkills.map(([id, data]) => `
    <div class="skill-entry">
        <div class="skill-icon"><i class="fas ${data.icon}"></i></div>
        <div class="skill-details">
            <div class="skill-name">${data.name}</div>
            <div class="skill-level">Level ${data.level}</div>
            <div class="skill-bar-wrapper">
                <div class="skill-bar" style="width: ${(data.level / MAX_SKILL_LEVEL) * 100}%"></div>
            </div>
            <div class="skill-xp">${data.xp} / ${XP_PER_LEVEL} XP</div>
        </div>
    </div>
`).join('');


mainContent.innerHTML = `
<div class="dashboard">
    <div class="hero-section">
        <div class="hero-content">
            <div class="user-info">
                <div class="avatar-frame">
                    <img src="${user.avatar || 'default-avatar.webp'}" alt="User Avatar" class="user-avatar" id="userAvatar">
                </div>
                <div class="user-details">
                    <h2 id="userName">${user.name}</h2>
                    <div class="user-level">
                        <span id="userLevel">Level ${user.level}</span>
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="xp-bar">
                        <div class="xp-fill" id="xpFill" style="width: ${xpProgress}%"></div>
                    </div>
                    <p id="xpInfo">${user.xp - currentLevelXP} / ${XP_PER_LEVEL} XP to next level</p>
                    <div id="streakInfo" class="streak-info">
                        <span class="current-streak"><i class="fas fa-fire"></i> Current: ${user.currentStreak} days</span>
                        <span class="longest-streak"><i class="fas fa-trophy"></i> Longest: ${user.longestStreak} days</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

            <div class="stats-overview">
                <div class="stat-card">
                    <i class="fas fa-book-open"></i>
                    <h3>Skills Mastered</h3>
                    <p>${masteredSkillsCount} / ${totalSkills}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${totalSkills > 0 ? (masteredSkillsCount / totalSkills) * 100 : 0}%"></div>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-map-marked-alt"></i>
                    <h3>Quests Completed</h3>
                    <p>${completedQuests} / ${totalQuests}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0}%"></div>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-trophy"></i>
                    <h3>Achievements</h3>
                    <p>${user.achievements.length} / ${ACHIEVEMENTS.length}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(user.achievements.length / ACHIEVEMENTS.length) * 100}%"></div>
                    </div>
                </div>
            </div>


            <div class="dashboard-grid">
                <div class="dashboard-card top-skills">
                    <h3>Top Skills</h3>
                    <div class="card-content">
                        ${topSkills.map(([id, data]) => `
                            <div class="skill-entry">
                                <div class="skill-icon"><i class="fas ${data.icon}"></i></div>
                                <div class="skill-details">
                                    <div class="skill-name">${data.name}</div>
                                    <div class="skill-level">Level ${data.level}</div>
                                    <div class="skill-bar-wrapper">
                                        <div class="skill-bar" style="width: ${(data.level / MAX_SKILL_LEVEL) * 100}%"></div>
                                    </div>
                                    <div class="skill-xp">${data.xp} / ${XP_PER_LEVEL} XP</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ${Object.keys(skills).length > 3 ? '<a href="#" class="see-more">View all skills</a>' : ''}
                </div>

                <div class="dashboard-card activity-log">
                    <h3>Activity Log</h3>
                    <div class="card-content">
                        ${recentActivities.length > 0 ? `
                            <table class="activity-table">
                                <thead>
                                    <tr>
                                        <th>Activity</th>
                                        <th>Skill</th>
                                        <th>XP</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${recentActivities.map(activity => `
                                        <tr>
                                            <td>${activity.name}</td>
                                            <td>${skills[activity.skillId]?.name || 'Unknown Skill'}</td>
                                            <td>${activity.xp} XP</td>
                                            <td>${activity.completed ? '<span class="status completed">Completed</span>' : '<span class="status todo">To-Do</span>'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p class="no-activities">No recent activities</p>'}
                    </div>
                    ${activities.length > 5 ? '<a href="#" class="see-more">View all activities</a>' : ''}
                </div>

                <div class="dashboard-card active-quests">
                <h3>Active Quests</h3>
                <div class="card-content">
                    ${quests.filter(q => !q.completed).slice(0, 3).map(quest => {
                        const completedActivities = quest.activities.filter(a => activities.find(act => act.id === a && act.completed)).length;
                        const totalActivities = quest.activities.length;
                        const progressPercentage = (completedActivities / totalActivities) * 100;
                        
                        return `
                            <div class="quest-entry">
                                <div class="quest-name">${quest.name}</div>
                                <div class="quest-description">${quest.description}</div>
                                <div class="quest-progress">
                                    <span>${completedActivities}/${totalActivities}</span>
                                    <div class="quest-progress-bar">
                                        <div class="quest-progress-fill" style="width: ${progressPercentage}%"></div>
                                    </div>
                                    <span>${progressPercentage.toFixed(0)}%</span>
                                </div>
                            </div>
                        `;
                    }).join('') || '<p class="no-quests">No active quests</p>'}
                </div>
                ${quests.filter(q => !q.completed).length > 3 ? '<a href="#" class="see-more">View all quests</a>' : ''}
            </div>
        </div>
    </div>
`;

const seeMoreLinks = mainContent.querySelectorAll('.see-more');
seeMoreLinks[0]?.addEventListener('click', () => loadSection('skills'));
seeMoreLinks[1]?.addEventListener('click', () => loadSection('activities'));
seeMoreLinks[2]?.addEventListener('click', () => loadSection('quests'));
}

function calculateLevel(xp) {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function xpForNextLevel(level) {
    return level * XP_PER_LEVEL;
}

function openModal(modal) {
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

function loadSkillsSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="section-header">
            <h2>Your Skills</h2>
            <button id="addSkillBtn" class="action-btn">Add New Skill</button>
        </div>
        <div id="skillsList"></div>
    `;

    document.getElementById('addSkillBtn')?.addEventListener('click', showAddSkillForm);
    updateSkillsList();
}

function updateSkillsList() {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;

    if (Object.keys(skills).length === 0) {
        skillsList.innerHTML = '<p>You haven\'t added any skills yet. Click "Add New Skill" to get started!</p>';
        return;
    }

    // Sort skills alphabetically
    const sortedSkills = Object.entries(skills).sort((a, b) => a[1].name.localeCompare(b[1].name));

    const html = `
        <div class="skill-group">
            <div class="grid-list">
                ${sortedSkills.map(([id, skill]) => `
                    <div class="grid-item" id="skill-${id}">
                        <div class="item-content">
                            <div class="skill-header">
                                <i class="fas ${skill.icon || 'fa-question'} skill-icon"></i>
                                <h3>${skill.name || 'Unnamed Skill'}</h3>
                            </div>
                            <p>Level ${skill.level || 1}</p>
                            <div class="skill-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${((skill.xp || 0) / XP_PER_LEVEL) * 100}%"></div>
                                </div>
                                <p>${skill.xp || 0} / ${XP_PER_LEVEL} XP</p>
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="edit-btn" data-skill="${id}">Edit</button>
                            <button class="delete-btn" data-skill="${id}">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    skillsList.innerHTML = html;

    skillsList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditSkillForm(btn.dataset.skill));
    });

    skillsList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteSkill(btn.dataset.skill));
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
                <label for="skillIcon">Skill Icon:</label>
                <select id="skillIcon" required>
                    ${SKILL_ICONS.map(icon => `<option value="${icon}"><i class="fas ${icon}"></i> ${icon.replace('fa-', '')}</option>`).join('')}
                </select>
            </div>
            <button type="submit" class="action-btn">Add Skill</button>
        </form>
    `);

    document.getElementById('addSkillForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const skillName = document.getElementById('skillName').value.trim();
        const icon = document.getElementById('skillIcon').value;
        
        if (!skillName) {
            alert('Please enter a skill name.');
            return;
        }

        // Fix: Check if the skill object exists before accessing its name property
        if (Object.values(skills).some(skill => skill && skill.name && skill.name.toLowerCase() === skillName.toLowerCase())) {
            alert('Skill already exists!');
            return;
        }

        const skillId = generateUniqueId();
        skills[skillId] = { id: skillId, name: skillName, xp: 0, level: 1, icon: icon };
        saveToLocalStorage();
        closeModal(modal);
        loadSection('skills');
        addXP(10); // Award XP for creating a new skill
    });
}

function showEditSkillForm(skillId) {
    const skill = skills[skillId];
    if (!skill) return;

    const modal = createModal('Edit Skill', `
        <form id="editSkillForm">
            <input type="hidden" id="editSkillId" value="${skillId}">
            <div class="form-group">
                <label for="editSkillName">Skill Name:</label>
                <input type="text" id="editSkillName" value="${skill.name}" required>
            </div>
            <div class="form-group">
                <label for="editSkillIcon">Skill Icon:</label>
                <select id="editSkillIcon" required>
                    ${SKILL_ICONS.map(icon => `<option value="${icon}" ${skill.icon === icon ? 'selected' : ''}><i class="fas ${icon}"></i> ${icon.replace('fa-', '')}</option>`).join('')}
                </select>
            </div>
            <button type="submit" class="action-btn">Update Skill</button>
        </form>
    `);

    document.getElementById('editSkillForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const skillId = document.getElementById('editSkillId').value;
        const skillName = document.getElementById('editSkillName').value.trim();
        const icon = document.getElementById('editSkillIcon').value;
        
        if (!skillName) {
            alert('Please enter a skill name.');
            return;
        }

        if (Object.values(skills).some(s => s && s.id !== skillId && s.name && s.name.toLowerCase() === skillName.toLowerCase())) {
            alert('A skill with this name already exists!');
            return;
        }

        skills[skillId].name = skillName;
        skills[skillId].icon = icon;
        saveToLocalStorage();
        closeModal(modal);
        loadSection('skills');
    });
}

function deleteSkill(skillId) {
    if (confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
        delete skills[skillId];
        activities = activities.filter(a => a.skillId !== skillId);
        saveToLocalStorage();
        loadSection('skills');
    }
}

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

    // Group activities by skill
    const groupedActivities = {};
    activities.forEach(activity => {
        const skillId = activity.skillId;
        if (!groupedActivities[skillId]) {
            groupedActivities[skillId] = [];
        }
        groupedActivities[skillId].push(activity);
    });

    // Sort skills alphabetically
    const sortedSkills = Object.keys(groupedActivities).sort((a, b) => {
        return skills[a].name.localeCompare(skills[b].name);
    });

    // Generate HTML for each skill group
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

    // Add event listeners
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
        saveToLocalStorage();
        closeModal(modal);
        loadSection('activities');
        addXP(5); // Award XP for creating a new activity
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
            saveToLocalStorage();
            closeModal(modal);
            loadSection('activities');
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

        // Remove the activity from any quests that include it
        quests.forEach(quest => {
            const initialQuestActivities = quest.activities.length;
            quest.activities = quest.activities.filter(id => id !== activityId);
            if (initialQuestActivities !== quest.activities.length) {
                console.log('Removed activity from quest:', quest.id);
            }
        });

        saveToLocalStorage();
        updateActivitiesList();
        updateQuestsList(); // Update quests in case any were affected
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

    // Check if any quests are completed
    checkQuestsCompletion();

    updateStreak();
    saveToLocalStorage();
    updateActivitiesList();
    updateUserInfoDisplay();
}

function updateStreak() {
    const today = new Date().toDateString();
    if (user.lastActivityDate === today) {
        return; // Already completed an activity today
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

    // Award bonus XP for streaks
    if (user.currentStreak % 7 === 0) {
        addXP(50);
        alert(`Congratulations! You've maintained a ${user.currentStreak}-day streak! Bonus 50 XP awarded!`);
    } else if (user.currentStreak % 3 === 0) {
        addXP(20);
        alert(`Great job! You've maintained a ${user.currentStreak}-day streak! Bonus 20 XP awarded!`);
    }
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
        alert('You need to complete all activities in this quest before claiming the reward.');
        return;
    }

    quest.completed = true;
    
    addXP(50);

    if (quest.reward) {
        alert(`Congratulations! You've completed the quest "${quest.name}" and earned the reward: ${quest.reward}`);
    } else {
        alert(`Congratulations! You've completed the quest "${quest.name}"`);
    }

    saveToLocalStorage();
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
            alert('Please fill in all required fields.');
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
        saveToLocalStorage();
        closeModal(modal);
        loadSection('quests');
        addXP(15); // Award XP for creating a new quest
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
            alert('Please fill in all required fields.');
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
            saveToLocalStorage();
            closeModal(modal);
            loadSection('quests');
        }
    });
}

function deleteQuest(questId) {
    if (confirm('Are you sure you want to delete this quest? This action cannot be undone.')) {
        quests = quests.filter(q => q.id !== questId);
        saveToLocalStorage();
        loadSection('quests');
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
        alert(`Congratulations! You've completed the quest "${quest.name}" and earned the reward: ${quest.reward}`);
    } else {
        alert(`Congratulations! You've completed the quest "${quest.name}"`);
    }

    saveToLocalStorage();
    updateQuestsList();
    updateUserInfoDisplay();
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

    saveToLocalStorage();
}

function updateRewardsList() {
    updateAchievementsList();
    updateMilestonesList();
}

function updateAchievementsList() {
    const achievementsList = document.getElementById('achievementsList');
    if (!achievementsList) return;

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
                            ? ''  // Remove the "Claimed" text
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
        saveToLocalStorage();
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
        saveToLocalStorage();
        updateRewardsList();
        updateUserInfoDisplay();
    } else {
        alert(`You haven't reached the required level to claim this reward yet.`);
    }
}

function addXP(amount) {
    const oldLevel = user.level;
    user.xp += amount;
    user.level = calculateLevel(user.xp);
    
    if (user.level > oldLevel) {
        alert(`Congratulations! You've reached level ${user.level}!`);
    }
    
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
    const userNameElement = document.getElementById('userName');
    const userLevelElement = document.getElementById('userLevel');
    const avatarImg = document.getElementById('userAvatar');
    const xpFill = document.getElementById('xpFill');
    const xpInfo = document.getElementById('xpInfo');

    if (userNameElement) userNameElement.textContent = user.name;
    if (userLevelElement) userLevelElement.textContent = 'Level ' + user.level;
    
    if (avatarImg) {
        avatarImg.src = user.avatar || 'default-avatar.webp';
        avatarImg.onerror = function() {
            this.src = 'default-avatar.webp';
        };
    }
    
    const nextLevelXP = xpForNextLevel(user.level);
    const currentLevelXP = nextLevelXP - XP_PER_LEVEL;
    const xpProgress = ((user.xp - currentLevelXP) / XP_PER_LEVEL) * 100;
    
    if (xpFill) {
        xpFill.style.width = xpProgress + '%';
    }
    
    if (xpInfo) {
        xpInfo.textContent = `${user.xp - currentLevelXP} / ${XP_PER_LEVEL} XP to next level`;
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
    modal.style.display = 'block';

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
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

function saveToLocalStorage() {
    try {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('skills', JSON.stringify(skills));
        localStorage.setItem('activities', JSON.stringify(activities));
        localStorage.setItem('quests', JSON.stringify(quests));
        localStorage.setItem('rewards', JSON.stringify(rewards));
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
    } catch (error) {
        console.error('Error loading from local storage:', error);
    }
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
                <input type="text" id="editUserAvatar" value="${user.avatar || ''}">
            </div>
            <button type="submit" class="action-btn">Update Profile</button>
        </form>
    `);

    document.getElementById('editProfileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        user.name = document.getElementById('editUserName').value.trim();
        user.avatar = document.getElementById('editUserAvatar').value.trim();
        saveToLocalStorage();
        closeModal(modal);
        updateUserInfoDisplay();
    });
}

function showDebugOptions() {
    const debugModal = createModal('Debug Options', `
        <div class="debug-options">
            <h3>Purge Data</h3>
            <button id="purgeAllBtn" class="action-btn">Purge All Data</button>
            <button id="purgeSkillsBtn" class="action-btn">Purge Skills</button>
            <button id="purgeActivitiesBtn" class="action-btn">Purge Activities</button>
            <button id="purgeQuestsBtn" class="action-btn">Purge Quests</button>
            <button id="purgeRewardsBtn" class="action-btn">Purge Rewards</button>
        </div>
    `);

    document.getElementById('purgeAllBtn').addEventListener('click', () => purgeData('all'));
    document.getElementById('purgeSkillsBtn').addEventListener('click', () => purgeData('skills'));
    document.getElementById('purgeActivitiesBtn').addEventListener('click', () => purgeData('activities'));
    document.getElementById('purgeQuestsBtn').addEventListener('click', () => purgeData('quests'));
    document.getElementById('purgeRewardsBtn').addEventListener('click', () => purgeData('rewards'));
}

function purgeData(dataType) {
    if (!confirm(`Are you sure you want to purge ${dataType}? This action cannot be undone.`)) {
        return;
    }

    switch(dataType) {
        case 'all':
            skills = {};
            activities = [];
            quests = [];
            rewards = [];
            user = {
                name: "Adventurer",
                xp: 0,
                level: 1,
                achievements: [],
                avatar: 'default-avatar.webp'
            };
            break;
        case 'skills':
            skills = {};
            break;
        case 'activities':
            activities = [];
            break;
        case 'quests':
            quests = [];
            break;
        case 'rewards':
            rewards = [];
            break;
    }

    saveToLocalStorage();
    alert(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} have been purged.`);
    
    // Refresh the current section
    const currentSection = document.querySelector('.nav-btn.active').dataset.section;
    loadSection(currentSection);
    
    // Update user info if 'all' was purged
    if (dataType === 'all') {
        updateUserInfoDisplay();
    }
}
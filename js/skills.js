// skills.js

import { skills, activities, quests } from './main.js';
import { saveData } from './data.js';
import { createModal, closeModal } from './ui.js';
import { generateUniqueId, XP_PER_LEVEL } from './utils.js';
import { addXP, checkAchievements } from './rewards.js';
import { showNotification } from './notifications.js';
import { updateActivitiesList } from './activities.js';
import { updateQuestsList } from './quests.js';
import { updateDashboard } from './overview.js';



const SKILL_ICONS = [
    'fa-book', 'fa-dumbbell', 'fa-brain', 'fa-paint-brush', 'fa-code', 
    'fa-music', 'fa-heart', 'fa-running', 'fa-utensils', 'fa-language',
    'fa-camera', 'fa-chess', 'fa-microscope', 'fa-hammer', 'fa-leaf'
];

function loadSkillsSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="section-header">
            <h2>Your Skills</h2>
            <button id="addSkillBtn" class="primary-action-btn">Learn a New Skill</button>
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
            <button type="submit" class="primary-action-btn">Add Skill</button>
        </form>
    `);

    document.getElementById('addSkillForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const skillName = document.getElementById('skillName').value.trim();
        const icon = document.getElementById('skillIcon').value;
        
        if (!skillName) {
            showNotification('Please enter a skill name.');
            return;
        }

        if (Object.values(skills).some(skill => skill && skill.name && skill.name.toLowerCase() === skillName.toLowerCase())) {
            showNotification('Skill already exists!');
            return;
        }

        const skillId = generateUniqueId();
        skills[skillId] = { id: skillId, name: skillName, xp: 0, level: 1, icon: icon };
        
        saveData();
        updateSkillsList();
        addXP(10);
        checkAchievements();
        closeModal(modal);
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
            <button type="submit" class="primary-action-btn">Update Skill</button>
        </form>
        `);

    document.getElementById('editSkillForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const skillId = document.getElementById('editSkillId').value;
        const skillName = document.getElementById('editSkillName').value.trim();
        const icon = document.getElementById('editSkillIcon').value;
        
        if (!skillName) {
            showNotification('Please enter a skill name.');
            return;
        }

        if (Object.values(skills).some(s => s && s.id !== skillId && s.name && s.name.toLowerCase() === skillName.toLowerCase())) {
            showNotification('A skill with this name already exists!');
            return;
        }

        skills[skillId].name = skillName;
        skills[skillId].icon = icon;
        closeModal(modal);
        loadSkillsSection();
        saveData();
    });
}

function deleteSkill(skillId) {
    if (confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
        // Remove the skill from the skills object
        delete skills[skillId];

        // Remove activities associated with this skill
        const activitiesToRemove = activities.filter(activity => activity.skillId === skillId);
        activitiesToRemove.forEach(activity => {
            const index = activities.findIndex(a => a.id === activity.id);
            if (index !== -1) {
                activities.splice(index, 1);
            }
        });

        // Update quests that might reference activities of this skill
        quests.forEach(quest => {
            quest.activities = quest.activities.filter(activityId => {
                const activity = activities.find(a => a.id === activityId);
                return            });
        });

        saveData();
        updateSkillsList();
        updateActivitiesList();        
        updateQuestsList();
    }
}

export { loadSkillsSection, updateSkillsList, showAddSkillForm, showEditSkillForm, deleteSkill };
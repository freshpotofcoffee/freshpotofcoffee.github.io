import { loadOverviewSection } from './overview.js';
import { loadSkillsSection } from './skills.js';
import { loadActivitiesSection } from './activities.js';
import { loadQuestsSection } from './quests.js';
import { loadRewardsSection } from './rewards.js';
import { loadHowToUseSection } from './howToUse.js';

export function loadSection(sectionName) {
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
        case 'howToUse':
            loadHowToUseSection();
            break;
        default:
            console.error('Unknown section:', sectionName);
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionName);
    });
}
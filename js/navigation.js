import { loadOverviewSection } from './overview.js';
import { loadSkillsSection } from './skills.js';
import { loadActivitiesSection } from './activities.js';
import { loadQuestsSection } from './quests.js';
import { loadRewardsSection } from './rewards.js';
import { loadHowToUseSection } from './howToUse.js';

export function loadSection(sectionName) {
    console.log(`Loading section: ${sectionName}`);
    if (!sectionName) {
        console.error('Invalid section name:', sectionName);
        return;
    }
    
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
            return; // Exit the function if the section is unknown
    }

    // Update active states for both desktop and mobile menus
    document.querySelectorAll('.nav-link, .mobile-nav-link, .drawer-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-section') === sectionName);
    });

    // Dispatch the custom event
    window.dispatchEvent(new CustomEvent('sectionloaded', { detail: { section: sectionName } }));
}
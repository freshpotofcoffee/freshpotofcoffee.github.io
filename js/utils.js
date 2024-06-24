// utils.js

export const XP_PER_LEVEL = 100;
export const MAX_SKILL_LEVEL = 50;

export function generateUniqueId() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function createDefaultUser() {
    return {
        name: "Adventurer",
        xp: 0,
        level: 1,
        achievements: [],
        avatar: '../images/default-avatar.webp',
        lastActivityDate: null,
        currentStreak: 0,
        longestStreak: 0
    };
}

export function calculateLevel(xp) {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpForNextLevel(level) {
    return level * XP_PER_LEVEL;
}
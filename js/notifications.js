// notifications.js

import { saveData } from './data.js';
import { user } from './main.js';

export function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('Notification container not found');
        return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    container.appendChild(notification);
    
    // Trigger reflow
    notification.offsetHeight;
    
    notification.classList.add('show');
    
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            closeNotification(notification);
        });
    }
    
    setTimeout(() => {
        closeNotification(notification);
    }, duration);

    // Add to notification history
    addToNotificationHistory(message, type);
}

function closeNotification(notification) {
    notification.classList.remove('show');
    notification.addEventListener('transitionend', () => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}

function addToNotificationHistory(message, type) {
    if (!user.notificationHistory) {
        user.notificationHistory = [];
    }
    user.notificationHistory.push({ message, type, timestamp: new Date().toISOString() });
    // Keep only the last 50 notifications
    if (user.notificationHistory.length > 50) {
        user.notificationHistory.shift();
    }
    saveData();
}

export function getNotificationHistory() {
    return user.notificationHistory || [];
}

export function clearNotificationHistory() {
    user.notificationHistory = [];
    saveData();
}
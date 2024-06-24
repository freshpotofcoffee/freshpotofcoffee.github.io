// Global variables
let skills = {};
let activities = [];
let quests = [];
let rewards = [];
let user = createDefaultUser();
let scrollbars = {};

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyC4Bvfckp0t73HbLMmVF9exusaagGgSLOw",
    authDomain: "habit-adventure-3c33a.firebaseapp.com",
    projectId: "habit-adventure-3c33a",
    storageBucket: "habit-adventure-3c33a.appspot.com",
    messagingSenderId: "867216530393",
    appId: "1:867216530393:web:091c437f5b19796562d7c8",
    measurementId: "G-EJXWRH8SPP"
};
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
        console.log('The current browser does not support all of the features required to enable persistence');
    }
});
  

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

document.getElementById('helpBtn').addEventListener('click', startWalkthrough);

document.addEventListener("DOMContentLoaded", function() {
    loadFromLocalStorage();
    initializeDashboard();
    updateUserInfoDisplay();

    auth.onAuthStateChanged((currentUser) => {
        if (currentUser) {
            console.log("User is signed in");
            loadUserData(currentUser.uid);
        } else {
            console.log("No user signed in");
            // Redirect to login page or show login modal
            showLoginPrompt();
        }
    });

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettingsMenu);
    } else {
        console.error('Settings button not found');
    }

    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    } else {
        console.error('Home button not found');
    }

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const navButtons = document.querySelectorAll('.nav-btn');

    function toggleSidebar() {
        sidebar.classList.toggle('sidebar-open');
        if (sidebar.classList.contains('sidebar-open')) {
            openSidebar();
        } else {
            closeSidebar();
        }
    }

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', toggleSidebar);

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
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            loadSection(button.dataset.section);
            if (window.innerWidth <= 768 && sidebar) {
                toggleSidebar();
            }
        });
    });
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');

    if (signInBtn) signInBtn.addEventListener('click', signIn);
    if (signOutBtn) signOutBtn.addEventListener('click', userSignOut);

    if (!localStorage.getItem('tutorialCompleted')) {
        showWelcomeModal();
    }
});

function showLoginPrompt() {
    const loginPrompt = createModal('Login Required', `
        <p>You need to be logged in to use this app.</p>
        <button id="loginBtn" class="action-btn">Log In</button>
    `);

    document.getElementById('loginBtn').addEventListener('click', () => {
        closeModal(loginPrompt);
        signIn();
    });
}

function checkAndStartTutorial() {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (tutorialCompleted !== 'true') {
        startWalkthrough();
    }
}

function createDefaultUser() {
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

function signIn() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("User signed in:", result.user);
            loadUserData(result.user.uid);
        }).catch((error) => {
            console.error("Error during sign in:", error);
        });
}

// Sign Out function
function userSignOut() {
    signOut(auth).then(() => {
        console.log("User signed out");
        // Clear all data
        user = createDefaultUser();
        skills = {};
        activities = [];
        quests = [];
        rewards = [];

        updateUserInfoDisplay();
        updateMiniProfile();
        loadSection('overview');
    }).catch((error) => {
        console.error("Error during sign out:", error);
    });
}

// Load User Data function
async function loadUserData(userId) {
    if (!userId) {
        console.error("No user ID provided");
        return;
    }
    try {
        const docSnap = await getDoc(doc(db, 'users', userId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            user = data.user || createDefaultUser();
            skills = data.skills || {};
            activities = data.activities || [];
            quests = data.quests || [];
            rewards = data.rewards || [];
        } else {
            console.log("No user data found in Firebase, creating new profile");
            user = createDefaultUser();
            skills = {};
            activities = [];
            quests = [];
            rewards = [];
            await saveUserData(userId);
        }
        
        updateUserInfoDisplay();
        updateMiniProfile();
        loadSection('overview');
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

function saveData() {
    if (auth.currentUser) {
        saveUserData(auth.currentUser.uid);
    } else {
        console.log("User not logged in. Data not saved.");
    }
}

// Save User Data function
async function saveUserData(userId) {
    if (!userId) {
        console.error("No user ID provided");
        return Promise.reject("No user ID provided");
    }
    try {
        await setDoc(doc(db, 'users', userId), {
            name: user.name,
            xp: user.xp,
            level: user.level,
            achievements: user.achievements,
            avatar: user.avatar,
            lastActivityDate: user.lastActivityDate,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            skills: skills,
            activities: activities,
            quests: quests,
            rewards: rewards
        });
        console.log("User data saved successfully");
        updateMiniProfile();
        return Promise.resolve();
    } catch (error) {
        console.error("Error saving user data:", error);
        return Promise.reject(error);
    }
}

  function subscribeToUserData(userId) {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        user = {
          name: data.name,
          xp: data.xp,
          level: data.level,
          achievements: data.achievements,
          avatar: data.avatar,
          lastActivityDate: data.lastActivityDate,
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak
        };
        skills = data.skills || {};
        activities = data.activities || [];
        quests = data.quests || [];
        rewards = data.rewards || [];
        updateUserInfoDisplay();
        loadSection('overview');
      }
    });
  }

function showWelcomeModal() {
    const modalContent = `
        <div class="welcome-modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Welcome to Habit Adventure</h2>
                <p>Embark on your personal development journey with Skill Quest. Here's how to get started:</p>
                <ol>
                    <li>Add skills you want to improve</li>
                    <li>Create activities to practice those skills</li>
                    <li>Complete quests to challenge yourself</li>
                    <li>Track your progress and earn achievements</li>
                </ol>
                <button id="startTutorial" class="action-btn">Start Tutorial</button>
            </div>
        </div>
    `;

    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalContent;
    document.body.appendChild(modalElement);

    const modal = modalElement.querySelector('.welcome-modal');
    const closeBtn = modal.querySelector('.close');
    const startTutorialBtn = modal.querySelector('#startTutorial');

    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modalElement);
    });

    startTutorialBtn.addEventListener('click', () => {
        document.body.removeChild(modalElement);
        startWalkthrough();
    });

    modal.style.display = 'flex';
}

function startWalkthrough() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        startMobileTutorial();
    } else {
        startDesktopTutorial();
    }

    // Set the tutorial as completed
    localStorage.setItem('tutorialCompleted', 'true');
}

function startMobileTutorial() {
    const tutorialSteps = [
        { title: "Welcome to Habit Adventure", description: "Let's walk through the main features of the app." },
        { title: "Character Sheet", description: "View your progress and recent activities." },
        { title: "Skills", description: "Add and manage your skills." },
        { title: "Activities", description: "Create and complete activities to level up your skills." },
        { title: "Quests", description: "Take on larger challenges with quests." },
        { title: "Rewards", description: "Track your achievements and milestones." }
    ];

    let currentStep = 0;
    const overlay = document.getElementById('tutorialOverlay');
    const title = document.getElementById('tutorialTitle');
    const description = document.getElementById('tutorialDescription');
    const nextButton = document.getElementById('tutorialNext');

    function showStep() {
        if (currentStep < tutorialSteps.length) {
            overlay.style.display = 'block';
            title.textContent = tutorialSteps[currentStep].title;
            description.textContent = tutorialSteps[currentStep].description;
            nextButton.textContent = currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next';
        } else {
            overlay.style.display = 'none';
            localStorage.setItem('tutorialCompleted', 'true');
        }
    }

    nextButton.addEventListener('click', () => {
        currentStep++;
        showStep();
    });

    showStep();
}

function startDesktopTutorial() {
    const steps = [
        {
            element: '#userAvatar',
            intro: 'This is your character profile. Watch your level increase as you complete activities and quests!',
            position: 'bottom'
        },
        {
            element: '.xp-bar',
            intro: 'This bar shows your progress towards the next level. Complete activities to fill it up!',
            position: 'bottom'
        },
        {
            element: '.stats-overview',
            intro: 'These cards show your overall progress in different areas of Habit Adventure.',
            position: 'bottom'
        },
        {
            element: '.dashboard-card.top-skills',
            intro: 'Here you can see your top skills. Focus on these to level up faster!',
            position: 'left'
        },
        {
            element: '.dashboard-card.activity-log',
            intro: 'The activity log shows your recent actions. Keep it busy to make steady progress!',
            position: 'top'
        },
        {
            element: '.dashboard-card.active-quests',
            intro: 'These are your active quests. Complete them to earn bonus rewards!',
            position: 'right'
        },
        {
            element: '.nav-btn[data-section="overview"]',
            intro: 'The Character Sheet gives you an overview of your progress and recent activities.',
            position: 'right'
        },
        {
            element: '.nav-btn[data-section="skills"]',
            intro: 'Add and manage your skills here. Each skill represents an area you want to improve.',
            position: 'right'
        },
        {
            element: '.nav-btn[data-section="activities"]',
            intro: 'Create activities to practice your skills. Completing activities earns you XP and levels up your skills.',
            position: 'right'
        },
        {
            element: '.nav-btn[data-section="quests"]',
            intro: 'Take on quests to challenge yourself. Quests are collections of activities that provide larger goals and greater rewards.',
            position: 'right'
        },
        {
            element: '.nav-btn[data-section="rewards"]',
            intro: 'View your achievements and milestones here. Track your overall progress and celebrate your successes!',
            position: 'right'
        },
        {
            element: '.nav-btn[data-section="howToUse"]',
            intro: 'If you are ever wondering how to use Habit Adventure, check out this page to learn more.',
            position: 'right'
        },
        {
            element: '#settingsBtn',
            intro: 'Finally, go here to log in/out, edit your profile, or reset your data.',
            position: 'left'
        }
    ];

    const tour = introJs().setOptions({
        steps: steps,
        exitOnOverlayClick: false,
        exitOnEsc: false,
        disableInteraction: false,
        highlightClass: 'introjs-custom-highlight',
        tooltipClass: 'introjs-custom-tooltip',
        nextLabel: 'Next →',
        prevLabel: '← Back',
        doneLabel: 'Finish',
        skipLabel: '×',
        scrollToElement: true
    });

    tour.oncomplete(function() {
        localStorage.setItem('tutorialCompleted', 'true');
    });

    tour.onexit(function() {
        localStorage.setItem('tutorialCompleted', 'true');
    });

    tour.start();
}

function openSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebar) {
        sidebar.classList.add('sidebar-open');
        sidebar.style.transform = 'translateX(0)';
        sidebar.style.left = '0';
        if (sidebarToggle) {
            sidebarToggle.classList.add('active');
        }
    }
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebar) {
        sidebar.classList.remove('sidebar-open');
        sidebar.style.transform = 'translateX(-100%)';
        sidebar.style.left = '-100%';
        if (sidebarToggle) {
            sidebarToggle.classList.remove('active');
        }
    }
}

function isElementVisible(el) {
    return !!( el.offsetWidth || el.offsetHeight || el.getClientRects().length );
}

function showSettingsMenu() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        showLoginPrompt();
        return;
    }

    let content = `
        <div class="user-profile-summary">
            <img src="${user.avatar}" alt="Profile Picture" class="profile-pic">
            <p class="user-name">${user.name}</p>
            <p class="user-email">${currentUser.email}</p>
        </div>
        <ul class="settings-menu">
            <li><button id="editProfileBtn" class="settings-option">Edit Profile</button></li>
            <li><button id="exportDataBtn" class="settings-option">Export Data</button></li>
            <li><button id="importDataBtn" class="settings-option">Import Data</button></li>
            <li><button id="debugOptionsBtn" class="settings-option">Debug Options</button></li>
            <li><button id="signOutBtn" class="settings-option">Sign Out</button></li>
        </ul>
    `;

    const settingsMenu = createModal('Settings', content);

    // Add event listeners
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        showEditProfileForm();
    });
    document.getElementById('signOutBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        userSignOut();
    });
    document.getElementById('exportDataBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        exportData();
    });
    document.getElementById('importDataBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        importData();
    });
    document.getElementById('debugOptionsBtn').addEventListener('click', () => {
        closeModal(settingsMenu);
        showDebugOptions();
    });
}

function exportData() {
    const data = {
        user: user,
        skills: skills,
        activities: activities,
        quests: quests,
        rewards: rewards
    };

    const dataStr = JSON.stringify(data);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'habit_adventure_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');

        reader.onload = readerEvent => {
            const content = readerEvent.target.result;
            try {
                const parsedData = JSON.parse(content);
                
                // Replace existing data with imported data
                user = parsedData.user;
                skills = parsedData.skills;
                activities = parsedData.activities;
                quests = parsedData.quests;
                rewards = parsedData.rewards;

                // Save the imported data
                if (auth.currentUser) {
                    saveUserData(auth.currentUser.uid);
                } else {
                    saveToLocalStorage();
                }

                // Update the UI
                updateUserInfoDisplay();
                loadSection('overview');

                alert('Data imported successfully!');
            } catch (error) {
                console.error('Error parsing imported data:', error);
                alert('Error importing data. Please make sure the file is a valid JSON export from Habit Adventure.');
            }
        }
    }

    input.click();
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

    // Only load from local storage if user is not signed in
    if (!auth.currentUser) {
        loadFromLocalStorage();
    }

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

function updateMiniProfile() {
    const miniProfileElement = document.getElementById('userProfileMini');
    const currentUser = auth.currentUser;

    if (currentUser && user) {
        miniProfileElement.innerHTML = `
            <img src="${user.avatar}" alt="Profile Picture" class="mini-profile-pic">
            <span class="mini-profile-name">${user.name}</span>
        `;
    } else {
        miniProfileElement.innerHTML = `
            <span class="mini-profile-signin">Not signed in</span>
        `;
    }
}

function loadHowToUseSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="how-to-use">
            <h2>How to Use Habit Adventure</h2>
            <p class="intro">Welcome to Habit Adventure, your personal development companion. This guide will help you make the most of your journey to self-improvement.</p>
            
            <section class="how-to-section">
                <div class="section-icon"><i class="fas fa-book-open"></i></div>
                <h3>Skills</h3>
                <p>Skills are the core of your personal development journey in Habit Adventure.</p>
                <ul>
                    <li>Add skills you want to improve or learn</li>
                    <li>Each skill can be leveled up by completing related activities</li>
                    <li>Track your progress and watch your skills grow over time</li>
                </ul>
                <div class="tip">
                    <strong>Tip:</strong> Start with 3-5 skills you're most eager to develop. You can always add more later!
                </div>
            </section>

            <section class="how-to-section">
                <div class="section-icon"><i class="fas fa-tasks"></i></div>
                <h3>Activities</h3>
                <p>Activities are the building blocks of your skill development.</p>
                <ul>
                    <li>Create specific, actionable activities for each skill</li>
                    <li>Complete activities to gain XP and level up your skills</li>
                    <li>Set realistic XP values for each activity based on difficulty and time investment</li>
                </ul>
                <div class="tip">
                    <strong>Tip:</strong> Break down larger goals into smaller, manageable activities. This makes progress more achievable and rewarding!
                </div>
            </section>

            <section class="how-to-section">
                <div class="section-icon"><i class="fas fa-map-marked-alt"></i></div>
                <h3>Quests</h3>
                <p>Quests are collections of activities that provide larger challenges and greater rewards.</p>
                <ul>
                    <li>Create quests to set bigger goals for yourself</li>
                    <li>Assign relevant activities to each quest</li>
                    <li>Complete all activities in a quest to earn bonus XP and achievements</li>
                </ul>
                <div class="tip">
                    <strong>Tip:</strong> Use quests for long-term goals or projects. They're great for maintaining motivation over extended periods!
                </div>
            </section>

            <section class="how-to-section">
                <div class="section-icon"><i class="fas fa-trophy"></i></div>
                <h3>Milestones and Achievements</h3>
                <p>Track your progress and celebrate your successes!</p>
                <ul>
                    <li>Earn achievements by reaching specific milestones in your journey</li>
                    <li>Unlock new titles and badges as you progress</li>
                    <li>Use the milestones page to set and track personal goals</li>
                </ul>
                <div class="tip">
                    <strong>Tip:</strong> Don't forget to celebrate your achievements, no matter how small. Every step forward is progress!
                </div>
            </section>

            <section class="how-to-section">
                <div class="section-icon"><i class="fas fa-chart-line"></i></div>
                <h3>Best Practices</h3>
                <p>Make the most of Habit Adventure with these tips:</p>
                <ul>
                    <li>Update your progress regularly to stay motivated</li>
                    <li>Balance your focus across different skills</li>
                    <li>Revisit and adjust your goals periodically</li>
                    <li>Use the app daily to build a consistent habit of self-improvement</li>
                </ul>
            </section>
        </div>
    `;
}

function loadOverviewSection() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    if (!user) {
        user = createDefaultUser();
    }

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
                    <img src="${user.avatar || '../images/default-avatar.webp'}" alt="User Avatar" class="user-avatar" id="userAvatar">
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

        if (Object.values(skills).some(skill => skill && skill.name && skill.name.toLowerCase() === skillName.toLowerCase())) {
            alert('Skill already exists!');
            return;
        }

        const skillId = generateUniqueId();
        skills[skillId] = { id: skillId, name: skillName, xp: 0, level: 1, icon: icon };
        
        saveData();

        closeModal(modal);
        updateSkillsList();
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
        closeModal(modal);
        loadSection('skills');
        saveData();
    });
}

function deleteSkill(skillId) {
    if (confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
        delete skills[skillId];
        activities = activities.filter(a => a.skillId !== skillId);
        loadSection('skills');
        saveData();
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
        
        saveData();

        closeModal(modal);
        updateActivitiesList();
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
            saveData();
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

        updateActivitiesList();
        saveData();
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
    saveData();
    updateStreak();
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
    saveData();
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
        
        saveData();

        closeModal(modal);
        updateQuestsList();
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
            saveData();
            closeModal(modal);
            loadSection('quests');
        }
    });
}

function deleteQuest(questId) {
    if (confirm('Are you sure you want to delete this quest? This action cannot be undone.')) {
        quests = quests.filter(q => q.id !== questId);
        saveData();
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
    saveData();
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

    if (user) {
        if (userNameElement) userNameElement.textContent = user.name || "Adventurer";
        if (userLevelElement) userLevelElement.textContent = 'Level ' + (user.level || 1);
        
        if (avatarImg) {
            avatarImg.src = user.avatar || '../images/default-avatar.webp';
            avatarImg.onerror = function() {
                this.src = '../images/default-avatar.webp';
            };
        }
        
        const nextLevelXP = xpForNextLevel(user.level || 1);
        const currentLevelXP = nextLevelXP - XP_PER_LEVEL;
        const xpProgress = ((user.xp || 0) - currentLevelXP) / XP_PER_LEVEL * 100;
        
        if (xpFill) {
            xpFill.style.width = xpProgress + '%';
        }
        
        if (xpInfo) {
            xpInfo.textContent = `${(user.xp || 0) - currentLevelXP} / ${XP_PER_LEVEL} XP to next level`;
        }
    } else {
        // Handle case when user is null
        if (userNameElement) userNameElement.textContent = "Adventurer";
        if (userLevelElement) userLevelElement.textContent = 'Level 1';
        if (avatarImg) avatarImg.src = '../images/default-avatar.webp';
        if (xpFill) xpFill.style.width = '0%';
        if (xpInfo) xpInfo.textContent = '0 / 100 XP to next level';
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
        localStorage.setItem('localUser', JSON.stringify(user));
        localStorage.setItem('localSkills', JSON.stringify(skills));
        localStorage.setItem('localActivities', JSON.stringify(activities));
        localStorage.setItem('localQuests', JSON.stringify(quests));
        localStorage.setItem('localRewards', JSON.stringify(rewards));
        console.log('Data saved to local storage');
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedUser = JSON.parse(localStorage.getItem('localUser'));
        user = savedUser ? {...createDefaultUser(), ...savedUser} : createDefaultUser();
        skills = JSON.parse(localStorage.getItem('localSkills')) || {};
        activities = JSON.parse(localStorage.getItem('localActivities')) || [];
        quests = JSON.parse(localStorage.getItem('localQuests')) || [];
        rewards = JSON.parse(localStorage.getItem('localRewards')) || [];
        console.log('Data loaded from local storage');
    } catch (error) {
        console.error('Error loading from local storage:', error);
        user = createDefaultUser();
        skills = {};
        activities = [];
        quests = [];
        rewards = [];
    }
    updateUserInfoDisplay();
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
                <input type="text" id="editUserAvatar" value="${user.avatar}">
            </div>
            <button type="submit" class="action-btn">Update Profile</button>
        </form>
    `);

    document.getElementById('editProfileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        user.name = document.getElementById('editUserName').value.trim();
        const newAvatar = document.getElementById('editUserAvatar').value.trim();
        if (newAvatar) {
            user.avatar = newAvatar;
        }
        saveData();
        updateUserInfoDisplay();
        updateMiniProfile();
        closeModal(modal);
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

async function purgeData(dataType) {
    if (!confirm(`Are you sure you want to purge ${dataType}? This action cannot be undone.`)) {
        return;
    }

    const currentUser = auth.currentUser;

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
                avatar: '../images/default-avatar.webp',
                lastActivityDate: null,
                currentStreak: 0,
                longestStreak: 0
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

    // Update local storage
    saveToLocalStorage();

    // Update Firebase if user is logged in
    if (currentUser) {
        try {
            await saveData();
            console.log(`${dataType} data purged and synced with Firebase`);
        } catch (error) {
            console.error("Error syncing purged data with Firebase:", error);
        }
    }

    alert(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} have been purged.`);
    
    // Refresh the current section
    const currentSection = document.querySelector('.nav-btn.active').dataset.section;
    loadSection(currentSection);
    
    // Update user info if 'all' was purged
    if (dataType === 'all') {
        updateUserInfoDisplay();
        updateMiniProfile();
    }
}
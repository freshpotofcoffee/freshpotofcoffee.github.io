// tutorial.js

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

export { showWelcomeModal, startWalkthrough, startMobileTutorial, startDesktopTutorial };
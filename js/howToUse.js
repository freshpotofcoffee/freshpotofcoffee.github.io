// howToUse.js

export function loadHowToUseSection() {
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
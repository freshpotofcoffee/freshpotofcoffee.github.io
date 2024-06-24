document.addEventListener("DOMContentLoaded", function() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const navButtons = document.querySelectorAll('.nav-btn');

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
            const sectionId = button.dataset.section;
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
            if (window.innerWidth <= 768 && sidebar) {
                toggleSidebar();
            }
        });
    });

    function toggleSidebar() {
        sidebar.classList.toggle('sidebar-open');
    }
});
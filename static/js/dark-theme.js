export default function setDarkThemeToggler() {
    const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (prefersDarkTheme) {
        document.body.classList.add('dark-mode');
        const toggleButton = document.getElementById('toggle-theme');
        toggleButton.textContent = 'Светлая тема';
    }

    document.getElementById('toggle-theme').addEventListener('click', function() {
        const body = document.body;
        body.classList.toggle('dark-mode');
        const toggleButton = document.getElementById('toggle-theme');
        if (body.classList.contains('dark-mode')) {
            toggleButton.textContent = 'Светлая тема';
        } else {
            toggleButton.textContent = 'Темная тема';
        }
    });
}
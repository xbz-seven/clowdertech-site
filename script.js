document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const navbar = document.querySelector('.navbar');

    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        themeToggle.querySelector('.toggle-icon').style.transform = `rotate(${currentTheme === 'light' ? '180' : '0'}deg)`;
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (!item.id.includes('theme-toggle') && item.getAttribute('href') && !item.getAttribute('href').includes('team')) {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 100);
    });

    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, offset: 100, once: true });
    }

    document.querySelectorAll('.bottom-nav a[href^="../#"]').forEach(anchor => {
        anchor.addEventListener('click', function () {
            const href = this.getAttribute('href');
            if (href !== '#') window.location.href = href;
        });
    });

    const teamNavItem = document.querySelector('.nav-item[href="#team"]');
    if (teamNavItem) {
        teamNavItem.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/team';
        });
    }

    // Staff page logic — only runs if the staff grid exists
    const staffGrid = document.getElementById('staffGrid');
    if (!staffGrid) return;

    const ROLE_HIERARCHY = [
        { id: '1331034973536522291', label: 'Owner' },
        { id: '1485716681027223739', label: 'Admin' },
        { id: '1291142254836056064', label: 'Staff' },
    ];

    const STAFF_API = 'http://localhost:3001/api/staff';
    let allStaff = [];

    async function loadStaff() {
        try {
            const res = await fetch(STAFF_API);
            if (!res.ok) throw new Error('API error');
            const data = await res.json();

            allStaff = data
                .filter(m => !m.isBot)
                .map(m => {
                    const rankIndex = ROLE_HIERARCHY.findIndex(r => m.roles.includes(r.id));
                    return { ...m, rankIndex: rankIndex === -1 ? 999 : rankIndex };
                })
                .sort((a, b) => a.rankIndex - b.rankIndex);

            render();
        } catch {
            staffGrid.innerHTML = `<div class="staff-error">Failed to load staff members.</div>`;
        }
    }

    function getHighestRole(member) {
        const found = ROLE_HIERARCHY.find(r => member.roles.includes(r.id));
        return found ? found.label : null;
    }

    function render() {
        document.getElementById('staffCount').textContent =
            `${allStaff.length} staff member${allStaff.length !== 1 ? 's' : ''}`;

        staffGrid.innerHTML = allStaff.map(m => {
            const roleLabel = getHighestRole(m);
            return `
                <div class="staff-card">
                    <img class="staff-avatar" src="${m.avatarUrl}" alt="${m.username}"
                        onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                    <p class="staff-name">${m.username}</p>
                    ${roleLabel ? `<span class="staff-role-badge">${roleLabel}</span>` : ''}
                </div>
            `;
        }).join('');
    }

    loadStaff();
});
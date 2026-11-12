document.addEventListener('DOMContentLoaded', () => {
    initSidebarNav();
    initMobileMenu();
    initSmoothScroll();
    initScrollSpy();
    initFilterSearch();
});

function initSidebarNav() {
    const links = document.querySelectorAll('.nav-link-item');

    links.forEach(link => {
        link.addEventListener('click', () => {
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.classList.remove('open');
        });
    });
}

function initMobileMenu() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    const btn = document.createElement('button');
    btn.id = 'menu-toggle';
    btn.innerHTML = '<i class="bi bi-list"></i>';
    btn.setAttribute('aria-label', 'Abrir menu');
    btn.style.cssText = `
        display: none;
        background: none;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 20px;
        cursor: pointer;
        color: #0f172a;
        line-height: 1;
        margin-right: 12px;
    `;
    topbar.prepend(btn);

    const mq = window.matchMedia('(max-width: 768px)');
    const toggle = () => { btn.style.display = mq.matches ? 'block' : 'none'; };
    toggle();
    mq.addEventListener('change', toggle);

    btn.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

function initSmoothScroll() {
    document.querySelectorAll('.nav-link-item').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initScrollSpy() {
    const sections = document.querySelectorAll('.section-anchor');
    const links = document.querySelectorAll('.nav-link-item');

    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                links.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
}

function initFilterSearch() {
    const searchInput = document.querySelector('.filter-item.search-full .custom-input');
    const filterBtn = document.querySelector('.btn-filter-action');
    const tableBody = document.querySelector('#tabela .custom-table tbody');

    if (!searchInput || !tableBody) return;

    searchInput.addEventListener('input', () => {
        applyFilters(tableBody, searchInput);
    });

    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            applyFilters(tableBody, searchInput);
        });
    }
}

function applyFilters(tableBody, searchInput) {
    const query = searchInput.value.trim().toLowerCase();
    const rows = tableBody.querySelectorAll('tr:not(.no-results-row)');
    let visibleCount = 0;

    rows.forEach(row => {
        if (row.querySelector('.table-empty-row')) return;

        const text = row.textContent.toLowerCase();
        const show = !query || text.includes(query);
        row.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });

    let noResultsRow = tableBody.querySelector('.no-results-row');
    if (!visibleCount && query) {
        if (!noResultsRow) {
            noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results-row';
            const cols = tableBody.closest('table')?.querySelectorAll('thead th').length || 9;
            noResultsRow.innerHTML = `
                <td colspan="${cols}" class="table-empty-row">
                    <i class="bi bi-search"></i>
                    <span>Nenhum resultado encontrado para "<strong>${query}</strong>"</span>
                </td>
            `;
            tableBody.appendChild(noResultsRow);
        } else {
            noResultsRow.querySelector('strong').textContent = query;
            noResultsRow.style.display = '';
        }
    } else if (noResultsRow) {
        noResultsRow.style.display = 'none';
    }
}

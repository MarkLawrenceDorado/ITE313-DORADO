const charts = {
    categoryValue: null,
    stockStatus: null,
    topProducts: null
};

document.addEventListener('DOMContentLoaded', function () {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    const username = localStorage.getItem('user') || 'User';

    updateGreeting(username);
    setupLogout();

    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) userNameSpan.textContent = username;

    initializeData();
    populateCategoryFilter();
    populateActivityTable();
    refreshDashboard();
    setupFilterEvents();
    setupSearchEvent();
    setupExportEvent();

    setInterval(simulateRealTimeUpdate, 8000);
});

function updateGreeting(username) {
    const greetingElement = document.getElementById('greeting');
    if (!greetingElement) return;

    const hour = new Date().getHours();
    let timeOfDay = '';

    if (hour >= 5 && hour < 12) timeOfDay = 'Good Morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'Good Afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'Good Evening';
    else timeOfDay = 'Good Night';

    greetingElement.textContent = `${timeOfDay}, ${username}!`;
}

function refreshDashboard() {
    const filtered = applyFilters();
    updateStatistics();
    renderInventoryTable(filtered);
    renderLowStockAlert();
    renderCharts();
}

function updateStatistics() {
    const stats = getStockStatistics();

    setStatCard('stat1-value', stats.totalProducts);
    setStatCard('stat2-value', `$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setStatCard('stat3-value', stats.lowStockCount);
    setStatCard('stat4-value', stats.outOfStockCount);
}

function setStatCard(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function populateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    if (!select) return;

    const categories = getCategories();
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

function setupFilterEvents() {
    const categoryFilter = document.getElementById('categoryFilter');
    const stockStatusFilter = document.getElementById('stockStatusFilter');
    const minPriceFilter = document.getElementById('minPriceFilter');
    const maxPriceFilter = document.getElementById('maxPriceFilter');
    const resetBtn = document.getElementById('resetFiltersBtn');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            filterByCategory(this.value);
            refreshDashboard();
        });
    }

    if (stockStatusFilter) {
        stockStatusFilter.addEventListener('change', function () {
            filterByStockStatus(this.value);
            refreshDashboard();
        });
    }

    function applyPriceFilter() {
        filterByPriceRange(minPriceFilter.value, maxPriceFilter.value);
        refreshDashboard();
    }

    if (minPriceFilter) minPriceFilter.addEventListener('input', debounce(applyPriceFilter, 400));
    if (maxPriceFilter) maxPriceFilter.addEventListener('input', debounce(applyPriceFilter, 400));

    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            resetFilters();
            categoryFilter.value = 'all';
            stockStatusFilter.value = 'all';
            minPriceFilter.value = '';
            maxPriceFilter.value = '';
            document.getElementById('searchInput').value = '';
            refreshDashboard();
        });
    }
}

function setupSearchEvent() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce(function () {
        updateSearchResults(this.value);
        const filtered = applyFilters();
        renderInventoryTable(filtered, this.value);
    }, 300));
}

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function renderInventoryTable(products, highlightQuery = '') {
    const tableBody = document.getElementById('inventoryTableBody');
    const resultCount = document.getElementById('inventoryResultCount');
    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = '';

    if (products.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="7" class="text-center text-muted py-3">No products match your filters.</td>`;
        tableBody.appendChild(emptyRow);
    } else {
        products.forEach(p => {
            const row = document.createElement('tr');
            if (p.status === 'low-stock' || p.status === 'out-of-stock') {
                row.classList.add(p.status === 'out-of-stock' ? 'table-danger' : 'table-warning');
            }

            const totalValue = (p.quantity * p.unit_price).toFixed(2);
            const badge = getStatusBadge(p.status);

            row.innerHTML = `
                <td>${highlightMatch(p.sku, highlightQuery)}</td>
                <td>${highlightMatch(p.name, highlightQuery)}</td>
                <td>${p.category}</td>
                <td>${p.quantity}</td>
                <td>$${p.unit_price.toFixed(2)}</td>
                <td>$${totalValue}</td>
                <td>${badge}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    if (resultCount) {
        resultCount.textContent = `Showing ${products.length} of ${getProducts().length} products`;
    }
}

function highlightMatch(text, query) {
    if (!query || query.trim() === '') return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function getStatusBadge(status) {
    const map = {
        'in-stock': '<span class="badge bg-success">In Stock</span>',
        'low-stock': '<span class="badge bg-warning text-dark">Low Stock</span>',
        'out-of-stock': '<span class="badge bg-danger">Out of Stock</span>'
    };
    return map[status] || '<span class="badge bg-secondary">Unknown</span>';
}

function renderLowStockAlert() {
    const alertBox = document.getElementById('lowStockAlert');
    const alertText = document.getElementById('lowStockAlertText');
    if (!alertBox || !alertText) return;

    const lowStock = getLowStockProducts();

    if (lowStock.length === 0) {
        alertBox.classList.add('d-none');
        return;
    }

    const names = lowStock.slice(0, 3).map(p => p.name).join(', ');
    const extra = lowStock.length > 3 ? ` and ${lowStock.length - 3} more` : '';
    alertText.textContent = `${lowStock.length} product(s) need restocking: ${names}${extra}.`;
    alertBox.classList.remove('d-none');
}

function getThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
        primary: styles.getPropertyValue('--theme-primary').trim() || '#122A59',
        secondary: styles.getPropertyValue('--theme-secondary').trim() || '#223F59',
        accent: styles.getPropertyValue('--theme-accent').trim() || '#078C66',
        lightAccent: styles.getPropertyValue('--theme-light-accent').trim() || '#8FB2BF',
        danger: '#dc3545',
        warning: '#f3a712'
    };
}

function renderCharts() {
    if (typeof Chart === 'undefined') return; // Chart.js failed to load (e.g. no internet)

    const colors = getThemeColors();
    renderCategoryValueChart(colors);
    renderStockStatusChart(colors);
    renderTopProductsChart(colors);
}

function renderCategoryValueChart(colors) {
    const canvas = document.getElementById('categoryValueChart');
    if (!canvas) return;

    const summary = getCategorySummary();
    const labels = summary.map(s => s.category);
    const values = summary.map(s => Number(s.totalValue.toFixed(2)));

    if (charts.categoryValue) {
        charts.categoryValue.data.labels = labels;
        charts.categoryValue.data.datasets[0].data = values;
        charts.categoryValue.update();
        return;
    }

    charts.categoryValue = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Inventory Value ($)',
                data: values,
                backgroundColor: colors.primary,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderStockStatusChart(colors) {
    const canvas = document.getElementById('stockStatusChart');
    if (!canvas) return;

    const stats = getStockStatistics();
    const data = [stats.inStockCount, stats.lowStockCount, stats.outOfStockCount];

    if (charts.stockStatus) {
        charts.stockStatus.data.datasets[0].data = data;
        charts.stockStatus.update();
        return;
    }

    charts.stockStatus = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['In Stock', 'Low Stock', 'Out of Stock'],
            datasets: [{
                data: data,
                backgroundColor: [colors.accent, colors.warning, colors.danger]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function renderTopProductsChart(colors) {
    const canvas = document.getElementById('topProductsChart');
    if (!canvas) return;

    const top = getTopProductsByValue(5);
    const labels = top.map(p => p.name);
    const values = top.map(p => Number((p.quantity * p.unit_price).toFixed(2)));

    if (charts.topProducts) {
        charts.topProducts.data.labels = labels;
        charts.topProducts.data.datasets[0].data = values;
        charts.topProducts.update();
        return;
    }

    charts.topProducts = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Value ($)',
                data: values,
                backgroundColor: colors.secondary,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } }
        }
    });
}

function setupExportEvent() {
    const exportBtn = document.getElementById('exportCsvBtn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', function () {
        const currentView = applyFilters();
        const csv = exportToCSV(currentView);
        if (!csv) {
            showToast('Nothing to export — no products match the current filters.', 'warning');
            return;
        }
        const date = new Date().toISOString().split('T')[0];
        downloadCSV(csv, `inventory_export_${date}.csv`);
        showToast(`Exported ${currentView.length} product(s) to CSV.`, 'success');
    });
}

function simulateRealTimeUpdate() {
    const result = simulateInventoryChange();
    if (!result) return;

    const { product, change } = result;
    refreshDashboard();

    if (change !== 0) {
        const direction = change > 0 ? 'increased' : 'decreased';
        showToast(`${product.name} stock ${direction} by ${Math.abs(change)} (now ${product.quantity}).`, 'info');
    }
}
-
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const bgMap = {
        success: 'text-bg-success',
        warning: 'text-bg-warning',
        danger: 'text-bg-danger',
        info: 'text-bg-primary'
    };

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center ${bgMap[type] || 'text-bg-primary'} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function populateActivityTable() {
    const tableBody = document.getElementById('activityTableBody');
    if (!tableBody) return;

    const activities = [
        { date: '2026-08-10 14:30', activity: 'New order received #ORD-4532', status: 'success' },
        { date: '2026-08-10 13:15', activity: 'Customer support ticket resolved', status: 'info' },
        { date: '2026-08-10 11:45', activity: 'Product inventory updated', status: 'warning' },
        { date: '2026-08-10 09:00', activity: 'New customer signed up', status: 'success' },
        { date: '2026-08-09 16:20', activity: 'Payment received for invoice #INV-312', status: 'success' },
        { date: '2026-08-09 14:10', activity: 'Shipping delay reported for order #ORD-4521', status: 'danger' }
    ];

    tableBody.innerHTML = '';

    activities.forEach(activity => {
        const row = document.createElement('tr');

        let badgeClass = 'bg-secondary';
        if (activity.status === 'success') badgeClass = 'bg-success';
        else if (activity.status === 'warning') badgeClass = 'bg-warning text-dark';
        else if (activity.status === 'danger') badgeClass = 'bg-danger';
        else if (activity.status === 'info') badgeClass = 'bg-info text-dark';

        row.innerHTML = `
            <td>${activity.date}</td>
            <td>${activity.activity}</td>
            <td><span class="badge ${badgeClass}">${activity.status}</span></td>
        `;

        tableBody.appendChild(row);
    });
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutLink = document.getElementById('logoutLink');

    function performLogout(e) {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    if (logoutBtn) logoutBtn.addEventListener('click', performLogout);
    if (logoutLink) logoutLink.addEventListener('click', performLogout);
}
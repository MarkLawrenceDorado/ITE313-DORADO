const REORDER_LEVEL = 15; 

let allProducts = [];
let activeFilters = {
    category: 'all',
    stockStatus: 'all',
    minPrice: null,
    maxPrice: null,
    searchQuery: ''
};

function initializeData() {
    allProducts = [
        { id: 1, sku: 'ELEC-001', name: 'Wireless Earbuds', category: 'Electronics', quantity: 84, unit_price: 49.99, supplier: 'SoundTech Co.' },
        { id: 2, sku: 'ELEC-002', name: 'Smartwatch Series 5', category: 'Electronics', quantity: 12, unit_price: 129.99, supplier: 'SoundTech Co.' },
        { id: 3, sku: 'ELEC-003', name: 'USB-C Fast Charger', category: 'Electronics', quantity: 0, unit_price: 19.99, supplier: 'PowerGear' },
        { id: 4, sku: 'APRL-001', name: 'Cotton T-Shirt', category: 'Apparel', quantity: 210, unit_price: 12.5, supplier: 'ThreadWorks' },
        { id: 5, sku: 'APRL-002', name: 'Denim Jacket', category: 'Apparel', quantity: 8, unit_price: 54.0, supplier: 'ThreadWorks' },
        { id: 6, sku: 'APRL-003', name: 'Running Shoes', category: 'Apparel', quantity: 45, unit_price: 79.99, supplier: 'StrideFit' },
        { id: 7, sku: 'HOME-001', name: 'Ceramic Coffee Mug', category: 'Home & Living', quantity: 132, unit_price: 8.99, supplier: 'HomeCraft' },
        { id: 8, sku: 'HOME-002', name: 'LED Desk Lamp', category: 'Home & Living', quantity: 14, unit_price: 24.99, supplier: 'BrightHome' },
        { id: 9, sku: 'HOME-003', name: 'Throw Pillow Set', category: 'Home & Living', quantity: 0, unit_price: 17.5, supplier: 'HomeCraft' },
        { id: 10, sku: 'BEAU-001', name: 'Facial Moisturizer', category: 'Beauty', quantity: 60, unit_price: 22.0, supplier: 'GlowLab' },
        { id: 11, sku: 'BEAU-002', name: 'Matte Lipstick', category: 'Beauty', quantity: 5, unit_price: 15.99, supplier: 'GlowLab' },
        { id: 12, sku: 'SPRT-001', name: 'Yoga Mat', category: 'Sports', quantity: 38, unit_price: 29.99, supplier: 'StrideFit' },
        { id: 13, sku: 'SPRT-002', name: 'Adjustable Dumbbell Set', category: 'Sports', quantity: 3, unit_price: 149.0, supplier: 'IronCore' },
        { id: 14, sku: 'ELEC-004', name: 'Bluetooth Speaker', category: 'Electronics', quantity: 22, unit_price: 39.99, supplier: 'SoundTech Co.' },
        { id: 15, sku: 'HOME-004', name: 'Scented Candle Trio', category: 'Home & Living', quantity: 76, unit_price: 18.0, supplier: 'BrightHome' }
    ].map(p => ({ ...p, status: getStockStatus(p.quantity) }));

    return allProducts;
}

function getStockStatus(quantity) {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= REORDER_LEVEL) return 'low-stock';
    return 'in-stock';
}

function getProducts() {
    return allProducts;
}

function getProductById(id) {
    return allProducts.find(p => p.id === Number(id));
}

function getProductsByCategory(category) {
    if (category === 'all') return allProducts;
    return allProducts.filter(p => p.category === category);
}

function getLowStockProducts() {
    return allProducts.filter(p => p.status === 'low-stock' || p.status === 'out-of-stock');
}

function getCategories() {
    return [...new Set(allProducts.map(p => p.category))].sort();
}

function getStockStatistics() {
    const totalProducts = allProducts.length;
    const totalValue = allProducts.reduce((sum, p) => sum + p.quantity * p.unit_price, 0);
    const lowStockCount = allProducts.filter(p => p.status === 'low-stock').length;
    const outOfStockCount = allProducts.filter(p => p.status === 'out-of-stock').length;
    const inStockCount = allProducts.filter(p => p.status === 'in-stock').length;

    return { totalProducts, totalValue, lowStockCount, outOfStockCount, inStockCount };
}

function getCategorySummary() {
    const categories = getCategories();
    return categories.map(cat => {
        const items = allProducts.filter(p => p.category === cat);
        const totalValue = items.reduce((sum, p) => sum + p.quantity * p.unit_price, 0);
        const totalQuantity = items.reduce((sum, p) => sum + p.quantity, 0);
        return { category: cat, totalValue, totalQuantity, itemCount: items.length };
    });
}

function getTopProductsByValue(limit = 5) {
    return [...allProducts]
        .sort((a, b) => (b.quantity * b.unit_price) - (a.quantity * a.unit_price))
        .slice(0, limit);
}

function getSupplierDistribution() {
    const suppliers = [...new Set(allProducts.map(p => p.supplier))];
    return suppliers.map(sup => ({
        supplier: sup,
        count: allProducts.filter(p => p.supplier === sup).length
    }));
}

function filterByCategory(category) {
    activeFilters.category = category;
    return applyFilters();
}

function filterByStockStatus(status) {
    activeFilters.stockStatus = status;
    return applyFilters();
}

function filterByPriceRange(min, max) {
    activeFilters.minPrice = min === '' || min === null ? null : Number(min);
    activeFilters.maxPrice = max === '' || max === null ? null : Number(max);
    return applyFilters();
}

function applyFilters() {
    let result = [...allProducts];

    if (activeFilters.category !== 'all') {
        result = result.filter(p => p.category === activeFilters.category);
    }

    if (activeFilters.stockStatus !== 'all') {
        result = result.filter(p => p.status === activeFilters.stockStatus);
    }

    if (activeFilters.minPrice !== null) {
        result = result.filter(p => p.unit_price >= activeFilters.minPrice);
    }

    if (activeFilters.maxPrice !== null) {
        result = result.filter(p => p.unit_price <= activeFilters.maxPrice);
    }

    if (activeFilters.searchQuery.trim() !== '') {
        const q = activeFilters.searchQuery.trim().toLowerCase();
        result = result.filter(p =>
            p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
        );
    }

    return result;
}

function resetFilters() {
    activeFilters = { category: 'all', stockStatus: 'all', minPrice: null, maxPrice: null, searchQuery: '' };
    return allProducts;
}

function searchProducts(query) {
    activeFilters.searchQuery = query;
    return applyFilters();
}

function updateSearchResults(query) {
    return searchProducts(query);
}

function simulateInventoryChange() {
    if (allProducts.length === 0) return null;

    const index = Math.floor(Math.random() * allProducts.length);
    const product = allProducts[index];
    const change = Math.floor(Math.random() * 11) - 5; // -5 to +5
    const newQuantity = Math.max(0, product.quantity + change);

    product.quantity = newQuantity;
    product.status = getStockStatus(newQuantity);

    return { product, change };
}

function exportToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = ['SKU', 'Name', 'Category', 'Quantity', 'Unit Price', 'Total Value', 'Status', 'Supplier'];
    const rows = data.map(p => [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        p.category,
        p.quantity,
        p.unit_price.toFixed(2),
        (p.quantity * p.unit_price).toFixed(2),
        p.status,
        `"${p.supplier.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
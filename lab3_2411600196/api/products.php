<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

const DATA_FILE = __DIR__ . '/data/products.json';
const REORDER_LEVEL = 15;

function loadData() {
    if (!file_exists(DATA_FILE)) {
        return ['products' => [], 'next_id' => 1];
    }
    $json = file_get_contents(DATA_FILE);
    $data = json_decode($json, true);
    if (!is_array($data)) {
        return ['products' => [], 'next_id' => 1];
    }
    return $data;
}

function saveData($data) {
    return file_put_contents(DATA_FILE, json_encode($data, JSON_PRETTY_PRINT));
}

function getStockStatus($quantity) {
    if ($quantity <= 0) return 'out-of-stock';
    if ($quantity <= REORDER_LEVEL) return 'low-stock';
    return 'in-stock';
}

function withStatus($product) {
    $product['status'] = getStockStatus($product['quantity']);
    return $product;
}

function sendJson($payload, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function getRequestBody() {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($method === 'POST' ? (getRequestBody()['action'] ?? '') : 'list');

$data = loadData();

switch ($action) {

    case 'list': {
        $products = array_map('withStatus', $data['products']);
        sendJson(['success' => true, 'products' => $products, 'count' => count($products)]);
        break;
    }

    case 'get': {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        $found = null;
        foreach ($data['products'] as $p) {
            if ($p['id'] === $id) { $found = withStatus($p); break; }
        }
        if ($found === null) {
            sendJson(['success' => false, 'error' => 'Product not found'], 404);
        }
        sendJson(['success' => true, 'product' => $found]);
        break;
    }

    case 'add': {
        $body = getRequestBody();

        $required = ['sku', 'name', 'category', 'quantity', 'unit_price', 'supplier'];
        foreach ($required as $field) {
            if (!isset($body[$field]) || $body[$field] === '') {
                sendJson(['success' => false, 'error' => "Missing required field: $field"], 400);
            }
        }

        $newProduct = [
            'id' => $data['next_id'],
            'sku' => (string) $body['sku'],
            'name' => (string) $body['name'],
            'category' => (string) $body['category'],
            'quantity' => max(0, (int) $body['quantity']),
            'unit_price' => max(0, (float) $body['unit_price']),
            'supplier' => (string) $body['supplier']
        ];

        $data['products'][] = $newProduct;
        $data['next_id'] += 1;

        if (saveData($data) === false) {
            sendJson(['success' => false, 'error' => 'Failed to save product'], 500);
        }

        sendJson(['success' => true, 'product' => withStatus($newProduct)], 201);
        break;
    }

    case 'update_stock': {
        $body = getRequestBody();

        if (!isset($body['id']) || !isset($body['quantity'])) {
            sendJson(['success' => false, 'error' => 'id and quantity are required'], 400);
        }

        $id = (int) $body['id'];
        $newQuantity = max(0, (int) $body['quantity']);
        $updated = null;

        foreach ($data['products'] as &$p) {
            if ($p['id'] === $id) {
                $p['quantity'] = $newQuantity;
                $updated = $p;
                break;
            }
        }
        unset($p);

        if ($updated === null) {
            sendJson(['success' => false, 'error' => 'Product not found'], 404);
        }

        if (saveData($data) === false) {
            sendJson(['success' => false, 'error' => 'Failed to save changes'], 500);
        }

        sendJson(['success' => true, 'product' => withStatus($updated)]);
        break;
    }

    default:
        sendJson(['success' => false, 'error' => 'Unknown action. Use list, get, add, or update_stock.'], 400);
}
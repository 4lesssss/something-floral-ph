<?php
/**
 * Something Floral PH — API Router
 *
 * All /api/* requests are rewritten here by .htaccess.
 * Parses the URI and dispatches to the appropriate route handler.
 */

header('Content-Type: application/json; charset=utf-8');

set_exception_handler(function (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal Server Error: ' . $e->getMessage()]);
    exit;
});

// ── CORS (allow Vite dev server in development) ──────────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/helpers.php';

// ── Parse route ──────────────────────────────────────────
$uri    = $_SERVER['REQUEST_URI'] ?? '/';
$uri    = parse_url($uri, PHP_URL_PATH);
$uri    = rtrim($uri, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Strip /api prefix if present
if (strpos($uri, '/api') === 0) {
    $uri = substr($uri, 4);
}

// ── Route dispatch ───────────────────────────────────────

// Products
if ($uri === '/products' && $method === 'GET') {
    require __DIR__ . '/routes/products.php';
    handle_get_products();
}
elseif (preg_match('#^/admin/products/(\d+)$#', $uri, $m) && $method === 'PATCH') {
    require __DIR__ . '/routes/products.php';
    handle_update_product((int)$m[1]);
}

// Schedule
elseif ($uri === '/schedule' && $method === 'GET') {
    require __DIR__ . '/routes/schedule.php';
    handle_get_schedule();
}

// Orders
elseif ($uri === '/orders' && $method === 'POST') {
    require __DIR__ . '/routes/orders.php';
    handle_create_order();
}
elseif (preg_match('#^/orders/([A-Za-z0-9-]+)$#', $uri, $m) && $method === 'GET') {
    require __DIR__ . '/routes/orders.php';
    handle_get_order($m[1]);
}

// Auth
elseif ($uri === '/auth/client/register' && $method === 'POST') {
    require __DIR__ . '/routes/auth.php';
    handle_client_register();
}
elseif ($uri === '/auth/client/login' && $method === 'POST') {
    require __DIR__ . '/routes/auth.php';
    handle_client_login();
}
elseif ($uri === '/auth/admin/login' && $method === 'POST') {
    require __DIR__ . '/routes/auth.php';
    handle_admin_login();
}
elseif ($uri === '/auth/logout' && $method === 'POST') {
    require __DIR__ . '/routes/auth.php';
    handle_logout();
}
elseif ($uri === '/auth/me' && $method === 'GET') {
    require __DIR__ . '/routes/auth.php';
    handle_me();
}
elseif ($uri === '/auth/forgot-password' && $method === 'POST') {
    require __DIR__ . '/routes/password_reset.php';
    handle_forgot_password();
}
elseif ($uri === '/auth/reset-password' && $method === 'POST') {
    require __DIR__ . '/routes/password_reset.php';
    handle_reset_password();
}

// Client endpoints
elseif ($uri === '/client/orders' && $method === 'GET') {
    require __DIR__ . '/routes/client.php';
    handle_client_orders();
}
elseif ($uri === '/client/profile' && $method === 'PATCH') {
    require __DIR__ . '/routes/client.php';
    handle_update_profile();
}
elseif ($uri === '/client/password' && $method === 'PATCH') {
    require __DIR__ . '/routes/client.php';
    handle_update_password();
}

// Admin endpoints
elseif ($uri === '/admin/stats' && $method === 'GET') {
    require __DIR__ . '/routes/admin.php';
    handle_admin_stats();
}
elseif ($uri === '/admin/orders' && $method === 'GET') {
    require __DIR__ . '/routes/admin.php';
    handle_admin_orders();
}
elseif (preg_match('#^/admin/orders/([A-Za-z0-9-]+)/status$#', $uri, $m) && $method === 'PATCH') {
    require __DIR__ . '/routes/admin.php';
    handle_update_order_status($m[1]);
}
elseif ($uri === '/admin/clients' && $method === 'GET') {
    require __DIR__ . '/routes/admin.php';
    handle_admin_clients();
}

// Inquiry endpoints
elseif ($uri === '/inquiries' && $method === 'POST') {
    require __DIR__ . '/routes/inquiries.php';
    handle_create_inquiry();
}
elseif ($uri === '/admin/inquiries' && $method === 'GET') {
    require __DIR__ . '/routes/inquiries.php';
    handle_get_all_inquiries();
}
elseif ($uri === '/client/inquiries' && $method === 'GET') {
    require __DIR__ . '/routes/inquiries.php';
    handle_client_inquiries();
}
elseif (preg_match('#^/inquiries/(\d+)$#', $uri, $m) && $method === 'GET') {
    require __DIR__ . '/routes/inquiries.php';
    handle_get_inquiry((int)$m[1]);
}
elseif (preg_match('#^/admin/inquiries/(\d+)/read$#', $uri, $m) && $method === 'PATCH') {
    require __DIR__ . '/routes/inquiries.php';
    handle_mark_inquiry_read((int)$m[1]);
}
elseif (preg_match('#^/inquiries/(\d+)/replies$#', $uri, $m) && $method === 'POST') {
    require __DIR__ . '/routes/inquiries.php';
    handle_add_reply((int)$m[1]);
}

// 404 fallback
else {
    json_error('Endpoint not found', 404);
}

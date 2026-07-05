<?php
/**
 * Something Floral PH — Shared Helpers
 */

require_once __DIR__ . '/db.php';

/* ── JSON Response Helpers ─────────────────────────────── */

function json_response($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $status = 400): void {
    json_response(['error' => $message], $status);
}

function get_json_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/* ── Authentication ────────────────────────────────────── */

function generate_token(): string {
    return bin2hex(random_bytes(32)); // 64 hex chars
}

function authenticate(): ?array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        return null;
    }
    $token = $m[1];
    $db = getDB();

    // Clean up expired sessions opportunistically
    $db->exec("DELETE FROM sessions WHERE expires_at < NOW()");

    $stmt = $db->prepare("
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
               u.username, u.role, u.created_at AS joinedAt
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    return $stmt->fetch() ?: null;
}

function require_auth(?string $role = null): array {
    $user = authenticate();
    if (!$user) {
        json_error('Authentication required', 401);
    }
    if ($role && $user['role'] !== $role) {
        json_error('Forbidden', 403);
    }
    return $user;
}

/* ── Validation Helpers ────────────────────────────────── */

function validate_email(string $email): bool {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return false;
    // Stricter check: must have a valid TLD (at least 2 chars after last dot)
    return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/', $email);
}

function validate_phone(string $phone): bool {
    return (bool) preg_match('/^09\d{9}$/', $phone);
}

function validate_date_not_past(string $date): bool {
    $pickup = date('Y-m-d', strtotime($date));
    $today  = date('Y-m-d');
    return $pickup >= $today;
}

function validate_password_strength(string $password): ?string {
    if (strlen($password) < 6) {
        return 'Password must be at least 6 characters.';
    }
    if (!preg_match('/[a-z]/', $password)) {
        return 'Password must contain at least one lowercase letter.';
    }
    if (!preg_match('/[A-Z]/', $password)) {
        return 'Password must contain at least one uppercase letter.';
    }
    if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
        return 'Password must contain at least one special character (!@#$%^&* etc).';
    }
    return null;
}

/* ── Order ID Generator ────────────────────────────────── */

function generate_order_id(): string {
    $db = getDB();
    $stmt = $db->query("SELECT MAX(CAST(SUBSTRING(id, 6) AS UNSIGNED)) AS max_num FROM orders WHERE id LIKE 'SFPH-%'");
    $row = $stmt->fetch();
    $next = ($row && $row['max_num']) ? (int) $row['max_num'] + 1 : 1;
    return 'SFPH-' . str_pad($next, 4, '0', STR_PAD_LEFT);
}

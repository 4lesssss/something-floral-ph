<?php
require_once __DIR__ . '/db.php';

$db = getDB();
$stmt = $db->query("SELECT id, email, first_name, role FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Users in database:\n";
foreach ($users as $u) {
    echo "  - ID:{$u['id']} | {$u['email']} | {$u['first_name']} | role:{$u['role']}\n";
}

echo "\n--- Testing mailer ---\n";
try {
    require_once __DIR__ . '/mailer.php';
    $result = send_email('strikepineda1@gmail.com', 'Test from SFPH', '<h1>Hello!</h1><p>If you see this, email is working.</p>');
    echo "send_email returned: " . ($result ? "TRUE (success)" : "FALSE (failed)") . "\n";
} catch (Throwable $e) {
    echo "MAILER ERROR: " . $e->getMessage() . "\n";
}

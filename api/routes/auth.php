<?php
/**
 * Auth route handlers — register, login, logout, me
 */

function handle_client_register(): void {
    $body = get_json_body();

    $firstName = trim($body['firstName'] ?? '');
    $lastName  = trim($body['lastName'] ?? '');
    $email     = trim($body['email'] ?? '');
    $phone     = trim($body['phone'] ?? '');
    $password  = $body['password'] ?? '';

    // Validation
    if (empty($firstName) || empty($lastName)) {
        json_error('First name and last name are required.');
    }
    if (mb_strlen($firstName) > 50 || mb_strlen($lastName) > 50) {
        json_error('First name and last name must be 50 characters or fewer.');
    }
    if (empty($email) || !validate_email($email)) {
        json_error('Please enter a valid email address.');
    }
    if (strlen($password) < 6) {
        json_error('Password must be at least 6 characters.');
    }
    $pwError = validate_password_strength($password);
    if ($pwError) {
        json_error($pwError);
    }
    if (!empty($phone) && !validate_phone($phone)) {
        json_error('Phone must be a valid PH mobile number (e.g. 09171234567).');
    }

    $db = getDB();

    // Check email uniqueness
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        json_error('An account with this email already exists.');
    }

    // Create user
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, ?, 'client')
    ");
    $stmt->execute([$firstName, $lastName, $email, $phone ?: null, $hash]);
    $userId = (int) $db->lastInsertId();

    // Create session token
    $token = generate_token();
    $stmt = $db->prepare("
        INSERT INTO sessions (token, user_id, expires_at)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
    ");
    $stmt->execute([$token, $userId]);

    // Send Emails
    try {
        require_once __DIR__ . '/../mailer.php';
        
        // 1. Welcome email to client
        $userHtml = "
        <div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #f2a2b1;\">
            <div style=\"background: linear-gradient(135deg, #f7c5cc 0%, #f2a2b1 100%); padding: 28px 24px; text-align: center;\">
                <h1 style=\"margin: 0; color: #7b2d3f; font-size: 22px;\">🌷 Welcome, $firstName!</h1>
            </div>
            <div style=\"padding: 28px 24px;\">
                <p style=\"color: #666; font-size: 15px; line-height: 1.5;\">Your account at <strong>Something Floral PH</strong> has been created successfully.</p>
                <p style=\"color: #666; font-size: 15px; line-height: 1.5;\">You can now sign in to reserve bouquets and manage your orders for our upcoming university pop-ups.</p>
            </div>
        </div>";
        send_email($email, 'Welcome to Something Floral PH!', $userHtml);

        // 2. Notification to Admin
        $stmtAdmin = $db->query("SELECT email FROM users WHERE role = 'admin' LIMIT 1");
        $admin = $stmtAdmin->fetch();
        $adminEmail = ($admin && !empty($admin['email']) && strpos($admin['email'], 'somethingfloralph.com') === false) 
            ? $admin['email'] 
            : MAIL_USERNAME;

        if ($adminEmail) {
            $adminHtml = "
            <div style=\"font-family: Arial, sans-serif;\">
                <h2>New Client Registration</h2>
                <p>A new user just signed up on the website.</p>
                <ul>
                    <li><strong>Name:</strong> $firstName $lastName</li>
                    <li><strong>Email:</strong> $email</li>
                    <li><strong>Phone:</strong> " . ($phone ?: 'N/A') . "</li>
                </ul>
            </div>";
            send_email($adminEmail, "New Client: $firstName $lastName", $adminHtml);
        }
    } catch (\Throwable $e) {
        error_log('[SFPH] Registration mail error: ' . $e->getMessage());
    }

    json_response([
        'token' => $token,
        'user'  => [
            'id'        => $userId,
            'firstName' => $firstName,
            'lastName'  => $lastName,
            'email'     => $email,
            'phone'     => $phone ?: null,
        ],
        'role'  => 'client',
    ], 201);
}

function handle_client_login(): void {
    $body = get_json_body();
    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (empty($email) || empty($password)) {
        json_error('Email and password are required.');
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND role = 'client'");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_error('Invalid email or password.', 401);
    }

    // Create session
    $token = generate_token();
    $stmt = $db->prepare("
        INSERT INTO sessions (token, user_id, expires_at)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
    ");
    $stmt->execute([$token, (int) $user['id']]);

    json_response([
        'token' => $token,
        'user'  => [
            'id'        => (int) $user['id'],
            'firstName' => $user['first_name'],
            'lastName'  => $user['last_name'],
            'email'     => $user['email'],
            'phone'     => $user['phone'],
            'joinedAt'  => $user['created_at'],
        ],
        'role'  => 'client',
    ]);
}

function handle_admin_login(): void {
    $body = get_json_body();
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    if (empty($username) || empty($password)) {
        json_error('Username and password are required.');
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE username = ? AND role = 'admin'");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_error('Invalid credentials.', 401);
    }

    $token = generate_token();
    $stmt = $db->prepare("
        INSERT INTO sessions (token, user_id, expires_at)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
    ");
    $stmt->execute([$token, (int) $user['id']]);

    json_response([
        'token' => $token,
        'user'  => [
            'id'       => (int) $user['id'],
            'username' => $user['username'],
            'name'     => $user['first_name'],
        ],
        'role'  => 'admin',
    ]);
}

function handle_logout(): void {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM sessions WHERE token = ?");
        $stmt->execute([$m[1]]);
    }
    json_response(['message' => 'Logged out']);
}

function handle_me(): void {
    $user = require_auth();

    $data = [
        'id'        => (int) $user['id'],
        'firstName' => $user['first_name'],
        'lastName'  => $user['last_name'],
        'email'     => $user['email'],
        'phone'     => $user['phone'],
        'joinedAt'  => $user['joinedAt'],
    ];

    if ($user['role'] === 'admin') {
        $data['username'] = $user['username'];
        $data['name']     = $user['first_name'];
    }

    json_response([
        'user' => $data,
        'role' => $user['role'],
    ]);
}

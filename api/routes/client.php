<?php
/**
 * Client route handlers — orders, profile, password
 */

function handle_client_orders(): void {
    $user = require_auth('client');
    $db = getDB();

    $stmt = $db->prepare("
        SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC
    ");
    $stmt->execute([(int) $user['id']]);
    $rows = $stmt->fetchAll();

    $orders = array_map(function ($r) {
        return [
            'id'             => $r['id'],
            'fullName'       => $r['full_name'],
            'contactNumber'  => $r['contact_number'],
            'email'          => $r['email'],
            'bouquet'        => $r['bouquet'],
            'quantity'       => (int) $r['quantity'],
            'unitPrice'      => (int) $r['unit_price'],
            'totalPrice'     => (int) $r['total_price'],
            'pickupLocation' => $r['pickup_location'],
            'pickupDate'     => $r['pickup_date'],
            'messageNote'    => $r['message_note'],
            'paymentMethod'  => $r['payment_method'],
            'status'         => $r['status'],
            'createdAt'      => $r['created_at'],
        ];
    }, $rows);

    json_response($orders);
}

function handle_update_profile(): void {
    $user = require_auth('client');
    $body = get_json_body();
    $db = getDB();

    $firstName = trim($body['firstName'] ?? $user['first_name']);
    $lastName  = trim($body['lastName']  ?? $user['last_name']);
    $email     = trim($body['email']     ?? $user['email']);
    $phone     = trim($body['phone']     ?? $user['phone'] ?? '');

    if (empty($firstName) || empty($lastName)) {
        json_error('First name and last name are required.');
    }
    if (!validate_email($email)) {
        json_error('Please enter a valid email address.');
    }
    if (!empty($phone) && !validate_phone($phone)) {
        json_error('Phone must be a valid PH mobile number (e.g. 09171234567).');
    }

    // Check email uniqueness if changed
    if ($email !== $user['email']) {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->execute([$email, (int) $user['id']]);
        if ($stmt->fetch()) {
            json_error('This email is already in use by another account.');
        }
    }

    $stmt = $db->prepare("
        UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?
        WHERE id = ?
    ");
    $stmt->execute([$firstName, $lastName, $email, $phone ?: null, (int) $user['id']]);

    json_response([
        'message' => 'Profile updated',
        'user' => [
            'id'        => (int) $user['id'],
            'firstName' => $firstName,
            'lastName'  => $lastName,
            'email'     => $email,
            'phone'     => $phone ?: null,
        ],
    ]);
}

function handle_update_password(): void {
    $user = require_auth('client');
    $body = get_json_body();
    $db = getDB();

    $currentPassword = $body['currentPassword'] ?? '';
    $newPassword     = $body['newPassword'] ?? '';

    if (empty($currentPassword) || empty($newPassword)) {
        json_error('Current and new passwords are required.');
    }
    $pwError = validate_password_strength($newPassword);
    if ($pwError) {
        json_error($pwError);
    }

    // Verify current password
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([(int) $user['id']]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
        json_error('Current password is incorrect.', 401);
    }

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$hash, (int) $user['id']]);

    json_response(['message' => 'Password updated']);
}

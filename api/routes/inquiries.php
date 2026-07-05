<?php
/**
 * Inquiry route handlers — create, list, view, reply, mark read
 */

function handle_create_inquiry(): void {
    $body = get_json_body();

    $name    = trim($body['name'] ?? '');
    $email   = trim($body['email'] ?? '');
    $phone   = trim($body['phone'] ?? '');
    $subject = trim($body['subject'] ?? '');
    $message = trim($body['message'] ?? '');
    $clientId = !empty($body['clientId']) ? (int) $body['clientId'] : null;

    // Validation
    $errors = [];
    if (empty($name)) $errors[] = 'Name is required.';
    elseif (mb_strlen($name) > 50) $errors[] = 'Name must be 50 characters or fewer.';

    if (empty($email)) $errors[] = 'Email is required.';
    elseif (!validate_email($email)) $errors[] = 'Please enter a valid email address.';

    if (!empty($phone) && !validate_phone($phone))
        $errors[] = 'Phone must be a valid PH mobile number (e.g. 09171234567).';

    if (empty($subject)) $errors[] = 'Subject is required.';
    elseif (mb_strlen($subject) > 150) $errors[] = 'Subject must be 150 characters or fewer.';

    if (empty($message)) $errors[] = 'Message is required.';
    elseif (mb_strlen($message) > 2000) $errors[] = 'Message must be 2000 characters or fewer.';

    if (!empty($errors)) {
        json_error(implode(' ', $errors), 422);
    }

    $db = getDB();
    $stmt = $db->prepare("
        INSERT INTO inquiries (name, email, phone, subject, message, client_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$name, $email, $phone ?: null, $subject, $message, $clientId]);
    $id = (int) $db->lastInsertId();

    json_response([
        'id'      => $id,
        'name'    => $name,
        'email'   => $email,
        'subject' => $subject,
        'message' => 'Inquiry sent successfully!',
    ], 201);
}

function handle_get_all_inquiries(): void {
    $user = require_auth('admin');
    $db = getDB();

    $rows = $db->query("
        SELECT i.*, 
               (SELECT COUNT(*) FROM inquiry_replies r WHERE r.inquiry_id = i.id) AS reply_count
        FROM inquiries i 
        ORDER BY i.created_at DESC
    ")->fetchAll();

    $inquiries = array_map(function ($r) {
        return [
            'id'         => (int) $r['id'],
            'name'       => $r['name'],
            'email'      => $r['email'],
            'phone'      => $r['phone'],
            'subject'    => $r['subject'],
            'message'    => $r['message'],
            'isRead'     => (bool) $r['is_read'],
            'clientId'   => $r['client_id'] ? (int) $r['client_id'] : null,
            'replyCount' => (int) $r['reply_count'],
            'createdAt'  => $r['created_at'],
        ];
    }, $rows);

    json_response($inquiries);
}

function handle_client_inquiries(): void {
    $user = require_auth('client');
    $db = getDB();

    $stmt = $db->prepare("
        SELECT i.*,
               (SELECT COUNT(*) FROM inquiry_replies r WHERE r.inquiry_id = i.id) AS reply_count
        FROM inquiries i
        WHERE i.client_id = ?
        ORDER BY i.created_at DESC
    ");
    $stmt->execute([(int) $user['id']]);
    $rows = $stmt->fetchAll();

    $inquiries = array_map(function ($r) {
        return [
            'id'         => (int) $r['id'],
            'name'       => $r['name'],
            'email'      => $r['email'],
            'phone'      => $r['phone'],
            'subject'    => $r['subject'],
            'message'    => $r['message'],
            'isRead'     => (bool) $r['is_read'],
            'replyCount' => (int) $r['reply_count'],
            'createdAt'  => $r['created_at'],
        ];
    }, $rows);

    json_response($inquiries);
}

function handle_get_inquiry(int $id): void {
    $user = require_auth();
    $db = getDB();

    $stmt = $db->prepare("SELECT * FROM inquiries WHERE id = ?");
    $stmt->execute([$id]);
    $inquiry = $stmt->fetch();

    if (!$inquiry) {
        json_error('Inquiry not found', 404);
    }

    // Clients can only see their own inquiries
    if ($user['role'] === 'client' && (int) $inquiry['client_id'] !== (int) $user['id']) {
        json_error('Forbidden', 403);
    }

    // Fetch replies
    $stmt = $db->prepare("
        SELECT * FROM inquiry_replies WHERE inquiry_id = ? ORDER BY created_at ASC
    ");
    $stmt->execute([$id]);
    $replies = array_map(function ($r) {
        return [
            'id'         => (int) $r['id'],
            'senderRole' => $r['sender_role'],
            'senderName' => $r['sender_name'],
            'message'    => $r['message'],
            'createdAt'  => $r['created_at'],
        ];
    }, $stmt->fetchAll());

    json_response([
        'id'        => (int) $inquiry['id'],
        'name'      => $inquiry['name'],
        'email'     => $inquiry['email'],
        'phone'     => $inquiry['phone'],
        'subject'   => $inquiry['subject'],
        'message'   => $inquiry['message'],
        'isRead'    => (bool) $inquiry['is_read'],
        'clientId'  => $inquiry['client_id'] ? (int) $inquiry['client_id'] : null,
        'createdAt' => $inquiry['created_at'],
        'replies'   => $replies,
    ]);
}

function handle_mark_inquiry_read(int $id): void {
    $user = require_auth('admin');
    $db = getDB();

    $stmt = $db->prepare("UPDATE inquiries SET is_read = 1 WHERE id = ?");
    $stmt->execute([$id]);

    json_response(['message' => 'Marked as read']);
}

function handle_add_reply(int $inquiryId): void {
    $user = require_auth();
    $body = get_json_body();
    $db = getDB();

    // Verify inquiry exists
    $stmt = $db->prepare("SELECT * FROM inquiries WHERE id = ?");
    $stmt->execute([$inquiryId]);
    $inquiry = $stmt->fetch();
    if (!$inquiry) {
        json_error('Inquiry not found', 404);
    }

    // Clients can only reply to their own inquiries
    if ($user['role'] === 'client' && (int) $inquiry['client_id'] !== (int) $user['id']) {
        json_error('Forbidden', 403);
    }

    $message = trim($body['message'] ?? '');
    if (empty($message)) {
        json_error('Reply message is required.');
    }
    if (mb_strlen($message) > 2000) {
        json_error('Reply must be 2000 characters or fewer.');
    }

    $senderName = $user['role'] === 'admin'
        ? ($user['username'] ?? 'Admin')
        : (($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));

    $stmt = $db->prepare("
        INSERT INTO inquiry_replies (inquiry_id, sender_role, sender_name, message)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$inquiryId, $user['role'], trim($senderName), $message]);

    // Mark as read if admin replies
    if ($user['role'] === 'admin') {
        $db->prepare("UPDATE inquiries SET is_read = 1 WHERE id = ?")->execute([$inquiryId]);
    }

    json_response([
        'id'         => (int) $db->lastInsertId(),
        'senderRole' => $user['role'],
        'senderName' => trim($senderName),
        'message'    => $message,
        'createdAt'  => date('c'),
    ], 201);
}

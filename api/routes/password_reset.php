<?php
/**
 * Password Reset route handlers — forgot-password, reset-password
 */

/**
 * POST /auth/forgot-password
 * Body: { email }
 *
 * Generates a 6-digit code, stores it with 15-min expiry, and emails it.
 * Always returns a generic success message to prevent email enumeration.
 */
function handle_forgot_password(): void {
    $body  = get_json_body();
    $email = trim($body['email'] ?? '');

    if (empty($email) || !validate_email($email)) {
        json_error('Please enter a valid email address.');
    }

    // Always return success message (don't reveal if email exists)
    $successMsg = 'If an account with that email exists, a reset code has been sent.';

    $db = getDB();

    // Look up user
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND role = 'client'");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Email not found — return success anyway (prevents enumeration)
        json_response(['message' => $successMsg]);
    }

    $userId = (int) $user['id'];

    // ── Rate limit: max one code per 60 seconds ──────────
    $stmt = $db->prepare("
        SELECT TIMESTAMPDIFF(SECOND, created_at, NOW()) AS seconds_ago
        FROM password_resets
        WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    ");
    $stmt->execute([$userId]);
    $last = $stmt->fetch();

    if ($last !== false && $last['seconds_ago'] !== null) {
        $secondsAgo = (int)$last['seconds_ago'];
        if ($secondsAgo < 60 && $secondsAgo >= -5) { // allow small negative delta
            json_error('Please wait at least 60 seconds before requesting another code.', 429);
        }
    }

    // ── Generate 6-digit code ────────────────────────────
    $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    $stmt = $db->prepare("
        INSERT INTO password_resets (user_id, code, expires_at)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
    ");
    $stmt->execute([$userId, $code]);

    // ── Send email ───────────────────────────────────────
    try {
        require_once __DIR__ . '/../mailer.php';

        $htmlBody = "
        <div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #f2a2b1;\">
            <div style=\"background: linear-gradient(135deg, #f7c5cc 0%, #f2a2b1 100%); padding: 28px 24px; text-align: center;\">
                <h1 style=\"margin: 0; color: #7b2d3f; font-size: 22px;\">🔐 Password Reset</h1>
                <p style=\"margin: 8px 0 0; color: #a94560; font-size: 14px;\">You requested a password reset for your account.</p>
            </div>
            <div style=\"padding: 28px 24px; text-align: center;\">
                <p style=\"color: #666; font-size: 14px; margin: 0 0 16px;\">Use this code to reset your password:</p>
                <div style=\"background: #fdf6f0; border: 2px dashed #f2a2b1; border-radius: 8px; padding: 16px; display: inline-block;\">
                    <span style=\"font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #7b2d3f;\">{$code}</span>
                </div>
                <p style=\"color: #999; font-size: 12px; margin: 16px 0 0;\">This code expires in 15 minutes.<br>If you didn't request this, please ignore this email.</p>
            </div>
            <div style=\"background: #fdf6f0; padding: 14px 24px; text-align: center; font-size: 12px; color: #999;\">
                Something Floral PH &mdash; Handcrafted with love 🌷
            </div>
        </div>";

        send_email($email, 'Password Reset Code — Something Floral PH', $htmlBody);
    } catch (\Throwable $mailErr) {
        error_log('[SFPH] Password reset mail error for user ' . $userId . ': ' . $mailErr->getMessage());
        // Don't block — the code is still stored, user can try again
    }

    json_response(['message' => $successMsg]);
}

/**
 * POST /auth/reset-password
 * Body: { email, code, newPassword }
 *
 * Validates the code, updates the password, invalidates the code,
 * and deletes all sessions for the user (force re-login).
 */
function handle_reset_password(): void {
    $body = get_json_body();

    $email       = trim($body['email'] ?? '');
    $code        = trim($body['code'] ?? '');
    $newPassword = $body['newPassword'] ?? '';

    if (empty($email) || empty($code) || empty($newPassword)) {
        json_error('Email, code, and new password are required.');
    }

    // Validate password strength
    $pwError = validate_password_strength($newPassword);
    if ($pwError) {
        json_error($pwError);
    }

    $db = getDB();

    // Look up user by email
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND role = 'client'");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        json_error('Invalid or expired reset code.', 400);
    }

    $userId = (int) $user['id'];

    // Find a matching, unused, non-expired code
    $stmt = $db->prepare("
        SELECT id FROM password_resets
        WHERE user_id = ? AND code = ? AND used = 0 AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
    ");
    $stmt->execute([$userId, $code]);
    $reset = $stmt->fetch();

    if (!$reset) {
        json_error('Invalid or expired reset code.', 400);
    }

    // ── Update password ──────────────────────────────────
    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$hash, $userId]);

    // ── Mark code as used ────────────────────────────────
    $stmt = $db->prepare("UPDATE password_resets SET used = 1 WHERE id = ?");
    $stmt->execute([(int) $reset['id']]);

    // ── Delete all sessions (force re-login) ─────────────
    $stmt = $db->prepare("DELETE FROM sessions WHERE user_id = ?");
    $stmt->execute([$userId]);

    json_response(['message' => 'Password has been reset successfully. You can now sign in.']);
}

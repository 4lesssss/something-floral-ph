<?php
/**
 * Something Floral PH — Database Configuration (TEMPLATE)
 * 
 * Copy this file to config.php and fill in your credentials.
 * config.php is gitignored — never commit real credentials.
 */

// Auto-detect environment
$is_local = in_array($_SERVER['HTTP_HOST'] ?? 'localhost', ['localhost', '127.0.0.1'])
         || strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;

if ($is_local) {
    // ─── Local Development (XAMPP / WAMP / MySQL) ───
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'sfph');
    define('DB_USER', 'root');
    define('DB_PASS', '');          // XAMPP default: empty
} else {
    // ─── InfinityFree Production ───
    define('DB_HOST', 'sql123.infinityfree.com');   // your IF MySQL host
    define('DB_NAME', 'if0_12345678_sfph');          // your IF database name
    define('DB_USER', 'if0_12345678');                // your IF username
    define('DB_PASS', 'your_password_here');           // your IF password
}

// ── Mail (Gmail SMTP via PHPMailer) ───────────────────────
// To send emails you need:
// 1. A Gmail account
// 2. An App Password (Google Account → Security → App Passwords)
define('MAIL_HOST',      'smtp.gmail.com');
define('MAIL_USERNAME',  'your-gmail@gmail.com');           // your Gmail address
define('MAIL_PASSWORD',  'xxxx xxxx xxxx xxxx');            // 16-char Google App Password
define('MAIL_FROM_NAME', 'Something Floral PH');

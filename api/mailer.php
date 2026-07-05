<?php
/**
 * Something Floral PH — Email Helper
 *
 * Provides a reusable send_email() function using PHPMailer + Gmail SMTP.
 * Requires MAIL_* constants to be defined in config.php.
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

/**
 * Send an HTML email via Gmail SMTP.
 *
 * @param  string $to        Recipient email address
 * @param  string $subject   Email subject line
 * @param  string $htmlBody  Full HTML body content
 * @return bool              True on success, false on failure
 * @throws Exception         On PHPMailer configuration errors
 */
function send_email(string $to, string $subject, string $htmlBody): bool {
    $mail = new PHPMailer(true);

    // SMTP configuration
    $mail->isSMTP();
    $mail->Host       = defined('MAIL_HOST') ? MAIL_HOST : 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = MAIL_USERNAME;
    $mail->Password   = MAIL_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    // Sender / recipient
    $mail->setFrom(MAIL_USERNAME, defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'Something Floral PH');
    $mail->addAddress($to);

    // Content
    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->Subject = $subject;
    $mail->Body    = $htmlBody;
    // Plain-text fallback: strip HTML tags
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $htmlBody));

    return $mail->send();
}

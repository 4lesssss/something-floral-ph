<?php
/**
 * Orders route handlers
 */

function handle_create_order(): void {
    // Accept both JSON body and FormData
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
        $body = get_json_body();
    } else {
        $body = $_POST;
    }

    $fullName       = trim($body['fullName'] ?? '');
    $contactNumber  = trim($body['contactNumber'] ?? '');
    $email          = trim($body['email'] ?? '');
    $bouquet        = trim($body['bouquet'] ?? '');
    $quantity       = (int) ($body['quantity'] ?? 1);
    $unitPrice      = (int) ($body['unitPrice'] ?? 0);
    $pickupLocation = trim($body['pickupLocation'] ?? '');
    $pickupDate     = trim($body['pickupDate'] ?? '');
    $messageNote    = trim($body['messageNote'] ?? '');
    $clientId       = !empty($body['clientId']) ? (int) $body['clientId'] : null;

    // ── Validation ───────────────────────────────────────
    $errors = [];

    if (empty($fullName)) {
        $errors[] = 'Full name is required.';
    } elseif (mb_strlen($fullName) > 50) {
        $errors[] = 'Full name must be 50 characters or fewer.';
    }

    if (empty($email)) {
        $errors[] = 'Email is required.';
    } elseif (!validate_email($email)) {
        $errors[] = 'Please enter a valid email address.';
    }

    if (empty($contactNumber)) {
        $errors[] = 'Contact number is required.';
    } elseif (!validate_phone($contactNumber)) {
        $errors[] = 'Contact number must be a valid PH mobile number (e.g. 09171234567).';
    }

    if (empty($bouquet)) {
        $errors[] = 'Please select a bouquet.';
    }

    if ($quantity < 1 || $quantity > 10) {
        $errors[] = 'Quantity must be between 1 and 10.';
    }

    if (empty($pickupLocation)) {
        $errors[] = 'Please select a pickup location.';
    }

    if (empty($pickupDate)) {
        $errors[] = 'Pickup date is required.';
    } elseif (!validate_date_not_past($pickupDate)) {
        $errors[] = 'Pickup date cannot be in the past. Please choose today or a future date.';
    }

    if (mb_strlen($messageNote) > 150) {
        $errors[] = 'Message note must be 150 characters or fewer.';
    }

    if (!empty($errors)) {
        json_error(implode(' ', $errors), 422);
    }

    // ── Verify bouquet exists and get correct price ──────
    $db = getDB();
    $stmt = $db->prepare("SELECT price FROM products WHERE name = ?");
    $stmt->execute([$bouquet]);
    $product = $stmt->fetch();

    if (!$product) {
        json_error('Selected bouquet not found. Please choose a valid bouquet.', 422);
    }

    $unitPrice = (int) $product['price'];

    $totalPrice = $unitPrice * $quantity;
    $orderId    = generate_order_id();

    // ── Insert order ─────────────────────────────────────
    $stmt = $db->prepare("
        INSERT INTO orders
            (id, full_name, contact_number, email, bouquet, quantity, unit_price,
             total_price, pickup_location, pickup_date, message_note,
             payment_method, status, client_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Cash on Pickup', 'pending', ?)
    ");
    $stmt->execute([
        $orderId, $fullName, $contactNumber, $email, $bouquet,
        $quantity, $unitPrice, $totalPrice, $pickupLocation,
        $pickupDate, $messageNote, $clientId
    ]);

    // ── Send confirmation email (non-blocking) ─────────
    try {
        require_once __DIR__ . '/../mailer.php';

        $pickupDateFormatted = date('F j, Y', strtotime($pickupDate));
        $totalFormatted      = '₱' . number_format($totalPrice);
        $unitFormatted       = '₱' . number_format($unitPrice);

        $htmlBody = "
        <div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #f2a2b1;\">
            <div style=\"background: linear-gradient(135deg, #f7c5cc 0%, #f2a2b1 100%); padding: 28px 24px; text-align: center;\">
                <h1 style=\"margin: 0; color: #7b2d3f; font-size: 22px;\">🌸 Reservation Confirmed!</h1>
                <p style=\"margin: 8px 0 0; color: #a94560; font-size: 14px;\">Thank you for your order, {$fullName}.</p>
            </div>
            <div style=\"padding: 24px;\">
                <table style=\"width: 100%; border-collapse: collapse; font-size: 14px; color: #444;\">
                    <tr><td style=\"padding: 8px 0; color: #999;\">Order ID</td><td style=\"padding: 8px 0; text-align: right; font-weight: 700;\">{$orderId}</td></tr>
                    <tr><td style=\"padding: 8px 0; color: #999;\">Bouquet</td><td style=\"padding: 8px 0; text-align: right;\">{$bouquet}</td></tr>
                    <tr><td style=\"padding: 8px 0; color: #999;\">Quantity</td><td style=\"padding: 8px 0; text-align: right;\">{$quantity}</td></tr>
                    <tr><td style=\"padding: 8px 0; color: #999;\">Unit Price</td><td style=\"padding: 8px 0; text-align: right;\">{$unitFormatted}</td></tr>
                    <tr style=\"border-top: 2px solid #f2a2b1;\"><td style=\"padding: 10px 0; font-weight: 700; color: #7b2d3f;\">Total</td><td style=\"padding: 10px 0; text-align: right; font-weight: 700; color: #7b2d3f; font-size: 16px;\">{$totalFormatted}</td></tr>
                    <tr><td style=\"padding: 8px 0; color: #999;\">Pickup Location</td><td style=\"padding: 8px 0; text-align: right;\">{$pickupLocation}</td></tr>
                    <tr><td style=\"padding: 8px 0; color: #999;\">Pickup Date</td><td style=\"padding: 8px 0; text-align: right;\">{$pickupDateFormatted}</td></tr>
                    <tr><td style=\"padding: 8px 0; color: #999;\">Payment</td><td style=\"padding: 8px 0; text-align: right;\">Cash on Pickup</td></tr>
                </table>
            </div>
            <div style=\"background: #fdf6f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #999;\">
                Something Floral PH &mdash; Handcrafted with love 🌷
            </div>
        </div>";

        send_email($email, "Order Confirmed — {$orderId} | Something Floral PH", $htmlBody);
    } catch (\Throwable $mailErr) {
        error_log('[SFPH] Mail error for order ' . $orderId . ': ' . $mailErr->getMessage());
    }

    json_response([
        'id'             => $orderId,
        'fullName'       => $fullName,
        'contactNumber'  => $contactNumber,
        'email'          => $email,
        'bouquet'        => $bouquet,
        'quantity'       => $quantity,
        'unitPrice'      => $unitPrice,
        'totalPrice'     => $totalPrice,
        'pickupLocation' => $pickupLocation,
        'pickupDate'     => $pickupDate,
        'messageNote'    => $messageNote,
        'paymentMethod'  => 'Cash on Pickup',
        'status'         => 'pending',
        'createdAt'      => date('c'),
    ], 201);
}

function handle_get_order(string $id): void {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    $r = $stmt->fetch();

    if (!$r) {
        json_error('Order not found', 404);
    }

    json_response([
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
    ]);
}

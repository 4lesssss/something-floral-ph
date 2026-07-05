<?php
/**
 * Admin route handlers — stats, orders, order status, clients
 */

function handle_admin_stats(): void {
    $user = require_auth('admin');
    $db = getDB();

    $stmt = $db->query("
        SELECT
            COUNT(*)                                           AS total,
            SUM(status = 'pending')                            AS pending,
            SUM(status = 'preparing')                          AS preparing,
            SUM(status = 'ready')                              AS ready,
            SUM(status = 'completed')                          AS completed,
            SUM(status = 'cancelled')                          AS cancelled,
            COALESCE(SUM(total_price), 0)                      AS revenue
        FROM orders
    ");
    $s = $stmt->fetch();

    json_response([
        'total'     => (int) $s['total'],
        'pending'   => (int) $s['pending'],
        'preparing' => (int) $s['preparing'],
        'ready'     => (int) $s['ready'],
        'completed' => (int) $s['completed'],
        'cancelled' => (int) $s['cancelled'],
        'revenue'   => (int) $s['revenue'],
    ]);
}

function handle_admin_orders(): void {
    $user = require_auth('admin');
    $db = getDB();

    $rows = $db->query("SELECT * FROM orders ORDER BY created_at DESC")->fetchAll();

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
            'clientId'       => $r['client_id'] ? (int) $r['client_id'] : null,
            'createdAt'      => $r['created_at'],
        ];
    }, $rows);

    json_response($orders);
}

function handle_update_order_status(string $orderId): void {
    $user = require_auth('admin');
    $body = get_json_body();
    $db = getDB();

    $status = $body['status'] ?? '';
    $valid  = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!in_array($status, $valid)) {
        json_error('Invalid status. Must be one of: ' . implode(', ', $valid));
    }

    $stmt = $db->prepare("SELECT id FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    if (!$stmt->fetch()) {
        json_error('Order not found', 404);
    }

    $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$status, $orderId]);

    json_response(['message' => 'Order status updated', 'status' => $status]);
}

function handle_admin_clients(): void {
    $user = require_auth('admin');
    $db = getDB();

    $rows = $db->query("
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
               COUNT(o.id) AS order_count
        FROM users u
        LEFT JOIN orders o ON o.client_id = u.id
        WHERE u.role = 'client'
        GROUP BY u.id
        ORDER BY u.created_at DESC
    ")->fetchAll();

    $clients = array_map(function ($r) {
        return [
            'id'         => (int) $r['id'],
            'firstName'  => $r['first_name'],
            'lastName'   => $r['last_name'],
            'email'      => $r['email'],
            'phone'      => $r['phone'],
            'joined'     => $r['created_at'],
            'orderCount' => (int) $r['order_count'],
        ];
    }, $rows);

    json_response($clients);
}

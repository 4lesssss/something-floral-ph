<?php
/**
 * Products route handlers
 */

function handle_get_products(): void {
    $db = getDB();
    $rows = $db->query("SELECT * FROM products ORDER BY created_at DESC")->fetchAll();

    $products = array_map(function ($r) {
        return [
            'id'          => (int) $r['id'],
            'name'        => $r['name'],
            'price'       => (int) $r['price'],
            'description' => $r['description'],
            'category'    => $r['category'],
            'image'       => $r['image'],
            'stock'       => $r['stock'],
        ];
    }, $rows);

    json_response($products);
}

function handle_update_product(int $id): void {
    $user = require_auth('admin');
    $body = get_json_body();

    $db = getDB();

    // Check product exists
    $stmt = $db->prepare("SELECT id FROM products WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        json_error('Product not found', 404);
    }

    // Build update fields
    $fields = [];
    $params = [];

    if (isset($body['price'])) {
        $price = (int) $body['price'];
        if ($price < 0) json_error('Price must be positive');
        $fields[] = 'price = ?';
        $params[] = $price;
    }
    if (isset($body['name'])) {
        $fields[] = 'name = ?';
        $params[] = trim($body['name']);
    }
    if (isset($body['description'])) {
        $fields[] = 'description = ?';
        $params[] = trim($body['description']);
    }
    if (isset($body['category'])) {
        $fields[] = 'category = ?';
        $params[] = $body['category'];
    }
    if (isset($body['stock'])) {
        $fields[] = 'stock = ?';
        $params[] = $body['stock'];
    }

    if (empty($fields)) {
        json_error('No fields to update');
    }

    $params[] = $id;
    $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
    $db->prepare($sql)->execute($params);

    // Return updated product
    $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $r = $stmt->fetch();

    json_response([
        'id'          => (int) $r['id'],
        'name'        => $r['name'],
        'price'       => (int) $r['price'],
        'description' => $r['description'],
        'category'    => $r['category'],
        'image'       => $r['image'],
        'stock'       => $r['stock'],
    ]);
}

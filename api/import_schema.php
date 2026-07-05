<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=sfph', 'root', '');
    $sql = file_get_contents('sql/schema.sql');
    $pdo->exec($sql);
    echo "Schema imported.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

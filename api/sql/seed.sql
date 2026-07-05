-- ============================================================
-- Something Floral PH — Seed Data
-- Run after schema.sql: mysql -u root -p sfph < seed.sql
-- ============================================================



-- -----------------------------------------------------------
-- Admin user  (username: admin / password: floral2026)
-- Hash generated with password_hash('floral2026', PASSWORD_DEFAULT)
-- -----------------------------------------------------------
INSERT INTO users (first_name, last_name, email, phone, username, password_hash, role) VALUES
('Admin', 'User', 'admin@somethingfloralph.com', NULL, 'admin',
 '$2y$10$8KzQzE1HhVqXBHYkGq4OQeJvXxFwCzBdNvfT0jKqYVK1sMvMRn3Hy', 'admin');

-- -----------------------------------------------------------
-- Sample client  (email: maria@test.com / password: flower123)
-- -----------------------------------------------------------
INSERT INTO users (first_name, last_name, email, phone, password_hash, role) VALUES
('Maria', 'Santos', 'maria@test.com', '09171234567',
 '$2y$10$wQjPdRqWo6hZcDqZxGz8kuqB5xTgnW0V0Aa.IrKzK5YPYPAYvLcWe', 'client');

-- -----------------------------------------------------------
-- Products (bouquets)
-- -----------------------------------------------------------
INSERT INTO products (name, price, description, category, image, stock) VALUES
('Ellise',       599, 'Imported roses paired with carnations and eucalyptus for an elegant, romantic arrangement.', 'roses', 'ellise.png', 'in_stock'),
('Amara',        750, 'Luxurious deep-red roses with baby''s breath and premium wrapping for a showstopping gift.', 'roses', 'amara.png', 'in_stock'),
('Chloe',        499, 'Soft pastel blooms with daisies and greenery — sweet and cheerful for any occasion.', 'mixed', 'chloe.png', 'in_stock'),
('Hannah',       650, 'Sunflowers and warm-toned fillers in rustic kraft wrap — bright and joyful.', 'seasonal', 'hannah.png', 'in_stock'),
('Thea',         550, 'A graceful mix of tulips and spray roses in blush and cream tones.', 'mixed', 'thea.png', 'in_stock'),
('Valerie',      699, 'Rich burgundy and mauve roses with dried accents for a moody, romantic feel.', 'roses', 'valerie.png', 'low_stock'),
('Zoe',          450, 'Cheerful seasonal wildflowers in a fun, colorful hand-tied arrangement.', 'seasonal', 'zoe.png', 'in_stock'),
('Amber',        799, 'Premium long-stem roses with golden accents and luxury satin ribbon.', 'roses', 'amber.png', 'in_stock'),
('Thumbelina',   399, 'Petite and charming — a mini bouquet of mixed blooms perfect for everyday surprises.', 'mixed', 'thumbelina.png', 'in_stock'),
('Blush Rose Garden', 549, 'Garden-style pink roses with lisianthus and eucalyptus in a romantic palette.', 'roses', 'blush-rose-garden.png', 'in_stock'),
('Lavender Dream',    579, 'Purple-toned blooms with lavender sprigs and soft greens for a dreamy aesthetic.', 'seasonal', 'lavender-dream.png', 'low_stock');

-- -----------------------------------------------------------
-- Schedule (pop-up events)
-- -----------------------------------------------------------
INSERT INTO schedule (title, venue, month, day, dow, time, status, icon, doodle, card_class) VALUES
('Mapúa University',        'Mapúa Campus, Intramuros',           'Jun', 16, 'Mon', '9 AM – 4 PM',  'open',    '🏫', '✿', 'card--pink'),
('FEU Manila',              'FEU Main Gate Area',                 'Jun', 18, 'Wed', '10 AM – 5 PM', 'open',    '🏫', '🌸', 'card--green'),
('DLSU Taft',               'De La Salle University, Taft Ave',   'Jun', 20, 'Fri', '9 AM – 3 PM',  'limited', '🏫', '♡',  'card--blue'),
('UST España',              'University of Santo Tomas, España',  'Jun', 23, 'Mon', '10 AM – 4 PM', 'open',    '🏫', '✦',  'card--pink'),
('Yardstick Coffee Makati', 'Yardstick Coffee, Valero St, Makati','Jun', 25, 'Wed', '11 AM – 6 PM', 'open',    '☕', '🌷', 'card--green'),
('Mapúa University',        'Mapúa Campus, Intramuros',           'Jun', 27, 'Fri', '9 AM – 4 PM',  'limited', '🏫', '✿', 'card--blue'),
('Common Room BGC',         'Common Room Coffee, BGC',            'Jun', 30, 'Mon', '10 AM – 5 PM', 'open',    '☕', '🌸', 'card--pink'),
('FEU Manila',              'FEU Main Gate Area',                 'Jul',  2, 'Wed', '10 AM – 5 PM', 'open',    '🏫', '♡',  'card--green');

-- -----------------------------------------------------------
-- Sample orders
-- -----------------------------------------------------------
INSERT INTO orders (id, full_name, contact_number, email, bouquet, quantity, unit_price, total_price, pickup_location, pickup_date, message_note, payment_method, status, client_id) VALUES
('SFPH-0001', 'Maria Santos', '09171234567', 'maria@test.com', 'Ellise', 2, 599, 1198, 'Mapúa University', '2026-06-30', 'Happy birthday, bestie!', 'Cash on Pickup', 'pending', 2),
('SFPH-0002', 'Maria Santos', '09171234567', 'maria@test.com', 'Chloe',  1, 499,  499, 'De La Salle University (DLSU)', '2026-07-02', '', 'Cash on Pickup', 'preparing', 2),
('SFPH-0003', 'Juan Dela Cruz', '09281234567', 'juan@email.com', 'Hannah', 1, 650, 650, 'University of Santo Tomas (UST)', '2026-07-05', 'Congrats on graduating!', 'Cash on Pickup', 'completed', NULL);

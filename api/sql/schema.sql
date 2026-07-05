
-- -----------------------------------------------------------
-- Users (clients + admin)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    first_name  VARCHAR(50)   NOT NULL,
    last_name   VARCHAR(50)   NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    phone       VARCHAR(11)   DEFAULT NULL,
    username    VARCHAR(50)   DEFAULT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role        ENUM('client','admin') NOT NULL DEFAULT 'client',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Sessions (token-based auth for SPA)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    token       VARCHAR(64)  NOT NULL UNIQUE,
    user_id     INT          NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME     NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Products (bouquets)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    price       INT          NOT NULL,
    description TEXT         NOT NULL,
    category    ENUM('roses','mixed','seasonal') NOT NULL DEFAULT 'mixed',
    image       VARCHAR(100) NOT NULL,
    stock       ENUM('in_stock','low_stock','pre_order','out_of_stock') NOT NULL DEFAULT 'in_stock',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Schedule (pop-up events)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(100) NOT NULL,
    venue       VARCHAR(200) NOT NULL,
    month       VARCHAR(20)  NOT NULL,
    day         INT          NOT NULL,
    dow         VARCHAR(10)  NOT NULL,
    time        VARCHAR(50)  NOT NULL,
    status      ENUM('open','limited','closed') NOT NULL DEFAULT 'open',
    icon        VARCHAR(10)  DEFAULT '',
    doodle      VARCHAR(10)  DEFAULT '',
    card_class  VARCHAR(50)  DEFAULT '',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Orders / Reservations
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id              VARCHAR(20)  PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    contact_number  VARCHAR(11)  NOT NULL,
    email           VARCHAR(150) NOT NULL,
    bouquet         VARCHAR(100) NOT NULL,
    quantity        INT          NOT NULL DEFAULT 1,
    unit_price      INT          NOT NULL,
    total_price     INT          NOT NULL,
    pickup_location VARCHAR(200) NOT NULL,
    pickup_date     DATE         NOT NULL,
    message_note    VARCHAR(150) DEFAULT '',
    payment_method  VARCHAR(50)  NOT NULL DEFAULT 'Cash on Pickup',
    status          ENUM('pending','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
    client_id       INT          DEFAULT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Inquiries (contact messages from visitors / clients)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)   NOT NULL,
    email       VARCHAR(150)  NOT NULL,
    phone       VARCHAR(11)   DEFAULT NULL,
    subject     VARCHAR(150)  NOT NULL,
    message     TEXT          NOT NULL,
    is_read     TINYINT(1)    NOT NULL DEFAULT 0,
    client_id   INT           DEFAULT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Inquiry Replies (threaded replies from admin or client)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiry_replies (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    inquiry_id  INT           NOT NULL,
    sender_role ENUM('admin','client') NOT NULL,
    sender_name VARCHAR(50)   NOT NULL,
    message     TEXT          NOT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Password Resets (6-digit codes for forgot-password flow)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    code        VARCHAR(6)   NOT NULL,
    expires_at  DATETIME     NOT NULL,
    used        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

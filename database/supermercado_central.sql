-- Supermercado Central - Banco MySQL/MariaDB
-- Compatível com hospedagens que ofereçam MySQL 5.7+/8.x ou MariaDB 10.3+
-- Importe este arquivo dentro de um banco já criado no cPanel/phpMyAdmin.

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  icon VARCHAR(32) NOT NULL DEFAULT '🛒',
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY categories_slug_unique (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(80) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100) NOT NULL DEFAULT '',
  brand VARCHAR(160) NOT NULL DEFAULT '',
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  category_id VARCHAR(80) NOT NULL,
  price_cents INT NOT NULL,
  old_price_cents INT NULL,
  cost_cents INT NOT NULL DEFAULT 0,
  unit VARCHAR(80) NOT NULL,
  sale_mode VARCHAR(20) NOT NULL DEFAULT 'unit',
  quantity_step_millis INT NOT NULL DEFAULT 1000,
  minimum_quantity_millis INT NOT NULL DEFAULT 1000,
  options_json TEXT NOT NULL,
  image_url TEXT NOT NULL,
  badge VARCHAR(100) NOT NULL DEFAULT '',
  stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  min_stock DECIMAL(12,3) NOT NULL DEFAULT 5.000,
  active TINYINT(1) NOT NULL DEFAULT 1,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  offer_start DATETIME NULL,
  offer_end DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY products_sku_unique (sku),
  UNIQUE KEY products_slug_unique (slug),
  KEY products_category_idx (category_id),
  KEY products_active_featured_idx (active, featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_settings (
  id INT NOT NULL DEFAULT 1,
  store_name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(32) NOT NULL DEFAULT '5500000000000',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  maps_url TEXT NOT NULL,
  hours VARCHAR(180) NOT NULL DEFAULT 'Seg–Sáb: 7h às 20h',
  payment_methods VARCHAR(255) NOT NULL DEFAULT 'PIX, Dinheiro, Cartão',
  pix_key VARCHAR(255) NOT NULL DEFAULT '',
  pix_merchant_name VARCHAR(25) NOT NULL DEFAULT 'SUPERMERCADO CENTRAL',
  pix_merchant_city VARCHAR(15) NOT NULL DEFAULT 'MACEIO',
  minimum_order_cents INT NOT NULL DEFAULT 3000,
  allow_pickup TINYINT(1) NOT NULL DEFAULT 1,
  allow_delivery TINYINT(1) NOT NULL DEFAULT 1,
  substitution_policy VARCHAR(40) NOT NULL DEFAULT 'confirm',
  announcement TEXT NOT NULL,
  loyalty_enabled TINYINT(1) NOT NULL DEFAULT 1,
  points_per_real INT NOT NULL DEFAULT 1,
  review_enabled TINYINT(1) NOT NULL DEFAULT 1,
  flash_offer_title VARCHAR(180) NOT NULL DEFAULT 'Oferta-relâmpago',
  abandoned_cart_hours INT NOT NULL DEFAULT 24,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS delivery_zones (
  id VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  fee_cents INT NOT NULL DEFAULT 0,
  minimum_order_cents INT NOT NULL DEFAULT 0,
  free_shipping_cents INT NOT NULL DEFAULT 0,
  eta VARCHAR(80) NOT NULL DEFAULT '40–70 min',
  active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
  code VARCHAR(80) NOT NULL,
  type VARCHAR(30) NOT NULL,
  value INT NOT NULL,
  max_discount_cents INT NULL,
  minimum_cents INT NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  usage_limit INT NOT NULL DEFAULT 0,
  used_count INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT NOT NULL,
  image_url TEXT NOT NULL,
  cta_label VARCHAR(120) NOT NULL DEFAULT 'Ver ofertas',
  cta_url TEXT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS home_content (
  id INT NOT NULL DEFAULT 1,
  about_eyebrow VARCHAR(180) NOT NULL DEFAULT 'PERTINHO DE VOCÊ',
  about_title TEXT NOT NULL,
  about_text TEXT NOT NULL,
  storefront_image_url TEXT NOT NULL,
  interior_image_url TEXT NOT NULL,
  team_image_url TEXT NOT NULL,
  flyer_eyebrow VARCHAR(180) NOT NULL DEFAULT 'ENCARTE DA SEMANA',
  flyer_title TEXT NOT NULL,
  flyer_subtitle TEXT NOT NULL,
  flyer_image_url TEXT NOT NULL,
  flyer_cta_label VARCHAR(180) NOT NULL DEFAULT 'Ver todas as ofertas',
  flyer_cta_url TEXT NOT NULL,
  flyer_starts_at DATETIME NULL,
  flyer_ends_at DATETIME NULL,
  flyer_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id INT NOT NULL AUTO_INCREMENT,
  order_number VARCHAR(80) NOT NULL,
  request_key VARCHAR(120) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'whatsapp_pending',
  tracking_token VARCHAR(80) NULL,
  review_token VARCHAR(80) NULL,
  stock_committed TINYINT(1) NOT NULL DEFAULT 0,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  postal_code VARCHAR(16) NOT NULL DEFAULT '',
  city VARCHAR(120) NOT NULL DEFAULT '',
  state VARCHAR(8) NOT NULL DEFAULT '',
  delivery_type VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  neighborhood VARCHAR(160) NOT NULL DEFAULT '',
  reference TEXT NOT NULL,
  payment_method VARCHAR(80) NOT NULL,
  change_for_cents INT NULL,
  scheduled_for VARCHAR(160) NOT NULL DEFAULT 'Assim que possível',
  notes TEXT NOT NULL,
  substitution VARCHAR(40) NOT NULL DEFAULT 'confirm',
  coupon_code VARCHAR(80) NULL,
  subtotal_cents INT NOT NULL,
  discount_cents INT NOT NULL DEFAULT 0,
  delivery_fee_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL,
  cost_total_cents INT NOT NULL DEFAULT 0,
  loyalty_points_earned INT NOT NULL DEFAULT 0,
  loyalty_committed TINYINT(1) NOT NULL DEFAULT 0,
  referral_bonus_committed TINYINT(1) NOT NULL DEFAULT 0,
  referral_code VARCHAR(80) NOT NULL DEFAULT '',
  item_count INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY orders_order_number_unique (order_number),
  UNIQUE KEY orders_request_key_unique (request_key),
  UNIQUE KEY orders_tracking_token_unique (tracking_token),
  UNIQUE KEY orders_review_token_unique (review_token),
  KEY orders_customer_phone_idx (customer_phone),
  KEY orders_created_at_idx (created_at),
  KEY orders_status_idx (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT NOT NULL AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id VARCHAR(80) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  unit VARCHAR(80) NOT NULL,
  quantity INT NOT NULL,
  quantity_millis INT NOT NULL DEFAULT 1000,
  option_id VARCHAR(80) NOT NULL DEFAULT '',
  option_label VARCHAR(160) NOT NULL DEFAULT '',
  substitution VARCHAR(40) NOT NULL DEFAULT 'confirm',
  unit_price_cents INT NOT NULL,
  unit_cost_cents INT NOT NULL DEFAULT 0,
  category_name VARCHAR(160) NOT NULL DEFAULT '',
  total_cents INT NOT NULL,
  PRIMARY KEY (id),
  KEY order_items_order_idx (order_id),
  KEY order_items_product_idx (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shopping_lists (
  id VARCHAR(80) NOT NULL,
  owner_token VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  items_json TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY shopping_lists_owner_token_idx (owner_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_notifications (
  id VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  url TEXT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  published_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY store_notifications_schedule_idx (active, published_at, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
  id INT NOT NULL AUTO_INCREMENT,
  phone VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  points INT NOT NULL DEFAULT 0,
  lifetime_value_cents INT NOT NULL DEFAULT 0,
  order_count INT NOT NULL DEFAULT 0,
  referral_code VARCHAR(80) NOT NULL,
  referred_by VARCHAR(80) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY customers_phone_unique (phone),
  UNIQUE KEY customers_referral_code_unique (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id INT NOT NULL AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id VARCHAR(80) NULL,
  customer_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL,
  comment TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY reviews_order_id_unique (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT NOT NULL AUTO_INCREMENT,
  order_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  note TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY order_status_history_order_idx (order_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS metrics (
  id INT NOT NULL AUTO_INCREMENT,
  event VARCHAR(80) NOT NULL,
  product_id VARCHAR(80) NULL,
  session_key VARCHAR(120) NOT NULL DEFAULT 'anonymous',
  metadata TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY metrics_event_created_idx (event, created_at),
  KEY metrics_product_idx (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT NOT NULL AUTO_INCREMENT,
  actor_email VARCHAR(255) NOT NULL,
  action VARCHAR(120) NOT NULL,
  entity VARCHAR(120) NOT NULL,
  entity_id VARCHAR(120) NOT NULL DEFAULT '',
  details TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY audit_logs_actor_idx (actor_email),
  KEY audit_logs_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(40) NOT NULL DEFAULT 'manager',
  permissions_json TEXT NOT NULL,
  mfa_required TINYINT(1) NOT NULL DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY staff_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS security_settings (
  id INT NOT NULL DEFAULT 1,
  require_mfa TINYINT(1) NOT NULL DEFAULT 1,
  require_owner_approval TINYINT(1) NOT NULL DEFAULT 1,
  new_device_alerts TINYINT(1) NOT NULL DEFAULT 1,
  updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_approvals (
  id VARCHAR(80) NOT NULL,
  action VARCHAR(160) NOT NULL,
  payload_json TEXT NOT NULL,
  payload_hash VARCHAR(128) NOT NULL,
  summary TEXT NOT NULL,
  requested_by VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  reviewed_by VARCHAR(255) NULL,
  reviewed_at DATETIME NULL,
  executed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY admin_approvals_status_idx (status, created_at),
  KEY admin_approvals_requester_idx (requested_by, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_devices (
  id VARCHAR(80) NOT NULL,
  actor_email VARCHAR(255) NOT NULL,
  label VARCHAR(180) NOT NULL,
  user_agent TEXT NOT NULL,
  first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY admin_devices_actor_idx (actor_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INT NOT NULL AUTO_INCREMENT,
  product_id VARCHAR(80) NOT NULL,
  movement_type VARCHAR(80) NOT NULL,
  quantity_delta_millis INT NOT NULL,
  previous_quantity_millis INT NOT NULL,
  new_quantity_millis INT NOT NULL,
  reason VARCHAR(255) NOT NULL DEFAULT '',
  reference_type VARCHAR(80) NOT NULL DEFAULT 'manual',
  reference_id VARCHAR(120) NOT NULL DEFAULT '',
  actor_email VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY inventory_movements_product_idx (product_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados iniciais -------------------------------------------------------------
INSERT IGNORE INTO categories (id,name,slug,icon,sort_order,active) VALUES
('mercearia','Mercearia','mercearia','🛒',1,1),
('hortifruti','Hortifruti','hortifruti','🥬',2,1),
('acougue','Açougue','acougue','🥩',3,1),
('padaria','Padaria','padaria','🥖',4,1),
('bebidas','Bebidas','bebidas','🥤',5,1),
('laticinios','Laticínios','laticinios','🧀',6,1),
('limpeza','Casa & Limpeza','limpeza','🧼',7,1);

INSERT INTO store_settings (
  id,store_name,whatsapp,phone,address,maps_url,hours,payment_methods,pix_key,
  pix_merchant_name,pix_merchant_city,minimum_order_cents,allow_pickup,
  allow_delivery,substitution_policy,announcement,loyalty_enabled,
  points_per_real,review_enabled,flash_offer_title,abandoned_cart_hours
) VALUES (
  1,'Supermercado Central','5582982016966','(82) 98201-6966',
  'Avenida Deputado Elisio da Silva Maia, 19 - Centro, São José da Tapera - AL',
  'https://www.google.com/maps/search/?api=1&query=Avenida+Deputado+Elisio+da+Silva+Maia%2C+19+-+Centro%2C+S%C3%A3o+Jos%C3%A9+da+Tapera+-+Alagoas',
  '7h30 às 21h','PIX, Dinheiro, Cartão','','SUPERMERCADO CENTRAL','MACEIO',3000,1,1,
  'confirm','Ofertas especiais todos os dias',1,1,1,'Oferta-relâmpago',24
) ON DUPLICATE KEY UPDATE
  store_name=VALUES(store_name),whatsapp=VALUES(whatsapp),phone=VALUES(phone),
  address=VALUES(address),maps_url=VALUES(maps_url),hours=VALUES(hours),
  updated_at=CURRENT_TIMESTAMP;

INSERT IGNORE INTO delivery_zones (id,name,fee_cents,minimum_order_cents,free_shipping_cents,eta,active) VALUES
('centro','Centro',500,3000,15000,'35–55 min',1),
('outros','Outros bairros',800,5000,20000,'50–80 min',1);

INSERT IGNORE INTO banners (id,title,subtitle,image_url,cta_label,cta_url,active,sort_order) VALUES
('oferta-semana','Até 30% OFF','Ofertas selecionadas desta semana','','Aproveitar','#ofertas',1,1);

INSERT IGNORE INTO coupons (code,type,value,max_discount_cents,minimum_cents,usage_limit,active) VALUES
('BEMVINDO10','percent',10,2000,5000,0,1);

INSERT IGNORE INTO products (
  id,sku,barcode,brand,name,slug,description,category_id,price_cents,old_price_cents,
  cost_cents,unit,sale_mode,quantity_step_millis,minimum_quantity_millis,options_json,
  image_url,badge,stock_quantity,min_stock,active,featured
) VALUES
('1','SC-0001','','','Arroz Branco Tipo 1','arroz-branco-tipo-1','Pacote econômico selecionado para a sua família.','mercearia',2499,2990,0,'Pacote 5kg','unit',1000,1000,'[]','https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=85','Oferta',50,5,1,1),
('2','SC-0002','','','Feijão Carioca','feijao-carioca','Grãos selecionados para uma refeição saborosa.','mercearia',799,949,0,'Pacote 1kg','unit',1000,1000,'[]','https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=700&q=85','-16%',50,5,1,0),
('3','SC-0003','','Central','Leite Integral','leite-integral','Leite integral para o café da manhã.','laticinios',549,NULL,0,'Caixa 1L','unit',1000,1000,'[{"id":"1l","label":"Caixa 1L","priceCents":549,"oldPriceCents":null,"barcode":""},{"id":"fardo-12","label":"Fardo com 12 unidades","priceCents":6290,"oldPriceCents":6590,"barcode":""}]','https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=700&q=85','',50,5,1,0),
('4','SC-0004','','','Café Torrado e Moído','cafe-torrado-e-moido','Aroma e sabor para começar bem o dia.','mercearia',1690,1990,0,'Pacote 500g','unit',1000,1000,'[]','https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=700&q=85','Oferta',50,5,1,1),
('5','SC-0005','','','Banana Prata','banana-prata','Frutas selecionadas diariamente.','hortifruti',579,NULL,0,'1kg aprox.','weight',250,500,'[]','https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=700&q=85','',50,5,1,0),
('6','SC-0006','','','Tomate Selecionado','tomate-selecionado','Fresquinho para saladas e receitas.','hortifruti',749,899,0,'1kg aprox.','weight',250,500,'[]','https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=700&q=85','Fresquinho',50,5,1,0),
('7','SC-0007','','','Refrigerante Cola','refrigerante-cola','Gelado combina ainda mais com sua refeição.','bebidas',999,NULL,0,'Garrafa 2L','unit',1000,1000,'[{"id":"2l","label":"Garrafa 2L","priceCents":999,"oldPriceCents":null,"barcode":""},{"id":"fardo-6","label":"Fardo com 6 garrafas","priceCents":5690,"oldPriceCents":5990,"barcode":""}]','https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=700&q=85','',50,5,1,0),
('8','SC-0008','','','Carne Bovina para Bife','carne-bovina-para-bife','Corte selecionado no açougue.','acougue',3490,3990,0,'1kg aprox.','weight',250,500,'[]','https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=700&q=85','Oferta',50,5,1,1),
('9','SC-0009','','','Pão Francês Fresquinho','pao-frances-fresquinho','Assado todos os dias na nossa padaria.','padaria',1490,NULL,0,'1kg aprox.','weight',250,500,'[]','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=85','',50,5,1,0),
('10','SC-0010','','','Queijo Muçarela','queijo-mucarela','Fatiado ou em peça, como você preferir.','laticinios',4290,NULL,0,'1kg aprox.','weight',250,500,'[]','https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=700&q=85','',50,5,1,0);

INSERT INTO home_content (
  id,about_eyebrow,about_title,about_text,storefront_image_url,interior_image_url,
  team_image_url,flyer_eyebrow,flyer_title,flyer_subtitle,flyer_image_url,
  flyer_cta_label,flyer_cta_url,flyer_active
) VALUES (
  1,'PERTINHO DE VOCÊ','Qualidade e atendimento que fazem parte da sua rotina.',
  'Uma experiência de compra pensada para as famílias de São José da Tapera, com variedade, cuidado e atendimento próximo.',
  '','','','ENCARTE DA SEMANA','Economia para encher o carrinho.',
  'Uma seleção atualizada de ofertas para você aproveitar pelo site ou na loja.',
  '','Ver todas as ofertas','#ofertas',1
) ON DUPLICATE KEY UPDATE id=id;

INSERT INTO security_settings (id,require_mfa,require_owner_approval,new_device_alerts,updated_by)
VALUES (1,1,1,1,'system') ON DUPLICATE KEY UPDATE id=id;

-- Armazenamento portável de mídia e backups -------------------------------
CREATE TABLE IF NOT EXISTS media_files (
  `key` VARCHAR(190) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  data_blob MEDIUMBLOB NOT NULL,
  size_bytes INT NOT NULL,
  uploaded_by VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`),
  KEY media_files_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS catalog_backups (
  `key` VARCHAR(190) NOT NULL,
  data_json LONGTEXT NOT NULL,
  size_bytes INT NOT NULL,
  reason VARCHAR(255) NOT NULL DEFAULT 'backup automático',
  actor_email VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`),
  KEY catalog_backups_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

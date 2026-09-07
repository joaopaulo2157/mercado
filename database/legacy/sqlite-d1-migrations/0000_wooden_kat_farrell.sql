CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text DEFAULT '' NOT NULL,
	`details` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`cta_label` text DEFAULT 'Ver ofertas' NOT NULL,
	`cta_url` text DEFAULT '#ofertas' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`icon` text DEFAULT '🛒' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`code` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`value` integer NOT NULL,
	`max_discount_cents` integer,
	`minimum_cents` integer DEFAULT 0 NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`usage_limit` integer DEFAULT 0 NOT NULL,
	`used_count` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `delivery_zones` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`fee_cents` integer DEFAULT 0 NOT NULL,
	`minimum_order_cents` integer DEFAULT 0 NOT NULL,
	`free_shipping_cents` integer DEFAULT 0 NOT NULL,
	`eta` text DEFAULT '40–70 min' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event` text NOT NULL,
	`product_id` text,
	`session_key` text DEFAULT 'anonymous' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`unit` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`total_cents` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`status` text DEFAULT 'whatsapp_pending' NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`delivery_type` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`neighborhood` text DEFAULT '' NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`payment_method` text NOT NULL,
	`change_for_cents` integer,
	`scheduled_for` text DEFAULT 'Assim que possível' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`substitution` text DEFAULT 'confirm' NOT NULL,
	`coupon_code` text,
	`subtotal_cents` integer NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`delivery_fee_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`item_count` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`barcode` text DEFAULT '' NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category_id` text NOT NULL,
	`price_cents` integer NOT NULL,
	`old_price_cents` integer,
	`cost_cents` integer DEFAULT 0 NOT NULL,
	`unit` text NOT NULL,
	`image_url` text NOT NULL,
	`badge` text DEFAULT '' NOT NULL,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`min_stock` integer DEFAULT 5 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`offer_start` text,
	`offer_end` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `store_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`store_name` text NOT NULL,
	`whatsapp` text DEFAULT '5500000000000' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT 'Configure o endereço no painel' NOT NULL,
	`maps_url` text DEFAULT '' NOT NULL,
	`hours` text DEFAULT 'Seg–Sáb: 7h às 20h' NOT NULL,
	`payment_methods` text DEFAULT 'PIX, Dinheiro, Cartão' NOT NULL,
	`pix_key` text DEFAULT '' NOT NULL,
	`minimum_order_cents` integer DEFAULT 3000 NOT NULL,
	`allow_pickup` integer DEFAULT true NOT NULL,
	`allow_delivery` integer DEFAULT true NOT NULL,
	`substitution_policy` text DEFAULT 'confirm' NOT NULL,
	`announcement` text DEFAULT 'Ofertas especiais todos os dias' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `categories` (`id`,`name`,`slug`,`icon`,`sort_order`,`active`) VALUES ('mercearia','Mercearia','mercearia','🛒',1,1),('hortifruti','Hortifruti','hortifruti','🥬',2,1),('acougue','Açougue','acougue','🥩',3,1),('padaria','Padaria','padaria','🥖',4,1),('bebidas','Bebidas','bebidas','🥤',5,1),('laticinios','Laticínios','laticinios','🧀',6,1),('limpeza','Casa & Limpeza','limpeza','🧼',7,1);
--> statement-breakpoint
INSERT INTO `store_settings` (`id`,`store_name`,`whatsapp`,`phone`,`address`,`maps_url`,`hours`,`payment_methods`,`pix_key`,`minimum_order_cents`,`allow_pickup`,`allow_delivery`,`substitution_policy`,`announcement`) VALUES (1,'Supermercado Central','5500000000000','','Configure o endereço no painel','','Seg–Sáb: 7h às 20h','PIX, Dinheiro, Cartão','',3000,1,1,'confirm','Ofertas especiais todos os dias');
--> statement-breakpoint
INSERT INTO `delivery_zones` (`id`,`name`,`fee_cents`,`minimum_order_cents`,`free_shipping_cents`,`eta`,`active`) VALUES ('centro','Centro',500,3000,15000,'35–55 min',1),('outros','Outros bairros',800,5000,20000,'50–80 min',1);
--> statement-breakpoint
INSERT INTO `banners` (`id`,`title`,`subtitle`,`image_url`,`cta_label`,`cta_url`,`active`,`sort_order`) VALUES ('oferta-semana','Até 30% OFF','Ofertas selecionadas desta semana','','Aproveitar','#ofertas',1,1);
--> statement-breakpoint
INSERT INTO `coupons` (`code`,`type`,`value`,`max_discount_cents`,`minimum_cents`,`usage_limit`,`active`) VALUES ('BEMVINDO10','percent',10,2000,5000,0,1);
--> statement-breakpoint
INSERT INTO `products` (`id`,`sku`,`name`,`slug`,`description`,`category_id`,`price_cents`,`old_price_cents`,`unit`,`image_url`,`badge`,`stock_quantity`,`min_stock`,`active`,`featured`) VALUES
('1','SC-0001','Arroz Branco Tipo 1','arroz-branco-tipo-1','Pacote econômico selecionado para a sua família.','mercearia',2499,2990,'Pacote 5kg','https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=85','Oferta',50,5,1,1),
('2','SC-0002','Feijão Carioca','feijao-carioca','Grãos selecionados para uma refeição saborosa.','mercearia',799,949,'Pacote 1kg','https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=700&q=85','-16%',50,5,1,0),
('3','SC-0003','Leite Integral','leite-integral','Leite integral para o café da manhã.','laticinios',549,NULL,'Caixa 1L','https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=700&q=85','',50,5,1,0),
('4','SC-0004','Café Torrado e Moído','cafe-torrado-e-moido','Aroma e sabor para começar bem o dia.','mercearia',1690,1990,'Pacote 500g','https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=700&q=85','Oferta',50,5,1,1),
('5','SC-0005','Banana Prata','banana-prata','Frutas selecionadas diariamente.','hortifruti',579,NULL,'1kg aprox.','https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=700&q=85','',50,5,1,0),
('6','SC-0006','Tomate Selecionado','tomate-selecionado','Fresquinho para saladas e receitas.','hortifruti',749,899,'1kg aprox.','https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=700&q=85','Fresquinho',50,5,1,0),
('7','SC-0007','Refrigerante Cola','refrigerante-cola','Gelado combina ainda mais com sua refeição.','bebidas',999,NULL,'Garrafa 2L','https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=700&q=85','',50,5,1,0),
('8','SC-0008','Carne Bovina para Bife','carne-bovina-para-bife','Corte selecionado no açougue.','acougue',3490,3990,'1kg aprox.','https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=700&q=85','Oferta',50,5,1,1),
('9','SC-0009','Pão Francês Fresquinho','pao-frances-fresquinho','Assado todos os dias na nossa padaria.','padaria',1490,NULL,'1kg aprox.','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=85','',50,5,1,0),
('10','SC-0010','Queijo Muçarela','queijo-mucarela','Fatiado ou em peça, como você preferir.','laticinios',4290,NULL,'1kg aprox.','https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=700&q=85','',50,5,1,0);

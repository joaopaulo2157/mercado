CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone` text NOT NULL,
	`name` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`lifetime_value_cents` integer DEFAULT 0 NOT NULL,
	`order_count` integer DEFAULT 0 NOT NULL,
	`referral_code` text NOT NULL,
	`referred_by` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_referral_code_unique` ON `customers` (`referral_code`);--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`status` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` text,
	`customer_name` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_order_id_unique` ON `reviews` (`order_id`);--> statement-breakpoint
ALTER TABLE `order_items` ADD `unit_cost_cents` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `category_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `order_items` SET `unit_cost_cents`=COALESCE((SELECT `cost_cents` FROM `products` WHERE `products`.`id`=`order_items`.`product_id`),0),`category_name`=COALESCE((SELECT `categories`.`name` FROM `products` JOIN `categories` ON `categories`.`id`=`products`.`category_id` WHERE `products`.`id`=`order_items`.`product_id`),'');--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking_token` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `review_token` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `postal_code` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `city` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `state` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `cost_total_cents` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `loyalty_points_earned` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `loyalty_committed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `referral_bonus_committed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `referral_code` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `orders` SET `tracking_token`=lower(hex(randomblob(16))),`review_token`=lower(hex(randomblob(16))),`cost_total_cents`=COALESCE((SELECT SUM(`unit_cost_cents`*`quantity`) FROM `order_items` WHERE `order_items`.`order_id`=`orders`.`id`),0) WHERE `tracking_token` IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_tracking_token_unique` ON `orders` (`tracking_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_review_token_unique` ON `orders` (`review_token`);--> statement-breakpoint
INSERT INTO `customers` (`phone`,`name`,`points`,`lifetime_value_cents`,`order_count`,`referral_code`,`referred_by`) SELECT `customer_phone`,MAX(`customer_name`),0,COALESCE(SUM(CASE WHEN `status`!='cancelled' THEN `total_cents` ELSE 0 END),0),COUNT(*),'SC'||substr(hex(randomblob(8)),1,8),'' FROM `orders` GROUP BY `customer_phone`;--> statement-breakpoint
INSERT INTO `order_status_history` (`order_id`,`status`,`note`,`created_at`) SELECT `id`,`status`,'Histórico importado na evolução do acompanhamento',`created_at` FROM `orders`;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `pix_merchant_name` text DEFAULT 'SUPERMERCADO CENTRAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `pix_merchant_city` text DEFAULT 'MACEIO' NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `loyalty_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `points_per_real` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `review_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `flash_offer_title` text DEFAULT 'Oferta-relâmpago' NOT NULL;--> statement-breakpoint
ALTER TABLE `store_settings` ADD `abandoned_cart_hours` integer DEFAULT 24 NOT NULL;

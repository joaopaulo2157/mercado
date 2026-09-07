CREATE TABLE `shopping_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_token` text NOT NULL,
	`name` text NOT NULL,
	`items_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shopping_lists_owner_token_idx` ON `shopping_lists` (`owner_token`);--> statement-breakpoint
CREATE TABLE `store_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`url` text DEFAULT '/#ofertas' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`published_at` text,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `store_notifications_schedule_idx` ON `store_notifications` (`active`,`published_at`,`expires_at`);--> statement-breakpoint
ALTER TABLE `order_items` ADD `quantity_millis` integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
UPDATE `order_items` SET `quantity_millis` = `quantity` * 1000;--> statement-breakpoint
ALTER TABLE `order_items` ADD `option_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `option_label` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `substitution` text DEFAULT 'confirm' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `request_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_key_unique` ON `orders` (`request_key`);--> statement-breakpoint
ALTER TABLE `products` ADD `brand` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `sale_mode` text DEFAULT 'unit' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `quantity_step_millis` integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `minimum_quantity_millis` integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `options_json` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
UPDATE `products`
SET
	`sale_mode` = 'weight',
	`quantity_step_millis` = 250,
	`minimum_quantity_millis` = 500
WHERE lower(`unit`) LIKE '%kg% aprox%';
--> statement-breakpoint
UPDATE `products`
SET
	`brand` = CASE WHEN `brand` = '' THEN 'Central' ELSE `brand` END,
	`options_json` = '[{"id":"1l","label":"Caixa 1L","priceCents":549,"oldPriceCents":null,"barcode":""},{"id":"fardo-12","label":"Fardo com 12 unidades","priceCents":6290,"oldPriceCents":6590,"barcode":""}]'
WHERE `sku` = 'SC-0003' AND `options_json` = '[]';
--> statement-breakpoint
UPDATE `products`
SET `options_json` = '[{"id":"2l","label":"Garrafa 2L","priceCents":999,"oldPriceCents":null,"barcode":""},{"id":"fardo-6","label":"Fardo com 6 garrafas","priceCents":5690,"oldPriceCents":5990,"barcode":""}]'
WHERE `sku` = 'SC-0007' AND `options_json` = '[]';

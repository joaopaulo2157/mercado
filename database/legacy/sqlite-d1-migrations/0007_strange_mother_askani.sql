CREATE TABLE `admin_approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`payload_json` text DEFAULT '{}' NOT NULL,
	`payload_hash` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`requested_by` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`executed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_approvals_status_idx` ON `admin_approvals` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `admin_approvals_requester_idx` ON `admin_approvals` (`requested_by`,`created_at`);--> statement-breakpoint
CREATE TABLE `admin_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`label` text NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL,
	`first_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_devices_actor_idx` ON `admin_devices` (`actor_email`);--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`movement_type` text NOT NULL,
	`quantity_delta_millis` integer NOT NULL,
	`previous_quantity_millis` integer NOT NULL,
	`new_quantity_millis` integer NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`reference_type` text DEFAULT 'manual' NOT NULL,
	`reference_id` text DEFAULT '' NOT NULL,
	`actor_email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inventory_movements_product_idx` ON `inventory_movements` (`product_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `security_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`require_mfa` integer DEFAULT true NOT NULL,
	`require_owner_approval` integer DEFAULT true NOT NULL,
	`new_device_alerts` integer DEFAULT true NOT NULL,
	`updated_by` text DEFAULT 'system' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `staff` ADD `permissions_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `mfa_required` integer DEFAULT true NOT NULL;--> statement-breakpoint
INSERT INTO `security_settings` (
	`id`,
	`require_mfa`,
	`require_owner_approval`,
	`new_device_alerts`,
	`updated_by`
) VALUES (1, 1, 1, 1, 'system');

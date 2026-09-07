CREATE TABLE `home_content` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`about_eyebrow` text DEFAULT 'PERTINHO DE VOCÊ' NOT NULL,
	`about_title` text DEFAULT 'Qualidade e atendimento que fazem parte da sua rotina.' NOT NULL,
	`about_text` text DEFAULT 'Uma experiência de compra pensada para as famílias de São José da Tapera, com variedade, cuidado e atendimento próximo.' NOT NULL,
	`storefront_image_url` text DEFAULT '' NOT NULL,
	`interior_image_url` text DEFAULT '' NOT NULL,
	`team_image_url` text DEFAULT '' NOT NULL,
	`flyer_eyebrow` text DEFAULT 'ENCARTE DA SEMANA' NOT NULL,
	`flyer_title` text DEFAULT 'Economia para encher o carrinho.' NOT NULL,
	`flyer_subtitle` text DEFAULT 'Uma seleção atualizada de ofertas para você aproveitar pelo site ou na loja.' NOT NULL,
	`flyer_image_url` text DEFAULT '' NOT NULL,
	`flyer_cta_label` text DEFAULT 'Ver todas as ofertas' NOT NULL,
	`flyer_cta_url` text DEFAULT '#ofertas' NOT NULL,
	`flyer_starts_at` text,
	`flyer_ends_at` text,
	`flyer_active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `home_content` (
	`id`,
	`about_eyebrow`,
	`about_title`,
	`about_text`,
	`flyer_eyebrow`,
	`flyer_title`,
	`flyer_subtitle`,
	`flyer_cta_label`,
	`flyer_cta_url`,
	`flyer_active`
) VALUES (
	1,
	'PERTINHO DE VOCÊ',
	'Qualidade e atendimento que fazem parte da sua rotina.',
	'Uma experiência de compra pensada para as famílias de São José da Tapera, com variedade, cuidado e atendimento próximo.',
	'ENCARTE DA SEMANA',
	'Economia para encher o carrinho.',
	'Uma seleção atualizada de ofertas para você aproveitar pelo site ou na loja.',
	'Ver todas as ofertas',
	'#ofertas',
	1
);

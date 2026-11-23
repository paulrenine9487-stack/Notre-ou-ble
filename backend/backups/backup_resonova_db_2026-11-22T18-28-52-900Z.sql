-- No Tre(ou)ble Database Backup
-- Generated: 2026-11-22T18:28:52.920Z
-- Source Database: resonova_db

SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for `admin_audit_logs`
DROP TABLE IF EXISTS `admin_audit_logs`;
CREATE TABLE `admin_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` int DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_audit_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `admin_audit_logs` (50 records)
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (11, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"Studio Test Harmonic Theme\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 05:39:25');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (12, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"Studio Test Harmonic Theme\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 05:39:40');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (13, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"Studio Test Harmonic Theme\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 05:39:51');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (14, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"Studio Test Harmonic Theme\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 05:48:31');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (15, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(o)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 05:57:01');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (16, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(o)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 06:02:38');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (17, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(o)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 06:21:54');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (18, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(ou)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 08:22:42');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (19, 74, 'Created ADMIN account', 'users', 88, '{\"email\":\"admin_assistant_1795099803628@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 14:50:04');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (20, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(ou)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 15:32:37');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (21, 74, 'Created ADMIN account', 'users', 91, '{\"email\":\"admin_assistant_1795111637127@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 18:07:17');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (22, 74, 'Created ADMIN account', 'users', 94, '{\"email\":\"admin_assistant_1795112668194@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 18:24:28');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (23, 74, 'Created ADMIN account', 'users', 97, '{\"email\":\"admin_assistant_1795112803698@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 18:26:44');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (24, 74, 'Created ADMIN account', 'users', 100, '{\"email\":\"admin_assistant_1795114265560@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 18:51:06');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (25, 74, 'Created ADMIN account', 'users', 103, '{\"email\":\"admin_assistant_1795115645414@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 19:14:05');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (26, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(o)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 19:14:21');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (27, 74, 'Created ADMIN account', 'users', 106, '{\"email\":\"admin_assistant_1795116154161@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 19:22:34');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (28, 74, 'Created ADMIN account', 'users', 109, '{\"email\":\"admin_assistant_1795116270217@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 19:24:30');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (29, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(ou)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 19:24:46');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (30, 74, 'Created ADMIN account', 'users', 112, '{\"email\":\"admin_assistant_1795116436982@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 19:27:17');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (31, 74, 'Created ADMIN account', 'users', 115, '{\"email\":\"admin_assistant_1795116732882@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 19:32:13');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (32, 74, 'Created ADMIN account', 'users', 118, '{\"email\":\"admin_assistant_1795117001704@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 19:36:42');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (33, 74, 'Created ADMIN account', 'users', 121, '{\"email\":\"admin_assistant_1795117796668@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 19:49:57');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (34, 74, 'Created ADMIN account', 'users', 124, '{\"email\":\"admin_assistant_1795118344778@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 19:59:05');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (35, 74, 'Created ADMIN account', 'users', 127, '{\"email\":\"admin_assistant_1795118949022@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 20:09:09');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (36, 74, 'Created ADMIN account', 'users', 132, '{\"email\":\"admin_assistant_1795119874952@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 20:24:35');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (37, 74, 'Created ADMIN account', 'users', 137, '{\"email\":\"admin_assistant_1795120399009@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 20:33:19');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (38, 74, 'Created ADMIN account', 'users', 141, '{\"email\":\"admin_assistant_1795120853289@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 20:40:53');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (39, 74, 'Created ADMIN account', 'users', 144, '{\"email\":\"admin_assistant_1795121911155@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 20:58:31');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (40, 74, 'Created ADMIN account', 'users', 147, '{\"email\":\"admin_assistant_1795122051229@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 21:00:51');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (41, 74, 'Created ADMIN account', 'users', 152, '{\"email\":\"admin_assistant_1795122441930@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 21:07:22');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (42, 74, 'Created ADMIN account', 'users', 156, '{\"email\":\"admin_assistant_1795122686502@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 21:11:27');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (43, 74, 'Created ADMIN account', 'users', 161, '{\"email\":\"admin_assistant_1795122936408@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 21:15:36');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (44, 74, 'Created ADMIN account', 'users', 165, '{\"email\":\"admin_assistant_1795123414776@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 21:23:35');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (45, 74, 'Created ADMIN account', 'users', 169, '{\"email\":\"admin_assistant_1795123638655@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 21:27:19');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (46, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(ou)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 21:40:17');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (47, 74, 'Created ADMIN account', 'users', 172, '{\"email\":\"admin_assistant_1795124435205@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 21:40:35');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (48, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(ou)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 21:43:40');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (49, 74, 'Created ADMIN account', 'users', 176, '{\"email\":\"admin_assistant_1795124626521@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 21:43:47');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (50, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(ou)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 22:01:36');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (51, 74, 'Created ADMIN account', 'users', 182, '{\"email\":\"admin_assistant_1795125704703@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 22:01:45');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (52, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(ou)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 22:07:13');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (53, 74, 'Created ADMIN account', 'users', 187, '{\"email\":\"admin_assistant_1795126046858@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 22:07:27');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (54, 74, 'Created ADMIN account', 'users', 194, '{\"email\":\"admin_assistant_1795126709471@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 22:18:29');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (55, 75, 'Updated branding theme colors', 'branding_settings', 1, '{\"theme_name\":\"No Tre(ou)ble Harmonic Vocal Palette\",\"primary_color\":\"#193B40\",\"secondary_color\":\"#398575\"}', '2026-11-19 22:18:42');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (56, 74, 'Created ADMIN account', 'users', 200, '{\"email\":\"admin_assistant_1795127729406@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 22:35:29');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (57, 74, 'Created ADMIN account', 'users', 206, '{\"email\":\"admin_assistant_1795128046711@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 22:40:47');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (58, 74, 'Created ADMIN account', 'users', 211, '{\"email\":\"admin_assistant_1795128963350@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-19 22:56:03');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (59, 74, 'Created ADMIN account', 'users', 216, '{\"email\":\"admin_assistant_1795154444391@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-20 06:00:44');
INSERT INTO `admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `created_at`) VALUES (60, 74, 'Created ADMIN account', 'users', 230, '{\"email\":\"admin_assistant_1795156694147@notreoble.com\",\"role\":\"ADMIN\"}', '2026-11-20 06:38:14');

-- Table structure for `branding_settings`
DROP TABLE IF EXISTS `branding_settings`;
CREATE TABLE `branding_settings` (
  `id` int NOT NULL,
  `theme_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Default Vocal Teal',
  `primary_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#193B40',
  `secondary_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#398575',
  `accent_bg_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#DCECE5',
  `main_bg_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#F3F6F3',
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `branding_settings` (1 records)
INSERT INTO `branding_settings` (`id`, `theme_name`, `primary_color`, `secondary_color`, `accent_bg_color`, `main_bg_color`, `updated_by`, `updated_at`) VALUES (1, 'Official No Tre(ou)ble', '#241442', '#7C3AED', '#F4F0FF', '#F8F7FC', 75, '2026-11-19 22:28:10');

-- Table structure for `breathing_practice_levels`
DROP TABLE IF EXISTS `breathing_practice_levels`;
CREATE TABLE `breathing_practice_levels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level_key` varchar(50) NOT NULL,
  `level_name` varchar(50) NOT NULL,
  `daily_practice_duration` varchar(50) NOT NULL,
  `core_focus` text NOT NULL,
  `inhale_duration` decimal(4,1) NOT NULL,
  `inhale_min` decimal(4,1) NOT NULL,
  `inhale_max` decimal(4,1) NOT NULL,
  `hold_duration` decimal(4,1) NOT NULL,
  `hold_min` decimal(4,1) NOT NULL,
  `hold_max` decimal(4,1) NOT NULL,
  `exhale_duration` decimal(4,1) NOT NULL,
  `exhale_min` decimal(4,1) NOT NULL,
  `exhale_max` decimal(4,1) NOT NULL,
  `support_pulsed_rhythms` tinyint(1) DEFAULT '0',
  `default_cycles` int DEFAULT '5',
  `display_order` int DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `level_key` (`level_key`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table `breathing_practice_levels` (3 records)
INSERT INTO `breathing_practice_levels` (`id`, `level_key`, `level_name`, `daily_practice_duration`, `core_focus`, `inhale_duration`, `inhale_min`, `inhale_max`, `hold_duration`, `hold_min`, `hold_max`, `exhale_duration`, `exhale_min`, `exhale_max`, `support_pulsed_rhythms`, `default_cycles`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'beginner', 'Beginner', '5–10 minutes', 'Eliminating shoulder/chest movement; learning low belly and rib expansion.', '4.0', '4.0', '4.0', '3.0', '2.0', '4.0', '10.0', '8.0', '12.0', 0, 5, 1, 1, '2026-11-20 08:25:27', '2026-11-20 08:41:23');
INSERT INTO `breathing_practice_levels` (`id`, `level_key`, `level_name`, `daily_practice_duration`, `core_focus`, `inhale_duration`, `inhale_min`, `inhale_max`, `hold_duration`, `hold_min`, `hold_max`, `exhale_duration`, `exhale_min`, `exhale_max`, `support_pulsed_rhythms`, `default_cycles`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'intermediate', 'Intermediate', '10–15 minutes', 'Controlling airflow speed without squeezing the throat; keeping ribs expanded while exhaling.', '2.0', '2.0', '2.0', '2.0', '2.0', '2.0', '20.0', '15.0', '25.0', 0, 5, 2, 1, '2026-11-20 08:25:27', '2026-11-20 08:25:27');
INSERT INTO `breathing_practice_levels` (`id`, `level_key`, `level_name`, `daily_practice_duration`, `core_focus`, `inhale_duration`, `inhale_min`, `inhale_max`, `hold_duration`, `hold_min`, `hold_max`, `exhale_duration`, `exhale_min`, `exhale_max`, `support_pulsed_rhythms`, `default_cycles`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (3, 'advanced', 'Advanced', '10–15 minutes', 'Instant, silent diaphragmatic drop; budgeting air for complex runs and high notes.', '1.0', '0.5', '1.0', '0.0', '0.0', '0.0', '30.0', '30.0', '60.0', 1, 5, 3, 1, '2026-11-20 08:25:27', '2026-11-20 08:25:27');

-- Table structure for `breathing_tips`
DROP TABLE IF EXISTS `breathing_tips`;
CREATE TABLE `breathing_tips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stage_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `breathing_tips_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `breathing_tips` (5 records)
INSERT INTO `breathing_tips` (`id`, `stage_id`, `title`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1, 3, 'Keep your shoulders relaxed while breathing', 'Raising your shoulders engages neck tension and blocks deep lung expansion.', 'Feather', 1, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');
INSERT INTO `breathing_tips` (`id`, `stage_id`, `title`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (2, 3, 'Avoid forcing your inhalation', 'Allow air to enter naturally by opening your lower ribs rather than gasping.', 'Wind', 2, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');
INSERT INTO `breathing_tips` (`id`, `stage_id`, `title`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (3, 3, 'Maintain comfortable airflow', 'Vocal support is steady air resistance, not clamping or holding your breath.', 'Activity', 3, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');
INSERT INTO `breathing_tips` (`id`, `stage_id`, `title`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (4, 3, 'Plan your breathing before starting a musical phrase', 'Know exactly where your breath punctuation marks belong in the song lyrics.', 'Compass', 4, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');
INSERT INTO `breathing_tips` (`id`, `stage_id`, `title`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (5, 3, 'Practise consistently without straining', 'Five minutes of relaxed diaphragmatic awareness daily builds lasting muscle memory.', 'Sparkles', 5, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');

-- Table structure for `challenge_attempts`
DROP TABLE IF EXISTS `challenge_attempts`;
CREATE TABLE `challenge_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `attempt_number` int NOT NULL DEFAULT '1',
  `answers_json` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `score` int NOT NULL DEFAULT '0',
  `total_marks` int NOT NULL DEFAULT '100',
  `percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'COMPLETED',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `challenge_id` (`challenge_id`),
  CONSTRAINT `challenge_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `challenge_attempts_ibfk_2` FOREIGN KEY (`challenge_id`) REFERENCES `learning_challenges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `challenge_attempts` (4 records)
INSERT INTO `challenge_attempts` (`id`, `user_id`, `challenge_id`, `attempt_number`, `answers_json`, `score`, `total_marks`, `percentage`, `status`, `started_at`, `completed_at`) VALUES (59, 3, 1, 1, '{\"review\":[{\"questionId\":\"mf-1\",\"statement\":\"The more air I take in, the longer I can hold a note.\",\"selectedAnswer\":\"UNANSWERED\",\"correctAnswer\":\"MYTH\",\"isCorrect\":false,\"explanation\":\"Why? Taking in too much air can create tension. What matters is controlling airflow, not simply filling your lungs to maximum capacity.\"},{\"questionId\":\"mf-2\",\"statement\":\"I should breathe at every comma I see in the song lyrics.\",\"selectedAnswer\":\"UNANSWERED\",\"correctAnswer\":\"MYTH\",\"isCorrect\":false,\"explanation\":\"Why? Musical breathing depends on phrasing, not just punctuation. Sometimes you need to breathe in the middle of a sentence, while other times you can sing through a comma.\"},{\"questionId\":\"mf-3\",\"statement\":\"Breathing out completely before taking another breath helps me prepare better for singing.\",\"selectedAnswer\":\"UNANSWERED\",\"correctAnswer\":\"MYTH\",\"isCorrect\":false,\"explanation\":\"Why? Forcing all the air out can create tension and make the next inhalation uncomfortable. Allow your breath to flow naturally before taking the next one.\"},{\"questionId\":\"mf-4\",\"statement\":\"Your breathing muscles continue working even while you sing.\",\"selectedAnswer\":\"UNANSWERED\",\"correctAnswer\":\"FACT\",\"isCorrect\":false,\"explanation\":\"Why? Breathing muscles help regulate airflow during singing. They coordinate to maintain controlled exhalation rather than simply switching off after inhalation.\"},{\"questionId\":\"mf-5\",\"statement\":\"I should hold my breath for a moment before starting every sung phrase.\",\"selectedAnswer\":\"UNANSWERED\",\"correctAnswer\":\"MYTH\",\"isCorrect\":false,\"explanation\":\"Why? Unnecessary breath-holding can create tension. Aim for a smooth transition from inhalation to singing.\"},{\"questionId\":\"mf-6\",\"statement\":\"Two singers can sing the same long note but use their breath differently.\",\"selectedAnswer\":\"UNANSWERED\",\"correctAnswer\":\"FACT\",\"isCorrect\":false,\"explanation\":\"Why? Breath requirements vary depending on vocal technique, phrasing, volume and individual physiology. There isn\'t one identical breathing pattern for every singer.\"}],\"summary\":{\"totalQuestions\":6,\"correctAnswers\":0,\"incorrectAnswers\":6,\"category\":\"Keep learning and try again.\",\"timeSpentSeconds\":0}}', 0, 60, '0.00', 'COMPLETED', '2026-11-20 11:41:40', '2026-11-20 11:41:40');
INSERT INTO `challenge_attempts` (`id`, `user_id`, `challenge_id`, `attempt_number`, `answers_json`, `score`, `total_marks`, `percentage`, `status`, `started_at`, `completed_at`) VALUES (60, 3, 1, 3, '{\"review\":[{\"questionId\":\"mf-1\",\"statement\":\"The more air I take in, the longer I can hold a note.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Taking in too much air can create tension. What matters is controlling airflow, not simply filling your lungs to maximum capacity.\"},{\"questionId\":\"mf-2\",\"statement\":\"I should breathe at every comma I see in the song lyrics.\",\"selectedAnswer\":\"FACT\",\"correctAnswer\":\"MYTH\",\"isCorrect\":false,\"explanation\":\"Why? Musical breathing depends on phrasing, not just punctuation. Sometimes you need to breathe in the middle of a sentence, while other times you can sing through a comma.\"},{\"questionId\":\"mf-3\",\"statement\":\"Breathing out completely before taking another breath helps me prepare better for singing.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Forcing all the air out can create tension and make the next inhalation uncomfortable. Allow your breath to flow naturally before taking the next one.\"},{\"questionId\":\"mf-4\",\"statement\":\"Your breathing muscles continue working even while you sing.\",\"selectedAnswer\":\"FACT\",\"correctAnswer\":\"FACT\",\"isCorrect\":true,\"explanation\":\"Why? Breathing muscles help regulate airflow during singing. They coordinate to maintain controlled exhalation rather than simply switching off after inhalation.\"},{\"questionId\":\"mf-5\",\"statement\":\"I should hold my breath for a moment before starting every sung phrase.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Unnecessary breath-holding can create tension. Aim for a smooth transition from inhalation to singing.\"},{\"questionId\":\"mf-6\",\"statement\":\"Two singers can sing the same long note but use their breath differently.\",\"selectedAnswer\":\"FACT\",\"correctAnswer\":\"FACT\",\"isCorrect\":true,\"explanation\":\"Why? Breath requirements vary depending on vocal technique, phrasing, volume and individual physiology. There isn\'t one identical breathing pattern for every singer.\"}],\"summary\":{\"totalQuestions\":6,\"correctAnswers\":5,\"incorrectAnswers\":1,\"category\":\"Excellent understanding!\",\"timeSpentSeconds\":45}}', 50, 60, '83.33', 'PASSED', '2026-11-20 11:46:13', '2026-11-20 11:46:13');
INSERT INTO `challenge_attempts` (`id`, `user_id`, `challenge_id`, `attempt_number`, `answers_json`, `score`, `total_marks`, `percentage`, `status`, `started_at`, `completed_at`) VALUES (61, 3, 1, 4, '{\"review\":[{\"questionId\":\"mf-1\",\"statement\":\"The more air I take in, the longer I can hold a note.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Taking in too much air can create tension. What matters is controlling airflow, not simply filling your lungs to maximum capacity.\"},{\"questionId\":\"mf-2\",\"statement\":\"I should breathe at every comma I see in the song lyrics.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Musical breathing depends on phrasing, not just punctuation. Sometimes you need to breathe in the middle of a sentence, while other times you can sing through a comma.\"},{\"questionId\":\"mf-3\",\"statement\":\"Breathing out completely before taking another breath helps me prepare better for singing.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Forcing all the air out can create tension and make the next inhalation uncomfortable. Allow your breath to flow naturally before taking the next one.\"},{\"questionId\":\"mf-4\",\"statement\":\"Your breathing muscles continue working even while you sing.\",\"selectedAnswer\":\"FACT\",\"correctAnswer\":\"FACT\",\"isCorrect\":true,\"explanation\":\"Why? Breathing muscles help regulate airflow during singing. They coordinate to maintain controlled exhalation rather than simply switching off after inhalation.\"},{\"questionId\":\"mf-5\",\"statement\":\"I should hold my breath for a moment before starting every sung phrase.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Unnecessary breath-holding can create tension. Aim for a smooth transition from inhalation to singing.\"},{\"questionId\":\"mf-6\",\"statement\":\"Two singers can sing the same long note but use their breath differently.\",\"selectedAnswer\":\"FACT\",\"correctAnswer\":\"FACT\",\"isCorrect\":true,\"explanation\":\"Why? Breath requirements vary depending on vocal technique, phrasing, volume and individual physiology. There isn\'t one identical breathing pattern for every singer.\"}],\"summary\":{\"totalQuestions\":6,\"correctAnswers\":6,\"incorrectAnswers\":0,\"category\":\"Excellent understanding!\",\"timeSpentSeconds\":165}}', 60, 60, '100.00', 'PASSED', '2026-11-20 14:54:32', '2026-11-20 14:54:32');
INSERT INTO `challenge_attempts` (`id`, `user_id`, `challenge_id`, `attempt_number`, `answers_json`, `score`, `total_marks`, `percentage`, `status`, `started_at`, `completed_at`) VALUES (62, 3, 1, 5, '{\"review\":[{\"questionId\":\"mf-1\",\"statement\":\"The more air I take in, the longer I can hold a note.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Taking in too much air can create tension. What matters is controlling airflow, not simply filling your lungs to maximum capacity.\"},{\"questionId\":\"mf-2\",\"statement\":\"I should breathe at every comma I see in the song lyrics.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Musical breathing depends on phrasing, not just punctuation. Sometimes you need to breathe in the middle of a sentence, while other times you can sing through a comma.\"},{\"questionId\":\"mf-3\",\"statement\":\"Breathing out completely before taking another breath helps me prepare better for singing.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Forcing all the air out can create tension and make the next inhalation uncomfortable. Allow your breath to flow naturally before taking the next one.\"},{\"questionId\":\"mf-4\",\"statement\":\"Your breathing muscles continue working even while you sing.\",\"selectedAnswer\":\"FACT\",\"correctAnswer\":\"FACT\",\"isCorrect\":true,\"explanation\":\"Why? Breathing muscles help regulate airflow during singing. They coordinate to maintain controlled exhalation rather than simply switching off after inhalation.\"},{\"questionId\":\"mf-5\",\"statement\":\"I should hold my breath for a moment before starting every sung phrase.\",\"selectedAnswer\":\"MYTH\",\"correctAnswer\":\"MYTH\",\"isCorrect\":true,\"explanation\":\"Why? Unnecessary breath-holding can create tension. Aim for a smooth transition from inhalation to singing.\"},{\"questionId\":\"mf-6\",\"statement\":\"Two singers can sing the same long note but use their breath differently.\",\"selectedAnswer\":\"FACT\",\"correctAnswer\":\"FACT\",\"isCorrect\":true,\"explanation\":\"Why? Breath requirements vary depending on vocal technique, phrasing, volume and individual physiology. There isn\'t one identical breathing pattern for every singer.\"}],\"summary\":{\"totalQuestions\":6,\"correctAnswers\":6,\"incorrectAnswers\":0,\"category\":\"Excellent understanding!\",\"timeSpentSeconds\":26}}', 60, 60, '100.00', 'PASSED', '2026-11-20 18:37:46', '2026-11-20 18:37:46');

-- Table structure for `learning_activities`
DROP TABLE IF EXISTS `learning_activities`;
CREATE TABLE `learning_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_order` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `learning_activities_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `learning_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_activities` (9 records)
INSERT INTO `learning_activities` (`id`, `module_id`, `title`, `description`, `activity_order`, `created_at`) VALUES (11, 1, 'Diaphragmatic Awakening & Lower Core Release', 'Feel the 3D descent of the diaphragm and relax the abdominal wall on inhalation.', 1, '2026-11-18 06:57:21');
INSERT INTO `learning_activities` (`id`, `module_id`, `title`, `description`, `activity_order`, `created_at`) VALUES (12, 1, '360-Degree Intercostal Expansion', 'Expand the lateral and posterior lower ribcage without lifting the collarbones.', 2, '2026-11-18 06:57:21');
INSERT INTO `learning_activities` (`id`, `module_id`, `title`, `description`, `activity_order`, `created_at`) VALUES (13, 1, 'Eliminating Clavicular Breathing', 'De-condition shoulder tension and shallow upper chest breathing habits.', 3, '2026-11-18 06:57:21');
INSERT INTO `learning_activities` (`id`, `module_id`, `title`, `description`, `activity_order`, `created_at`) VALUES (14, 1, 'Appoggio Foundations: Leaning on the Breath', 'Balance inhalatory and exhalatory muscle engagement for sustained airflow.', 4, '2026-11-18 06:57:21');
INSERT INTO `learning_activities` (`id`, `module_id`, `title`, `description`, `activity_order`, `created_at`) VALUES (15, 1, 'Box Breathing (4-4-4-4) Rhythm & Control', 'Master pacing, autonomic nervous system regulation, and composure under pressure.', 5, '2026-11-18 06:57:21');
INSERT INTO `learning_activities` (`id`, `module_id`, `title`, `description`, `activity_order`, `created_at`) VALUES (16, 1, 'Subglottic Pressure Regulation & Clean Onset', 'Prevent glottic shock or breathy leakage at the inception of vocal sound.', 6, '2026-11-18 06:57:21');
INSERT INTO `learning_activities` (`id`, `module_id`, `title`, `description`, `activity_order`, `created_at`) VALUES (17, 1, 'Messa di Voce Dynamic Airflow Swells', 'Control steady air volume from pianissimo swell to fortissimo and back.', 7, '2026-11-18 06:57:21');
INSERT INTO `learning_activities` (`id`, `module_id`, `title`, `description`, `activity_order`, `created_at`) VALUES (18, 1, 'Phrase Mapping: Breath Points in Songs', 'Mark catch-breaths and deep breath pauses on real musical lyrics.', 8, '2026-11-18 06:57:21');
INSERT INTO `learning_activities` (`id`, `module_id`, `title`, `description`, `activity_order`, `created_at`) VALUES (19, 1, 'Legato Streaming vs Staccato Diaphragmatic Pulses', 'Contrast sustained smooth airstream against quick rhythmic diaphragmatic pulses.', 9, '2026-11-18 06:57:21');

-- Table structure for `learning_activity_progress`
DROP TABLE IF EXISTS `learning_activity_progress`;
CREATE TABLE `learning_activity_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stage_id` int NOT NULL,
  `activity_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'COMPLETED',
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_stage_activity` (`user_id`,`stage_id`,`activity_id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `learning_activity_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `learning_activity_progress_ibfk_2` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=435 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_activity_progress` (13 records)
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (49, 3, 1, 's1_objectives', 'objectives', 'COMPLETED', '2026-11-19 10:24:38', '2026-11-22 14:36:37');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (220, 3, 1, 's1_video', 'video', 'COMPLETED', '2026-11-19 22:26:46', '2026-11-19 22:26:46');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (272, 3, 2, 's2_recall_questions', 'recall', 'COMPLETED', '2026-11-19 22:58:39', '2026-11-20 20:44:22');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (298, 3, 3, 'song_practice_1', 'song_practice', 'COMPLETED', '2026-11-20 05:37:35', '2026-11-20 05:37:35');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (299, 3, 3, 's3_video', 'video', 'COMPLETED', '2026-11-20 05:38:08', '2026-11-20 05:38:18');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (346, 3, 3, 's3_posture', 'practice', 'COMPLETED', '2026-11-20 10:58:26', '2026-11-20 10:58:26');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (392, 74, 3, 's3_posture', 'practice', 'COMPLETED', '2026-11-20 09:16:13', '2026-11-20 09:16:13');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (408, 3, 3, 's3_breathe', 'practice', 'COMPLETED', '2026-11-20 10:59:45', '2026-11-20 10:59:45');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (416, 3, 3, 's3_song', 'practice', 'COMPLETED', '2026-11-20 20:47:49', '2026-11-20 20:47:49');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (421, 3, 4, 'challenge_2', 'challenge', 'COMPLETED', '2026-11-20 11:04:51', '2026-11-20 11:04:51');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (422, 3, 4, 'challenge_1', 'challenge', 'COMPLETED', '2026-11-20 11:41:40', '2026-11-20 18:37:46');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (424, 3, 4, 's4_reflection_pinboard', 'reflection', 'COMPLETED', '2026-11-20 14:49:23', '2026-11-20 14:51:47');
INSERT INTO `learning_activity_progress` (`id`, `user_id`, `stage_id`, `activity_id`, `activity_type`, `status`, `completed_at`, `updated_at`) VALUES (429, 3, 4, 's4_student_recording', 'audio_recording', 'COMPLETED', '2026-11-20 14:55:04', '2026-11-20 18:17:56');

-- Table structure for `learning_challenges`
DROP TABLE IF EXISTS `learning_challenges`;
CREATE TABLE `learning_challenges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stage_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `challenge_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_marks` int NOT NULL DEFAULT '100',
  `passing_score` int NOT NULL DEFAULT '60',
  `configuration_json` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `learning_challenges_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_challenges` (1 records)
INSERT INTO `learning_challenges` (`id`, `stage_id`, `title`, `description`, `challenge_type`, `total_marks`, `passing_score`, `configuration_json`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1, 4, 'Breathe Right: Fact or Myth?', 'Test your understanding of breathing techniques for singing.', 'myth_or_fact', 60, 30, '{\"type\":\"myth_or_fact\",\"title\":\"Breathe Right: Fact or Myth?\",\"subtitle\":\"Test your understanding of breathing techniques for singing.\",\"questions\":[{\"id\":\"mf-1\",\"statement\":\"The more air I take in, the longer I can hold a note.\",\"correctAnswer\":\"MYTH\",\"explanation\":\"Why? Taking in too much air can create tension. What matters is controlling airflow, not simply filling your lungs to maximum capacity.\"},{\"id\":\"mf-2\",\"statement\":\"I should breathe at every comma I see in the song lyrics.\",\"correctAnswer\":\"MYTH\",\"explanation\":\"Why? Musical breathing depends on phrasing, not just punctuation. Sometimes you need to breathe in the middle of a sentence, while other times you can sing through a comma.\"},{\"id\":\"mf-3\",\"statement\":\"Breathing out completely before taking another breath helps me prepare better for singing.\",\"correctAnswer\":\"MYTH\",\"explanation\":\"Why? Forcing all the air out can create tension and make the next inhalation uncomfortable. Allow your breath to flow naturally before taking the next one.\"},{\"id\":\"mf-4\",\"statement\":\"Your breathing muscles continue working even while you sing.\",\"correctAnswer\":\"FACT\",\"explanation\":\"Why? Breathing muscles help regulate airflow during singing. They coordinate to maintain controlled exhalation rather than simply switching off after inhalation.\"},{\"id\":\"mf-5\",\"statement\":\"I should hold my breath for a moment before starting every sung phrase.\",\"correctAnswer\":\"MYTH\",\"explanation\":\"Why? Unnecessary breath-holding can create tension. Aim for a smooth transition from inhalation to singing.\"},{\"id\":\"mf-6\",\"statement\":\"Two singers can sing the same long note but use their breath differently.\",\"correctAnswer\":\"FACT\",\"explanation\":\"Why? Breath requirements vary depending on vocal technique, phrasing, volume and individual physiology. There isn\'t one identical breathing pattern for every singer.\"}]}', 1, 1, '2026-11-19 09:28:56', '2026-11-22 18:24:21');

-- Table structure for `learning_feedback`
DROP TABLE IF EXISTS `learning_feedback`;
CREATE TABLE `learning_feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stage_id` int NOT NULL,
  `rating` int NOT NULL,
  `useful_feedback` text COLLATE utf8mb4_unicode_ci,
  `difficult_feedback` text COLLATE utf8mb4_unicode_ci,
  `improvement_suggestions` text COLLATE utf8mb4_unicode_ci,
  `additional_comments` text COLLATE utf8mb4_unicode_ci,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `learning_feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `learning_feedback_ibfk_2` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `learning_modules`
DROP TABLE IF EXISTS `learning_modules`;
CREATE TABLE `learning_modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MOD-01',
  `module_order` int NOT NULL DEFAULT '1',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'COMING_SOON',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `module_number` int NOT NULL DEFAULT '1',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Breath',
  `route` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '/learning/modules/breath-management',
  `thumbnail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_modules` (5 records)
INSERT INTO `learning_modules` (`id`, `title`, `description`, `module_code`, `module_order`, `status`, `created_at`, `module_number`, `category`, `route`, `thumbnail`, `is_available`, `display_order`, `updated_at`) VALUES (1, 'The Hidden Engine: Breath Control & Vocal Stamina', 'Learn posture, diaphragmatic breathing, breath control and vocal stamina for singing.', 'MOD-01', 1, 'IN_PROGRESS', '2026-11-18 06:55:18', 1, 'Breath', '/learning/modules/breath-management', 'breath', 1, 1, '2026-11-19 21:01:14');
INSERT INTO `learning_modules` (`id`, `title`, `description`, `module_code`, `module_order`, `status`, `created_at`, `module_number`, `category`, `route`, `thumbnail`, `is_available`, `display_order`, `updated_at`) VALUES (2, 'Tuning the Instrument: Ear-to-Voice Precision', 'Develop accurate pitch recognition, listening skills and voice control.', 'MOD-01', 2, 'COMING_SOON', '2026-11-18 06:55:18', 2, 'Pitch Correction', '/learning/modules/pitch-correction', 'pitch', 0, 2, '2026-11-19 20:16:26');
INSERT INTO `learning_modules` (`id`, `title`, `description`, `module_code`, `module_order`, `status`, `created_at`, `module_number`, `category`, `route`, `thumbnail`, `is_available`, `display_order`, `updated_at`) VALUES (3, 'Breaking the Ceiling: Singing High Notes Without Strain', 'Learn techniques for developing vocal range and singing higher notes comfortably.', 'MOD-01', 3, 'COMING_SOON', '2026-11-18 06:55:18', 3, 'High Notes', '/learning/modules/high-notes', 'high_notes', 0, 3, '2026-11-19 20:16:26');
INSERT INTO `learning_modules` (`id`, `title`, `description`, `module_code`, `module_order`, `status`, `created_at`, `module_number`, `category`, `route`, `thumbnail`, `is_available`, `display_order`, `updated_at`) VALUES (4, 'Sculpting Words: Shaping Vowels and Consonants', 'Improve pronunciation, vowel formation, consonant clarity and vocal articulation.', 'MOD-01', 1, 'COMING_SOON', '2026-11-19 20:16:26', 4, 'Pronunciation & Diction', '/learning/modules/pronunciation-diction', 'diction', 0, 4, '2026-11-19 20:16:26');
INSERT INTO `learning_modules` (`id`, `title`, `description`, `module_code`, `module_order`, `status`, `created_at`, `module_number`, `category`, `route`, `thumbnail`, `is_available`, `display_order`, `updated_at`) VALUES (5, 'Making It Yours: Phrasing, Emotion, and Musical Style', 'Develop musical expression, phrasing, interpretation and individual singing style.', 'MOD-01', 1, 'COMING_SOON', '2026-11-19 20:16:26', 5, 'Style of the Song', '/learning/modules/song-style', 'style', 0, 5, '2026-11-19 20:16:26');

-- Table structure for `learning_objectives`
DROP TABLE IF EXISTS `learning_objectives`;
CREATE TABLE `learning_objectives` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stage_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_line_1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_line_2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Lightbulb',
  `display_order` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `learning_objectives_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=756 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_objectives` (4 records)
INSERT INTO `learning_objectives` (`id`, `stage_id`, `title`, `title_line_1`, `title_line_2`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (752, 1, 'Maintain POSTURE', 'Maintain', 'POSTURE', 'Demonstrate correct singing posture and diaphragmatic breathing techniques independently.', 'Lightbulb', 1, 1, '2026-11-22 18:24:21', '2026-11-22 18:24:21');
INSERT INTO `learning_objectives` (`id`, `stage_id`, `title`, `title_line_1`, `title_line_2`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (753, 1, 'Manage BREATHING', 'Manage', 'BREATHING', 'Perform controlled inhalation and exhalation exercises to regulate your airflow.', 'Wind', 2, 1, '2026-11-22 18:24:21', '2026-11-22 18:24:21');
INSERT INTO `learning_objectives` (`id`, `stage_id`, `title`, `title_line_1`, `title_line_2`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (754, 1, 'Apply VOCAL TECHNIQUES', 'Apply', 'VOCAL TECHNIQUES', 'Apply breath management techniques to a song!', 'Megaphone', 3, 1, '2026-11-22 18:24:21', '2026-11-22 18:24:21');
INSERT INTO `learning_objectives` (`id`, `stage_id`, `title`, `title_line_1`, `title_line_2`, `description`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (755, 1, 'Organize PRACTICE ROUTINE', 'Organize', 'PRACTICE ROUTINE', 'Develop and maintain a structured weekly breathing practice journal to track your exercises and progress.', 'CalendarCheck', 4, 1, '2026-11-22 18:24:21', '2026-11-22 18:24:21');

-- Table structure for `learning_part_sections`
DROP TABLE IF EXISTS `learning_part_sections`;
CREATE TABLE `learning_part_sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_id` int DEFAULT '1',
  `stage_id` int NOT NULL,
  `part_number` int DEFAULT '2',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Part 2 • Step 1: Posture',
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Stand tall, stay relaxed',
  `description` text COLLATE utf8mb4_unicode_ci,
  `model_asset_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int DEFAULT '2',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stage_part` (`stage_id`,`part_number`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_part_sections` (1 records)
INSERT INTO `learning_part_sections` (`id`, `module_id`, `stage_id`, `part_number`, `title`, `subtitle`, `description`, `model_asset_url`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 3, 2, 'Part 2 • Step 1: Posture', 'Stand tall, stay relaxed', 'Interactive posture alignment, diaphragmatic breath regulation, and musical phrase application.', '/images/posture-guide-model.jpg', 2, 1, '2026-11-20 06:06:09', '2026-11-20 06:49:06');

-- Table structure for `learning_part_tabs`
DROP TABLE IF EXISTS `learning_part_tabs`;
CREATE TABLE `learning_part_tabs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `part_id` int NOT NULL,
  `tab_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `content_data` json DEFAULT NULL,
  `display_order` int DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_part_tab` (`part_id`,`tab_key`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_part_tabs` (3 records)
INSERT INTO `learning_part_tabs` (`id`, `part_id`, `tab_key`, `title`, `subtitle`, `description`, `content_data`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 'posture', 'Posture', 'Stand tall, stay relaxed', 'Demonstrate correct singing posture independently using the 3D anatomical viewer and posture checklist.', '{\"next_tab\":\"breathe\",\"step_label\":\"Step 1: Posture\",\"button_text\":\"Next: Breathe →\"}', 1, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');
INSERT INTO `learning_part_tabs` (`id`, `part_id`, `tab_key`, `title`, `subtitle`, `description`, `content_data`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (2, 1, 'breathe', 'Breathe', 'Controlled inhalation & lower rib expansion', 'Perform controlled diaphragmatic breathing exercises to regulate airflow without shoulder elevation.', '{\"next_tab\":\"song\",\"checklist\":[\"Place your hands gently on your lower ribs.\",\"Inhale silently through nose and mouth for 4 beats.\",\"Feel your ribs expand 360 degrees without raising your shoulders.\",\"Exhale steadily on a gentle hiss [s] for 8 beats.\"],\"video_url\":\"https://www.w3schools.com/html/mov_bbb.mp4\",\"step_label\":\"Step 2: Breathe\",\"button_text\":\"Next: Song →\",\"instructions\":\"Place your hands against your lower floating ribs. Breathe in slowly through your nose and mouth together, allowing your lower ribcage and belly to expand naturally. Exhale on a sustained [s] sound for 8 seconds without letting your chest collapse.\"}', 2, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');
INSERT INTO `learning_part_tabs` (`id`, `part_id`, `tab_key`, `title`, `subtitle`, `description`, `content_data`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (3, 1, 'song', 'Song', 'Apply what we\'re learning in a song.', 'Sing Snowman with interactive sheet music notation, breathing markers, and level-specific note marking.', '{\"artist\":\"Sia\",\"subtitle\":\"Audio guide\",\"audio_url\":\"/audio/snowman-vocal-guide.wav\",\"song_title\":\"Snowman\",\"step_label\":\"Part 2 • Step 3: Sing it — \\\"Snowman\\\"\",\"button_text\":\"Complete Practice Session ✓\",\"instructions\":\"Now let\'s use your breathing in a real song. Listen once. Then choose your level and sing along, taking a breath wherever you see a tick on the score.\\n\\nStart at Beginner and move up when it feels comfortable.\"}', 3, 1, '2026-11-20 06:06:09', '2026-11-20 10:20:31');

-- Table structure for `learning_practice_summaries`
DROP TABLE IF EXISTS `learning_practice_summaries`;
CREATE TABLE `learning_practice_summaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stage_id` int NOT NULL,
  `practice_session_id` int DEFAULT NULL,
  `activities_json` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_minutes` int NOT NULL DEFAULT '0',
  `practice_notes` text COLLATE utf8mb4_unicode_ci,
  `learned_notes` text COLLATE utf8mb4_unicode_ci,
  `difficulty_notes` text COLLATE utf8mb4_unicode_ci,
  `next_practice_goal` text COLLATE utf8mb4_unicode_ci,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `stage_id` (`stage_id`),
  KEY `practice_session_id` (`practice_session_id`),
  CONSTRAINT `learning_practice_summaries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `learning_practice_summaries_ibfk_2` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `learning_practice_summaries_ibfk_3` FOREIGN KEY (`practice_session_id`) REFERENCES `practice_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `learning_songs`
DROP TABLE IF EXISTS `learning_songs`;
CREATE TABLE `learning_songs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stage_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `artist` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `media_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'audio',
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storage_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `display_order` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `learning_songs_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_songs` (1 records)
INSERT INTO `learning_songs` (`id`, `stage_id`, `title`, `artist`, `description`, `media_type`, `media_url`, `storage_key`, `instructions`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1, 3, 'Amazing Grace (Vocal Phrasing & Breath Marks)', 'Traditional Melody', 'A classic ballad ideal for practicing slow inhalation, continuous subglottic support, and seamless phrase transitions.', 'audio', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', NULL, '1. Listen through once to observe the tempo and natural punctuation.\n2. Mark your breath points: take a silent breath on count 4 before each phrase.\n3. Sing along while keeping your shoulders relaxed and lower ribs gently expanded.', 1, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');

-- Table structure for `learning_stage_content`
DROP TABLE IF EXISTS `learning_stage_content`;
CREATE TABLE `learning_stage_content` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stage_id` int NOT NULL,
  `content_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `content_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storage_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_data` longtext COLLATE utf8mb4_unicode_ci,
  `display_order` int NOT NULL DEFAULT '1',
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `learning_stage_content_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_stage_content` (9 records)
INSERT INTO `learning_stage_content` (`id`, `stage_id`, `content_type`, `title`, `description`, `content_url`, `storage_key`, `content_data`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 'introduction', 'Breath Management', 'Watch this short video to see why your breath matters when you sing.\nWhen you are ready, press Next.', NULL, NULL, '{\"extra_text\": \"Mastering breath management unlocks resonance, eliminates pitch wavering, and allows your voice to soar effortlessly across registers.\", \"section_heading\": \"FOUNDATIONS OF BREATH CONTROL\"}', 1, 1, 1, '2026-11-19 09:28:56', '2026-11-19 21:18:49');
INSERT INTO `learning_stage_content` (`id`, `stage_id`, `content_type`, `title`, `description`, `content_url`, `storage_key`, `content_data`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (2, 1, 'intro_video', 'Introduction to Breath Management', 'Watch this visual guide to understand how comfortable diaphragmatic breathing creates effortless vocal support.', '/IMG_7993.MP4', NULL, NULL, 2, 1, 1, '2026-11-19 09:28:56', '2026-11-22 15:05:26');
INSERT INTO `learning_stage_content` (`id`, `stage_id`, `content_type`, `title`, `description`, `content_url`, `storage_key`, `content_data`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (3, 1, 'vision_board', 'OUR LEARNING VISION', 'Help every singer develop comfortable breathing habits, controlled airflow and confident musical expression.', NULL, NULL, '{\"board_heading\": \"YOUR LEARNING OBJECTIVES\"}', 3, 1, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');
INSERT INTO `learning_stage_content` (`id`, `stage_id`, `content_type`, `title`, `description`, `content_url`, `storage_key`, `content_data`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (5, 3, 'teaching_video', 'Part 1 • How breathing works', 'Watch the full video before moving to the practice guide', 'https://www.w3schools.com/html/mov_bbb.mp4', NULL, NULL, 1, 1, 1, '2026-11-19 09:28:56', '2026-11-20 05:58:54');
INSERT INTO `learning_stage_content` (`id`, `stage_id`, `content_type`, `title`, `description`, `content_url`, `storage_key`, `content_data`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (6, 3, 'lungs_simulation', 'LUNGS SIMULATION PRACTICE', 'Interactive diaphragmatic breathing simulator placeholder. Practice synchronizing inhalation depth and gradual release.', NULL, NULL, '{\"status\": \"ready_for_engine\", \"simulation_version\": \"1.0-placeholder\", \"exhalation_target_seconds\": 8, \"inhalation_target_seconds\": 4}', 2, 0, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');
INSERT INTO `learning_stage_content` (`id`, `stage_id`, `content_type`, `title`, `description`, `content_url`, `storage_key`, `content_data`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (7, 4, 'written_assessment_prompt', 'WHAT DO YOU KNOW NOW?', 'Explain what you have learned about breath management and how you will apply it when singing a song.', NULL, NULL, '{\"rubric\": \"Clarity of diaphragmatic concept, practical application in song phrasing, self-awareness of tension.\", \"prompt_heading\": \"WHAT DO YOU KNOW NOW?\"}', 3, 1, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');
INSERT INTO `learning_stage_content` (`id`, `stage_id`, `content_type`, `title`, `description`, `content_url`, `storage_key`, `content_data`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (8, 4, 'recording_prompt', 'LET YOUR VOICE BE HEARD', 'Now apply what you have learned. Record yourself singing the song you practised and submit your performance for assessment.', NULL, NULL, '{\"section_heading\": \"LET YOUR VOICE BE HEARD\", \"max_duration_seconds\": 300}', 4, 1, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');
INSERT INTO `learning_stage_content` (`id`, `stage_id`, `content_type`, `title`, `description`, `content_url`, `storage_key`, `content_data`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (9, 5, 'feedback_settings', 'SHARE YOUR FEEDBACK', 'Tell us about your learning experience so we can fine-tune future modules.', NULL, NULL, '{\"questions\": [\"Overall experience rating\", \"What did you find useful?\", \"What was difficult?\", \"What would you like to improve?\", \"Additional comments\"]}', 1, 1, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');
INSERT INTO `learning_stage_content` (`id`, `stage_id`, `content_type`, `title`, `description`, `content_url`, `storage_key`, `content_data`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (10, 5, 'practice_summary_config', 'WHAT DID YOU PRACTISE?', 'Collect your actual activities completed through this portal and log them directly into your Practice Journal.', NULL, NULL, '{\"activities_options\": \"[\\\"Watched breath management lesson\\\",\\\"Completed knowledge recall questions\\\",\\\"Practised lungs simulation\\\",\\\"Reviewed breath management tips\\\",\\\"Practised a song\\\",\\\"Completed interactive challenges\\\",\\\"Recorded a song\\\",\\\"Completed written assessment\\\"]\"}', 2, 1, 1, '2026-11-19 09:28:56', '2026-11-19 09:28:56');

-- Table structure for `learning_stage_progress`
DROP TABLE IF EXISTS `learning_stage_progress`;
CREATE TABLE `learning_stage_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stage_id` int NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NOT STARTED',
  `progress_percentage` decimal(5,2) DEFAULT '0.00',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_stage_prog` (`user_id`,`stage_id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `learning_stage_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `learning_stage_progress_ibfk_2` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=170 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_stage_progress` (5 records)
INSERT INTO `learning_stage_progress` (`id`, `user_id`, `stage_id`, `status`, `progress_percentage`, `started_at`, `completed_at`, `updated_at`) VALUES (11, 3, 1, 'COMPLETED', '100.00', '2026-11-19 10:24:38', '2026-11-19 22:26:46', '2026-11-19 22:26:46');
INSERT INTO `learning_stage_progress` (`id`, `user_id`, `stage_id`, `status`, `progress_percentage`, `started_at`, `completed_at`, `updated_at`) VALUES (113, 3, 2, 'COMPLETED', '100.00', NULL, '2026-11-19 22:58:39', '2026-11-19 22:58:39');
INSERT INTO `learning_stage_progress` (`id`, `user_id`, `stage_id`, `status`, `progress_percentage`, `started_at`, `completed_at`, `updated_at`) VALUES (114, 3, 3, 'COMPLETED', '100.00', '2026-11-20 05:37:35', '2026-11-20 05:38:08', '2026-11-20 05:38:08');
INSERT INTO `learning_stage_progress` (`id`, `user_id`, `stage_id`, `status`, `progress_percentage`, `started_at`, `completed_at`, `updated_at`) VALUES (126, 3, 4, 'COMPLETED', '100.00', '2026-11-20 11:04:51', '2026-11-20 19:13:56', '2026-11-20 19:13:56');
INSERT INTO `learning_stage_progress` (`id`, `user_id`, `stage_id`, `status`, `progress_percentage`, `started_at`, `completed_at`, `updated_at`) VALUES (128, 3, 5, 'COMPLETED', '100.00', '2026-11-20 19:41:52', '2026-11-20 19:44:52', '2026-11-20 19:44:52');

-- Table structure for `learning_stages`
DROP TABLE IF EXISTS `learning_stages`;
CREATE TABLE `learning_stages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_id` int NOT NULL,
  `stage_number` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage_subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `stage_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage_content` longtext COLLATE utf8mb4_unicode_ci,
  `stage_order` int NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '1',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_module_stage` (`module_id`,`stage_number`),
  CONSTRAINT `learning_stages_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `learning_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_stages` (9 records)
INSERT INTO `learning_stages` (`id`, `module_id`, `stage_number`, `title`, `stage_title`, `subtitle`, `stage_subtitle`, `description`, `stage_description`, `stage_content`, `stage_order`, `display_order`, `status`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 1, 'Introduction', 'Introduction', 'Get curious', 'Get curious', 'Watch this short video to see why your breath matters when you sing.\nWhen you are ready, press Next.', 'Watch this short video to see why your breath matters when you sing.\nWhen you are ready, press Next.', '### Welcome to Stage 01: Gain Attention\nGet curious about how your body breathes when you are not thinking about singing versus when you prepare to sing.\nNotice the difference between a high, tight chest breath and an expansive, relaxed diaphragmatic breath.\n\n**Key Observation:**\nWhen singers strain for high notes or run out of air mid-phrase, it is rarely due to low lung capacity. It is almost always a coordination issue between inhalation relaxation and steady airflow resistance.', 1, 1, 'ACTIVE', 1, '2026-11-18 09:13:47', '2026-11-20 06:49:49');
INSERT INTO `learning_stages` (`id`, `module_id`, `stage_number`, `title`, `stage_title`, `subtitle`, `stage_subtitle`, `description`, `stage_description`, `stage_content`, `stage_order`, `display_order`, `status`, `is_active`, `created_at`, `updated_at`) VALUES (2, 1, 2, 'What Do You Know?', 'What Do You Know?', 'Remember', 'Remember', 'Before learning new techniques, let\'s discover what you already know about breathing and singing.', 'Before learning new techniques, let\'s discover what you already know about breathing and singing.', '### Welcome to Stage 02: Inform Objectives\nBy the end of this foundational module, you will be able to:\n1. Initiate a silent 360° diaphragmatic inhalation in under 2 seconds without shoulder elevation.\n2. Maintain steady subglottic breath pressure during sustained phonation.\n3. Mark and execute breath breaks naturally within real song lyrics without breaking musical momentum.', 2, 2, 'ACTIVE', 1, '2026-11-18 09:13:47', '2026-11-19 21:00:16');
INSERT INTO `learning_stages` (`id`, `module_id`, `stage_number`, `title`, `stage_title`, `subtitle`, `stage_subtitle`, `description`, `stage_description`, `stage_content`, `stage_order`, `display_order`, `status`, `is_active`, `created_at`, `updated_at`) VALUES (3, 1, 3, 'How To Do It', 'How To Do It', 'Understand', 'Understand', 'Understand how airflow and diaphragmatic support work together through video demonstrations, lungs simulation, technique tips, and song practice.', 'Understand how airflow and diaphragmatic support work together through video demonstrations, lungs simulation, technique tips, and song practice.', '### Welcome to Stage 03: Stimulate Recall\nThink about everyday physical acts: yawning, laughing from the belly, or sleeping deeply. During all of these, your body naturally uses diaphragmatic breathing without conscious effort.\n\n**Diagnostic Insight:**\nTension enters when we believe we must \"pull in\" massive amounts of air before singing. Remembering natural relaxation triggers allows effortless airflow.', 3, 3, 'ACTIVE', 1, '2026-11-18 09:13:47', '2026-11-19 21:00:16');
INSERT INTO `learning_stages` (`id`, `module_id`, `stage_number`, `title`, `stage_title`, `subtitle`, `stage_subtitle`, `description`, `stage_description`, `stage_content`, `stage_order`, `display_order`, `status`, `is_active`, `created_at`, `updated_at`) VALUES (4, 1, 4, 'Let\'s Check Ourselves', 'Let\'s Check Ourselves', 'Show what you know', 'Show what you know', 'Test your breath management knowledge with interactive challenges, complete a written assessment, and record your song performance.', 'Test your breath management knowledge with interactive challenges, complete a written assessment, and record your song performance.', '### Welcome to Stage 04: Present Content\n#### The Physiology of Breath Management\n1. **The Diaphragm:** A dome-shaped muscle separating the chest from the abdomen. On inhalation, it contracts downward, creating negative pressure that draws air into the lungs.\n2. **The Intercostals:** Muscles between the ribs that expand the rib cage outward 360°.\n3. **Appoggio Support:** The Italian vocal technique of maintaining ribcage expansion during exhalation to resist sudden lung collapse and prevent vocal fold slamming.', 4, 4, 'ACTIVE', 1, '2026-11-18 09:13:47', '2026-11-20 18:41:59');
INSERT INTO `learning_stages` (`id`, `module_id`, `stage_number`, `title`, `stage_title`, `subtitle`, `stage_subtitle`, `description`, `stage_description`, `stage_content`, `stage_order`, `display_order`, `status`, `is_active`, `created_at`, `updated_at`) VALUES (5, 1, 5, 'Keep It Going', 'Keep It Going', 'Fine-tune', 'Fine-tune', 'Reflect on your vocal development, share your learning experience feedback, and save your practice summary to your personal Practice Journal.', 'Reflect on your vocal development, share your learning experience feedback, and save your practice summary to your personal Practice Journal.', '### Welcome to Stage 05: Provide Learning Guidance\n#### 3-Step Guided Breathing Protocol\n- **Step 1 - The Release:** Soften the lower abdominal wall before inhaling. Do not suck in your stomach.\n- **Step 2 - The 360° Expansion:** Allow the breath to expand the sides and lower back. Imagine a ring expanding evenly around your waist.\n- **Step 3 - The Controlled Stream:** Hiss gently on an unvoiced \"Sss\" sound, keeping the lower ribs expanded for as long as comfortable.', 5, 5, 'ACTIVE', 1, '2026-11-18 09:13:47', '2026-11-20 18:53:05');
INSERT INTO `learning_stages` (`id`, `module_id`, `stage_number`, `title`, `stage_title`, `subtitle`, `stage_subtitle`, `description`, `stage_description`, `stage_content`, `stage_order`, `display_order`, `status`, `is_active`, `created_at`, `updated_at`) VALUES (6, 1, 6, NULL, 'Elicit Performance', NULL, 'Your turn', NULL, 'Engage in active practice: execute measured timed breathing drills and sustain steady unconstricted phonation.', '### Welcome to Stage 06: Elicit Performance\nNow it is your turn to actively practice and log your active breathing endurance.\nUse the integrated practice timer to log your drill. The system will record your exact practice duration directly into your practice journal and update your dashboard stats.', 6, 1, 'INACTIVE', 0, '2026-11-18 09:13:47', '2026-11-19 09:28:55');
INSERT INTO `learning_stages` (`id`, `module_id`, `stage_number`, `title`, `stage_title`, `subtitle`, `stage_subtitle`, `description`, `stage_description`, `stage_content`, `stage_order`, `display_order`, `status`, `is_active`, `created_at`, `updated_at`) VALUES (7, 1, 7, NULL, 'Provide Feedback', NULL, 'Fine-tune', NULL, 'Receive immediate sensory feedback checklists and instructor feedback to fine-tune physical support.', '### Welcome to Stage 07: Provide Feedback\nSelf-assessment and teacher observation ensure you do not practice tension into your muscle memory.\nReview the common tension indicators below:\n- **Tension Sign 1:** Jaw or tongue gripping during inhalation.\n- **Tension Sign 2:** Upper chest rising before the lower ribs expand.\n- **Tension Sign 3:** Pushing air out too hard at the start of a note.', 7, 1, 'INACTIVE', 0, '2026-11-18 09:13:47', '2026-11-19 09:28:55');
INSERT INTO `learning_stages` (`id`, `module_id`, `stage_number`, `title`, `stage_title`, `subtitle`, `stage_subtitle`, `description`, `stage_description`, `stage_content`, `stage_order`, `display_order`, `status`, `is_active`, `created_at`, `updated_at`) VALUES (8, 1, 8, NULL, 'Assess Performance', NULL, 'Show what you know', NULL, 'Map breathing marks across actual song phrases and submit an audio recording of your vocal execution for evaluation.', '### Welcome to Stage 08: Assess Performance\n#### Practical Song-Based Breath Application\nSinging is the true test of breath management. In this stage, you will:\n1. Choose or enter a song and divide it into clear musical phrases.\n2. Mark the inhalation points (deep diaphragmatic breaths vs. quick catch-breaths).\n3. Record or upload an audio clip of you singing the phrase with your mapped breathing.\n4. Submit your audio for formal teacher review and grading.', 8, 1, 'INACTIVE', 0, '2026-11-18 09:13:47', '2026-11-19 09:28:55');
INSERT INTO `learning_stages` (`id`, `module_id`, `stage_number`, `title`, `stage_title`, `subtitle`, `stage_subtitle`, `description`, `stage_description`, `stage_content`, `stage_order`, `display_order`, `status`, `is_active`, `created_at`, `updated_at`) VALUES (9, 1, 9, NULL, 'Enhance Retention & Transfer', NULL, 'Keep it going', NULL, 'Integrate acquired breathing habits into daily vocal warm-ups and diverse musical repertoire.', '### Welcome to Stage 09: Enhance Retention & Transfer\nCongratulations on reaching the final stage of Vocal Foundations!\nBreath management is not a one-time exercise; it is an automatic habit that strengthens with consistent daily practice. Transfer these mechanics into your daily singing routine so they become second nature on stage.', 9, 1, 'INACTIVE', 0, '2026-11-18 09:13:47', '2026-11-19 09:28:55');

-- Table structure for `learning_task_links`
DROP TABLE IF EXISTS `learning_task_links`;
CREATE TABLE `learning_task_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `diary_task_id` int NOT NULL,
  `learning_task_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_diary_learning` (`user_id`,`diary_task_id`,`learning_task_id`),
  KEY `diary_task_id` (`diary_task_id`),
  KEY `learning_task_id` (`learning_task_id`),
  KEY `idx_user_links` (`user_id`),
  CONSTRAINT `learning_task_links_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `learning_task_links_ibfk_2` FOREIGN KEY (`diary_task_id`) REFERENCES `practice_diary_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `learning_task_links_ibfk_3` FOREIGN KEY (`learning_task_id`) REFERENCES `learning_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_task_links` (2 records)
INSERT INTO `learning_task_links` (`id`, `user_id`, `diary_task_id`, `learning_task_id`, `created_at`) VALUES (4, 3, 7, 2, '2026-11-18 10:38:16');
INSERT INTO `learning_task_links` (`id`, `user_id`, `diary_task_id`, `learning_task_id`, `created_at`) VALUES (7, 3, 12, 2, '2026-11-18 11:35:14');

-- Table structure for `learning_tasks`
DROP TABLE IF EXISTS `learning_tasks`;
CREATE TABLE `learning_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stage_id` int NOT NULL,
  `task_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_instructions` text COLLATE utf8mb4_unicode_ci,
  `learning_materials` longtext COLLATE utf8mb4_unicode_ci,
  `task_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `maximum_marks` int NOT NULL DEFAULT '100',
  `passing_marks` int NOT NULL DEFAULT '60',
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `task_order` int NOT NULL DEFAULT '1',
  `time_limit_minutes` int DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `learning_tasks_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `learning_tasks` (9 records)
INSERT INTO `learning_tasks` (`id`, `stage_id`, `task_title`, `task_description`, `task_instructions`, `learning_materials`, `task_type`, `maximum_marks`, `passing_marks`, `is_required`, `task_order`, `time_limit_minutes`, `status`, `created_at`, `updated_at`) VALUES (1, 1, 'Natural Breath Perception & Reflection', 'Observe your resting breath pattern versus your singing preparation.', 'Place one hand on your chest and one on your navel. Take 3 silent, gentle breaths through your nose and mouth. Write a brief reflection describing which hand moved first and how relaxed your shoulders remained.', 'Audio Guide: Observing the Silent Inhalation (1 min 30 sec)', 'written', 10, 6, 1, 1, 10, 'ACTIVE', '2026-11-18 09:13:47', '2026-11-18 09:13:47');
INSERT INTO `learning_tasks` (`id`, `stage_id`, `task_title`, `task_description`, `task_instructions`, `learning_materials`, `task_type`, `maximum_marks`, `passing_marks`, `is_required`, `task_order`, `time_limit_minutes`, `status`, `created_at`, `updated_at`) VALUES (2, 2, 'Personal Breath Management Milestones', 'Define your vocal goals and target phrase endurance benchmarks.', 'Identify one song in your current repertoire where you frequently run out of breath or feel vocal fatigue. State the song title and your primary vocal goal for this module.', 'Syllabus Benchmark Chart & Target Phrase Metrics', 'written', 20, 12, 1, 1, 15, 'ACTIVE', '2026-11-18 09:13:47', '2026-11-18 09:13:47');
INSERT INTO `learning_tasks` (`id`, `stage_id`, `task_title`, `task_description`, `task_instructions`, `learning_materials`, `task_type`, `maximum_marks`, `passing_marks`, `is_required`, `task_order`, `time_limit_minutes`, `status`, `created_at`, `updated_at`) VALUES (3, 3, 'Breathing Habits Diagnostic Quiz', 'Complete this quick 3-question diagnostic self-check.', 'Answer the diagnostic questions regarding where you feel breath movement and how your shoulders react.', 'Diagnostic Rubric: Clavicular vs Diaphragmatic Indicators', 'quiz', 20, 12, 1, 1, 10, 'ACTIVE', '2026-11-18 09:13:47', '2026-11-18 09:13:47');
INSERT INTO `learning_tasks` (`id`, `stage_id`, `task_title`, `task_description`, `task_instructions`, `learning_materials`, `task_type`, `maximum_marks`, `passing_marks`, `is_required`, `task_order`, `time_limit_minutes`, `status`, `created_at`, `updated_at`) VALUES (4, 4, 'Appoggio & Respiratory Mechanics Reading Task', 'Read the physiological breakdown and confirm your comprehension of appoggio support.', 'Read the core content above and confirm your understanding of diaphragmatic descent and intercostal recoil resistance.', 'Anatomical Diagrams: Diaphragm Descent & Intercostal Engagement', 'reading', 20, 14, 1, 1, 15, 'ACTIVE', '2026-11-18 09:13:47', '2026-11-18 09:13:47');
INSERT INTO `learning_tasks` (`id`, `stage_id`, `task_title`, `task_description`, `task_instructions`, `learning_materials`, `task_type`, `maximum_marks`, `passing_marks`, `is_required`, `task_order`, `time_limit_minutes`, `status`, `created_at`, `updated_at`) VALUES (5, 5, 'Guided 360° Diaphragmatic Breathwork Practice', 'Practice the 3-step expansion protocol using the interactive breathing guide.', 'Follow the pacing bubble below. Complete at least 4 cycles of 4-second inhalation, 2-second suspension, and 6-second controlled hiss.', 'Interactive Visual Breath Pacer & Sensation Checkpoint Guide', 'breathing_exercise', 25, 15, 1, 1, 15, 'ACTIVE', '2026-11-18 09:13:47', '2026-11-18 09:13:47');
INSERT INTO `learning_tasks` (`id`, `stage_id`, `task_title`, `task_description`, `task_instructions`, `learning_materials`, `task_type`, `maximum_marks`, `passing_marks`, `is_required`, `task_order`, `time_limit_minutes`, `status`, `created_at`, `updated_at`) VALUES (6, 6, 'Timed Respiratory Endurance Drill', 'Execute a timed practice session of at least 3 minutes using the practice timer.', 'Click Start Practice below. Sustain smooth, controlled breathing cycles for at least 3 minutes. When finished, click Save Session to log your performance to MySQL.', 'Drill Protocol: Sustained Legato Airflow Resistance', 'timed_practice', 25, 15, 1, 1, 20, 'ACTIVE', '2026-11-18 09:13:47', '2026-11-18 09:13:47');
INSERT INTO `learning_tasks` (`id`, `stage_id`, `task_title`, `task_description`, `task_instructions`, `learning_materials`, `task_type`, `maximum_marks`, `passing_marks`, `is_required`, `task_order`, `time_limit_minutes`, `status`, `created_at`, `updated_at`) VALUES (7, 7, 'Vocal Support Self-Evaluation & Reflection', 'Submit your sensory evaluation for instructor review and calibration.', 'Reflect on your physical sensations during the timed drill. Did you notice any jaw, neck, or shoulder tension? Enter your notes below for teacher review.', 'Self-Correction Checklist & Tension Detection Guide', 'written', 20, 12, 1, 1, 15, 'ACTIVE', '2026-11-18 09:13:47', '2026-11-18 09:13:47');
INSERT INTO `learning_tasks` (`id`, `stage_id`, `task_title`, `task_description`, `task_instructions`, `learning_materials`, `task_type`, `maximum_marks`, `passing_marks`, `is_required`, `task_order`, `time_limit_minutes`, `status`, `created_at`, `updated_at`) VALUES (8, 8, 'Song Phrase Breath Mapping & Audio Recording Submission', 'Map your song phrases and submit your audio demonstration for teacher assessment.', 'Use the phrase mapper below to enter a song and mark breath positions. Then either record directly in your browser or upload an MP3/WAV/M4A/WebM file. Click Submit for Review when ready.', 'Song Phrase Breathing Rubric & Audio Recording Guidelines', 'audio_submission', 50, 35, 1, 1, 30, 'ACTIVE', '2026-11-18 09:13:47', '2026-11-18 09:13:47');
INSERT INTO `learning_tasks` (`id`, `stage_id`, `task_title`, `task_description`, `task_instructions`, `learning_materials`, `task_type`, `maximum_marks`, `passing_marks`, `is_required`, `task_order`, `time_limit_minutes`, `status`, `created_at`, `updated_at`) VALUES (9, 9, 'Daily Repertoire Transfer & Practice Plan', 'Formulate your ongoing daily vocal warm-up and repertoire maintenance plan.', 'Outline a 10-minute daily breathing warm-up schedule you will use before your singing practice sessions.', 'Long-term Habit Tracker & Daily Routine Template', 'written', 10, 6, 1, 1, 15, 'ACTIVE', '2026-11-18 09:13:47', '2026-11-18 09:13:47');

-- Table structure for `lessons`
DROP TABLE IF EXISTS `lessons`;
CREATE TABLE `lessons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `video_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `lessons` (12 records)
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (1, 'Anatomy of Diaphragm & Rib Expansion', 'Understand the biological mechanics of diaphragmatic descent, lower abdominal relaxation, and 360-degree intercostal rib cage expansion.', 'Breath Management Fundamentals', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (2, 'Eliminating Clavicular Breathing', 'Identify and stop shallow shoulder and chest breathing to unlock deep, unhindered breath reserves for singing.', 'Breath Management Fundamentals', NULL, '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (3, 'Appoggio Technique & Balanced Airflow', 'Master the traditional Italian appoggio method: leaning on the breath to sustain consistent tone and pitch stability.', 'Breathing Techniques', NULL, '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (4, 'Box Breathing (4-4-4-4) for Vocalists', 'Regulate autonomic nervous system state and build breath pacing discipline through controlled 4-phase breathing cycles.', 'Breathing Techniques', NULL, '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (5, 'Balanced Vocal Onset & Pressure', 'Coordinate vocal fold adduction with gentle breath initiation without hard glottal attacks or breathy leakage.', 'Vocal Control', NULL, '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (6, 'Messa di Voce (Dynamic Volume Swells)', 'Sing a single note from pianissimo to fortissimo and back while maintaining vocal timbre, resonance, and stable breath.', 'Vocal Control', NULL, '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (7, 'Intercostal Muscle Stamina & Resistance', 'Isolate and condition the respiratory muscles to prevent premature air expulsion during dramatic vocal phrases.', 'Vocal Strength', NULL, '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (8, 'Subglottic Pressure Regulation for High Notes', 'Safely increase subglottic air pressure without throat tension, enabling powerful high registers and clean resonance.', 'Vocal Strength', NULL, '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (9, 'Phrase Mapping & Breath Markers', 'Annotate musical scores and lyrics to systematically map micro-breaths, catch-breaths, and deep replenishment marks.', 'Singing Practice', NULL, '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (10, 'Staccato Pulses vs Legato Streaming', 'Contrast quick diaphragmatic pulses for fast rhythmic runs against smooth, uninterrupted breath streams for long legato lines.', 'Singing Practice', NULL, '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (11, 'Stage Adrenaline & Heart Rate Calming', 'Deploy specialized physiological sigh techniques backstage to neutralize adrenaline tremors and voice shakiness.', 'Performance Preparation', NULL, '2026-11-17 06:18:33');
INSERT INTO `lessons` (`id`, `title`, `description`, `category`, `video_url`, `created_at`) VALUES (12, 'Dynamic Movement & Active Breath Support', 'Maintain lower core breath support while walking, dancing, holding a microphone, and interacting with audiences on stage.', 'Performance Preparation', NULL, '2026-11-17 06:18:33');

-- Table structure for `myth_fact_questions`
DROP TABLE IF EXISTS `myth_fact_questions`;
CREATE TABLE `myth_fact_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statement` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct_answer` enum('MYTH','FACT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `explanation` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=709 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `myth_fact_questions` (6 records)
INSERT INTO `myth_fact_questions` (`id`, `question_id`, `statement`, `correct_answer`, `explanation`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'mf-1', 'The more air I take in, the longer I can hold a note.', 'MYTH', 'Why? Taking in too much air can create tension. What matters is controlling airflow, not simply filling your lungs to maximum capacity.', 1, 1, '2026-11-20 11:17:08', '2026-11-20 11:17:08');
INSERT INTO `myth_fact_questions` (`id`, `question_id`, `statement`, `correct_answer`, `explanation`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'mf-2', 'I should breathe at every comma I see in the song lyrics.', 'MYTH', 'Why? Musical breathing depends on phrasing, not just punctuation. Sometimes you need to breathe in the middle of a sentence, while other times you can sing through a comma.', 2, 1, '2026-11-20 11:17:08', '2026-11-20 11:17:08');
INSERT INTO `myth_fact_questions` (`id`, `question_id`, `statement`, `correct_answer`, `explanation`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (3, 'mf-3', 'Breathing out completely before taking another breath helps me prepare better for singing.', 'MYTH', 'Why? Forcing all the air out can create tension and make the next inhalation uncomfortable. Allow your breath to flow naturally before taking the next one.', 3, 1, '2026-11-20 11:17:08', '2026-11-20 11:17:08');
INSERT INTO `myth_fact_questions` (`id`, `question_id`, `statement`, `correct_answer`, `explanation`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (4, 'mf-4', 'Your breathing muscles continue working even while you sing.', 'FACT', 'Why? Breathing muscles help regulate airflow during singing. They coordinate to maintain controlled exhalation rather than simply switching off after inhalation.', 4, 1, '2026-11-20 11:17:08', '2026-11-20 11:17:08');
INSERT INTO `myth_fact_questions` (`id`, `question_id`, `statement`, `correct_answer`, `explanation`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (5, 'mf-5', 'I should hold my breath for a moment before starting every sung phrase.', 'MYTH', 'Why? Unnecessary breath-holding can create tension. Aim for a smooth transition from inhalation to singing.', 5, 1, '2026-11-20 11:17:08', '2026-11-20 11:17:08');
INSERT INTO `myth_fact_questions` (`id`, `question_id`, `statement`, `correct_answer`, `explanation`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (6, 'mf-6', 'Two singers can sing the same long note but use their breath differently.', 'FACT', 'Why? Breath requirements vary depending on vocal technique, phrasing, volume and individual physiology. There isn\'t one identical breathing pattern for every singer.', 6, 1, '2026-11-20 11:17:08', '2026-11-20 11:17:08');

-- Table structure for `myth_fact_student_responses`
DROP TABLE IF EXISTS `myth_fact_student_responses`;
CREATE TABLE `myth_fact_student_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `challenge_id` int NOT NULL DEFAULT '1',
  `question_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `selected_answer` enum('MYTH','FACT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `correct_answer` enum('MYTH','FACT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  `score` int NOT NULL DEFAULT '0',
  `attempt_number` int NOT NULL DEFAULT '1',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_attempt` (`user_id`,`attempt_number`),
  KEY `idx_user_challenge` (`user_id`,`challenge_id`),
  CONSTRAINT `myth_fact_student_responses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `myth_fact_student_responses` (32 records)
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (1, 3, 1, 'mf-1', 'MYTH', 'MYTH', 1, 10, 1, 'ANSWERED', '2026-11-20 11:42:47', '2026-11-20 11:42:47', '2026-11-20 11:42:47');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (2, 3, 1, 'mf-2', 'FACT', 'MYTH', 0, 0, 1, 'ANSWERED', '2026-11-20 11:42:52', '2026-11-20 11:42:52', '2026-11-20 11:42:52');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (3, 3, 1, 'mf-1', 'MYTH', 'MYTH', 1, 10, 3, 'ANSWERED', '2026-11-20 11:46:12', '2026-11-20 11:46:12', '2026-11-20 11:46:12');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (4, 3, 1, 'mf-2', 'FACT', 'MYTH', 0, 0, 3, 'ANSWERED', '2026-11-20 11:46:12', '2026-11-20 11:46:12', '2026-11-20 11:46:12');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (5, 3, 1, 'mf-3', 'MYTH', 'MYTH', 1, 10, 3, 'ANSWERED', '2026-11-20 11:46:12', '2026-11-20 11:46:12', '2026-11-20 11:46:12');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (6, 3, 1, 'mf-4', 'FACT', 'FACT', 1, 10, 3, 'ANSWERED', '2026-11-20 11:46:13', '2026-11-20 11:46:13', '2026-11-20 11:46:13');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (7, 3, 1, 'mf-5', 'MYTH', 'MYTH', 1, 10, 3, 'ANSWERED', '2026-11-20 11:46:13', '2026-11-20 11:46:13', '2026-11-20 11:46:13');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (8, 3, 1, 'mf-6', 'FACT', 'FACT', 1, 10, 3, 'ANSWERED', '2026-11-20 11:46:13', '2026-11-20 11:46:13', '2026-11-20 11:46:13');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (9, 3, 1, 'mf-1', 'MYTH', 'MYTH', 1, 10, 4, 'ANSWERED', '2026-11-20 14:54:16', '2026-11-20 14:54:16', '2026-11-20 14:54:16');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (10, 3, 1, 'mf-2', 'MYTH', 'MYTH', 1, 10, 4, 'ANSWERED', '2026-11-20 14:54:20', '2026-11-20 14:54:20', '2026-11-20 14:54:20');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (11, 3, 1, 'mf-3', 'MYTH', 'MYTH', 1, 10, 4, 'ANSWERED', '2026-11-20 14:54:23', '2026-11-20 14:54:23', '2026-11-20 14:54:23');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (12, 3, 1, 'mf-4', 'FACT', 'FACT', 1, 10, 4, 'ANSWERED', '2026-11-20 14:54:25', '2026-11-20 14:54:25', '2026-11-20 14:54:25');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (13, 3, 1, 'mf-5', 'MYTH', 'MYTH', 1, 10, 4, 'ANSWERED', '2026-11-20 14:54:29', '2026-11-20 14:54:29', '2026-11-20 14:54:29');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (14, 3, 1, 'mf-6', 'FACT', 'FACT', 1, 10, 4, 'ANSWERED', '2026-11-20 14:54:31', '2026-11-20 14:54:31', '2026-11-20 14:54:31');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (15, 3, 1, 'mf-1', 'MYTH', 'MYTH', 1, 10, 4, 'COMPLETED', '2026-11-20 14:54:32', '2026-11-20 14:54:32', '2026-11-20 14:54:32');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (16, 3, 1, 'mf-2', 'MYTH', 'MYTH', 1, 10, 4, 'COMPLETED', '2026-11-20 14:54:32', '2026-11-20 14:54:32', '2026-11-20 14:54:32');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (17, 3, 1, 'mf-3', 'MYTH', 'MYTH', 1, 10, 4, 'COMPLETED', '2026-11-20 14:54:32', '2026-11-20 14:54:32', '2026-11-20 14:54:32');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (18, 3, 1, 'mf-4', 'FACT', 'FACT', 1, 10, 4, 'COMPLETED', '2026-11-20 14:54:32', '2026-11-20 14:54:32', '2026-11-20 14:54:32');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (19, 3, 1, 'mf-5', 'MYTH', 'MYTH', 1, 10, 4, 'COMPLETED', '2026-11-20 14:54:32', '2026-11-20 14:54:32', '2026-11-20 14:54:32');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (20, 3, 1, 'mf-6', 'FACT', 'FACT', 1, 10, 4, 'COMPLETED', '2026-11-20 14:54:32', '2026-11-20 14:54:32', '2026-11-20 14:54:32');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (21, 3, 1, 'mf-1', 'MYTH', 'MYTH', 1, 10, 5, 'ANSWERED', '2026-11-20 18:17:29', '2026-11-20 18:17:29', '2026-11-20 18:17:29');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (22, 3, 1, 'mf-2', 'MYTH', 'MYTH', 1, 10, 5, 'ANSWERED', '2026-11-20 18:17:32', '2026-11-20 18:17:32', '2026-11-20 18:17:32');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (23, 3, 1, 'mf-3', 'MYTH', 'MYTH', 1, 10, 5, 'ANSWERED', '2026-11-20 18:17:35', '2026-11-20 18:17:35', '2026-11-20 18:17:35');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (24, 3, 1, 'mf-4', 'FACT', 'FACT', 1, 10, 5, 'ANSWERED', '2026-11-20 18:17:39', '2026-11-20 18:17:39', '2026-11-20 18:17:39');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (25, 3, 1, 'mf-5', 'MYTH', 'MYTH', 1, 10, 5, 'ANSWERED', '2026-11-20 18:17:41', '2026-11-20 18:17:41', '2026-11-20 18:17:41');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (26, 3, 1, 'mf-6', 'FACT', 'FACT', 1, 10, 5, 'ANSWERED', '2026-11-20 18:17:44', '2026-11-20 18:17:44', '2026-11-20 18:17:44');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (27, 3, 1, 'mf-1', 'MYTH', 'MYTH', 1, 10, 5, 'COMPLETED', '2026-11-20 18:37:46', '2026-11-20 18:37:46', '2026-11-20 18:37:46');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (28, 3, 1, 'mf-2', 'MYTH', 'MYTH', 1, 10, 5, 'COMPLETED', '2026-11-20 18:37:46', '2026-11-20 18:37:46', '2026-11-20 18:37:46');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (29, 3, 1, 'mf-3', 'MYTH', 'MYTH', 1, 10, 5, 'COMPLETED', '2026-11-20 18:37:46', '2026-11-20 18:37:46', '2026-11-20 18:37:46');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (30, 3, 1, 'mf-4', 'FACT', 'FACT', 1, 10, 5, 'COMPLETED', '2026-11-20 18:37:46', '2026-11-20 18:37:46', '2026-11-20 18:37:46');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (31, 3, 1, 'mf-5', 'MYTH', 'MYTH', 1, 10, 5, 'COMPLETED', '2026-11-20 18:37:46', '2026-11-20 18:37:46', '2026-11-20 18:37:46');
INSERT INTO `myth_fact_student_responses` (`id`, `user_id`, `challenge_id`, `question_id`, `selected_answer`, `correct_answer`, `is_correct`, `score`, `attempt_number`, `status`, `started_at`, `completed_at`, `created_at`) VALUES (32, 3, 1, 'mf-6', 'FACT', 'FACT', 1, 10, 5, 'COMPLETED', '2026-11-20 18:37:46', '2026-11-20 18:37:46', '2026-11-20 18:37:46');

-- Table structure for `password_resets`
DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otp_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_token` (`token`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `password_resets` (1 records)
INSERT INTO `password_resets` (`id`, `user_id`, `email`, `otp_code`, `token`, `is_verified`, `expires_at`, `created_at`) VALUES (31, 3, 'paulrenine9487@gmail.com', '523189', 'e7af8a46c0146d8e645917bbd5f8f28a0c6f9d24b1084f0a1ea11d52d2587b92', 0, '2026-11-20 21:25:08', '2026-11-20 21:15:07');

-- Table structure for `posture_checklist_items`
DROP TABLE IF EXISTS `posture_checklist_items`;
CREATE TABLE `posture_checklist_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `part_id` int NOT NULL,
  `item_text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int DEFAULT '1',
  `is_required` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_part_item` (`part_id`,`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `posture_checklist_items` (5 records)
INSERT INTO `posture_checklist_items` (`id`, `part_id`, `item_text`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 'Feet about hip-width apart.', 1, 1, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');
INSERT INTO `posture_checklist_items` (`id`, `part_id`, `item_text`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (2, 1, 'Knees soft, not locked.', 2, 1, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');
INSERT INTO `posture_checklist_items` (`id`, `part_id`, `item_text`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (3, 1, 'Spine long, chin level.', 3, 1, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');
INSERT INTO `posture_checklist_items` (`id`, `part_id`, `item_text`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (4, 1, 'Shoulders down and relaxed.', 4, 1, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');
INSERT INTO `posture_checklist_items` (`id`, `part_id`, `item_text`, `display_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES (5, 1, 'Hands loose at your sides.', 5, 1, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');

-- Table structure for `posture_indicators`
DROP TABLE IF EXISTS `posture_indicators`;
CREATE TABLE `posture_indicators` (
  `id` int NOT NULL AUTO_INCREMENT,
  `part_id` int NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `body_region` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'circle',
  `display_order` int DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_part_indicator` (`part_id`,`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `posture_indicators` (5 records)
INSERT INTO `posture_indicators` (`id`, `part_id`, `title`, `description`, `body_region`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 'Head level', 'Align your ears directly over your shoulders. Keep your chin parallel to the floor without tucking in or tilting up.', 'head', 'head', 1, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');
INSERT INTO `posture_indicators` (`id`, `part_id`, `title`, `description`, `body_region`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (2, 1, 'Shoulders loose', 'Drop your shoulders naturally down and slightly back. Release any trapped trapezius tension.', 'shoulders', 'shoulders', 2, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');
INSERT INTO `posture_indicators` (`id`, `part_id`, `title`, `description`, `body_region`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (3, 1, 'Chest forward', 'Expand your lower intercostal ribs outward 360 degrees. Maintain buoyant expansion as you sing.', 'ribs', 'ribs', 3, 1, '2026-11-20 06:06:09', '2026-11-20 08:55:44');
INSERT INTO `posture_indicators` (`id`, `part_id`, `title`, `description`, `body_region`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (4, 1, 'Knees soft, not locked', 'Maintain a slight, elastic micro-bend in both knees to allow grounding and free pelvic alignment.', 'knees', 'knees', 4, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');
INSERT INTO `posture_indicators` (`id`, `part_id`, `title`, `description`, `body_region`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (5, 1, 'Feet hip-width apart', 'Place both feet firmly hip-width apart with weight balanced evenly between heel and ball of foot.', 'feet', 'feet', 5, 1, '2026-11-20 06:06:09', '2026-11-20 06:06:09');

-- Table structure for `practice_diary_tasks`
DROP TABLE IF EXISTS `practice_diary_tasks`;
CREATE TABLE `practice_diary_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('TODO','DOING','DONE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TODO',
  `priority` enum('LOW','MEDIUM','HIGH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `due_date` date DEFAULT NULL,
  `position` int NOT NULL DEFAULT '0',
  `learning_module_id` int DEFAULT NULL,
  `learning_stage_id` int DEFAULT NULL,
  `learning_task_id` int DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `learning_module_id` (`learning_module_id`),
  KEY `learning_stage_id` (`learning_stage_id`),
  KEY `learning_task_id` (`learning_task_id`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_user_position` (`user_id`,`position`),
  CONSTRAINT `practice_diary_tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `practice_diary_tasks_ibfk_2` FOREIGN KEY (`learning_module_id`) REFERENCES `learning_modules` (`id`) ON DELETE SET NULL,
  CONSTRAINT `practice_diary_tasks_ibfk_3` FOREIGN KEY (`learning_stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `practice_diary_tasks_ibfk_4` FOREIGN KEY (`learning_task_id`) REFERENCES `learning_tasks` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `practice_diary_tasks` (2 records)
INSERT INTO `practice_diary_tasks` (`id`, `user_id`, `title`, `description`, `status`, `priority`, `due_date`, `position`, `learning_module_id`, `learning_stage_id`, `learning_task_id`, `started_at`, `completed_at`, `created_at`, `updated_at`) VALUES (7, 3, 'learning', 'task', 'TODO', 'LOW', '2026-11-22 18:30:00', 0, 1, 2, 2, '2026-11-18 10:38:23', '2026-11-18 10:39:24', '2026-11-18 10:38:16', '2026-11-19 16:42:41');
INSERT INTO `practice_diary_tasks` (`id`, `user_id`, `title`, `description`, `status`, `priority`, `due_date`, `position`, `learning_module_id`, `learning_stage_id`, `learning_task_id`, `started_at`, `completed_at`, `created_at`, `updated_at`) VALUES (12, 3, 'Vocal Classical Music', 'Snowman Sia song', 'DONE', 'MEDIUM', '2026-11-23 18:30:00', 0, 1, 2, 2, '2026-11-18 11:35:21', '2026-11-18 11:35:27', '2026-11-18 11:35:14', '2026-11-18 11:35:26');

-- Table structure for `practice_reflections`
DROP TABLE IF EXISTS `practice_reflections`;
CREATE TABLE `practice_reflections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `practice_type` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_minutes` int NOT NULL DEFAULT '5',
  `reflection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `practice_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `linked_task_id` int DEFAULT NULL,
  `session_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `linked_task_id` (`linked_task_id`),
  KEY `idx_user_reflections` (`user_id`),
  KEY `idx_practice_date` (`practice_date`),
  CONSTRAINT `practice_reflections_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `practice_reflections_ibfk_2` FOREIGN KEY (`linked_task_id`) REFERENCES `learning_tasks` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `practice_sessions`
DROP TABLE IF EXISTS `practice_sessions`;
CREATE TABLE `practice_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `task_id` int DEFAULT NULL,
  `reflection_id` int DEFAULT NULL,
  `session_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `exercise_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `duration_minutes` int NOT NULL DEFAULT '0',
  `duration_seconds` int NOT NULL DEFAULT '0',
  `session_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `completion_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_practice` (`user_id`),
  CONSTRAINT `practice_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `practice_sessions` (29 records)
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (114, 3, NULL, NULL, 'Song Practice', 'Breath Management: Amazing Grace (Vocal Phrasing & Breath Marks)', '2026-11-20 05:29:35', '2026-11-20 05:37:35', 8, 480, 'completed', 'completed', 'Practised diaphragmatic phrasing with song: Amazing Grace (Vocal Phrasing & Breath Marks)', '2026-11-20 05:37:35', '2026-11-20 05:37:35');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (125, 3, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 06:37:22', '2026-11-20 06:42:22', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 06:42:22', '2026-11-20 06:42:22');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (130, 3, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 07:56:15', '2026-11-20 08:01:15', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 08:01:15', '2026-11-20 08:01:15');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (131, 3, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 08:17:43', '2026-11-20 08:22:43', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 08:22:43', '2026-11-20 08:22:43');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (132, 3, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 08:19:26', '2026-11-20 08:24:26', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 08:24:26', '2026-11-20 08:24:26');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (133, 3, NULL, NULL, 'BREATHING_PRACTICE', 'Stage 03 Part 02 - Breathing Practice (Beginner)', NULL, NULL, 2, 85, 'COMPLETED', 'COMPLETED', '{\"level_key\":\"beginner\",\"inhale\":4,\"hold\":3,\"exhale\":10,\"cycles\":5}', '2026-11-20 08:41:23', '2026-11-20 08:41:23');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (134, 3, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 08:37:05', '2026-11-20 08:42:05', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 08:42:05', '2026-11-20 08:42:05');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (135, 3, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 08:45:06', '2026-11-20 08:50:06', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 08:50:06', '2026-11-20 08:50:06');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (136, 74, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 08:51:03', '2026-11-20 08:56:03', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 08:56:03', '2026-11-20 08:56:03');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (137, 74, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 09:01:22', '2026-11-20 09:06:22', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 09:06:22', '2026-11-20 09:06:22');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (138, 74, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 09:01:24', '2026-11-20 09:06:24', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 09:06:24', '2026-11-20 09:06:24');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (139, 74, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 09:11:13', '2026-11-20 09:16:13', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 09:16:13', '2026-11-20 09:16:13');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (140, 3, NULL, NULL, 'Stage 3 Practice', 'Diaphragmatic Rib Breathing', '2026-11-20 09:46:21', '2026-11-20 09:51:21', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - breathe practice completed.', '2026-11-20 09:51:21', '2026-11-20 09:51:21');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (141, 3, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 09:47:22', '2026-11-20 09:52:22', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 09:52:22', '2026-11-20 09:52:22');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (142, 3, NULL, NULL, 'Stage 3 Practice', 'Diaphragmatic Rib Breathing', '2026-11-20 09:48:01', '2026-11-20 09:53:01', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - breathe practice completed.', '2026-11-20 09:53:01', '2026-11-20 09:53:01');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (143, 3, NULL, NULL, 'Stage 3 Practice', 'Diaphragmatic Rib Breathing', '2026-11-20 10:05:09', '2026-11-20 10:10:09', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - breathe practice completed.', '2026-11-20 10:10:09', '2026-11-20 10:10:09');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (144, 3, NULL, NULL, 'song_practice', 'Snowman (Beginner)', NULL, NULL, 1, 0, 'COMPLETED', 'completed', 'Song Practice: 0 notes marked, repeated 1 time(s).', '2026-11-20 10:49:29', '2026-11-20 10:49:29');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (145, 3, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 10:47:47', '2026-11-20 10:52:47', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 10:52:47', '2026-11-20 10:52:47');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (146, 3, NULL, NULL, 'Stage 3 Practice', 'Diaphragmatic Rib Breathing', '2026-11-20 10:48:34', '2026-11-20 10:53:34', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - breathe practice completed.', '2026-11-20 10:53:34', '2026-11-20 10:53:34');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (147, 3, NULL, NULL, 'song_practice', 'Snowman (Advanced)', NULL, NULL, 1, 10, 'COMPLETED', 'completed', 'Song Practice: 0 notes marked, repeated 1 time(s).', '2026-11-20 10:53:58', '2026-11-20 10:53:58');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (148, 3, NULL, NULL, 'Stage 3 Practice', 'Amazing Grace (Breath Integration)', '2026-11-20 10:48:58', '2026-11-20 10:53:58', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - song practice completed.', '2026-11-20 10:53:58', '2026-11-20 10:53:58');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (149, 3, NULL, NULL, 'Stage 3 Practice', 'Singing Posture Alignment', '2026-11-20 10:53:26', '2026-11-20 10:58:26', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - posture practice completed.', '2026-11-20 10:58:26', '2026-11-20 10:58:26');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (150, 3, NULL, NULL, 'Stage 3 Practice', 'Diaphragmatic Rib Breathing', '2026-11-20 10:54:45', '2026-11-20 10:59:45', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - breathe practice completed.', '2026-11-20 10:59:45', '2026-11-20 10:59:45');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (155, 3, NULL, NULL, 'Learning Journal', 'Breath Routine & Song Vocalization', NULL, NULL, 20, 1200, 'completed', 'completed', 'Completed via Learning Journal Kanban', '2026-11-20 19:42:09', '2026-11-20 19:42:09');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (156, 3, NULL, NULL, 'Learning Journal', 'Breath Routine & Song Vocalization', NULL, NULL, 20, 1200, 'completed', 'completed', 'Completed via Learning Journal Kanban', '2026-11-20 19:44:52', '2026-11-20 19:44:52');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (157, 3, NULL, NULL, 'Learning Journal', 'Breath Routine & Song Vocalization', NULL, NULL, 20, 1200, 'completed', 'completed', 'Completed via Learning Journal Kanban', '2026-11-20 19:44:58', '2026-11-20 19:44:58');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (158, 3, NULL, NULL, 'Learning Journal', 'Breath Routine & Song Vocalization', NULL, NULL, 20, 1200, 'completed', 'completed', 'Completed via Learning Journal Kanban', '2026-11-20 19:56:11', '2026-11-20 19:56:11');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (159, 3, NULL, NULL, 'song_practice', 'Snowman (Beginner)', NULL, NULL, 1, 10, 'COMPLETED', 'completed', 'Song Practice: 2 notes marked, repeated 1 time(s).', '2026-11-20 20:47:49', '2026-11-20 20:47:49');
INSERT INTO `practice_sessions` (`id`, `user_id`, `task_id`, `reflection_id`, `session_type`, `exercise_name`, `start_time`, `end_time`, `duration_minutes`, `duration_seconds`, `session_status`, `completion_status`, `notes`, `created_at`, `completed_at`) VALUES (160, 3, NULL, NULL, 'Stage 3 Practice', 'Amazing Grace (Breath Integration)', '2026-11-20 20:42:49', '2026-11-20 20:47:49', 5, 300, 'completed', 'completed', 'Stage 03 Part 02 - song practice completed.', '2026-11-20 20:47:49', '2026-11-20 20:47:49');

-- Table structure for `practice_task_history`
DROP TABLE IF EXISTS `practice_task_history`;
CREATE TABLE `practice_task_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `diary_task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `previous_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_diary_task` (`diary_task_id`),
  KEY `idx_history_user` (`user_id`),
  CONSTRAINT `practice_task_history_ibfk_1` FOREIGN KEY (`diary_task_id`) REFERENCES `practice_diary_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `practice_task_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `practice_task_history` (18 records)
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (13, 7, 3, NULL, 'TODO', '2026-11-18 10:38:16', 'Task created in practice diary');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (14, 7, 3, 'TODO', 'DOING', '2026-11-18 10:38:23', 'Task moved from TODO to DOING');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (15, 7, 3, 'DOING', 'TODO', '2026-11-18 10:38:26', 'Task moved from DOING to TODO');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (16, 7, 3, 'TODO', 'DOING', '2026-11-18 10:38:31', 'Task moved from TODO to DOING');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (17, 7, 3, 'DOING', 'DONE', '2026-11-18 10:38:38', 'Task moved from DOING to DONE');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (18, 7, 3, 'DONE', 'TODO', '2026-11-18 10:38:42', 'Task moved from DONE to TODO');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (19, 7, 3, 'TODO', 'DOING', '2026-11-18 10:38:50', 'Task moved from TODO to DOING');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (20, 7, 3, 'DOING', 'TODO', '2026-11-18 10:38:53', 'Task moved from DOING to TODO');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (21, 7, 3, 'TODO', 'DOING', '2026-11-18 10:39:01', 'Task moved from TODO to DOING');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (22, 7, 3, 'DOING', 'DONE', '2026-11-18 10:39:02', 'Task moved from DOING to DONE');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (23, 7, 3, 'DONE', 'TODO', '2026-11-18 10:39:04', 'Task moved from DONE to TODO');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (24, 7, 3, 'TODO', 'DOING', '2026-11-18 10:39:21', 'Task moved from TODO to DOING');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (25, 7, 3, 'DOING', 'DONE', '2026-11-18 10:39:24', 'Task moved from DOING to DONE');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (34, 12, 3, NULL, 'TODO', '2026-11-18 11:35:14', 'Task created in practice diary');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (35, 12, 3, 'TODO', 'DOING', '2026-11-18 11:35:20', 'Task moved from TODO to DOING');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (36, 12, 3, 'DOING', 'DONE', '2026-11-18 11:35:26', 'Task moved from DOING to DONE');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (49, 7, 3, 'DONE', 'DOING', '2026-11-19 16:42:37', 'Task moved from DONE to DOING');
INSERT INTO `practice_task_history` (`id`, `diary_task_id`, `user_id`, `previous_status`, `new_status`, `changed_at`, `notes`) VALUES (50, 7, 3, 'DOING', 'TODO', '2026-11-19 16:42:41', 'Task moved from DOING to TODO');

-- Table structure for `recall_answers`
DROP TABLE IF EXISTS `recall_answers`;
CREATE TABLE `recall_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `question_id` int NOT NULL,
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempt_number` int NOT NULL DEFAULT '1',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `recall_answers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recall_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `recall_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `recall_answers` (8 records)
INSERT INTO `recall_answers` (`id`, `user_id`, `question_id`, `answer`, `attempt_number`, `submitted_at`, `updated_at`) VALUES (69, 3, 1, 'very hard', 1, '2026-11-19 22:58:39', '2026-11-19 22:58:39');
INSERT INTO `recall_answers` (`id`, `user_id`, `question_id`, `answer`, `attempt_number`, `submitted_at`, `updated_at`) VALUES (70, 3, 2, 'how to sing without trouble', 1, '2026-11-19 22:58:39', '2026-11-19 22:58:39');
INSERT INTO `recall_answers` (`id`, `user_id`, `question_id`, `answer`, `attempt_number`, `submitted_at`, `updated_at`) VALUES (71, 3, 1, 'very hard', 2, '2026-11-19 22:58:48', '2026-11-19 22:58:48');
INSERT INTO `recall_answers` (`id`, `user_id`, `question_id`, `answer`, `attempt_number`, `submitted_at`, `updated_at`) VALUES (72, 3, 2, 'how to sing without trouble', 2, '2026-11-19 22:58:48', '2026-11-19 22:58:48');
INSERT INTO `recall_answers` (`id`, `user_id`, `question_id`, `answer`, `attempt_number`, `submitted_at`, `updated_at`) VALUES (83, 3, 1, 'very hard', 3, '2026-11-20 10:57:39', '2026-11-20 10:57:39');
INSERT INTO `recall_answers` (`id`, `user_id`, `question_id`, `answer`, `attempt_number`, `submitted_at`, `updated_at`) VALUES (84, 3, 2, 'how to sing without trouble', 3, '2026-11-20 10:57:39', '2026-11-20 10:57:39');
INSERT INTO `recall_answers` (`id`, `user_id`, `question_id`, `answer`, `attempt_number`, `submitted_at`, `updated_at`) VALUES (85, 3, 1, 'very hard', 4, '2026-11-20 20:44:22', '2026-11-20 20:44:22');
INSERT INTO `recall_answers` (`id`, `user_id`, `question_id`, `answer`, `attempt_number`, `submitted_at`, `updated_at`) VALUES (86, 3, 2, 'how to sing without trouble', 4, '2026-11-20 20:44:22', '2026-11-20 20:44:22');

-- Table structure for `recall_questions`
DROP TABLE IF EXISTS `recall_questions`;
CREATE TABLE `recall_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stage_id` int NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `display_order` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `recall_questions_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `recall_questions` (2 records)
INSERT INTO `recall_questions` (`id`, `stage_id`, `question`, `instructions`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1, 2, 'What words come to mind when you hear breath management ?', 'Type words or keywords that come to mind.', 1, 1, '2026-11-19 09:28:56', '2026-11-19 22:48:14');
INSERT INTO `recall_questions` (`id`, `stage_id`, `question`, `instructions`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (2, 2, 'What would you like to learn from this module?', 'Share what vocal goals or skills you hope to learn.', 2, 1, '2026-11-19 09:28:56', '2026-11-19 22:48:14');

-- Table structure for `revoked_tokens`
DROP TABLE IF EXISTS `revoked_tokens`;
CREATE TABLE `revoked_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `revoked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_revoked_hash` (`token_hash`),
  KEY `idx_revoked_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `revoked_tokens` (1 records)
INSERT INTO `revoked_tokens` (`id`, `token_hash`, `user_id`, `expires_at`, `revoked_at`) VALUES (1, '2a076e12c42a537cd9b7af708b2aaf0138659a098c3032c901461d8928f1a2b5', 3, '2026-11-22 19:28:43', '2026-11-22 18:28:43');

-- Table structure for `security_audit_logs`
DROP TABLE IF EXISTS `security_audit_logs`;
CREATE TABLE `security_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUCCESS',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `security_audit_logs` (21 records)
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (1, 233, 'idor_tester_1795372046449', 'UNAUTHORIZED_STUDENT_RECORDING_ACCESS_ATTEMPT', 'BLOCKED', '::ffff:127.0.0.1', NULL, '{\"ownerId\":3,\"targetRecordingId\":20}', '2026-11-22 18:27:26');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (2, 3, 'Renin', 'ATTEMPT_EVALUATIVE_ACTIVITY_BYPASS', 'BLOCKED', '::ffff:127.0.0.1', NULL, '{\"stage_id\":4,\"attemptedActivity\":\"s4_student_recording\"}', '2026-11-22 18:27:26');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (3, 74, 'Notreoblemccmrfip', 'MFA_VERIFICATION_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"method\":\"TOTP\"}', '2026-11-22 18:27:26');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (4, 74, 'Notreoblemccmrfip', 'LOGIN_SUCCESS_WITH_MFA', 'SUCCESS', '::ffff:127.0.0.1', NULL, '{\"role\":\"SUPERADMIN\",\"method\":\"TOTP\"}', '2026-11-22 18:27:26');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (5, 234, 'brutetest_1795372046605', 'LOGIN_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"locked\":false,\"failedAttempts\":1}', '2026-11-22 18:27:26');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (6, 234, 'brutetest_1795372046605', 'LOGIN_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"locked\":false,\"failedAttempts\":2}', '2026-11-22 18:27:26');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (7, 234, 'brutetest_1795372046605', 'LOGIN_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"locked\":false,\"failedAttempts\":3}', '2026-11-22 18:27:26');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (8, 234, 'brutetest_1795372046605', 'LOGIN_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"locked\":false,\"failedAttempts\":4}', '2026-11-22 18:27:26');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (9, 234, 'brutetest_1795372046605', 'LOGIN_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"locked\":true,\"failedAttempts\":5}', '2026-11-22 18:27:26');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (10, 234, 'brutetest_1795372046605', 'LOGIN_BLOCKED_LOCKED_ACCOUNT', 'BLOCKED', '::ffff:127.0.0.1', NULL, '{\"remainingMinutes\":16}', '2026-11-22 18:27:26');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (11, 235, 'idor_tester_1795372123145', 'UNAUTHORIZED_STUDENT_RECORDING_ACCESS_ATTEMPT', 'BLOCKED', '::ffff:127.0.0.1', NULL, '{\"ownerId\":3,\"targetRecordingId\":20}', '2026-11-22 18:28:43');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (12, 3, 'Renin', 'ATTEMPT_EVALUATIVE_ACTIVITY_BYPASS', 'BLOCKED', '::ffff:127.0.0.1', NULL, '{\"stage_id\":4,\"attemptedActivity\":\"s4_student_recording\"}', '2026-11-22 18:28:43');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (13, 74, 'Notreoblemccmrfip', 'MFA_VERIFICATION_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"method\":\"TOTP\"}', '2026-11-22 18:28:43');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (14, 74, 'Notreoblemccmrfip', 'LOGIN_SUCCESS_WITH_MFA', 'SUCCESS', '::ffff:127.0.0.1', NULL, '{\"role\":\"SUPERADMIN\",\"method\":\"TOTP\"}', '2026-11-22 18:28:43');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (15, 236, 'brutetest_1795372123299', 'LOGIN_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"locked\":false,\"failedAttempts\":1}', '2026-11-22 18:28:43');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (16, 236, 'brutetest_1795372123299', 'LOGIN_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"locked\":false,\"failedAttempts\":2}', '2026-11-22 18:28:43');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (17, 236, 'brutetest_1795372123299', 'LOGIN_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"locked\":false,\"failedAttempts\":3}', '2026-11-22 18:28:43');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (18, 236, 'brutetest_1795372123299', 'LOGIN_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"locked\":false,\"failedAttempts\":4}', '2026-11-22 18:28:43');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (19, 236, 'brutetest_1795372123299', 'LOGIN_FAILED', 'FAILURE', '::ffff:127.0.0.1', NULL, '{\"locked\":true,\"failedAttempts\":5}', '2026-11-22 18:28:43');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (20, 236, 'brutetest_1795372123299', 'LOGIN_BLOCKED_LOCKED_ACCOUNT', 'BLOCKED', '::ffff:127.0.0.1', NULL, '{\"remainingMinutes\":16}', '2026-11-22 18:28:43');
INSERT INTO `security_audit_logs` (`id`, `user_id`, `username`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES (21, 3, NULL, 'LOGOUT_REVOKED_TOKEN', 'SUCCESS', '::ffff:127.0.0.1', NULL, NULL, '2026-11-22 18:28:43');

-- Table structure for `song_practice_content`
DROP TABLE IF EXISTS `song_practice_content`;
CREATE TABLE `song_practice_content` (
  `id` int NOT NULL AUTO_INCREMENT,
  `part_id` int DEFAULT '1',
  `song_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Snowman',
  `artist_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Sia',
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Audio guide',
  `description` text COLLATE utf8mb4_unicode_ci,
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `audio_file` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '/audio/snowman-vocal-guide.wav',
  `cover_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_repeat_count` int DEFAULT '1',
  `min_repeat_count` int DEFAULT '1',
  `max_repeat_count` int DEFAULT '3',
  `continuous_loop_enabled` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_part_id` (`part_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `song_practice_content` (1 records)
INSERT INTO `song_practice_content` (`id`, `part_id`, `song_title`, `artist_name`, `subtitle`, `description`, `instructions`, `audio_file`, `cover_image`, `default_repeat_count`, `min_repeat_count`, `max_repeat_count`, `continuous_loop_enabled`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 'Snowman', 'Sia', 'Audio guide', 'Apply what we\'re learning in a song with interactive score sheet and breath pacing markers.', 'Now let\'s use your breathing in a real song. Listen once. Then choose your level and sing along, taking a breath wherever you see a tick on the score.\n\nStart at Beginner and move up when it feels comfortable.', '/audio/snowman-vocal-guide.wav', NULL, 1, 1, 3, 1, 1, '2026-11-20 10:20:31', '2026-11-20 10:20:31');

-- Table structure for `song_practice_levels`
DROP TABLE IF EXISTS `song_practice_levels`;
CREATE TABLE `song_practice_levels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `song_id` int NOT NULL,
  `level_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `score_file` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `score_file_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'svg',
  `score_svg_content` longtext COLLATE utf8mb4_unicode_ci,
  `total_notes` int DEFAULT '12',
  `default_repeat_count` int DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_song_level` (`song_id`,`level_key`),
  KEY `idx_song_id` (`song_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `song_practice_levels` (3 records)
INSERT INTO `song_practice_levels` (`id`, `song_id`, `level_key`, `level_name`, `score_file`, `score_file_type`, `score_svg_content`, `total_notes`, `default_repeat_count`, `is_active`, `display_order`, `created_at`, `updated_at`) VALUES (1, 1, 'beginner', 'Beginner', NULL, 'svg', NULL, 12, 1, 1, 1, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_practice_levels` (`id`, `song_id`, `level_key`, `level_name`, `score_file`, `score_file_type`, `score_svg_content`, `total_notes`, `default_repeat_count`, `is_active`, `display_order`, `created_at`, `updated_at`) VALUES (2, 1, 'intermediate', 'Intermediate', NULL, 'svg', NULL, 16, 1, 1, 2, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_practice_levels` (`id`, `song_id`, `level_key`, `level_name`, `score_file`, `score_file_type`, `score_svg_content`, `total_notes`, `default_repeat_count`, `is_active`, `display_order`, `created_at`, `updated_at`) VALUES (3, 1, 'advanced', 'Advanced', NULL, 'svg', NULL, 20, 1, 1, 3, '2026-11-20 10:20:31', '2026-11-20 10:20:31');

-- Table structure for `song_practice_phrases`
DROP TABLE IF EXISTS `song_practice_phrases`;
CREATE TABLE `song_practice_phrases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `song_practice_id` int NOT NULL,
  `phrase_number` int NOT NULL,
  `phrase_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `inhale_position` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Before phrase',
  `exhale_guidance` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Controlled sustained exhale',
  `practice_notes` text COLLATE utf8mb4_unicode_ci,
  `completion_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `song_practice_id` (`song_practice_id`),
  CONSTRAINT `song_practice_phrases_ibfk_1` FOREIGN KEY (`song_practice_id`) REFERENCES `user_song_practice` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `song_score_markers`
DROP TABLE IF EXISTS `song_score_markers`;
CREATE TABLE `song_score_markers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level_id` int NOT NULL,
  `marker_type` enum('breath','note') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note_reference` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position_x` decimal(6,2) NOT NULL,
  `position_y` decimal(6,2) NOT NULL,
  `phrase_number` int DEFAULT '1',
  `display_order` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_level_marker` (`level_id`,`marker_type`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `song_score_markers` (60 records)
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (1, 1, 'breath', 'B1', 'Breath 1', '15.00', '15.00', 1, 1, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (2, 1, 'breath', 'B2', 'Breath 2', '39.00', '15.00', 1, 2, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (3, 1, 'breath', 'B3', 'Breath 3', '15.00', '45.00', 2, 3, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (4, 1, 'note', 'N1', 'Don\'t', '18.00', '28.00', 1, 1, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (5, 1, 'note', 'N2', 'cry', '27.00', '28.00', 1, 2, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (6, 1, 'note', 'N3', 'snow-', '42.00', '28.00', 1, 3, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (7, 1, 'note', 'N4', 'man', '52.00', '28.00', 1, 4, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (8, 1, 'note', 'N5', 'not', '64.00', '28.00', 1, 5, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (9, 1, 'note', 'N6', 'in', '74.00', '28.00', 1, 6, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (10, 1, 'note', 'N7', 'front', '84.00', '28.00', 1, 7, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (11, 1, 'note', 'N8', 'of me', '93.00', '28.00', 1, 8, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (12, 1, 'note', 'N9', 'Who\'ll', '18.00', '58.00', 2, 9, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (13, 1, 'note', 'N10', 'catch', '28.00', '58.00', 2, 10, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (14, 1, 'note', 'N11', 'your tears', '44.00', '58.00', 2, 11, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (15, 1, 'note', 'N12', 'darling', '70.00', '58.00', 2, 12, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (16, 2, 'breath', 'IB1', 'Breath 1', '14.00', '14.00', 1, 1, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (17, 2, 'breath', 'IB2', 'Breath 2', '50.00', '14.00', 1, 2, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (18, 2, 'breath', 'IB3', 'Breath 3', '14.00', '40.00', 2, 3, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (19, 2, 'breath', 'IB4', 'Breath 4', '14.00', '68.00', 3, 4, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (20, 2, 'note', 'IN1', 'Don\'t', '17.00', '24.00', 1, 1, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (21, 2, 'note', 'IN2', 'cry', '26.00', '24.00', 1, 2, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (22, 2, 'note', 'IN3', 'snow-', '36.00', '24.00', 1, 3, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (23, 2, 'note', 'IN4', 'man', '45.00', '24.00', 1, 4, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (24, 2, 'note', 'IN5', 'not', '55.00', '24.00', 1, 5, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (25, 2, 'note', 'IN6', 'in', '65.00', '24.00', 1, 6, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (26, 2, 'note', 'IN7', 'front', '76.00', '24.00', 1, 7, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (27, 2, 'note', 'IN8', 'of me', '88.00', '24.00', 1, 8, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (28, 2, 'note', 'IN9', 'Who\'ll', '17.00', '50.00', 2, 9, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (29, 2, 'note', 'IN10', 'catch', '27.00', '50.00', 2, 10, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (30, 2, 'note', 'IN11', 'your', '38.00', '50.00', 2, 11, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (31, 2, 'note', 'IN12', 'tears', '50.00', '50.00', 2, 12, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (32, 2, 'note', 'IN13', 'dar-', '68.00', '50.00', 2, 13, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (33, 2, 'note', 'IN14', 'ling', '82.00', '50.00', 2, 14, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (34, 2, 'note', 'IN15', 'A puddle', '24.00', '78.00', 3, 15, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (35, 2, 'note', 'IN16', 'of water', '56.00', '78.00', 3, 16, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (36, 3, 'breath', 'AB1', 'Catch 1', '13.00', '12.00', 1, 1, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (37, 3, 'breath', 'AB2', 'Catch 2', '48.00', '12.00', 1, 2, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (38, 3, 'breath', 'AB3', 'Catch 3', '13.00', '36.00', 2, 3, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (39, 3, 'breath', 'AB4', 'Catch 4', '13.00', '60.00', 3, 4, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (40, 3, 'breath', 'AB5', 'Catch 5', '13.00', '80.00', 4, 5, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (41, 3, 'note', 'AN1', 'Don\'t', '16.00', '22.00', 1, 1, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (42, 3, 'note', 'AN2', 'cry', '24.00', '22.00', 1, 2, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (43, 3, 'note', 'AN3', 'snow-', '33.00', '22.00', 1, 3, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (44, 3, 'note', 'AN4', 'man', '42.00', '22.00', 1, 4, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (45, 3, 'note', 'AN5', 'not', '52.00', '22.00', 1, 5, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (46, 3, 'note', 'AN6', 'in', '62.00', '22.00', 1, 6, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (47, 3, 'note', 'AN7', 'front', '72.00', '22.00', 1, 7, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (48, 3, 'note', 'AN8', 'of me', '84.00', '22.00', 1, 8, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (49, 3, 'note', 'AN9', 'Who\'ll', '16.00', '46.00', 2, 9, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (50, 3, 'note', 'AN10', 'catch', '25.00', '46.00', 2, 10, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (51, 3, 'note', 'AN11', 'your', '35.00', '46.00', 2, 11, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (52, 3, 'note', 'AN12', 'tears', '46.00', '46.00', 2, 12, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (53, 3, 'note', 'AN13', 'dar-', '62.00', '46.00', 2, 13, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (54, 3, 'note', 'AN14', 'ling', '75.00', '46.00', 2, 14, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (55, 3, 'note', 'AN15', 'puddle', '20.00', '69.00', 3, 15, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (56, 3, 'note', 'AN16', 'of water', '45.00', '69.00', 3, 16, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (57, 3, 'note', 'AN17', 'hold me', '68.00', '69.00', 3, 17, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (58, 3, 'note', 'AN18', 'close', '86.00', '69.00', 3, 18, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (59, 3, 'note', 'AN19', 'hide from', '30.00', '89.00', 4, 19, '2026-11-20 10:20:31', '2026-11-20 10:20:31');
INSERT INTO `song_score_markers` (`id`, `level_id`, `marker_type`, `note_reference`, `note_name`, `position_x`, `position_y`, `phrase_number`, `display_order`, `created_at`, `updated_at`) VALUES (60, 3, 'note', 'AN20', 'the sun', '65.00', '89.00', 4, 20, '2026-11-20 10:20:31', '2026-11-20 10:20:31');

-- Table structure for `student_breathing_sessions`
DROP TABLE IF EXISTS `student_breathing_sessions`;
CREATE TABLE `student_breathing_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `level_key` varchar(50) NOT NULL,
  `inhale_duration` decimal(4,1) NOT NULL,
  `hold_duration` decimal(4,1) NOT NULL,
  `exhale_duration` decimal(4,1) NOT NULL,
  `completed_cycles` int NOT NULL,
  `target_cycles` int NOT NULL,
  `total_duration_seconds` int NOT NULL,
  `completion_status` varchar(50) NOT NULL DEFAULT 'COMPLETED',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_level` (`user_id`,`level_key`),
  CONSTRAINT `student_breathing_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table `student_breathing_sessions` (1 records)
INSERT INTO `student_breathing_sessions` (`id`, `user_id`, `level_key`, `inhale_duration`, `hold_duration`, `exhale_duration`, `completed_cycles`, `target_cycles`, `total_duration_seconds`, `completion_status`, `notes`, `created_at`) VALUES (1, 3, 'beginner', '4.0', '3.0', '10.0', 5, 5, 85, 'COMPLETED', 'Automated test of breathing exercise completion', '2026-11-20 08:41:23');

-- Table structure for `student_commitment_activities`
DROP TABLE IF EXISTS `student_commitment_activities`;
CREATE TABLE `student_commitment_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `commitment_id` int NOT NULL,
  `user_id` int NOT NULL,
  `activity_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `repetitions_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_selected` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sca_commitment` (`commitment_id`),
  KEY `idx_sca_user` (`user_id`),
  KEY `idx_sca_act` (`activity_key`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_commitment_activities` (6 records)
INSERT INTO `student_commitment_activities` (`id`, `commitment_id`, `user_id`, `activity_key`, `activity_title`, `duration_label`, `repetitions_label`, `is_selected`, `created_at`, `updated_at`) VALUES (31, 4, 3, 'vocal_warmup', 'Vocal Warm-up', '5 min', '1 round', 1, '2026-11-20 19:44:40', '2026-11-20 19:44:40');
INSERT INTO `student_commitment_activities` (`id`, `commitment_id`, `user_id`, `activity_key`, `activity_title`, `duration_label`, `repetitions_label`, `is_selected`, `created_at`, `updated_at`) VALUES (32, 4, 3, 'posture_breathing_simulation', 'Posture & Breathing Simulation', '5 min', '3 cycles', 1, '2026-11-20 19:44:40', '2026-11-20 19:44:40');
INSERT INTO `student_commitment_activities` (`id`, `commitment_id`, `user_id`, `activity_key`, `activity_title`, `duration_label`, `repetitions_label`, `is_selected`, `created_at`, `updated_at`) VALUES (33, 4, 3, 'hiss_exhalation', 'Hiss Exhalation Practice', '3 min', '5 repetitions', 1, '2026-11-20 19:44:40', '2026-11-20 19:44:40');
INSERT INTO `student_commitment_activities` (`id`, `commitment_id`, `user_id`, `activity_key`, `activity_title`, `duration_label`, `repetitions_label`, `is_selected`, `created_at`, `updated_at`) VALUES (34, 4, 3, 'song_practice_recording', 'Song Practice & Recording', '10 min', '2 rounds', 1, '2026-11-20 19:44:40', '2026-11-20 19:44:40');
INSERT INTO `student_commitment_activities` (`id`, `commitment_id`, `user_id`, `activity_key`, `activity_title`, `duration_label`, `repetitions_label`, `is_selected`, `created_at`, `updated_at`) VALUES (35, 4, 3, 'journal_kanban_tracker', 'Practice Journal & Kanban Tracker', '3 min', '1 entry', 1, '2026-11-20 19:44:40', '2026-11-20 19:44:40');
INSERT INTO `student_commitment_activities` (`id`, `commitment_id`, `user_id`, `activity_key`, `activity_title`, `duration_label`, `repetitions_label`, `is_selected`, `created_at`, `updated_at`) VALUES (36, 4, 3, 'vocal_cooldown', 'Vocal Cool-down – Gentle Sighs', '2 min', '5 repetitions', 1, '2026-11-20 19:44:40', '2026-11-20 19:44:40');

-- Table structure for `student_learning_reflection_history`
DROP TABLE IF EXISTS `student_learning_reflection_history`;
CREATE TABLE `student_learning_reflection_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reflection_id` int NOT NULL,
  `user_id` int NOT NULL,
  `question_1_answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_2_answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_3_answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `version_number` int NOT NULL DEFAULT '1',
  `saved_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_history_user` (`user_id`),
  KEY `idx_history_reflection` (`reflection_id`),
  CONSTRAINT `fk_history_reflection` FOREIGN KEY (`reflection_id`) REFERENCES `student_learning_reflections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_learning_reflection_history` (4 records)
INSERT INTO `student_learning_reflection_history` (`id`, `reflection_id`, `user_id`, `question_1_answer`, `question_2_answer`, `question_3_answer`, `version_number`, `saved_at`) VALUES (1, 1, 3, 'I know that breathing is important for singing and supporting sustained phrases.', 'I want to learn how to control my airflow while singing long phrases without feeling out of breath.', 'I learned that controlled airflow and steady rib engagement matter much more than taking a massive breath.', 1, '2026-11-20 14:49:23');
INSERT INTO `student_learning_reflection_history` (`id`, `reflection_id`, `user_id`, `question_1_answer`, `question_2_answer`, `question_3_answer`, `version_number`, `saved_at`) VALUES (2, 1, 3, 'I know that breathing is important for singing and supporting sustained phrases.', 'I want to learn how to control my airflow while singing long phrases without feeling out of breath.', 'I learned that controlled airflow, relaxed shoulders, and open floating ribs maintain stable vocal stamina.', 2, '2026-11-20 14:49:23');
INSERT INTO `student_learning_reflection_history` (`id`, `reflection_id`, `user_id`, `question_1_answer`, `question_2_answer`, `question_3_answer`, `version_number`, `saved_at`) VALUES (3, 1, 3, 'I know that breathing is important for singing and supporting sustained phrases.', 'I want to learn how to control my airflow while singing long phrases without feeling out of breath.', 'I learned that controlled airflow, relaxed shoulders, and open floating ribs maintain stable vocal stamina.', 3, '2026-11-20 14:51:05');
INSERT INTO `student_learning_reflection_history` (`id`, `reflection_id`, `user_id`, `question_1_answer`, `question_2_answer`, `question_3_answer`, `version_number`, `saved_at`) VALUES (4, 1, 3, 'I know that breathing is important for singing and supporting sustained phrases.', 'I want to learn how to control my airflow while singing long phrases without feeling out of breath.', 'I learned that controlled airflow, relaxed shoulders, and open floating ribs maintain stable vocal stamina.', 4, '2026-11-20 14:51:47');

-- Table structure for `student_learning_reflections`
DROP TABLE IF EXISTS `student_learning_reflections`;
CREATE TABLE `student_learning_reflections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `module_id` int NOT NULL DEFAULT '1',
  `stage_id` int NOT NULL DEFAULT '4',
  `question_1_answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_2_answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_3_answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED') COLLATE utf8mb4_unicode_ci DEFAULT 'COMPLETED',
  `submitted_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_module_stage` (`user_id`,`module_id`,`stage_id`),
  KEY `idx_reflections_user` (`user_id`),
  KEY `idx_reflections_module_stage` (`module_id`,`stage_id`),
  CONSTRAINT `fk_reflections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_learning_reflections` (1 records)
INSERT INTO `student_learning_reflections` (`id`, `user_id`, `module_id`, `stage_id`, `question_1_answer`, `question_2_answer`, `question_3_answer`, `status`, `submitted_at`, `updated_at`, `created_at`) VALUES (1, 3, 1, 4, 'I know that breathing is important for singing and supporting sustained phrases.', 'I want to learn how to control my airflow while singing long phrases without feeling out of breath.', 'I learned that controlled airflow, relaxed shoulders, and open floating ribs maintain stable vocal stamina.', 'COMPLETED', '2026-11-20 14:49:23', '2026-11-20 14:51:47', '2026-11-20 14:49:23');

-- Table structure for `student_module_progress`
DROP TABLE IF EXISTS `student_module_progress`;
CREATE TABLE `student_module_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `module_id` int DEFAULT '1',
  `stage_id` int DEFAULT NULL,
  `completion_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'IN_PROGRESS',
  `completion_percentage` decimal(5,2) DEFAULT '0.00',
  `unlocked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_mod` (`user_id`,`module_id`),
  KEY `idx_smp_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=338 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_module_progress` (3 records)
INSERT INTO `student_module_progress` (`id`, `user_id`, `module_id`, `stage_id`, `completion_status`, `completion_percentage`, `unlocked_at`, `completed_at`, `updated_at`) VALUES (137, 3, 1, 5, 'IN_PROGRESS', '60.00', '2026-11-20 19:31:38', NULL, '2026-11-22 18:07:12');
INSERT INTO `student_module_progress` (`id`, `user_id`, `module_id`, `stage_id`, `completion_status`, `completion_percentage`, `unlocked_at`, `completed_at`, `updated_at`) VALUES (280, 74, 1, 5, 'IN_PROGRESS', '0.00', '2026-11-22 14:15:19', NULL, '2026-11-22 14:15:55');
INSERT INTO `student_module_progress` (`id`, `user_id`, `module_id`, `stage_id`, `completion_status`, `completion_percentage`, `unlocked_at`, `completed_at`, `updated_at`) VALUES (281, 75, 1, 5, 'IN_PROGRESS', '0.00', '2026-11-22 14:15:19', NULL, '2026-11-22 14:15:55');

-- Table structure for `student_part_progress`
DROP TABLE IF EXISTS `student_part_progress`;
CREATE TABLE `student_part_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `part_id` int NOT NULL,
  `tab_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED') COLLATE utf8mb4_unicode_ci DEFAULT 'NOT_STARTED',
  `progress_percentage` int DEFAULT '0',
  `completed_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_part_tab` (`user_id`,`part_id`,`tab_key`),
  KEY `idx_user_part` (`user_id`,`part_id`)
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_part_progress` (18 records)
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (1, 217, 1, 'posture', 'IN_PROGRESS', 60, NULL, '2026-11-20 06:28:20');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (2, 3, 1, 'posture', 'COMPLETED', 100, '2026-11-20 10:58:26', '2026-11-20 10:58:26');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (4, 219, 1, 'posture', 'IN_PROGRESS', 60, NULL, '2026-11-20 06:32:06');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (5, 220, 1, 'posture', 'IN_PROGRESS', 60, NULL, '2026-11-20 06:34:18');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (6, 221, 1, 'posture', 'COMPLETED', 100, '2026-11-20 06:35:18', '2026-11-20 06:35:18');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (8, 221, 1, 'breathe', 'COMPLETED', 100, '2026-11-20 06:35:18', '2026-11-20 06:35:18');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (9, 222, 1, 'posture', 'COMPLETED', 100, '2026-11-20 06:36:47', '2026-11-20 06:36:46');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (11, 222, 1, 'breathe', 'COMPLETED', 100, '2026-11-20 06:36:46', '2026-11-20 06:36:46');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (12, 222, 1, 'song', 'COMPLETED', 100, '2026-11-20 06:36:46', '2026-11-20 06:36:46');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (13, 224, 1, 'posture', 'COMPLETED', 100, '2026-11-20 06:37:28', '2026-11-20 06:37:28');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (15, 224, 1, 'breathe', 'COMPLETED', 100, '2026-11-20 06:37:28', '2026-11-20 06:37:28');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (16, 224, 1, 'song', 'COMPLETED', 100, '2026-11-20 06:37:28', '2026-11-20 06:37:28');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (31, 231, 1, 'posture', 'COMPLETED', 100, '2026-11-20 06:49:07', '2026-11-20 06:49:06');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (33, 231, 1, 'breathe', 'COMPLETED', 100, '2026-11-20 06:49:06', '2026-11-20 06:49:06');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (34, 231, 1, 'song', 'COMPLETED', 100, '2026-11-20 06:49:06', '2026-11-20 06:49:06');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (48, 3, 1, 'breathe', 'COMPLETED', 100, '2026-11-20 10:59:45', '2026-11-20 10:59:45');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (53, 74, 1, 'posture', 'COMPLETED', 100, '2026-11-20 09:16:13', '2026-11-20 09:16:13');
INSERT INTO `student_part_progress` (`id`, `user_id`, `part_id`, `tab_key`, `status`, `progress_percentage`, `completed_at`, `updated_at`) VALUES (79, 3, 1, 'song', 'COMPLETED', 100, '2026-11-20 20:47:49', '2026-11-20 20:47:49');

-- Table structure for `student_posture_progress`
DROP TABLE IF EXISTS `student_posture_progress`;
CREATE TABLE `student_posture_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `part_id` int NOT NULL,
  `checklist_progress_json` json DEFAULT NULL,
  `completed_count` int DEFAULT '0',
  `total_count` int DEFAULT '5',
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED') COLLATE utf8mb4_unicode_ci DEFAULT 'NOT_STARTED',
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_posture_part` (`user_id`,`part_id`),
  KEY `idx_user_posture` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_posture_progress` (9 records)
INSERT INTO `student_posture_progress` (`id`, `user_id`, `part_id`, `checklist_progress_json`, `completed_count`, `total_count`, `status`, `started_at`, `completed_at`, `updated_at`) VALUES (1, 217, 1, '[1,2,3]', 3, 5, 'IN_PROGRESS', '2026-11-20 06:28:20', NULL, '2026-11-20 06:28:20');
INSERT INTO `student_posture_progress` (`id`, `user_id`, `part_id`, `checklist_progress_json`, `completed_count`, `total_count`, `status`, `started_at`, `completed_at`, `updated_at`) VALUES (2, 3, 1, '[3,2,4,5,1]', 5, 5, 'COMPLETED', '2026-11-20 06:28:49', '2026-11-20 06:42:01', '2026-11-20 10:58:26');
INSERT INTO `student_posture_progress` (`id`, `user_id`, `part_id`, `checklist_progress_json`, `completed_count`, `total_count`, `status`, `started_at`, `completed_at`, `updated_at`) VALUES (4, 219, 1, '[1,2,3]', 3, 5, 'IN_PROGRESS', '2026-11-20 06:32:06', NULL, '2026-11-20 06:32:06');
INSERT INTO `student_posture_progress` (`id`, `user_id`, `part_id`, `checklist_progress_json`, `completed_count`, `total_count`, `status`, `started_at`, `completed_at`, `updated_at`) VALUES (5, 220, 1, '[1,2,3]', 3, 5, 'IN_PROGRESS', '2026-11-20 06:34:18', NULL, '2026-11-20 06:34:18');
INSERT INTO `student_posture_progress` (`id`, `user_id`, `part_id`, `checklist_progress_json`, `completed_count`, `total_count`, `status`, `started_at`, `completed_at`, `updated_at`) VALUES (6, 221, 1, '[1,2,3,4,5]', 5, 5, 'COMPLETED', '2026-11-20 06:35:18', '2026-11-20 06:35:18', '2026-11-20 06:35:18');
INSERT INTO `student_posture_progress` (`id`, `user_id`, `part_id`, `checklist_progress_json`, `completed_count`, `total_count`, `status`, `started_at`, `completed_at`, `updated_at`) VALUES (8, 222, 1, '[1,2,3,4,5]', 5, 5, 'COMPLETED', '2026-11-20 06:36:46', '2026-11-20 06:36:46', '2026-11-20 06:36:46');
INSERT INTO `student_posture_progress` (`id`, `user_id`, `part_id`, `checklist_progress_json`, `completed_count`, `total_count`, `status`, `started_at`, `completed_at`, `updated_at`) VALUES (10, 224, 1, '[1,2,3,4,5]', 5, 5, 'COMPLETED', '2026-11-20 06:37:28', '2026-11-20 06:37:28', '2026-11-20 06:37:28');
INSERT INTO `student_posture_progress` (`id`, `user_id`, `part_id`, `checklist_progress_json`, `completed_count`, `total_count`, `status`, `started_at`, `completed_at`, `updated_at`) VALUES (25, 231, 1, '[1,2,3,4,5]', 5, 5, 'COMPLETED', '2026-11-20 06:49:06', '2026-11-20 06:49:06', '2026-11-20 06:49:06');
INSERT INTO `student_posture_progress` (`id`, `user_id`, `part_id`, `checklist_progress_json`, `completed_count`, `total_count`, `status`, `started_at`, `completed_at`, `updated_at`) VALUES (39, 74, 1, '[1,2,3,4,5]', 5, 5, 'COMPLETED', '2026-11-20 08:53:36', '2026-11-20 08:56:00', '2026-11-20 09:16:13');

-- Table structure for `student_practice_activity_completions`
DROP TABLE IF EXISTS `student_practice_activity_completions`;
CREATE TABLE `student_practice_activity_completions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `module_id` int DEFAULT '1',
  `activity_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `completion_status` enum('not_started','in_progress','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'completed',
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `session_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_mod_act` (`user_id`,`module_id`,`activity_key`),
  KEY `idx_spac_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_practice_activity_completions` (1 records)
INSERT INTO `student_practice_activity_completions` (`id`, `user_id`, `module_id`, `activity_key`, `completion_status`, `completed_at`, `session_id`, `created_at`) VALUES (5, 3, 1, 'journal_kanban_tracker', 'completed', '2026-11-20 19:56:11', 13, '2026-11-20 19:42:09');

-- Table structure for `student_practice_commitments`
DROP TABLE IF EXISTS `student_practice_commitments`;
CREATE TABLE `student_practice_commitments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `module_id` int DEFAULT '1',
  `minutes_per_session` int NOT NULL DEFAULT '10',
  `sessions_per_week` int NOT NULL DEFAULT '4',
  `weekly_minutes` int NOT NULL DEFAULT '40',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_spc_user` (`user_id`),
  KEY `idx_spc_module` (`module_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_practice_commitments` (1 records)
INSERT INTO `student_practice_commitments` (`id`, `user_id`, `module_id`, `minutes_per_session`, `sessions_per_week`, `weekly_minutes`, `is_active`, `created_at`, `updated_at`) VALUES (4, 3, 1, 20, 4, 80, 1, '2026-11-20 19:34:23', '2026-11-20 19:44:40');

-- Table structure for `student_practice_sessions`
DROP TABLE IF EXISTS `student_practice_sessions`;
CREATE TABLE `student_practice_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `commitment_id` int DEFAULT NULL,
  `session_number` int NOT NULL,
  `session_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `planned_duration` int NOT NULL DEFAULT '10',
  `actual_duration` int DEFAULT NULL,
  `scheduled_date` date DEFAULT NULL,
  `week_identifier` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('planned','practising','done') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planned',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sps_user` (`user_id`),
  KEY `idx_sps_status` (`status`),
  KEY `idx_sps_commitment` (`commitment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_practice_sessions` (4 records)
INSERT INTO `student_practice_sessions` (`id`, `user_id`, `commitment_id`, `session_number`, `session_title`, `activity`, `planned_duration`, `actual_duration`, `scheduled_date`, `week_identifier`, `status`, `notes`, `started_at`, `completed_at`, `created_at`, `updated_at`) VALUES (13, 3, 4, 1, 'Session 1 – 20 min', 'Breath Routine & Song Vocalization', 20, 20, NULL, NULL, 'done', NULL, '2026-11-20 19:41:52', '2026-11-20 19:44:58', '2026-11-20 19:34:23', '2026-11-20 19:56:11');
INSERT INTO `student_practice_sessions` (`id`, `user_id`, `commitment_id`, `session_number`, `session_title`, `activity`, `planned_duration`, `actual_duration`, `scheduled_date`, `week_identifier`, `status`, `notes`, `started_at`, `completed_at`, `created_at`, `updated_at`) VALUES (14, 3, 4, 2, 'Session 2 – 20 min', 'Breath Routine & Song Vocalization', 20, 20, NULL, NULL, 'done', NULL, NULL, '2026-11-20 19:44:52', '2026-11-20 19:34:23', '2026-11-20 19:44:52');
INSERT INTO `student_practice_sessions` (`id`, `user_id`, `commitment_id`, `session_number`, `session_title`, `activity`, `planned_duration`, `actual_duration`, `scheduled_date`, `week_identifier`, `status`, `notes`, `started_at`, `completed_at`, `created_at`, `updated_at`) VALUES (15, 3, 4, 3, 'Session 3 – 20 min', 'Breath Routine & Song Vocalization', 20, NULL, NULL, NULL, 'planned', NULL, NULL, NULL, '2026-11-20 19:34:23', '2026-11-20 19:34:23');
INSERT INTO `student_practice_sessions` (`id`, `user_id`, `commitment_id`, `session_number`, `session_title`, `activity`, `planned_duration`, `actual_duration`, `scheduled_date`, `week_identifier`, `status`, `notes`, `started_at`, `completed_at`, `created_at`, `updated_at`) VALUES (16, 3, 4, 4, 'Session 4 – 20 min', 'Breath Routine & Song Vocalization', 20, NULL, NULL, NULL, 'planned', NULL, NULL, NULL, '2026-11-20 19:34:23', '2026-11-20 19:34:23');

-- Table structure for `student_recordings`
DROP TABLE IF EXISTS `student_recordings`;
CREATE TABLE `student_recordings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stage_id` int NOT NULL,
  `song_id` int DEFAULT NULL,
  `storage_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_seconds` int DEFAULT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `attempt_number` int NOT NULL DEFAULT '1',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'SUBMITTED',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `stage_id` (`stage_id`),
  KEY `song_id` (`song_id`),
  CONSTRAINT `student_recordings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_recordings_ibfk_2` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_recordings_ibfk_3` FOREIGN KEY (`song_id`) REFERENCES `learning_songs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_recordings` (2 records)
INSERT INTO `student_recordings` (`id`, `user_id`, `stage_id`, `song_id`, `storage_key`, `file_type`, `duration_seconds`, `comments`, `attempt_number`, `submitted_at`, `status`) VALUES (20, 3, 4, NULL, 'audio-u3-tgeneral-1795186504176-760058680.mp3', 'audio/mpeg', 0, NULL, 1, '2026-11-20 14:55:04', 'SUBMITTED');
INSERT INTO `student_recordings` (`id`, `user_id`, `stage_id`, `song_id`, `storage_key`, `file_type`, `duration_seconds`, `comments`, `attempt_number`, `submitted_at`, `status`) VALUES (21, 3, 4, NULL, 'audio-u3-tgeneral-1795198676354-607476480.mp3', 'audio/mpeg', 0, NULL, 2, '2026-11-20 18:17:56', 'SUBMITTED');

-- Table structure for `student_song_progress`
DROP TABLE IF EXISTS `student_song_progress`;
CREATE TABLE `student_song_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `song_id` int NOT NULL,
  `level_id` int NOT NULL,
  `marked_notes` json DEFAULT NULL,
  `total_marked_notes` int DEFAULT '0',
  `audio_listening_progress` decimal(5,2) DEFAULT '0.00',
  `repeat_count` int DEFAULT '1',
  `completion_status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED') COLLATE utf8mb4_unicode_ci DEFAULT 'NOT_STARTED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_song_level` (`user_id`,`song_id`,`level_id`),
  KEY `idx_user_song` (`user_id`,`song_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_song_progress` (1 records)
INSERT INTO `student_song_progress` (`id`, `user_id`, `song_id`, `level_id`, `marked_notes`, `total_marked_notes`, `audio_listening_progress`, `repeat_count`, `completion_status`, `created_at`, `updated_at`) VALUES (5, 3, 1, 1, '[\"N2\",\"N3\"]', 2, '100.00', 1, 'IN_PROGRESS', '2026-11-20 10:49:52', '2026-11-20 10:50:46');

-- Table structure for `student_song_sessions`
DROP TABLE IF EXISTS `student_song_sessions`;
CREATE TABLE `student_song_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `song_id` int NOT NULL,
  `level_id` int NOT NULL,
  `listening_duration` int DEFAULT '0',
  `repeat_count` int DEFAULT '1',
  `marked_notes_count` int DEFAULT '0',
  `session_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'COMPLETED',
  `started_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_sessions` (`user_id`,`song_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `student_song_sessions` (5 records)
INSERT INTO `student_song_sessions` (`id`, `user_id`, `song_id`, `level_id`, `listening_duration`, `repeat_count`, `marked_notes_count`, `session_status`, `started_at`, `completed_at`, `created_at`) VALUES (3, 3, 1, 1, 0, 1, 0, 'IN_PROGRESS', '2026-11-20 10:51:20', '2026-11-20 10:51:20', '2026-11-20 10:51:20');
INSERT INTO `student_song_sessions` (`id`, `user_id`, `song_id`, `level_id`, `listening_duration`, `repeat_count`, `marked_notes_count`, `session_status`, `started_at`, `completed_at`, `created_at`) VALUES (4, 3, 1, 3, 10, 1, 0, 'COMPLETED', '2026-11-20 10:53:58', '2026-11-20 10:53:58', '2026-11-20 10:53:58');
INSERT INTO `student_song_sessions` (`id`, `user_id`, `song_id`, `level_id`, `listening_duration`, `repeat_count`, `marked_notes_count`, `session_status`, `started_at`, `completed_at`, `created_at`) VALUES (5, 3, 1, 1, 10, 1, 2, 'COMPLETED', '2026-11-20 20:47:49', '2026-11-20 20:47:49', '2026-11-20 20:47:49');
INSERT INTO `student_song_sessions` (`id`, `user_id`, `song_id`, `level_id`, `listening_duration`, `repeat_count`, `marked_notes_count`, `session_status`, `started_at`, `completed_at`, `created_at`) VALUES (6, 3, 1, 1, 0, 1, 0, 'IN_PROGRESS', '2026-11-22 15:38:34', '2026-11-22 15:38:34', '2026-11-22 15:38:34');
INSERT INTO `student_song_sessions` (`id`, `user_id`, `song_id`, `level_id`, `listening_duration`, `repeat_count`, `marked_notes_count`, `session_status`, `started_at`, `completed_at`, `created_at`) VALUES (7, 3, 1, 1, 0, 1, 0, 'IN_PROGRESS', '2026-11-22 16:58:20', '2026-11-22 16:58:20', '2026-11-22 16:58:20');

-- Table structure for `task_assessments`
DROP TABLE IF EXISTS `task_assessments`;
CREATE TABLE `task_assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `submission_id` int NOT NULL,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `maximum_marks` int NOT NULL DEFAULT '100',
  `marks_awarded` int DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `improvement_suggestions` text COLLATE utf8mb4_unicode_ci,
  `assessment_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AWAITING_REVIEW',
  `assessed_by` int DEFAULT NULL,
  `assessed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `submission_id` (`submission_id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`),
  KEY `assessed_by` (`assessed_by`),
  CONSTRAINT `task_assessments_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `user_task_submissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_assessments_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `learning_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_assessments_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_assessments_ibfk_4` FOREIGN KEY (`assessed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `user_learning_enrollments`
DROP TABLE IF EXISTS `user_learning_enrollments`;
CREATE TABLE `user_learning_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `module_id` int NOT NULL,
  `enrollment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `current_stage_id` int DEFAULT NULL,
  `completion_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN_PROGRESS',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_enrollment` (`user_id`,`module_id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `user_learning_enrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_learning_enrollments_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `learning_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `user_learning_enrollments` (1 records)
INSERT INTO `user_learning_enrollments` (`id`, `user_id`, `module_id`, `enrollment_date`, `current_stage_id`, `completion_status`, `created_at`, `updated_at`) VALUES (7, 3, 1, '2026-11-18 09:39:15', NULL, 'IN_PROGRESS', '2026-11-18 09:39:15', '2026-11-19 08:35:58');

-- Table structure for `user_learning_progress`
DROP TABLE IF EXISTS `user_learning_progress`;
CREATE TABLE `user_learning_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `activity_id` int NOT NULL,
  `completion_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_activity` (`user_id`,`activity_id`),
  KEY `activity_id` (`activity_id`),
  CONSTRAINT `user_learning_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_learning_progress_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `learning_activities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `user_lesson_progress`
DROP TABLE IF EXISTS `user_lesson_progress`;
CREATE TABLE `user_lesson_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `completion_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_lesson` (`user_id`,`lesson_id`),
  KEY `lesson_id` (`lesson_id`),
  KEY `idx_user_progress` (`user_id`),
  CONSTRAINT `user_lesson_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_lesson_progress_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `user_music_preferences`
DROP TABLE IF EXISTS `user_music_preferences`;
CREATE TABLE `user_music_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `music_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_music` (`user_id`),
  CONSTRAINT `user_music_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=312 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `user_music_preferences` (1 records)
INSERT INTO `user_music_preferences` (`id`, `user_id`, `music_type`, `created_at`) VALUES (5, 3, 'Western Classical', '2026-11-17 08:19:59');

-- Table structure for `user_practice_goals`
DROP TABLE IF EXISTS `user_practice_goals`;
CREATE TABLE `user_practice_goals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `weekly_target_minutes` int NOT NULL DEFAULT '60',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_goal` (`user_id`),
  CONSTRAINT `user_practice_goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=589 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `user_practice_goals` (3 records)
INSERT INTO `user_practice_goals` (`id`, `user_id`, `weekly_target_minutes`, `created_at`, `updated_at`) VALUES (1, 3, 80, '2026-11-18 06:57:21', '2026-11-20 19:44:40');
INSERT INTO `user_practice_goals` (`id`, `user_id`, `weekly_target_minutes`, `created_at`, `updated_at`) VALUES (131, 74, 60, '2026-11-19 05:28:33', '2026-11-19 05:28:33');
INSERT INTO `user_practice_goals` (`id`, `user_id`, `weekly_target_minutes`, `created_at`, `updated_at`) VALUES (132, 75, 60, '2026-11-19 05:28:33', '2026-11-19 05:28:33');

-- Table structure for `user_song_practice`
DROP TABLE IF EXISTS `user_song_practice`;
CREATE TABLE `user_song_practice` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `song_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `language` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `song_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_song_practice_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `user_stage_progress`
DROP TABLE IF EXISTS `user_stage_progress`;
CREATE TABLE `user_stage_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stage_id` int NOT NULL,
  `completion_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NOT_STARTED',
  `progress_percentage` decimal(5,2) DEFAULT '0.00',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_stage` (`user_id`,`stage_id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `user_stage_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_stage_progress_ibfk_2` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `user_task_assignments`
DROP TABLE IF EXISTS `user_task_assignments`;
CREATE TABLE `user_task_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `task_id` int NOT NULL,
  `assignment_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ASSIGNED',
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` timestamp NULL DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_task` (`user_id`,`task_id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `user_task_assignments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_task_assignments_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `learning_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `user_task_submissions`
DROP TABLE IF EXISTS `user_task_submissions`;
CREATE TABLE `user_task_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `task_id` int NOT NULL,
  `submission_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text_response` text COLLATE utf8mb4_unicode_ci,
  `quiz_answers` json DEFAULT NULL,
  `file_reference` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size_bytes` int DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `submission_version` int NOT NULL DEFAULT '1',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `user_task_submissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_task_submissions_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `learning_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vocal_trainer_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `selected_musical_goal` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('USER','ADMIN','SUPERADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `mfa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `mfa_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mfa_backup_codes` json DEFAULT NULL,
  `failed_login_attempts` int NOT NULL DEFAULT '0',
  `account_locked_until` timestamp NULL DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=237 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `users` (3 records)
INSERT INTO `users` (`id`, `username`, `gender`, `email`, `phone`, `vocal_trainer_name`, `password_hash`, `selected_musical_goal`, `role`, `created_at`, `updated_at`, `mfa_enabled`, `mfa_secret`, `mfa_backup_codes`, `failed_login_attempts`, `account_locked_until`, `last_login_at`, `last_login_ip`) VALUES (3, 'Renin', 'Male', 'paulrenine9487@gmail.com', '6381420141', NULL, '$2a$10$mCkHHGPOAOqnyWsCaU4ASOnAH0R7DaGFn61gD/SzS5CGZX4ebKDm6', 'I want to explore classical singing.', 'USER', '2026-11-17 08:19:59', '2026-11-20 21:06:06', 0, NULL, NULL, 0, NULL, NULL, NULL);
INSERT INTO `users` (`id`, `username`, `gender`, `email`, `phone`, `vocal_trainer_name`, `password_hash`, `selected_musical_goal`, `role`, `created_at`, `updated_at`, `mfa_enabled`, `mfa_secret`, `mfa_backup_codes`, `failed_login_attempts`, `account_locked_until`, `last_login_at`, `last_login_ip`) VALUES (74, 'Notreoblemccmrfip', 'Other', 'notreoblemccmrfip@notreoble.com', '+919876543211', 'Master Superadmin', '$2a$10$d/3rT/lkfX0tNAId6e6Ta.BxNmJXiF9dj8sKafSczRb1im6nsx2.W', 'Platform Administrator', 'SUPERADMIN', '2026-11-19 05:28:18', '2026-11-22 18:28:43', 1, 'IMA4TSNJB5OTCVHTK6YTE2IW3THQY3HE', NULL, 0, NULL, NULL, NULL);
INSERT INTO `users` (`id`, `username`, `gender`, `email`, `phone`, `vocal_trainer_name`, `password_hash`, `selected_musical_goal`, `role`, `created_at`, `updated_at`, `mfa_enabled`, `mfa_secret`, `mfa_backup_codes`, `failed_login_attempts`, `account_locked_until`, `last_login_at`, `last_login_ip`) VALUES (75, 'Smirthi', 'Female', 'smirthi@notreoble.com', '+919876543212', 'Vocal Instructor Smirthi', '$2a$10$d/3rT/lkfX0tNAId6e6Ta.Ea4Ze01sULctbivok3gYhalqcuBP3F2', 'Vocal Pedagogy Trainer', 'ADMIN', '2026-11-19 05:28:19', '2026-11-22 18:24:21', 0, NULL, NULL, 0, NULL, NULL, NULL);

-- Table structure for `written_assessments`
DROP TABLE IF EXISTS `written_assessments`;
CREATE TABLE `written_assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `stage_id` int NOT NULL,
  `prompt` text COLLATE utf8mb4_unicode_ci,
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `assessment_score` int DEFAULT NULL,
  `reviewer_feedback` text COLLATE utf8mb4_unicode_ci,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `written_assessments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `written_assessments_ibfk_2` FOREIGN KEY (`stage_id`) REFERENCES `learning_stages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

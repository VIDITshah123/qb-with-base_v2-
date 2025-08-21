PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS base_master_users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT UNIQUE NOT NULL,
    mobile_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO base_master_users VALUES(1,'admin@employdex.com','9999999999','$2a$10$LjZl9CjeQFg1nrz8KvTYlOC.Nvsr5loM2qHbppZrbksSBPbFGVT5S','Admin','User',1,'2025-08-07 07:23:44','2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_master_users VALUES(2,'fa@employdex.com','8888888888','$2a$10$LjZl9CjeQFg1nrz8KvTYlOC.Nvsr5loM2qHbppZrbksSBPbFGVT5S','FA','User',1,'2025-08-07 07:23:44','2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_master_users VALUES(40,'rajiv.thakkar@skj.ican.in','$2b$10$4Q3VWQufTOiuBnI6tDpV7eZOyXPzy9e0LLZUEhp965AnfPzPKr4Pi','rajiv.thakkar@skj.ican.in','Rajiv','Thakkar',1,'2025-07-25 07:03:53','2025-07-25 07:03:53');
INSERT OR IGNORE INTO base_master_users VALUES(51,'shubham.sawant@skj.ican.in','$2b$10$oVVUQFRDXWdJZI1w6ARQTOthQ4SnPhHtf76dfDxm1tzmV1EkNi8c6','shubham.sawant@skj.ican.in','Shubham','Sawant',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(52,'atharv.rajmane@skj.ican.in','$2b$10$IIapg59VOyrDJn2BpT6v5O8PFrm5u.h39pv6Li52VWZgRPftroLoK','atharv.rajmane@skj.ican.in','Atharv','Rajmane',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(53,'netra.bafna@skj.ican.in','$2b$10$CCIh3t4LppKjUNhPtVWToODizCxMOO8wcGpfTVRD70zqOqXPTeP6W','netra.bafna@skj.ican.in','Netra','Bafna',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(54,'aboli.jadhav@skj.ican.in','$2b$10$IuhUT7huUJx0/BtZCVuEZu4BsKfLAR2qRieYqpVcv/CVsB2oXo2Uu','aboli.jadhav@skj.ican.in','Aboli','Jadhav',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(55,'rusheel.borse@skj.ican.in','$2b$10$IWq95n9JTSaWipemmoink.pym0aJpHbv6A6spkmCHHx0ukMsrPpyi','rusheel.borse@skj.ican.in','Rusheel','Borse',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(56,'khushi.bhutada@skj.ican.in','$2b$10$Sa0CTPOTYVvS8RGt8RPD4OJRuCEwiCx9EGXjM73neLScjUF/J0GmK','khushi.bhutada@skj.ican.in','Khushi','Bhutada',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(57,'sakshi.kathed@skj.ican.in','$2b$10$iPfIfxiTqt4vr0SjKRpokOb3enR8kSEYly6gH9IpqdAEYVpOaBUtG','sakshi.kathed@skj.ican.in','Sakshi','Kathed',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(58,'lajari.oswal@skj.ican.in','$2b$10$iweEPE.oEIzac0mPsaAYBudgr5oigFHWap6s.aA3gKz0TWv7gD27.','lajari.oswal@skj.ican.in','Lajari','Oswal',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(59,'neelesh.khandelwal@skj.ican.in','$2b$10$9vSqSAFYR5krs8zseqG9Z.sb8k4KijLudGN0/9QPWNSQRgOviORnK','neelesh.khandelwal@skj.ican.in','Neelesh','Khandelwal',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(60,'sahil.khurana@skj.ican.in','$2b$10$I9FbiQElwRcSq.dZcAhtF.HjkHfqLraH9ojrRJz5Xu4BQvT1uisKW','sahil.khurana@skj.ican.in','Sahil','Khurana',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(61,'rujuta.renavikar@skj.ican.in','$2b$10$7WRON12i0iLHl/OGIRtAC.rI1H9dLIwhelqHSP0zCWlzbJ232hJl2','rujuta.renavikar@skj.ican.in','Rujuta','Renavikar',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(62,'saanvi.shaha@skj.ican.in','$2b$10$/OSLMCCSkIEpD7t4VyRq6OI/4aHsm1wzk7sVr6Bqv2hRB9dsMIyv2','saanvi.shaha@skj.ican.in','Saanvi','Saha',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(63,'anshita.baharani@skj.ican.in','$2b$10$gcFmX2Y0jMFdzNi5m1tKauxLEqqWatCbG1SrNCmj5QrKmW/q5NUIm','anshita.baharani@skj.ican.in','Anshita','Baharani',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(64,'vanshika.khandelwal@skj.ican.in','$2b$10$40yMh5qYwI9kHxY7McquCOIH3Y1kaxD1nhoRVXAfwq.81yenDga3e','vanshika.khandelwal@skj.ican.in','Vanshika','Khandelwal',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(65,'diksha.agarwal@skj.ican.in','$2b$10$b0jUJmRqRnS1/6Yko34kHu3XR9sAUNwLRpJ3Ozm/QyaYebQs79eHm','diksha.agarwal@skj.ican.in','Diksha','Agarwal',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(66,'shriraj.daware@skj.ican.in','$2b$10$lIJDtrJ6PUmN30z94aJjY.2MvMKf89GxeWvPCfqqClDe0LE3EsNoe','shriraj.daware@skj.ican.in','Shriraj','Daware',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(67,'vishan.shah@skj.ican.in','$2b$10$XoKodNYi.RapudTsL1xS6OMpwtuHFegsr2XwWdEMSp4XNFGi7Blg6','vishan.shah@skj.ican.in','Vishan','Shah',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(68,'nimish.gadgil@skj.ican.in','$2b$10$sf1UzQ4V/91FIp3FZWGfJ.hBg9Brr3RbYH0hgqh.PoPU4.HgAE/ya','nimish.gadgil@skj.ican.in','Nimish','Gadgil',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_master_users VALUES(69,'khushi.sanghvi@skj.ican.in','$2b$10$mjmbb5iJmNZS.lmsA4jm5O05jKpbh.ajKTJ3/O29tTdtsvHIa89J.','khushi.sanghvi@skj.ican.in','Khushi','Sanghvi',1,'2025-07-25 07:03:54','2025-07-25 07:03:54');

CREATE TABLE IF NOT EXISTS base_master_roles (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE NOT NULL,
    role_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO base_master_roles VALUES(1,'Admin','Administrator with full system access','2025-08-07 07:23:44','2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_master_roles VALUES(2,'User','Standard user with limited access','2025-08-07 07:23:44','2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_master_roles VALUES(3,'full_access','Complete access to all features','2025-08-07 07:23:44','2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_master_roles VALUES(7,'Partner','Partner of the organizaiton','2025-07-25 05:42:46','2025-07-25 05:42:46');
INSERT OR IGNORE INTO base_master_roles VALUES(8,'Director','Director to give permissions to others','2025-07-25 05:43:17','2025-07-25 05:43:17');
INSERT OR IGNORE INTO base_master_roles VALUES(9,'Senior Manager','Less permissions','2025-07-25 05:43:39','2025-07-25 05:43:39');
INSERT OR IGNORE INTO base_master_roles VALUES(10,'Manager','Only user permissions','2025-07-25 05:43:54','2025-07-25 05:43:54');
INSERT OR IGNORE INTO base_master_roles VALUES(11,'Article','Articles in the house','2025-07-25 05:44:17','2025-07-25 05:44:17');
INSERT OR IGNORE INTO base_master_roles VALUES(12,'Associate','work with articles to assign tasks','2025-07-25 07:15:37','2025-07-25 07:15:37');


CREATE TABLE IF NOT EXISTS base_master_permissions (
    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    permission_name TEXT UNIQUE NOT NULL,
    permission_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO base_master_permissions VALUES(1,'user_view','Can view user details','2025-06-27 07:55:34','2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_master_permissions VALUES(2,'user_create','Can create users','2025-06-27 07:55:34','2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_master_permissions VALUES(3,'user_edit','Can edit user details','2025-06-27 07:55:34','2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_master_permissions VALUES(4,'user_delete','Can delete users','2025-06-27 07:55:34','2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_master_permissions VALUES(5,'role_view','Can view roles','2025-06-27 07:55:34','2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_master_permissions VALUES(6,'role_create','Can create roles','2025-06-27 07:55:34','2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_master_permissions VALUES(7,'role_edit','Can edit roles','2025-06-27 07:55:34','2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_master_permissions VALUES(8,'role_delete','Can delete roles','2025-06-27 07:55:34','2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_master_permissions VALUES(9,'permission_view','Can view permissions','2025-06-27 07:55:34','2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_master_permissions VALUES(10,'permission_assign','Can assign permissions to roles','2025-06-27 07:55:34','2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_master_permissions VALUES(11,'activity_view','Can view activity logs','2025-07-09 10:11:11','2025-07-09 10:11:11');
INSERT OR IGNORE INTO base_master_permissions VALUES(12,'feature_toggle_view','View feature toggles','2025-07-10 05:00:59','2025-07-10 05:00:59');
INSERT OR IGNORE INTO base_master_permissions VALUES(13,'feature_toggle_edit','Create, edit, or delete feature toggles','2025-07-10 05:00:59','2025-07-10 05:00:59');
INSERT OR IGNORE INTO base_master_permissions VALUES(14,'payment_view','payment_view permission for payment module','2025-07-11 06:24:58','2025-07-11 06:24:58');
INSERT OR IGNORE INTO base_master_permissions VALUES(15,'payment_delete','payment_delete permission for payment module','2025-07-11 06:24:58','2025-07-11 06:24:58');
INSERT OR IGNORE INTO base_master_permissions VALUES(16,'payment_create','payment_create permission for payment module','2025-07-11 06:24:58','2025-07-11 06:24:58');
INSERT OR IGNORE INTO base_master_permissions VALUES(17,'payment_edit','payment_edit permission for payment module','2025-07-11 06:24:58','2025-07-11 06:24:58');
INSERT OR IGNORE INTO base_master_permissions VALUES(18,'route_users_bulk_upload_view','View access for Bulk User Upload','2025-07-25 10:52:11','2025-07-25 10:52:11');
INSERT OR IGNORE INTO base_master_permissions VALUES(19,'route_users_bulk_upload_edit','Edit access for Bulk User Upload','2025-07-25 10:52:11','2025-07-25 10:52:11');
INSERT OR IGNORE INTO base_master_permissions VALUES(20,'route_users_bulk_upload_create','Create access for Bulk User Upload','2025-07-25 10:52:11','2025-07-25 10:52:11');
INSERT OR IGNORE INTO base_master_permissions VALUES(21,'route_users_bulk_upload_delete','Delete access for Bulk User Upload','2025-07-25 10:52:11','2025-07-25 10:52:11');
INSERT OR IGNORE INTO base_master_permissions VALUES(22,'route_roles_feature_toggles_view','View access for Feature Toggle Management','2025-07-25 10:52:11','2025-07-25 10:52:11');
INSERT OR IGNORE INTO base_master_permissions VALUES(23,'route_roles_feature_toggles_edit','Edit access for Feature Toggle Management','2025-07-25 10:52:11','2025-07-25 10:52:11');
INSERT OR IGNORE INTO base_master_permissions VALUES(24,'route_roles_feature_toggles_create','Create access for Feature Toggle Management','2025-07-25 10:52:11','2025-07-25 10:52:11');
INSERT OR IGNORE INTO base_master_permissions VALUES(25,'route_roles_feature_toggles_delete','Delete access for Feature Toggle Management','2025-07-25 10:52:11','2025-07-25 10:52:11');
INSERT OR IGNORE INTO base_master_permissions VALUES(34,'route_post_file_upload_upload','Access to upload files','2025-07-25 11:12:20','2025-07-25 11:12:20');




CREATE TABLE IF NOT EXISTS base_role_user_link (
    user_role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES base_master_roles(role_id) ON DELETE CASCADE
);
INSERT OR IGNORE INTO base_role_user_link VALUES(1,1,1,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_user_link VALUES(2,2,3,'2025-08-07 07:23:44');
CREATE TABLE IF NOT EXISTS base_role_permission_link (
    role_permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES base_master_roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES base_master_permissions(permission_id) ON DELETE CASCADE
);
INSERT OR IGNORE INTO base_role_permission_link VALUES(16,2,1,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(17,3,14,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(18,3,13,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(19,3,15,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(20,3,10,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(21,3,12,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(22,3,11,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(23,3,9,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(24,3,6,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(25,3,8,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(26,3,7,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(27,3,5,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(28,3,2,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(29,3,4,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(30,3,3,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(31,3,1,'2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_role_permission_link VALUES(35,1,14,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(36,1,13,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(37,1,15,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(38,1,10,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(39,1,12,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(40,1,11,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(41,1,9,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(42,1,6,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(43,1,8,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(44,1,7,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(45,1,5,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(46,1,16,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(47,1,17,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(48,1,18,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(49,1,2,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(50,1,4,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(51,1,3,'2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_role_permission_link VALUES(52,1,1,'2025-08-10 05:30:52');

INSERT OR IGNORE INTO base_role_permission_link VALUES(1,1,1,'2025-06-27 07:55:34');
INSERT OR IGNORE INTO base_role_permission_link VALUES(7,7,1,'2025-06-27 09:30:10');
INSERT OR IGNORE INTO base_role_permission_link VALUES(8,8,2,'2025-06-27 09:30:10');
INSERT OR IGNORE INTO base_role_permission_link VALUES(9,9,2,'2025-06-27 09:30:10');
INSERT OR IGNORE INTO base_role_permission_link VALUES(10,10,2,'2025-06-27 09:30:10');
INSERT OR IGNORE INTO base_role_permission_link VALUES(11,11,2,'2025-06-27 09:30:10');
INSERT OR IGNORE INTO base_role_permission_link VALUES(12,12,3,'2025-07-09 09:35:08');
INSERT OR IGNORE INTO base_role_permission_link VALUES(13,12,3,'2025-07-09 10:43:15');
INSERT OR IGNORE INTO base_role_permission_link VALUES(14,11,1,'2025-07-09 11:11:24');
INSERT OR IGNORE INTO base_role_permission_link VALUES(15,12,2,'2025-07-09 11:11:24');
INSERT OR IGNORE INTO base_role_permission_link VALUES(16,11,3,'2025-07-09 11:11:24');
INSERT OR IGNORE INTO base_role_permission_link VALUES(17,12,1,'2025-07-10 05:07:34');
INSERT OR IGNORE INTO base_role_permission_link VALUES(18,11,3,'2025-07-10 05:07:34');
INSERT OR IGNORE INTO base_role_permission_link VALUES(19,10,2,'2025-07-10 05:07:34');
INSERT OR IGNORE INTO base_role_permission_link VALUES(20,11,8,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(21,12,8,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(22,12,8,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(23,12,8,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(24,12,8,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(25,12,9,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(26,1,9,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(27,1,9,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(28,1,9,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(29,1,9,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(30,1,10,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(31,1,10,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(32,1,10,'2025-07-25 05:46:12');
INSERT OR IGNORE INTO base_role_permission_link VALUES(33,11,10,'2025-07-25 05:46:13');
INSERT OR IGNORE INTO base_role_permission_link VALUES(34,1,10,'2025-07-25 05:46:13');
INSERT OR IGNORE INTO base_role_permission_link VALUES(35,1,11,'2025-07-25 05:46:13');
INSERT OR IGNORE INTO base_role_permission_link VALUES(36,1,11,'2025-07-25 05:46:13');
INSERT OR IGNORE INTO base_role_permission_link VALUES(37,1,11,'2025-07-25 05:46:13');
INSERT OR IGNORE INTO base_role_permission_link VALUES(38,2,11,'2025-07-25 05:46:13');
INSERT OR IGNORE INTO base_role_permission_link VALUES(39,2,11,'2025-07-25 05:46:13');
INSERT OR IGNORE INTO base_role_permission_link VALUES(40,2,8,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(41,2,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(42,2,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(43,2,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(44,3,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(45,3,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(46,3,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(47,3,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(48,3,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(49,3,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(50,3,10,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(51,3,9,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(52,3,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(53,2,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(54,2,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(55,1,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(56,1,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(57,1,10,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(58,1,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(59,1,7,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(60,1,8,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(61,1,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(62,1,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(63,1,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(64,1,11,'2025-07-25 07:03:54');
INSERT OR IGNORE INTO base_role_permission_link VALUES(65,1,12,'2025-07-25 07:16:17');




CREATE TABLE IF NOT EXISTS base_activity_logs (
    activity_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_action TEXT NOT NULL,
    activity_details TEXT,
    user_ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id) ON DELETE SET NULL
);
INSERT OR IGNORE INTO base_activity_logs VALUES(1,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:09:47');
INSERT OR IGNORE INTO base_activity_logs VALUES(2,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:09:47');
INSERT OR IGNORE INTO base_activity_logs VALUES(3,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:20:56');
INSERT OR IGNORE INTO base_activity_logs VALUES(4,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:20:56');
INSERT OR IGNORE INTO base_activity_logs VALUES(5,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:20:56');
INSERT OR IGNORE INTO base_activity_logs VALUES(6,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:20:56');
INSERT OR IGNORE INTO base_activity_logs VALUES(7,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:21:59');
INSERT OR IGNORE INTO base_activity_logs VALUES(8,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:21:59');
INSERT OR IGNORE INTO base_activity_logs VALUES(9,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:37');
INSERT OR IGNORE INTO base_activity_logs VALUES(10,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:37');
INSERT OR IGNORE INTO base_activity_logs VALUES(11,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:37');
INSERT OR IGNORE INTO base_activity_logs VALUES(12,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:37');
INSERT OR IGNORE INTO base_activity_logs VALUES(13,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:43');
INSERT OR IGNORE INTO base_activity_logs VALUES(14,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:43');
INSERT OR IGNORE INTO base_activity_logs VALUES(15,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:43');
INSERT OR IGNORE INTO base_activity_logs VALUES(16,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:43');
INSERT OR IGNORE INTO base_activity_logs VALUES(17,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:46');
INSERT OR IGNORE INTO base_activity_logs VALUES(18,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:46');
INSERT OR IGNORE INTO base_activity_logs VALUES(19,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:58');
INSERT OR IGNORE INTO base_activity_logs VALUES(20,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:58');
INSERT OR IGNORE INTO base_activity_logs VALUES(21,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:58');
INSERT OR IGNORE INTO base_activity_logs VALUES(22,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:22:58');
INSERT OR IGNORE INTO base_activity_logs VALUES(23,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:23:24');
INSERT OR IGNORE INTO base_activity_logs VALUES(24,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:23:24');
INSERT OR IGNORE INTO base_activity_logs VALUES(25,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:23:24');
INSERT OR IGNORE INTO base_activity_logs VALUES(26,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:23:24');
INSERT OR IGNORE INTO base_activity_logs VALUES(27,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:23:28');
INSERT OR IGNORE INTO base_activity_logs VALUES(28,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:23:28');
INSERT OR IGNORE INTO base_activity_logs VALUES(29,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:23:28');
INSERT OR IGNORE INTO base_activity_logs VALUES(30,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:23:28');
INSERT OR IGNORE INTO base_activity_logs VALUES(31,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:25:38');
INSERT OR IGNORE INTO base_activity_logs VALUES(32,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:25:38');
INSERT OR IGNORE INTO base_activity_logs VALUES(33,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:25:45');
INSERT OR IGNORE INTO base_activity_logs VALUES(34,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:25:45');
INSERT OR IGNORE INTO base_activity_logs VALUES(35,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:25:45');
INSERT OR IGNORE INTO base_activity_logs VALUES(36,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:25:45');
INSERT OR IGNORE INTO base_activity_logs VALUES(37,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:25:47');
INSERT OR IGNORE INTO base_activity_logs VALUES(38,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:25:47');
INSERT OR IGNORE INTO base_activity_logs VALUES(39,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:30');
INSERT OR IGNORE INTO base_activity_logs VALUES(40,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:30');
INSERT OR IGNORE INTO base_activity_logs VALUES(41,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:30');
INSERT OR IGNORE INTO base_activity_logs VALUES(42,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:30');
INSERT OR IGNORE INTO base_activity_logs VALUES(43,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:39');
INSERT OR IGNORE INTO base_activity_logs VALUES(44,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:39');
INSERT OR IGNORE INTO base_activity_logs VALUES(45,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:39');
INSERT OR IGNORE INTO base_activity_logs VALUES(46,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:39');
INSERT OR IGNORE INTO base_activity_logs VALUES(47,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:39');
INSERT OR IGNORE INTO base_activity_logs VALUES(48,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:39');
INSERT OR IGNORE INTO base_activity_logs VALUES(49,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:39');
INSERT OR IGNORE INTO base_activity_logs VALUES(50,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:39');
INSERT OR IGNORE INTO base_activity_logs VALUES(51,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:56');
INSERT OR IGNORE INTO base_activity_logs VALUES(52,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:56');
INSERT OR IGNORE INTO base_activity_logs VALUES(53,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:56');
INSERT OR IGNORE INTO base_activity_logs VALUES(54,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:26:56');
INSERT OR IGNORE INTO base_activity_logs VALUES(55,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:27:06');
INSERT OR IGNORE INTO base_activity_logs VALUES(56,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:27:06');
INSERT OR IGNORE INTO base_activity_logs VALUES(57,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:27:06');
INSERT OR IGNORE INTO base_activity_logs VALUES(58,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:27:06');
INSERT OR IGNORE INTO base_activity_logs VALUES(59,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:27:08');
INSERT OR IGNORE INTO base_activity_logs VALUES(60,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:27:08');
INSERT OR IGNORE INTO base_activity_logs VALUES(61,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:27:38');
INSERT OR IGNORE INTO base_activity_logs VALUES(62,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:27:38');
INSERT OR IGNORE INTO base_activity_logs VALUES(63,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:27:38');
INSERT OR IGNORE INTO base_activity_logs VALUES(64,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:27:38');
INSERT OR IGNORE INTO base_activity_logs VALUES(65,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:28:16');
INSERT OR IGNORE INTO base_activity_logs VALUES(66,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:28:29');
INSERT OR IGNORE INTO base_activity_logs VALUES(67,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:28:29');
INSERT OR IGNORE INTO base_activity_logs VALUES(68,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:28:29');
INSERT OR IGNORE INTO base_activity_logs VALUES(69,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:28:41');
INSERT OR IGNORE INTO base_activity_logs VALUES(70,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:30:13');
INSERT OR IGNORE INTO base_activity_logs VALUES(71,1,'FEATURE_TOGGLE_LIST_VIEW','Viewed all feature toggles','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:30:13');
INSERT OR IGNORE INTO base_activity_logs VALUES(72,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:30:13');
INSERT OR IGNORE INTO base_activity_logs VALUES(73,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:30:13');
INSERT OR IGNORE INTO base_activity_logs VALUES(74,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:30:33');
INSERT OR IGNORE INTO base_activity_logs VALUES(75,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:30:33');
INSERT OR IGNORE INTO base_activity_logs VALUES(76,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:30:35');
INSERT OR IGNORE INTO base_activity_logs VALUES(77,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:30:52');
INSERT OR IGNORE INTO base_activity_logs VALUES(78,1,'system_action','No details provided','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-08-10 05:30:52');
CREATE TABLE base_payment_qr (
    payment_qr_code_id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_qr_name VARCHAR(100) NOT NULL,
    payment_description TEXT,
    payment_type VARCHAR(50) NOT NULL, -- e.g., 'UPI', 'BANK', 'WALLET'
    payment_qr_image_location VARCHAR(255),   -- File system path to the QR code image
    isActive BOOLEAN DEFAULT 0, -- Only one QR code can be active at a time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO base_payment_qr VALUES(1,'Default UPI QR','Default UPI payment QR code','UPI','/uploads/qr/default_upi.png',1,'2025-08-07 07:23:44','2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_payment_qr VALUES(2,'Corporate Account QR','Corporate bank account QR code','BANK','/uploads/qr/corporate.png',0,'2025-08-07 07:23:44','2025-08-07 07:23:44');
CREATE TABLE base_payment_transactions (
    payment_transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_ref VARCHAR(100) NOT NULL UNIQUE, -- Unique reference number for the transaction
    user_id INTEGER, -- User who initiated the transaction
    verified BOOLEAN DEFAULT 0,
    payment_amount number,
    payment_currency text, 
    payment_source text, 
    transaction_status text,
    payment_external_reference text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES base_master_users(user_id)
);
INSERT OR IGNORE INTO base_payment_transactions VALUES(1,'TXN123456789',2,0,1000,'INR',NULL,'COMPLETED','Test transaction','2025-08-07 07:23:44',NULL);
INSERT OR IGNORE INTO base_payment_transactions VALUES(2,'TXN987654321',3,0,1500.5,'INR',NULL,'PENDING','Awaiting confirmation','2025-08-07 07:23:44',NULL);
INSERT OR IGNORE INTO base_payment_transactions VALUES(3,'TXN567890123',4,0,750.25,'INR',NULL,'FAILED','Payment gateway error','2025-08-07 07:23:44',NULL);
CREATE TABLE base_feature_toggle (
    feature_toggle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT UNIQUE NOT NULL,
    is_enabled INTEGER NOT NULL DEFAULT 0,
    feature_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO base_feature_toggle VALUES(1,'payment_integration',0,'Enable payment integration with QR code support','2025-08-07 07:23:44','2025-08-07 07:23:44');
INSERT OR IGNORE INTO base_feature_toggle VALUES(2,'route_users_bulk_upload',1,'Feature toggle for Bulk User Upload route','2025-07-25 10:52:37','2025-07-25 10:52:37');
INSERT OR IGNORE INTO base_feature_toggle VALUES(3,'route_roles_feature_toggles',1,'Feature toggle for Feature Toggle Management route','2025-07-25 10:52:37','2025-07-25 10:52:37');

DELETE FROM sqlite_sequence;
INSERT OR IGNORE INTO sqlite_sequence VALUES('base_master_roles',3);
INSERT OR IGNORE INTO sqlite_sequence VALUES('base_master_permissions',18);
INSERT OR IGNORE INTO sqlite_sequence VALUES('base_role_permission_link',52);
INSERT OR IGNORE INTO sqlite_sequence VALUES('base_master_users',2);
INSERT OR IGNORE INTO sqlite_sequence VALUES('base_role_user_link',2);
INSERT OR IGNORE INTO sqlite_sequence VALUES('base_feature_toggle',1);
INSERT OR IGNORE INTO sqlite_sequence VALUES('base_payment_qr',2);
INSERT OR IGNORE INTO sqlite_sequence VALUES('base_payment_transactions',3);
INSERT OR IGNORE INTO sqlite_sequence VALUES('base_activity_logs',78);
CREATE INDEX idx_payment_type ON base_payment_qr(payment_type);
CREATE INDEX idx_transaction_reference ON base_payment_transactions(transaction_ref);
CREATE INDEX idx_transaction_date ON base_payment_transactions(created_at);
CREATE INDEX idx_transaction_status ON base_payment_transactions(transaction_status);
COMMIT;

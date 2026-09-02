CREATE DATABASE IF NOT EXISTS `sodakid` /*!40100 DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci */;
USE `sodakid`;

CREATE TABLE IF NOT EXISTS `app_visited` (
  `visited_id` int(11) NOT NULL AUTO_INCREMENT,
  `datetime` timestamp NULL DEFAULT current_timestamp(),
  `cookie` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`visited_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `f_name` varchar(50) NOT NULL,
  `l_name` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `stripe_id` varchar(50) NOT NULL,
  PRIMARY KEY (`customer_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS `exchanges` (
  `exchange_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `datetime` timestamp NOT NULL DEFAULT current_timestamp(),
  `date` varchar(50) NOT NULL,
  `time` varchar(50) NOT NULL,
  `num_cans` int(11) NOT NULL,
  `can_type` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'scheduled',
  `nudge_sent_at` datetime DEFAULT NULL,
  PRIMARY KEY (`exchange_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `datetime` timestamp NULL DEFAULT current_timestamp(),
  `f_name` varchar(50) DEFAULT NULL,
  `l_name` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `message` text DEFAULT NULL,
  PRIMARY KEY (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS `message_sent` (
  `message_sent_id` int(11) NOT NULL AUTO_INCREMENT,
  `datetime` timestamp NULL DEFAULT current_timestamp(),
  `message_content` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`message_sent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `datetime` timestamp NOT NULL DEFAULT current_timestamp(),
  `customerid` int(11) DEFAULT NULL,
  `exchange_id` varchar(50) DEFAULT NULL,
  `can_type` varchar(50) DEFAULT NULL,
  `numcans` int(11) DEFAULT NULL,
  `stripe_session_id` varchar(100) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(100) DEFAULT NULL,
  `amount_paid` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'paid',
  `refunded_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

INSERT INTO `customers` (`f_name`, `l_name`, `phone`, `email`, `password`, `stripe_id`)
SELECT 'Atley', 'Ma', '5551234567', 'atleyma@gmail.com', 'Chewie325', ''
WHERE NOT EXISTS (
  SELECT 1 FROM `customers` WHERE `email` = 'atleyma@gmail.com'
);

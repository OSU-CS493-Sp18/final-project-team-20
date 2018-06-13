-- phpMyAdmin SQL Dump
-- version 4.6.4
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 13, 2018 at 12:30 PM
-- Server version: 5.7.21
-- PHP Version: 7.0.29-1~dotdeb+8.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `yelp_site`
--

-- --------------------------------------------------------

--
-- Table structure for table `accelerometer`
--

CREATE TABLE `accelerometer` (
  `id` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `x` float NOT NULL DEFAULT '0',
  `y` float NOT NULL DEFAULT '0',
  `z` float NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `ecu`
--

CREATE TABLE `ecu` (
  `id` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dwell` float NOT NULL DEFAULT '0',
  `map` float NOT NULL DEFAULT '0',
  `iat` float NOT NULL DEFAULT '0',
  `clt` float NOT NULL DEFAULT '0',
  `battery` float NOT NULL DEFAULT '0',
  `o2` float NOT NULL DEFAULT '0',
  `rpm` int(11) NOT NULL DEFAULT '0',
  `advance` int(11) NOT NULL DEFAULT '0',
  `tps` int(11) NOT NULL DEFAULT '0',
  `loopsPerSecond` int(11) NOT NULL DEFAULT '0',
  `freeRAM` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `gps`
--

CREATE TABLE `gps` (
  `id` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `latitude` double NOT NULL DEFAULT '0',
  `longitude` double NOT NULL DEFAULT '0',
  `speed` float NOT NULL DEFAULT '0',
  `heading` float NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accelerometer`
--
ALTER TABLE `accelerometer`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ecu`
--
ALTER TABLE `ecu`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gps`
--
ALTER TABLE `gps`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accelerometer`
--
ALTER TABLE `accelerometer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `ecu`
--
ALTER TABLE `ecu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `gps`
--
ALTER TABLE `gps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

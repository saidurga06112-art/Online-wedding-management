CREATE DATABASE IF NOT EXISTS wedding_hall_db;
USE wedding_hall_db;

CREATE TABLE IF NOT EXISTS customers (
  customer_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15),
  address VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS halls (
  hall_id INT PRIMARY KEY AUTO_INCREMENT,
  hall_name VARCHAR(100) NOT NULL,
  location VARCHAR(150) NOT NULL,
  capacity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  facilities TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Available',
  image_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  hall_id INT NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  CONSTRAINT fk_booking_hall FOREIGN KEY (hall_id) REFERENCES halls(hall_id)
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- Sample halls (illustrative prices and images; replace with your own venues).
INSERT INTO halls (hall_name, location, capacity, price, facilities, status, image_url)
SELECT * FROM (
  SELECT 'Royal Palace Hall', 'Kurnool', 1000, 80000.00,
  'Air conditioning, parking, dining area, bridal room',
  'Available', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM halls WHERE hall_name = 'Royal Palace Hall');

INSERT INTO halls (hall_name, location, capacity, price, facilities, status, image_url)
SELECT * FROM (
  SELECT 'Garden Paradise', 'Kurnool', 500, 55000.00,
  'Open garden, stage, lighting, parking',
  'Available', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=85'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM halls WHERE hall_name = 'Garden Paradise');

INSERT INTO halls (hall_name, location, capacity, price, facilities, status, image_url)
SELECT * FROM (
  SELECT 'Grand Celebration', 'Nandyal', 800, 65000.00,
  'AC hall, catering area, generator, parking',
  'Available', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM halls WHERE hall_name = 'Grand Celebration');

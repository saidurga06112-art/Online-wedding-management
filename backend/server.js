require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./config/database");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, message: "API and MySQL are connected." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database connection failed.", error: error.message });
  }
});

// Halls: list, add, edit, delete.
app.get("/api/halls", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM halls ORDER BY hall_id DESC");
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post("/api/halls", async (req, res) => {
  try {
    const { hall_name, location, capacity, price, facilities, status, image_url } = req.body;
    if (!hall_name || !location || !capacity || price == null) return res.status(400).json({ message: "Hall name, location, capacity and price are required." });
    const [result] = await pool.query(
      "INSERT INTO halls (hall_name, location, capacity, price, facilities, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [hall_name, location, Number(capacity), Number(price), facilities || "", status || "Available", image_url || ""]
    );
    res.status(201).json({ message: "Hall added.", hall_id: result.insertId });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put("/api/halls/:id", async (req, res) => {
  try {
    const { hall_name, location, capacity, price, facilities, status, image_url } = req.body;
    const [result] = await pool.query(
      "UPDATE halls SET hall_name=?, location=?, capacity=?, price=?, facilities=?, status=?, image_url=? WHERE hall_id=?",
      [hall_name, location, Number(capacity), Number(price), facilities || "", status || "Available", image_url || "", req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Hall not found." });
    res.json({ message: "Hall updated." });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.delete("/api/halls/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM halls WHERE hall_id=?", [req.params.id]);
    res.json({ message: "Hall deleted." });
  } catch (error) { res.status(400).json({ message: "Could not delete this hall. It may have existing bookings." }); }
});

// Customer registration/list.
app.get("/api/customers", async (req, res) => {
  try { const [rows] = await pool.query("SELECT * FROM customers ORDER BY customer_id DESC"); res.json(rows); }
  catch (error) { res.status(500).json({ message: error.message }); }
});
app.post("/api/customers", async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email are required." });
    const [result] = await pool.query("INSERT INTO customers (name,email,phone,address) VALUES (?,?,?,?)", [name,email,phone || "",address || ""]);
    res.status(201).json({ customer_id: result.insertId, message: "Customer registered." });
  } catch (error) { res.status(400).json({ message: error.code === "ER_DUP_ENTRY" ? "This email is already registered." : error.message }); }
});

// Availability check: blocks overlapping Pending/Confirmed bookings.
app.get("/api/availability", async (req, res) => {
  try {
    const { hall_id, event_date, start_time, end_time } = req.query;
    if (!hall_id || !event_date || !start_time || !end_time) return res.status(400).json({ message: "Please provide hall, date, start time and end time." });
    if (end_time <= start_time) return res.status(400).json({ message: "End time must be after start time." });
    const [rows] = await pool.query(
      `SELECT booking_id FROM bookings
       WHERE hall_id=? AND event_date=? AND status IN ('Pending','Confirmed')
       AND start_time < ? AND end_time > ?`,
      [hall_id,event_date,end_time,start_time]
    );
    res.json({ available: rows.length === 0, message: rows.length ? "This hall is already booked for an overlapping time." : "This hall is available for your selected time." });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, c.name AS customer_name, c.email, h.hall_name
       FROM bookings b JOIN customers c ON b.customer_id=c.customer_id
       JOIN halls h ON b.hall_id=h.hall_id ORDER BY b.booking_id DESC`
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post("/api/bookings", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, email, phone, address, hall_id, event_name, event_date, start_time, end_time } = req.body;
    if (!name || !email || !hall_id || !event_name || !event_date || !start_time || !end_time) return res.status(400).json({ message: "Please complete all required booking fields." });
    if (end_time <= start_time) return res.status(400).json({ message: "End time must be after start time." });
    await connection.beginTransaction();
    const [hallRows] = await connection.query("SELECT * FROM halls WHERE hall_id=? AND status='Available' FOR UPDATE", [hall_id]);
    if (!hallRows.length) { await connection.rollback(); return res.status(400).json({ message: "This hall is not currently available for booking." }); }
    const [conflicts] = await connection.query(
      "SELECT booking_id FROM bookings WHERE hall_id=? AND event_date=? AND status IN ('Pending','Confirmed') AND start_time < ? AND end_time > ?",
      [hall_id,event_date,end_time,start_time]
    );
    if (conflicts.length) { await connection.rollback(); return res.status(409).json({ message: "This hall is already booked for an overlapping time." }); }
    let [customers] = await connection.query("SELECT customer_id FROM customers WHERE email=?", [email]);
    let customerId;
    if (customers.length) {
      customerId = customers[0].customer_id;
      await connection.query("UPDATE customers SET name=?, phone=?, address=? WHERE customer_id=?", [name,phone || "",address || "",customerId]);
    } else {
      const [customerResult] = await connection.query("INSERT INTO customers (name,email,phone,address) VALUES (?,?,?,?)", [name,email,phone || "",address || ""]);
      customerId = customerResult.insertId;
    }
    const [bookingResult] = await connection.query(
      "INSERT INTO bookings (customer_id,hall_id,event_name,event_date,start_time,end_time,total_amount,status) VALUES (?,?,?,?,?,?,?,'Pending')",
      [customerId,hall_id,event_name,event_date,start_time,end_time,hallRows[0].price]
    );
    await connection.commit();
    res.status(201).json({ message: "Booking request submitted successfully. The admin can confirm it.", booking_id: bookingResult.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally { connection.release(); }
});

app.patch("/api/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending","Confirmed","Cancelled","Completed"].includes(status)) return res.status(400).json({ message: "Invalid booking status." });
    const [result] = await pool.query("UPDATE bookings SET status=? WHERE booking_id=?", [status,req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Booking not found." });
    res.json({ message: "Booking status updated." });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get("/api/payments", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, b.event_name, c.name AS customer_name, h.hall_name
       FROM payments p JOIN bookings b ON p.booking_id=b.booking_id
       JOIN customers c ON b.customer_id=c.customer_id JOIN halls h ON b.hall_id=h.hall_id
       ORDER BY p.payment_id DESC`
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});
app.post("/api/payments", async (req, res) => {
  try {
    const { booking_id, amount, payment_date, payment_status } = req.body;
    if (!booking_id || amount == null || !payment_date) return res.status(400).json({ message: "Booking, amount and payment date are required." });
    const [result] = await pool.query("INSERT INTO payments (booking_id,amount,payment_date,payment_status) VALUES (?,?,?,?)", [booking_id,Number(amount),payment_date,payment_status || "Paid"]);
    res.status(201).json({ payment_id: result.insertId, message: "Payment record added." });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const [[hallCount]] = await pool.query("SELECT COUNT(*) AS total FROM halls");
    const [[bookingCount]] = await pool.query("SELECT COUNT(*) AS total FROM bookings");
    const [[customerCount]] = await pool.query("SELECT COUNT(*) AS total FROM customers");
    const [[revenue]] = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE payment_status='Paid'");
    res.json({ halls: hallCount.total, bookings: bookingCount.total, customers: customerCount.total, revenue: revenue.total });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../frontend/index.html")));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Wedding Hall app running at http://localhost:${PORT}`));

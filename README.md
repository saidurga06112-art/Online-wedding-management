# Online Wedding Hall Booking Management System

A starter full-stack project using HTML, CSS, JavaScript, Node.js, Express and MySQL.

## Requirements
- Node.js (LTS) and npm
- MySQL Server
- MySQL Workbench
- VS Code (recommended)

## 1. Create the database
1. Open MySQL Workbench and connect to your local MySQL Server.
2. Choose **File > Open SQL Script** and select `database/wedding.sql` from this project.
3. Click the lightning bolt (Execute).
4. Refresh the Schemas panel. You should see `wedding_hall_db` and four tables: `customers`, `halls`, `bookings`, `payments`.
5. The script inserts three sample halls. The images are loaded from Unsplash, so an internet connection is needed to display them.

## 2. Configure the backend
1. Open this project folder in VS Code.
2. Open the terminal in the project root (the folder containing `package.json`).
3. Run `npm install`.
4. Copy `.env.example` to a new file named `.env`.
   - Windows PowerShell: `Copy-Item .env.example .env`
   - Command Prompt: `copy .env.example .env`
5. Open `.env` and enter the password for your MySQL `root` account in `DB_PASSWORD`.
   - If your MySQL root account has no password, leave `DB_PASSWORD=` blank.
   - Keep `.env` private; do not upload it to GitHub.

## 3. Run the website
In the project root terminal, run:

```bash
npm start
```

You should see:
`Wedding Hall app running at http://localhost:3000`

Open these pages in your browser:
- Customer website: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin.html
- Booking page: http://localhost:3000/booking.html

Do not double-click the HTML files. Open them through the local server URL above so the API requests work.

## 4. Test the main features
1. Open the customer website and browse the sample halls.
2. Click **Request to book** on a hall.
3. Enter customer details, event date, start and end time.
4. Click **Check availability**, then submit the booking request.
5. Open the Admin dashboard. The new booking appears with `Pending` status.
6. Change the booking status to `Confirmed`, `Cancelled` or `Completed`.
7. Add a payment record using the booking ID shown in the booking list.
8. Add, edit and delete halls from the admin dashboard.

## 5. Troubleshooting
- **Access denied for user 'root'**: check `DB_USER` and `DB_PASSWORD` in `.env`.
- **ECONNREFUSED / database connection failed**: make sure MySQL Server is installed and running. Workbench is only the management application; it does not replace MySQL Server.
- **Unknown database**: execute `database/wedding.sql` in Workbench.
- **Port 3000 already in use**: change `PORT=3001` in `.env`, restart the server and open `http://localhost:3001`.
- **Images do not appear**: confirm internet access. The sample image URLs are remote and can be replaced with your own image URLs.
- **Hall cannot be deleted**: existing bookings may reference it. Keep it and change its status to `Unavailable` instead.

## Notes / limitations
- This is a learning-project starter. The admin page is not protected by authentication; add secure admin login and role-based authorization before real deployment.
- Payment entries are records only. No real card/UPI payment gateway is connected.
- Sample hall names, locations, capacities and prices are demonstration data.
- Booking requests are initially `Pending`. The server checks for overlapping bookings before accepting a request.

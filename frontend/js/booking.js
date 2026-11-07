const API = "/api";
const form = document.getElementById("bookingForm");
const hallSelect = document.getElementById("hallSelect");
const message = document.getElementById("bookingMessage");
const availabilityMessage = document.getElementById("availabilityMessage");

async function loadHallOptions() {
  try {
    const halls = await (await fetch(`${API}/halls`)).json();
    hallSelect.innerHTML = '<option value="">Select a hall</option>' + halls.filter(h => h.status === "Available").map(h => `<option value="${h.hall_id}">${h.hall_name} — ₹${Number(h.price).toLocaleString("en-IN")}</option>`).join("");
    const selected = new URLSearchParams(location.search).get("hall");
    if (selected) hallSelect.value = selected;
  } catch { hallSelect.innerHTML = '<option value="">Unable to load halls</option>'; }
}
function bookingValues() {
  const data = Object.fromEntries(new FormData(form).entries());
  return data;
}
document.getElementById("checkAvailability").addEventListener("click", async () => {
  const d = bookingValues();
  if (!d.hall_id || !d.event_date || !d.start_time || !d.end_time) {
    availabilityMessage.textContent = "Select a hall, date and time first."; return;
  }
  try {
    const params = new URLSearchParams({hall_id:d.hall_id,event_date:d.event_date,start_time:d.start_time,end_time:d.end_time});
    const result = await (await fetch(`${API}/availability?${params}`)).json();
    availabilityMessage.textContent = result.message;
    availabilityMessage.style.color = result.available ? "green" : "#a33";
  } catch { availabilityMessage.textContent = "Could not check availability."; }
});
form.addEventListener("submit", async event => {
  event.preventDefault(); message.textContent = "Submitting your booking request…";
  try {
    const response = await fetch(`${API}/bookings`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(bookingValues())});
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Booking failed.");
    message.textContent = `${result.message} Your booking ID is ${result.booking_id}.`;
    form.reset(); availabilityMessage.textContent = "";
    await loadHallOptions();
  } catch (error) { message.textContent = error.message; }
});
loadHallOptions();

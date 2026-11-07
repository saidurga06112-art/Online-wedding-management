const API = "/api";
const $ = id => document.getElementById(id);
const money = value => "₹" + Number(value).toLocaleString("en-IN");
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const msg = text => { $("adminMessage").textContent = text; };

async function request(url, options={}) {
  const response = await fetch(API + url, {headers:{"Content-Type":"application/json"},...options});
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}
async function loadDashboard() {
  const d = await request("/dashboard");
  $("stats").innerHTML = `<div class="stat"><span>Total halls</span><b>${d.halls}</b></div><div class="stat"><span>Total bookings</span><b>${d.bookings}</b></div><div class="stat"><span>Customers</span><b>${d.customers}</b></div><div class="stat"><span>Paid revenue</span><b>${money(d.revenue)}</b></div>`;
}
async function loadHalls() {
  const halls = await request("/halls");
  $("hallRows").innerHTML = halls.map(h => `<tr><td>${esc(h.hall_name)}</td><td>${esc(h.location)}</td><td>${h.capacity}</td><td>${money(h.price)}</td><td>${esc(h.status)}</td><td><button class="table-action" data-edit="${h.hall_id}">Edit</button><button class="table-action" data-delete="${h.hall_id}">Delete</button></td></tr>`).join("") || '<tr><td colspan="6">No halls added.</td></tr>';
  $("hallRows").querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => {
    const h = halls.find(x => x.hall_id === Number(btn.dataset.edit));
    Object.entries(h).forEach(([key,value]) => { const field = $("hallForm").elements.namedItem(key); if (field) field.value = value ?? ""; });
    window.scrollTo({top:0,behavior:"smooth"});
  }));
  $("hallRows").querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", async () => {
    if (!confirm("Delete this hall?")) return;
    try { await request(`/halls/${btn.dataset.delete}`,{method:"DELETE"}); msg("Hall deleted."); await refresh(); }
    catch(e) { msg(e.message); }
  }));
}
async function loadBookings() {
  const bookings = await request("/bookings");
  $("bookingRows").innerHTML = bookings.map(b => `<tr><td>${esc(b.customer_name)}</td><td>${esc(b.hall_name)}</td><td>${esc(b.event_date)}</td><td>${esc(b.start_time)}–${esc(b.end_time)}</td><td>${money(b.total_amount)}</td><td>${esc(b.status)}</td><td><select class="status-select" data-booking="${b.booking_id}">${["Pending","Confirmed","Cancelled","Completed"].map(s=>`<option ${s===b.status?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join("") || '<tr><td colspan="7">No bookings yet.</td></tr>';
  $("bookingRows").querySelectorAll("[data-booking]").forEach(select => select.addEventListener("change", async () => {
    try { await request(`/bookings/${select.dataset.booking}/status`,{method:"PATCH",body:JSON.stringify({status:select.value})}); msg("Booking status updated."); await loadDashboard(); }
    catch(e) { msg(e.message); }
  }));
}
async function loadPayments() {
  const payments = await request("/payments");
  $("paymentRows").innerHTML = payments.map(p => `<tr><td>${p.payment_id}</td><td>${p.booking_id} — ${esc(p.event_name)}</td><td>${esc(p.customer_name)}</td><td>${money(p.amount)}</td><td>${esc(p.payment_date)}</td><td>${esc(p.payment_status)}</td></tr>`).join("") || '<tr><td colspan="6">No payment records yet.</td></tr>';
}
async function refresh() {
  try { await Promise.all([loadDashboard(),loadHalls(),loadBookings(),loadPayments()]); }
  catch(e) { msg(e.message + " Check that the server and database are running."); }
}
$("hallForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.currentTarget, data = Object.fromEntries(new FormData(form).entries());
  const id = data.hall_id; delete data.hall_id;
  try { await request(id ? `/halls/${id}` : "/halls",{method:id?"PUT":"POST",body:JSON.stringify(data)}); msg(id ? "Hall updated." : "Hall added."); form.reset(); await refresh(); }
  catch(e) { msg(e.message); }
});
$("clearHall").addEventListener("click", () => $("hallForm").reset());
$("paymentForm").addEventListener("submit", async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget).entries());
  try { await request("/payments",{method:"POST",body:JSON.stringify(data)}); msg("Payment record added."); e.currentTarget.reset(); await refresh(); }
  catch(e) { msg(e.message); }
});
$("refreshBtn").addEventListener("click", refresh);
refresh();

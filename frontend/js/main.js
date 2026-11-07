const API = "/api";
const money = value => "₹" + Number(value).toLocaleString("en-IN");
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let allHalls = [];

async function loadHalls() {
  const grid = document.getElementById("hallGrid");
  try {
    const response = await fetch(`${API}/halls`);
    if (!response.ok) throw new Error("Could not load halls");
    allHalls = await response.json();
    renderHalls(allHalls);
  } catch (error) {
    grid.innerHTML = `<p class="muted">Unable to load halls. Make sure the server and MySQL database are running.</p>`;
  }
}
function renderHalls(halls) {
  const grid = document.getElementById("hallGrid");
  if (!halls.length) { grid.innerHTML = '<p class="muted">No halls match your search yet.</p>'; return; }
  grid.innerHTML = halls.map(h => `
    <article class="hall-card">
      <div class="hall-image" style="background-image:url('${escapeHTML(h.image_url || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80")}')"><span class="hall-tag">${escapeHTML(h.status)}</span></div>
      <div class="hall-info"><h3>${escapeHTML(h.hall_name)}</h3><div class="hall-location">⌖ ${escapeHTML(h.location)}</div>
      <div class="hall-meta"><span>♧ Up to ${Number(h.capacity).toLocaleString("en-IN")} guests</span><strong class="hall-price">${money(h.price)}</strong></div>
      <a class="btn btn-dark" href="booking.html?hall=${h.hall_id}">Request to book →</a></div>
    </article>`).join("");
}
function filterHalls() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const capacity = Number(document.getElementById("capacityFilter").value || 0);
  renderHalls(allHalls.filter(h => (h.hall_name.toLowerCase().includes(query) || h.location.toLowerCase().includes(query)) && h.capacity >= capacity && h.status === "Available"));
}
document.getElementById("searchBtn").addEventListener("click", filterHalls);
document.getElementById("searchInput").addEventListener("input", filterHalls);
document.getElementById("capacityFilter").addEventListener("change", filterHalls);
loadHalls();

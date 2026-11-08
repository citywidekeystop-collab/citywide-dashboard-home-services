const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

let bookings = [];

// Stripe webhook must receive raw body before JSON parsing.
require("./citywide-booking-routes")(app);
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Health Check
app.get("/health", (req, res) => {
res.json({
ok: true,
service: "citywide-dashboard-home-services"
});
});

// Homepage
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Dedicated Bel Air $59 rekey Google Ads landing page
app.get(["/bel-air", "/bel-air/"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "bel-air.html"));
});

// National Lock Supply Page
app.get("/national-lock-supply", (req, res) => {
res.sendFile(path.join(__dirname, "public", "national-lock-supply.html"));
});

app.get("/national-lock-supply.html", (req, res) => {
res.sendFile(path.join(__dirname, "public", "national-lock-supply.html"));
});

// Booking API
app.post("/api/booking", (req, res) => {
const booking = {
id: Date.now(),
name: req.body.name || "",
phone: req.body.phone || "",
address: req.body.address || "",
service: req.body.service || "",
time: req.body.time || "",
notes: req.body.notes || "",
status: "New",
createdAt: new Date().toISOString()
};

bookings.unshift(booking);

res.json({
success: true,
booking
});
});

// View bookings as JSON
app.get("/api/bookings", (req, res) => {
res.json(bookings);
});

// Simple bookings dashboard
app.get("/admin/bookings", (req, res) => {
let rows = bookings.map(b => `
<tr>
<td>${b.name}</td>
<td>${b.phone}</td>
<td>${b.address}</td>
<td>${b.service}</td>
<td>${b.time}</td>
<td>${b.notes}</td>
<td>${b.status}</td>
</tr>
`).join("");

res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Citywide Bookings</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{font-family:Arial;background:#050505;color:white;padding:20px}
h1{color:#d9a021}
table{width:100%;border-collapse:collapse;background:#111}
th,td{border:1px solid #333;padding:10px;text-align:left;font-size:14px}
th{background:#d9a021;color:#000}
</style>
</head>
<body>
<h1>Citywide / NLS Bookings</h1>
<table>
<tr>
<th>Name</th>
<th>Phone</th>
<th>Address</th>
<th>Service</th>
<th>Time</th>
<th>Notes</th>
<th>Status</th>
</tr>
${rows || "<tr><td colspan='7'>No bookings yet.</td></tr>"}
</table>
</body>
</html>
`);
});

// City Pages
app.get([
"/locksmith-edgewood-md",
"/locksmith-bel-air-md",
"/locksmith-aberdeen-md",
"/locksmith-havre-de-grace-md",
"/locksmith-abingdon-md",
"/locksmith-baltimore-md",
"/locksmith-baltimore-county-md",
"/locksmith-harford-county-md",
"/car-lockout-edgewood-md",
"/car-lockout-bel-air-md",
"/house-lockout-edgewood-md",
"/rekey-service-bel-air-md",
"/commercial-locksmith-baltimore-md",
"/access-control-baltimore-md"
], (req, res) => {
const words = req.path.slice(1).split("-");
const labels = {md: "MD", havre: "Havre", de: "de", grace: "Grace"};
const title = words.map(word => labels[word] || word[0].toUpperCase() + word.slice(1)).join(" ");
const description = `Citywide Roadside Lock & Key provides ${title} service. Call 443-578-1686 for mobile locksmith help, lockouts, rekeying and lock replacement.`;
const html = fs.readFileSync(path.join(__dirname, "public", "city.html"), "utf8")
.replace("<title>Citywide Locksmith Service</title>", `<title>${title} | Citywide Roadside Lock & Key</title><meta name="description" content="${description}"><link rel="canonical" href="https://citywidelockandkey.com${req.path}">`)
.replace('id="pageTitle">Citywide Locksmith Service', `id="pageTitle">${title}`)
.replace('<p id="pageText"></p>', `<p id="pageText">${description}</p>`);
res.type("html").send(html);
});

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});

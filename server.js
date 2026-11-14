const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

let bookings = [];

// Stripe webhook must receive raw body before JSON parsing.
require("./citywide-booking-routes")(app);
app.use(express.json());

// Bowie & Crofton $369 keypad installation booking; private notification flow.
require("./citywide-keypad-booking")(app);

app.get(["/bowie-crofton-keypad","/bowie-crofton-keypad/"], (req,res) => {
  res.redirect(301, "/bowie-crofton-keypad.html");
});

// Static files: do not expose the internal ZIP/community page template directly.
app.use((req, res, next) => {
  if (req.path === "/rekey-area-template.html") return res.status(404).end();
  next();
});
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

// Dedicated Bel Air $39 rekey Google Ads landing page
app.get(["/bel-air", "/bel-air/"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "bel-air.html"));
});

// One distinct, indexable page URL per ZIP code and community for the $39 mobile-only rekey offer.
const promoZipCodes = new Set([
  "21001","21005","21009","21010","21013","21014","21015","21017","21018",
  "21028","21034","21040","21047","21050","21078","21082","21084","21085",
  "21087","21111","21130","21132","21154","21160","21161"
]);
const promoCommunities = {
  "bel-air-north-md": "Bel Air North, MD",
  "bel-air-south-md": "Bel Air South, MD",
  "fallston-md": "Fallston, MD",
  "forest-hill-md": "Forest Hill, MD",
  "abingdon-md": "Abingdon, MD",
  "churchville-md": "Churchville, MD"
};
const rekeyTemplatePath = path.join(__dirname, "public", "rekey-area-template.html");
app.get("/rekey-:area", (req, res, next) => {
  const part = req.params.area;
  const zip = promoZipCodes.has(part);
  const community = promoCommunities[part];
  if (!zip && !community) return next();
  const area = zip ? "ZIP code " + part + ", MD" : community;
  const intro = zip
    ? "For homes, apartments, rentals and businesses in Maryland ZIP code " + part + ", Citywide provides mobile rekeying by appointment. Tell dispatch your address and lock type so we can confirm travel availability, total pricing and the correct keying service before arrival."
    : "For homeowners, rentals, property managers and local businesses in " + community + ", Citywide's mobile locksmith team travels to the property for compatible lock rekeying. Contact dispatch with your street address and lock details for availability and a full quote.";
  const pagePath = "rekey-" + part;
  const metaTitle = "$39 Mobile Rekey " + (zip ? part + " MD" : community) + " | Citywide We Come to You";
  const metaDescription = "$39 rekey special per eligible cylinder in " + area + ". Mobile-only Citywide locksmith comes to your location. Call 443-578-1686.";
  const html = fs.readFileSync(rekeyTemplatePath, "utf8")
    .replaceAll("{{META_TITLE}}", metaTitle)
    .replaceAll("{{META_DESCRIPTION}}", metaDescription)
    .replaceAll("{{CANONICAL_PATH}}", pagePath)
    .replaceAll("{{AREA}}", area)
    .replaceAll("{{INTRO}}", intro);
  res.type("html").send(html);
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

// Legacy Google Ads sitelink URLs. Serve real location pages instead of 404s.
app.get(["/aberdeen-md-locksmith", "/fallston-md-locksmith"], (req, res) => {
  const city = req.path.startsWith("/aberdeen") ? "Aberdeen" : "Fallston";
  const title = "Locksmith in " + city + ", MD";
  const description = "Citywide Roadside Lock & Key provides mobile locksmith service in " + city + ", Maryland, including lockouts, rekeying, lock changes and lock installation. Call 443-578-1686 for availability and a quote.";
  const html = fs.readFileSync(path.join(__dirname, "public", "city.html"), "utf8")
    .replace("<title>Citywide Locksmith Service</title>", `<title>${title} | Citywide Roadside Lock & Key</title><meta name="description" content="${description}"><link rel="canonical" href="https://citywidelockandkey.com${req.path}">`)
    .replace('id="pageTitle">Citywide Locksmith Service', `id="pageTitle">${title}`)
    .replace('<p id="pageText"></p>', `<p id="pageText">${description}</p>`);
  res.type("html").send(html);
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

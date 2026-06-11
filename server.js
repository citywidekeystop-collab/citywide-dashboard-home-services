const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Health Check
app.get("/health", (req, res) => {
res.json({
ok: true,
service: "citywide-dashboard-home-services"
});
});

// National Lock Supply Page
app.get("/national-lock-supply", (req, res) => {
res.sendFile(path.join(__dirname, "public", "national-lock-supply.html"));
});

app.get("/national-lock-supply.html", (req, res) => {
res.sendFile(path.join(__dirname, "public", "national-lock-supply.html"));
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
res.sendFile(path.join(__dirname, "public", "city.html"));
});

// Homepage
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Catch All
app.get("*", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});

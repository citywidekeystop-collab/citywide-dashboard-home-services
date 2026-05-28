const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
res.json({ ok: true, service: "citywide-dashboard" });
});

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

app.get("*", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});


(function(){
"use strict";
var NUMBER="+14435781686";
var SERVICES=["House lockout","Car lockout","Business lockout","Lock replacement","Rekeying","Keypad / Wi-Fi lock installation","Keypad + handle bundle","Mailbox lock","Commercial locksmith service","Lock repair","Other locksmith service"];
function str(v){return String(v||"").trim()}
function suggest(path){
path=path.toLowerCase();
if(path.includes("rekey"))return "Rekeying";
if(path.includes("lock-change")||path.includes("deadbolt"))return "Lock replacement";
if(path.includes("car-lockout"))return "Car lockout";
if(path.includes("commercial")||path.includes("mag-lock")||path.includes("access-control"))return "Commercial locksmith service";
if(path.includes("smart-lock")||path.includes("keypad"))return "Keypad / Wi-Fi lock installation";
if(path.includes("emergency"))return "House lockout";
return "";
}
function init(){
if(document.getElementById("cw-booking-area")||!document.body)return;
var style=document.createElement("link");style.rel="stylesheet";style.href="/citywide-dispatch.css?v=20261105d";document.head.appendChild(style);
var section=document.createElement("section");section.id="cw-booking-area";section.className="cw-booking-area";section.setAttribute("aria-labelledby","cw-booking-title");
section.innerHTML='<div class="cw-booking-inner"><div class="cw-booking-kicker">CITYWIDE ROADSIDE LOCK & KEY · MARYLAND</div><h2 id="cw-booking-title">Book service or text live dispatch.</h2><p class="cw-booking-intro">Tell us what you need, choose your preferred appointment time, or message dispatch directly about your job. Call for urgent lockouts.</p><div class="cw-booking-grid"><div class="cw-booking-card"><h3>Request an appointment</h3><p>Choose a preferred service time and continue to secure $25 booking checkout. Dispatch will confirm your appointment and final quote.</p><form id="cw-service-booking"><div class="cw-booking-fields"><label class="cw-booking-field">Full name<input name="name" autocomplete="name" maxlength="100" required></label><label class="cw-booking-field">Phone number<input name="phone" type="tel" autocomplete="tel" maxlength="50" required></label><label class="cw-booking-field wide">Service address<input name="address" autocomplete="street-address" maxlength="250" placeholder="Street address, city, MD ZIP" required></label><label class="cw-booking-field wide">Service needed<select name="service" required><option value="">Select a locksmith service</option></select></label><label class="cw-booking-field">Preferred date<input name="date" type="date" required></label><label class="cw-booking-field">Preferred time<input name="time" type="time" required></label><label class="cw-booking-field wide">Job details (optional)<textarea name="details" rows="3" maxlength="120" placeholder="Lock type, number of locks, or vehicle details"></textarea></label></div><button class="cw-booking-btn cw-booking-submit" type="submit">Continue to secure $25 booking</button><p class="cw-booking-fine">Your requested date and time are not guaranteed until payment and Citywide confirmation. Booking discounts are subject to the published offer terms.</p><p class="cw-booking-status" role="status" aria-live="polite" hidden></p></form></div><aside class="cw-booking-text-panel"><div class="cw-booking-kicker" style="color:#16577b">CONTACT DISPATCH</div><h3>Need help sooner?</h3><p>Send a text with your service details or a lock photo. Review the message and tap Send in your phone’s messaging app.</p><a class="cw-booking-btn cw-text-link" id="cw-booking-sms" href="sms:+14435781686">Text Dispatch Now</a><a class="cw-booking-btn cw-call-link" href="tel:+14435781686">Call (443) 578-1686</a><p class="cw-dispatch-disclaimer">Replies depend on dispatcher availability. Sending a text does not guarantee an instant reply or appointment.</p></aside></div></div>';
var form=section.querySelector("form"),sel=form.elements.service;
SERVICES.forEach(function(s){var o=document.createElement("option");o.value=s;o.textContent=s;sel.appendChild(o)});
sel.value=suggest(location.pathname);
var date=form.elements.date,now=new Date();
date.min=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
var anchor=document.body.querySelector(":scope > footer, :scope > .sticky");
if(anchor)document.body.insertBefore(section,anchor);else document.body.appendChild(section);
// Make the booking options visible without requiring a scroll to the footer.
var banner=document.createElement("aside");
banner.id="cw-top-dispatch-banner";
banner.className="cw-action-banner";
banner.setAttribute("aria-label","Book a locksmith appointment or text dispatch");
banner.innerHTML='<div class="cw-action-inner"><div class="cw-action-copy"><span class="cw-action-eyebrow">CITYWIDE ROADSIDE LOCK & KEY · MARYLAND</span><strong class="cw-action-headline">Need a locksmith? <span>Book or text dispatch.</span></strong><p class="cw-action-subtitle">Request a service time online or send your details directly to our dispatch team. <span>Reply times vary.</span></p></div><div class="cw-action-buttons"><a class="cw-action-book" href="#cw-booking-area">📅 Book Appointment</a><a class="cw-action-text" href="sms:+14435781686" id="cw-banner-text">💬 Text Dispatch</a></div></div>';
var motion=document.querySelector(".cw-motion-banner");
var topHeader=document.body.querySelector(":scope > header, :scope > .site-header");
if(motion&&motion.parentNode===document.body)motion.insertAdjacentElement("afterend",banner);
else if(topHeader)topHeader.insertAdjacentElement("afterend",banner);
else document.body.insertBefore(banner,document.body.firstChild);
banner.querySelector(".cw-action-book").addEventListener("click",function(e){
  e.preventDefault();section.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  if(window.history&&window.history.replaceState)window.history.replaceState(null,"","#cw-booking-area");
});
var bannerText=banner.querySelector("#cw-banner-text");
bannerText.addEventListener("click",function(){
  var d=new FormData(form),msg=["Hi Citywide dispatch, I need locksmith service."];
  var service=str(d.get("service"))||suggest(window.location.pathname);
  if(service)msg.push("Service: "+service);
  if(str(d.get("address")))msg.push("Location: "+str(d.get("address")));
  if(str(d.get("details")))msg.push("Details: "+str(d.get("details")));
  msg.push("Please confirm pricing and availability.");
  bannerText.href="sms:"+NUMBER+"?body="+encodeURIComponent(msg.join("\n"));
});
var sms=section.querySelector("#cw-booking-sms");
sms.addEventListener("click",function(){
var d=new FormData(form),msg=["Hi, Citywide dispatch. I need locksmith service."];
["service","name","phone","address","date","time","details"].forEach(function(key){if(str(d.get(key)))msg.push(key.toUpperCase()+": "+str(d.get(key)))});
msg.push("Please confirm price and availability.");
sms.href="sms:"+NUMBER+"?body="+encodeURIComponent(msg.join("\n"));
});
date.addEventListener("input",function(){date.setCustomValidity("")});
form.addEventListener("submit",async function(e){
e.preventDefault();if(!form.reportValidity())return;
if(date.value<date.min){date.setCustomValidity("Please select today or a future date.");date.reportValidity();return}
date.setCustomValidity("");
var d=new FormData(form),status=form.querySelector(".cw-booking-status"),button=form.querySelector("button[type=submit]");
var payload={name:str(d.get("name")),phone:str(d.get("phone")),address:str(d.get("address")),service:str(d.get("service")),location:"Other Maryland",requested:str(d.get("date"))+" "+str(d.get("time"))+" Eastern",details:str(d.get("details"))};
button.disabled=true;status.hidden=false;status.textContent="Opening secure checkout…";
try{
var response=await fetch("/api/citywide/checkout",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(payload)});
var result=await response.json();if(!response.ok||!result.url||!result.url.startsWith("https://"))throw new Error("Checkout unavailable");
document.dispatchEvent(new Event("citywide:booking-checkout-start"));
window.location.assign(result.url);
}catch(error){status.textContent="Secure booking checkout is currently unavailable; no payment was processed. Please text dispatch or call (443) 578-1686.";button.disabled=false}
});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
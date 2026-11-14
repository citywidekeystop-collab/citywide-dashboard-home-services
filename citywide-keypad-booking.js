// Dedicated Citywide Bowie/Crofton keypad installation booking + Stripe checkout.
// Never put Stripe/Twilio credentials in the browser or in this repository.
const express = require("express");
const crypto = require("crypto");
const OFFER = "bowie-crofton-keypad-369";
const PRICE_CENTS = 36900;
const DISPATCH = process.env.DISPATCH_SMS_TO || "+14435781686";
const SITE = (process.env.PUBLIC_SITE_URL || "https://citywidelockandkey.com").replace(/\/$/, "");
const clean = (v,n=150) => String(v ?? "").trim().slice(0,n);
const recent = new Map();
const bookings = new Map();

function validated(v) {
  const b = {
    name: clean(v.name,90), phone: clean(v.phone,28), email: clean(v.email,120),
    city: clean(v.city,30), address: clean(v.address,220),
    finish: clean(v.finish,30), hardware: clean(v.hardware,40),
    date: clean(v.date,12), time: clean(v.time,35),
    notes: clean(v.notes,500), paymentPreference: clean(v.paymentPreference,20)
  };
  if (!b.name || b.name.length < 2) throw new Error("Enter your full name.");
  if (!/^\+?[\d\s().-]{10,28}$/.test(b.phone) || b.phone.replace(/\D/g,"").length < 10) throw new Error("Enter a valid phone number.");
  if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) throw new Error("Enter a valid email or leave it blank.");
  if (!["Bowie","Crofton"].includes(b.city)) throw new Error("Select Bowie or Crofton, Maryland.");
  if (b.address.length < 6) throw new Error("Enter the installation street address.");
  if (!["Black","Satin Nickel"].includes(b.finish)) throw new Error("Choose a lock finish.");
  if (!["Curved lever","Straight lever","Round knob"].includes(b.hardware)) throw new Error("Choose a handle or knob.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date)) throw new Error("Choose a preferred appointment date.");
  if (b.date < new Date().toLocaleDateString("en-CA",{timeZone:"America/New_York"})) throw new Error("Choose today or a future date.");
  if (!["Morning (8 AM–12 PM)","Afternoon (12–4 PM)","Evening (4–8 PM)"].includes(b.time)) throw new Error("Choose a preferred time window.");
  if (!["online","phone"].includes(b.paymentPreference)) throw new Error("Choose a payment preference.");
  return b;
}
function message(b, id, prefix="NEW BOOKING") {
  return [prefix+" - CITYWIDE Bowie/Crofton WiFi Keypad $369 INSTALLED",
    "Request #"+id, b.name, "Call: "+b.phone,
    "Address: "+b.address+", "+b.city+", MD",
    "Bundle: "+b.finish+" keypad + "+b.hardware,
    "Preferred: "+b.date+" / "+b.time,
    "Payment: "+(b.paymentPreference==="online"?"Customer requested secure online checkout":"Dispatch to discuss payment by phone"),
    b.notes ? "Notes: "+b.notes : "",
    "DISPATCH: Call customer to confirm availability, details and payment."
  ].filter(Boolean).join("\n");
}
async function sendText(text) {
  const sid=process.env.TWILIO_ACCOUNT_SID, token=process.env.TWILIO_AUTH_TOKEN, from=process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return false;
  const r=await fetch("https://api.twilio.com/2010-04-01/Accounts/"+encodeURIComponent(sid)+"/Messages.json",{
    method:"POST",
    headers:{"Authorization":"Basic "+Buffer.from(sid+":"+token).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({From:from,To:DISPATCH,Body:text})
  });
  if (!r.ok) throw new Error("Dispatch SMS gateway unavailable: "+r.status);
  return true;
}
async function sendEmail(subject,body) {
  if (!process.env.RESEND_API_KEY || !process.env.BOOKING_NOTIFY_EMAIL || !process.env.BOOKING_FROM_EMAIL) return false;
  const r=await fetch("https://api.resend.com/emails",{
    method:"POST",headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({from:process.env.BOOKING_FROM_EMAIL,to:[process.env.BOOKING_NOTIFY_EMAIL],subject,text:body})
  });
  if(!r.ok) throw new Error("Dispatch email gateway unavailable: "+r.status);
  return true;
}
async function notify(b,id,prefix) {
  const text=message(b,id,prefix);
  const [sms,email]=await Promise.allSettled([
    sendText(text),
    sendEmail(prefix+" — Citywide $369 Keypad "+b.city+" #"+id,text)
  ]);
  for(const result of [sms,email]) if(result.status==="rejected") console.error("Citywide keypad dispatch notification",result.reason?.message);
  return {smsSent:sms.status==="fulfilled"&&sms.value===true,emailSent:email.status==="fulfilled"&&email.value===true};
}
async function notifyPaidBooking(session) {
  const data=JSON.parse(session.metadata?.booking || "{}");
  const id=clean(session.metadata?.booking_id,40);
  const out=await notify(data,id,"PAID $369 — STRIPE "+clean(session.id,90));
  if (!out.smsSent && !out.emailSent) throw new Error("Paid Bowie keypad dispatch notification not configured");
  return out;
}
async function stripeCheckout(b,id) {
  const key=process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe checkout is not configured on this website");
  const bookingMetadata=JSON.stringify({...b,notes:clean(b.notes,120)});
  if(bookingMetadata.length>490) throw new Error("Booking details too long for checkout");
  const body=new URLSearchParams();
  const assign=(k,v)=>body.set(k,String(v));
  assign("mode","payment");
  assign("line_items[0][price_data][currency]","usd");
  assign("line_items[0][price_data][unit_amount]",PRICE_CENTS);
  assign("line_items[0][price_data][product_data][name]","Citywide Bowie & Crofton Wi-Fi keypad lock bundle — installation included");
  assign("line_items[0][price_data][product_data][description]","One smart keypad deadbolt plus one selected keyless handle or knob, standard professional installation and setup, appointment subject to dispatch confirmation.");
  assign("line_items[0][quantity]",1);
  assign("success_url",SITE+"/bowie-crofton-keypad.html?payment=success&session_id={CHECKOUT_SESSION_ID}");
  assign("cancel_url",SITE+"/bowie-crofton-keypad.html?payment=cancelled");
  assign("client_reference_id",id);
  assign("metadata[offer]",OFFER);
  assign("metadata[booking_id]",id);
  assign("metadata[booking]",bookingMetadata);
  assign("phone_number_collection[enabled]",true);
  if (b.email) assign("customer_email",b.email);
  const r=await fetch("https://api.stripe.com/v1/checkout/sessions",{
    method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/x-www-form-urlencoded"},body
  });
  const result=await r.json();
  if(!r.ok || !result.url) { console.error("Bowie Stripe session error",r.status,result.error?.type);throw new Error("Secure online payment is unavailable. Dispatch can arrange payment by phone.");}
  return result.url;
}
module.exports=function installBowieKeypad(app,saveBooking){
  app.post("/api/bowie-crofton/booking",express.json({limit:"12kb"}),async(req,res)=>{
    res.set("Cache-Control","no-store");
    try {
      if(req.body?.website) return res.status(400).json({error:"Unable to submit booking."});
      const ip=(req.ip||"unknown").slice(0,60);
      const now=Date.now(); const prior=recent.get(ip)||[];
      const times=prior.filter(t=>now-t<10*60*1000);
      if(times.length>=5) return res.status(429).json({error:"Too many requests. Please call dispatch at 443-578-1686."});
      times.push(now);recent.set(ip,times);
      const b=validated(req.body||{});
      const id=crypto.randomBytes(7).toString("hex").toUpperCase();
      const record={...b,id,createdAt:new Date().toISOString(),paymentStatus:"not_paid"};
      bookings.set(id,record);
      if(typeof saveBooking==="function") saveBooking({
        id, name:b.name,phone:b.phone,address:b.address+", "+b.city+", MD",
        service:"Bowie/Crofton $369 Wi-Fi keypad installation bundle",
        time:b.date+" "+b.time,
        notes:b.finish+" keypad + "+b.hardware+"; "+b.notes+"; Payment: "+b.paymentPreference,
        status:"Appointment request — dispatch confirmation required",
        createdAt:record.createdAt
      });
      const delivered=await notify(b,id,"NEW INSTALLATION REQUEST");
      const smsBody=encodeURIComponent(message(b,id,"NEW INSTALLATION REQUEST"));
      return res.json({
        ok:true,bookingId:id,dispatchTextSent:delivered.smsSent,dispatchEmailSent:delivered.emailSent,
        fallbackTextUrl:"sms:"+DISPATCH+"?body="+smsBody,
        message:delivered.smsSent?"Booking text sent to dispatch. Dispatch will call to confirm.":delivered.emailSent?"Your booking reached dispatch by email. Use the text option below to also text dispatch.":"Tap Send Text to Dispatch to complete your booking request; no automatic dispatch message was delivered."
      });
    }catch(e){return res.status(400).json({error:e.message||"Unable to submit booking."});}
  });
  app.post("/api/bowie-crofton/checkout",express.json({limit:"4kb"}),async(req,res)=>{
    res.set("Cache-Control","no-store");
    const id=clean(req.body?.bookingId,50);
    const b=bookings.get(id);
    if(!b)return res.status(404).json({error:"Booking request expired. Please resubmit the form."});
    try{return res.json({url:await stripeCheckout(b,id)});}
    catch(e){return res.status(503).json({error:e.message});}
  });
  app.get("/api/bowie-crofton/payment-status",async(req,res)=>{
    res.set("Cache-Control","no-store");
    const id=clean(req.query.session_id,120);
    if(!/^cs_(live|test)_[A-Za-z0-9_]+$/.test(id)||!process.env.STRIPE_SECRET_KEY)return res.status(400).json({paid:false});
    try {
      const r=await fetch("https://api.stripe.com/v1/checkout/sessions/"+encodeURIComponent(id),{headers:{"Authorization":"Bearer "+process.env.STRIPE_SECRET_KEY}});
      if(!r.ok) return res.status(502).json({paid:false});
      const s=await r.json();
      return res.json({paid:s.payment_status==="paid"&&s.amount_total===PRICE_CENTS&&s.currency==="usd"&&s.metadata?.offer===OFFER});
    }catch{return res.status(502).json({paid:false});}
  });
};
module.exports.notifyPaidBooking=notifyPaidBooking;
module.exports.OFFER=OFFER;

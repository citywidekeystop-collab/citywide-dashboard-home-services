const crypto = require("crypto");
const express = require("express");
const ALLOWED = new Set(["Parkville","Perry Hall","White Marsh","Essex","Other Baltimore County","Other Maryland"]);
const SERVICE = new Set(["Lock change","Lock rekey","Mailbox lock / key","Locksmith consultation","Other lock / key question","House lockout","Car lockout","Business lockout","Lock replacement","Rekeying","Keypad / Wi-Fi lock installation","Keypad + handle bundle","Mailbox lock","Commercial locksmith service","Lock repair","Other locksmith service"]);
const trim=(x,n=250)=>String(x||"").trim().slice(0,n);
function validate(b) {
 const data={name:trim(b.name,100),phone:trim(b.phone,50),email:trim(b.email,150),location:trim(b.location,60),address:trim(b.address,250),service:trim(b.service,80),requested:trim(b.requested,120),details:trim(b.details,120)};
 if(!data.name||!data.phone||!ALLOWED.has(data.location)||!SERVICE.has(data.service))throw Error("Please provide name, phone, service and location.");
 return data;
}
async function alertCitywide(d,paid,sessionId) {
 if(!process.env.RESEND_API_KEY||!process.env.BOOKING_NOTIFY_EMAIL||!process.env.BOOKING_FROM_EMAIL)throw Error("Booking notification email not configured");
 const subject=(paid?"PAID $25 BOOKING: ":"FREE QUOTE: ")+d.service+" - "+d.location;
 const body=Object.entries({...d,payment_status:paid?"Paid $25":"Free quote",stripe_checkout_session:sessionId||""}).map(([k,v])=>k+": "+v).join("\n");
 const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.BOOKING_FROM_EMAIL,to:[process.env.BOOKING_NOTIFY_EMAIL],subject,text:body})});
 if(!r.ok)throw Error("Notification provider error");
}
module.exports=function installBooking(app){
 app.post("/api/citywide/stripe-webhook",express.raw({type:"application/json"}),async(req,res)=>{
  const secret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!secret)return res.sendStatus(503);
  const signature=req.headers["stripe-signature"]||"";
  const pairs=signature.split(",").map(s=>s.split("="));
  const ts=pairs.find(([k])=>k==="t")?.[1], v1=pairs.filter(([k])=>k==="v1").map(x=>x[1]);
  if(!ts||Math.abs(Date.now()/1000-Number(ts))>300)return res.sendStatus(400);
  const expected=crypto.createHmac("sha256",secret).update(ts+"."+req.body.toString()).digest("hex");
  if(!v1.some(s=>s?.length===expected.length&&crypto.timingSafeEqual(Buffer.from(s),Buffer.from(expected))))return res.sendStatus(400);
  const event=JSON.parse(req.body.toString());
  if(event.type==="checkout.session.completed"&&event.data.object.payment_status==="paid"){
   const session=event.data.object;
   try {
    if(session.metadata?.offer==="bowie-crofton-keypad-369") {
      await require("./citywide-keypad-booking").notifyPaidBooking(session);
    } else if(session.amount_total===2500 && typeof session.metadata?.booking==="string" && session.metadata.booking.length>2) {
      const d=JSON.parse(session.metadata.booking);
      await alertCitywide(d,true,session.id);
    } else {
      // NLS store orders and unrelated Stripe events are not Citywide bookings.
      console.info("Ignoring unrelated paid checkout", session.id);
    }
   } catch(e){console.error("PAID booking notification failed",session.id,e.message);return res.sendStatus(500);}
  }
  res.json({received:true});
 });
 // Verify Checkout server-side before a payment is counted as a conversion.
 app.get("/api/citywide/booking-status",async(req,res)=>{
  res.set("Cache-Control","no-store");
  const id=String(req.query.session_id||"");
  if(id.length>200||!/^cs_(test_|live_)[A-Za-z0-9_]+$/.test(id))return res.status(400).json({paid:false});
  if(!process.env.STRIPE_SECRET_KEY)return res.status(503).json({paid:false});
  try{
   const r=await fetch("https://api.stripe.com/v1/checkout/sessions/"+encodeURIComponent(id),{
    headers:{"Authorization":"Bearer "+process.env.STRIPE_SECRET_KEY}
   });
   if(!r.ok)return res.status(502).json({paid:false});
   const session=await r.json();
   const paid=session.id===id&&session.payment_status==="paid"&&session.mode==="payment"&&
    session.currency==="usd"&&session.amount_total===2500&&typeof session.metadata?.booking==="string";
   return res.json({paid:paid});
  }catch(e){
   console.error("Booking payment verification failed:",e.message);
   return res.status(502).json({paid:false});
  }
 });
 app.post("/api/citywide/quote",express.json({limit:"12kb"}),async(req,res)=>{
  try{const d=validate(req.body);await alertCitywide(d,false);res.json({ok:true});}
  catch(e){res.status(e.message.includes("not configured")?503:400).json({error:e.message});}
 });
 // Verified, active Stripe-hosted booking link for Citywide's $25 booking credit.
 // The hosted checkout independently collects contact information, service,
 // address and preferred appointment date/time as required custom fields.
 // The payment link is administered in the connected NLS Stripe account.
 const CITYWIDE_BOOKING_LINK="https://book.stripe.com/4gMdR95Emexret90xw3VC00";
 app.post("/api/citywide/checkout",express.json({limit:"12kb"}),async(req,res)=>{
  try{
   validate(req.body);
   res.set("Cache-Control","no-store");
   return res.json({
    url:CITYWIDE_BOOKING_LINK,
    hosted_checkout:true,
    notice:"Please re-enter and confirm your service address and preferred appointment time at secure Stripe checkout."
   });
  }catch(e){
   return res.status(400).json({error:e.message||"Please complete the required booking details."});
  }
 });
};
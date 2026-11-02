const crypto = require("crypto");
const express = require("express");
const ALLOWED = new Set(["Parkville","Perry Hall","White Marsh","Essex","Other Baltimore County"]);
const SERVICE = new Set(["Lock change","Lock rekey","Mailbox lock / key","Locksmith consultation","Other lock / key question"]);
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
    const d=JSON.parse(session.metadata?.booking||"{}");
    await alertCitywide(d,true,session.id);
   } catch(e){console.error("PAID booking notification failed",session.id,e.message);return res.sendStatus(500);}
  }
  res.json({received:true});
 });
 app.post("/api/citywide/quote",express.json({limit:"12kb"}),async(req,res)=>{
  try{const d=validate(req.body);await alertCitywide(d,false);res.json({ok:true});}
  catch(e){res.status(e.message.includes("not configured")?503:400).json({error:e.message});}
 });
 app.post("/api/citywide/checkout",express.json({limit:"12kb"}),async(req,res)=>{
  try{
   const d=validate(req.body);
   if(!process.env.STRIPE_SECRET_KEY) return res.status(503).json({error:"Secure checkout is not yet configured."});
   const p=new URLSearchParams();
   p.set("mode","payment");p.set("success_url","https://citywidelockandkey.com/booking-success/?session_id={CHECKOUT_SESSION_ID}");p.set("cancel_url","https://citywidelockandkey.com/booking-cancelled/");
   p.set("line_items[0][price_data][currency]","usd");p.set("line_items[0][price_data][unit_amount]","2500");
   p.set("line_items[0][price_data][product_data][name]","Citywide Locksmith Appointment Request - $25 Credit");
   p.set("line_items[0][quantity]","1");p.set("metadata[booking]",JSON.stringify({name:d.name.slice(0,55),phone:d.phone.slice(0,25),email:d.email.slice(0,65),location:d.location,service:d.service,address:d.address.slice(0,55),requested:d.requested.slice(0,35),details:d.details.slice(0,55)}));
   p.set("customer_creation","always");p.set("phone_number_collection[enabled]","true");
   if(d.email)p.set("customer_email",d.email);
   const r=await fetch("https://api.stripe.com/v1/checkout/sessions",{method:"POST",headers:{"Authorization":"Bearer "+process.env.STRIPE_SECRET_KEY,"Content-Type":"application/x-www-form-urlencoded"},body:p});
   const s=await r.json();
   if(!r.ok||!s.url)throw Error("Checkout could not be started.");
   res.json({url:s.url});
  }catch(e){res.status(400).json({error:e.message});}
 });
};
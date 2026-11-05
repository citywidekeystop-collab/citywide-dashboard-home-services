(function(){
"use strict";
function init(){
var body=document.body;if(!body||body.dataset.cwThemeLoaded)return;
body.dataset.cwThemeLoaded="1";body.classList.add("cw-unified");
var text=["24/7 MOBILE LOCKSMITH","HOUSE & CAR LOCKOUTS","LOCK REKEY & LOCK CHANGE","SMART LOCK INSTALLATION","DEADBOLTS & DOOR HARDWARE","HARFORD COUNTY & BALTIMORE"];
var bar=document.createElement("div");bar.className="cw-motion-banner";bar.setAttribute("aria-label","Citywide locksmith services");
var viewport=document.createElement("div");viewport.className="cw-motion-viewport";
var track=document.createElement("div");track.className="cw-motion-track";
function group(hidden){var d=document.createElement("div");d.className="cw-motion-group";if(hidden)d.setAttribute("aria-hidden","true");text.forEach(function(x){var e=document.createElement("span");e.textContent=x;d.appendChild(e)});return d}
track.appendChild(group(false));track.appendChild(group(true));viewport.appendChild(track);
var btn=document.createElement("button");btn.type="button";btn.className="cw-motion-switch";btn.textContent="Pause motion";btn.setAttribute("aria-pressed","false");
btn.addEventListener("click",function(){var paused=body.classList.toggle("cw-motion-paused");btn.textContent=paused?"Resume motion":"Pause motion";btn.setAttribute("aria-pressed",String(paused))});
bar.appendChild(viewport);bar.appendChild(btn);
var header=body.querySelector(":scope > header, :scope > .site-header");
if(header)header.insertAdjacentElement("afterend",bar);else body.insertBefore(bar,body.firstChild);
var headings=body.querySelectorAll(".wrap > h1");
for(var i=0;i<headings.length;i++){var h=headings[i],p=h.nextElementSibling;if(!p||p.tagName!=="P"||!h.parentElement)continue;var section=document.createElement("section");section.className="cw-county-hero";h.parentNode.insertBefore(section,h);section.appendChild(h);section.appendChild(p)}
var hero=body.querySelector(".hero,.cw-county-hero");
if(hero){if(hero.querySelector(".visual,.hero-content"))hero.classList.add("cw-image-hero");
var art=document.createElement("div");art.className="cw-lock-art";art.setAttribute("aria-hidden","true");
art.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 180" fill="none"><g class="cw-shackle"><path d="M35 79V48C35 26 50 13 70 13S105 26 105 48V79" stroke="#CDEEFF" stroke-width="13" stroke-linecap="round"/></g><rect x="18" y="73" width="104" height="95" rx="18" fill="#7EC0E7" fill-opacity=".35" stroke="#CDEEFF" stroke-width="4"/><circle cx="70" cy="113" r="10" fill="#DDF5FF"/><path d="M70 124v17" stroke="#DDF5FF" stroke-width="7" stroke-linecap="round"/><path class="cw-wifi" d="M52 38Q70 22 88 38M59 48Q70 38 81 48" stroke="#B9E5FF" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="57" r="3" fill="#B9E5FF"/></svg>';
hero.appendChild(art)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
/* Dispatch CTA shared across public Citywide pages. */
(function(){if(document.querySelector('script[src*="citywide-dispatch.js"]'))return;var s=document.createElement('script');s.src='/citywide-dispatch.js?v=20261105d';s.defer=true;document.head.appendChild(s)})();

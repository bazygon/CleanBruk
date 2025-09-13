// ===================== BrukClean / main.js =====================
// Uwaga: efekty particles/typing/parallax/progress/liczniki są w index.html (inline).
// Ten plik nie duplikuje tych funkcji.

"use strict";

// Helpers
const $  = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

// ---- Active menu on scroll
const sections  = $$("main section[id]");
const menuLinks = $$("nav a[href^='#']");
const sectionIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const id = e.target.id;
      menuLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#"+id));
    }
  });
},{ rootMargin:"-50% 0px -45% 0px" });
sections.forEach(s=> sectionIO.observe(s));

// ---- Mobile menu toggle (z ESC i kliknięciem poza)
const toggle = $("#menuToggle");
const menu   = $("#menu");
function closeMenu(){
  if(!toggle || !menu) return;
  menu.style.display = "none";
  toggle.setAttribute("aria-expanded","false");
}
function openMenu(){
  if(!toggle || !menu) return;
  menu.style.display = "block";
  toggle.setAttribute("aria-expanded","true");
}
toggle?.addEventListener("click", ()=>{
  const open = menu.style.display === "block";
  open ? closeMenu() : openMenu();
});
document.addEventListener("click", (e)=>{
  if(!menu || !toggle) return;
  if(menu.style.display === "block"){
    const inside = menu.contains(e.target) || toggle.contains(e.target);
    if(!inside) closeMenu();
  }
});
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape") closeMenu();
});
// reset na desktopie – nie nadpisuj flex z CSS
window.addEventListener("resize", ()=>{
  if(innerWidth > 1024 && menu){
    menu.style.display = ""; // czyść inline style
    toggle?.setAttribute("aria-expanded","false");
  }
}, {passive:true});

// ---- Reveal on scroll (AOS z delikatnym „stagger”)
const revealIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add("in-view"); revealIO.unobserve(e.target); }
  });
},{ threshold:0.2 });
$$(".reveal").forEach((el,i)=>{
  el.style.transitionDelay = (i * 0.05) + "s";
  revealIO.observe(el);
});

// ---- Before/After slider (mysz + dotyk + klawiatura przez <input type="range">)
const ba = $(".before-after");
if(ba){
  const after  = ba.querySelector(".after");
  const slider = ba.querySelector(".slider");
  const handle = ba.querySelector(".handle");
  const range  = ba.querySelector(".range");

  const setPos = (p)=>{
    p = Math.max(0, Math.min(100, Number(p)));
    after.style.clipPath = `inset(0 0 0 ${p}%)`;
    slider.style.left = p + "%";
    handle.style.left = `calc(${p}% - 14px)`;
    if(range) range.value = String(p);
  };
  setPos(range?.value ?? 50);

  const updateFromEvent = (e)=>{
    const rect = ba.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(p);
  };

  // Drag/Touch
  let dragging = false;
  ba.addEventListener("mousedown",(e)=>{ dragging = true; updateFromEvent(e); });
  ba.addEventListener("mouseup",  ()=> dragging = false);
  ba.addEventListener("mouseleave",()=> dragging = false);
  ba.addEventListener("mousemove",(e)=>{ if(dragging) updateFromEvent(e); });
  ba.addEventListener("touchstart",(e)=> updateFromEvent(e), {passive:true});
  ba.addEventListener("touchmove", updateFromEvent, {passive:true});

  // Range (klawiatura/ARIA)
  range?.addEventListener("input", (e)=> setPos(e.target.value));
  range?.addEventListener("change",(e)=> setPos(e.target.value));
}

// ---- Portfolio: filter (ARIA) & lightbox (klawiatura, strzałki)
const filterBtns = $$(".filters button");
const items      = $$(".portfolio .item");
function applyFilter(f){
  items.forEach(it => {
    const show = (f==="all" || it.dataset.cat===f);
    it.style.display = show ? "block" : "none";
  });
}
filterBtns.forEach(btn=>btn.addEventListener("click",()=>{
  filterBtns.forEach(b=>{
    b.classList.remove("active");
    b.setAttribute("aria-selected","false");
  });
  btn.classList.add("active");
  btn.setAttribute("aria-selected","true");
  applyFilter(btn.dataset.filter);
}));

// Lightbox
const lightbox = $(".lightbox");
const lightImg = lightbox?.querySelector("img");
let currentIndex = -1;
function openLightbox(i){
  const vis = items.filter(it => it.style.display !== "none");
  if(!vis.length) return;
  currentIndex = ((i%vis.length)+vis.length)%vis.length;
  const img = vis[currentIndex].querySelector("img");
  if(lightImg && img){
    lightImg.src = img.src;
    lightImg.alt = img.alt || "";
    lightbox.classList.add("active");
  }
}
function closeLightbox(){ lightbox?.classList.remove("active"); currentIndex = -1; }
function nextLightbox(step=1){
  const vis = items.filter(it => it.style.display !== "none");
  if(currentIndex < 0 || !vis.length) return;
  openLightbox(currentIndex + step);
}
items.forEach((it, idx)=>{
  const img = it.querySelector("img");
  img.style.cursor = "zoom-in";
  img.addEventListener("click", ()=> openLightbox(idx));
  img.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); openLightbox(idx); }});
  img.setAttribute("tabindex","0");
});
lightbox?.addEventListener("click", (e)=>{ if(e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown",(e)=>{
  if(!lightbox || !lightbox.classList.contains("active")) return;
  if(e.key === "Escape") closeLightbox();
  if(e.key === "ArrowRight") nextLightbox(1);
  if(e.key === "ArrowLeft")  nextLightbox(-1);
});

// ---- Quote calculator (real-time)
const rateTable = {
  kostka:  { light:[10,14], medium:[14,18], heavy:[18,25], imp:15 },
  elewacja:{ light:[15,17], medium:[16,19], heavy:[18,22], imp:15 },
  dach:    { light:[18,21], medium:[20,24], heavy:[23,30], imp:15 }
};
const fmt = (v)=> v.toLocaleString("pl-PL",{style:"currency",currency:"PLN",maximumFractionDigits:0});

function recalc(){
  const svc  = $("#service")?.value;
  const area = Math.max(0, Number($("#area")?.value || 0));
  const dirt = $("#dirt")?.value;
  const imp  = $("#imp")?.checked;
  const lift = $("#lift")?.checked;
  const est  = $("#estimate");
  const estBreak = $("#estBreak");

  if(!area || !svc || !dirt){ 
    if(est) est.textContent="—"; 
    if(estBreak) estBreak.textContent="Wprowadź metraż i wybierz usługę."; 
    return; 
  }

  const [low, high] = rateTable[svc][dirt];
  const baseLow   = area * low;
  const baseHigh  = area * high;
  const impCost   = imp ? area * rateTable[svc].imp : 0;
  const liftFlat  = lift ? 500 : 0;
  const totalLow  = Math.round(baseLow + impCost + liftFlat);
  const totalHigh = Math.round(baseHigh + impCost + liftFlat);

  animateRange(est, totalLow, totalHigh);
  if(estBreak){
    estBreak.innerHTML = `Usługa <b>${svc}</b> (${area} m², zabrudzenie: ${dirt})${imp? ' + impregnacja':''}${lift? ' + podnośnik':''}.`;
  }
}
["service","area","dirt","imp","lift"].forEach(id=> $("#"+id)?.addEventListener("input", recalc, {passive:true}));

function animateRange(el, from, to){
  if(!el) return;
  const steps = 18, dur = 700;
  let i=0;
  const timer = setInterval(()=>{
    const v = Math.round(from + (to-from)*(i/steps));
    el.textContent = `${fmt(v)} – ${fmt(to)}`;
    if(++i>steps) clearInterval(timer);
  }, dur/steps);
}
recalc();

// ---- Forms (mock submit + UX)
function btnLoading(btn, on){
  if(!btn) return;
  btn.disabled = !!on;
  btn.dataset.loading = on ? "1" : "";
}
$("#quoteForm")?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  btnLoading(btn, true);
  setTimeout(()=>{
    alert("Dziękujemy! Twoja prośba o wycenę została zapisana. Skontaktujemy się wkrótce.");
    e.target.reset(); recalc(); btnLoading(btn,false);
  }, 600);
});
$("#contactForm")?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  btnLoading(btn, true);
  setTimeout(()=>{
    $("#cformMsg").textContent = "Dziękujemy! Odpowiemy maksymalnie w 24h (dni robocze).";
    e.target.reset(); btnLoading(btn,false);
  }, 600);
});
$("#subForm")?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  btnLoading(btn, true);
  setTimeout(()=>{
    $("#subMsg").textContent = "Zapisano! Sprawdź e-mail (potwierdzenie).";
    e.target.reset(); btnLoading(btn,false);
  }, 500);
});

// ---- Map (lazy embed)
$("#loadMap")?.addEventListener("click", ()=>{
  const iframe = document.createElement("iframe");
  iframe.title = "Mapa – BrukClean, Łódź";
  iframe.width = "100%"; iframe.height = "320"; iframe.loading = "lazy";
  iframe.style.border = "0"; iframe.referrerPolicy = "no-referrer-when-downgrade";
  // Podmień na swój embed (to przykładowe koordynaty Łodzi)
  iframe.src = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9762.86!2d19.455!3d51.759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spl!2spl!4v1680000000000";
  $("#mapBox").innerHTML = "";
  $("#mapBox").appendChild(iframe);
});

// ---- Cookies
const cookieBar  = $("#cookieBar");
const manageBtn  = $("#manageCookies");
const acceptBtn  = $("#cookiesAccept");
const rejectBtn  = $("#cookiesReject");
const COOKIE_KEY = "brukclean_cookies";

function showCookies(){ if(cookieBar) cookieBar.style.display="block"; }
function hideCookies(){ if(cookieBar) cookieBar.style.display="none"; }
function saveConsent(mode){ try{ localStorage.setItem(COOKIE_KEY, mode); }catch(_){} hideCookies(); }

try{
  if(!localStorage.getItem(COOKIE_KEY)) showCookies();
}catch(_){}
acceptBtn?.addEventListener("click", ()=> saveConsent("all"));
rejectBtn?.addEventListener("click", ()=> saveConsent("necessary"));
manageBtn?.addEventListener("click", ()=> showCookies());

// ---- Footer year
$("#year").textContent = new Date().getFullYear();

// ---- Charts (Chart.js) – Service mix & Seasonality
if(window.Chart){
  Chart.defaults.color = "#a8e6ff";
  Chart.defaults.borderColor = "rgba(255,255,255,.06)";
  Chart.defaults.font.family = 'Inter, system-ui, Segoe UI, Roboto, Arial, sans-serif';

  const svcCtx = $("#svcMix");
  if(svcCtx){
    new Chart(svcCtx, {
      type: "doughnut",
      data: {
        labels: ["Kostka", "Elewacja", "Dach"],
        datasets: [{
          data: [50, 30, 20],
          backgroundColor: ["#0fd2ff","#6fdcff","#36bed9"],
          borderWidth: 0
        }]
      },
      options: {
        plugins:{ legend:{ display:true, labels:{ color:"#a8e6ff" } } },
        cutout: "60%",
        animation:{ duration: 800, easing: "easeOutQuart" }
      }
    });
  }

  const seaCtx = $("#seasonality");
  if(seaCtx){
    const ctx = seaCtx.getContext('2d');
    const g = ctx.createLinearGradient(0,0,0,200);
    g.addColorStop(0,'rgba(15,210,255,.55)');
    g.addColorStop(1,'rgba(15,210,255,.08)');
    new Chart(seaCtx, {
      type: "bar",
      data: {
        labels: ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"],
        datasets: [{
          label: "Szac. liczba zleceń",
          data: [2,2,4,8,12,14,14,13,9,6,3,2],
          backgroundColor: g,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        scales:{
          x:{ ticks:{ color:"#9ac0cf" }, grid:{ color:"rgba(255,255,255,.06)"} },
          y:{ ticks:{ color:"#9ac0cf" }, grid:{ color:"rgba(255,255,255,.06)"}, beginAtZero:true }
        },
        plugins:{ legend:{ labels:{ color:"#a8e6ff" } } },
        animation:{ duration: 900, easing: "easeOutQuart" }
      }
    });
  }
}

// ---- Tilt interaction (lekki efekt 3D)
$$(".tilt").forEach(card=>{
  card.addEventListener("mousemove",(e)=>{
    const r = card.getBoundingClientRect();
    const dx = (e.clientX - r.left)/r.width - .5;
    const dy = (e.clientY - r.top)/r.height - .5;
    card.style.transform = `perspective(800px) rotateX(${-dy*4}deg) rotateY(${dx*6}deg) translateY(-3px)`;
  }, {passive:true});
  card.addEventListener("mouseleave",()=>{ card.style.transform = ""; });
});

// ===================== End =====================


/* ====== Timeline: highlight on view ====== */
$$(".timeline .step").forEach((el,i)=>{
  el.style.setProperty('--delay', (i*60)+'ms');
});
const stepIO = new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add("in-view"); stepIO.unobserve(e.target); }
  });
},{threshold:.3});
$$(".timeline .step").forEach(s=> stepIO.observe(s));

/* ====== Leaflet: interaktywna mapa zasięgu ====== */
function ensureLeaflet(cb){
  if(window.L){ cb(); return; }
  const lk = document.createElement('link');
  lk.rel="stylesheet"; lk.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  const sc = document.createElement('script');
  sc.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; sc.defer=true;
  sc.onload=cb;
  document.head.appendChild(lk);
  document.head.appendChild(sc);
}
function initCoverage(){
  const box = $("#coverageMap");
  if(!box) return;
  const center = [51.759, 19.456]; // Łódź
  const map = L.map(box,{ zoomControl:true, scrollWheelZoom:false }).setView(center, 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'&copy; OpenStreetMap'
  }).addTo(map);

  const circle = L.circle(center,{ radius: 40000, color:'#0fd2ff', fillColor:'#0fd2ff', fillOpacity:.12, weight:1.2 }).addTo(map);
  const towns = [
    {p:[51.77,19.45], t:'Łódź (baza)'},
    {p:[51.85,19.41], t:'Zgierz'},
    {p:[51.66,19.35], t:'Pabianice'},
    {p:[51.82,19.20], t:'Aleksandrów Ł.'},
  ];
  towns.forEach(m=> L.marker(m.p).addTo(map).bindPopup(m.t));

  $("#rangeSelect")?.addEventListener("change", (e)=>{
    const r = Number(e.target.value||40000);
    circle.setRadius(r);
    map.fitBounds(circle.getBounds(), { padding:[20,20] });
  });

  // start in view
  map.fitBounds(circle.getBounds(), { padding:[20,20] });
}
const zasieg = $("#zasieg");
if(zasieg){
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(!e.isIntersecting) return;
      ensureLeaflet(initCoverage);
      io.disconnect();
    });
  },{threshold:.2});
  io.observe(zasieg);
}

/* ====== Mini-chat wyceny ====== */
(function(){
  const win = $("#chatWin");
  const form = $("#chatForm");
  const field = $("#chatField");
  if(!win || !form) return;

  let state = { svc:null, area:null, dirt:'medium', imp:false };
  const dirtWords = { lekkie:'light', light:'light', srednie:'medium', średnie:'medium', medium:'medium', silne:'heavy', heavy:'heavy' };
  const svcWords  = { kostka:'kostka', elewacja:'elewacja', dach:'dach' };

  function addBubble(txt, who='bot'){
    const b = document.createElement('div');
    b.className = 'bubble ' + who;
    b.innerHTML = txt;
    win.appendChild(b);
    win.scrollTop = win.scrollHeight;
  }

  function parse(msg){
    const m = msg.toLowerCase();
    // service
    for(const k in svcWords){ if(m.includes(k)) state.svc = svcWords[k]; }
    // area
    const num = m.match(/(\d{1,5})\s*(m2|m²|m)?/i);
    if(num) state.area = Math.max(1, Number(num[1]));
    // dirt
    for(const k in dirtWords){ if(m.includes(k)) state.dirt = dirtWords[k]; }
    // imp
    if(m.includes('impregn')) state.imp = true;
  }

  function step(){
    if(!state.svc){ addBubble("Podaj typ powierzchni: <b>kostka</b>, <b>elewacja</b> czy <b>dach</b>?"); return; }
    if(!state.area){ addBubble("Ile metrów kwadratowych? Np. <b>120 m²</b>."); return; }
    // mamy dane -> policz (wykorzystuje Twoją rateTable i fmt)
    const [lo,hi] = rateTable[state.svc][state.dirt||'medium'];
    const imp = state.imp ? rateTable[state.svc].imp : 0;
    const low  = Math.round(state.area*lo + state.area*imp);
    const high = Math.round(state.area*hi + state.area*imp);
    addBubble(`Szacunkowo: <b>${fmt(low)} – ${fmt(high)}</b> (zabrudzenie: ${state.dirt}${state.imp?', z impregnacją':''}).`);
    addBubble(`Chcesz wysłać dane do formularza wyceny poniżej? Kliknij <a href="#wycena">tutaj</a> i uzupełnij ostatnie pola. ✅`);
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const val = field.value.trim();
    if(!val) return;
    addBubble(val,'me');
    parse(val);
    field.value = '';
    setTimeout(step, 300);
  });
})();

// ---- Typing headline: jedno dynamiczne słowo
(function typingHeadline(){
  const el = document.getElementById('typingWord');
  if(!el) return;

  const words = ['Elewacje', 'Dachy', 'Kostka'];
  const speedType = 70;      // pisanie (ms)
  const speedDelete = 50;    // kasowanie (ms)
  const holdAfterType = 900; // pauza po dopisaniu
  const holdAfterDelete = 250;

  let i = 0, pos = 0, dir = 1; // 1=pisz, -1=kasuj

  function step(){
    const w = words[i];

    if(dir > 0){
      pos++;
      el.textContent = w.slice(0, pos);
      if(pos === w.length){ dir = -1; return setTimeout(step, holdAfterType); }
      return setTimeout(step, speedType);
    }else{
      pos--;
      el.textContent = w.slice(0, pos);
      if(pos === 0){ dir = 1; i = (i+1) % words.length; return setTimeout(step, holdAfterDelete); }
      return setTimeout(step, speedDelete);
    }
  }

  step();
})();


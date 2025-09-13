// ===================== BrukClean / main.js =====================
// Ten plik jest wspólny dla indexa i podstron. Każdy moduł sprawdza,
// czy odpowiednie elementy istnieją, więc możesz dołączać go wszędzie.
"use strict";

/* ------------------ Helpers ------------------ */
const $  = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

/* ------------------ Active menu on scroll ------------------ */
(function(){
  const sections  = $$("main section[id]");
  const menuLinks = $$("nav a[href^='#']");
  if (!sections.length || !menuLinks.length) return;

  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const id = e.target.id;
      menuLinks.forEach(a=>{
        const isActive = a.getAttribute("href") === "#"+id;
        a.classList.toggle("active", isActive);
        if(isActive) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
      });
    });
  },{ rootMargin:"-50% 0px -45% 0px" });

  sections.forEach(s=> io.observe(s));
})();

/* ------------------ Mobile menu toggle ------------------ */
(function(){
  const toggle = $("#menuToggle");
  const menu   = $("#menu");
  if(!toggle || !menu) return;

  const openMenu  = ()=>{ menu.style.display="block"; toggle.setAttribute("aria-expanded","true"); };
  const closeMenu = ()=>{ menu.style.display="none";  toggle.setAttribute("aria-expanded","false"); };

  toggle.addEventListener("click", ()=>{
    (menu.style.display === "block") ? closeMenu() : openMenu();
  });

  // Zamknij po kliknięciu poza oraz po kliknięciu w link (UX)
  document.addEventListener("click", (e)=>{
    if(menu.style.display !== "block") return;
    const inside = menu.contains(e.target) || toggle.contains(e.target);
    if(!inside) closeMenu();
    // jeśli klik w link nawigacji -> zamknij
    if(e.target.matches?.("nav a[href^='#']")) closeMenu();
  });

  document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") closeMenu(); });

  // Reset na desktopie – nie nadpisuj CSS
  window.addEventListener("resize", ()=>{
    if(innerWidth > 1024){
      menu.style.display = "";
      toggle.setAttribute("aria-expanded","false");
    }
  }, {passive:true});
})();

/* ------------------ Reveal on scroll (stagger) ------------------ */
(function(){
  const els = $$(".reveal");
  if(!els.length) return;

  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add("in-view"); io.unobserve(e.target); }
    });
  },{ threshold:0.2 });

  els.forEach((el,i)=>{ el.style.transitionDelay = (i*0.05)+"s"; io.observe(el); });
})();

/* ------------------ Before / After slider ------------------ */
(function(){
  const ba = $(".before-after"); if(!ba) return;
  const after  = ba.querySelector(".after");
  const slider = ba.querySelector(".slider");
  const handle = ba.querySelector(".handle");
  const range  = ba.querySelector(".range");
  if(!after || !slider || !handle || !range) return;

  const setPos = (p)=>{
    p = Math.max(0, Math.min(100, Number(p)));
    after.style.clipPath = `inset(0 0 0 ${p}%)`;
    slider.style.left = p + "%";
    handle.style.left = `calc(${p}% - 14px)`;
    range.value = String(p);
  };
  setPos(range.value ?? 50);

  const updateFromEvent = (e)=>{
    const rect = ba.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const p = ((clientX - rect.left)/rect.width)*100;
    setPos(p);
  };

  let dragging = false;
  ba.addEventListener("mousedown", e=>{ dragging=true; updateFromEvent(e); });
  ba.addEventListener("mouseup",   ()=> dragging=false);
  ba.addEventListener("mouseleave",()=> dragging=false);
  ba.addEventListener("mousemove", e=>{ if(dragging) updateFromEvent(e); }, {passive:true});
  ba.addEventListener("touchstart",e=> updateFromEvent(e), {passive:true});
  ba.addEventListener("touchmove", updateFromEvent, {passive:true});
  ba.addEventListener("touchend",  ()=> dragging=false, {passive:true});

  range.addEventListener("input",  e=> setPos(e.target.value));
  range.addEventListener("change", e=> setPos(e.target.value));
})();

/* ------------------ Portfolio: filter & lightbox ------------------ */
(function(){
  const filterBtns = $$(".filters button");
  const items      = $$(".portfolio .item");
  const lightbox   = $(".lightbox");
  const lightImg   = lightbox?.querySelector("img");
  if(!items.length) return;

  const isVisible = (el)=> el.style.display !== "none";
  const visibleItems = ()=> items.filter(isVisible);

  function applyFilter(f){
    items.forEach(it=>{
      const show = (f==="all" || it.dataset.cat===f);
      it.style.display = show ? "" : "none"; // "" wraca do display z CSS (grid)
    });
  }

  filterBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      filterBtns.forEach(b=>{ b.classList.remove("active"); b.setAttribute("aria-selected","false"); });
      btn.classList.add("active"); btn.setAttribute("aria-selected","true");
      applyFilter(btn.dataset.filter);
    });
  });

  let currentIndex = -1;
  function openLightboxByIndex(i){
    const vis = visibleItems();
    if(!vis.length) return;
    currentIndex = ((i%vis.length)+vis.length)%vis.length;
    const img = vis[currentIndex].querySelector("img");
    if(lightImg && img){
      lightImg.src = img.src;
      lightImg.alt = img.alt || "";
      lightbox?.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }
  function closeLightbox(){
    lightbox?.classList.remove("active");
    currentIndex = -1;
    document.body.style.overflow = "";
  }
  function next(step=1){ if(currentIndex>=0) openLightboxByIndex(currentIndex+step); }

  // Klik na obrazku – licz indeks względem aktualnie widocznych elementów
  items.forEach(it=>{
    const img = it.querySelector("img");
    if(!img) return;
    img.style.cursor = "zoom-in";
    img.setAttribute("tabindex","0");
    const open = ()=> openLightboxByIndex( visibleItems().indexOf(it) );
    img.addEventListener("click", open);
    img.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); open(); }});
  });

  lightbox?.addEventListener("click", (e)=>{ if(e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown",(e)=>{
    if(!lightbox || !lightbox.classList.contains("active")) return;
    if(e.key==="Escape") closeLightbox();
    if(e.key==="ArrowRight") next(1);
    if(e.key==="ArrowLeft")  next(-1);
  });
})();

/* ------------------ Quote calculator ------------------ */
(function(){
  const rateTable = {
    kostka:  { light:[10,14], medium:[14,18], heavy:[18,25], imp:15 },
    elewacja:{ light:[15,17], medium:[16,19], heavy:[18,22], imp:15 },
    dach:    { light:[18,21], medium:[20,24], heavy:[23,30], imp:15 }
  };
  const fmt = (v)=> v.toLocaleString("pl-PL",{style:"currency",currency:"PLN",maximumFractionDigits:0});

  const est = $("#estimate");
  const estBreak = $("#estBreak");
  const fields = ["service","area","dirt","imp","lift"].map(id=> $("#"+id)).filter(Boolean);
  if(!fields.length) return;

  function animateRange(low, high){
    if(!est) return;
    const steps = 18, dur = 700;
    let i=0;
    const timer = setInterval(()=>{
      const v = Math.round(low + (high-low)*(i/steps));
      est.textContent = `${fmt(v)} – ${fmt(high)}`;
      if(++i>steps) clearInterval(timer);
    }, dur/steps);
  }

  function recalc(){
    const svc  = $("#service")?.value;
    const area = Math.max(0, Number($("#area")?.value || 0));
    const dirt = $("#dirt")?.value;
    const imp  = $("#imp")?.checked;
    const lift = $("#lift")?.checked;

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
    const totalLow  = Math.round(baseLow  + impCost + liftFlat);
    const totalHigh = Math.round(baseHigh + impCost + liftFlat);

    animateRange(totalLow, totalHigh);
    if(estBreak){
      const dirtName = {light:"lekkie", medium:"średnie", heavy:"silne"}[dirt] || dirt;
      estBreak.innerHTML = `Usługa <b>${svc}</b> (${area} m², zabrudzenie: ${dirtName})${imp? ' + impregnacja':''}${lift? ' + podnośnik':''}.`;
    }
  }

  fields.forEach(el=> el.addEventListener("input", recalc, {passive:true}));
  recalc();
})();

/* ------------------ Forms (mock submit) ------------------ */
(function(){
  function btnLoading(btn, on){ if(btn){ btn.disabled = !!on; btn.dataset.loading = on ? "1" : ""; } }

  $("#quoteForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    btnLoading(btn, true);
    setTimeout(()=>{
      alert("Dziękujemy! Twoja prośba o wycenę została zapisana. Skontaktujemy się wkrótce.");
      e.target.reset();
      btnLoading(btn,false);
      // po resecie wywołaj przeliczenie jeśli jest na stronie
      const ev = new Event("input"); $("#area")?.dispatchEvent(ev);
    }, 600);
  });

  $("#contactForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    btnLoading(btn, true);
    setTimeout(()=>{
      $("#cformMsg")?.replaceChildren(document.createTextNode("Dziękujemy! Odpowiemy maksymalnie w 24h (dni robocze)."));
      e.target.reset(); btnLoading(btn,false);
    }, 600);
  });

  $("#subForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    btnLoading(btn, true);
    setTimeout(()=>{
      $("#subMsg")?.replaceChildren(document.createTextNode("Zapisano! Sprawdź e-mail (potwierdzenie)."));
      e.target.reset(); btnLoading(btn,false);
    }, 500);
  });
})();

/* ------------------ Google Map (lazy embed) ------------------ */
(function(){
  $("#loadMap")?.addEventListener("click", ()=>{
    const box = $("#mapBox"); if(!box) return;
    const iframe = document.createElement("iframe");
    iframe.title = "Mapa – BrukClean, Łódź";
    iframe.width = "100%"; iframe.height = "320"; iframe.loading = "lazy";
    iframe.style.border = "0"; iframe.referrerPolicy = "no-referrer-when-downgrade";
    // Podmień na swój embed
    iframe.src = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9762.86!2d19.455!3d51.759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spl!2spl!4v1680000000000";
    box.innerHTML = ""; box.appendChild(iframe);
  });
})();

/* ------------------ Cookies ------------------ */
(function(){
  const cookieBar  = $("#cookieBar");
  const manageBtn  = $("#manageCookies");
  const acceptBtn  = $("#cookiesAccept");
  const rejectBtn  = $("#cookiesReject");
  const KEY = "brukclean_cookies";

  function show(){ cookieBar && (cookieBar.style.display="block"); }
  function hide(){ cookieBar && (cookieBar.style.display="none"); }
  function save(mode){ try{ localStorage.setItem(KEY, mode); }catch{} hide(); }

  try{ if(!localStorage.getItem(KEY)) show(); }catch{}
  acceptBtn?.addEventListener("click", ()=> save("all"));
  rejectBtn?.addEventListener("click", ()=> save("necessary"));
  manageBtn?.addEventListener("click", show);
})();

/* ------------------ Footer year ------------------ */
(function(){ const y=$("#year"); if(y) y.textContent = new Date().getFullYear(); })();

/* ------------------ Charts (Chart.js) ------------------ */
(function(){
  if(!window.Chart) return;

  Chart.defaults.color = "#a8e6ff";
  Chart.defaults.borderColor = "rgba(255,255,255,.06)";
  Chart.defaults.font.family = 'Inter, system-ui, Segoe UI, Roboto, Arial, sans-serif';

  const svcCtx = $("#svcMix");
  if(svcCtx){
    new Chart(svcCtx, {
      type: "doughnut",
      data: {
        labels: ["Kostka", "Elewacja", "Dach"],
        datasets: [{ data:[50,30,20], backgroundColor:["#0fd2ff","#6fdcff","#36bed9"], borderWidth:0 }]
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
        datasets: [{ label:"Szac. liczba zleceń", data:[2,2,4,8,12,14,14,13,9,6,3,2], backgroundColor:g, borderRadius:6, borderSkipped:false }]
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
})();

/* ------------------ Tilt interaction (3D) ------------------ */
(function(){
  const cards = $$(".tilt");
  if(!cards.length) return;

  cards.forEach(card=>{
    let raf = 0;
    function onMove(e){
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        const r = card.getBoundingClientRect();
        const dx = (e.clientX - r.left)/r.width - .5;
        const dy = (e.clientY - r.top)/r.height - .5;
        card.style.transform = `perspective(800px) rotateX(${-dy*4}deg) rotateY(${dx*6}deg) translateY(-3px)`;
      });
    }
    card.addEventListener("mousemove", onMove, {passive:true});
    card.addEventListener("mouseleave", ()=>{ card.style.transform=""; cancelAnimationFrame(raf); });
  });
})();

/* ------------------ Timeline highlight ------------------ */
(function(){
  const steps = $$(".timeline .step");
  if(!steps.length) return;
  steps.forEach((el,i)=> el.style.setProperty('--delay', (i*60)+'ms'));
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in-view"); io.unobserve(e.target); }});
  },{threshold:.3});
  steps.forEach(s=> io.observe(s));
})();

/* ------------------ Leaflet: interaktywna mapa zasięgu ------------------ */
(function(){
  const box = $("#coverageMap");
  const wrap = $("#zasieg");
  if(!wrap || !box) return;

  function ensureLeaflet(cb){
    if(window.L){ cb(); return; }
    const lk = document.createElement('link');
    lk.rel="stylesheet"; lk.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    const sc = document.createElement('script');
    sc.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; sc.defer=true;
    sc.onload=cb;
    document.head.append(lk, sc);
  }

  function initCoverage(){
    const center = [51.759, 19.456]; // Łódź
    const map = L.map(box,{ zoomControl:true, scrollWheelZoom:false }).setView(center, 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'&copy; OpenStreetMap' }).addTo(map);

    const circle = L.circle(center,{ radius: 40000, color:'#0fd2ff', fillColor:'#0fd2ff', fillOpacity:.12, weight:1.2 }).addTo(map);
    [
      {p:[51.77,19.45], t:'Łódź (baza)'},
      {p:[51.85,19.41], t:'Zgierz'},
      {p:[51.66,19.35], t:'Pabianice'},
      {p:[51.82,19.20], t:'Aleksandrów Ł.'},
    ].forEach(m=> L.marker(m.p).addTo(map).bindPopup(m.t));

    $("#rangeSelect")?.addEventListener("change", (e)=>{
      const r = Number(e.target.value||40000);
      circle.setRadius(r);
      map.fitBounds(circle.getBounds(), { padding:[20,20] });
    });

    map.fitBounds(circle.getBounds(), { padding:[20,20] });
  }

  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ ensureLeaflet(initCoverage); io.disconnect(); } });
  },{threshold:.2});
  io.observe(wrap);
})();

/* ------------------ Mini-chat wyceny ------------------ */
(function(){
  const win = $("#chatWin");
  const form = $("#chatForm");
  const field = $("#chatField");
  if(!win || !form || !field) return;

  const state = { svc:null, area:null, dirt:'medium', imp:false };
  const dirtWords = { lekkie:'light', light:'light', srednie:'medium', "średnie":'medium', medium:'medium', silne:'heavy', heavy:'heavy' };
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
    Object.keys(svcWords).forEach(k=>{ if(m.includes(k)) state.svc = svcWords[k]; });
    const num = m.match(/(\d{1,5})\s*(m2|m²|m)?/i);
    if(num) state.area = Math.max(1, Number(num[1]));
    Object.keys(dirtWords).forEach(k=>{ if(m.includes(k)) state.dirt = dirtWords[k]; });
    if(m.includes('impregn')) state.imp = true;
  }

  function step(){
    if(!state.svc){ addBubble("Podaj typ powierzchni: <b>kostka</b>, <b>elewacja</b> czy <b>dach</b>?"); return; }
    if(!state.area){ addBubble("Ile metrów kwadratowych? Np. <b>120 m²</b>."); return; }
    const rate = { kostka:{light:[10,14],medium:[14,18],heavy:[18,25],imp:15}, elewacja:{light:[15,17],medium:[16,19],heavy:[18,22],imp:15}, dach:{light:[18,21],medium:[20,24],heavy:[23,30],imp:15} };
    const fmt = (v)=> v.toLocaleString("pl-PL",{style:"currency",currency:"PLN",maximumFractionDigits:0});
    const [lo,hi] = rate[state.svc][state.dirt||'medium'];
    const imp = state.imp ? rate[state.svc].imp : 0;
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

/* ------------------ Typing headline: jedno dynamiczne słowo ------------------ */
(function(){
  const el = $("#typingWord"); if(!el) return;
  const words = ['Elewacje','Dachy','Kostka'];
  const speedType=70, speedDelete=50, holdType=900, holdDelete=250;
  let i=0, pos=0, dir=1;
  (function tick(){
    const w = words[i];
    if(dir>0){
      pos++; el.textContent = w.slice(0,pos);
      setTimeout(tick, pos===w.length ? (dir=-1, holdType) : speedType);
    }else{
      pos--; el.textContent = w.slice(0,pos);
      setTimeout(tick, pos===0 ? (dir=1, i=(i+1)%words.length, holdDelete) : speedDelete);
    }
  })();
})();

// ===================== End =====================

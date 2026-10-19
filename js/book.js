/* Brochure viewer: StPageFlip (HTML mode) with prev/next buttons, keyboard and a static fallback.
   cfg = {dir:"img/book/<slug>/", n:24, w:1200, h:1697, sample:"20 of 97 pages" (optional label)}  -> files 00.jpg … (n-1).jpg, first = front cover, last = back cover */
import {PageFlip} from "../vendor/page-flip/page-flip.module.js";

var AHEAD = 6;

export function mount(hero, cfg, opt){
  opt = opt || {};
  var n = cfg.n, last = n - 1, ar = cfg.w / cfg.h, title = opt.title || "Brochure";
  function src(i){ return cfg.dir + String(i).padStart(2,"0") + ".jpg"; }

  hero.classList.add("p-hero--book");
  hero.innerHTML =
      '<div class="book-view" tabindex="0" role="region" aria-roledescription="page-turning brochure"'
    +   ' aria-label="' + esc(title) + ': use the arrow keys or the buttons to turn pages">'
    +   '<div class="book-frame" style="--ar:' + ar + '">'
    +     '<div class="book-shadow"></div><div class="book"></div><div class="book-spine"></div>'
    +   '</div>'
    +   (cfg.sample ? '<span class="book-sample">Sample · ' + esc(cfg.sample) + '</span>' : '')
    +   '<div class="book-ui">'
    +     '<button type="button" class="book-prev">← Prev page</button>'
    +     '<span class="book-count" aria-live="polite"></span>'
    +     '<button type="button" class="book-next">Next page →</button>'
    +   '</div>'
    + '</div>';

  var view = hero.querySelector(".book-view"), frame = hero.querySelector(".book-frame"),
      book = hero.querySelector(".book"), count = hero.querySelector(".book-count"),
      prev = hero.querySelector(".book-prev"), next = hero.querySelector(".book-next");

  /* ---- shared UI ---- */
  var loaded = 0, imgs = [];
  function preload(upTo){
    for(; loaded <= Math.min(upTo, last); loaded++) imgs[loaded].src = src(loaded);
  }
  function update(i, portrait){
    preload(i + AHEAD);
    var alone = portrait || i === 0 || (i === last && n % 2 === 0);
    frame.classList.toggle("is-front", !portrait && i === 0);
    frame.classList.toggle("is-back", !portrait && i === last && n % 2 === 0);
    frame.classList.toggle("is-single", !!portrait);
    count.textContent = i === 0 ? "Cover" : (i === last && alone) ? "Back cover"
      : alone ? "Page " + (i + 1) + " of " + n
      : "Pages " + (i + 1) + "–" + (i + 2) + " of " + n;
    prev.disabled = i === 0;
    next.disabled = alone ? i === last : i + 1 >= last;
  }
  var engine = opt.reduce ? staticEngine() : flipEngine();
  prev.addEventListener("click", function(){ engine.prev(); });
  next.addEventListener("click", function(){ engine.next(); });
  view.addEventListener("keydown", function(e){
    if(e.key === "ArrowRight" || e.key === "PageDown"){ engine.next(); e.preventDefault(); }
    else if(e.key === "ArrowLeft" || e.key === "PageUp"){ engine.prev(); e.preventDefault(); }
    else if(e.key === "Home"){ engine.go(0); e.preventDefault(); }
    else if(e.key === "End"){ engine.go(last); e.preventDefault(); }
  });

  /* ---- StPageFlip ---- */
  function flipEngine(){
    var pages = [];
    for(var i = 0; i < n; i++){
      var d = document.createElement("div"), im = new Image();
      d.className = "book-page";
      if(i < 2 || i > last - 2) d.dataset.density = "hard";
      im.alt = ""; im.decoding = "async"; im.width = cfg.w; im.height = cfg.h;
      d.appendChild(im); pages.push(d); imgs.push(im);
    }
    preload(AHEAD);
    var pf = new PageFlip(book, {
      width: cfg.w, height: cfg.h, size: "stretch",
      minWidth: 290, maxWidth: cfg.w, minHeight: 200, maxHeight: cfg.h,
      showCover: true, usePortrait: true, autoSize: true,
      flippingTime: 900, maxShadowOpacity: 0.45, drawShadow: true,
      mobileScrollSupport: true, swipeDistance: 30, startZIndex: 1
    });
    pf.loadFromHTML(pages);
    function portrait(){ return pf.getOrientation() === "portrait"; }
    pf.on("flip", function(e){ update(e.data, portrait()); });
    pf.on("changeOrientation", function(){ update(pf.getCurrentPageIndex(), portrait()); });
    pf.on("changeState", function(e){ frame.classList.toggle("is-moving", e.data !== "read"); });
    update(0, portrait());
    return {
      prev: function(){ pf.flipPrev(); },
      next: function(){ pf.flipNext(); },
      go: function(i){ pf.turnToPage(i); update(pf.getCurrentPageIndex(), portrait()); },
      destroy: function(){ pf.destroy(); }
    };
  }

  /* ---- reduced motion: same controls, pages change without animation ---- */
  function staticEngine(){
    var a = new Image(), b = new Image(), cur = 0, mq = window.matchMedia("(max-width:640px)");
    book.classList.add("book--static");
    [a, b].forEach(function(im){ im.alt = ""; im.width = cfg.w; im.height = cfg.h; book.appendChild(im); });
    for(var i = 0; i < n; i++) imgs.push({});
    function show(i){
      var single = mq.matches;
      cur = Math.max(0, Math.min(last, single || i === 0 ? i : i - (i + 1) % 2));
      preload(cur + AHEAD);
      if(single){ a.src = src(cur); a.hidden = false; b.hidden = true; }
      else if(cur === 0){ a.hidden = true; b.hidden = false; b.src = src(0); }
      else if(cur === last && n % 2 === 0){ a.hidden = false; a.src = src(last); b.hidden = true; }
      else { a.hidden = false; b.hidden = false; a.src = src(cur); b.src = src(cur + 1); }
      update(cur, single);
    }
    var step = function(d){ return mq.matches || cur === 0 && d > 0 || cur === 1 && d < 0 ? d : 2 * d; };
    mq.addEventListener("change", function(){ show(cur); });
    show(0);
    return {
      prev: function(){ show(cur + step(-1)); },
      next: function(){ show(cur + step(1)); },
      go: show,
      destroy: function(){}
    };
  }

  return { destroy: function(){ engine.destroy(); } };
}

function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }

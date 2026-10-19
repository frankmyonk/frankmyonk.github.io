/* CD jewel case in CSS 3D: front, back, open box, disc. Drag, slider, buttons and arrow keys.
   cfg = {front:"circle-hero", inner:"circle-1", rear:"circle-3"} -> img/<name>.jpg (mockup photos, cropped in viewers.css) */

var LABELS = {front:"Front cover", back:"Back of the case", open:"Open case with disc", disc:"Disc"};
var VIEWS = Object.keys(LABELS);

export function mount(hero, cfg, opt){
  opt = opt || {};
  /* absolute URL: a relative url() inside a custom property would resolve against css/ */
  function url(n){ return "url('" + new URL("img/" + n + ".jpg", document.baseURI).href + "')"; }
  hero.classList.add("p-hero--cd");
  hero.innerHTML =
      '<div class="cd-view" data-view="front" style="--hero:' + url(cfg.front) + ';--inner:' + url(cfg.inner) + ';--rear:' + url(cfg.rear) + '">'
    +  '<div class="cd-stage" tabindex="0" role="img" aria-label="' + esc(opt.title || "CD") + ': rotating model of the CD case. Drag or use the arrow keys to turn it.">'
    +   '<div class="shadow"></div>'
    +   '<div class="origin"><div class="assembly">'
    +    '<div class="base">'
    +     '<div class="rear"><div class="rear-art"></div><div class="glass"></div></div>'
    +     '<div class="tray"><div class="tray-art"></div><div class="rib"></div><div class="tray-ring"></div><div class="hub"></div><div class="glass"></div></div>'
    +     '<div class="wall edge-top"></div><div class="wall edge-bottom"></div><div class="wall edge-left"></div><div class="wall edge-right"></div>'
    +     '<div class="spine-front"></div><div class="spine-wall edge-top"></div><div class="spine-wall edge-bottom"></div><div class="spine-wall edge-left"></div><div class="spine-wall edge-right"></div>'
    +    '</div>'
    +    '<div class="disc"><div class="disc-face disc-print"></div><div class="disc-face disc-silver"></div></div>'
    +    '<div class="lid"><div class="lid-front"><div class="front-art"></div><div class="glass"></div></div><div class="lid-inside"><div class="inside-art"></div><div class="glass"></div></div>'
    +     '<div class="lid-wall edge-top"></div><div class="lid-wall edge-bottom"></div><div class="lid-wall edge-left"></div><div class="lid-wall edge-right"></div></div>'
    +   '</div></div>'
    +  '</div>'
    +  '<div class="cd-ui" role="group" aria-label="View">'
    +   VIEWS.map(function(v){ return '<button type="button" data-view="' + v + '" aria-pressed="' + (v === "front") + '">' + {front:"Front", back:"Back", open:"Open", disc:"Disc"}[v] + '</button>'; }).join("")
    +  '</div>'
    +  '<div class="cd-rot"><label for="cd-rotation">Rotation</label><input id="cd-rotation" type="range" min="-180" max="180" step="1" value="-16"><output>−16°</output></div>'
    +  '<p class="cd-status" aria-live="polite"></p>'
    + '</div>';

  var root = hero.querySelector(".cd-view"), stage = root.querySelector(".cd-stage"),
      slider = root.querySelector("input"), output = root.querySelector("output"), status = root.querySelector(".cd-status");
  var view = "front", yaw = -16, tilt = 10, drag = null;

  function size(){
    var max = view === "open" ? 660 : 380;
    var s = Math.min(view === "open" ? 1.5 : 1.6, (stage.clientWidth - 24) / max, (stage.clientHeight - 40) / 330);
    root.style.setProperty("--scale", Math.max(.35, s));
    root.style.setProperty("--center", view === "open" ? "139px" : "0px");
  }
  function draw(){
    root.dataset.view = view;
    root.style.setProperty("--yaw", yaw + "deg");
    root.style.setProperty("--tilt", tilt + "deg");
    root.style.setProperty("--opening", view === "open" ? "-168deg" : "0deg");
    slider.value = yaw; output.textContent = String(Math.round(yaw)).replace("-", "−") + "°";
    root.querySelectorAll(".cd-ui button").forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.view === view)); });
    status.textContent = view === "disc" && Math.abs(yaw) > 90 ? "Underside of the disc" : LABELS[view];
    size();
  }
  root.querySelector(".cd-ui").addEventListener("click", function(e){
    var b = e.target.closest("button[data-view]"); if(!b) return;
    view = b.dataset.view;
    yaw = view === "back" ? 164 : view === "open" ? 0 : view === "disc" ? -10 : -16;
    tilt = view === "open" ? 6 : 10;
    draw();
  });
  slider.addEventListener("input", function(){ yaw = Number(slider.value); draw(); });
  stage.addEventListener("keydown", function(e){
    var d = {ArrowLeft:[-10,0], ArrowRight:[10,0], ArrowUp:[0,5], ArrowDown:[0,-5]}[e.key];
    if(!d) return;
    e.preventDefault(); e.stopPropagation();
    yaw = clamp(yaw + d[0], -180, 180); tilt = clamp(tilt + d[1], -35, 35); draw();
  });
  stage.addEventListener("pointerdown", function(e){
    if(e.button !== 0) return;
    drag = {x:e.clientX, y:e.clientY, yaw:yaw, tilt:tilt};
    stage.setPointerCapture(e.pointerId); stage.classList.add("dragging");
  });
  stage.addEventListener("pointermove", function(e){
    if(!drag) return;
    yaw = clamp(drag.yaw + (e.clientX - drag.x) * .55, -180, 180);
    tilt = clamp(drag.tilt - (e.clientY - drag.y) * .25, -35, 35);
    draw();
  });
  function end(){ if(!drag) return; drag = null; stage.classList.remove("dragging"); }
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  var ro = new ResizeObserver(size); ro.observe(stage);
  draw();

  return { destroy: function(){ ro.disconnect(); } };
}

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }

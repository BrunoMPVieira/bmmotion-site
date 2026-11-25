/* BMMotion — interactions */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Page loaded → hero title animation */
  requestAnimationFrame(function () {
    setTimeout(function () { doc.classList.add("is-loaded"); }, 60);
  });

  /* Header state + floating WhatsApp */
  var header = document.querySelector(".header");
  var wa = document.querySelector(".wa-float");
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 24);
    if (wa) wa.classList.toggle("is-visible", y > window.innerHeight * 0.6);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.querySelector(".mobile-menu");
  function setMenu(open) {
    doc.classList.toggle("menu-open", open);
    document.body.classList.toggle("menu-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    }
    if (menu) menu.setAttribute("aria-hidden", String(!open));
  }
  if (toggle) toggle.addEventListener("click", function () { setMenu(!doc.classList.contains("menu-open")); });
  if (menu) menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1024) setMenu(false); });

  /* Reveal on scroll */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Active nav link */
  var navLinks = document.querySelectorAll('.nav a[href^="#"]');
  if (navLinks.length && "IntersectionObserver" in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
          var link = map[en.target.id];
          if (link) link.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* Live timecode in viewfinder */
  var tc = document.querySelector("[data-timecode]");
  if (tc && !reduce) {
    var start = performance.now() - 12000;
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    (function tick(now) {
      var ms = now - start;
      var f = Math.floor((ms % 1000) / (1000 / 24));
      var s = Math.floor(ms / 1000);
      tc.textContent = pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60) + ":" + pad(f);
      requestAnimationFrame(tick);
    })(performance.now());
  }

  /* Count-up numbers */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !reduce) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = parseFloat(el.getAttribute("data-count")), t0 = null;
        var prefix = el.getAttribute("data-prefix") || "", suffix = el.getAttribute("data-suffix") || "";
        (function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(end * e) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* Modal: YouTube + image lightbox */
  var modal = document.getElementById("modal");
  var frame = modal && modal.querySelector(".modal__frame");
  var lastFocus = null;
  function openModal(html, vertical, isImage) {
    if (!modal) return;
    lastFocus = document.activeElement;
    frame.innerHTML = html;
    modal.classList.toggle("modal--vertical", !!vertical);
    frame.style.aspectRatio = isImage ? "auto" : "";
    frame.style.background = isImage ? "transparent" : "";
    frame.style.boxShadow = isImage ? "none" : "";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var close = modal.querySelector(".modal__close");
    if (close) close.focus();
  }
  function closeModal() {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(function () { frame.innerHTML = ""; }, 350);
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("click", function (e) {
    var v = e.target.closest("[data-video]");
    if (v) {
      e.preventDefault();
      var id = v.getAttribute("data-video");
      var title = v.getAttribute("data-title") || "Vídeo";
      openModal('<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + title.replace(/"/g, "&quot;") + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>', v.hasAttribute("data-vertical"));
      return;
    }
    var tr = e.target.closest("[data-trailer]");
    if (tr) {
      e.preventDefault();
      openModal('<video class="modal__video" src="' + tr.getAttribute("data-trailer") + '" poster="' + (tr.getAttribute("data-poster") || "") + '" controls autoplay playsinline></video>', tr.hasAttribute("data-vertical"));
      return;
    }
    var img = e.target.closest("[data-lightbox]");
    if (img) {
      e.preventDefault();
      openModal('<img class="modal__img" src="' + img.getAttribute("data-lightbox") + '" alt="' + (img.getAttribute("data-alt") || "") + '">', false, true);
      return;
    }
    if (modal && modal.classList.contains("is-open") && (e.target === modal || e.target.closest(".modal__close"))) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("figure[data-trailer]")) { e.preventDefault(); e.target.click(); return; }
    if (e.key === "Escape") { closeModal(); setMenu(false); }
  });

  /* Inline lite YouTube (inner pages) */
  document.querySelectorAll("[data-inline-video]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-inline-video");
      var wrap = btn.parentElement;
      wrap.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + (btn.getAttribute("data-title") || "Vídeo") + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
    });
  });

  /* Year */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

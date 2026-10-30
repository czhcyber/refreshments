/* ============================================================================
   Refreshments — app.js
   ----------------------------------------------------------------------------
   Drives the light, Apple-style interactions:
     1. Mobile navigation toggle
     2. Scroll fade-in (IntersectionObserver, respects reduced motion)
     3. Product detail dialog (native <dialog>)
   Plain JavaScript, no libraries.
   ============================================================================ */

(function () {
  "use strict";

  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) { gsap.registerPlugin(ScrollTrigger); }

  /* --------------------------------------------------------------------------
     Product details (text + photo path; the artwork is in assets/img/products)
     -------------------------------------------------------------------------- */
  var PRODUCTS = {
    "coke": {
      name: "Coca-Cola", zh: "可口可乐",
      img: "assets/img/products/coke.jpg",
      tagline: "The original spark.",
      desc: "The classic cola that started it all — a crisp, refreshing taste with just the right amount of fizz.",
      category: "Cola · Carbonated",
      meter: [ { label: "Sweetness", value: 5 }, { label: "Caffeine", value: 3 }, { label: "Fizz", value: 5 } ],
      facts: ["Since 1886", "Classic cola", "Best served chilled"]
    },
    "sprite": {
      name: "Sprite", zh: "雪碧",
      img: "assets/img/products/sprite.jpg",
      tagline: "Crisp lemon-lime clarity.",
      desc: "A clean, caffeine-free lemon-lime soda with a sharp, refreshing finish.",
      category: "Lemon-lime · Carbonated",
      meter: [ { label: "Sweetness", value: 4 }, { label: "Caffeine", value: 0 }, { label: "Fizz", value: 5 } ],
      facts: ["Caffeine-free", "Since 1961", "Sharp, clean finish"]
    },
    "fanta": {
      name: "Fanta Orange", zh: "芬达橙味",
      img: "assets/img/products/fanta.jpg",
      tagline: "Bright, juicy orange.",
      desc: "A fruity, bubbly orange soda packed with bright citrus flavour.",
      category: "Orange · Fruity",
      meter: [ { label: "Sweetness", value: 5 }, { label: "Caffeine", value: 0 }, { label: "Fizz", value: 4 } ],
      facts: ["Since 1940", "Fruity & bubbly", "Citrus flavour"]
    },
    "minute-maid": {
      name: "Minute Maid Orange Juice", zh: "美汁源果粒橙",
      img: "assets/img/products/minute-maid.jpg",
      tagline: "Real orange, real pulp.",
      desc: "A rich orange juice made with real fruit and juicy pulp for a fuller, more natural taste.",
      category: "Orange juice · With pulp",
      meter: [ { label: "Sweetness", value: 4 }, { label: "Caffeine", value: 0 }, { label: "Fizz", value: 0 } ],
      facts: ["Contains pulp", "Real fruit", "Not carbonated"]
    },
    "cherry": {
      name: "Coca-Cola Cherry", zh: "樱桃味可口可乐",
      img: "assets/img/products/cherry.jpg",
      tagline: "Cola with a cherry twist.",
      desc: "The familiar Coca-Cola taste lifted by a smooth, sweet cherry finish.",
      category: "Cola · Cherry",
      meter: [ { label: "Sweetness", value: 5 }, { label: "Caffeine", value: 3 }, { label: "Fizz", value: 5 } ],
      facts: ["Cherry flavour", "Since 1985", "Smooth finish"]
    }
  };

  // Render the flavour meters into any container (dialog + quiz result).
  function fillMeters(container, product) {
    if (!container) return;
    container.innerHTML = "";
    (product.meter || []).forEach(function (m) {
      var row = document.createElement("div");
      row.className = "meter";
      var label = document.createElement("span");
      label.className = "meter-label";
      label.textContent = m.label;
      var track = document.createElement("span");
      track.className = "meter-track";
      var fill = document.createElement("span");
      fill.className = "meter-fill";
      track.appendChild(fill);
      row.appendChild(label);
      row.appendChild(track);
      container.appendChild(row);
      requestAnimationFrame(function () {
        fill.style.width = (m.value / 5 * 100) + "%";
      });
    });
  }

  /* --------------------------------------------------------------------------
     1. Mobile navigation
     -------------------------------------------------------------------------- */
  function initNav() {
    var toggle = document.getElementById("menu-toggle");
    var overlay = document.getElementById("menu-overlay");
    var closeBtn = document.getElementById("menu-close");
    if (!toggle || !overlay) return;

    function setOpen(open) {
      overlay.classList.toggle("is-open", open);
      overlay.setAttribute("aria-hidden", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    }

    toggle.addEventListener("click", function () {
      setOpen(!overlay.classList.contains("is-open"));
    });
    if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) setOpen(false);
    });
  }

  /* --------------------------------------------------------------------------
     2. Scroll fade-in
     -------------------------------------------------------------------------- */
  function initFade() {
    var els = document.querySelectorAll(".fade");
    if (!els.length) return;

    var reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* --------------------------------------------------------------------------
     3. Product detail dialog
     -------------------------------------------------------------------------- */
  function initDialog() {
    var dialog = document.getElementById("product-dialog");
    if (!dialog) return;

    var dlgVisual = document.getElementById("dlg-visual");
    var dlgName = document.getElementById("dlg-name");
    var dlgTagline = document.getElementById("dlg-tagline");
    var dlgDesc = document.getElementById("dlg-desc");
    var dlgMeters = document.getElementById("dlg-meters");
    var dlgFacts = document.getElementById("dlg-facts");
    var closeBtn = document.getElementById("dlg-close");

    function open(card) {
      var id = card.getAttribute("data-product");
      var p = PRODUCTS[id];
      if (!p) return;

      // Artwork: use the product photo.
      dlgVisual.innerHTML = p.img
        ? "<img class='p-img' src='" + p.img + "' alt='" + p.name + "'>"
        : "";

      dlgName.textContent = p.name;
      if (p.zh) {
        var zh = document.createElement("span");
        zh.className = "dlg-zh";
        zh.textContent = " " + p.zh;
        dlgName.appendChild(zh);
      }
      dlgTagline.textContent = p.tagline;
      dlgDesc.textContent = p.desc;

      // Flavour meters (animated from 0 to their value).
      fillMeters(dlgMeters, p);

      dlgFacts.innerHTML = "";
      [p.category].concat(p.facts).forEach(function (f) {
        var li = document.createElement("li");
        li.textContent = f;
        dlgFacts.appendChild(li);
      });

      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");

      if (hasGsap) {
        var panel = dialog.querySelector(".dlg-inner");
        if (panel) {
          gsap.fromTo(panel, { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out", overwrite: true });
        }
      }
    }

    function close() {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }

    document.querySelectorAll(".card[data-product]").forEach(function (card) {
      card.addEventListener("click", function () { open(card); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(card);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);

    // Close when clicking the backdrop (the <dialog> element itself).
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) close();
    });
  }

  /* --------------------------------------------------------------------------
     4. "Find your drink" quiz
     -------------------------------------------------------------------------- */
  var FLOW = {
    start: {
      text: "Fizzy or still?",
      options: [
        { label: "Fizzy", next: "fizzy" },
        { label: "Still", result: "minute-maid" }
      ]
    },
    fizzy: {
      text: "Which flavour family?",
      options: [
        { label: "Cola", next: "cola" },
        { label: "Citrus", result: "sprite" },
        { label: "Fruity", result: "fanta" }
      ]
    },
    cola: {
      text: "How do you like it?",
      options: [
        { label: "The classic", result: "coke" },
        { label: "A cherry twist", result: "cherry" }
      ]
    }
  };

  function initQuiz() {
    var quiz = document.getElementById("quiz");
    if (!quiz) return;
    var progressEl = document.getElementById("quiz-progress");
    var questionEl = document.getElementById("quiz-question");
    var optionsEl = document.getElementById("quiz-options");
    var resultEl = document.getElementById("quiz-result");
    var barFill = document.getElementById("quiz-bar-fill");
    var backBtn = document.getElementById("quiz-back");
    var hintEl = document.getElementById("quiz-hint");

    var TOTAL = 3;
    var history = ["start"];

    function setProgress() {
      if (barFill) {
        barFill.style.width = Math.min(100, Math.round((history.length / TOTAL) * 100)) + "%";
      }
      progressEl.textContent = "Question " + history.length;
      if (backBtn) backBtn.hidden = history.length <= 1;
    }

    function renderStep(key) {
      var node = FLOW[key];
      if (!node) return;
      resultEl.hidden = true;
      optionsEl.hidden = false;
      questionEl.hidden = false;
      if (hintEl) hintEl.hidden = false;
      questionEl.textContent = node.text;
      optionsEl.innerHTML = "";
      setProgress();

      node.options.forEach(function (opt) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "quiz-option";
        b.textContent = opt.label;
        b.addEventListener("click", function () {
          if (opt.result) {
            renderResult(opt.result);
          } else {
            history.push(opt.next);
            renderStep(opt.next);
          }
        });
        optionsEl.appendChild(b);
      });

      if (hasGsap) {
        var parts = [questionEl].concat(Array.prototype.slice.call(optionsEl.children));
        gsap.fromTo(parts,
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out", overwrite: true }
        );
      }
    }

    function goBack() {
      if (history.length <= 1) return;
      history.pop();
      renderStep(history[history.length - 1]);
    }

    function renderResult(id) {
      var p = PRODUCTS[id];
      if (!p) return;
      questionEl.hidden = true;
      optionsEl.hidden = true;
      if (hintEl) hintEl.hidden = true;
      if (backBtn) backBtn.hidden = true;
      if (barFill) barFill.style.width = "100%";
      progressEl.textContent = "Your match";
      resultEl.hidden = false;
      resultEl.innerHTML =
        "<div class='quiz-result-visual'>" +
          "<img class='p-img' src='" + p.img + "' alt='" + p.name + "'>" +
        "</div>" +
        "<p class='quiz-result-name'>" + p.name + (p.zh ? " <span class='card-zh'>" + p.zh + "</span>" : "") + "</p>" +
        "<p class='quiz-result-tag'>" + p.tagline + "</p>" +
        "<div class='dlg-meters' data-quiz-meters></div>" +
        "<div class='quiz-actions'>" +
          "<button class='btn btn-ghost' type='button' data-restart>Start over</button>" +
          "<a class='btn btn-primary' href='products.html'>Browse all drinks</a>" +
        "</div>";

      fillMeters(resultEl.querySelector("[data-quiz-meters]"), p);

      // Replay the entrance animation each time a result is shown.
      resultEl.classList.remove("is-in");
      void resultEl.offsetWidth;
      resultEl.classList.add("is-in");

      if (hasGsap) {
        var rv = resultEl.querySelector(".quiz-result-visual");
        if (rv) gsap.fromTo(rv, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" });
      }

      resultEl.querySelector("[data-restart]").addEventListener("click", function () {
        history = ["start"];
        renderStep("start");
      });
    }

    if (backBtn) backBtn.addEventListener("click", goBack);

    renderStep("start");
  }

  /* --------------------------------------------------------------------------
     5. Brand reveal + card flavour quick-look
     -------------------------------------------------------------------------- */
  function initReveal() {
    var el = document.querySelector(".manifesto");
    if (!el) return;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !hasGsap) {
      el.classList.add("is-in");
      return;
    }
    ScrollTrigger.create({
      trigger: el,
      start: "top 75%",
      once: true,
      onEnter: function () { el.classList.add("is-in"); }
    });
  }

  function initCardMeters() {
    document.querySelectorAll(".card[data-product]").forEach(function (card) {
      var p = PRODUCTS[card.getAttribute("data-product")];
      var visual = card.querySelector(".card-visual");
      if (!p || !visual) return;
      var box = document.createElement("div");
      box.className = "card-meters";
      visual.appendChild(box);
      fillMeters(box, p);
    });
  }

  /* --------------------------------------------------------------------------
     6. Cinematic hero — scroll push-in
     -------------------------------------------------------------------------- */
  function initHeroScroll() {
    var hero = document.querySelector(".hero-dark");
    if (!hero) return;
    var big = hero.querySelector(".hero-big");
    var tile = hero.querySelector(".hero-tile");
    if (!big || !tile) return;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !hasGsap) return;

    var st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
    gsap.to(big, {
      y: function () { return -window.innerHeight * 0.1; },
      opacity: 0,
      ease: "none",
      scrollTrigger: st
    });
    gsap.to(tile, {
      scale: 1.1,
      y: function () { return -window.innerHeight * 0.02; },
      ease: "none",
      scrollTrigger: st
    });
  }

  /* --------------------------------------------------------------------------
     7. Scroll-driven lineup
     -------------------------------------------------------------------------- */
  function initLineup() {
    var section = document.getElementById("lineup");
    if (!section) return;
    var track = document.getElementById("lineup-track");
    if (!track) return;
    var names = track.querySelectorAll(".lineup-name");
    if (!names.length) return;

    names.forEach(function (h) {
      if (h.querySelector(".ln-real")) return;
      var real = document.createElement("span");
      real.className = "ln-real";
      real.textContent = h.textContent;
      var glitch = document.createElement("span");
      glitch.className = "ln-glitch";
      glitch.setAttribute("aria-hidden", "true");
      h.textContent = "";
      h.appendChild(real);
      h.appendChild(glitch);
    });

    if (!hasGsap) return;

    var current = -1;

    function scramble(h) {
      var real = h.querySelector(".ln-real");
      var glitch = h.querySelector(".ln-glitch");
      if (!real || !glitch) return;
      var text = real.textContent;
      var glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&";
      var step = 0;
      var total = 15;
      if (h._timer) clearInterval(h._timer);
      glitch.style.visibility = "visible";
      real.style.visibility = "hidden";
      function tick() {
        var out = "";
        for (var i = 0; i < text.length; i++) {
          out += (step >= total || Math.random() < step / total) ? text.charAt(i) : glyphs.charAt(Math.floor(Math.random() * glyphs.length));
        }
        glitch.textContent = out;
        step++;
        if (step > total) {
          clearInterval(h._timer);
          h._timer = null;
          glitch.textContent = "";
          glitch.style.visibility = "hidden";
          real.style.visibility = "";
        }
      }
      tick();
      h._timer = setInterval(tick, 36);
    }

    gsap.to(track, {
      xPercent: -80,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: function (self) {
          var idx = Math.min(names.length - 1, Math.round(self.progress * (names.length - 1)));
          if (idx !== current) {
            current = idx;
            if (names[idx]) scramble(names[idx]);
          }
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     8. Nav theme over dark sections + product close-up
     -------------------------------------------------------------------------- */
  function initNavTheme() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var darks = document.querySelectorAll(".hero-dark, .lineup, .page-hero");
    if (!darks.length) return;

    var ticking = false;
    function update() {
      var band = nav.offsetHeight;
      var dark = false;
      darks.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top <= band && r.bottom > 0) dark = true;
      });
      nav.classList.toggle("nav--dark", dark);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initCloseup() {
    var el = document.getElementById("closeup-meters");
    if (!el) return;
    fillMeters(el, PRODUCTS["coke"]);
  }

  /* --------------------------------------------------------------------------
     9. Products page — staggered cards + image curtain
     -------------------------------------------------------------------------- */
  function initProductPage() {
    var grid = document.getElementById("all-products");
    if (!grid || !hasGsap) return;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    var cards = grid.querySelectorAll(".card");
    var imgs = grid.querySelectorAll(".p-img");

    gsap.from(cards, {
      y: 40, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power2.out",
      scrollTrigger: { trigger: grid, start: "top 80%", once: true }
    });
    gsap.fromTo(imgs,
      { clipPath: "inset(0% 100% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)", duration: 1, stagger: 0.08, ease: "power3.inOut",
        scrollTrigger: { trigger: grid, start: "top 80%", once: true }
      }
    );
  }

  /* --------------------------------------------------------------------------
     10. Card hover — lift the card, make room for it
     -------------------------------------------------------------------------- */
  function initCardHover() {
    var grid = document.getElementById("all-products");
    if (!grid || !hasGsap) return;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
    if (!cards.length) return;

    var DUR = 0.3;
    var EASE = "power2.out";
    var SHIFT = 24;

    cards.forEach(function (card, i) {
      var left = cards[i - 1];
      var right = cards[i + 1];

      card.addEventListener("pointerenter", function () {
        gsap.to(card, { x: 0, y: -10, scale: 1.04, duration: DUR, ease: EASE });
        if (left && left.offsetTop === card.offsetTop) gsap.to(left, { x: -SHIFT, duration: DUR, ease: EASE });
        if (right && right.offsetTop === card.offsetTop) gsap.to(right, { x: SHIFT, duration: DUR, ease: EASE });
      });
      card.addEventListener("pointerleave", function () {
        gsap.to(card, { x: 0, y: 0, scale: 1, duration: DUR, ease: EASE });
        if (left) gsap.to(left, { x: 0, duration: DUR, ease: EASE });
        if (right) gsap.to(right, { x: 0, duration: DUR, ease: EASE });
      });
    });
  }

  /* --------------------------------------------------------------------------
     Boot
     -------------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initFade();
    initDialog();
    initQuiz();
    initReveal();
    initCardMeters();
    initHeroScroll();
    initLineup();
    initNavTheme();
    initCloseup();
    initProductPage();
    initCardHover();
  });
})();

/* ==========================================================================
   VOLUME — main.js — by randpill
   Semua animasi digerakkan posisi scroll (scrub), bukan timer.
   Urutan: Lenis (smooth scroll) -> sinkron ke GSAP ticker -> ScrollTrigger.
   ========================================================================== */
(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------- 1. Smooth scroll ---------------------------------------- */
  if (!reduced) {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    window.lenis = lenis;           // berguna untuk debug: lenis.scrollTo(y, { immediate: true })
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      });
    });
  }

  /* ---------- 2. Util: pecah teks jadi kata --------------------------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    return words.map((w, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = w;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      return span;
    });
  }

  /* ---------- 3. Chrome: progress bar + jam --------------------------- */
  gsap.to("[data-progress]", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
  });

  const clock = document.querySelector("[data-clock]");
  if (clock) {
    const tick = () =>
      (clock.textContent = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB");
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- 4. HERO -------------------------------------------------- */
  const heroIn = gsap.timeline({ defaults: { ease: "expo.out" } });
  heroIn
    .from(".hero__title .line__in", {
      yPercent: 115,
      rotationX: -82,
      opacity: 0,
      duration: 1.5,
      stagger: 0.12,
      transformOrigin: "50% 100% -60px",
    })
    .from("[data-fade]", { y: 28, opacity: 0, duration: 1.1, stagger: 0.1 }, "-=1.05")
    .from(".hero__plane", { opacity: 0, duration: 1.8, scaleY: 1.4 }, 0)
    .from(".shape", { opacity: 0, z: -700, rotationY: -45, duration: 1.6, stagger: 0.14 }, 0.2);

  // Panel melayang: kedalaman berbeda -> parallax 3D saat halaman hero digulir.
  gsap.to(".shape", {
    z: (i) => [320, 180, 60][i],
    rotationY: (i) => [-38, 26, -18][i],
    rotationX: (i) => [14, -12, 8][i],
    yPercent: (i) => [-60, -120, -30][i],
    opacity: 0,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
  });

  // Kamera "menunduk" saat keluar dari hero: lantai makin datar, judul terdorong mundur.
  gsap
    .timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
      defaults: { ease: "none" },
    })
    .to(".hero__plane", { rotationX: 86, y: "18vh", opacity: 0.25 }, 0)
    .to(".hero__inner", { z: -520, rotationX: 26, opacity: 0 }, 0);

  // ilusi "maju ke depan": garis lantai bergerak mendekat
  gsap.to(".hero__plane", {
    backgroundPositionY: "36vh",
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* ---------- 5. MANIFEST & OUTRO: teks berputar per kata -------------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, {
      opacity: 0,
      rotationX: -90,
      z: -160,
      yPercent: 40,
      ease: "power3.out",
      stagger: 0.05,
      scrollTrigger: { trigger: el, start: "top 85%", end: "top 35%", scrub: 1 },
    });
  });

  /* ---------- 6. KUBUS: rotasi 3D penuh saat di-pin -------------------- */
  const cube = document.querySelector("[data-cube]");
  if (cube) {
    // sisi kubus butuh translateZ = setengah lebar aktual (responsif)
    const sizeCube = () => cube.style.setProperty("--half", cube.offsetWidth / 2 + "px");
    sizeCube();
    new ResizeObserver(sizeCube).observe(cube);

    const steps = gsap.utils.toArray(".steps li");
    const setStep = (i) => steps.forEach((li, n) => li.classList.toggle("is-on", n === i));
    setStep(0);

    gsap
      .timeline({
        scrollTrigger: {
          trigger: ".cube-sec",
          start: "top top",
          end: "+=220%",
          scrub: 1,
          pin: ".cube-sec__pin",
          anticipatePin: 1,
          onUpdate: (self) => setStep(Math.min(2, Math.floor(self.progress * 3))),
        },
        defaults: { ease: "none" },
      })
      .to(cube, { rotationY: 360, duration: 1 }, 0)
      .to(cube, { rotationX: 360, duration: 1 }, 0)
      .fromTo(cube, { scale: 0.78, z: -260 }, { scale: 1.06, z: 180, duration: 0.6 }, 0)
      .to(cube, { scale: 0.9, z: 0, duration: 0.4 }, 0.6)
      .from(".cube-sec__copy > *", { opacity: 0, y: 36, stagger: 0.08, duration: 0.25 }, 0);
  }

  /* ---------- 7. LAPISAN: terbang menembus bidang pada sumbu Z --------- */
  const layers = gsap.utils.toArray(".layer");
  if (layers.length) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".layers",
        start: "top top",
        end: "+=260%",
        scrub: 1,
        pin: ".layers__pin",
        anticipatePin: 1,
      },
      defaults: { ease: "none" },
    });

    layers.forEach((layer, i) => {
      const depth = -1400 - i * 900;           // mulai jauh di belakang
      gsap.set(layer, { z: depth, opacity: 0, rotationZ: gsap.utils.random(-7, 7, 1) });
      tl.to(layer, { z: 600, opacity: 1, duration: 1 }, i * 0.14)
        .to(layer, { opacity: 0, duration: 0.18 }, i * 0.14 + 0.82);
    });

    tl.fromTo(
      ".layers__title span",
      { z: -300, opacity: 0, rotationX: 45 },
      { z: 0, opacity: 1, rotationX: 0, stagger: 0.1, duration: 0.5 },
      0.15
    ).to(".layers__title", { letterSpacing: "0.3em", opacity: 0.25, duration: 0.6 }, 0.7);
  }

  /* ---------- 8. GALERI: scroll vertikal -> gerak horizontal ----------- */
  const track = document.querySelector("[data-track]");
  if (track) {
    const cards = gsap.utils.toArray("[data-card] .card__inner");

    const getShift = () => track.scrollWidth - window.innerWidth;

    const horizontal = gsap.to(track, {
      x: () => -getShift(),
      ease: "none",
      scrollTrigger: {
        trigger: ".gallery",
        start: "top top",
        end: () => "+=" + getShift(),
        scrub: 1,
        pin: ".gallery__pin",
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Tiap kartu dimiringkan sesuai jaraknya dari tengah layar.
    const mid = () => window.innerWidth / 2;
    const tilt = cards.map((c) => ({
      ry: gsap.quickTo(c, "rotationY", { duration: 0.5, ease: "power3.out" }),
      rx: gsap.quickTo(c, "rotationX", { duration: 0.5, ease: "power3.out" }),
      z: gsap.quickTo(c, "z", { duration: 0.5, ease: "power3.out" }),
      el: c,
    }));

    const updateTilt = () => {
      const center = mid();
      tilt.forEach((t) => {
        const r = t.el.getBoundingClientRect();
        const d = gsap.utils.clamp(-1, 1, (r.left + r.width / 2 - center) / center);
        t.ry(d * -26);
        t.rx(Math.abs(d) * 9);
        t.z(-Math.abs(d) * 220);
      });
    };
    // hanya hitung saat galeri terlihat — hemat frame di bagian lain halaman
    let live = false;
    const loop = () => { if (live) updateTilt(); };
    gsap.ticker.add(loop);
    ScrollTrigger.create({
      trigger: ".gallery",
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        live = self.isActive;
        if (live) updateTilt();
      },
    });
    horizontal.scrollTrigger.refresh();
  }

  /* ---------- 9. CINCIN: silinder 8 panel ------------------------------ */
  const ring = document.querySelector("[data-ring]");
  if (ring) {
    const panels = gsap.utils.toArray(".ring .panel");
    const step = 360 / panels.length;

    const layout = () => {
      // radius silinder agar panel tidak saling tembus
      const r = ring.offsetWidth / 2 / Math.tan(Math.PI / panels.length);
      panels.forEach((p, i) => gsap.set(p, { rotateY: i * step, z: r, transformOrigin: "50% 50% " + -r + "px" }));
    };
    layout();
    window.addEventListener("resize", layout);

    gsap
      .timeline({
        scrollTrigger: {
          trigger: ".ring",
          start: "top top",
          end: "+=200%",
          scrub: 1,
          pin: ".ring__pin",
          anticipatePin: 1,
        },
        defaults: { ease: "none" },
      })
      .fromTo(ring, { rotationY: 0 }, { rotationY: -720, duration: 1 }, 0)
      .fromTo(ring, { rotationX: -10 }, { rotationX: 22, duration: 0.5 }, 0)
      .to(ring, { rotationX: -6, duration: 0.5 }, 0.5)
      .from(".ring__copy > *", { opacity: 0, y: 30, stagger: 0.1, duration: 0.2 }, 0);
  }

  /* ---------- 10. Hover 3D kartu (desktop saja) ------------------------ */
  if (!isTouch && !reduced) {
    document.querySelectorAll("[data-card]").forEach((card) => {
      const inner = card.querySelector(".card__inner");
      const setScale = gsap.quickTo(inner, "scale", { duration: 0.4, ease: "power3.out" });
      card.addEventListener("mouseenter", () => setScale(1.04));
      card.addEventListener("mouseleave", () => setScale(1));
    });
  }

  /* ---------- 11. Refresh setelah font & gambar siap ------------------- */
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());

  /* ---------- 12. Fallback reduced-motion ------------------------------ */
  if (reduced) {
    ScrollTrigger.getAll().forEach((st) => st.kill());
    gsap.globalTimeline.clear();
    gsap.set("[data-fade], .hero__title .line__in, .cube-sec__copy > *, .ring__copy > *, .w, .layer", {
      clearProps: "all",
      opacity: 1,
    });
  }
})();

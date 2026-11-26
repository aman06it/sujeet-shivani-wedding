(() => {
  const data = window.WEDDING;
  const $ = (id) => document.getElementById(id);
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const names = ["opening", "hero", "signature", "footer"];

  names.forEach((prefix) => {
    set(`${prefix}-bride`, data.couple.bride);
    set(`${prefix}-groom`, data.couple.groom);
  });
  set("hero-greeting", data.greeting);
  set("hero-invitation", data.invitation);
  set("current-year", new Date().getFullYear());
  document.title = `${data.couple.groom} & ${data.couple.bride} — Wedding Invitation`;

  const guest = new URLSearchParams(location.search).get("to");
  if (guest) {
    set("guest-greeting", `Especially for ${guest}`);
    $("guest-greeting").hidden = false;
  }

  const icon = {
    sun: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="7"/><path d="M20 4v6m0 20v6M4 20h6m20 0h6M8.7 8.7l4.2 4.2m14.2 14.2 4.2 4.2M31.3 8.7l-4.2 4.2M12.9 27.1l-4.2 4.2"/></svg>',
    leaf: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 33c8-13 14-20 25-26-1 15-9 24-25 26Z"/><path d="M9 32c7-6 13-11 21-20M18 23l-1-7m6 2 7 1"/></svg>',
    rings: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="15.5" cy="22.5" r="10"/><circle cx="24.5" cy="22.5" r="10"/><path d="m20 7 3 5h-6l3-5Z"/></svg>'
  };

  $("event-grid").innerHTML = data.events.map((event) => `
    <article class="event-card reveal">
      <div class="event-card__icon">${icon[event.icon] || icon.sun}</div>
      <div><h3>${event.name}</h3><p>${event.note}</p></div>
    </article>`).join("");

  if (!data.detailsArePlaceholder) {
    set("date-kicker", "Save the date");
    set("date-long", data.dateLong);
    set("date-location", `${data.venue} · ${data.address}`);
    set("venue-name", data.venue);
    set("venue-address", data.address);
    set("venue-time", `${data.dateLong} · ${data.time}`);
    set("detail-note", `Celebration details for ${data.dateLong}.`);
    $("calendar-button").classList.remove("is-hidden");
    $("notify-button").classList.add("is-hidden");
    if (data.mapsUrl) {
      $("directions-button").href = data.mapsUrl;
      $("directions-button").classList.remove("is-hidden");
    }
    startCountdown();
  } else {
    set("date-kicker", "A celebration is coming");
    set("date-long", "Date to be announced");
    set("date-location", "Venue details coming soon");
  }

  if (data.rsvpPhone) {
    const rsvp = $("rsvp-button");
    rsvp.classList.remove("is-hidden");
    set("rsvp-copy", `Kindly reply by ${data.rsvpBy}. We would be honoured to celebrate with you.`);
    rsvp.addEventListener("click", () => {
      const message = encodeURIComponent(`Hello! I am responding to ${data.couple.groom} & ${data.couple.bride}'s wedding invitation.`);
      location.href = `https://wa.me/${data.rsvpPhone.replace(/\D/g, "")}?text=${message}`;
    });
  }

  $("notify-button").addEventListener("click", () => toast("We’ll share the date and venue here very soon ✦"));
  $("share-button").addEventListener("click", async () => {
    const shareData = { title: document.title, text: `${data.couple.groom} & ${data.couple.bride} invite you to celebrate their wedding.`, url: location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(location.href); toast("Invitation link copied"); }
    } catch (error) { if (error.name !== "AbortError") toast("Copy the page link to share this invitation"); }
  });

  $("calendar-button").addEventListener("click", () => {
    const start = new Date(data.dateISO);
    const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${data.couple.groom} & ${data.couple.bride}'s Wedding`, `LOCATION:${data.venue}, ${data.address}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${data.couple.groom}-${data.couple.bride}-wedding.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
  }), { threshold: .13 });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  $("hero-greeting").closest(".reveal").classList.add("visible");

  const menu = $("section-menu");
  const menuLinks = [...menu.querySelectorAll("a")];
  const menuSections = menuLinks.map((link) => $(link.hash.slice(1)));
  let activeLink = menuLinks[0];
  function updateReadingPosition() {
    const height = document.documentElement.scrollHeight - innerHeight;
    $("reading-progress").style.transform = `scaleX(${height > 0 ? Math.min(1, Math.max(0, scrollY / height)) : 0})`;
    let current = menuLinks[0];
    for (let i = 0; i < menuSections.length; i++) {
      if (menuSections[i].getBoundingClientRect().top > innerHeight * .28) break;
      current = menuLinks[i];
    }
    if (current !== activeLink) {
      activeLink.removeAttribute("aria-current");
      current.setAttribute("aria-current", "location");
      activeLink = current;
    }
  }
  addEventListener("scroll", updateReadingPosition, { passive: true });
  addEventListener("resize", updateReadingPosition);
  updateReadingPosition();

  menuLinks.forEach((link) => link.addEventListener("click", () => { menu.open = false; }));
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });

  const theme = $("theme-button");
  theme.addEventListener("click", () => {
    const evening = document.documentElement.toggleAttribute("data-evening");
    theme.setAttribute("aria-pressed", evening);
    theme.textContent = evening ? "☀" : "☾";
  });

  function startCountdown() {
    const target = new Date(data.dateISO).getTime();
    set("countdown-note", `${data.dateLong} · ${data.time}`);
    const tick = () => {
      const remaining = Math.max(0, target - Date.now());
      const day = 86400000, hour = 3600000, minute = 60000;
      set("days", Math.floor(remaining / day));
      set("hours", String(Math.floor((remaining % day) / hour)).padStart(2, "0"));
      set("minutes", String(Math.floor((remaining % hour) / minute)).padStart(2, "0"));
      set("seconds", String(Math.floor((remaining % minute) / 1000)).padStart(2, "0"));
    };
    tick(); setInterval(tick, 1000);
  }

  function petals(count) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const field = $("petals");
    for (let i = 0; i < count; i++) {
      const petal = document.createElement("i");
      petal.className = "petal";
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.setProperty("--drift", `${(Math.random() - .5) * 220}px`);
      petal.style.animationDuration = `${4 + Math.random() * 4}s`;
      petal.style.animationDelay = `${Math.random() * 1.8}s`;
      field.appendChild(petal);
      setTimeout(() => petal.remove(), 10000);
    }
  }

  function setupPointerEffects() {
    const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    const ambient = $("ambient-motifs");
    const effects = $("pointer-effects");
    const portrait = $("blessing-portrait");
    const cover = $("opening");
    const motifs = ["✿", "✧", "❋", "◈", "ॐ"];
    const trailInterval = 20;
    let lastPoint;
    let lastBurst = -Infinity;

    function refreshAmbientMotifs() {
      ambient.replaceChildren();
      effects.replaceChildren();
      lastPoint = undefined;
      lastBurst = -Infinity;
      if (motionPreference.matches) return;

      for (let i = 0; i < 24; i++) {
        const motif = document.createElement("span");
        motif.textContent = motifs[i % motifs.length];
        motif.style.left = `${2 + (i % 6) * 16 + Math.random() * 9}%`;
        motif.style.top = `${5 + Math.floor(i / 6) * 23 + Math.random() * 13}%`;
        motif.style.setProperty("--motif-size", `${.75 + Math.random() * .65}rem`);
        motif.style.setProperty("--drift-time", `${16 + Math.random() * 14}s`);
        motif.style.setProperty("--drift-offset", `${-Math.random() * 20}s`);
        ambient.append(motif);
      }
    }

    function addEffect(effect, x, y) {
      effect.style.left = `${x}px`;
      effect.style.top = `${y}px`;
      effect.addEventListener("animationend", (event) => {
        if (event.target === effect) effect.remove();
      });
      effects.append(effect);
    }

    function trail(event) {
      if (motionPreference.matches || document.body.classList.contains("locked") || event.pointerType !== "mouse") return;
      const { clientX: x, clientY: y } = event;
      if (lastPoint && (event.timeStamp - lastPoint.time < trailInterval || Math.hypot(x - lastPoint.x, y - lastPoint.y) < 3)) return;
      lastPoint = { x, y, time: event.timeStamp };
      const sparkle = document.createElement("span");
      sparkle.className = "pointer-sparkle";
      sparkle.style.setProperty("--sparkle-color", Math.random() < .55 ? "#b78a35" : "#9f466b");
      sparkle.style.setProperty("--sparkle-size", `${3 + Math.random() * 3}px`);
      addEffect(sparkle, x, y);
    }

    function burstHearts(x, y) {
      const ring = document.createElement("span");
      ring.className = "pointer-burst";
      const count = 16;
      const stagger = 24;
      const flightTime = 1450;
      const spread = Math.min(148, innerWidth * .36);
      const symbols = ["💗", "💖", "💕", "💝", "💓"];
      ring.style.setProperty("--flight-time", `${flightTime}ms`);
      ring.style.setProperty("--burst-life", `${flightTime + (count - 1) * stagger + 40}ms`);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const distance = spread * (.78 + Math.random() * .24);
        const heart = document.createElement("span");
        heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        heart.style.setProperty("--heart-x", `${Math.cos(angle) * distance}px`);
        heart.style.setProperty("--heart-y", `${Math.sin(angle) * distance}px`);
        heart.style.setProperty("--heart-size", `${21 + Math.random() * 5}px`);
        heart.style.setProperty("--heart-delay", `${i * stagger}ms`);
        ring.append(heart);
      }
      addEffect(ring, x, y);
    }

    document.querySelector("main").addEventListener("pointermove", trail, { passive: true });
    document.addEventListener("click", (event) => {
      if (motionPreference.matches || document.body.classList.contains("locked") || cover.contains(event.target)) return;
      const fromPointer = event.detail > 0;
      if (!fromPointer && !portrait.contains(event.target)) return;
      if (event.timeStamp - lastBurst < 100) return;
      lastBurst = event.timeStamp;
      if (fromPointer) {
        burstHearts(event.clientX, event.clientY);
      } else {
        const rect = portrait.getBoundingClientRect();
        burstHearts(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    }, { passive: true });
    portrait.addEventListener("click", () => {
      if (motionPreference.matches) {
        toast("Hearts sent");
        return;
      }
      portrait.classList.remove("offering");
      // Restart the glow when guests click again before it ends.
      void portrait.offsetWidth;
      portrait.classList.add("offering");
    });
    portrait.addEventListener("animationend", () => portrait.classList.remove("offering"));

    refreshAmbientMotifs();
    motionPreference.addEventListener("change", refreshAmbientMotifs);
  }

  setupPointerEffects();

  let toastTimer;
  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  const opening = $("opening");
  const music = $("wedding-music");
  const musicButton = $("music-button");
  const soundButton = $("open-invitation");
  const pageContent = document.querySelectorAll("header, main, footer");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function updateSoundControls() {
    const isPlaying = !music.paused && !music.ended;
    const musicLabel = isPlaying ? "Pause music" : "Play music";
    musicButton.setAttribute("aria-label", musicLabel);
    musicButton.title = musicLabel;
    musicButton.toggleAttribute("data-playing", isPlaying);
  }

  function playMusic(onArrival = false) {
    if (music.ended) music.currentTime = 0;
    music.play().catch((error) => {
      if (!onArrival && error.name !== "AbortError") toast("Couldn’t play the music. Tap Play music to try again.");
    });
  }

  function revealInvitation() {
    if (opening.classList.contains("is-open")) return;
    const focusWasInOpening = opening.contains(document.activeElement);
    opening.classList.add("is-open");
    opening.inert = true;
    document.body.classList.remove("locked");
    pageContent.forEach((element) => { element.inert = false; });
    musicButton.hidden = false;
    document.body.classList.add("invitation-open");
    if (focusWasInOpening) {
      const destination = document.getElementById(location.hash.slice(1));
      const title = destination?.querySelector("h1, h2") || $("invocation-title");
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    }
    if (reducedMotion) {
      opening.hidden = true;
    } else {
      petals(28);
      setTimeout(() => { opening.hidden = true; }, 2600);
    }
  }

  ["play", "pause", "ended"].forEach((event) => music.addEventListener(event, updateSoundControls));
  musicButton.addEventListener("click", () => {
    if (music.paused || music.ended) playMusic();
    else music.pause();
  });
  soundButton.addEventListener("click", () => {
    if (music.paused || music.ended) playMusic();
    revealInvitation();
  });
  function continueSilently() {
    music.pause();
    revealInvitation();
  }
  $("open-silent").addEventListener("click", continueSilently);
  opening.addEventListener("keydown", (event) => {
    if (event.key === "Escape") continueSilently();
  });

  if (location.hash) {
    musicButton.hidden = false;
  } else {
    pageContent.forEach((element) => { element.inert = true; });
    document.body.classList.add("locked");
    opening.hidden = false;
    soundButton.focus({ preventScroll: true });
  }
  playMusic(true);
})();

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

  function element(tag, className, label) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (label) node.textContent = label;
    return node;
  }

  ["bride", "groom"].forEach((role) => {
    const details = data.couple[`${role}Details`] || [];
    const list = $(`${role}-details`);
    list.replaceChildren(...details.map((detail) => element("li", "", detail)));
    list.hidden = !details.length;
  });

  const journeyChoices = (data.journey || []).map((stage) => element("button", "journey-choice", stage.label));
  function selectJourney(index) {
    journeyChoices.forEach((button, i) => button.setAttribute("aria-pressed", i === index));
    set("journey-message", data.journey[index].message);
  }
  journeyChoices.forEach((button, i) => {
    button.type = "button";
    button.addEventListener("click", () => selectJourney(i));
  });
  $("journey-steps").replaceChildren(...journeyChoices);
  if (journeyChoices.length) selectJourney(0);

  const divineCards = [...$("divine-blessings").querySelectorAll("button")];
  divineCards.forEach((button) => button.addEventListener("click", () => {
    divineCards.forEach((card) => card.setAttribute("aria-pressed", card === button));
    set("divine-message", button.dataset.blessing);
  }));

  const eventSymbols = { sun: "💛", leaf: "🎨", rings: "💍", prayer: "🙏" };
  $("event-grid").replaceChildren(...data.events.map((eventConfig) => {
    const event = eventConfig.useWeddingDetails ? { ...data, ...eventConfig } : eventConfig;
    const row = element("div", "event-row reveal");
    const marker = element("span", "event-marker", eventSymbols[event.icon] || "✦");
    marker.setAttribute("aria-hidden", "true");
    const card = element("article", "event-card");
    card.append(element("h3", "", event.name));
    if (!data.detailsArePlaceholder) {
      if (event.dateLong) card.append(element("p", "event-card__date", event.dateLong));
      if (event.time) card.append(element("p", "", event.time));
      if (event.venue) {
        const venue = element(event.mapsUrl ? "a" : "p", "event-card__venue", event.venue);
        if (event.mapsUrl) {
          venue.href = event.mapsUrl;
          venue.target = "_blank";
          venue.rel = "noopener";
        }
        card.append(venue);
      }
    }
    card.append(element("p", "", event.note));
    if (!data.detailsArePlaceholder && event.dateISO && Number.isFinite(Date.parse(event.dateISO))) {
      const button = element("button", "button event-card__calendar", "Add to calendar");
      button.type = "button";
      button.addEventListener("click", () => downloadCalendar(event.dateISO, event.name, event.venue || "", event.endISO));
      card.append(button);
    }
    row.append(marker, card);
    return row;
  }));

  if (!data.detailsArePlaceholder) {
    set("date-kicker", "Save the date");
    set("date-long", data.dateLong);
    set("calendar-date", data.dateLong);
    set("date-location", `${data.venue} · ${data.address}`);
    set("venue-name", data.venue);
    set("venue-address", data.address);
    set("venue-time", `${data.dateLong} · ${data.time}`);
    set("detail-note", `Celebration details for ${data.dateLong}.`);
    const hasWeddingDate = Number.isFinite(Date.parse(data.dateISO));
    $("calendar-button").classList.toggle("is-hidden", !hasWeddingDate);
    $("main-venue-actions").classList.toggle("is-hidden", !hasWeddingDate && !data.mapsUrl);
    if (data.mapsUrl) {
      $("directions-button").href = data.mapsUrl;
      $("directions-button").classList.remove("is-hidden");
    }
    if (data.preWeddingVenue?.name) {
      const { name, address, mapsUrl } = data.preWeddingVenue;
      set("pre-wedding-name", name);
      set("pre-wedding-address", address || "");
      $("pre-wedding-venue").classList.remove("is-hidden");
      $("venue-grid").classList.add("has-two-venues");
      if (mapsUrl) {
        $("pre-wedding-map").href = mapsUrl;
        $("pre-wedding-map").classList.remove("is-hidden");
      }
    }
    if (hasWeddingDate) startCountdown();
  } else {
    set("date-kicker", "A celebration is coming");
    set("date-long", "Date to be announced");
    set("date-location", "Venue details coming soon");
  }

  const rsvpNumber = (data.rsvpPhone || "").replace(/\D/g, "");
  if (rsvpNumber) {
    const rsvp = $("rsvp-button");
    $("rsvp-actions").classList.remove("is-hidden");
    $("rsvp-call").href = `tel:${data.rsvpPhone.startsWith("+") ? "+" : ""}${rsvpNumber}`;
    set("rsvp-copy", `Kindly reply by ${data.rsvpBy}. We would be honoured to celebrate with you.`);
    rsvp.addEventListener("click", () => {
      const message = encodeURIComponent(`Hello! I am responding to ${data.couple.groom} & ${data.couple.bride}'s wedding invitation.`);
      location.href = `https://wa.me/${rsvpNumber}?text=${message}`;
    });
  }
  if (data.rsvpNote) {
    set("rsvp-note", data.rsvpNote);
    $("rsvp-note").hidden = false;
  }
  for (const [key, label] of [["expected", "Guests expected"], ["confirmed", "Confirmed"]]) {
    const count = data.rsvpStats?.[key];
    if (!Number.isInteger(count) || count < 0) continue;
    const stat = element("div", "rsvp-stat");
    stat.append(element("strong", "", String(count)), element("span", "", label));
    $("rsvp-stats").append(stat);
    $("rsvp-stats").hidden = false;
  }

  $("share-button").addEventListener("click", async () => {
    const shareData = { title: document.title, text: `${data.couple.groom} & ${data.couple.bride} invite you to celebrate their wedding.`, url: location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(location.href); toast("Invitation link copied"); }
    } catch (error) { if (error.name !== "AbortError") toast("Copy the page link to share this invitation"); }
  });

  function downloadCalendar(dateISO, title, venue, endISO) {
    const start = new Date(dateISO);
    if (!Number.isFinite(start.getTime())) return;
    const end = new Date(endISO);
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const escape = (value) => String(value).replace(/[\\;,]/g, "\\$&").replace(/\r?\n/g, "\\n");
    const uid = `${stamp(start)}-${encodeURIComponent(title)}@wedding-invitation`;
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding Invitation//EN", "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`];
    if (end > start) lines.push(`DTEND:${stamp(end)}`);
    lines.push(`SUMMARY:${escape(title)}`, `LOCATION:${escape(venue)}`, "END:VEVENT", "END:VCALENDAR", "");
    const ics = lines.join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${data.couple.groom}-${data.couple.bride}-wedding.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $("calendar-button").addEventListener("click", () => {
    downloadCalendar(data.dateISO, `${data.couple.groom} & ${data.couple.bride}'s Wedding`, `${data.venue}, ${data.address}`, data.endISO);
  });

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
  }), { threshold: .08, rootMargin: "0px 0px -32px 0px" });
  document.querySelectorAll(".couple-grid, .ritual-grid, .event-grid, .venue-grid").forEach((group) => {
    [...group.querySelectorAll(".reveal")].forEach((card, i) => {
      card.style.setProperty("--reveal-delay", `${Math.min(i, 3) * 90}ms`);
    });
  });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

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
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const units = ["days", "hours", "minutes", "seconds"].map($);
    set("countdown-note", `${data.dateLong} · ${data.time}`);
    const tick = () => {
      const remaining = Math.max(0, target - Date.now());
      const day = 86400000, hour = 3600000, minute = 60000;
      const values = [
        String(Math.floor(remaining / day)),
        String(Math.floor((remaining % day) / hour)).padStart(2, "0"),
        String(Math.floor((remaining % hour) / minute)).padStart(2, "0"),
        String(Math.floor((remaining % minute) / 1000)).padStart(2, "0")
      ];
      units.forEach((unit, index) => {
        const previous = unit.textContent;
        const value = values[index];
        if (previous === value) return;
        unit.textContent = value;
        if (motion.matches || previous === "—") return;
        unit.classList.remove("countdown-tick");
        void unit.offsetWidth;
        unit.classList.add("countdown-tick");
      });
      return remaining > 0;
    };
    if (tick()) {
      const timer = setInterval(() => {
        if (!tick()) clearInterval(timer);
      }, 1000);
    }
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
    const ritualFlourishes = $("ritual-flourishes");
    const effects = $("pointer-effects");
    const portrait = $("blessing-portrait");
    const cover = $("opening");
    const motifs = [
      { symbol: "🪔", kind: "lamp", count: 8, duration: 20, size: 1.5 },
      { symbol: "🌸", kind: "flower", count: 10, duration: 25, size: 1.4 },
      { symbol: "🪷", kind: "lotus", count: 6, duration: 30, size: 1.75 },
      { symbol: "🕉️", kind: "om", count: 4, duration: 40, size: 1.9 }
    ];
    const trailInterval = 20;
    let lastPoint;
    let lastBurst = -Infinity;

    function refreshAmbientMotifs() {
      ambient.replaceChildren();
      ritualFlourishes.replaceChildren();
      effects.replaceChildren();
      lastPoint = undefined;
      lastBurst = -Infinity;
      if (motionPreference.matches) return;

      for (const { symbol, kind, count, duration, size } of motifs) {
        for (let i = 0; i < count; i++) {
          const motif = element("span", `ambient-motif--${kind}`, symbol);
          motif.style.left = `${3 + Math.random() * 94}%`;
          motif.style.top = `${3 + Math.random() * 92}%`;
          motif.style.setProperty("--motif-size", `${size * (.7 + Math.random() * .3)}rem`);
          motif.style.setProperty("--drift-time", `${duration}s`);
          motif.style.setProperty("--drift-offset", `${-Math.random() * duration}s`);
          ambient.append(motif);
        }
      }
      for (let i = 0; i < 8; i++) {
        const petal = element("span", "", i % 2 ? "🌸" : "🌼");
        petal.style.left = `${7 + (i / 8) * 88}%`;
        petal.style.setProperty("--drift-time", `${11 + Math.random() * 7}s`);
        petal.style.setProperty("--drift-offset", `${-Math.random() * 12}s`);
        ritualFlourishes.append(petal);
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

    document.addEventListener("pointermove", trail, { passive: true });
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
    function finishOpening() {
      if (opening.hidden) return;
      opening.hidden = true;
      document.body.classList.remove("locked");
      if (!location.hash && scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
      pageContent.forEach((element) => { element.inert = false; });
      musicButton.hidden = false;
      document.body.classList.add("invitation-open");
      if (focusWasInOpening) $("invocation-title").focus({ preventScroll: true });
      petals(28);
    }
    if (reducedMotion) return finishOpening();

    const interlude = opening.querySelector(".opening__interlude");
    const fallback = setTimeout(finishOpening, 4600);
    interlude.addEventListener("animationend", (event) => {
      if (event.target !== interlude) return;
      clearTimeout(fallback);
      finishOpening();
    });
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

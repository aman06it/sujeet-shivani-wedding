(() => {
  const data = window.WEDDING;
  const $ = (id) => document.getElementById(id);
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const names = ["opening", "hero", "signature", "footer"];

  names.forEach((prefix) => {
    set(`${prefix}-bride`, data.couple.bride);
    set(`${prefix}-groom`, data.couple.groom);
  });
  set("opening-monogram", data.couple.monogram);
  set("brand-monogram", data.couple.monogram);
  set("hero-greeting", data.greeting);
  set("hero-invitation", data.invitation);
  set("current-year", new Date().getFullYear());
  document.title = `${data.couple.groom} & ${data.couple.bride} — Wedding Invitation`;

  const guest = new URLSearchParams(location.search).get("to");
  if (guest) set("guest-greeting", `Especially for ${guest}`);

  const icon = {
    sun: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="7"/><path d="M20 4v6m0 20v6M4 20h6m20 0h6M8.7 8.7l4.2 4.2m14.2 14.2 4.2 4.2M31.3 8.7l-4.2 4.2M12.9 27.1l-4.2 4.2"/></svg>',
    leaf: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 33c8-13 14-20 25-26-1 15-9 24-25 26Z"/><path d="M9 32c7-6 13-11 21-20M18 23l-1-7m6 2 7 1"/></svg>',
    rings: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="15.5" cy="22.5" r="10"/><circle cx="24.5" cy="22.5" r="10"/><path d="m20 7 3 5h-6l3-5Z"/></svg>'
  };

  $("event-grid").innerHTML = data.events.map((event, i) => `
    <article class="event-card reveal">
      <span class="event-card__number">0${i + 1}</span>
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
  addEventListener("scroll", () => $("topbar").classList.toggle("scrolled", scrollY > 50), { passive: true });

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
    musicButton.textContent = isPlaying ? "Pause music" : "Play music";
    soundButton.textContent = isPlaying ? "Continue with sound" : "Play with sound";
    opening.classList.toggle("with-sound", isPlaying);
  }

  function playMusic(onArrival = false) {
    if (music.ended) music.currentTime = 0;
    music.play().catch((error) => {
      if (!onArrival && error.name !== "AbortError") toast("Couldn’t play the music. Tap Play music to try again.");
    });
  }

  function revealInvitation() {
    if (opening.classList.contains("is-open")) return;
    clearTimeout(autoReveal);
    const focusWasInOpening = opening.contains(document.activeElement);
    opening.classList.add("is-open");
    opening.inert = true;
    document.body.classList.remove("locked");
    pageContent.forEach((element) => { element.inert = false; });
    musicButton.hidden = false;
    if (focusWasInOpening) $("invitation-title").focus({ preventScroll: true });
    if (reducedMotion) {
      opening.hidden = true;
    } else {
      petals(28);
      setTimeout(() => { opening.hidden = true; }, 1600);
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

  pageContent.forEach((element) => { element.inert = true; });
  document.body.classList.add("locked");
  opening.hidden = false;
  soundButton.focus({ preventScroll: true });
  const autoReveal = setTimeout(revealInvitation, 6500);
  playMusic(true);
})();

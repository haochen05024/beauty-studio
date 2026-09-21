document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const updateHeader = () => {
    header.style.boxShadow = window.scrollY > 10 ? "0 8px 30px rgba(40,30,25,.05)" : "none";
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, {passive:true});

  document.querySelectorAll(".filters button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      const filter = button.dataset.filter;
      document.querySelectorAll(".work-item").forEach(item => {
        item.classList.toggle("hidden", filter !== "all" && item.dataset.category !== filter);
      });
    });
  });
});

// Customer-side gallery filter. No admin/data service is connected yet.

(() => {
  let deferredPrompt = null;
  const installBtn = document.getElementById("installBtn");
  const installMain = document.getElementById("installMain");
  const hint = document.getElementById("installHint");

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMac = /macintosh/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    if (installBtn) {
      installBtn.hidden = false;
      installBtn.textContent = "Install";
    }
    if (installMain) installMain.textContent = "Install Beauty Studio →";
  });

  const openInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (installBtn) installBtn.hidden = true;
      return;
    }

    if (isIOS) {
      hint.textContent = "iPhone / iPad: open the Share menu in Safari, then choose “Add to Home Screen”.";
      return;
    }
    if (isMac) {
      hint.textContent = "Mac: in Safari choose File → Add to Dock. In supported Chromium browsers, use the Install icon in the address bar.";
      return;
    }
    if (isAndroid) {
      hint.textContent = "Android: open your browser menu ⋮ and choose “Install app” or “Add to Home screen”.";
      return;
    }
    hint.textContent = "Desktop: use your browser’s Install / Add to Home Screen option, usually from the address bar or browser menu.";
  };

  installBtn?.addEventListener("click", openInstall);
  installMain?.addEventListener("click", openInstall);

  window.addEventListener("appinstalled", () => {
    if (installBtn) installBtn.hidden = true;
    if (hint) hint.textContent = "Beauty Studio has been added to your device.";
  });
})();

(() => {
  const modal = document.getElementById("detailModal");
  const serviceModal = document.getElementById("serviceModal");
  const closeAll = () => {
    [modal, serviceModal].forEach(m => {
      if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden","true"); }
    });
    document.body.classList.remove("modal-open");
  };

  document.querySelectorAll(".work-trigger").forEach(item => {
    item.addEventListener("click", () => {
      const art = item.querySelector(".work-art");
      const modalArt = document.getElementById("modalArt");
      modalArt.className = "modal-art " + [...art.classList].filter(x => x.startsWith("art-"))[0];
      document.getElementById("modalTitle").textContent = item.dataset.title || "Beauty Style";
      document.getElementById("modalStyle").textContent = item.dataset.style || "";
      document.getElementById("modalDescription").textContent = item.dataset.description || "";
      modal.classList.add("open");
      modal.setAttribute("aria-hidden","false");
      document.body.classList.add("modal-open");
    });
  });

  const services = {
    gel: {
      title:"Gel Manicure", price:"From 00 MMK",
      description:"A clean, polished finish designed to stay beautiful through everyday life.",
      art:"photo-blush",
      points:["Nail preparation & shaping","Gel color application","Clean finish & care"]
    },
    art: {
      title:"Custom Nail Art", price:"From 00 MMK",
      description:"Bring an idea, a color, or simply a mood. We turn it into a design that feels like yours.",
      art:"photo-rose",
      points:["Base manicure included","Custom color & detail","Design consultation"]
    },
    extensions: {
      title:"Extensions", price:"From 00 MMK",
      description:"Beautiful length and shape tailored to your hands, with a comfortable, refined finish.",
      art:"photo-nude",
      points:["Shape consultation","Extension application","Finish & aftercare guidance"]
    }
  };

  document.querySelectorAll(".service-trigger").forEach(item => {
    item.addEventListener("click", () => {
      const s = services[item.dataset.service];
      if (!s) return;
      const art = document.getElementById("serviceModalArt");
      art.className = "service-modal-art " + s.art;
      document.getElementById("serviceModalTitle").textContent = s.title;
      document.getElementById("serviceModalPrice").textContent = s.price;
      document.getElementById("serviceModalDescription").textContent = s.description;
      document.getElementById("servicePoints").innerHTML = s.points.map(x => `<li>${x}</li>`).join("");
      serviceModal.classList.add("open");
      serviceModal.setAttribute("aria-hidden","false");
      document.body.classList.add("modal-open");
    });
  });

  document.querySelectorAll("[data-close-modal],[data-close-service]").forEach(el => {
    el.addEventListener("click", closeAll);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeAll();
  });
})();

(() => {
  const bookingModal = document.getElementById("bookingModal");
  const startBooking = document.getElementById("startBooking");
  const serviceChoices = document.querySelectorAll("[data-service-choice]");
  const timeChoices = document.querySelectorAll(".time-grid button");
  const steps = [...document.querySelectorAll(".booking-step")];
  const stepDots = [...document.querySelectorAll(".steps span")];
  let selectedService = "";
  let selectedTime = "";

  const closeBooking = () => {
    bookingModal?.classList.remove("open");
    bookingModal?.setAttribute("aria-hidden","true");
    document.body.classList.remove("modal-open");
  };
  const openBooking = () => {
    bookingModal?.classList.add("open");
    bookingModal?.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");
  };
  const goStep = (n) => {
    steps.forEach((s,i)=>s.classList.toggle("active",i===n-1));
    stepDots.forEach((d,i)=>d.classList.toggle("current",i===n-1));
  };

  startBooking?.addEventListener("click", openBooking);
  document.querySelectorAll("[data-close-booking]").forEach(x=>x.addEventListener("click", closeBooking));

  serviceChoices.forEach(btn => btn.addEventListener("click", () => {
    selectedService = btn.dataset.serviceChoice;
    document.getElementById("summaryService").textContent = selectedService;
    goStep(2);
  }));

  timeChoices.forEach(btn => btn.addEventListener("click", () => {
    timeChoices.forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    selectedTime = btn.textContent.trim();
    document.getElementById("summaryTime").textContent = selectedTime;
    goStep(3);
  }));

  document.querySelectorAll(".date-choice").forEach(btn => btn.addEventListener("click",()=>{
    document.querySelectorAll(".date-choice").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
  }));

  document.getElementById("confirmBooking")?.addEventListener("click",()=>{
    const name = document.getElementById("guestName").value.trim();
    if (!name) {
      document.getElementById("guestName").focus();
      return;
    }
    document.querySelectorAll(".booking-step").forEach(x=>x.style.display="none");
    document.getElementById("bookingComplete").classList.add("show");
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeBooking();
  });
})();

(() => {
  const modal = document.getElementById("bookingModal");
  if (!modal) return;

  const steps = [...modal.querySelectorAll(".booking-step")];
  const dots = [...modal.querySelectorAll("[data-progress]")];
  const fill = document.getElementById("progressFill");
  const serviceLabel = document.getElementById("chosenServiceLabel");
  const summaryService = document.getElementById("summaryService");
  const summaryDate = document.getElementById("summaryDate");
  const summaryTime = document.getElementById("summaryTime");
  const completeSummary = document.getElementById("completeSummary");

  let currentStep = 1;
  let service = "";
  let date = "Today";
  let time = "";

  function setStep(step) {
    currentStep = step;
    steps.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === step));
    dots.forEach(d => d.classList.toggle("current", Number(d.dataset.progress) === step));
    if (fill) fill.style.width = `${step / 3 * 100}%`;
  }

  document.querySelectorAll("[data-service-choice]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-service-choice]").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
      service = btn.dataset.serviceChoice;
      if (serviceLabel) serviceLabel.textContent = service;
      if (summaryService) summaryService.textContent = service;
      setStep(2);
    });
  });

  document.querySelectorAll(".date-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".date-choice").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      date = btn.dataset.date || btn.textContent.trim();
      if (summaryDate) summaryDate.textContent = date;
    });
  });

  document.querySelectorAll(".time-grid button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".time-grid button").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
      time = btn.textContent.trim();
      if (summaryTime) summaryTime.textContent = time;
      setStep(3);
    });
  });

  modal.querySelectorAll("[data-back-step]").forEach(btn => {
    btn.addEventListener("click", () => setStep(Number(btn.dataset.backStep)));
  });

  document.getElementById("confirmBooking")?.addEventListener("click", () => {
    const nameInput = document.getElementById("guestName");
    const phoneInput = document.getElementById("guestPhone");
    const name = nameInput?.value.trim();
    const phone = phoneInput?.value.trim();

    if (!name) { nameInput?.focus(); return; }
    if (!phone) { phoneInput?.focus(); return; }

    document.querySelectorAll("#bookingModal .booking-step").forEach(x => x.style.display = "none");
    const complete = document.getElementById("bookingComplete");
    complete?.classList.add("show");
    if (completeSummary) {
      completeSummary.textContent = `${service} · ${date} · ${time}. The Studio will confirm the final time with you.`;
    }
  });
})();

(() => {
  // v8: subtle customer-side polish. No backend calls.
  const progress = document.getElementById("pageProgress");
  const backTop = document.getElementById("backTop");
  const quickBook = document.getElementById("mobileQuickBook");

  const updateScrollUI = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    if (backTop) backTop.classList.toggle("show", window.scrollY > 650);
    if (quickBook) quickBook.classList.toggle("show", window.scrollY > 420);
  };
  window.addEventListener("scroll", updateScrollUI, {passive:true});
  window.addEventListener("resize", updateScrollUI);
  updateScrollUI();

  backTop?.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));

  // Reveal major content blocks as the customer scrolls.
  const candidates = document.querySelectorAll("main > section");
  candidates.forEach(section => section.classList.add("section-reveal"));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:.08});
    candidates.forEach(section => observer.observe(section));
  } else {
    candidates.forEach(section => section.classList.add("is-visible"));
  }
})();

(() => {
  const menu = document.getElementById("mobileMenu");
  const menuBtn = document.getElementById("mobileMenuBtn");
  if (!menu || !menuBtn) return;

  const openMenu = () => {
    menu.classList.add("open");
    menu.setAttribute("aria-hidden","false");
    menuBtn.setAttribute("aria-expanded","true");
    document.body.classList.add("modal-open");
  };
  const closeMenu = () => {
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden","true");
    menuBtn.setAttribute("aria-expanded","false");
    document.body.classList.remove("modal-open");
  };

  menuBtn.addEventListener("click", openMenu);
  menu.querySelectorAll("[data-close-menu], nav a").forEach(el => el.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if(e.key === "Escape") closeMenu(); });
})();

(() => {
  const buttons = [...document.querySelectorAll(".filters button")];
  const items = [...document.querySelectorAll(".work-item")];
  const count = document.getElementById("galleryCount");
  if (!buttons.length || !items.length) return;

  const updateCount = filter => {
    const visible = items.filter(item => filter === "all" || item.dataset.category === filter).length;
    if (count) count.textContent = `${visible} ${visible === 1 ? "style" : "styles"}`;
  };

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";
      buttons.forEach(b => b.classList.toggle("active", b === button));
      items.forEach(item => {
        const show = filter === "all" || item.dataset.category === filter;
        item.classList.toggle("hidden", !show);
        if (show) {
          item.animate(
            [{opacity:.35,transform:"translateY(8px)"},{opacity:1,transform:"translateY(0)"}],
            {duration:280,easing:"ease-out"}
          );
        }
      });
      updateCount(filter);
    });
  });
  updateCount("all");
})();


/* v11 — keep service details and booking selection in sync */
(() => {
  const modal = document.getElementById("serviceModal");
  const choose = document.getElementById("chooseServiceButton");
  const serviceArt = document.getElementById("serviceModalArt");
  const serviceNumber = document.getElementById("serviceModalNumber");
  const serviceDuration = document.getElementById("serviceModalDuration");
  const serviceDurationText = document.getElementById("serviceModalDurationText");
  const price = document.getElementById("serviceModalPrice");
  const summaryPrice = document.getElementById("summaryPrice");
  const summaryDuration = document.getElementById("summaryDuration");
  const summaryDate = document.getElementById("summaryDate");
  const bookingModal = document.getElementById("bookingModal");

  const data = {
    gel: { title:"Gel Manicure", price:"From 00 MMK", duration:"60 min", durationShort:"60 MIN", number:"01", art:"photo-blush" },
    art: { title:"Custom Nail Art", price:"From 00 MMK", duration:"90 min", durationShort:"90 MIN", number:"02", art:"photo-rose" },
    extensions: { title:"Extensions", price:"From 00 MMK", duration:"120 min", durationShort:"120 MIN", number:"03", art:"photo-nude" }
  };

  function selectService(key, openBooking = false) {
    const s = data[key];
    if (!s) return;
    const button = document.querySelector(`[data-service-choice][data-service-key="${key}"]`);
    document.querySelectorAll("[data-service-choice]").forEach(x => x.classList.remove("selected"));
    button?.classList.add("selected");

    document.getElementById("summaryService")?.replaceChildren(document.createTextNode(s.title));
    summaryPrice && (summaryPrice.textContent = s.price);
    summaryDuration && (summaryDuration.textContent = s.duration);
    document.querySelectorAll(".booking-step").forEach(x => x.style.display = "");
    document.getElementById("bookingComplete")?.classList.remove("show");

    if (openBooking && bookingModal) {
      bookingModal.classList.add("open");
      bookingModal.setAttribute("aria-hidden","false");
      document.body.classList.add("modal-open");
      document.querySelectorAll(".booking-step").forEach(x => x.classList.toggle("active", x.dataset.step === "2"));
      document.querySelectorAll(".steps span").forEach((x,i) => x.classList.toggle("current", i === 1));
      document.getElementById("progressFill") && (document.getElementById("progressFill").style.width = "66.666%");
    }
  }

  document.querySelectorAll(".service-trigger").forEach(card => {
    card.addEventListener("click", () => {
      const key = card.dataset.service;
      const s = data[key];
      if (!s) return;
      serviceArt?.classList.remove("photo-blush","photo-rose","photo-nude");
      serviceArt?.classList.add(s.art);
      if (serviceNumber) serviceNumber.textContent = s.number;
      if (serviceDuration) serviceDuration.textContent = s.durationShort;
      if (serviceDurationText) serviceDurationText.textContent = s.duration;
      if (price) price.textContent = s.price;
      choose?.setAttribute("data-book-service", key);
    });
  });

  choose?.addEventListener("click", () => {
    const key = choose.dataset.bookService || "gel";
    selectService(key, true);
    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden","true");
    window.location.hash = "booking";
  });

  document.querySelectorAll("[data-service-choice]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.serviceKey;
      if (key) {
        const s = data[key];
        if (summaryPrice) summaryPrice.textContent = s.price;
        if (summaryDuration) summaryDuration.textContent = s.duration;
      }
    });
  });

  document.querySelectorAll(".date-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      if (summaryDate) summaryDate.textContent = btn.dataset.date || btn.textContent.trim();
    });
  });
})();

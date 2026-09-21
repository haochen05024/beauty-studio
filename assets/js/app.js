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
  const installActions = document.getElementById("installActions");
  const installStatus = document.getElementById("installStatus");
  const installMainSub = document.getElementById("installMainSub");
  const modal = document.getElementById("installModal");
  const modalTitle = document.getElementById("installModalTitle");
  const modalEyebrow = document.getElementById("installModalEyebrow");
  const modalIntro = document.getElementById("installModalIntro");
  const modalAction = document.getElementById("installModalAction");
  const stepTitles = [1,2,3].map(i => document.getElementById(`installStep${i}Title`));
  const stepTexts = [1,2,3].map(i => document.getElementById(`installStep${i}Text`));

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  const isTabletAndroid = isAndroid && !/mobile/i.test(ua);
  const isMac = /macintosh|mac os x/i.test(ua) && !isIOS;
  const isWindows = /windows/i.test(ua);
  const isChrome = /chrome|crios/i.test(ua) && !/edg|edge|opr|opera/i.test(ua);
  const isEdge = /edg|edge/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|android/i.test(ua);
  const isStandalone = () =>
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true ||
    document.referrer.startsWith("android-app://");

  const alreadyInstalledKey = "beauty-studio-installed-v25";

  const hideInstall = (message = "Beauty Studio is on your device") => {
    if (installActions) installActions.classList.add("install-complete");
    if (installMain) {
      installMain.hidden = true;
      installMain.setAttribute("aria-hidden", "true");
    }
    if (installBtn) installBtn.hidden = true;
    if (installStatus) {
      installStatus.textContent = message;
      installStatus.classList.add("is-complete");
    }
    try { localStorage.setItem(alreadyInstalledKey, "1"); } catch (_) {}
  };

  const isMarkedInstalled = () => {
    try { return localStorage.getItem(alreadyInstalledKey) === "1"; } catch (_) { return false; }
  };

  const closeInstall = () => {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  const setGuide = (device) => {
    const guides = {
      ios: {
        label: "iPHONE · iPAD",
        title: "Add Beauty Studio<br><em>to your Home Screen.</em>",
        intro: "On iPhone and iPad, use the browser Share menu to save Beauty Studio like an app.",
        steps: [
          ["Open the Share menu", "In Safari, tap the Share button. On iPad, it is in the browser toolbar."],
          ["Choose Add to Home Screen", "Scroll through the Share sheet and select “Add to Home Screen”."],
          ["Tap Add", "Confirm the name and tap “Add”. Beauty Studio will appear on your Home Screen."]
        ],
        note: "Tip · If the option is missing, open this page in Safari and try again."
      },
      android: {
        label: isTabletAndroid ? "ANDROID · TABLET" : "ANDROID · PHONE",
        title: "Add Beauty Studio<br><em>to your Android device.</em>",
        intro: "Android phones and tablets can use the browser's install option when PWA installation is supported.",
        steps: [
          ["Open the browser menu", "In Chrome or another supported browser, tap ⋮ or the browser menu."],
          ["Choose Install", "Tap “Install app”, “Add to Home screen”, or the install icon if your browser shows one."],
          ["Confirm Install", "Confirm the prompt. Beauty Studio will be added to your Home Screen or app list."]
        ],
        note: "Tip · Chrome usually shows Install app for supported PWA sites; wording can vary by browser version."
      },
      mac: {
        label: "MAC · SAFARI / CHROME",
        title: "Install Beauty Studio<br><em>on your Mac.</em>",
        intro: "On Mac, install the website as an app when your browser supports PWA installation.",
        steps: [
          ["Open the install option", "Safari: use File → Add to Dock. Chrome: use the install icon in the address bar or ⋮ menu."],
          ["Confirm the install", "Follow the browser's confirmation prompt to create the app."],
          ["Open Beauty Studio", "Launch it from your Dock, Applications, or installed apps."]
        ],
        note: "Tip · If your browser does not offer installation, you can still add a shortcut/bookmark for quick access."
      },
      windows: {
        label: "WINDOWS · CHROME / EDGE",
        title: "Install Beauty Studio<br><em>on your Windows PC.</em>",
        intro: "Chrome and Edge can install Beauty Studio as an app when PWA installation is supported.",
        steps: [
          ["Open the install option", "Chrome: click the install icon or ⋮. Edge: use Apps → Install this site as an app."],
          ["Confirm Install", "Follow the browser prompt and confirm the installation."],
          ["You're ready", "Beauty Studio will be available from your Start menu and installed apps."]
        ],
        note: "Tip · If Install is not shown, use the browser's Create shortcut / Add to desktop option as a fallback."
      },
      desktop: {
        label: "YOUR DEVICE · BROWSER",
        title: "Add Beauty Studio<br><em>for quick access.</em>",
        intro: "We couldn't identify a specific device. Use your browser's Install, Add to Home Screen, Add to Dock, or shortcut option.",
        steps: [
          ["Open the browser menu", "Look for Install, Add to Home Screen, Add to Dock, Create shortcut, or Add to desktop."],
          ["Confirm", "Follow the browser's installation or shortcut prompt."],
          ["You're ready", "Open Beauty Studio from your Home Screen, desktop, Dock, or app list."]
        ],
        note: "Tip · Installation wording differs by browser. The site remains fully usable even when PWA installation is unavailable."
      }
    };

    const guide = guides[device] || guides.desktop;
    if (modalEyebrow) modalEyebrow.textContent = guide.label;
    if (modalTitle) modalTitle.innerHTML = guide.title;
    if (modalIntro) modalIntro.textContent = guide.intro;
    guide.steps.forEach((step, index) => {
      if (stepTitles[index]) stepTitles[index].textContent = step[0];
      if (stepTexts[index]) stepTexts[index].textContent = step[1];
    });
    const note = document.getElementById("installModalNote");
    if (note) note.textContent = guide.note;
  };

  const detectDevice = () => {
    if (isIOS) return "ios";
    if (isAndroid) return "android";
    if (isMac) return "mac";
    if (isWindows) return "windows";
    return "desktop";
  };


  const openInstallGuide = async () => {
    if (isStandalone()) {
      hideInstall();
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (result?.outcome === "accepted") {
        hideInstall("Beauty Studio has been added");
      }
      return;
    }

    setGuide(detectDevice());
    if (modalAction) modalAction.textContent = "I've added it";
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  };

  // The device cards are now informational shortcuts to the same guide.
  document.querySelectorAll(".device-card").forEach(card => {
    card.addEventListener("click", () => {
      const name = (card.querySelector("strong")?.textContent || "").toLowerCase();
      const device = name.includes("iphone") || name.includes("ipad") ? "ios" : name.includes("android") ? "android" : name.includes("mac") ? "mac" : name.includes("windows") ? "windows" : "desktop";
      setGuide(device);
      modal?.classList.add("open");
      modal?.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    });
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    if (installBtn) installBtn.hidden = false;
    if (installMainSub) installMainSub.textContent = "Install Beauty Studio";
    if (installStatus) installStatus.textContent = "Ready to install on this device";
    if (modalAction) modalAction.textContent = "Install Beauty Studio";
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideInstall("Beauty Studio has been added");
    closeInstall();
  });

  installBtn?.addEventListener("click", openInstallGuide);
  installMain?.addEventListener("click", openInstallGuide);

  document.querySelectorAll("[data-close-install]").forEach(el => el.addEventListener("click", closeInstall));
  modalAction?.addEventListener("click", () => {
    hideInstall("Beauty Studio has been added");
    closeInstall();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeInstall();
  });

  // If the page is opened as an installed app, or the user previously confirmed installation, hide the CTA.
  if (isStandalone() || isMarkedInstalled()) {
    hideInstall();
  }
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

/* v12 — gallery style inspiration carried into booking */
(() => {
  const workModal = document.getElementById("workModal");
  const bookWork = document.getElementById("bookWorkStyleButton");
  const inspirationBox = document.getElementById("bookingInspiration");
  const inspirationText = document.getElementById("summaryInspiration");
  let selectedStyle = "";

  const styleNames = {
    "soft-blush":"Soft Blush",
    "rose-chrome":"Rose Chrome",
    "modern-line":"Modern Line",
    "tiny-flower":"Tiny Flower"
  };

  function setInspiration(name){
    selectedStyle = name || "";
    if (!inspirationText || !inspirationBox) return;
    if (selectedStyle) {
      inspirationText.textContent = selectedStyle;
      inspirationBox.hidden = false;
    } else {
      inspirationText.textContent = "—";
      inspirationBox.hidden = true;
    }
  }

  document.querySelectorAll(".work-card").forEach(card => {
    card.addEventListener("click", () => {
      const key = card.dataset.styleKey;
      if (key) {
        const label = styleNames[key] || key.replaceAll("-"," ");
        setInspiration(label.replace(/\b\w/g,c=>c.toUpperCase()));
        if (bookWork) bookWork.dataset.inspiration = label;
      }
    });
  });

  bookWork?.addEventListener("click", () => {
    const label = bookWork.dataset.inspiration || selectedStyle;
    setInspiration(label);
    document.querySelectorAll("[data-service-choice]").forEach(x => x.classList.remove("selected"));
    workModal?.classList.remove("open");
    workModal?.setAttribute("aria-hidden","true");
    document.getElementById("bookingModal")?.classList.add("open");
    document.getElementById("bookingModal")?.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");

    document.querySelectorAll(".booking-step").forEach(x => x.classList.toggle("active", x.dataset.step === "1"));
    document.querySelectorAll(".steps span").forEach((x,i) => x.classList.toggle("current", i === 0));
    const fill=document.getElementById("progressFill");
    if(fill) fill.style.width="33.333%";
  });
})();

/* v13 — unified booking state + final confirmation preview */
(() => {
  const state = { service:"—", price:"—", duration:"—", date:"—", time:"—", inspiration:"—" };
  const q = id => document.getElementById(id);

  function sync(){
    q("summaryService") && (q("summaryService").textContent=state.service);
    q("summaryPrice") && (q("summaryPrice").textContent=state.price);
    q("summaryDuration") && (q("summaryDuration").textContent=state.duration);
    q("summaryDate") && (q("summaryDate").textContent=state.date);
    q("summaryTime") && (q("summaryTime").textContent=state.time);
    if(q("summaryInspiration")) q("summaryInspiration").textContent=state.inspiration;
    if(q("bookingSelectionNote")){
      const parts=[];
      if(state.service!=="—") parts.push(state.service);
      if(state.date!=="—") parts.push(state.date);
      if(state.time!=="—") parts.push(state.time);
      q("bookingSelectionNote").textContent = parts.length ? parts.join(" · ") : "Booking details update as you choose.";
    }
    q("finalService") && (q("finalService").textContent=state.service);
    q("finalPrice") && (q("finalPrice").textContent=state.price);
    q("finalDuration") && (q("finalDuration").textContent=state.duration);
    q("finalDate") && (q("finalDate").textContent=state.date);
    q("finalTime") && (q("finalTime").textContent=state.time);
    q("finalInspiration") && (q("finalInspiration").textContent=state.inspiration);
  }

  document.querySelectorAll("[data-service-choice]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const key=btn.dataset.serviceKey;
      const map={
        gel:["Gel Manicure","From 00 MMK","60 min"],
        art:["Custom Nail Art","From 00 MMK","90 min"],
        extensions:["Extensions","From 00 MMK","120 min"]
      };
      if(map[key]) [state.service,state.price,state.duration]=map[key];
      sync();
    });
  });

  document.querySelectorAll(".date-choice").forEach(btn=>{
    btn.addEventListener("click",()=>{
      state.date=btn.dataset.date || btn.textContent.trim();
      sync();
    });
  });

  document.querySelectorAll(".time-choice").forEach(btn=>{
    btn.addEventListener("click",()=>{
      state.time=btn.dataset.time || btn.textContent.trim();
      sync();
    });
  });

  const originalSetInspiration = window.__beautyStudioSetInspiration;
  window.__beautyStudioSetInspiration = (name)=>{
    state.inspiration=name || "—";
    sync();
    if(typeof originalSetInspiration==="function") originalSetInspiration(name);
  };

  // Catch the existing v12 booking inspiration flow without replacing it.
  document.querySelectorAll(".work-card").forEach(card=>{
    card.addEventListener("click",()=>{
      const key=card.dataset.styleKey;
      const names={"soft-blush":"Soft Blush","rose-chrome":"Rose Chrome","modern-line":"Modern Line","tiny-flower":"Tiny Flower"};
      if(key) { state.inspiration=names[key] || key.replaceAll("-"," "); sync(); }
    });
  });

  const completeButton = document.querySelector('[data-booking-complete], .booking-submit');
  completeButton?.addEventListener("click",()=>{
    sync();
    const card=q("finalBookingCard");
    if(card) card.hidden=false;
    const ref=q("finalBookingRef");
    if(ref) ref.textContent="PREVIEW · "+Math.random().toString(36).slice(2,8).toUpperCase();
  });

  sync();
})();

/* v14 — mobile viewport safety */
(() => {
  const syncViewportLock = () => {
    const open = document.querySelector(".detail-modal.open,.booking-modal.open,.mobile-menu.open");
    document.documentElement.classList.toggle("ui-overlay-open", !!open);
  };
  const observer = new MutationObserver(syncViewportLock);
  observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]});
  syncViewportLock();
})();

/* v15 — mobile navigation is intentionally the single persistent CTA */
(() => {
  const quick = document.getElementById("mobileQuickBook");
  if (quick && window.matchMedia("(max-width: 800px)").matches) {
    quick.setAttribute("aria-hidden","true");
  }
})();

/* v17 — section-aware navigation */
(() => {
  const ids=["home","services","work","about","install","booking","contact"];
  const sections=ids.map(id=>document.getElementById(id)).filter(Boolean);
  const navLinks=[...document.querySelectorAll(".desktop-nav a,.mobile-bar a")];

  function markActive(id){
    navLinks.forEach(link=>{
      const href=link.getAttribute("href")||"";
      link.classList.toggle("active",href==="#"+id);
    });
  }
  const io=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible) markActive(visible.target.id);
  },{rootMargin:"-30% 0px -55% 0px",threshold:[0,.2,.5,.8]});
  sections.forEach(s=>io.observe(s));

  const header=document.querySelector(".site-header");
  const onScroll=()=>{
    header?.classList.toggle("is-scrolled",window.scrollY>20);
  };
  window.addEventListener("scroll",onScroll,{passive:true});
  onScroll();
})();

/* v18 — gallery metadata + recommended service */
(() => {
  const modal = document.getElementById("workModal");
  const tags = document.getElementById("workDetailTags");
  const recommended = document.getElementById("workRecommendedService");
  const useService = document.getElementById("workChooseService");
  const book = document.getElementById("bookWorkStyleButton");

  const serviceKey = {
    "Gel Manicure":"gel",
    "Custom Nail Art":"art",
    "Extensions":"extensions"
  };
  let activeServiceKey = "";

  document.querySelectorAll(".work-card").forEach(card => {
    card.addEventListener("click", () => {
      const name = card.dataset.styleName || "Studio Style";
      const category = card.dataset.category || "Style";
      const service = card.dataset.recommendedService || "Custom Nail Art";
      activeServiceKey = serviceKey[service] || "art";

      if(tags){
        tags.innerHTML="";
        [category,name].forEach(label=>{
          const s=document.createElement("span");
          s.textContent=label;
          tags.appendChild(s);
        });
      }
      if(recommended) recommended.textContent=service;
      if(book) book.dataset.recommendedService=activeServiceKey;
    });
  });

  useService?.addEventListener("click",()=>{
    const key=activeServiceKey || "art";
    const option=document.querySelector(`[data-service-choice][data-service-key="${key}"]`);
    option?.click();
    if(modal){
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden","true");
    }
    const booking=document.getElementById("bookingModal");
    booking?.classList.add("open");
    booking?.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");
    document.querySelectorAll(".booking-step").forEach(x=>x.classList.toggle("active",x.dataset.step==="2"));
    document.querySelectorAll(".steps span").forEach((x,i)=>x.classList.toggle("current",i===1));
    const fill=document.getElementById("progressFill");
    if(fill) fill.style.width="66.666%";
  });

  book?.addEventListener("click",()=>{
    const key=book.dataset.recommendedService || "art";
    const option=document.querySelector(`[data-service-choice][data-service-key="${key}"]`);
    option?.click();
  });
})();

/* v19 — subtle About reveal */
(() => {
  const about=document.getElementById("about");
  if(!about) return;
  const items=about.querySelectorAll(".about-signature,.studio-philosophy,.values>div,.about-art");
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("story-visible");
        io.unobserve(e.target);
      }
    });
  },{threshold:.12});
  items.forEach((el,i)=>{
    el.style.setProperty("--story-delay",`${Math.min(i*70,280)}ms`);
    io.observe(el);
  });
})();

/* v20 — UI system marker */
(() => {
  document.documentElement.dataset.beautyStudioUi = "v20";
})();

/* v21 — centralized launch content */
(() => {
  const cfg = window.BEAUTY_STUDIO_CONTENT || {};
  const setText = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach(el => el.textContent = value);
  };

  // Only replace elements explicitly marked for future content.
  setText("[data-studio-name]", cfg.studioName);
  setText("[data-studio-city]", cfg.city);
  setText("[data-studio-address]", cfg.address);
  setText("[data-studio-hours]", cfg.hours);
  setText("[data-studio-phone]", cfg.phone);

  document.querySelectorAll("[data-studio-phone-link]").forEach(el => {
    if (cfg.phone) {
      el.href = "tel:" + cfg.phone.replace(/[^\d+]/g,"");
      el.textContent = cfg.phone;
    }
  });

  document.querySelectorAll("[data-studio-instagram]").forEach(el => {
    if (cfg.instagram) {
      el.href = cfg.instagram;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  });

  const note=document.querySelector(".contact-status small");
  if(note && cfg.bookingMessage) note.textContent=cfg.bookingMessage;
})();

/* v22 — document title */
(() => {
  if (document.title !== "Beauty Studio · Nails & Beauty") {
    document.title = "Beauty Studio · Nails & Beauty";
  }
})();

/* v23 — resilient service worker update */
(() => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    document.documentElement.dataset.swUpdated = "true";
  });
})();

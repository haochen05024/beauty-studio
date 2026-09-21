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
  const installSection = document.getElementById("install");
  const installCopy = installSection?.querySelector(".install-copy");
  const deviceCards = installSection?.querySelector(".device-cards");
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

  /*
   * Keep the browser version and installed app separate.
   * The same origin/storage is shared by both, so a localStorage "installed"
   * flag would incorrectly hide the install UI from the normal browser tab.
   * Browser = keep CTA/tutorial. Standalone app = hide tutorial.
   */
  const hideInstall = (message = "Beauty Studio is ready on your device") => {
    if (installSection) installSection.classList.add("install-installed");
    if (installActions) installActions.classList.add("install-complete");
    if (installMain) {
      installMain.hidden = true;
      installMain.setAttribute("aria-hidden", "true");
    }
    if (installBtn) installBtn.hidden = true;
    if (deviceCards) deviceCards.setAttribute("aria-hidden", "true");
    if (installStatus) {
      installStatus.textContent = message;
      installStatus.classList.add("is-complete");
    }
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
    // Keep the browser tab and its install CTA/tutorial intact. The installed
    // standalone app will hide the tutorial when it is opened.
    if (installStatus) {
      installStatus.textContent = "Beauty Studio has been added · Open the installed app to continue";
    }
    closeInstall();
  });

  installBtn?.addEventListener("click", openInstallGuide);
  installMain?.addEventListener("click", openInstallGuide);

  document.querySelectorAll("[data-close-install]").forEach(el => el.addEventListener("click", closeInstall));
  modalAction?.addEventListener("click", () => {
    // Manual browser instructions cannot reliably tell us when the shortcut
    // was actually created. Closing the guide must not hide the browser CTA.
    closeInstall();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeInstall();
  });

  // Only the installed standalone app hides the installation tutorial.
  // The normal browser page keeps the CTA, even after installation.
  if (isStandalone()) {
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

/* v28 — dynamic booking dates + explicit time selection */
(() => {
  const dateButtons = [...document.querySelectorAll(".date-choice[data-date-offset]")];
  const timeButtons = [...document.querySelectorAll(".time-grid button[data-time]")];
  const summaryDate = document.getElementById("summaryDate");
  const summaryTime = document.getElementById("summaryTime");
  if (!dateButtons.length && !timeButtons.length) return;

  const pad = n => String(n).padStart(2, "0");
  const formatDate = date => {
    const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
    const month = new Intl.DateTimeFormat(undefined, { month: "short" }).format(date);
    return { weekday, short: `${month} ${date.getDate()}`, iso: `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}` };
  };

  dateButtons.forEach((button, index) => {
    const offset = Number(button.dataset.dateOffset || index);
    const date = new Date();
    date.setHours(12,0,0,0);
    date.setDate(date.getDate() + offset);
    const formatted = formatDate(date);
    const label = button.querySelector("span");
    const sub = button.querySelector("small");
    if (offset === 0) {
      if (label) label.textContent = "Today";
    } else if (offset === 1) {
      if (label) label.textContent = "Tomorrow";
    } else if (label) {
      label.textContent = formatted.weekday;
    }
    if (sub) sub.textContent = formatted.short;
    button.dataset.date = formatted.iso;
    button.setAttribute("aria-label", `${label?.textContent || formatted.weekday}, ${formatted.short}`);
  });

  const selectDate = button => {
    dateButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (summaryDate) {
      const label = button.querySelector("span")?.textContent || "Date";
      const sub = button.querySelector("small")?.textContent || "";
      summaryDate.textContent = sub ? `${label} · ${sub}` : label;
    }
  };

  dateButtons.forEach(button => {
    button.addEventListener("click", () => selectDate(button));
  });
  if (dateButtons[0]) selectDate(dateButtons[0]);

  const selectTime = button => {
    timeButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle("selected", active);
      item.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (summaryTime) summaryTime.textContent = button.dataset.time || button.textContent.trim();
  };

  timeButtons.forEach(button => {
    button.addEventListener("click", () => selectTime(button));
  });
})();

/* v29 — booking confidence layer: inline validation, readiness state and clean reset */
(() => {
  const modal = document.getElementById("bookingModal");
  if (!modal) return;
  const nameInput = document.getElementById("guestName");
  const phoneInput = document.getElementById("guestPhone");
  const nameError = document.getElementById("guestNameError");
  const phoneError = document.getElementById("guestPhoneError");
  const ready = document.getElementById("bookingReadyNote");
  const confirm = document.getElementById("confirmBooking");
  const complete = document.getElementById("bookingComplete");
  const finalCard = document.getElementById("finalBookingCard");
  const serviceButtons = [...modal.querySelectorAll("[data-service-choice]")];
  const dateButtons = [...modal.querySelectorAll(".date-choice")];
  const timeButtons = [...modal.querySelectorAll(".time-grid button")];

  const get = id => document.getElementById(id)?.textContent?.trim() || "—";
  const hasService = () => serviceButtons.some(b => b.classList.contains("selected"));
  const hasDate = () => dateButtons.some(b => b.classList.contains("active"));
  const hasTime = () => timeButtons.some(b => b.classList.contains("selected") || b.classList.contains("active"));

  function setError(input, errorEl, message){
    if (!input || !errorEl) return;
    input.classList.toggle("is-invalid", !!message);
    input.classList.toggle("is-valid", !message && input.value.trim().length > 0);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    errorEl.textContent = message || "";
  }

  function validateName(show=true){
    const value = nameInput?.value.trim() || "";
    const message = value.length < 2 ? "Please enter your name." : "";
    if (show) setError(nameInput, nameError, message);
    return !message;
  }

  function validatePhone(show=true){
    const value = phoneInput?.value.trim() || "";
    const digits = value.replace(/\D/g, "");
    const message = digits.length < 7 ? "Please enter a valid phone number." : "";
    if (show) setError(phoneInput, phoneError, message);
    return !message;
  }

  function updateReady(){
    if (!ready) return;
    const baseReady = hasService() && hasDate() && hasTime();
    ready.classList.toggle("is-ready", baseReady);
    ready.textContent = baseReady
      ? "Everything is selected. Add your contact details and send the request."
      : "Choose your service, date and time to continue.";
  }

  [nameInput, phoneInput].forEach(input => input?.addEventListener("input", () => {
    if (input === nameInput) validateName(true);
    if (input === phoneInput) validatePhone(true);
    updateReady();
  }));

  serviceButtons.forEach(b => b.addEventListener("click", () => setTimeout(updateReady, 0)));
  dateButtons.forEach(b => b.addEventListener("click", () => setTimeout(updateReady, 0)));
  timeButtons.forEach(b => b.addEventListener("click", () => setTimeout(updateReady, 0)));

  confirm?.addEventListener("click", event => {
    const okName = validateName(true);
    const okPhone = validatePhone(true);
    if (!okName || !okPhone) {
      event.stopImmediatePropagation();
      return;
    }
    // Keep the existing completion flow, but make the final preview useful.
    requestAnimationFrame(() => {
      const ref = document.getElementById("finalBookingRef");
      const finalService = document.getElementById("finalService");
      const finalPrice = document.getElementById("finalPrice");
      const finalDate = document.getElementById("finalDate");
      const finalTime = document.getElementById("finalTime");
      if (finalService) finalService.textContent = get("summaryService");
      if (finalPrice) finalPrice.textContent = get("summaryPrice");
      if (finalDate) finalDate.textContent = get("summaryDate");
      if (finalTime) finalTime.textContent = get("summaryTime");
      if (ref && (!ref.textContent || ref.textContent === "PREVIEW")) {
        ref.textContent = "PREVIEW · READY";
      }
    });
  }, true);

  const resetBooking = () => {
    [nameInput, phoneInput].forEach(input => {
      if (!input) return;
      input.value = "";
      input.classList.remove("is-invalid", "is-valid");
      input.setAttribute("aria-invalid", "false");
    });
    if (nameError) nameError.textContent = "";
    if (phoneError) phoneError.textContent = "";
    if (ready) {
      ready.classList.remove("is-ready");
      ready.textContent = "Choose your service, date and time to continue.";
    }
  };

  modal.querySelectorAll("[data-close-booking]").forEach(el => {
    el.addEventListener("click", () => {
      setTimeout(() => {
        if (!modal.classList.contains("open")) resetBooking();
      }, 30);
    });
  });
  updateReady();
})();

/* v30 — customer content hub: one place for real studio content */
(() => {
  const cfg = window.BEAUTY_STUDIO_CONTENT || {};
  const services = cfg.services || {};
  const gallery = Array.isArray(cfg.gallery) ? cfg.gallery : [];

  const setText = (selector, value) => {
    if (value === undefined || value === null || value === "") return;
    document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  };

  // Brand / contact / footer copy.
  setText(".brand strong", cfg.studioName);
  setText(".brand small", cfg.tagline);
  setText(".mobile-menu .eyebrow", cfg.studioName);
  setText(".footer-brand strong", cfg.studioName);
  setText(".footer-brand span", cfg.tagline);
  setText("[data-studio-address]", cfg.address);
  setText("[data-studio-hours]", cfg.hours);
  setText("[data-studio-phone]", cfg.phone);
  setText("[data-studio-name]", cfg.studioName);
  setText("[data-studio-city]", cfg.city);

  document.querySelectorAll(".contact-details p").forEach(p => {
    const label = p.querySelector("strong")?.textContent?.trim().toLowerCase();
    if (label === "location" && cfg.address) p.innerHTML = `<strong>Location</strong><br>${cfg.address}`;
    if (label === "hours" && cfg.hours) p.innerHTML = `<strong>Hours</strong><br>${cfg.hours}`;
    if (label === "contact" && cfg.phone) p.innerHTML = `<strong>Contact</strong><br>${cfg.phone}`;
  });

  document.querySelectorAll("[data-studio-phone-link]").forEach(el => {
    if (cfg.phone) {
      el.href = `tel:${cfg.phone.replace(/[^\d+]/g, "")}`;
      el.textContent = cfg.phone;
    }
  });

  // Service cards + booking choices are driven from the same data.
  document.querySelectorAll(".service-card[data-service]").forEach(card => {
    const key = card.dataset.service;
    const s = services[key];
    if (!s) return;
    card.querySelector(".service-photo > span")?.replaceChildren(document.createTextNode(s.number || ""));
    card.querySelector(".service-photo > small")?.replaceChildren(document.createTextNode(s.durationShort || s.duration || ""));
    const kicker = card.querySelector(".service-kicker span:first-child");
    const number = card.querySelector(".service-kicker span:last-child");
    if (kicker) kicker.textContent = s.kicker || "Service";
    if (number) number.textContent = s.number || "";
    const title = card.querySelector("h3");
    const desc = card.querySelector(".service-info > p");
    const meta = card.querySelectorAll(".service-meta span");
    const tags = card.querySelector(".service-bottom > span");
    if (title) title.textContent = s.title;
    if (desc) desc.textContent = s.description;
    if (meta[0]) meta[0].textContent = s.price;
    if (meta[1]) meta[1].textContent = s.duration;
    if (tags) tags.textContent = s.tags || "";
  });

  document.querySelectorAll("[data-service-choice]").forEach(btn => {
    const key = btn.dataset.serviceKey;
    const s = services[key];
    if (!s) return;
    btn.dataset.serviceChoice = s.title;
    const title = btn.querySelector("span");
    const meta = btn.querySelector("small");
    if (title) title.textContent = s.title;
    if (meta) meta.textContent = `${s.price} · ${s.duration}`;
  });

  // Keep service modal content in sync with the same source of truth.
  document.querySelectorAll(".service-trigger[data-service]").forEach(card => {
    card.addEventListener("click", () => {
      const s = services[card.dataset.service];
      if (!s) return;
      const art = document.getElementById("serviceModalArt");
      if (art) art.className = `service-modal-art ${s.art || ""}`;
      setText("#serviceModalNumber", s.number);
      setText("#serviceModalDuration", s.durationShort || s.duration);
      setText("#serviceModalTitle", s.title);
      setText("#serviceModalPrice", s.price);
      setText("#serviceModalDurationText", s.duration);
      setText("#serviceModalDescription", s.description);
      const points = document.getElementById("servicePoints");
      if (points) points.innerHTML = (s.points || []).map(point => `<li>${point}</li>`).join("");
    });
  });

  // Gallery cards use the current CSS artwork but get their real content from the hub.
  const workItems = [...document.querySelectorAll(".work-item")];
  gallery.forEach((item, index) => {
    const card = workItems[index];
    if (!card) return;
    card.dataset.title = item.title || "Beauty Style";
    card.dataset.style = item.style || "";
    card.dataset.description = item.description || "";
    card.dataset.category = item.category || "simple";
    card.dataset.recommendedService = item.recommendedService || "art";
    card.dataset.styleName = item.styleName || item.title || "Beauty Style";
    const strong = card.querySelector("div:last-child strong");
    const span = card.querySelector("div:last-child span");
    if (strong) strong.textContent = item.title || "Beauty Style";
    if (span) span.textContent = item.style || "";
  });

  // Update basic document metadata without requiring a second HTML edit.
  if (cfg.studioName) {
    document.title = `${cfg.studioName} · Nails & Beauty`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = `${cfg.studioName} — thoughtful nail care, custom nail art and private appointments, made with care.`;
    const ogSite = document.querySelector('meta[property="og:site_name"]');
    if (ogSite) ogSite.content = cfg.studioName;
  }
})();


/* v31 — photo-ready gallery system
   Add a real image path to gallery[].image (for example
   assets/images/gallery/soft-pearl.jpg). Empty image values keep the
   existing editorial artwork, so the site remains launch-ready before
   real photos are available.
*/
(() => {
  const cfg = window.BEAUTY_STUDIO_CONTENT || {};
  const gallery = Array.isArray(cfg.gallery) ? cfg.gallery : [];
  const items = [...document.querySelectorAll('.work-item')];
  const modalArt = document.getElementById('modalArt');

  const applyImage = (item, data) => {
    if (!item || !data?.image) return;
    const art = item.querySelector('.work-art');
    if (!art) return;

    art.classList.add('has-photo');
    art.style.removeProperty('background-image');
    art.querySelectorAll('.gallery-photo').forEach(img => img.remove());

    const img = document.createElement('img');
    img.className = 'gallery-photo';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = data.alt || data.title || 'Beauty Studio nail design';
    img.src = data.image;
    img.addEventListener('error', () => {
      img.remove();
      art.classList.remove('has-photo');
    }, { once: true });
    art.appendChild(img);
  };

  gallery.forEach((data, index) => applyImage(items[index], data));

  // The detail modal uses the same source image when one is available.
  document.querySelectorAll('.work-trigger').forEach((item, index) => {
    item.addEventListener('click', () => {
      const data = gallery[index];
      if (!modalArt || !data?.image) return;

      modalArt.className = 'modal-art has-photo';
      modalArt.querySelectorAll('.gallery-modal-photo').forEach(img => img.remove());

      const img = document.createElement('img');
      img.className = 'gallery-modal-photo';
      img.alt = data.alt || data.title || 'Beauty Studio nail design';
      img.src = data.image;
      img.addEventListener('error', () => {
        modalArt.className = 'modal-art';
        img.remove();
      }, { once: true });
      modalArt.appendChild(img);
    }, true);
  });
})();

/* v32 — data-first gallery collection
   Gallery cards are now generated from BEAUTY_STUDIO_CONTENT.gallery.
   Add another object to the array and the customer gallery grows automatically.
   No HTML card duplication is required.
*/
(() => {
  const cfg = window.BEAUTY_STUDIO_CONTENT || {};
  const gallery = Array.isArray(cfg.gallery) ? cfg.gallery : [];
  const grid = document.getElementById('work-grid');
  const count = document.getElementById('galleryCount');
  if (!grid || !gallery.length) return;

  const oldItems = [...grid.querySelectorAll('.work-item')];
  const artClasses = oldItems.map(item => {
    const art = item.querySelector('.work-art');
    return art ? [...art.classList].find(c => /^art-/.test(c)) || 'art-1' : 'art-1';
  });

  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const createCard = (data, index) => {
    const card = document.createElement('article');
    const category = data.category || 'simple';
    card.className = `work-item work-trigger${index === 0 || index === 4 ? ' tall' : ''}`;
    if (index === 4) card.classList.add('wide');
    card.dataset.category = category;
    card.dataset.title = data.title || 'Beauty Style';
    card.dataset.style = data.style || '';
    card.dataset.description = data.description || '';
    card.dataset.recommendedService = data.recommendedService || 'art';
    card.dataset.styleName = data.styleName || data.title || 'Beauty Style';
    card.dataset.priceNote = data.priceNote || '';

    const artClass = artClasses[index] || artClasses[index % Math.max(1, artClasses.length)] || `art-${(index % 5) + 1}`;
    const photo = data.image ? `<img class="gallery-photo" loading="lazy" decoding="async" src="${escapeHTML(data.image)}" alt="${escapeHTML(data.alt || data.title || 'Beauty Studio nail design')}">` : '';
    const inner = index % 5 === 0 ? '<div class="fingers"><i></i><i></i><i></i><i></i></div>'
      : index % 5 === 1 ? '<div class="single-nail"></div>'
      : index % 5 === 2 ? '<div class="sparkle">✦</div>'
      : index % 5 === 3 ? '<div class="hearts">♡ ♡</div>'
      : '<div class="fingers long"><i></i><i></i><i></i><i></i><i></i></div>';
    card.innerHTML = `<div class="work-art ${artClass}${data.image ? ' has-photo' : ''}">${photo}${data.image ? '' : inner}</div><div><strong>${escapeHTML(data.title || 'Beauty Style')}</strong><span>${escapeHTML(data.style || '')}</span><b class="work-view">View →</b></div>`;
    return card;
  };

  grid.replaceChildren(...gallery.map(createCard));

  const updateCount = filter => {
    const visible = [...grid.querySelectorAll('.work-item')].filter(item => filter === 'all' || item.dataset.category === filter).length;
    if (count) count.textContent = `${visible} ${visible === 1 ? 'style' : 'styles'}`;
  };

  // Replace the old direct-click behavior with one delegated handler so newly
  // added works behave exactly like the original five.
  grid.addEventListener('click', event => {
    const item = event.target.closest('.work-item');
    if (!item) return;
    const modal = document.getElementById('detailModal');
    const modalArt = document.getElementById('modalArt');
    if (!modal || !modalArt) return;
    const art = item.querySelector('.work-art');
    const artClass = art ? [...art.classList].find(x => /^art-/.test(x)) : 'art-1';
    const photo = art?.querySelector('.gallery-photo');
    modalArt.className = `modal-art ${photo ? 'has-photo' : artClass || 'art-1'}`;
    modalArt.querySelectorAll('.gallery-modal-photo').forEach(img => img.remove());
    if (photo) {
      const img = document.createElement('img');
      img.className = 'gallery-modal-photo';
      img.src = photo.currentSrc || photo.src;
      img.alt = photo.alt;
      img.addEventListener('error', () => { img.remove(); modalArt.className = `modal-art ${artClass || 'art-1'}`; }, {once:true});
      modalArt.appendChild(img);
    }
    document.getElementById('modalTitle').textContent = item.dataset.title || 'Beauty Style';
    document.getElementById('modalStyle').textContent = item.dataset.style || '';
    document.getElementById('modalDescription').textContent = item.dataset.description || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
  });

  document.querySelectorAll('.filters button').forEach(button => {
    button.addEventListener('click', () => updateCount(button.dataset.filter || 'all'));
  });
  updateCount(document.querySelector('.filters button.active')?.dataset.filter || 'all');
})();

/* v33 — gallery → booking handoff
   A work detail now carries its style, recommended service and price note into
   the customer booking flow. No backend is required yet.
*/
(() => {
  const detailModal = document.getElementById('detailModal');
  const bookingModal = document.getElementById('bookingModal');
  const bookingButton = detailModal?.querySelector('.modal-actions a[href="#booking"]');
  const grid = document.getElementById('work-grid');
  if (!detailModal || !bookingModal || !bookingButton || !grid) return;

  let activeWork = null;

  const serviceMap = {
    gel: 'Gel Manicure',
    art: 'Custom Nail Art',
    extensions: 'Extensions'
  };

  const closeDetail = () => {
    detailModal.classList.remove('open');
    detailModal.setAttribute('aria-hidden', 'true');
  };

  const openBookingAtService = () => {
    if (!activeWork) return;

    const serviceKey = activeWork.dataset.recommendedService || 'art';
    const serviceChoice = document.querySelector(
      `[data-service-choice][data-service-key="${CSS.escape(serviceKey)}"]`
    );

    // Trigger the existing booking state listeners so price, duration and
    // final confirmation stay synchronized with the selected service.
    serviceChoice?.click();

    const inspiration = activeWork.dataset.styleName || activeWork.dataset.title || 'Studio Style';
    const inspirationField = document.getElementById('summaryInspiration');
    const inspirationBox = document.getElementById('bookingInspiration');
    if (inspirationField) inspirationField.textContent = inspiration;
    if (inspirationBox) inspirationBox.hidden = false;

    const note = document.getElementById('bookingSelectionNote');
    const serviceName = serviceMap[serviceKey] || activeWork.dataset.priceNote || 'Custom Nail Art';
    if (note) note.textContent = `${serviceName} · ${inspiration}`;

    const finalInspiration = document.getElementById('finalInspiration');
    if (finalInspiration) finalInspiration.textContent = inspiration;

    closeDetail();
    bookingModal.classList.add('open');
    bookingModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Service is already chosen, so continue directly to date/time selection.
    document.querySelectorAll('#bookingModal .booking-step').forEach(step => {
      step.classList.toggle('active', step.dataset.step === '2');
      step.style.display = '';
    });
    document.querySelectorAll('#bookingModal .steps span').forEach((step, index) => {
      step.classList.toggle('current', index === 1);
    });
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = '66.666%';

    // Keep the URL useful without navigating away from the current page.
    if (window.location.hash !== '#booking') {
      history.replaceState(null, '', '#booking');
    }
  };

  grid.addEventListener('click', event => {
    const card = event.target.closest('.work-item');
    if (!card) return;
    activeWork = card;
  });

  bookingButton.addEventListener('click', event => {
    event.preventDefault();
    openBookingAtService();
  });
})();


/* v34 — customer support widget */
(() => {
  const fab = document.getElementById('supportFab');
  const panel = document.getElementById('supportPanel');
  const actions = document.getElementById('supportActions');
  const note = document.getElementById('supportNote');
  if (!fab || !panel || !actions) return;

  const content = window.BEAUTY_STUDIO_CONTENT || {};
  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;',"\"":'&quot;'}[c]));
  const validPhone = value => value && !/^\+?0+$/.test(String(value).replace(/[\s()-]/g,'')) && !String(value).includes('XXX') && !String(value).includes('000 000 000');
  const links = [];

  if (validPhone(content.phone)) {
    links.push({href:`tel:${String(content.phone).replace(/[^+\d]/g,'')}`, icon:'☎', title:'Call the Studio', detail:content.phone, external:false});
  }
  if (content.whatsapp) {
    const raw = String(content.whatsapp);
    const href = /^https?:\/\//i.test(raw) ? raw : `https://wa.me/${raw.replace(/\D/g,'')}`;
    links.push({href, icon:'◌', title:'WhatsApp', detail:'Send us a message', external:true});
  }
  if (content.telegram) {
    const raw = String(content.telegram);
    const href = /^https?:\/\//i.test(raw) ? raw : `https://t.me/${raw.replace(/^@/,'')}`;
    links.push({href, icon:'➤', title:'Telegram', detail:'Chat with the Studio', external:true});
  }
  if (content.instagram) {
    links.push({href:content.instagram, icon:'◎', title:'Instagram', detail:'Message us on Instagram', external:true});
  }

  actions.innerHTML = links.map(item => `<a class="support-action" href="${escapeHTML(item.href)}"${item.external ? ' target="_blank" rel="noopener noreferrer"' : ''}><span class="support-action-main"><span class="support-action-icon" aria-hidden="true">${item.icon}</span><span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.detail)}</small></span></span><span class="support-action-arrow" aria-hidden="true">→</span></a>`).join('');
  if (content.contactIntro) {
    const copy = panel.querySelector('.support-copy');
    if (copy) copy.textContent = content.contactIntro;
  }
  if (links.length) note.textContent = 'Choose the way that feels easiest. We’ll reply as soon as we can.';

  const open = () => {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    fab.setAttribute('aria-expanded','true');
    document.body.classList.add('modal-open');
  };
  const close = () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    fab.setAttribute('aria-expanded','false');
    document.body.classList.remove('modal-open');
  };
  fab.addEventListener('click', () => panel.classList.contains('open') ? close() : open());
  panel.querySelectorAll('[data-close-support]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });
})();


/* v35 — appointment request actions */
(function () {
  const studio = window.BEAUTY_STUDIO_CONTENT || {};
  const cfg = studio.contact || studio;

  function getBookingSnapshot() {
    const state = window.BEAUTY_STUDIO_STATE || window.bookingState || {};
    return {
      service: state.serviceName || state.service || "",
      price: state.price || "",
      duration: state.duration || "",
      date: state.dateLabel || state.date || "",
      time: state.time || "",
      inspiration: state.inspiration || "",
      name: state.name || "",
      phone: state.phone || ""
    };
  }

  function buildRequestText() {
    const b = getBookingSnapshot();
    return [
      "Hello Beauty Studio, I would like to request an appointment.",
      "",
      "Service: " + (b.service || "Not selected"),
      "Price: " + (b.price || "To confirm"),
      "Duration: " + (b.duration || "To confirm"),
      "Date: " + (b.date || "Not selected"),
      "Time: " + (b.time || "Not selected"),
      "Inspiration: " + (b.inspiration || "None"),
      "Name: " + (b.name || "Not provided"),
      "Phone: " + (b.phone || "Not provided")
    ].join("\n");
  }

  window.BEAUTY_STUDIO_BUILD_REQUEST = buildRequestText;

  document.addEventListener("click", function (event) {
    const action = event.target.closest("[data-request-action]");
    if (!action) return;

    const text = buildRequestText();
    const type = action.dataset.requestAction;

    if (type === "whatsapp" && cfg.whatsapp) {
      const number = String(cfg.whatsapp).replace(/\D/g, "");
      window.open("https://wa.me/" + number + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    }

    if (type === "telegram" && cfg.telegram) {
      const handle = String(cfg.telegram).replace(/^@/, "");
      window.open("https://t.me/" + handle, "_blank", "noopener");
    }

    if (type === "call" && cfg.phone) {
      window.location.href = "tel:" + String(cfg.phone).replace(/\s+/g, "");
    }

    if (type === "copy") {
      navigator.clipboard?.writeText(text).then(() => {
        action.classList.add("is-copied");
        const original = action.textContent;
        action.textContent = "Copied";
        setTimeout(() => {
          action.textContent = original;
          action.classList.remove("is-copied");
        }, 1800);
      });
    }
  });
})();


/* v37 — business hours + booking date/time rules */
(function () {
  const studio = window.BEAUTY_STUDIO_CONTENT || {};
  const rules = studio.bookingRules || {};
  const dateButtons = [...document.querySelectorAll(".date-choice")];
  const timeGrid = document.querySelector(".time-grid");
  if (!dateButtons.length || !timeGrid) return;

  const workingDays = Array.isArray(rules.workingDays) && rules.workingDays.length
    ? rules.workingDays.map(Number)
    : [1,2,3,4,5,6];
  const slotMinutes = Number(rules.slotMinutes) || 30;
  const opening = String(rules.openingTime || "10:00");
  const closing = String(rules.closingTime || "18:00");
  const advanceDays = Math.max(0, Number(rules.advanceDays) || 30);

  const toMinutes = value => {
    const [h, m] = String(value).split(":").map(Number);
    return (h * 60) + m;
  };
  const pad = n => String(n).padStart(2, "0");
  const formatTime = mins => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  const startMinutes = toMinutes(opening);
  const endMinutes = toMinutes(closing);

  const localDate = offset => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  };

  const formatDate = d => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const weekday = d => d.toLocaleDateString(undefined, { weekday: "short" });

  function makeSlots() {
    const slots = [];
    for (let t = startMinutes; t < endMinutes; t += slotMinutes) {
      if (t + slotMinutes <= endMinutes) slots.push(formatTime(t));
    }
    return slots;
  }

  const allSlots = makeSlots();

  function renderSlots(isWorkingDay) {
    timeGrid.innerHTML = "";
    if (!isWorkingDay) {
      const note = document.createElement("div");
      note.className = "booking-closed-note";
      note.textContent = rules.closedMessage || "The Studio is closed on this day.";
      timeGrid.appendChild(note);
      return;
    }
    allSlots.forEach(time => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.time = time;
      button.textContent = time;
      timeGrid.appendChild(button);
    });
    timeGrid.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        timeGrid.querySelectorAll("button").forEach(x => x.classList.remove("selected", "active"));
        btn.classList.add("selected", "active");
        const event = new CustomEvent("beautyStudioTimeSelected", { detail: { time: btn.dataset.time } });
        document.dispatchEvent(event);
      });
    });
  }

  dateButtons.forEach((btn, index) => {
    const offset = Number(btn.dataset.dateOffset ?? index);
    const d = localDate(offset);
    const isWorking = workingDays.includes(d.getDay() || 7);
    const dateLabel = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : weekday(d);
    const small = btn.querySelector("small");
    const span = btn.querySelector("span");
    if (span) span.textContent = dateLabel;
    if (small) small.textContent = formatDate(d);
    btn.dataset.date = `${dateLabel} · ${formatDate(d)}`;
    btn.dataset.isoDate = d.toISOString().slice(0,10);
    btn.dataset.working = String(isWorking);
    btn.disabled = !isWorking || offset > advanceDays;
    btn.title = btn.disabled ? (rules.closedMessage || "Unavailable") : btn.dataset.date;
  });

  const refreshFromSelectedDate = () => {
    const active = document.querySelector(".date-choice.active") || dateButtons.find(b => !b.disabled);
    if (!active) return;
    renderSlots(active.dataset.working === "true");
    if (active.disabled) return;
  };

  dateButtons.forEach(btn => btn.addEventListener("click", () => {
    if (btn.disabled) return;
    setTimeout(refreshFromSelectedDate, 0);
  }));

  // Replace the initial hard-coded preview times with rule-driven slots.
  const firstAvailable = dateButtons.find(btn => !btn.disabled);
  if (firstAvailable) {
    dateButtons.forEach(x => x.classList.remove("active"));
    firstAvailable.classList.add("active");
    refreshFromSelectedDate();
  }
})();

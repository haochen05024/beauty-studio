/* v91 — polished stable build
 * Accessibility, keyboard, live-region and language-safe UI refinements.
 */

/* v76 — live D1 booking controller: date switching, slot rules, custom calendar sync */
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
      number:"01", kicker:"Everyday", duration:"60 MIN", durationText:"60 min",
      title:"Gel Manicure", price:"From 00 MMK",
      description:"A clean, polished finish designed to stay beautiful through everyday life — simple, refined and easy to wear.",
      art:"photo-blush",
      caption:"Natural beauty, lasting glow.", photoCount:"Beauty Studio · 01 / 03",
      highlights:[["Care","Prep & shaping"],["Finish","Clean & polished"],["Feel","Made for you"]],
      ideal:"Everyday wear",
      points:["Nail preparation & shaping","Gel color application","Clean finish & care"]
    },
    art: {
      number:"02", kicker:"Signature", duration:"90 MIN", durationText:"90 min",
      title:"Custom Nail Art", price:"From 00 MMK",
      description:"Bring an idea, a color, or simply a mood. We turn it into a design that feels like yours — with thoughtful details from base to finish.",
      art:"photo-nude",
      caption:"Your mood, made personal.", photoCount:"Beauty Studio · 02 / 03",
      highlights:[["Base","Manicure included"],["Design","Color & detail"],["Plan","Design consultation"]],
      ideal:"Custom looks · creative days",
      points:["Base manicure included","Custom color & detail","Design consultation"]
    },
    extensions: {
      number:"03", kicker:"Length", duration:"120 MIN", durationText:"120 min",
      title:"Extensions", price:"From 00 MMK",
      description:"Beautiful length and shape tailored to your hands, with a comfortable, refined finish that feels balanced from every angle.",
      art:"photo-rose",
      caption:"Length, shaped beautifully.", photoCount:"Beauty Studio · 03 / 03",
      highlights:[["Shape","Tailored to you"],["Length","Balanced extension"],["Finish","Refined & clean"]],
      ideal:"Longer looks · special occasions",
      points:["Shape consultation","Extension application","Finish & aftercare guidance"]
    }
  };

  document.querySelectorAll(".service-trigger").forEach(item => {
    item.addEventListener("click", () => {
      const s = services[item.dataset.service];
      if (!s) return;

      const art = document.getElementById("serviceModalArt");
      const artClass = s.art || "photo-blush";
      art.className = "service-modal-art " + artClass;

      // New D1 services may not have a media asset yet. Keep the editorial
      // panel polished instead of showing the decorative placeholder oval.
      art.style.background = "";
      if (s.image) {
        art.style.backgroundImage = `linear-gradient(180deg, rgba(34,25,21,.03), rgba(34,25,21,.34)), url("${String(s.image).replace(/"/g, '\"')}")`;
        art.style.backgroundSize = "cover";
        art.style.backgroundPosition = "center";
      } else if (!["photo-blush","photo-rose","photo-nude"].includes(artClass)) {
        art.style.background = "linear-gradient(145deg,#ead8d0,#b99084)";
      }

      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value == null ? "" : String(value);
      };

      setText("serviceModalNumber", s.number || "");
      setText("serviceModalDuration", s.duration ? `${s.duration} MIN` : "");
      setText("serviceModalCaption", s.caption || "Made with care.");
      setText("serviceModalPhotoCount", s.photoCount || "Beauty Studio");
      setText("serviceModalKicker", String(s.kicker || "Service").toLowerCase() === "service" ? "" : s.kicker);
      setText("serviceModalTitle", s.title || s.name || "Service");
      setText("serviceModalPrice", s.price || "Price on request");
      setText("serviceModalDurationText", s.duration ? `${s.duration} min` : "");
      setText("serviceModalDescription", s.description || "A personalized service tailored to your preferred look.");
      setText("serviceIdealFor", s.ideal || "Personalized care");

      const highlights = document.getElementById("serviceHighlights");
      const highlightItems = Array.isArray(s.highlights) && s.highlights.length
        ? s.highlights
        : String(s.tags || "").split(",").map(x => x.trim()).filter(Boolean).slice(0,3).map(x => [x, "Studio detail"]);
      if (highlights) {
        highlights.innerHTML = highlightItems.map(x => {
          const pair = Array.isArray(x) ? x : [x, "Studio detail"];
          return `<div><span>✦</span><strong>${escapeHtml(pair[0])}</strong><small>${escapeHtml(pair[1] || "")}</small></div>`;
        }).join("");
        highlights.hidden = highlightItems.length === 0;
      }

      const points = document.getElementById("servicePoints");
      const pointItems = Array.isArray(s.points) && s.points.length
        ? s.points
        : String(s.tags || "").split(",").map(x => x.trim()).filter(Boolean);
      if (points) {
        points.innerHTML = pointItems.map(x => `<li>${escapeHtml(x)}</li>`).join("");
        points.hidden = pointItems.length === 0;
      }

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
    gel: { title:"Gel Manicure", price:"From 00 MMK", duration:"60 min", durationShort:"60 MIN", number:"01", kicker:"Everyday", art:"photo-blush", image:"https://images.unsplash.com/photo-1754799670380-17640d939e32?auto=format&fit=crop&fm=jpg&q=82&w=1400", caption:"Natural beauty, lasting glow.", idealFor:"Everyday wear · special moments", highlights:[["Care","Prep & shaping"],["Finish","Clean & polished"],["Feel","Made for you"]] },
    art: { title:"Custom Nail Art", price:"From 00 MMK", duration:"90 min", durationShort:"90 MIN", number:"02", kicker:"Signature", art:"photo-rose", image:"https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&fm=jpg&q=82&w=1400", caption:"Your mood, made into detail.", idealFor:"Custom looks · creative days", highlights:[["Base","Manicure included"],["Design","Color & detail"],["Plan","Design consultation"]] },
    extensions: { title:"Extensions", price:"From 00 MMK", duration:"120 min", durationShort:"120 MIN", number:"03", kicker:"Length", art:"photo-nude", image:"https://images.unsplash.com/photo-1772322586649-fc11154e76b9?auto=format&fit=crop&fm=jpg&q=82&w=1400", caption:"Long, refined and beautifully yours.", idealFor:"Length lovers · statement sets", highlights:[["Shape","Consultation"],["Length","Extension application"],["Care","Aftercare guidance"]] }
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

  // Keep the Contact markup and its explicit element IDs intact.
  // The D1 publishing layer updates #contactAddress / #contactHours / #contactPhone
  // later in applyBrand(). Replacing the whole <p> here would remove those IDs.

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
      setText("#serviceModalKicker", s.kicker || "Beauty Studio");
      setText("#serviceModalCaption", s.caption || "Made with care.");
      setText("#serviceModalPhotoCount", `Beauty Studio · ${s.number || "01"} / 03`);
      setText("#serviceIdealFor", s.idealFor || "Everyday wear");
      if (art) {
        art.style.backgroundImage = s.image ? `url("${s.image}")` : "";
      }
      const highlights = document.getElementById("serviceHighlights");
      if (highlights) {
        const rows = Array.isArray(s.highlights) ? s.highlights : [];
        highlights.innerHTML = rows.map(row => `<div><span>✦</span><strong>${row[0] || ""}</strong><small>${row[1] || ""}</small></div>`).join("");
      }
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
    const info = card.querySelector("div:last-child");
    const strong = info?.querySelector("strong");
    const span = info?.querySelector("span");
    if (strong) strong.textContent = item.title || "Beauty Style";
    if (span) span.textContent = item.style || "";
    if (info) {
      let reco = info.querySelector(".work-reco");
      if (!reco) {
        reco = document.createElement("small");
        reco.className = "work-reco";
        info.appendChild(reco);
      }
      const serviceTitle = cfg.services?.[item.recommendedService]?.title || "Custom Nail Art";
      reco.textContent = `Recommended · ${serviceTitle}`;
    }
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
    const workItems = Array.from(grid.querySelectorAll('.work-item'));
    const workData = window.BEAUTY_STUDIO_CONTENT?.gallery?.[workItems.indexOf(item)];
    if(workData){
      const setWork=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v||''};
      const L=window.__beautyStudioGetLanguage?.()||'en';
      const pickWork=(base,fallback='')=>{const suffixes=L==='zh'?['Zh','_zh','CN','_cn']:L==='my'?['My','_my','Mm','_mm']:[];for(const x of suffixes){const k=base+x;if(workData[k]!=null&&String(workData[k]).trim())return String(workData[k]);}return String(workData[base]??fallback);};
      setWork('modalWorkNumber',workData.number||String(workItems.indexOf(item)+1).padStart(2,'0'));
      setWork('modalMood',pickWork('mood',''));
      const rec=workData.recommendedService ? (window.BEAUTY_STUDIO_CONTENT?.services||{})[workData.recommendedService] : null;
      if(rec){const suffixes=L==='zh'?['Zh','_zh']:L==='my'?['My','_my']:[];let title=rec.title||rec.name||'Custom Nail Art';for(const x of suffixes){if(rec['title'+x]){title=rec['title'+x];break;}}setWork('modalRecommended',title);}
      setWork('modalNote',pickWork('note','Love this look? Bring it as inspiration and the studio can fine-tune the details for you.'));
    }
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


/* v74 — persistent Need Help chat
   One conversation per persistent customer identity. */
(() => {
  const API_BASE='https://beauty-studio-api.haochen05024.workers.dev';
  const KEY='beauty_studio_customer_key';
  const fab=document.getElementById('supportFab'), panel=document.getElementById('supportPanel');
  const messagesEl=document.getElementById('supportMessages'), form=document.getElementById('supportCompose');
  const input=document.getElementById('supportMessageInput'), send=document.getElementById('supportSendButton');
  const badge=document.getElementById('supportUnreadBadge'), customerId=document.getElementById('supportCustomerId');
  const statusText=document.getElementById('supportStatusText'), quick=document.getElementById('supportQuickActions');
  if(!fab||!panel||!messagesEl||!form)return;
  const content=window.BEAUTY_STUDIO_CONTENT||{};
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const getKey=()=>{try{return localStorage.getItem(KEY)||''}catch{return ''}};
  let conversation=null, polling=null, busy=false;

  const inject=()=>{
    if(document.getElementById('supportChatStyles'))return;
    const st=document.createElement('style');st.id='supportChatStyles';st.textContent=`
      .support-fab{position:fixed;right:24px;bottom:22px;z-index:10025;display:flex;align-items:center;gap:10px;border:1px solid rgba(125,91,79,.14);border-radius:999px;padding:10px 16px 10px 11px;background:rgba(255,250,246,.97);color:#302621;box-shadow:0 14px 36px rgba(55,35,28,.16);backdrop-filter:blur(12px);cursor:pointer;transition:.2s ease}.support-fab:hover{transform:translateY(-2px);box-shadow:0 18px 42px rgba(55,35,28,.2)}.support-fab-icon{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#f2e4dc;font-size:18px}.support-fab-label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.support-unread-badge{position:absolute;right:-2px;top:-5px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#9b6c69;color:#fff;font:700 10px/19px Arial,sans-serif;text-align:center;border:2px solid #fffaf6}.support-panel{position:fixed;inset:0;z-index:10040;display:none}.support-panel.open{display:block}.support-panel-backdrop{position:absolute;inset:0;background:rgba(48,38,33,.25);backdrop-filter:blur(4px)}.support-chat-card{position:absolute;right:24px;bottom:82px;width:min(430px,calc(100vw - 32px));height:min(650px,calc(100vh - 120px));display:flex;flex-direction:column;background:#fffaf6;border:1px solid rgba(125,91,79,.16);border-radius:26px;box-shadow:0 28px 80px rgba(55,35,28,.23);overflow:hidden}.support-chat-card .support-head{padding:22px 22px 15px;border-bottom:1px solid rgba(125,91,79,.11);display:flex;justify-content:space-between;gap:15px}.support-chat-card .support-head h2{margin:3px 0 3px;font:500 27px Georgia,serif;color:#302621}.support-customer-id{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:#a17870}.support-status-row{display:flex;align-items:center;gap:7px;padding:9px 22px;background:#f7eee8;color:#81746d;font-size:11px}.support-status-dot{width:7px;height:7px;border-radius:50%;background:#9db48d;box-shadow:0 0 0 4px rgba(157,180,141,.13)}.support-messages{flex:1;overflow:auto;padding:18px 18px 12px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,#fffaf6,#fbf4ef)}.support-chat-empty{margin:auto;text-align:center;max-width:260px;color:#988980;font-size:12px;line-height:1.7}.support-message{max-width:82%;padding:11px 13px;border-radius:17px;display:grid;gap:4px}.support-message.customer{align-self:flex-end;background:#302621;color:#fffaf6;border-bottom-right-radius:5px}.support-message.admin{align-self:flex-start;background:#f1e4dc;color:#302621;border-bottom-left-radius:5px}.support-message small{font-size:9px;opacity:.68;letter-spacing:.07em}.support-message p{margin:0;font-size:13px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}.support-compose{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(125,91,79,.11);background:#fffaf6}.support-compose textarea{flex:1;min-width:0;resize:none;border:1px solid #dfd1c8;border-radius:15px;background:#fff;padding:11px 12px;color:#302621;font:inherit;font-size:12px;outline:none}.support-compose textarea:focus{border-color:#b88b80;box-shadow:0 0 0 3px rgba(184,139,128,.1)}.support-compose button{border:0;border-radius:15px;background:#302621;color:#fff;padding:0 15px;font-size:11px;font-weight:700;cursor:pointer}.support-compose button:disabled{opacity:.55;cursor:default}.support-quick-actions{display:flex;gap:7px;flex-wrap:wrap;padding:0 14px 10px}.support-quick-actions a{font-size:10px;text-decoration:none;color:#765b52;border:1px solid #dfd1c8;background:#f8eee8;border-radius:999px;padding:7px 10px}.support-chat-card .support-note{margin:0;padding:0 18px 14px;text-align:center;color:#a18d84;font-size:9px;letter-spacing:.06em}.support-close{flex:0 0 auto}.support-card .support-head .eyebrow{margin:0}.support-card .support-close{width:34px;height:34px;border:1px solid #dfd1c8;border-radius:50%;background:#f5ebe5;color:#5f514b;font-size:21px;cursor:pointer}@media(max-width:640px){.support-fab{right:18px;bottom:16px;padding:8px 12px 8px 9px}.support-fab-icon{width:31px;height:31px}.support-chat-card{right:10px;bottom:74px;width:calc(100vw - 20px);height:min(690px,calc(100vh - 94px));border-radius:23px}.support-chat-card .support-head{padding:18px 17px 13px}.support-status-row{padding:8px 17px}.support-messages{padding:15px 13px 10px}.support-message{max-width:88%}}
    `;document.head.appendChild(st);
  };
  const fmt=t=>{try{return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(t))}catch{return ''}};
  const setBadge=n=>{const v=Number(n||0);badge.textContent=v>99?'99+':String(v);badge.hidden=v<=0};
  const render=items=>{
    const rows=Array.isArray(items)?items:[];
    if(!rows.length){messagesEl.innerHTML='<div class="support-chat-empty">Ask us anything about services, designs or your appointment.<br><br>We’ll keep your conversation here after refresh.</div>';return}
    messagesEl.innerHTML=rows.map(m=>`<article class="support-message ${m.sender_type==='admin'?'admin':'customer'}"><small>${m.sender_type==='admin'?'Beauty Studio':'You'} · ${esc(fmt(m.created_at))}</small><p>${esc(m.message)}</p></article>`).join('');
    messagesEl.scrollTop=messagesEl.scrollHeight;
  };
  async function ensure(){
    const key=getKey();if(!key)return false;
    try{
      const r=await fetch(`${API_BASE}/api/support/conversation`,{headers:{Accept:'application/json','x-customer-key':key},cache:'no-store'});const b=await r.json();
      if(!r.ok||!b?.ok)return false;conversation=b.conversation;customerId.textContent=`Customer ${b.customerNumber||'—'}`;render(b.messages||[]);setBadge(Number(b.conversation?.unread_customer||0));
      statusText.textContent=b.conversation?.status==='closed'?'Conversation closed · You can start a new message anytime.':'We usually reply as soon as we can.';return true;
    }catch{return false}
  }
  async function sendMessage(e){e.preventDefault();if(busy)return;const message=input.value.trim();if(!message)return;const key=getKey();if(!key)return;
    busy=true;send.disabled=true;input.disabled=true;
    try{const r=await fetch(`${API_BASE}/api/support/messages`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','x-customer-key':key},body:JSON.stringify({message})});const b=await r.json();if(!r.ok||!b?.ok){statusText.textContent=b?.error||'Could not send. Please try again.';return}input.value='';await ensure();}
    catch{statusText.textContent='Connection issue · please try again.'}
    finally{busy=false;send.disabled=false;input.disabled=false;input.focus()}
  }
  const open=async()=>{
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    fab.setAttribute('aria-expanded','true');
    document.body.classList.add('modal-open');
    await ensure();
    const key=getKey();
    if(key){
      try{
        await fetch(`${API_BASE}/api/support/read`,{method:'POST',headers:{'Accept':'application/json','x-customer-key':key}});
      }catch{}
      setBadge(0);
    }
    input.focus();
  };
  const close=()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true');fab.setAttribute('aria-expanded','false');document.body.classList.remove('modal-open');};
  const buildQuick=()=>{const items=[];if(content.phone&&content.phone!=='+00 000 000 000')items.push(`<a href="tel:${String(content.phone).replace(/[^+\d]/g,'')}">Call studio</a>`);if(content.whatsapp)items.push(`<a target="_blank" rel="noopener" href="${esc(/^https?:\/\//i.test(content.whatsapp)?content.whatsapp:`https://wa.me/${String(content.whatsapp).replace(/\D/g,'')}`)}">WhatsApp</a>`);quick.innerHTML=items.join('');};
  fab.addEventListener('click',()=>panel.classList.contains('open')?close():open());
  panel.querySelectorAll('[data-close-support]').forEach(x=>x.addEventListener('click',close));
  form.addEventListener('submit',sendMessage);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  inject();buildQuick();
  (async()=>{for(let i=0;i<12&&!getKey();i++)await new Promise(r=>setTimeout(r,350));await ensure();polling=setInterval(async()=>{if(!document.hidden)await ensure()},15000)})();
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
    // The final D1 booking controller owns the live slots once rules arrive.
    if (window.__beautyStudioBookingRulesFinal) return;
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


/* v38 — booking date picker + dynamic time progression
   Fixes v37 dynamic time buttons not advancing to step 3.
*/
(function () {
  const modal = document.getElementById("bookingModal");
  if (!modal) return;

  const steps = [...modal.querySelectorAll(".booking-step")];
  const dots = [...modal.querySelectorAll("[data-progress]")];
  const fill = document.getElementById("progressFill");
  const dateButtons = [...modal.querySelectorAll(".date-choice")];
  const customDateButton = modal.querySelector("[data-date-custom]");
  const customDateInput = document.getElementById("customBookingDate");
  const summaryDate = document.getElementById("summaryDate");
  const summaryTime = document.getElementById("summaryTime");
  const readyNote = document.getElementById("bookingReadyNote");

  const studio = window.BEAUTY_STUDIO_CONTENT || {};
  const rules = studio.bookingRules || {};
  const workingDays = Array.isArray(rules.workingDays) && rules.workingDays.length
    ? rules.workingDays.map(Number) : [1,2,3,4,5,6];
  const advanceDays = Math.max(0, Number(rules.advanceDays) || 30);
  const closedMessage = rules.closedMessage || "The Studio is closed on this day.";

  function setStep(step) {
    steps.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === step));
    dots.forEach(d => d.classList.toggle("current", Number(d.dataset.progress) === step));
    if (fill) fill.style.width = `${step / 3 * 100}%`;
  }

  function localDateFromIso(iso) {
    const [y,m,d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isoFromDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  }

  function formatCustomDate(date) {
    return date.toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric"
    });
  }

  function selectDateButton(button, label, iso) {
    dateButtons.forEach(x => x.classList.remove("active"));
    button.classList.add("active");
    button.dataset.date = label;
    button.dataset.isoDate = iso;
    if (summaryDate) summaryDate.textContent = label;
  }

  // The third date card is an actual date picker instead of a fixed weekday.
  if (customDateButton && customDateInput) {
    customDateButton.addEventListener("click", () => {
      const now = new Date();
      const todayIso = isoFromDate(now);
      const max = new Date(now);
      max.setDate(max.getDate() + advanceDays);
      customDateInput.min = todayIso;
      customDateInput.max = isoFromDate(max);

      if (typeof customDateInput.showPicker === "function") {
        try { customDateInput.showPicker(); } catch (_) { customDateInput.click(); }
      } else {
        customDateInput.click();
      }
    });

    customDateInput.addEventListener("change", () => {
      const iso = customDateInput.value;
      const date = localDateFromIso(iso);
      if (!date) return;

      const day = date.getDay() === 0 ? 7 : date.getDay();
      if (!workingDays.includes(day)) {
        customDateButton.classList.remove("is-custom-selected");
        if (readyNote) readyNote.textContent = closedMessage;
        return;
      }

      customDateButton.classList.add("is-custom-selected");
      const label = formatCustomDate(date);
      const span = customDateButton.querySelector("span");
      const small = customDateButton.querySelector("small");
      if (span) span.textContent = "Selected";
      if (small) small.textContent = label;
      selectDateButton(customDateButton, label, iso);
      if (readyNote) readyNote.textContent = "Date selected. Pick an available time to continue.";
    });
  }

  // v37 rebuilds .time-grid dynamically, so listen at the container level.
  const timeGrid = modal.querySelector(".time-grid");
  if (timeGrid) {
    timeGrid.addEventListener("click", event => {
      const button = event.target.closest("button[data-time]");
      if (!button || button.disabled) return;

      timeGrid.querySelectorAll("button").forEach(x => x.classList.remove("selected", "active"));
      button.classList.add("selected", "active");

      const time = button.dataset.time || button.textContent.trim();
      if (summaryTime) summaryTime.textContent = time;

      // This is the missing transition in v37.
      setStep(3);
      if (readyNote) readyNote.textContent = "Everything is selected. Add your contact details and send the request.";
    });
  }
})();

/* v39 — custom in-site calendar for the booking date picker */
(function () {
  const modal = document.getElementById("bookingModal");
  const trigger = modal?.querySelector("[data-date-custom]");
  if (!modal || !trigger) return;

  const studio = window.BEAUTY_STUDIO_CONTENT || {};
  const rules = studio.bookingRules || {};
  const fallbackWorkingDays = Array.isArray(rules.workingDays) && rules.workingDays.length
    ? rules.workingDays.map(Number) : [1,2,3,4,5,6];
  const fallbackAdvanceDays = Math.max(0, Number(rules.advanceDays) || 30);
  const liveRules = () => window.__beautyStudioBookingRulesFinal || window.BEAUTY_STUDIO_CONTENT?.bookingRules || rules;
  const workingDays = () => {
    const value = liveRules().workingDays;
    return Array.isArray(value) && value.length ? value.map(Number) : fallbackWorkingDays;
  };
  const advanceDays = () => Math.max(0, Number(liveRules().advanceDays) || fallbackAdvanceDays);
  const customInput = document.getElementById("customBookingDate");
  const summaryDate = document.getElementById("summaryDate");
  const note = document.getElementById("bookingReadyNote");

  function iso(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }
  function startToday() { const d = new Date(); d.setHours(12,0,0,0); return d; }
  function maxDate() { const d = startToday(); d.setDate(d.getDate() + advanceDays()); return d; }
  function parseIso(value) { const [y,m,d] = value.split("-").map(Number); return new Date(y,m-1,d,12); }
  function sameDay(a,b) { return iso(a) === iso(b); }
  function monthLabel(date) { return date.toLocaleDateString(undefined,{month:"long",year:"numeric"}); }
  function selectedLabel(date) { return date.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}); }

  let view = startToday();
  let selected = null;
  const minDate = () => startToday();
  const maxDateValue = () => maxDate();

  const overlay = document.createElement("div");
  overlay.className = "bs-calendar-overlay";
  overlay.setAttribute("aria-hidden","true");
  overlay.innerHTML = `
    <div class="bs-calendar" role="dialog" aria-modal="true" aria-labelledby="bsCalendarTitle">
      <div class="bs-calendar-head">
        <div>
          <span class="bs-calendar-kicker">Choose your date</span>
          <h3 class="bs-calendar-title" id="bsCalendarTitle"></h3>
        </div>
        <button class="bs-calendar-close" type="button" aria-label="Close date picker">×</button>
      </div>
      <div class="bs-calendar-body">
        <div class="bs-calendar-nav" style="justify-content:flex-end;margin-bottom:12px">
          <button type="button" data-cal-prev aria-label="Previous month">‹</button>
          <button type="button" data-cal-next aria-label="Next month">›</button>
        </div>
        <div class="bs-calendar-week" aria-hidden="true">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        <div class="bs-calendar-grid" role="grid"></div>
        <div class="bs-calendar-footer">
          <span class="bs-calendar-note">Choose a working day within the available booking window.</span>
          <button class="bs-calendar-cancel" type="button">Cancel</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const title = overlay.querySelector(".bs-calendar-title");
  const grid = overlay.querySelector(".bs-calendar-grid");
  const prev = overlay.querySelector("[data-cal-prev]");
  const next = overlay.querySelector("[data-cal-next]");
  const close = overlay.querySelector(".bs-calendar-close");
  const cancel = overlay.querySelector(".bs-calendar-cancel");

  function render() {
    title.textContent = monthLabel(view);
    grid.innerHTML = "";
    const first = new Date(view.getFullYear(),view.getMonth(),1,12);
    const last = new Date(view.getFullYear(),view.getMonth()+1,0,12);
    const leading = first.getDay();
    const cells = Math.ceil((leading + last.getDate()) / 7) * 7;
    for (let i=0;i<cells;i++) {
      const d = new Date(view.getFullYear(),view.getMonth(),i-leading+1,12);
      const button = document.createElement("button");
      button.type="button";
      button.className="bs-calendar-day";
      button.textContent=d.getDate();
      button.setAttribute("aria-label", d.toLocaleDateString(undefined,{weekday:"long",year:"numeric",month:"long",day:"numeric"}));
      if (d.getMonth() !== view.getMonth()) button.classList.add("is-outside");
      const min = minDate();
      const max = maxDateValue();
      const inRange = d >= min && d <= max;
      const day = d.getDay() === 0 ? 7 : d.getDay();
      const openDay = workingDays().includes(day);
      if (!openDay) button.classList.add("is-closed");
      if (sameDay(d,minDate())) button.classList.add("is-today");
      if (selected && sameDay(d,selected)) button.classList.add("is-selected");
      button.disabled = !inRange || !openDay;
      button.addEventListener("click",()=>choose(d));
      grid.appendChild(button);
    }
    const monthStart = new Date(view.getFullYear(),view.getMonth(),1,12);
    const monthEnd = new Date(view.getFullYear(),view.getMonth(),last.getDate(),12);
    prev.disabled = monthEnd < minDate();
    next.disabled = monthStart > new Date(maxDateValue().getFullYear(),maxDateValue().getMonth(),1,12);
  }

  function open() {
    const current = customInput?.value;
    selected = current ? parseIso(current) : null;
    view = selected ? new Date(selected.getFullYear(),selected.getMonth(),1,12) : new Date(minDate().getFullYear(),minDate().getMonth(),1,12);
    render();
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden","false");
    close.focus();
  }
  function hide() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden","true");
    trigger.focus();
  }
  function choose(date) {
    selected = new Date(date);
    const value = iso(selected);
    if (customInput) customInput.value = value;
    const span = trigger.querySelector("span");
    const small = trigger.querySelector("small");
    if (span) span.textContent = "Selected";
    if (small) small.textContent = selectedLabel(selected);
    trigger.classList.add("is-custom-selected","active");
    modal.querySelectorAll(".date-choice").forEach(x => { if (x !== trigger) x.classList.remove("active"); });
    if (summaryDate) summaryDate.textContent = selectedLabel(selected);
    if (note) note.textContent = "Date selected. Pick an available time to continue.";
    if (typeof window.__beautyStudioHandleBookingDate === "function") {
      window.__beautyStudioHandleBookingDate(selected);
    }
    hide();
  }

  trigger.addEventListener("click", event => { event.preventDefault(); open(); });
  prev.addEventListener("click",()=>{ view.setMonth(view.getMonth()-1); render(); });
  next.addEventListener("click",()=>{ view.setMonth(view.getMonth()+1); render(); });
  close.addEventListener("click",hide);
  cancel.addEventListener("click",hide);
  overlay.addEventListener("click",e=>{ if(e.target===overlay) hide(); });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape" && overlay.classList.contains("open")) hide(); });
})();


/* v46 — premium gallery work-detail presentation */
(() => {
  const grid = document.getElementById('work-grid');
  const modal = document.getElementById('detailModal');
  if (!grid || !modal) return;
  const cfg = window.BEAUTY_STUDIO_CONTENT || {};
  const gallery = Array.isArray(cfg.gallery) ? cfg.gallery : [];
  const services = cfg.services || {};
  const titleEl = document.getElementById('modalTitle');
  const styleEl = document.getElementById('modalStyle');
  const moodEl = document.getElementById('modalMood');
  const recoEl = document.getElementById('modalRecommended');
  const numberEl = document.getElementById('modalWorkNumber');
  const modalArt = document.getElementById('modalArt');

  const moodMap = {
    simple: 'Clean & effortless',
    elegant: 'Soft & polished',
    trendy: 'Modern & expressive',
    cute: 'Sweet & playful'
  };

  const sync = item => {
    if (!item) return;
    const index = [...grid.querySelectorAll('.work-item')].indexOf(item);
    const data = gallery[index] || {};
    const category = item.dataset.category || data.category || 'simple';
    if (numberEl) numberEl.textContent = String(index + 1).padStart(2, '0');
    if (titleEl) titleEl.textContent = item.dataset.title || data.title || 'Beauty Style';
    if (styleEl) styleEl.textContent = item.dataset.style || data.style || '';
    if (moodEl) moodEl.textContent = moodMap[category] || 'Made for you';
    const serviceKey = item.dataset.recommendedService || data.recommendedService || 'art';
    if (recoEl) recoEl.textContent = services[serviceKey]?.title || 'Custom Nail Art';
    if (modalArt) {
      const photo = item.querySelector('.gallery-photo');
      modalArt.setAttribute('data-photo-label', `${String(index + 1).padStart(2,'0')} / ${Math.max(gallery.length, 5).toString().padStart(2,'0')}`);
    }
  };

  grid.addEventListener('click', e => {
    const item = e.target.closest('.work-item');
    if (item) sync(item);
  }, true);

  // Add editorial index labels to generated cards without changing their data model.
  const decorate = () => {
    grid.querySelectorAll('.work-item').forEach((item, i) => {
      item.dataset.workNumber = String(i + 1).padStart(2, '0');
      const art = item.querySelector('.work-art');
      if (art && !art.querySelector('.work-index')) {
        const badge = document.createElement('span');
        badge.className = 'work-index';
        badge.textContent = String(i + 1).padStart(2, '0');
        art.appendChild(badge);
      }
    });
  };
  decorate();
  setTimeout(decorate, 120);
})();


/* v56 — public D1 content bridge
   Customer site reads published content from the Beauty Studio API.
   Static HTML content remains the safe fallback if D1 is empty/unavailable.
*/
(() => {
  const API_BASE = "https://beauty-studio-api.haochen05024.workers.dev";
  const cfg = window.BEAUTY_STUDIO_CONTENT || {};
  const fallbackServices = cfg.services || {};
  const fallbackGallery = Array.isArray(cfg.gallery) ? cfg.gallery : [];

  const get = async (path) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: { "Accept": "application/json" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      return body;
    } finally {
      clearTimeout(timer);
    }
  };

  const text = (el, value) => {
    if (el && value !== undefined && value !== null && value !== "") el.textContent = String(value);
  };

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  const serviceKey = (service, index) => {
    const raw = String(service?.id ?? service?.key ?? "").trim().toLowerCase();
    if (raw) return raw;
    const name = String(service?.name ?? service?.title ?? "").toLowerCase();
    if (name.includes("extension")) return "extensions";
    if (name.includes("art")) return "art";
    if (name.includes("gel") || name.includes("manicure")) return "gel";
    return `service-${index + 1}`;
  };

  const mergeServices = (remote) => {
    if (!Array.isArray(remote) || !remote.length) return false;

    const next = {};
    remote.forEach((item, index) => {
      const key = serviceKey(item, index);
      const fallback = fallbackServices[key] || {};
      next[key] = {
        ...fallback,
        ...item,
        id: item.id ?? fallback.id ?? key,
        title: item.title ?? item.name ?? fallback.title ?? key,
        titleZh: item.titleZh ?? item.nameZh ?? fallback.titleZh ?? fallback.nameZh ?? "",
        titleMy: item.titleMy ?? item.nameMy ?? fallback.titleMy ?? fallback.nameMy ?? "",
        description: item.description ?? fallback.description ?? "",
        descriptionZh: item.descriptionZh ?? fallback.descriptionZh ?? "",
        descriptionMy: item.descriptionMy ?? fallback.descriptionMy ?? "",
        price: item.price ?? fallback.price ?? "",
        duration: item.duration ?? fallback.duration ?? "",
        durationShort: item.durationShort ?? fallback.durationShort ?? (item.duration ? `${item.duration} MIN` : ""),
        number: item.number ?? fallback.number ?? String(index + 1).padStart(2, "0"),
        kicker: item.kicker ?? fallback.kicker ?? "Service",
        tags: item.tags ?? fallback.tags ?? "",
        art: item.art ?? fallback.art ?? ["photo-blush","photo-rose","photo-nude"][index % 3],
        points: item.points ?? fallback.points ?? [],
        highlights: item.highlights ?? fallback.highlights ?? [],
        image: item.image || fallback.image || ""
      };
    });

    // Mutate the existing object so the site's existing modal/booking closures
    // keep using the latest data reference.
    Object.keys(cfg.services || {}).forEach(k => delete cfg.services[k]);
    Object.assign(cfg.services, next);
    return true;
  };

  const galleryFallbackById = new Map(fallbackGallery.map((item, i) => [String(item.id ?? i + 1), item]));

  const mergeGallery = (remote) => {
    if (!Array.isArray(remote) || !remote.length) return false;

    const next = remote.map((item, index) => {
      const fallback = galleryFallbackById.get(String(item.id ?? index + 1)) || fallbackGallery[index] || {};
      return {
        ...fallback,
        ...item,
        id: item.id ?? fallback.id ?? index + 1,
        title: item.title ?? fallback.title ?? "Beauty Style",
        style: item.style ?? fallback.style ?? `${item.category || fallback.category || "Beauty"}`,
        category: String(item.category ?? fallback.category ?? "simple").toLowerCase(),
        description: item.description ?? fallback.description ?? "",
        recommendedService: item.recommendedService ?? fallback.recommendedService ?? "art",
        styleName: item.styleName ?? fallback.styleName ?? item.title ?? fallback.title ?? "Beauty Style",
        priceNote: item.priceNote ?? fallback.priceNote ?? "",
        // Admin v3 stores gallery metadata in D1; keep the existing image
        // until R2/media storage is connected.
        image: item.image || fallback.image || "",
        alt: item.alt ?? fallback.alt ?? item.title ?? "Beauty Studio nail design"
      };
    });

    cfg.gallery.splice(0, cfg.gallery.length, ...next);
    return true;
  };

  const applyBrand = () => {
    const fields = {
      ".brand strong": cfg.studioName,
      ".brand small": cfg.tagline,
      ".mobile-menu .eyebrow": cfg.studioName,
      ".footer-brand strong": cfg.studioName,
      ".footer-brand span": cfg.tagline,
      "[data-studio-address]": cfg.address,
      "[data-studio-hours]": cfg.hours,
      "[data-studio-phone]": cfg.phone,
      "[data-studio-name]": cfg.studioName,
      "[data-studio-city]": cfg.city
    };
    Object.entries(fields).forEach(([selector, value]) => {
      document.querySelectorAll(selector).forEach(el => text(el, value));
    });

    // Contact page uses explicit IDs rather than the generic data-studio-* hooks.
    const contactAddress = String(cfg.address ?? "").trim() || String(cfg.city ?? "").trim() || "Studio address coming soon";
    const contactHours = String(cfg.hours ?? "").trim() || "By appointment";
    const contactPhone = String(cfg.phone ?? "").trim() || "+00 000 000 000";

    text(document.getElementById("contactAddress"), contactAddress);
    text(document.getElementById("contactHours"), contactHours);
    text(document.getElementById("contactPhone"), contactPhone);

    // Also support the generic hooks if the contact layout changes later.
    document.querySelectorAll("[data-studio-address]").forEach(el => text(el, contactAddress));
    document.querySelectorAll("[data-studio-hours]").forEach(el => text(el, contactHours));
    document.querySelectorAll("[data-studio-phone]").forEach(el => text(el, contactPhone));

    const callAction = document.getElementById("contactCallAction");
    if (callAction && cfg.phone) {
      callAction.textContent = "Call studio  →";
      callAction.style.cursor = "pointer";
      callAction.onclick = () => {
        window.location.href = `tel:${String(cfg.phone).replace(/[^\d+]/g, "")}`;
      };
    }

    Object.entries(fields).forEach(([selector, value]) => {
      document.querySelectorAll(selector).forEach(el => text(el, value));
    });
    if (cfg.studioName) {
      document.title = `${cfg.studioName} · Nails & Beauty`;
      document.querySelector('meta[property="og:site_name"]')?.setAttribute("content", cfg.studioName);
    }
    if (cfg.phone) {
      document.querySelectorAll("[data-studio-phone-link]").forEach(el => {
        el.href = `tel:${String(cfg.phone).replace(/[^\d+]/g, "")}`;
        text(el, cfg.phone);
      });
    }
  };

  const applySocialLinks = () => {
    const social = (cfg.social && typeof cfg.social === "object") ? cfg.social : {};
    const definitions = {
      tiktok: { label: "TikTok", value: cfg.tiktok ?? social.tiktok?.handle ?? "", url: social.tiktok?.url || "" },
      whatsapp: { label: "WhatsApp", value: cfg.whatsapp ?? social.whatsapp?.handle ?? "", url: social.whatsapp?.url || "" },
      telegram: { label: "Telegram", value: cfg.telegram ?? social.telegram?.handle ?? "", url: social.telegram?.url || "" }
    };

    document.querySelectorAll("[data-social]").forEach(link => {
      const key = link.dataset.social;
      const item = definitions[key];
      if (!item) return;

      const value = String(item.value ?? "").trim();
      const small = link.querySelector("small");
      if (small && value) small.textContent = value;

      let href = String(item.url || "").trim();
      if (!href && value) {
        if (/^https?:\/\//i.test(value)) href = value;
        else if (key === "tiktok") href = `https://www.tiktok.com/@${value.replace(/^@/, "")}`;
        else if (key === "whatsapp") href = `https://wa.me/${value.replace(/\D/g, "")}`;
        else if (key === "telegram") href = `https://t.me/${value.replace(/^@/, "")}`;
      }

      if (href) {
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.href = "#";
      }
    });
  };

  const applyServiceCards = () => {
    const services = cfg.services || {};
    const entries = Object.entries(services);
    const grid = document.querySelector(".service-grid");
    if (!grid) return;

    let cards = [...grid.querySelectorAll(".service-card[data-service]")];

    // Keep the existing premium card structure for the first three services.
    // If Admin later adds more services, clone the existing visual template.
    entries.forEach(([, s], index) => {
      let card = cards[index];
      if (!card) {
        card = cards[0]?.cloneNode(true);
        if (!card) return;
        grid.appendChild(card);
        cards.push(card);
      }
      const key = Object.keys(services)[index];
      card.dataset.service = key;
      card.classList.toggle("featured", index === 1);
      const artClasses = ["photo-blush","photo-rose","photo-nude"];
      const photo = card.querySelector(".service-photo");
      if (photo) {
        photo.classList.remove("photo-blush","photo-rose","photo-nude");
        photo.classList.add(s.art || artClasses[index % 3]);
        text(photo.querySelector("span"), s.number || String(index + 1).padStart(2,"0"));
        text(photo.querySelector("small"), s.durationShort || (s.duration ? `${s.duration} MIN` : ""));
        if (s.image) photo.style.backgroundImage = `url("${String(s.image).replace(/"/g,'\\"')}")`;
      }
      text(card.querySelector(".service-kicker span:first-child"), s.kicker || "Service");
      text(card.querySelector(".service-kicker span:last-child"), s.number || String(index + 1).padStart(2,"0"));
      text(card.querySelector("h3"), s.title || s.name || "Service");
      text(card.querySelector(".service-info > p"), s.description || "");
      const meta = card.querySelectorAll(".service-meta span");
      text(meta[0], s.price || "");
      text(meta[1], s.duration ? `${s.duration} min` : "");
      text(card.querySelector(".service-bottom > span"), s.tags || "");
      text(card.querySelector(".service-photo-label"), s.kicker ? `THE ${String(s.kicker).toUpperCase()} EDIT` : "BEAUTY EDIT");
    });

    cards.slice(entries.length).forEach(card => card.remove());

    // Booking service choices are updated from the same D1 source.
    document.querySelectorAll("[data-service-choice]").forEach(btn => {
      const key = btn.dataset.serviceKey;
      const s = services[key];
      if (!s) return;
      btn.dataset.serviceChoice = s.title || s.name || "";
      text(btn.querySelector("span"), s.title || s.name || "");
      text(btn.querySelector("small"), `${s.price || ""} · ${s.duration || ""} min`);
    });
  };

  const applyGallery = () => {
    const gallery = Array.isArray(cfg.gallery) ? cfg.gallery : [];
    const grid = document.getElementById("work-grid");
    if (!grid) return;
    let cards = [...grid.querySelectorAll(".work-item")];

    gallery.forEach((item, index) => {
      let card = cards[index];
      if (!card) {
        card = cards[0]?.cloneNode(true);
        if (!card) return;
        grid.appendChild(card);
        cards.push(card);
      }
      card.classList.toggle("tall", index === 0 || index === 4);
      card.classList.toggle("wide", index === 4);
      card.dataset.title = item.title || "Beauty Style";
      card.dataset.style = item.style || "";
      card.dataset.description = item.description || "";
      card.dataset.category = item.category || "simple";
      card.dataset.recommendedService = item.recommendedService || "art";
      card.dataset.styleName = item.styleName || item.title || "Beauty Style";
      const info = card.querySelector("div:last-child");
      text(info?.querySelector("strong"), item.title || "Beauty Style");
      text(info?.querySelector("span"), item.style || "");

      const art = card.querySelector(".work-art");
      if (art && item.image) {
        art.classList.add("has-photo");
        art.querySelectorAll(".gallery-photo").forEach(img => img.remove());
        const img = document.createElement("img");
        img.className = "gallery-photo";
        img.loading = "lazy";
        img.decoding = "async";
        img.alt = item.alt || item.title || "Beauty Studio nail design";
        img.src = item.image;
        art.appendChild(img);
      }
    });

    cards.slice(gallery.length).forEach(card => card.remove());

    const count = document.getElementById("galleryCount");
    if (count) count.textContent = `${gallery.length} ${gallery.length === 1 ? "style" : "styles"}`;
  };

  const updateServiceModal = (key) => {
    const s = cfg.services?.[key];
    if (!s) return;

    const set = (id, value) => text(document.getElementById(id), value);
    const tags = String(s.tags || "").split(",").map(x => x.trim()).filter(Boolean);
    const description = String(s.description || "").trim();

    const art = document.getElementById("serviceModalArt");
    if (art) {
      art.className = `service-modal-art ${s.art || "photo-blush"}`;
      art.style.backgroundImage = s.image
        ? `linear-gradient(180deg, rgba(34,25,21,.02), rgba(34,25,21,.28)), url("${String(s.image).replace(/"/g,'\\"')}")`
        : "";
      if (!s.image) {
        art.style.background = "linear-gradient(145deg,#ead8d0,#b99084)";
      }
    }

    set("serviceModalNumber", s.number || "");
    set("serviceModalDuration", s.duration ? `${s.duration} MIN` : "");
    set("serviceModalTitle", s.title || s.name || "Service");
    set("serviceModalPrice", s.price || "Price on request");
    set("serviceModalDurationText", s.duration ? `${s.duration} min` : "");
    set("serviceModalDescription", description || "A personalized service prepared around your preferred look.");
    set("serviceModalKicker", (s.kicker && String(s.kicker).toLowerCase() !== "service") ? s.kicker : "Personalized");
    set("serviceModalCaption", s.caption || "Made with care.");
    set("serviceIdealFor", s.idealFor || (tags[0] || "Personalized care"));

    // New services created in Admin may only have name, price, duration,
    // description and tags. Build useful editorial content automatically.
    const rawHighlights = Array.isArray(s.highlights) ? s.highlights : [];
    const highlightRows = rawHighlights.length
      ? rawHighlights
      : [
          [tags[0] || "Service", "Tailored studio service"],
          [s.duration ? `${s.duration} min` : "Flexible", "Estimated appointment time"],
          [tags[1] || "Detail", "Personalized finish"]
        ];

    const highlights = document.getElementById("serviceHighlights");
    if (highlights) {
      highlights.hidden = false;
      highlights.innerHTML = highlightRows.slice(0,3).map(row => {
        const pair = Array.isArray(row) ? row : [row, "Studio detail"];
        return `<div><span>✦</span><strong>${escapeHtml(pair[0] || "")}</strong><small>${escapeHtml(pair[1] || "")}</small></div>`;
      }).join("");
    }

    const rawPoints = Array.isArray(s.points) ? s.points : [];
    const pointRows = rawPoints.length
      ? rawPoints
      : [
          description || "Personalized service details",
          tags.length ? `Style: ${tags.join(" · ")}` : "Studio preparation and finish",
          s.duration ? `Estimated time: ${s.duration} minutes` : "Time confirmed with the studio"
        ];

    const points = document.getElementById("servicePoints");
    if (points) {
      points.hidden = false;
      points.innerHTML = pointRows.slice(0,4).map(x => `<li>${escapeHtml(x)}</li>`).join("");
    }

    const photoCount = document.getElementById("serviceModalPhotoCount");
    if (photoCount) {
      photoCount.textContent = `Beauty Studio · ${s.number || "01"} / ${String(Object.keys(cfg.services || {}).length).padStart(2, "0")}`;
    }

    const choose = document.getElementById("chooseServiceButton");
    if (choose) {
      choose.dataset.bookService = key;
      choose.onclick = () => {
        document.getElementById("serviceModal")?.classList.remove("open");
        document.body.classList.remove("modal-open");
        const option = document.querySelector(`[data-service-choice][data-service-key="${CSS.escape(key)}"]`);
        option?.click();
      };
    }
  };

  const updateGalleryModal = (index) => {
    const item = cfg.gallery?.[index];
    if (!item) return;
    text(document.getElementById("workDetailTitle"), item.title);
    text(document.getElementById("workDetailStyle"), item.style);
    text(document.getElementById("workDetailDescription"), item.description);
    const modalArt = document.getElementById("modalArt");
    if (modalArt && item.image) {
      modalArt.className = "modal-art has-photo";
      modalArt.querySelectorAll(".gallery-modal-photo").forEach(img => img.remove());
      const img = document.createElement("img");
      img.className = "gallery-modal-photo";
      img.alt = item.alt || item.title || "Beauty Studio nail design";
      img.src = item.image;
      modalArt.appendChild(img);
    }
  };

  const bindDynamicClicks = () => {
    document.querySelectorAll(".service-card[data-service]").forEach(card => {
      if (card.dataset.d1Bound === "1") return;
      card.dataset.d1Bound = "1";
      card.addEventListener("click", () => {
        const key = card.dataset.service;
        updateServiceModal(key);

        const modal = document.getElementById("serviceModal");
        if (modal) {
          modal.classList.add("open");
          modal.setAttribute("aria-hidden", "false");
          document.body.classList.add("modal-open");
        }
      });
    });
    const grid = document.getElementById("work-grid");
    grid?.addEventListener("click", event => {
      const card = event.target.closest(".work-item");
      if (!card) return;
      const cards = [...grid.querySelectorAll(".work-item")];
      updateGalleryModal(cards.indexOf(card));
    });
  };

  const loadPublishedContent = async () => {
    try {
      const [settings, services, gallery, booking] = await Promise.all([
        get("/api/content/settings?t=" + Date.now()),
        get("/api/content/services"),
        get("/api/content/gallery"),
        get("/api/content/booking-rules")
      ]);

      if (settings?.ok && settings.data) Object.assign(cfg, settings.data);
      const remoteServices = services?.ok
        ? (Array.isArray(services.data) ? services.data : (services.data && typeof services.data === "object" ? Object.values(services.data) : []))
        : [];
      const remoteGallery = gallery?.ok
        ? (Array.isArray(gallery.data) ? gallery.data : (gallery.data && typeof gallery.data === "object" ? Object.values(gallery.data) : []))
        : [];
      const hasServices = remoteServices.length > 0;
      const hasGallery = remoteGallery.length > 0;

      if (hasServices) mergeServices(remoteServices);
      if (hasGallery) mergeGallery(remoteGallery);
      if (booking?.ok && booking.data) cfg.bookingRules = {...(cfg.bookingRules || {}), ...booking.data};

      // v67 · let the final booking renderer apply the fresh D1 rules after
      // the async content request has completed. The older booking scripts
      // run during initial page load and therefore only saw fallback values.
      window.dispatchEvent(new CustomEvent("beautyStudioBookingRulesReady", {
        detail: cfg.bookingRules || {}
      }));

      // Re-apply the existing content system after D1 has arrived.
      applyBrand();
      applySocialLinks();
      applyServiceCards();
      applyGallery();
      bindDynamicClicks();

      // Refresh gallery filter counts after D1 content changes.
      document.querySelectorAll(".filters button").forEach(btn => {
        if (btn.classList.contains("active")) btn.click();
      });

      document.documentElement.dataset.d1Content = (hasServices || hasGallery || (settings?.ok && settings.data)) ? "connected" : "empty";
      window.dispatchEvent(new CustomEvent("beautyStudioD1ContentReady"));
    } catch (error) {
      console.error("Beauty Studio D1 content load failed", error);
      // Keep the static launch-ready content visible if the API is unavailable.
      document.documentElement.dataset.d1Content = "fallback";
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPublishedContent, { once: true });
  } else {
    loadPublishedContent();
  }
})();


/* v67 — D1 booking rules live renderer
   The original booking scripts are intentionally kept as a safe fallback,
   but they run before the async D1 request finishes. This final renderer
   listens for the D1-ready event and rebuilds the customer booking UI with
   the actual admin rules: opening/closing time, slot interval, advance days,
   minimum lead time and booking status.
*/
(() => {
  const modal = document.getElementById("bookingModal");
  if (!modal) return;

  const timeGrid = modal.querySelector(".time-grid");
  const dateButtons = [...modal.querySelectorAll(".date-choice")];
  const customDateButton = modal.querySelector("[data-date-custom]");
  const timeLabel = modal.querySelector(".booking-time-label small");
  const bookingMessageTargets = [
    modal.querySelector(".booking-footnote"),
    modal.querySelector(".booking-reassurance small")
  ].filter(Boolean);

  let activeRules = {};

  const pad = n => String(n).padStart(2, "0");
  const toMinutes = value => {
    const parts = String(value || "").split(":").map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };
  const formatTime = mins => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  const iso = date => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
  const localDate = offset => {
    const d = today();
    d.setDate(d.getDate() + offset);
    d.setHours(12,0,0,0);
    return d;
  };
  const workingDay = date => {
    const day = date.getDay() === 0 ? 7 : date.getDay();
    const days = Array.isArray(activeRules.workingDays) && activeRules.workingDays.length
      ? activeRules.workingDays.map(Number)
      : [1,2,3,4,5,6];
    return days.includes(day);
  };
  const advanceDays = () => Math.max(0, Number(activeRules.advanceDays) || 30);
  const isPaused = () => String(activeRules.status || "open").toLowerCase() !== "open";
  const minLeadMinutes = () => Math.max(0, Number(activeRules.minLeadMinutes) || 0);

  function updateBookingMessage() {
    const message = String(window.BEAUTY_STUDIO_CONTENT?.bookingMessage || "").trim();
    if (!message) return;
    bookingMessageTargets.forEach(el => { el.textContent = message; });
  }

  function makeSlotsForDate(date) {
    const opening = toMinutes(activeRules.openingTime || "10:00");
    const closing = toMinutes(activeRules.closingTime || "18:00");
    const interval = Math.max(5, Number(activeRules.slotMinutes) || 30);
    const result = [];
    for (let t = opening; t + interval <= closing; t += interval) {
      const d = new Date(date);
      d.setHours(Math.floor(t / 60), t % 60, 0, 0);
      result.push({ time: formatTime(t), date: d });
    }
    return result;
  }

  function renderTimes(date) {
    if (!timeGrid) return;
    timeGrid.innerHTML = "";

    if (isPaused()) {
      const note = document.createElement("div");
      note.className = "booking-closed-note";
      note.textContent = activeRules.closedMessage || "Online booking is currently paused.";
      timeGrid.appendChild(note);
      if (timeLabel) timeLabel.textContent = "Booking is currently paused";
      return;
    }

    if (!workingDay(date)) {
      const note = document.createElement("div");
      note.className = "booking-closed-note";
      note.textContent = activeRules.closedMessage || "The Studio is closed on this day.";
      timeGrid.appendChild(note);
      if (timeLabel) timeLabel.textContent = "No appointments available";
      return;
    }

    const now = new Date();
    const isToday = iso(date) === iso(now);
    const earliest = new Date(now.getTime() + minLeadMinutes() * 60000);
    const slots = makeSlotsForDate(date);
    let available = 0;

    slots.forEach(slot => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.time = slot.time;
      button.textContent = slot.time;

      if (isToday && slot.date < earliest) {
        button.disabled = true;
        button.title = `Available after ${formatTime(earliest.getHours()*60 + earliest.getMinutes())}`;
        button.classList.add("is-unavailable");
      } else {
        available += 1;
        button.addEventListener("click", () => {
          timeGrid.querySelectorAll("button").forEach(x => x.classList.remove("selected", "active"));
          button.classList.add("selected", "active");
          const summaryTime = document.getElementById("summaryTime");
          if (summaryTime) summaryTime.textContent = slot.time;
          document.dispatchEvent(new CustomEvent("beautyStudioTimeSelected", { detail: { time: slot.time } }));
          modal.querySelectorAll(".booking-step").forEach(step => step.classList.toggle("active", step.dataset.step === "3"));
          modal.querySelectorAll(".steps span").forEach((step, i) => step.classList.toggle("current", i === 2));
          const fill = document.getElementById("progressFill");
          if (fill) fill.style.width = "100%";
        });
      }
      timeGrid.appendChild(button);
    });

    if (!available) {
      const note = document.createElement("div");
      note.className = "booking-closed-note";
      note.textContent = isToday
        ? "No times remain today. Please choose another date."
        : "No appointment times are available.";
      timeGrid.appendChild(note);
    }

    if (timeLabel) {
      timeLabel.textContent = `${activeRules.openingTime || "10:00"}–${activeRules.closingTime || "18:00"} · every ${activeRules.slotMinutes || 30} min`;
    }
  }

  function renderDates() {
    if (!dateButtons.length) return;
    const maxOffset = advanceDays();
    const maxDate = localDate(maxOffset);

    dateButtons.forEach((button, index) => {
      const offset = button.dataset.dateCustom === "true"
        ? null
        : Number(button.dataset.dateOffset ?? index);
      if (offset === null || Number.isNaN(offset)) {
        button.disabled = isPaused();
        button.title = isPaused() ? (activeRules.closedMessage || "Online booking is currently paused.") : "Choose a date";
        return;
      }
      const date = localDate(offset);
      const span = button.querySelector("span");
      const small = button.querySelector("small");
      const valid = !isPaused() && date <= maxDate && workingDay(date);
      if (span) span.textContent = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.toLocaleDateString(undefined,{weekday:"short"});
      if (small) small.textContent = date.toLocaleDateString(undefined,{month:"short",day:"numeric"});
      button.dataset.isoDate = iso(date);
      button.disabled = !valid;
      button.title = valid ? "Available" : (activeRules.closedMessage || "Unavailable");
      button.classList.toggle("is-unavailable", !valid);
    });

    const firstAvailable = dateButtons.find(button => !button.disabled && button.dataset.dateCustom !== "true");
    const active = dateButtons.find(button => button.classList.contains("active") && !button.disabled) || firstAvailable;
    dateButtons.forEach(button => button.classList.remove("active"));
    if (active) {
      active.classList.add("active");
      const date = new Date(`${active.dataset.isoDate}T12:00:00`);
      renderTimes(date);
    } else {
      renderTimes(localDate(0));
    }
  }

  function applyRules(rules) {
    activeRules = { ...(window.BEAUTY_STUDIO_CONTENT?.bookingRules || {}), ...(rules || {}) };
    window.__beautyStudioBookingRulesFinal = activeRules;
    updateBookingMessage();
    renderDates();
  }

  function handleBookingDate(date) {
    const selectedDate = new Date(date);
    selectedDate.setHours(12, 0, 0, 0);
    const selectedIso = iso(selectedDate);
    const matching = dateButtons.find(button => button.dataset.isoDate === selectedIso);
    dateButtons.forEach(button => button.classList.remove("active"));
    if (matching) matching.classList.add("active");
    const summaryDate = document.getElementById("summaryDate");
    if (summaryDate) summaryDate.textContent = selectedDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    renderTimes(selectedDate);
  }

  window.__beautyStudioHandleBookingDate = handleBookingDate;
  window.__beautyStudioApplyBookingRules = applyRules;

  // Capture date clicks so legacy v37 listeners cannot rebuild the grid from
  // their original hard-coded rules after Tomorrow/Today is switched.
  dateButtons.forEach(button => {
    if (button.dataset.dateCustom === "true") return;
    button.addEventListener("click", event => {
      if (!window.__beautyStudioBookingRulesFinal) return;
      event.stopImmediatePropagation();
      if (button.disabled || !button.dataset.isoDate) return;
      handleBookingDate(new Date(`${button.dataset.isoDate}T12:00:00`));
    }, true);
  });
  window.addEventListener("beautyStudioBookingRulesReady", event => applyRules(event.detail || {}));

  // If the D1 request has already completed before this block evaluated,
  // apply the current values immediately as well.
  applyRules(window.BEAUTY_STUDIO_CONTENT?.bookingRules || {});
})();


/* v70 — real D1 booking submission controller
   The legacy booking UI listeners only changed the success screen. This final
   capture-phase controller owns Confirm request and persists the request to D1. */
(() => {
  const button = document.getElementById('confirmBooking');
  const modal = document.getElementById('bookingModal');
  if (!button || !modal || button.dataset.realBookingController === '1') return;
  button.dataset.realBookingController = '1';

  const API_BASE = 'https://beauty-studio-api.haochen05024.workers.dev';
  let submitting = false;

  const textOf = id => String(document.getElementById(id)?.textContent || '').trim();
  const setStatus = (message, error = false) => {
    const el = document.getElementById('bookingReadyNote') || document.getElementById('bookingSelectionNote');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('is-error', !!error);
  };

  const activeDateIso = () => {
    const active = modal.querySelector('.date-choice.active');
    return active?.dataset?.isoDate || '';
  };

  const selectedTime = () => {
    const active = modal.querySelector('.time-grid button.selected, .time-grid button.active');
    return active?.dataset?.time || active?.textContent?.trim() || '';
  };

  const submitBooking = async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (submitting) return;

    const nameInput = document.getElementById('guestName');
    const phoneInput = document.getElementById('guestPhone');
    const name = nameInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';
    const service = textOf('summaryService');
    const price = textOf('summaryPrice');
    const duration = textOf('summaryDuration');
    const bookingDate = activeDateIso();
    const bookingTime = selectedTime();
    const inspiration = textOf('summaryInspiration');

    if (name.length < 2) {
      nameInput?.focus();
      setStatus('Please enter your name before sending the request.', true);
      return;
    }
    if (phone.replace(/\D/g, '').length < 7) {
      phoneInput?.focus();
      setStatus('Please enter a valid phone number before sending the request.', true);
      return;
    }
    if (!service || service === '—') {
      setStatus('Please choose a service first.', true);
      return;
    }
    if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      setStatus('Please choose an appointment date.', true);
      return;
    }
    if (!bookingTime || !/^\d{2}:\d{2}$/.test(bookingTime)) {
      setStatus('Please choose an available time.', true);
      return;
    }

    submitting = true;
    const original = button.innerHTML;
    button.disabled = true;
    button.classList.add('is-loading');
    button.textContent = 'Sending request…';
    setStatus('Sending your appointment request securely to the Studio…');

    try {
      const customerIdentity = await (window.__beautyStudioEnsureCustomer ? window.__beautyStudioEnsureCustomer({ name, phone }) : null);
      const customerKey = customerIdentity?.browserKey || localStorage.getItem('beauty_studio_customer_key') || '';
      if (!customerKey) throw new Error('We could not create your customer ID. Please refresh and try again.');

      const response = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          customerKey,
          customerName: name,
          phone,
          service,
          price,
          duration,
          bookingDate,
          bookingTime,
          inspiration: inspiration && inspiration !== '—' ? inspiration : '',
          customerNote: ''
        })
      });

      let body = null;
      try { body = await response.json(); } catch {}
      if (!response.ok || !body?.ok || !body?.booking?.id) {
        throw new Error(body?.error || `Booking request failed (${response.status})`);
      }

      const booking = body.booking;
      const ref = document.getElementById('finalBookingRef');
      const finalService = document.getElementById('finalService');
      const finalPrice = document.getElementById('finalPrice');
      const finalDate = document.getElementById('finalDate');
      const finalTime = document.getElementById('finalTime');
      const finalDuration = document.getElementById('finalDuration');
      const finalInspiration = document.getElementById('finalInspiration');
      const finalCard = document.getElementById('finalBookingCard');
      const complete = document.getElementById('bookingComplete');
      const completeSummary = document.getElementById('completeSummary');

      if (ref) ref.textContent = booking.id;
      if (finalService) finalService.textContent = booking.service || service;
      if (finalPrice) finalPrice.textContent = booking.price || price || 'To confirm';
      if (finalDate) finalDate.textContent = booking.bookingDate || bookingDate;
      if (finalTime) finalTime.textContent = booking.bookingTime || bookingTime;
      if (finalDuration) finalDuration.textContent = booking.duration || duration || 'To confirm';
      if (finalInspiration) finalInspiration.textContent = booking.inspiration || '—';
      if (finalCard) finalCard.hidden = false;
      if (completeSummary) completeSummary.textContent = `${booking.service} · ${booking.bookingDate} · ${booking.bookingTime}. Your request ${booking.id} has been sent to the Studio for review.`;

      modal.querySelectorAll('.booking-step').forEach(x => x.style.display = 'none');
      complete?.classList.add('show');
    } catch (error) {
      console.error('Beauty Studio booking submission failed', error);
      setStatus(error?.message || 'We could not send the request. Please try again.', true);
      button.disabled = false;
      button.classList.remove('is-loading');
      button.innerHTML = original;
      submitting = false;
    }
  };

  // Capture phase runs before the legacy bubble listeners and prevents their
  // preview-only success screen from firing without a D1 write.
  button.addEventListener('click', submitBooking, true);
})();


/* v72 — persistent customer identity + booking status bridge
   Public customer number is simple: 0001, 0002, 0003...
   A private browser key is used only to reconnect the same browser to that number. */
(() => {
  const API_BASE = 'https://beauty-studio-api.haochen05024.workers.dev';
  const KEY = 'beauty_studio_customer_key';
  const NUMBER_KEY = 'beauty_studio_customer_number';
  const STATUS_KEY = 'beauty_studio_booking_statuses';

  function getKey() {
    try {
      let key = localStorage.getItem(KEY);
      if (!key) {
        key = (crypto.randomUUID ? crypto.randomUUID() : `bs_${Date.now()}_${Math.random().toString(36).slice(2)}`);
        localStorage.setItem(KEY, key);
      }
      return key;
    } catch {
      return '';
    }
  }

  async function identify(extra = {}) {
    const browserKey = getKey();
    if (!browserKey) return null;
    try {
      const response = await fetch(`${API_BASE}/api/customers/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ customerKey: browserKey, name: extra.name || '', phone: extra.phone || '' })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok || !body?.customer?.customerNumber) return null;
      localStorage.setItem(NUMBER_KEY, body.customer.customerNumber);
      return { browserKey, customerNumber: body.customer.customerNumber };
    } catch (error) {
      console.warn('Beauty Studio customer identity unavailable', error);
      return null;
    }
  }

  window.__beautyStudioEnsureCustomer = identify;
  window.__beautyStudioCustomerNumber = () => localStorage.getItem(NUMBER_KEY) || '';

  function statusStore() {
    try { return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}'); } catch { return {}; }
  }

  function saveStatusStore(value) {
    try { localStorage.setItem(STATUS_KEY, JSON.stringify(value)); } catch {}
  }

  function showStatusNotice(booking) {
    const status = String(booking.status || '').toLowerCase();
    if (!['confirmed', 'cancelled'].includes(status)) return;
    const store = statusStore();
    const previous = store[booking.id];
    store[booking.id] = status;
    saveStatusStore(store);
    if (previous === status) return;

    const existing = document.getElementById('customerBookingStatusNotice');
    existing?.remove();
    const notice = document.createElement('div');
    notice.id = 'customerBookingStatusNotice';
    notice.innerHTML = `
      <div class="cbsn-kicker">BOOKING UPDATE · CUSTOMER ${String(localStorage.getItem(NUMBER_KEY) || '').padStart(4,'0')}</div>
      <strong>${status === 'confirmed' ? 'Your appointment is confirmed.' : 'Your appointment was not confirmed.'}</strong>
      <span>${escapeHtml(booking.service || 'Appointment')} · ${escapeHtml(booking.bookingDate || '')} · ${escapeHtml(booking.bookingTime || '')}</span>
      <button type="button" aria-label="Close">×</button>`;
    Object.assign(notice.style, {
      position:'fixed', right:'22px', bottom:'22px', zIndex:'99999', width:'min(380px,calc(100vw - 32px))',
      padding:'18px 20px', border:'1px solid rgba(125,91,79,.18)', borderRadius:'18px', background:'#fffaf6',
      boxShadow:'0 18px 50px rgba(55,35,28,.16)', color:'#302621', display:'grid', gap:'6px', fontFamily:'inherit'
    });
    const style = document.createElement('style');
    style.textContent = '#customerBookingStatusNotice .cbsn-kicker{font-size:9px;letter-spacing:.16em;color:#9b6c69;font-weight:700}#customerBookingStatusNotice strong{font-size:15px}#customerBookingStatusNotice span{font-size:12px;color:#81746d}#customerBookingStatusNotice button{position:absolute;top:7px;right:9px;border:0;background:none;font-size:20px;color:#81746d;cursor:pointer}';
    document.head.appendChild(style);
    notice.querySelector('button').onclick = () => notice.remove();
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 9000);
  }

  async function refreshCustomerBookings() {
    const browserKey = getKey();
    if (!browserKey) return;
    try {
      const response = await fetch(`${API_BASE}/api/customer/bookings`, {
        headers: { 'Accept': 'application/json', 'x-customer-key': browserKey },
        cache: 'no-store'
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) return;
      if (body.customerNumber) localStorage.setItem(NUMBER_KEY, body.customerNumber);
      (body.bookings || []).forEach(showStatusNotice);
    } catch {}
  }

  // Bootstrap identity early, then check for booking status changes on every fresh page load.
  identify().finally(() => refreshCustomerBookings());
})();


/* v73 — persistent customer notification center
   Booking status changes are delivered from D1 and remain available after refresh. */
(() => {
  const API_BASE = 'https://beauty-studio-api.haochen05024.workers.dev';
  const KEY = 'beauty_studio_customer_key';
  const fab = document.getElementById('customerNotifyFab');
  const badge = document.getElementById('customerNotifyBadge');
  const panel = document.getElementById('customerNotificationPanel');
  const list = document.getElementById('customerNotificationList');
  if (!fab || !badge || !panel || !list) return;

  const esc = value => String(value ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const injectStyle = () => {
    if (document.getElementById('customerNotificationStyles')) return;
    const style = document.createElement('style');
    style.id = 'customerNotificationStyles';
    style.textContent = `
      .customer-notify-fab{position:fixed;right:24px;bottom:82px;z-index:10020;width:48px;height:48px;border:1px solid rgba(125,91,79,.16);border-radius:50%;background:rgba(255,250,246,.96);color:#302621;box-shadow:0 14px 34px rgba(55,35,28,.14);display:grid;place-items:center;cursor:pointer;font-size:19px;backdrop-filter:blur(12px);transition:transform .2s ease,box-shadow .2s ease}.customer-notify-fab:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(55,35,28,.18)}.customer-notify-fab>b{position:absolute;right:-2px;top:-3px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#9b6c69;color:#fff;font:700 10px/19px Arial,sans-serif;text-align:center;border:2px solid #fffaf6}.customer-notification-panel{position:fixed;inset:0;z-index:10030;display:none}.customer-notification-panel.open{display:block}.customer-notification-backdrop{position:absolute;inset:0;background:rgba(48,38,33,.22);backdrop-filter:blur(3px)}.customer-notification-card{position:absolute;right:24px;bottom:142px;width:min(390px,calc(100vw - 32px));max-height:min(620px,calc(100vh - 180px));overflow:auto;background:#fffaf6;border:1px solid rgba(125,91,79,.16);border-radius:24px;box-shadow:0 24px 70px rgba(55,35,28,.2);padding:22px}.customer-notification-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:16px;border-bottom:1px solid rgba(125,91,79,.12)}.customer-notification-head h2{margin:4px 0 0;font:500 28px Georgia,serif;color:#302621}.customer-notification-close{width:34px;height:34px;border:1px solid rgba(125,91,79,.14);border-radius:50%;background:#f5ebe5;color:#5f514b;font-size:21px;cursor:pointer}.customer-notification-list{display:grid;gap:10px;padding-top:14px}.customer-notification-item{padding:15px;border:1px solid rgba(125,91,79,.12);border-radius:16px;background:#fff;display:grid;gap:5px}.customer-notification-item.unread{background:#f8eee8;border-color:rgba(155,108,105,.25)}.customer-notification-item small{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#9b6c69;font-weight:700}.customer-notification-item strong{font-size:14px;color:#302621}.customer-notification-item p{margin:0;color:#81746d;font-size:12px;line-height:1.55}.customer-notification-empty{padding:28px 8px;text-align:center;color:#81746d;font-size:12px}.customer-notification-footer{margin-top:14px;text-align:center;color:#a18d84;font-size:10px;letter-spacing:.08em;text-transform:uppercase}@media(max-width:640px){.customer-notify-fab{right:18px;bottom:calc(146px + env(safe-area-inset-bottom));width:44px;height:44px}.customer-notification-card{right:12px;bottom:calc(136px + env(safe-area-inset-bottom));width:calc(100vw - 24px);border-radius:22px;padding:18px;max-height:calc(100vh - 165px)}}
      .support-fab{right:24px;bottom:22px}@media(max-width:640px){.support-fab{right:18px;bottom:calc(78px + env(safe-area-inset-bottom));padding:8px 12px 8px 9px;box-shadow:0 12px 28px rgba(55,35,28,.18)}.support-fab-label{font-size:10px}.support-unread-badge{top:-4px;right:-3px}}
    `;
    document.head.appendChild(style);
  };

  const getKey = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
  const open = () => { panel.classList.add('open'); panel.setAttribute('aria-hidden','false'); fab.setAttribute('aria-expanded','true'); };
  const close = () => { panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); fab.setAttribute('aria-expanded','false'); };
  const typeLabel = type => ({booking_confirmed:'BOOKING CONFIRMED',booking_cancelled:'BOOKING UPDATE',booking_completed:'BOOKING COMPLETE',booking_pending:'BOOKING RECEIVED',support_message:'NEW MESSAGE'}[type] || 'STUDIO UPDATE');

  function render(items) {
    const rows = Array.isArray(items) ? items : [];
    window.__beautyStudioNotificationCache = rows;
    const loc = item => window.__beautyStudioLocalizeNotification?.(item) || {
      label:typeLabel(item.type), title:item.title, message:item.message
    };
    if (!rows.length) {
      const empty = window.__beautyStudioGetLanguage?.()==='zh' ? '暂无新通知。' : window.__beautyStudioGetLanguage?.()==='my' ? 'အသစ်သော အပ်ဒိတ် မရှိသေးပါ။' : 'No new updates yet.';
      list.innerHTML = `<div class="customer-notification-empty">${empty}</div>`;
      return;
    }
    list.innerHTML = rows.map(item => {
      const n=loc(item);
      return `
      <article class="customer-notification-item ${Number(item.is_read) ? '' : 'unread'}" data-notification-id="${esc(item.id)}">
        <small>${esc(n.label)}</small>
        <strong>${esc(n.title)}</strong>
        <p>${esc(n.message)}</p>
      </article>`;
    }).join('') + `<div class="customer-notification-footer">${
      window.__beautyStudioGetLanguage?.()==='zh' ? '工作室通知会在刷新后保留。' :
      window.__beautyStudioGetLanguage?.()==='my' ? 'စတူဒီယို အပ်ဒိတ်များကို refresh ပြီးနောက်လည်း သိမ်းထားပါမည်။' :
      'Your studio updates stay here after refresh.'
    }</div>`;
  }

  async function loadNotifications(markRead = false) {
    const key = getKey();
    if (!key) return;
    try {
      const response = await fetch(`${API_BASE}/api/customer/notifications`, {headers:{Accept:'application/json','x-customer-key':key},cache:'no-store'});
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) return;
      render(body.notifications || []);
      const unread = Number(body.unreadCount || 0);
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.hidden = unread <= 0;
      if (markRead && unread > 0) {
        await fetch(`${API_BASE}/api/customer/notifications/read`, {method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','x-customer-key':key},body:JSON.stringify({})});
        badge.hidden = true;
        badge.textContent = '0';
        [...list.querySelectorAll('.customer-notification-item')].forEach(el => el.classList.remove('unread'));
      }
    } catch {}
  }

  injectStyle();
  fab.addEventListener('click', async () => { if (panel.classList.contains('open')) close(); else { open(); await loadNotifications(true); } });
  panel.querySelectorAll('[data-close-notifications]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  const start = async () => {
    for (let i=0; i<10 && !getKey(); i++) await new Promise(r => setTimeout(r, 400));
    await loadNotifications(false);
    setInterval(() => loadNotifications(false), 30000);
  };
  start();
})();

/* v76 — live service catalog + booking back navigation
   Booking now uses the same D1 service list as the Services section.
   Newly added services appear automatically, with live price/duration.
   Customers can move back from time/details to correct an earlier choice. */
(() => {
  const modal = document.getElementById('bookingModal');
  if (!modal) return;

  const esc = value => String(value ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const serviceKey = service => String(service?.id ?? service?.key ?? '').trim().toLowerCase();

  const renderBookingServices = () => {
    const box = modal.querySelector('.booking-options');
    const services = window.BEAUTY_STUDIO_CONTENT?.services || {};
    if (!box || !Object.keys(services).length) return;

    const entries = Object.entries(services);
    box.innerHTML = entries.map(([key, s], index) => {
      const actualKey = serviceKey(s) || key;
      const title = s?.title || s?.name || `Service ${index + 1}`;
      const price = s?.price || 'Price on request';
      const duration = s?.duration ? `${s.duration} min` : 'Time confirmed';
      return `<button type="button" data-service-choice="${esc(title)}" data-service-key="${esc(actualKey)}">` +
        `<span>${esc(title)}</span><small>${esc(price)} · ${esc(duration)}</small><b>→</b></button>`;
    }).join('');

    const selectedKey = modal.dataset.selectedServiceKey || '';
    if (selectedKey) {
      box.querySelector(`[data-service-key="${CSS.escape(selectedKey)}"]`)?.classList.add('selected');
    }
  };

  const findService = key => {
    const services = window.BEAUTY_STUDIO_CONTENT?.services || {};
    return services[key] || Object.values(services).find(s => serviceKey(s) === key) || null;
  };

  const setStep = step => {
    modal.querySelectorAll('.booking-step').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.step) === step);
      el.style.display = '';
    });
    modal.querySelectorAll('.steps span').forEach((el, index) => {
      el.classList.toggle('current', index === step - 1);
    });
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = `${step / 3 * 100}%`;
    const panel = modal.querySelector('.booking-panel');
    if (panel) panel.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateServiceSummary = (key, titleFallback = '') => {
    const service = findService(key);
    if (!service) return;
    const title = service.title || service.name || titleFallback || 'Service';
    const price = service.price || 'Price on request';
    const duration = service.duration ? `${service.duration} min` : 'Time confirmed';

    modal.dataset.selectedServiceKey = key;
    document.getElementById('summaryService')?.replaceChildren(document.createTextNode(title));
    document.getElementById('summaryPrice')?.replaceChildren(document.createTextNode(price));
    document.getElementById('summaryDuration')?.replaceChildren(document.createTextNode(duration));
    document.getElementById('chosenServiceLabel')?.replaceChildren(document.createTextNode(title));
    document.getElementById('bookingSelectionNote')?.replaceChildren(
      document.createTextNode(`${title} · ${price} · ${duration}`)
    );
  };

  const style = document.createElement('style');
  style.textContent = `
    .booking-back-button{display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;padding:8px 0;border:0;background:none;color:#8e6a61;font:600 11px/1.2 inherit;letter-spacing:.08em;cursor:pointer;transition:color .2s ease,transform .2s ease}
    .booking-back-button:hover{color:#302621;transform:translateX(-2px)}
    .booking-options button small{display:block}
    @media(max-width:640px){.booking-back-button{margin-bottom:14px;padding:7px 0;font-size:10px}}
  `;
  document.head.appendChild(style);

  // Delegation keeps newly-created D1 services clickable.
  modal.addEventListener('click', event => {
    const button = event.target.closest('[data-service-choice]');
    if (!button || !modal.contains(button)) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    modal.querySelectorAll('[data-service-choice]').forEach(x => x.classList.remove('selected'));
    button.classList.add('selected');
    const key = button.dataset.serviceKey || '';
    updateServiceSummary(key, button.dataset.serviceChoice || button.textContent.trim());
    setStep(2);
  }, true);

  modal.addEventListener('click', event => {
    const back = event.target.closest('[data-back-step]');
    if (!back || !modal.contains(back)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const step = Number(back.dataset.backStep || 1);
    setStep(step);

    // Returning to the time step means the customer may choose a new time.
    if (step === 2) {
      const activeDate = modal.querySelector('.date-choice.active');
      const iso = activeDate?.dataset?.isoDate;
      if (iso && typeof window.__beautyStudioHandleBookingDate === 'function') {
        window.__beautyStudioHandleBookingDate(new Date(`${iso}T12:00:00`));
      }
    }
  }, true);

  // Initial fallback/static services are replaced once D1 content arrives.
  renderBookingServices();
  document.addEventListener('beautyStudioContentReady', renderBookingServices);
  window.addEventListener('beautyStudioServicesReady', renderBookingServices);

  // The existing D1 loader does not emit a service-specific event, so observe
  // the service object briefly and render as soon as the remote list arrives.
  let lastSignature = '';
  const sync = () => {
    const services = window.BEAUTY_STUDIO_CONTENT?.services || {};
    const signature = Object.entries(services).map(([k,s]) => `${k}|${s?.title}|${s?.price}|${s?.duration}`).join('||');
    if (signature && signature !== lastSignature) {
      lastSignature = signature;
      renderBookingServices();
    }
  };
  sync();
  const timer = setInterval(sync, 400);
  setTimeout(() => clearInterval(timer), 12000);
})();

/* ---------- V84 trilingual UI: English / 中文 / မြန်မာ ---------- */
(function(){
  const I18N = {"Beauty Studio": ["美容工作室", "အလှအပ စတူဒီယို"], "Admin Studio": ["后台管理", "စီမံခန့်ခွဲရေး"], "Beauty, made personal.": ["为你而生的美丽。", "သင့်အတွက် အထူးဖန်တီးထားတဲ့ အလှအပ။"], "A calm little studio for beautiful nails, thoughtful details, and time that feels like it belongs to you.": ["一个让你享受美甲、细致服务与属于自己的片刻时光的温柔空间。", "လှပတဲ့ လက်သည်းဒီဇိုင်း၊ ဂရုတစိုက်ဝန်ဆောင်မှုနဲ့ ကိုယ့်အတွက် ကိုယ်ပိုင်အချိန်လေးကို အေးချမ်းစွာ ခံစားနိုင်မယ့် စတူဒီယိုလေးတစ်ခု။"], "Book Now": ["立即预约", "ယခု ရက်ချိန်းယူရန်"], "Book an appointment": ["预约时间", "ရက်ချိန်းယူရန်"], "Services": ["服务", "ဝန်ဆောင်မှုများ"], "Our Work": ["作品", "လက်ရာများ"], "Gallery": ["作品集", "လက်ရာများ"], "About": ["关于我们", "ကျွန်ုပ်တို့အကြောင်း"], "Contact": ["联系我们", "ဆက်သွယ်ရန်"], "Install": ["安装", "ထည့်သွင်းရန်"], "Home": ["首页", "ပင်မစာမျက်နှာ"], "Book": ["预约", "ရက်ချိန်း"], "Explore our work": ["查看作品", "ကျွန်ုပ်တို့၏ လက်ရာများကို ကြည့်ရန်"], "Private studio": ["私享工作室", "ကိုယ်ပိုင်စတူဒီယို"], "By appointment": ["预约制", "ကြိုတင်ရက်ချိန်းဖြင့်"], "Made with care": ["用心打造", "ဂရုတစိုက် ဖန်တီးထားသည်"], "Beauty · Care · Detail": ["美丽 · 呵护 · 细节", "အလှ · ဂရုစိုက်မှု · အသေးစိတ်"], "Our Services": ["我们的服务", "ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုများ"], "View details": ["查看详情", "အသေးစိတ်ကြည့်ရန်"], "Choose this service": ["选择此服务", "ဤဝန်ဆောင်မှုကို ရွေးချယ်ရန်"], "Gel Manicure": ["凝胶美甲", "ဂျယ်လ် လက်သည်းအလှပြင်"], "Custom Nail Art": ["定制美甲", "စိတ်ကြိုက် လက်သည်းအလှဒီဇိုင်း"], "Extensions": ["延长甲", "လက်သည်းတိုးချဲ့ခြင်း"], "Nail Extension": ["延长甲", "လက်သည်းတိုးချဲ့ခြင်း"], "Everyday": ["日常款", "နေ့စဉ်ဝတ်ဆင်ရန်"], "Signature": ["特色款", "ထူးခြားဒီဇိုင်း"], "Length": ["长度", "အရှည်"], "Shape": ["甲型", "ပုံစံ"], "Care": ["护理", "ဂရုစိုက်မှု"], "Prep & shaping": ["修整与塑形", "လက်သည်းပြင်ဆင်ခြင်းနှင့် ပုံဖော်ခြင်း"], "Clean & polished": ["干净精致", "သန့်ရှင်းပြီး လှပသပ်ရပ်သည်"], "Feel": ["感觉", "ခံစားချက်"], "Made for you": ["为你定制", "သင့်အတွက် အထူးဖန်တီးထားသည်"], "Everyday wear": ["适合日常", "နေ့စဉ်ဝတ်ဆင်ရန် သင့်တော်သည်"], "Nail preparation & shaping": ["指甲修整与塑形", "လက်သည်းပြင်ဆင်ခြင်းနှင့် ပုံဖော်ခြင်း"], "Gel color application": ["凝胶上色", "ဂျယ်လ်အရောင်တင်ခြင်း"], "Clean finish & care": ["精致收尾与护理", "သပ်ရပ်စွာ အပြီးသတ်ပြီး ဂရုစိုက်ပေးခြင်း"], "Base": ["基础护理", "အခြေခံပြင်ဆင်မှု"], "Manicure included": ["包含基础美甲", "အခြေခံလက်သည်းအလှပြင် ပါဝင်သည်"], "Design": ["设计", "ဒီဇိုင်း"], "Color & detail": ["颜色与细节", "အရောင်နှင့် အသေးစိတ်"], "Plan": ["方案", "အစီအစဉ်"], "Design consultation": ["设计沟通", "ဒီဇိုင်းအကြံပေးခြင်း"], "Extension application": ["延长甲制作", "လက်သည်းတိုးချဲ့ခြင်း"], "Finish & aftercare guidance": ["收尾与护理指导", "အပြီးသတ်နှင့် နောက်ဆက်တွဲဂရုစိုက်မှု လမ်းညွှန်"], "Our Latest Work": ["最新作品", "နောက်ဆုံးဖန်တီးထားသော လက်ရာများ"], "View gallery": ["查看全部作品", "လက်ရာများအားလုံးကို ကြည့်ရန်"], "Book this style": ["预约这个款式", "ဤဒီဇိုင်းဖြင့် ရက်ချိန်းယူရန်"], "Book an Appointment": ["预约", "ရက်ချိန်းယူရန်"], "Choose a service": ["选择服务", "ဝန်ဆောင်မှုကို ရွေးချယ်ပါ"], "Choose a date": ["选择日期", "ရက်စွဲကို ရွေးချယ်ပါ"], "Choose a time": ["选择时间", "အချိန်ကို ရွေးချယ်ပါ"], "Your details": ["您的信息", "သင့်အချက်အလက်များ"], "Name": ["姓名", "အမည်"], "Phone number": ["电话号码", "ဖုန်းနံပါတ်"], "Inspiration / reference": ["参考图片 / 灵感", "ကိုးကားပုံ / စိတ်ကူးပုံ"], "Additional note": ["备注", "ထပ်မံမှတ်ချက်"], "Confirm booking": ["确认预约", "ရက်ချိန်းကို အတည်ပြုရန်"], "Confirm request": ["确认预约请求", "ရက်ချိန်းတောင်းဆိုမှုကို အတည်ပြုရန်"], "Your booking request has been received.": ["您的预约请求已收到。", "သင့်ရဲ့ ရက်ချိန်းတောင်းဆိုမှုကို လက်ခံရရှိပါပြီ။"], "We will review your request and confirm your appointment.": ["我们会查看您的预约请求，并确认您的预约时间。", "သင့်ရဲ့ ရက်ချိန်းတောင်းဆိုမှုကို စစ်ဆေးပြီး ရက်ချိန်းအချိန်ကို အတည်ပြုပေးပါမယ်။"], "Pending": ["待确认", "အတည်ပြုရန် စောင့်ဆိုင်းနေသည်"], "Confirmed": ["已确认", "အတည်ပြုပြီး"], "Cancelled": ["已取消", "ပယ်ဖျက်ပြီး"], "Completed": ["已完成", "ပြီးစီးပြီ"], "Notifications": ["通知", "အသိပေးချက်များ"], "Need Help?": ["需要帮助吗？", "အကူအညီလိုပါသလား။"], "Message us": ["联系我们", "ကျွန်ုပ်တို့ထံ စာပို့ရန်"], "How can we help you?": ["请问有什么可以帮助您？", "ဘယ်လိုကူညီပေးရမလဲ။"], "Your message": ["您的留言", "သင့်ရဲ့စာ"], "Send message": ["发送消息", "စာပို့ရန်"], "Call us": ["联系我们", "ဖုန်းဆက်ရန်"], "WhatsApp us": ["通过 WhatsApp 联系我们", "WhatsApp မှတစ်ဆင့် ဆက်သွယ်ရန်"], "Overview": ["总览", "အကျဉ်းချုပ်"], "Studio Content": ["工作室内容", "စတူဒီယို အကြောင်းအရာ"], "Media": ["媒体库", "မီဒီယာ"], "Bookings": ["预约管理", "ရက်ချိန်း စီမံခန့်ခွဲမှု"], "Messages": ["客户消息", "ဖောက်သည်စာများ"], "Booking Rules": ["预约规则", "ရက်ချိန်း စည်းမျဉ်းများ"], "Open customer site ↗": ["打开客户网站 ↗", "ဖောက်သည်ဝဘ်ဆိုဒ်ကို ဖွင့်ရန် ↗"], "Today's bookings": ["今日预约", "ယနေ့ ရက်ချိန်းများ"], "Pending requests": ["待处理预约", "အတည်ပြုရန် စောင့်ဆိုင်းနေသော တောင်းဆိုမှုများ"], "Unread messages": ["未读消息", "မဖတ်ရသေးသော စာများ"], "Customers": ["客户", "ဖောက်သည်များ"], "Today's schedule": ["今日安排", "ယနေ့ အစီအစဉ်"], "Recent messages": ["最近消息", "လတ်တလော စာများ"], "Latest booking requests": ["最新预约请求", "နောက်ဆုံး ရက်ချိန်းတောင်းဆိုမှုများ"], "Quick actions": ["快捷操作", "အမြန်လုပ်ဆောင်ချက်များ"], "Keep the studio fresh.": ["让工作室保持最新状态。", "စတူဒီယိုအကြောင်းအရာများကို အမြဲအသစ်ဖြစ်နေအောင် ထိန်းသိမ်းပါ။"], "Good morning.": ["早上好。", "မင်္ဂလာနံနက်ခင်းပါ။"], "Good afternoon.": ["下午好。", "မင်္ဂလာနေ့လယ်ခင်းပါ။"], "Good evening.": ["晚上好。", "မင်္ဂလာညချမ်းပါ။"], "Booking details": ["预约详情", "ရက်ချိန်းအသေးစိတ်"], "Customer": ["客户", "ဖောက်သည်"], "Customer ID": ["客户编号", "ဖောက်သည်နံပါတ်"], "Date": ["日期", "ရက်စွဲ"], "Time": ["时间", "အချိန်"], "Duration": ["时长", "ကြာချိန်"], "Phone": ["电话", "ဖုန်း"], "Customer note": ["客户备注", "ဖောက်သည်၏ မှတ်ချက်"], "Confirm": ["确认", "အတည်ပြုရန်"], "Cancel": ["取消", "ပယ်ဖျက်ရန်"], "Mark as completed": ["标记为已完成", "ပြီးစီးပြီဟု သတ်မှတ်ရန်"], "Open chats": ["进行中的聊天", "ဖွင့်ထားသော စကားပြောခန်းများ"], "Unread": ["未读", "မဖတ်ရသေးသော"], "Close conversation": ["关闭对话", "စကားပြောခန်းကို ပိတ်ရန်"], "Reopen conversation": ["重新打开对话", "စကားပြောခန်းကို ပြန်ဖွင့်ရန်"], "Reply": ["回复", "ပြန်စာပို့ရန်"], "No bookings match this filter.": ["没有符合此筛选条件的预约。", "ဤစစ်ထုတ်မှုနှင့် ကိုက်ညီသော ရက်ချိန်းမရှိပါ။"], "No booking requests yet.": ["目前还没有预约请求。", "လောလောဆယ် ရက်ချိန်းတောင်းဆိုမှု မရှိသေးပါ။"], "No messages yet": ["还没有消息", "စာမရှိသေးပါ။"], "Unnamed customer": ["未填写姓名的客户", "အမည်မဖော်ပြထားသော ဖောက်သည်"], "No phone": ["未填写电话", "ဖုန်းနံပါတ် မရှိပါ။"], "Price on request": ["价格请咨询", "စျေးနှုန်းကို ဆက်သွယ်မေးမြန်းရန်"], "Time confirmed": ["时间待确认", "အချိန်ကို အတည်ပြုပေးမည်"], "Service": ["服务项目", "ဝန်ဆောင်မှု"], "Open": ["打开", "ဖွင့်ရန်"], "Paused": ["已暂停", "ခေတ္တရပ်ထားသည်"], "Sign out": ["退出登录", "အကောင့်မှ ထွက်ရန်"], "Connect Admin": ["连接后台", "စီမံခန့်ခွဲရေးသို့ ချိတ်ဆက်ရန်"], "Admin connected": ["后台已连接", "စီမံခန့်ခွဲရေး ချိတ်ဆက်ပြီး"], "Add a new look": ["添加新作品", "လက်ရာအသစ် ထည့်ရန်"], "Update a service": ["更新服务", "ဝန်ဆောင်မှု ပြင်ဆင်ရန်"], "Replace a photo": ["更换照片", "ဓာတ်ပုံ ပြောင်းရန်"], "Adjust availability": ["调整预约时间", "ရက်ချိန်းအချိန် ပြင်ဆင်ရန်"], "Pricing & timing": ["价格与时长", "စျေးနှုန်းနှင့် ကြာချိန်"], "Media library": ["媒体库", "မီဒီယာစာကြည့်တိုက်"], "Booking rules": ["预约规则", "ရက်ချိန်း စည်းမျဉ်းများ"], "Reply to Customer 0001...": ["回复客户 0001……", "ဖောက်သည် 0001 ထံ ပြန်စာပို့ရန်…"], "Customer 0001": ["客户 0001", "ဖောက်သည် 0001"], "Customer 0002": ["客户 0002", "ဖောက်သည် 0002"], "Copied": ["已复制", "ကူးယူပြီး"], "Unavailable": ["不可用", "မရနိုင်ပါ"], "Available": ["可预约", "ရနိုင်သည်"], "Today": ["今天", "ယနေ့"], "Tomorrow": ["明天", "မနက်ဖြန်"], "Date selected. Pick an available time to continue.": ["日期已选择，请继续选择可预约时间。", "ရက်စွဲရွေးပြီးပါပြီ။ ဆက်လက်၍ ရနိုင်သောအချိန်ကို ရွေးချယ်ပါ။"], "The Studio is closed on this day.": ["工作室当天休息。", "ထိုနေ့တွင် စတူဒီယို ပိတ်ပါသည်။"], "Online booking is currently paused.": ["在线预约目前已暂停。", "အွန်လိုင်းရက်ချိန်းကို လောလောဆယ် ခေတ္တရပ်ထားပါသည်။"], "No appointments available": ["暂无可预约时间", "ရက်ချိန်းအချိန် မရရှိသေးပါ။"], "No times remain today. Please choose another date.": ["今天已没有可预约时间，请选择其他日期。", "ယနေ့အတွက် ရက်ချိန်းအချိန် မကျန်တော့ပါ။ အခြားရက်စွဲကို ရွေးချယ်ပါ။"], "Please enter your name before sending the request.": ["提交预约前请输入您的姓名。", "ရက်ချိန်းတောင်းဆိုမှု မပို့မီ အမည်ထည့်ပါ။"], "Please enter a valid phone number before sending the request.": ["提交预约前请输入有效的电话号码。", "ရက်ချိန်းတောင်းဆိုမှု မပို့မီ မှန်ကန်သော ဖုန်းနံပါတ်ထည့်ပါ။"], "Please choose a service first.": ["请先选择服务项目。", "အရင်ဆုံး ဝန်ဆောင်မှုကို ရွေးချယ်ပါ။"], "Please choose an appointment date.": ["请选择预约日期。", "ရက်ချိန်းရက်စွဲကို ရွေးချယ်ပါ။"], "Please choose an available time.": ["请选择可预约的时间。", "ရနိုင်သော ရက်ချိန်းအချိန်ကို ရွေးချယ်ပါ။"], "Everything is selected. Add your contact details and send the request.": ["已选择完成，请填写联系方式并提交预约请求。", "အားလုံးရွေးချယ်ပြီးပါပြီ။ ဆက်သွယ်ရန်အချက်အလက်များ ဖြည့်ပြီး တောင်းဆိုမှုကို ပို့ပါ။"], "Booking details update as you choose.": ["选择过程中，预约详情会自动更新。", "ရွေးချယ်နေစဉ် ရက်ချိန်းအသေးစိတ်ကို အလိုအလျောက် ပြင်ဆင်ပေးပါမည်။"], "Appointment request": ["预约请求", "ရက်ချိန်းတောင်းဆိုမှု"], "BOOKING CONFIRMED": ["预约已确认", "ရက်ချိန်း အတည်ပြုပြီး"], "BOOKING UPDATE": ["预约更新", "ရက်ချိန်း အပ်ဒိတ်"], "BOOKING COMPLETE": ["预约已完成", "ရက်ချိန်း ပြီးစီးပြီ"], "BOOKING RECEIVED": ["已收到预约", "ရက်ချိန်းတောင်းဆိုမှု လက်ခံရရှိပြီ"], "NEW MESSAGE": ["新消息", "စာအသစ်"], "STUDIO UPDATE": ["工作室更新", "စတူဒီယို အပ်ဒိတ်"], "Your appointment is confirmed.": ["您的预约已确认。", "သင့်ရဲ့ ရက်ချိန်းကို အတည်ပြုပြီးပါပြီ။"], "Your appointment was not confirmed.": ["您的预约未被确认。", "သင့်ရဲ့ ရက်ချိန်းကို အတည်မပြုနိုင်ပါ။"], "Close": ["关闭", "ပိတ်ရန်"], "Selected": ["已选择", "ရွေးချယ်ပြီး"], "Not selected": ["未选择", "မရွေးချယ်ရသေးပါ"], "To confirm": ["待确认", "အတည်ပြုရန်"], "Customer care": ["客户服务", "ဖောက်သည်ဝန်ဆောင်မှု"], "Recent": ["最近", "လတ်တလော"]};
  Object.assign(I18N, {"Beauty Studio · Nails & Beauty":["美容工作室 · 美甲与美容","အလှအပ စတူဒီယို · လက်သည်းနှင့် အလှအပ"],"Skip to content":["跳转到内容","အကြောင်းအရာသို့ သွားရန်"],"NAILS & BEAUTY":["美甲与美容","လက်သည်းနှင့် အလှအပ"],"A little beauty, made for you":["为你而生的一点美丽","သင့်အတွက် ဖန်တီးထားတဲ့ အလှအပလေး"],"Your nails.":["你的指尖。","သင့်လက်သည်းများ။"],"Your style.":["你的风格。","သင့်စတိုင်။"],"FEATURED STYLE":["精选款式","အထူးရွေးချယ်ထားသော ဒီဇိုင်း"],"Soft Blush":["柔雾腮红","နူးညံ့တဲ့ Blush"],"Clean · Elegant · Everyday":["干净 · 优雅 · 日常","သန့်ရှင်း · ကြော့ရှင်း · နေ့စဉ်"],"Every detail matters.":["每一个细节都重要。","အသေးစိတ်တိုင်း အရေးကြီးပါတယ်။"],"NAIL ART":["美甲艺术","လက်သည်းအလှဒီဇိုင်း"],"MANICURE":["基础美甲","လက်သည်းအလှပြင်"],"GEL NAILS":["凝胶美甲","ဂျယ်လ် လက်သည်း"],"SELF CARE":["自我呵护","ကိုယ့်ကိုယ်ကို ဂရုစိုက်မှု"],"Choose your":["选择你的","သင့်ရဲ့"],"moment.":["时刻。","အချိန်လေး။"],"Thoughtful nail care, refined finishes and little details made around you.":["细致的美甲护理、精致的收尾，以及围绕你的每一个小细节。","ဂရုတစိုက် လက်သည်းစောင့်ရှောက်မှု၊ သပ်ရပ်တဲ့ အပြီးသတ်မှုနဲ့ သင့်အတွက် အထူးအသေးစိတ်များ။"],"PRICING & TIMING ARE SHOWN BEFORE YOU BOOK":["预约前会显示价格与时长","ရက်ချိန်းမယူမီ စျေးနှုန်းနှင့် ကြာချိန်ကို ပြသပါမည်"],"THE EVERYDAY EDIT":["日常精选","နေ့စဉ်ရွေးချယ်မှု"],"Clean, polished and long-lasting nails for everyday elegance.":["干净、精致且持久，适合每天的优雅。","နေ့စဉ်အတွက် သန့်ရှင်းသပ်ရပ်ပြီး ကြာရှည်ခံတဲ့ လက်သည်းဒီဇိုင်း။"],"Clean finish":["精致收尾","သပ်ရပ်တဲ့ အပြီးသတ်"],"Long-lasting":["持久","ကြာရှည်ခံ"],"From 00 MMK":["起价 00 MMK","00 MMK မှ စတင်"],"Shape · Prep · Gel":["甲型 · 修整 · 凝胶","ပုံစံ · ပြင်ဆင်မှု · ဂျယ်လ်"],"THE SIGNATURE EDIT":["特色精选","ထူးခြားရွေးချယ်မှု"],"Your idea, your colors, your little details — made just for you.":["你的想法、你的颜色、你的细节，为你专属打造。","သင့်စိတ်ကူး၊ သင့်အရောင်၊ သင့်အသေးစိတ်များကို သင့်အတွက် အထူးဖန်တီးပေးပါမယ်။"],"Custom detail":["专属细节","စိတ်ကြိုက်အသေးစိတ်"],"Creative":["创意","ဖန်တီးမှု"],"Base · Design · Detail":["基础 · 设计 · 细节","အခြေခံ · ဒီဇိုင်း · အသေးစိတ်"],"THE LENGTH EDIT":["延长精选","လက်သည်းတိုးချဲ့ရွေးချယ်မှု"],"Beautiful shape and length designed around your natural style.":["根据你的自然风格打造适合的甲型与长度。","သင့်သဘာဝစတိုင်နဲ့ ကိုက်ညီတဲ့ ပုံစံနဲ့ အရှည်ကို ဖန်တီးပေးပါမယ်။"],"Refined":["精致","သပ်ရပ်ကြော့ရှင်း"],"Shape · Length · Finish":["甲型 · 长度 · 收尾","ပုံစံ · အရှည် · အပြီးသတ်"],"Not sure what to choose?":["不知道怎么选？","ဘာရွေးရမလဲ မသေချာဘူးလား။"],"Start with the look you love. Your final service can be fine-tuned with the Studio before the appointment is confirmed.":["从你喜欢的款式开始。预约确认前，可以和工作室一起微调最终服务。","သင်နှစ်သက်တဲ့ ဒီဇိုင်းကနေ စလိုက်ပါ။ ရက်ချိန်းအတည်ပြုမီ စတူဒီယိုနဲ့အတူ နောက်ဆုံးဝန်ဆောင်မှုကို ပြင်ဆင်နိုင်ပါတယ်။"],"PERSONALIZED":["专属定制","သင့်အတွက် အထူး"],"Start booking":["开始预约","ရက်ချိန်းစတင်ရန်"],"STUDIO EDIT":["工作室精选","စတူဒီယိုရွေးချယ်မှု"],"Color · Detail · Mood":["颜色 · 细节 · 氛围","အရောင် · အသေးစိတ် · ခံစားချက်"],"Special for you":["为你特别打造","သင့်အတွက် အထူး"],"New look.":["全新风格。","စတိုင်အသစ်။"],"New mood.":["全新心情。","ခံစားချက်အသစ်။"],"Seasonal colors, little details and styles made for the moments you want to remember.":["季节色彩、细节与风格，为你想记住的时刻而打造。","ရာသီအလိုက် အရောင်များ၊ အသေးစိတ်များနဲ့ သင်မှတ်သားထားချင်တဲ့ အချိန်လေးတွေအတွက် ဒီဇိုင်းများ။"],"See promotions":["查看推荐","အထူးအစီအစဉ်များကြည့်ရန်"],"Real nails.":["真实作品。","တကယ့်လက်ရာများ။"],"Real happiness.":["真实的快乐。","တကယ့်ပျော်ရွှင်မှု။"],"View all work":["查看全部作品","လက်ရာအားလုံးကြည့်ရန်"],"Find your mood":["找到你的风格","သင့်စိတ်ကြိုက်စတိုင်ရှာရန်"],"All":["全部","အားလုံး"],"Simple":["简约","ရိုးရှင်း"],"Elegant":["优雅","ကြော့ရှင်း"],"Trendy":["时尚","ခေတ်မီ"],"Cute":["可爱","ချစ်စရာ"],"styles":["款式","ဒီဇိုင်းများ"],"Elegant · Gel":["优雅 · 凝胶","ကြော့ရှင်း · ဂျယ်လ်"],"Simple · Gel":["简约 · 凝胶","ရိုးရှင်း · ဂျယ်လ်"],"Trendy · Art":["时尚 · 艺術","ခေတ်မီ · အနုပညာ"],"Cute · Art":["可爱 · 艺术","ချစ်စရာ · အနုပညာ"],"Elegant · Extensions":["优雅 · 延长甲","ကြော့ရှင်း · လက်သည်းတိုးချဲ့"],"View →":["查看 →","ကြည့်ရန် →"],"THE STUDIO":["工作室","စတူဒီယို"],"Beauty, in your":["属于你的美丽","သင့်ရဲ့ အလှအပ"],"own little way.":["以你喜欢的方式。","သင့်စတိုင်လေးနဲ့။"],"A quiet space for":["一个安静的空间，留给","တိတ်ဆိတ်အေးချမ်းတဲ့ နေရာလေး"],"yourself.":["你自己。","သင့်အတွက်။"],"Studio signature":["工作室特色","စတူဒီယိုအမှတ်တံဆိပ်"],"Studio philosophy":["工作室理念","စတူဒီယိုအတွေးအခေါ်"],"Quiet appointments, thoughtful details and nails that still feel like you.":["安静的预约、细致的服务，以及依然像你的美甲。","အေးချမ်းတဲ့ ရက်ချိန်း၊ ဂရုတစိုက်အသေးစိတ်နဲ့ သင့်လိုခံစားရတဲ့ လက်သည်းဒီဇိုင်း။"],"Personal":["专属","ကိုယ်ပိုင်"],"Every set starts with your mood, your style and the little details you care about.":["每一套都从你的心情、风格和在意的小细节开始。","ဒီဇိုင်းတိုင်းက သင့်ခံစားချက်၊ သင့်စတိုင်နဲ့ သင်ဂရုစိုက်တဲ့ အသေးစိတ်လေးတွေကနေ စပါတယ်။"],"Thoughtful":["用心","ဂရုတစိုက်"],"A calm process, considered choices and a finish that feels polished without feeling overdone.":["从容的过程、经过考虑的选择，以及不过度却足够精致的收尾。","အေးချမ်းတဲ့ လုပ်ငန်းစဉ်၊ စဉ်းစားရွေးချယ်မှုနဲ့ အလွန်အကျွံမဖြစ်ဘဲ သပ်ရပ်တဲ့ အပြီးသတ်မှု။"],"Yours":["属于你","သင့်အတွက်"],"Save a look, bring an idea or simply choose a color. The final result should still feel like you.":["收藏喜欢的款式、带来灵感，或只是选一个颜色。最终效果依然应该像你。","သင်ကြိုက်တဲ့ ဒီဇိုင်းကို သိမ်းထားပါ၊ စိတ်ကူးယူလာပါ၊ ဒါမှမဟုတ် အရောင်တစ်ရောင်ရွေးပါ။ နောက်ဆုံးရလဒ်က သင့်လိုပဲ ဖြစ်နေသင့်ပါတယ်။"],"Professional":["专业","ကျွမ်းကျင်"],"Carefully finished":["细致完成","ဂရုတစိုက် အပြီးသတ်"],"Relaxing":["放松","အေးချမ်း"],"Your time":["你的时间","သင့်အချိန်"],"Keep Beauty Studio":["让 Beauty Studio","Beauty Studio ကို"],"close to you.":["陪在你身边。","သင့်အနီးမှာ ရှိနေစေပါ။"],"Add to Home Screen":["添加到主屏幕","ပင်မမျက်နှာပြင်သို့ ထည့်ရန်"],"Install Beauty Studio":["安装 Beauty Studio","Beauty Studio ကို ထည့်သွင်းရန်"],"Available on phones, tablets & computers":["支持手机、平板与电脑","ဖုန်း၊ တက်ဘလက်နဲ့ ကွန်ပျူတာများတွင် အသုံးပြုနိုင်သည်"],"iPhone / iPad":["iPhone / iPad","iPhone / iPad"],"Android":["Android","Android"],"Phone / Tablet":["手机 / 平板","ဖုန်း / တက်ဘလက်"],"Mac":["Mac","Mac"],"Safari / Chrome":["Safari / Chrome","Safari / Chrome"],"Windows":["Windows","Windows"],"Chrome / Edge":["Chrome / Edge","Chrome / Edge"],"Device-aware install guide":["设备专属安装指南","စက်အလိုက် ထည့်သွင်းနည်းလမ်းညွှန်"],"YOUR DEVICE":["你的设备","သင့်စက်"],"Add Beauty Studio":["添加 Beauty Studio","Beauty Studio ထည့်ရန်"],"to your home screen.":["到主屏幕。","ပင်မမျက်နှာပြင်သို့။"],"Follow the steps for your device. Once Beauty Studio is added, this button will disappear.":["按照你的设备步骤操作。添加 Beauty Studio 后，此按钮会消失。","သင့်စက်အတွက် အဆင့်များကို လိုက်နာပါ။ Beauty Studio ထည့်ပြီးနောက် ဒီခလုတ် ပျောက်သွားပါမယ်။"],"Open the browser menu":["打开浏览器菜单","ဘရောက်ဇာမီနူးကို ဖွင့်ရန်"],"Open the sharing or browser menu on your device.":["打开设备上的分享或浏览器菜单。","သင့်စက်ပေါ်ရှိ မျှဝေခြင်း သို့မဟုတ် ဘရောက်ဇာမီနူးကို ဖွင့်ပါ။"],"Choose Add to Home Screen":["选择添加到主屏幕","ပင်မမျက်နှာပြင်သို့ ထည့်ရန် ရွေးချယ်ပါ"],"Select the option to add Beauty Studio.":["选择添加 Beauty Studio 的选项。","Beauty Studio ထည့်ရန် ရွေးချယ်မှုကို ရွေးပါ။"],"You're ready":["准备好了","အသင့်ဖြစ်ပါပြီ"],"Beauty Studio will appear as an app on your device.":["Beauty Studio 会像 App 一样出现在设备上。","Beauty Studio က သင့်စက်မှာ App တစ်ခုလို ပေါ်လာပါမယ်။"],"✦ You can open Beauty Studio from your home screen anytime.":["✦ 你可以随时从主屏幕打开 Beauty Studio。","✦ ပင်မမျက်နှာပြင်ကနေ Beauty Studio ကို အချိန်မရွေး ဖွင့်နိုင်ပါတယ်။"],"I've added it":["我已经添加","ထည့်ပြီးပါပြီ"],"Maybe later":["以后再说","နောက်မှ"],"Ready for your":["准备好迎接你的","သင့်ရဲ့"],"next set?":["下一套了吗？","နောက်ထပ် လက်သည်းဒီဇိုင်းအတွက် အသင့်ဖြစ်ပြီလား။"],"Choose your service, find a convenient time and let us take care of the details.":["选择服务、找到方便的时间，其余细节交给我们。","ဝန်ဆောင်မှုရွေးပါ၊ အဆင်ပြေတဲ့အချိန်ရွေးပါ၊ ကျန်အသေးစိတ်ကို ကျွန်ုပ်တို့က ဂရုစိုက်ပေးပါမယ်။"],"♡ Personal care":["♡ 专属护理","♡ ကိုယ်ပိုင်ဂရုစိုက်မှု"],"◷ Flexible time":["◷ 灵活时间","◷ အဆင်ပြေတဲ့အချိန်"],"✦ Easy booking":["✦ 轻松预约","✦ လွယ်ကူတဲ့ ရက်ချိန်း"],"Come say":["来和我们","လာပြီး"],"hello.":["打个招呼吧。","နှုတ်ဆက်လိုက်ပါ။"],"Questions, bookings, or simply a friendly hello — we’re always here for you.":["有问题、想预约，或者只是想打个招呼——我们一直都在。","မေးခွန်းများ၊ ရက်ချိန်းများ ဒါမှမဟုတ် နှုတ်ဆက်ရုံပဲဖြစ်ဖြစ် — ကျွန်ုပ်တို့ အမြဲရှိပါတယ်။"],"Location":["位置","တည်နေရာ"],"Studio address will appear here":["工作室地址将在这里显示","စတူဒီယိုလိပ်စာကို ဒီမှာ ပြပါမယ်"],"View on Maps →":["在地图上查看 →","မြေပုံတွင် ကြည့်ရန် →"],"Hours":["营业时间","ဖွင့်ချိန်"],"See availability →":["查看可预约时间 →","ရနိုင်တဲ့အချိန်ကြည့်ရန် →"],"Call studio →":["联系工作室 →","စတူဒီယိုကို ဖုန်းဆက်ရန် →"],"By appointment only":["仅限预约","ရက်ချိန်းဖြင့်သာ"],"Appointments are confirmed after your request is reviewed.":["预约请求审核后才会确认。","သင့်တောင်းဆိုမှုကို စစ်ဆေးပြီးမှ ရက်ချိန်းအတည်ပြုပါမယ်။"],"STAY CLOSE":["保持联系","ဆက်သွယ်နေပါ"],"Message the Studio":["联系工作室","စတူဒီယိုထံ စာပို့ရန်"],"Chat now →":["立即聊天 →","အခု စကားပြောရန် →"],"Join →":["加入 →","ဝင်ရန် →"],"STUDIO NOTE":["工作室寄语","စတူဒီယိုမှတ်ချက်"],"Good nails.":["好看的指甲。","လှပတဲ့ လက်သည်းများ။"],"Brighter days.":["更明亮的每一天。","ပိုတောက်ပတဲ့ နေ့ရက်များ။"],"Made for beautiful little moments.":["为每一个美好小瞬间而打造。","လှပတဲ့ အချိန်လေးတိုင်းအတွက် ဖန်တီးထားပါတယ်။"],"STYLE":["风格","စတိုင်"],"MOOD":["氛围","ခံစားချက်"],"Soft & polished":["柔和 · 精致","နူးညံ့ · သပ်ရပ်"],"RECOMMENDED":["推荐","အကြံပြု"],"Love this look? Bring it as inspiration and the studio can fine-tune the details for you.":["喜欢这个款式？带来作为灵感，我们可以为你微调细节。","ဒီဒီဇိုင်းကို ကြိုက်လား။ စိတ်ကူးအဖြစ် ယူလာပါ၊ အသေးစိတ်ကို သင့်အတွက် ပြင်ဆင်ပေးနိုင်ပါတယ်။"],"Natural beauty, lasting glow.":["自然之美，持久光彩。","သဘာဝအလှ၊ ကြာရှည်တောက်ပမှု။"],"Finish":["收尾","အပြီးသတ်"],"What's included":["包含内容","ပါဝင်သည့်အရာများ"],"Final price may vary with length, design detail and add-ons.":["最终价格可能因长度、设计细节和附加项目而有所变化。","နောက်ဆုံးစျေးနှုန်းက အရှည်၊ ဒီဇိုင်းအသေးစိတ်နဲ့ အပိုဝန်ဆောင်မှုအလိုက် ပြောင်းလဲနိုင်ပါတယ်။"],"Book your":["预约你的","သင့်ရဲ့"],"PRIVATE APPOINTMENT":["私人预约","ကိုယ်ပိုင်ရက်ချိန်း"],"A little time, made entirely for you.":["留一点时间，只为你而准备。","သင့်အတွက်ပဲ သီးသန့်ထားတဲ့ အချိန်လေး။"],"BY APPOINTMENT":["预约制","ရက်ချိန်းဖြင့်"],"You can change this later.":["之后可以更改。","နောက်မှ ပြောင်းနိုင်ပါတယ်။"],"Pick a day first, then a time.":["先选择日期，再选择时间。","အရင် ရက်စွဲရွေးပြီးမှ အချိန်ရွေးပါ။"],"← Back to service":["← 返回服务","← ဝန်ဆောင်မှုသို့ ပြန်ရန်"],"Choose date":["选择日期","ရက်စွဲရွေးရန်"],"Pick a date":["选择一个日期","ရက်စွဲတစ်ခု ရွေးပါ"],"Available times":["可预约时间","ရနိုင်သောအချိန်များ"],"Live availability · based on studio rules":["实时可预约时间 · 根据工作室规则","လက်ရှိရနိုင်သောအချိန် · စတူဒီယိုစည်းမျဉ်းအပေါ် အခြေခံ"],"← Back to date & time":["← 返回日期与时间","← ရက်စွဲနှင့်အချိန်သို့ ပြန်ရန်"],"We’ll use these details to confirm your appointment.":["我们会使用这些信息确认你的预约。","ဒီအချက်အလက်တွေနဲ့ သင့်ရက်ချိန်းကို အတည်ပြုပေးပါမယ်။"],"Inspiration":["灵感","စိတ်ကူး"],"Price":["价格","စျေးနှုန်း"],"Choose your service, date and time to continue.":["请选择服务、日期和时间继续。","ဆက်လက်ရန် ဝန်ဆောင်မှု၊ ရက်စွဲနဲ့ အချိန်ကို ရွေးပါ။"],"Thoughtful from start to finish.":["从开始到结束都用心。","အစမှ အဆုံးအထိ ဂရုတစိုက်။"],"Your request is reviewed by the Studio before the appointment is confirmed.":["预约确认前，工作室会先审核你的请求。","ရက်ချိန်းအတည်မပြုမီ စတူဒီယိုက သင့်တောင်းဆိုမှုကို စစ်ဆေးပါမယ်။"],"Your request is sent securely to the Studio for review. You’ll receive confirmation after it is reviewed.":["你的请求会安全发送给工作室审核，审核后你会收到确认。","သင့်တောင်းဆိုမှုကို စတူဒီယိုထံ လုံခြုံစွာ ပို့ပြီး စစ်ဆေးပါမယ်။ စစ်ဆေးပြီးနောက် အတည်ပြုချက် ရရှိပါမယ်။"],"PREVIEW":["预览","အစမ်းကြည့်ရန်"],"Request received.":["已收到请求。","တောင်းဆိုမှု လက်ခံရရှိပါပြီ။"],"Your appointment request is ready. The Studio will confirm the final time with you.":["预约请求已提交，工作室会与你确认最终时间。","ရက်ချိန်းတောင်းဆိုမှု ပို့ပြီးပါပြီ။ စတူဒီယိုက နောက်ဆုံးအချိန်ကို အတည်ပြုပေးပါမယ်။"],"Done":["完成","ပြီးပါပြီ"],"Customer notifications":["客户通知","ဖောက်သည် အသိပေးချက်များ"],"Updates":["更新","အပ်ဒိတ်များ"],"No new updates yet.":["暂无新通知。","အသိပေးချက်အသစ် မရှိသေးပါ။"],"Customer support chat":["客户支持聊天","ဖောက်သည်အကူအညီ စကားပြောခန်း"],"Need help?":["需要帮助？","အကူအညီလိုပါသလား။"],"Beauty Studio · Support":["Beauty Studio · 客户支持","Beauty Studio · အကူအညီ"],"How can we help?":["我们可以怎样帮助你？","ဘယ်လိုကူညီပေးရမလဲ။"],"Customer —":["客户 —","ဖောက်သည် —"],"We usually reply as soon as we can.":["我们会尽快回复。","တတ်နိုင်သမျှ အမြန်ဆုံး ပြန်ကြားပေးပါမယ်။"],"Ask us anything about services, designs or your appointment.":["关于服务、设计或预约，都可以问我们。","ဝန်ဆောင်မှု၊ ဒီဇိုင်း ဒါမှမဟုတ် ရက်ချိန်းနဲ့ ပတ်သက်တာ ဘာမဆို မေးနိုင်ပါတယ်။"],"Send":["发送","ပို့ရန်"],"Your conversation stays with your Customer ID after refresh.":["刷新后，你的对话仍会保留在客户编号下。","Refresh လုပ်ပြီးနောက် သင့်စကားပြောမှတ်တမ်းကို Customer ID နဲ့ ဆက်လက်သိမ်းထားပါမယ်။"],"Beauty Studio content hub. Update this one block when the real studio opens.":["Beauty Studio 内容中心。正式开店后，只需更新这一处。","Beauty Studio အကြောင်းအရာဗဟို။ တကယ့်စတူဒီယိုဖွင့်တဲ့အခါ ဒီနေရာတစ်ခုကိုပဲ ပြင်ဆင်ပါ။"],"Service ·":["服务 ·","ဝန်ဆောင်မှု ·"],"Appointment request":["预约请求","ရက်ချိန်းတောင်းဆိုမှု"],"BOOKING CONFIRMED":["预约已确认","ရက်ချိန်း အတည်ပြုပြီး"],"BOOKING UPDATE":["预约更新","ရက်ချိန်း အပ်ဒိတ်"],"BOOKING COMPLETE":["预约已完成","ရက်ချိန်း ပြီးစီးပြီ"],"BOOKING RECEIVED":["已收到预约","ရက်ချိန်း လက်ခံရရှိပြီ"],"NEW MESSAGE":["新消息","စာအသစ်"],"STUDIO UPDATE":["工作室更新","စတူဒီယို အပ်ဒိတ်"],"Your appointment is confirmed.":["你的预约已确认。","သင့်ရက်ချိန်းကို အတည်ပြုပြီးပါပြီ။"],"Your appointment was not confirmed.":["你的预约未被确认。","သင့်ရက်ချိန်းကို အတည်မပြုနိုင်ပါ။"],"Selected":["已选择","ရွေးချယ်ပြီး"],"Not selected":["未选择","မရွေးချယ်ရသေးပါ"],"To confirm":["待确认","အတည်ပြုရန်"],"Customer care":["客户服务","ဖောက်သည်ဝန်ဆောင်မှု"],"Recent":["最近","လတ်တလော"]});

  Object.assign(I18N, {
    "A little beauty, made for you":["为你而生的美丽。","သင့်အတွက် ဖန်တီးထားတဲ့ အလှအပလေး။"],
    "Your nails. Your style.":["你的指尖，你的风格。","သင့်လက်သည်း၊ သင့်စတိုင်။"],
    "Book an appointment →":["预约时间 →","ရက်ချိန်းယူရန် →"],
    "Explore our work ↗":["查看作品 ↗","ကျွန်ုပ်တို့၏ လက်ရာများကို ကြည့်ရန် ↗"],
    "Featured Style":["精选款式","ရွေးချယ်ထားသော ဒီဇိုင်း"],
    "Clean · Elegant · Everyday":["干净 · 优雅 · 日常","သန့်ရှင်း · လှပ · နေ့စဉ်"],
    "Every detail matters.":["每一个细节都很重要。","အသေးစိတ်တိုင်းက အရေးကြီးပါတယ်။"],
    "01 · Services":["01 · 服务","01 · ဝန်ဆောင်မှုများ"],
    "Choose your moment.":["选择属于你的时刻。","သင့်အတွက် အချိန်လေးကို ရွေးပါ။"],
    "Thoughtful nail care, refined finishes and little details made around you.":["细致的美甲护理、精致的收尾，以及围绕你的每一个小细节。","ဂရုတစိုက် လက်သည်းစောင့်ရှောက်မှု၊ သပ်ရပ်တဲ့အပြီးသတ်နဲ့ သင့်အတွက် အထူးအသေးစိတ်များ။"],
    "PRICING & TIMING ARE SHOWN BEFORE YOU BOOK":["预约前会显示价格与时长","ရက်ချိန်းမယူမီ စျေးနှုန်းနှင့် ကြာချိန်ကို ပြသပါမည်"],
    "THE EVERYDAY EDIT":["日常精选","နေ့စဉ်ရွေးချယ်မှု"],"THE SIGNATURE EDIT":["特色精选","ထူးခြားရွေးချယ်မှု"],"THE LENGTH EDIT":["延长精选","လက်သည်းတိုးချဲ့ ရွေးချယ်မှု"],
    "Clean finish":["精致收尾","သပ်ရပ်အပြီးသတ်"],"Long-lasting":["持久耐看","ကြာရှည်ခံ"],"Creative":["创意","ဖန်တီးမှု"],"Refined":["精致","သပ်ရပ်ခမ်းနား"],
    "From 00 MMK":["起价 00 MMK","00 MMK မှ စတင်"],"60 min":["60 分钟","60 မိနစ်"],"90 min":["90 分钟","90 မိနစ်"],"120 min":["120 分钟","120 မိနစ်"],
    "Shape · Prep · Gel":["甲型 · 修整 · 凝胶","ပုံစံ · ပြင်ဆင် · ဂျယ်လ်"],"Base · Design · Detail":["基础 · 设计 · 细节","အခြေခံ · ဒီဇိုင်း · အသေးစိတ်"],"Shape · Length · Finish":["甲型 · 长度 · 收尾","ပုံစံ · အရှည် · အပြီးသတ်"],
    "Not sure what to choose?":["不知道怎么选？","ဘာကိုရွေးရမလဲ မသေချာဘူးလား။"],
    "Start with the look you love. Your final service can be fine-tuned with the Studio before the appointment is confirmed.":["从你喜欢的款式开始。预约确认前，工作室可以与你一起微调最终服务。","သင်ကြိုက်တဲ့ ဒီဇိုင်းကနေ စတင်ပါ။ ရက်ချိန်းအတည်မပြုမီ စတူဒီယိုနဲ့အတူ နောက်ဆုံးဝန်ဆောင်မှုကို ပြင်ဆင်နိုင်ပါတယ်။"],
    "PERSONALIZED":["专属定制","သင့်အတွက် အထူးပြု"],"Start booking →":["开始预约 →","ရက်ချိန်းစတင်ရန် →"],"STUDIO EDIT":["工作室精选","စတူဒီယိုရွေးချယ်မှု"],
    "Color · Detail · Mood":["颜色 · 细节 · 氛围","အရောင် · အသေးစိတ် · ခံစားချက်"],"Special for you":["为你特别准备","သင့်အတွက် အထူး"],
    "New look. New mood. Seasonal colors, little details and styles made for the moments you want to remember.":["新的款式，新的心情。为值得记住的时刻准备季节色彩、细节与风格。","ဒီဇိုင်းအသစ်၊ ခံစားချက်အသစ်။ မှတ်မိချင်တဲ့ အချိန်တွေအတွက် ရာသီအလိုက်အရောင်၊ အသေးစိတ်နဲ့ စတိုင်များ။"],"See promotions →":["查看精选 →","အထူးအစီအစဉ်များ ကြည့်ရန် →"],
    "02 · Our Work":["02 · 作品","02 · လက်ရာများ"],"Real nails.":["真实美甲。","တကယ့်လက်သည်းအလှ။"],"Real happiness.":["真实的快乐。","တကယ့်ပျော်ရွှင်မှု။"],"View all work ↗":["查看全部作品 ↗","လက်ရာအားလုံး ကြည့်ရန် ↗"],
    "Find your mood":["找到你的感觉","သင့်ခံစားချက်ကို ရှာပါ"],
    "Save a look you love. Real studio photos can be added here anytime — and we can use your favorite look as inspiration when you book.":["收藏你喜欢的款式。以后可以随时加入真实工作室照片，预约时也可以用喜欢的款式作为灵感。","သင်ကြိုက်တဲ့ ဒီဇိုင်းကို သိမ်းထားပါ။ နောက်ပိုင်းမှာ စတူဒီယိုဓာတ်ပုံအစစ်တွေ ထည့်နိုင်ပြီး ရက်ချိန်းယူတဲ့အခါ အကြိုက်ဆုံးဒီဇိုင်းကို စိတ်ကူးအဖြစ် အသုံးပြုနိုင်ပါတယ်။"],
    "All":["全部","အားလုံး"],"Simple":["简约","ရိုးရှင်း"],"Elegant":["优雅","လှပသပ်ရပ်"],"Trendy":["潮流","ခေတ်မီ"],"Cute":["可爱","ချစ်စရာ"],"styles":["款式","ဒီဇိုင်းများ"],"style":["款式","ဒီဇိုင်း"],"View →":["查看 →","ကြည့်ရန် →"],
    "03 · The Studio":["03 · 工作室","03 · စတူဒီယို"],"A quiet space for yourself.":["属于你自己的安静空间。","သင့်အတွက် အေးချမ်းတဲ့ နေရာလေး။"],
    "Beauty Studio is built around a simple idea: your appointment should feel personal. From the first color choice to the final detail, everything is done with patience and care.":["Beauty Studio 始终围绕一个简单的想法：你的预约应该真正属于你。从第一次选色到最后一个细节，我们都耐心而用心地完成。","Beauty Studio ရဲ့ အခြေခံအယူအဆက ရိုးရှင်းပါတယ် — သင့်ရက်ချိန်းက သင့်အတွက် ကိုယ်ပိုင်ဖြစ်ရပါမယ်။ ပထမဆုံးအရောင်ရွေးချယ်မှုကနေ နောက်ဆုံးအသေးစိတ်အထိ စိတ်ရှည်ပြီး ဂရုတစိုက်လုပ်ဆောင်ပေးပါတယ်။"],
    "Studio philosophy":["工作室理念","စတူဒီယိုအတွေးအခေါ်"],"Quiet appointments, thoughtful details and nails that still feel like you.":["安静的预约、细致的服务，以及依然像你的指尖。","အေးချမ်းတဲ့ ရက်ချိန်း၊ ဂရုတစိုက်အသေးစိတ်နဲ့ သင့်လိုပဲ ခံစားရတဲ့ လက်သည်းများ။"],
    "Personal":["专属","ကိုယ်ပိုင်"],"Thoughtful":["用心","ဂရုတစိုက်"],"Yours":["属于你","သင့်အတွက်"],
    "Every set starts with your mood, your style and the little details you care about.":["每一套都从你的心情、风格和你在意的小细节开始。","ဒီဇိုင်းတိုင်းက သင့်ခံစားချက်၊ သင့်စတိုင်နဲ့ သင်ဂရုစိုက်တဲ့ အသေးစိတ်လေးတွေကနေ စပါတယ်။"],
    "A calm process, considered choices and a finish that feels polished without feeling overdone.":["从容的过程、经过思考的选择，以及精致却不过度的收尾。","အေးချမ်းတဲ့ လုပ်ငန်းစဉ်၊ စဉ်းစားရွေးချယ်မှုတွေနဲ့ အလွန်အကျွံမဖြစ်ဘဲ သပ်ရပ်တဲ့အပြီးသတ်။"],
    "Save a look, bring an idea or simply choose a color. The final result should still feel like you.":["收藏一个款式、带来一个想法，或者简单选一种颜色。最后的结果依然应该像你。","ဒီဇိုင်းတစ်ခု သိမ်းထားပါ၊ စိတ်ကူးတစ်ခု ယူလာပါ ဒါမှမဟုတ် အရောင်တစ်ရောင်ပဲ ရွေးပါ။ နောက်ဆုံးရလဒ်ကလည်း သင့်လိုပဲ ဖြစ်သင့်ပါတယ်။"],
    "Professional":["专业","ကျွမ်းကျင်"],"Carefully finished":["细致完成","ဂရုတစိုက် အပြီးသတ်"],"Made for you":["为你定制","သင့်အတွက် ဖန်တီးထားသည်"],"Relaxing":["放松","အေးချမ်း"],"Your time":["你的时间","သင့်အချိန်"],
    "06 · Your Studio":["06 · 你的工作室","06 · သင့်စတူဒီယို"],"Keep Beauty Studio close to you.":["让 Beauty Studio 陪在你身边。","Beauty Studio ကို သင့်အနီးမှာ အမြဲထားပါ။"],
    "Add Beauty Studio to your device for quick access to your favorite styles, services and appointments. Works across phones, tablets and computers.":["将 Beauty Studio 添加到设备，快速访问喜欢的款式、服务和预约。手机、平板和电脑都支持。","အကြိုက်ဆုံးဒီဇိုင်း၊ ဝန်ဆောင်မှုနဲ့ ရက်ချိန်းတွေကို မြန်မြန်အသုံးပြုနိုင်ဖို့ Beauty Studio ကို သင့်စက်ထဲ ထည့်ပါ။ ဖုန်း၊ တက်ဘလက်နဲ့ ကွန်ပျူတာတွေမှာ အသုံးပြုနိုင်ပါတယ်။"],
    "Add to Home Screen":["添加到主屏幕","ပင်မစာမျက်နှာသို့ ထည့်ရန်"],"Available on phones, tablets & computers":["支持手机、平板和电脑","ဖုန်း၊ တက်ဘလက်နှင့် ကွန်ပျူတာများတွင် ရနိုင်သည်"],"YOUR DEVICE":["你的设备","သင့်စက်"],"Add Beauty Studio to your home screen.":["将 Beauty Studio 添加到主屏幕。","Beauty Studio ကို ပင်မစာမျက်နှာသို့ ထည့်ပါ။"],
    "Follow the steps for your device. Once Beauty Studio is added, this button will disappear.":["按照你的设备步骤操作。添加 Beauty Studio 后，这个按钮会消失。","သင့်စက်အတွက် အဆင့်များကို လိုက်နာပါ။ Beauty Studio ထည့်ပြီးရင် ဒီခလုတ်ပျောက်သွားပါမယ်။"],"Open the browser menu":["打开浏览器菜单","ဘရောက်ဇာမီနူးကို ဖွင့်ပါ"],"Open the sharing or browser menu on your device.":["打开设备上的分享或浏览器菜单。","သင့်စက်ပေါ်က မျှဝေမှု သို့မဟုတ် ဘရောက်ဇာမီနူးကို ဖွင့်ပါ။"],"Choose Add to Home Screen":["选择添加到主屏幕","ပင်မစာမျက်နှာသို့ ထည့်ရန် ရွေးပါ"],"Select the option to add Beauty Studio.":["选择添加 Beauty Studio 的选项。","Beauty Studio ထည့်ရန် ရွေးချယ်မှုကို ရွေးပါ။"],"You're ready":["准备好了","အသင့်ဖြစ်ပါပြီ"],"Beauty Studio will appear as an app on your device.":["Beauty Studio 会像应用一样出现在你的设备上。","Beauty Studio က သင့်စက်မှာ အက်ပ်တစ်ခုလို ပေါ်လာပါမယ်။"],"You can open Beauty Studio from your home screen anytime.":["以后随时都可以从主屏幕打开 Beauty Studio。","နောက်ပိုင်းမှာ ပင်မစာမျက်နှာကနေ Beauty Studio ကို အချိန်မရွေး ဖွင့်နိုင်ပါတယ်။"],"I've added it":["我已经添加","ထည့်ပြီးပါပြီ"],"Maybe later":["以后再说","နောက်မှ"],
    "04 · Appointments":["04 · 预约","04 · ရက်ချိန်းများ"],"Ready for your next set?":["准备好下一套了吗？","နောက်ဒီဇိုင်းအတွက် အသင့်ဖြစ်ပြီလား။"],"Choose your service, find a convenient time and let us take care of the details.":["选择服务、找到方便的时间，其余细节交给我们。","ဝန်ဆောင်မှုရွေး၊ အဆင်ပြေတဲ့အချိန်ရှာပြီး ကျန်အသေးစိတ်တွေကို ကျွန်ုပ်တို့ကို အပ်နှံပါ။"],"Personal care":["专属护理","ကိုယ်ပိုင်စောင့်ရှောက်မှု"],"Flexible time":["灵活时间","အဆင်ပြေတဲ့အချိန်"],"Easy booking":["轻松预约","လွယ်ကူတဲ့ ရက်ချိန်း"],
    "05 · Find Us":["05 · 找到我们","05 · ကျွန်ုပ်တို့ကို ရှာပါ"],"Come say hello.":["欢迎来见见我们。","လာပြီး နှုတ်ဆက်ပါ။"],"Questions, bookings, or simply a friendly hello — we’re always here for you.":["无论是问题、预约，还是简单打个招呼，我们都一直在这里。","မေးခွန်း၊ ရက်ချိန်း ဒါမှမဟုတ် နှုတ်ဆက်ရုံပဲဖြစ်ဖြစ် — ကျွန်ုပ်တို့ အမြဲရှိပါတယ်။"],"Location":["位置","တည်နေရာ"],"Studio address will appear here":["工作室地址将在这里显示","စတူဒီယိုလိပ်စာကို ဒီမှာ ပြပါမယ်"],"View on Maps →":["在地图上查看 →","မြေပုံတွင် ကြည့်ရန် →"],"Hours":["营业时间","ဖွင့်ချိန်"],"See availability →":["查看可预约时间 →","ရနိုင်တဲ့အချိန်ကြည့်ရန် →"],"Call studio →":["联系工作室 →","စတူဒီယိုကို ဖုန်းဆက်ရန် →"],"By appointment only":["仅限预约","ရက်ချိန်းဖြင့်သာ"],"Appointments are confirmed after your request is reviewed.":["预约请求审核后才会确认。","သင့်တောင်းဆိုမှုကို စစ်ဆေးပြီးမှ ရက်ချိန်းအတည်ပြုပါမယ်။"],
    "STAY CLOSE":["保持联系","ဆက်သွယ်နေပါ"],"Message the Studio":["联系工作室","စတူဒီယိုထံ စာပို့ရန်"],"Chat now →":["立即聊天 →","အခု စကားပြောရန် →"],"Join →":["加入 →","ဝင်ရန် →"],"STUDIO NOTE":["工作室寄语","စတူဒီယိုမှတ်ချက်"],"Good nails.":["好看的指甲。","လှပတဲ့ လက်သည်းများ。"],"Brighter days.":["更明亮的每一天。","ပိုတောက်ပတဲ့ နေ့ရက်များ။"],"Made for beautiful little moments.":["为每一个美好小瞬间而打造。","လှပတဲ့ အချိန်လေးတိုင်းအတွက် ဖန်တီးထားပါတယ်။"],
    "MOOD":["氛围","ခံစားချက်"],"Soft & polished":["柔和 · 精致","နူးညံ့ · သပ်ရပ်"],"RECOMMENDED":["推荐","အကြံပြု"],"Final price may vary with length, design detail and add-ons.":["最终价格可能因长度、设计细节和附加项目而有所变化。","နောက်ဆုံးစျေးနှုန်းက အရှည်၊ ဒီဇိုင်းအသေးစိတ်နဲ့ အပိုဝန်ဆောင်မှုအလိုက် ပြောင်းလဲနိုင်ပါတယ်။"],
    "PRIVATE APPOINTMENT":["私人预约","ကိုယ်ပိုင်ရက်ချိန်း"],"A little time, made entirely for you.":["留一点时间，只为你而准备。","သင့်အတွက်ပဲ သီးသန့်ထားတဲ့ အချိန်လေး။"],"BY APPOINTMENT":["预约制","ရက်ချိန်းဖြင့်"],"Select a service":["选择服务","ဝန်ဆောင်မှုရွေးပါ"],"Beauty Studio · 01 / 03":["Beauty Studio · 01 / 03","Beauty Studio · 01 / 03"],"Beauty Studio · 02 / 03":["Beauty Studio · 02 / 03","Beauty Studio · 02 / 03"],"Beauty Studio · 03 / 03":["Beauty Studio · 03 / 03","Beauty Studio · 03 / 03"],
    "Aftercare guidance":["护理指导","နောက်ဆက်တွဲဂရုစိုက်မှု လမ်းညွှန်"],"Natural beauty, lasting glow.":["自然之美，持久光彩。","သဘာဝအလှ၊ ကြာရှည်တောက်ပမှု။"],"Your mood, made into detail.":["把你的心情变成细节。","သင့်ခံစားချက်ကို အသေးစိတ်အဖြစ် ဖန်တီးပေးပါတယ်။"],"Long, refined and beautifully yours.":["修长、精致，真正属于你。","ရှည်လျား၊ သပ်ရပ်ပြီး သင့်အတွက်ပဲ ဖြစ်ပါတယ်။"]
  });

  Object.assign(I18N, {"Skip to content":["跳转到内容","အကြောင်းအရာသို့ သွားရန်"],"A little beauty, made for you":["为你而生的小小美好。","သင့်အတွက် ဖန်တီးထားတဲ့ အလှအပလေး။"],"Your nails. Your style.":["你的指尖，你的风格。","သင့်လက်သည်း၊ သင့်စတိုင်။"],"Featured Style":["精选款式","ရွေးချယ်ထားသော ဒီဇိုင်း"],"Soft Blush":["柔粉","နူးညံ့ပန်းရောင်"],"Clean · Elegant · Everyday":["干净 · 优雅 · 日常","သန့်ရှင်း · လှပ · နေ့စဉ်"],"Beauty · Care · Detail":["美丽 · 呵护 · 细节","အလှ · ဂရုစိုက်မှု · အသေးစိတ်"],"THE EVERYDAY EDIT":["日常精选","နေ့စဉ်ရွေးချယ်မှု"],"THE SIGNATURE EDIT":["特色精选","အထူးရွေးချယ်မှု"],"THE LENGTH EDIT":["延长精选","အရှည်ဒီဇိုင်းရွေးချယ်မှု"],"PRICING & TIMING ARE SHOWN BEFORE YOU BOOK":["预约前会显示价格与时长","ရက်ချိန်းမယူမီ စျေးနှုန်းနဲ့ ကြာချိန်ကို ပြသပေးပါမယ်"],"Not sure what to choose?":["不知道怎么选？","ဘာကိုရွေးရမလဲ မသေချာဘူးလား။"],"Start with the look you love. Your final service can be fine-tuned with the Studio before the appointment is confirmed.":["先从你喜欢的款式开始。预约确认前，我们可以和你一起微调最终服务。","သင်နှစ်သက်တဲ့ ဒီဇိုင်းကနေ စလိုက်ပါ။ ရက်ချိန်းအတည်ပြုမီ စတူဒီယိုနဲ့အတူ နောက်ဆုံးဝန်ဆောင်မှုကို ညှိပေးနိုင်ပါတယ်။"],"PERSONALIZED":["为你定制","သင့်အတွက် အထူးဖန်တီးထားသည်"],"Start booking":["开始预约","ရက်ချိန်းစတင်ရန်"],"STUDIO EDIT":["工作室精选","စတူဒီယိုရွေးချယ်မှု"],"Color · Detail · Mood":["颜色 · 细节 · 氛围","အရောင် · အသေးစိတ် · ခံစားချက်"],"Special for you":["为你特别准备","သင့်အတွက် အထူးပြင်ဆင်ထားသည်"],"New look.":["新的款式。","ဒီဇိုင်းအသစ်။"],"New mood.":["新的心情。","ခံစားချက်အသစ်။"],"Seasonal colors, little details and styles made for the moments you want to remember.":["为值得记住的时刻准备季节色彩、细节与款式。","မှတ်မိနေချင်တဲ့ အချိန်လေးတွေအတွက် ရာသီအလိုက်အရောင်၊ အသေးစိတ်နဲ့ ဒီဇိုင်းတွေကို ဖန်တီးပေးပါတယ်။"],"See promotions":["查看活动","ပရိုမိုးရှင်းများကြည့်ရန်"],"Real nails.\nReal happiness.":["真实的指尖。真实的快乐。","တကယ့်လက်သည်း။ တကယ့်ပျော်ရွှင်မှု။"],"Find your mood":["找到你的风格","သင့်စတိုင်ကို ရှာပါ"],"Save a look you love. Real studio photos can be added here anytime — and we can use your favorite look as inspiration when you book.":["收藏你喜欢的款式。之后这里可以随时加入真实作品照片，预约时也可以直接用喜欢的款式作为参考。","သင်နှစ်သက်တဲ့ ဒီဇိုင်းကို သိမ်းထားပါ။ နောက်ပိုင်းမှာ စတူဒီယိုရဲ့ တကယ့်လက်ရာပုံတွေကို ထည့်နိုင်ပြီး ရက်ချိန်းယူတဲ့အခါ သင်ကြိုက်တဲ့ဒီဇိုင်းကို ကိုးကားအဖြစ် အသုံးပြုနိုင်ပါတယ်။"],"All":["全部","အားလုံး"],"Simple":["简约","ရိုးရှင်း"],"Elegant":["优雅","လှပသပ်ရပ်"],"Trendy":["潮流","ခေတ်မီ"],"Cute":["可爱","ချစ်စရာ"],"Soft Pearl":["柔光珍珠","ပျော့ပျောင်း ပုလဲအလင်း"],"Milky Nude":["奶油裸色","နို့ရောင် Nude"],"Rose Chrome":["玫瑰镜面","Rose Chrome"],"Little Hearts":["小心心","နှလုံးသားလေးများ"],"Quiet Luxury":["静奢","အေးချမ်းခမ်းနားမှု"],"Elegant · Gel":["优雅 · 凝胶","လှပသပ်ရပ် · ဂျယ်လ်"],"Simple · Gel":["简约 · 凝胶","ရိုးရှင်း · ဂျယ်လ်"],"Trendy · Art":["潮流 · 艺术","ခေတ်မီ · ဒီဇိုင်း"],"Cute · Art":["可爱 · 艺术","ချစ်စရာ · ဒီဇိုင်း"],"Elegant · Extensions":["优雅 · 延长甲","လှပသပ်ရပ် · လက်သည်းတိုးချဲ့"],"View →":["查看 →","ကြည့်ရန် →"],"BS · 2026":["BS · 2026","BS · 2026"],"Beauty, in your own little way.":["用属于你的方式，美得刚刚好。","သင့်ကိုယ်ပိုင်ပုံစံလေးနဲ့ လှပလိုက်ပါ။"],"A quiet space for\nyourself.":["留一处只属于自己的安静空间。","သင့်အတွက်ပဲ သီးသန့်အေးချမ်းတဲ့ နေရာလေး။"],"Studio signature":["工作室特色","စတူဒီယိုရဲ့ ထူးခြားချက်"],"Studio philosophy":["工作室理念","စတူဒီယိုအယူအဆ"],"Quiet appointments, thoughtful details and nails that still feel like you.":["安静的预约体验、细致的服务，以及依然像你的指尖。","အေးချမ်းတဲ့ ရက်ချိန်းအတွေ့အကြုံ၊ ဂရုတစိုက်အသေးစိတ်နဲ့ သင့်လိုပဲ ခံစားရတဲ့ လက်သည်းဒီဇိုင်း။"],"Personal":["专属","ကိုယ်ပိုင်"],"Every set starts with your mood, your style and the little details you care about.":["每一套都从你的心情、风格和在意的小细节开始。","ဒီဇိုင်းတိုင်းက သင့်ခံစားချက်၊ သင့်စတိုင်နဲ့ သင်ဂရုစိုက်တဲ့ အသေးစိတ်လေးတွေကနေ စပါတယ်။"],"Thoughtful":["细致","ဂရုတစိုက်"],"A calm process, considered choices and a finish that feels polished without feeling overdone.":["从容的过程、经过考虑的选择，以及精致但不过度的完成效果。","အေးချမ်းတဲ့ လုပ်ငန်းစဉ်၊ သေချာရွေးချယ်မှုနဲ့ မလွန်ကဲဘဲ သပ်ရပ်လှပတဲ့ အပြီးသတ်။"],"Yours":["属于你","သင့်အတွက်"],"Save a look, bring an idea or simply choose a color. The final result should still feel like you.":["收藏一个款式、带来一个想法，或只是选一种颜色。最后的结果依然应该像你。","ဒီဇိုင်းတစ်ခုသိမ်းထားပါ၊ အကြံတစ်ခုယူလာပါ ဒါမှမဟုတ် အရောင်တစ်ရောင်ပဲ ရွေးပါ။ နောက်ဆုံးရလဒ်က သင့်လိုပဲ ဖြစ်နေသင့်ပါတယ်။"],"Professional":["专业","ကျွမ်းကျင်မှု"],"Carefully finished":["细致完成","ဂရုတစိုက် အပြီးသတ်"],"Made for you":["为你而做","သင့်အတွက် ဖန်တီးထားသည်"],"Relaxing":["放松","အေးချမ်းမှု"],"Your time":["属于你的时间","သင့်အချိန်"],"Keep Beauty Studio\nclose to you.":["让 Beauty Studio 陪在你身边。","Beauty Studio ကို သင့်အနီးမှာ အမြဲရှိနေစေပါ။"],"Available on phones, tablets & computers":["支持手机、平板和电脑","ဖုန်း၊ တက်ဘလက်နဲ့ ကွန်ပျူတာတွေမှာ အသုံးပြုနိုင်ပါတယ်"],"Phone / Tablet":["手机 / 平板","ဖုန်း / တက်ဘလက်"],"Device-aware install guide":["设备专属安装指南","သင့်စက်အတွက် ထည့်သွင်းလမ်းညွှန်"],"YOUR DEVICE":["你的设备","သင့်စက်"],"Maybe later":["以后再说","နောက်မှလုပ်မယ်"],"Add Beauty Studio to your home screen.":["将 Beauty Studio 添加到主屏幕。","Beauty Studio ကို ပင်မမျက်နှာပြင်သို့ ထည့်ပါ။"],"Follow the steps for your device. Once Beauty Studio is added, this button will disappear.":["按照你的设备步骤操作。添加 Beauty Studio 后，这个按钮会消失。","သင့်စက်အတွက် အဆင့်များကို လိုက်နာပါ။ Beauty Studio ထည့်ပြီးရင် ဒီခလုတ်ပျောက်သွားပါမယ်။"],"✦ You can open Beauty Studio from your home screen anytime.":["✦ 你可以随时从主屏幕打开 Beauty Studio。","✦ ပင်မမျက်နှာပြင်ကနေ Beauty Studio ကို အချိန်မရွေး ဖွင့်နိုင်ပါတယ်။"],"04 · Appointments":["04 · 预约","04 · ရက်ချိန်းများ"],"Ready for your\nnext set?":["准备好下一套了吗？","နောက်ဒီဇိုင်းအတွက် အသင့်ဖြစ်ပြီလား။"],"Personal care":["贴心护理","ကိုယ်ပိုင်ဂရုစိုက်မှု"],"Flexible time":["灵活时间","အဆင်ပြေတဲ့အချိန်"],"Easy booking":["轻松预约","လွယ်ကူတဲ့ ရက်ချိန်း"],"05 · Find Us":["05 · 找到我们","05 · ကျွန်ုပ်တို့ကို ရှာပါ"],"Location":["位置","တည်နေရာ"],"Studio address will appear here":["工作室地址将在这里显示","စတူဒီယိုလိပ်စာကို ဒီမှာ ပြသပေးပါမယ်"],"View on Maps →":["在地图中查看 →","မြေပုံမှာ ကြည့်ရန် →"],"Hours":["营业时间","ဖွင့်ချိန်"],"By appointment":["预约制","ရက်ချိန်းဖြင့်"],"See availability →":["查看可预约时间 →","ရနိုင်တဲ့အချိန်တွေ ကြည့်ရန် →"],"Contact":["联系我们","ဆက်သွယ်ရန်"],"+00 000 000 000":["+00 000 000 000","+00 000 000 000"],"Call studio →":["联系工作室 →","စတူဒီယိုကို ဖုန်းဆက်ရန် →"],"By appointment only":["仅限预约","ရက်ချိန်းဖြင့်သာ"],"Appointments are confirmed after your request is reviewed.":["预约请求审核后才会确认。","ရက်ချိန်းတောင်းဆိုမှုကို စစ်ဆေးပြီးမှ အတည်ပြုပေးပါမယ်။"],"STAY CLOSE":["保持联系","ဆက်သွယ်နေပါ"],"TikTok":["TikTok","TikTok"],"Follow →":["关注 →","Follow →"],"WhatsApp":["WhatsApp","WhatsApp"],"Telegram":["Telegram","Telegram"],"STUDIO NOTE":["工作室寄语","စတူဒီယိုမှတ်ချက်"],"Good nails.":["好看的指甲。","လှပတဲ့ လက်သည်းများ။"],"Brighter days.":["让每一天更明亮。","နေ့ရက်တိုင်း ပိုမိုတောက်ပပါစေ။"],"Made for beautiful little moments.":["为每一个美好瞬间而做。","လှပတဲ့အချိန်လေးတိုင်းအတွက် ဖန်တီးထားပါတယ်။"],"STYLE":["款式","ဒီဇိုင်း"],"MOOD":["氛围","ခံစားချက်"],"RECOMMENDED":["推荐","အကြံပြု"],"Love this look? Bring it as inspiration and the studio can fine-tune the details for you.":["喜欢这个款式？预约时可以把它作为参考，我们会为你微调细节。","ဒီဒီဇိုင်းကို ကြိုက်လား။ ရက်ချိန်းယူတဲ့အခါ ကိုးကားပုံအဖြစ် ယူလာနိုင်ပြီး အသေးစိတ်ကို သင့်အတွက် ညှိပေးနိုင်ပါတယ်။"],"Service ·":["服务 ·","ဝန်ဆောင်မှု ·"],"What's included":["包含内容","ပါဝင်သည့်အရာများ"],"Final price may vary with length, design detail and add-ons.":["最终价格可能因长度、设计细节和附加项目而有所变化。","နောက်ဆုံးစျေးနှုန်းက အရှည်၊ ဒီဇိုင်းအသေးစိတ်နဲ့ အပိုဝန်ဆောင်မှုများအလိုက် ပြောင်းလဲနိုင်ပါတယ်။"],"Appointments":["预约","ရက်ချိန်းများ"],"A little time, made entirely for you.":["留一点时间，只为你而准备。","သင့်အတွက်ပဲ သီးသန့်ထားတဲ့ အချိန်လေး။"],"01 — 03":["01 — 03","01 — 03"],"From 00 MMK · 60 min":["起价 00 MMK · 60 分钟","00 MMK မှ · 60 မိနစ်"],"From 00 MMK · 90 min":["起价 00 MMK · 90 分钟","00 MMK မှ · 90 မိနစ်"],"From 00 MMK · 120 min":["起价 00 MMK · 120 分钟","00 MMK မှ · 120 မိနစ်"],"The final price can vary with length, design detail and any add-ons.":["最终价格可能因长度、设计细节和附加项目而变化。","နောက်ဆုံးစျေးနှုန်းက အရှည်၊ ဒီဇိုင်းအသေးစိတ်နဲ့ အပိုဝန်ဆောင်မှုတွေအလိုက် ပြောင်းလဲနိုင်ပါတယ်။"],"Choose a service":["选择服务","ဝန်ဆောင်မှုရွေးပါ"],"You can change this later.":["之后可以修改。","နောက်မှ ပြောင်းလဲနိုင်ပါတယ်။"],"Choose a time":["选择时间","အချိန်ရွေးပါ"],"Pick a day first, then a time.":["先选择日期，再选择时间。","အရင်ဆုံး ရက်ရွေးပြီးနောက် အချိန်ရွေးပါ။"],"Today":["今天","ယနေ့"],"Tomorrow":["明天","မနက်ဖြန်"],"Choose date":["选择日期","ရက်စွဲရွေးပါ"],"Pick a date":["选择一个日期","ရက်စွဲတစ်ခုရွေးပါ"],"Available times":["可预约时间","ရနိုင်သောအချိန်များ"],"Live availability · based on studio rules":["实时可预约时间 · 根据工作室规则","လက်ရှိရနိုင်သောအချိန် · စတူဒီယိုစည်းမျဉ်းများအပေါ် မူတည်သည်"],"Inspiration":["灵感 / 参考","စိတ်ကူး / ကိုးကား"],"Service":["服务","ဝန်ဆောင်မှု"],"Price":["价格","စျေးနှုန်း"],"Booking details update as you choose.":["预约详情会随着你的选择更新。","သင်ရွေးချယ်သလို ရက်ချိန်းအသေးစိတ်တွေ ပြောင်းလဲပေးပါမယ်။"],"Choose your service, date and time to continue.":["选择服务、日期和时间后继续。","ဆက်လုပ်ရန် ဝန်ဆောင်မှု၊ ရက်စွဲနဲ့ အချိန်ကို ရွေးပါ။"],"We’ll use these details to confirm your appointment.":["我们会使用这些信息确认你的预约。","ဒီအချက်အလက်တွေကို အသုံးပြုပြီး သင့်ရက်ချိန်းကို အတည်ပြုပေးပါမယ်။"],"Thoughtful from start to finish.":["从开始到结束，都用心对待。","အစကနေ အဆုံးထိ ဂရုတစိုက် ဆောင်ရွက်ပေးပါတယ်။"],"Your request is reviewed by the Studio before the appointment is confirmed.":["预约请求会由工作室审核后确认。","ရက်ချိန်းတောင်းဆိုမှုကို စတူဒီယိုက စစ်ဆေးပြီးမှ အတည်ပြုပေးပါမယ်။"],"Your request is sent securely to the Studio for review. You’ll receive confirmation after it is reviewed.":["你的请求会安全发送给工作室审核，审核后你会收到确认。","သင့်တောင်းဆိုမှုကို လုံခြုံစွာ စတူဒီယိုထံ ပို့ပေးပြီး စစ်ဆေးပြီးနောက် အတည်ပြုချက်ရရှိပါမယ်။"],"Appointment request":["预约请求","ရက်ချိန်းတောင်းဆိုမှု"],"PREVIEW":["预览","ကြိုတင်ကြည့်ရှုရန်"],"Request received.":["已收到请求。","တောင်းဆိုမှုကို လက်ခံရရှိပါပြီ။"],"Your appointment request is ready. The Studio will confirm the final time with you.":["你的预约请求已准备好，工作室会与你确认最终时间。","သင့်ရက်ချိန်းတောင်းဆိုမှု အဆင်သင့်ဖြစ်ပါပြီ။ နောက်ဆုံးအချိန်ကို စတူဒီယိုက သင့်နဲ့ အတည်ပြုပေးပါမယ်။"],"Done":["完成","ပြီးပါပြီ"],"Customer notifications":["客户通知","ဖောက်သည် အသိပေးချက်များ"],"Updates":["更新","အပ်ဒိတ်များ"],"No new updates yet.":["暂时没有新通知。","အသိပေးချက်အသစ် မရှိသေးပါ။"],"Customer support chat":["客户支持聊天","ဖောက်သည်အကူအညီ စကားပြောခန်း"],"Need help?":["需要帮助吗？","အကူအညီလိုပါသလား။"],"Beauty Studio · Support":["Beauty Studio · 客服","Beauty Studio · အကူအညီ"],"How can we help?":["有什么可以帮助你？","ဘယ်လိုကူညီပေးရမလဲ။"],"Customer —":["客户 —","ဖောက်သည် —"],"We usually reply as soon as we can.":["我们会尽快回复你。","တတ်နိုင်သမျှ အမြန်ဆုံး ပြန်ကြားပေးပါမယ်။"],"Ask us anything about services, designs or your appointment.":["关于服务、款式或预约，都可以问我们。","ဝန်ဆောင်မှု၊ ဒီဇိုင်း ဒါမှမဟုတ် ရက်ချိန်းအကြောင်း ဘာမဆို မေးနိုင်ပါတယ်။"],"Send":["发送","ပို့ရန်"],"Your conversation stays with your Customer ID after refresh.":["刷新后，你的对话仍会保留在客户编号下。","Refresh လုပ်ပြီးနောက်လည်း သင့်စကားပြောမှတ်တမ်းက Customer ID နဲ့အတူ ရှိနေပါမယ်။"],"Home":["首页","ပင်မစာမျက်နှာ"],"Install":["安装","ထည့်သွင်းရန်"],"Gallery":["作品集","လက်ရာများ"],"Add a short description.":["添加简短描述。","အတိုချုံးဖော်ပြချက် ထည့်ပါ။"],"Made with care.":["用心打造。","ဂရုတစိုက် ဖန်တီးထားသည်။"],"Personalized care":["专属护理","ကိုယ်ပိုင်ဂရုစိုက်မှု"],"Everyday wear":["适合日常","နေ့စဉ်ဝတ်ဆင်ရန် သင့်တော်သည်"],"Service detail":["服务细节","ဝန်ဆောင်မှုအသေးစိတ်"],"Tailored studio service":["为你定制的工作室服务","သင့်အတွက် စိတ်ကြိုက် စတူဒီယိုဝန်ဆောင်မှု"],"Estimated appointment time":["预计预约时长","ခန့်မှန်း ရက်ချိန်းကြာချိန်"],"Personalized finish":["专属收尾","ကိုယ်ပိုင်အပြီးသတ်"],"Beauty Service":["美容服务","အလှအပဝန်ဆောင်မှု"],"New Service":["新服务","ဝန်ဆောင်မှုအသစ်"],"New Look":["新作品","လက်ရာအသစ်"],"Beauty Style":["美甲款式","အလှဒီဇိုင်း"],"Close":["关闭","ပိတ်ရန်"],"I've added it":["我已经添加了","ထည့်ပြီးပါပြီ"],"Install Beauty Studio":["安装 Beauty Studio","Beauty Studio ကို ထည့်သွင်းရန်"],"Ready to install on this device":["此设备可以安装","ဒီစက်မှာ ထည့်သွင်းနိုင်ပါပြီ"],"Beauty Studio has been added":["Beauty Studio 已添加","Beauty Studio ထည့်သွင်းပြီးပါပြီ"],"Beauty Studio will be available from your Start menu and installed apps.":["Beauty Studio 会出现在开始菜单和已安装应用中。","Beauty Studio ကို Start menu နဲ့ ထည့်သွင်းထားတဲ့ app တွေထဲကနေ ဖွင့်နိုင်ပါမယ်။"],"You're ready":["准备好了","အဆင်သင့်ဖြစ်ပါပြီ"],"Open Beauty Studio":["打开 Beauty Studio","Beauty Studio ကို ဖွင့်ရန်"],"Confirm Install":["确认安装","ထည့်သွင်းမှု အတည်ပြုရန်"],"Choose Install":["选择安装","ထည့်သွင်းရန် ရွေးပါ"],"Open the install option":["打开安装选项","ထည့်သွင်းရန် ရွေးချယ်မှုကို ဖွင့်ပါ"],"Confirm the install":["确认安装","ထည့်သွင်းမှုကို အတည်ပြုပါ"],"Open Beauty Studio from your Dock, Applications, or installed apps.":["从 Dock、应用程序或已安装应用中打开 Beauty Studio。","Dock၊ Applications ဒါမှမဟုတ် ထည့်သွင်းထားတဲ့ app တွေကနေ Beauty Studio ကို ဖွင့်ပါ။"],"In Safari, tap the Share button. On iPad, it is in the browser toolbar.":["在 Safari 中点击分享按钮。iPad 上可在浏览器工具栏找到。","Safari မှာ Share ခလုတ်ကို နှိပ်ပါ။ iPad မှာ browser toolbar ထဲမှာ ရှိပါတယ်။"],"Scroll through the Share sheet and select “Add to Home Screen”.":["在分享菜单中找到“添加到主屏幕”。","Share menu ထဲက “Add to Home Screen” ကို ရွေးပါ။"],"Confirm the name and tap “Add”. Beauty Studio will appear on your Home Screen.":["确认名称并点击“添加”，Beauty Studio 就会出现在主屏幕。","အမည်ကို အတည်ပြုပြီး “Add” ကို နှိပ်ပါ။ Beauty Studio က ပင်မမျက်နှာပြင်မှာ ပေါ်လာပါမယ်။"],"Tip · If the option is missing, open this page in Safari and try again.":["提示 · 如果找不到该选项，请用 Safari 打开此页面再试一次。","အကြံပြုချက် · ရွေးချယ်စရာမတွေ့ရင် ဒီစာမျက်နှာကို Safari နဲ့ဖွင့်ပြီး ထပ်စမ်းပါ။"],"Android phones and tablets can use the browser's install option when PWA installation is supported.":["Android 手机和平板在浏览器支持 PWA 安装时，可以使用安装选项。","PWA ထည့်သွင်းမှုကို browser က ထောက်ပံ့ပါက Android ဖုန်းနဲ့ တက်ဘလက်တွေမှာ install option ကို အသုံးပြုနိုင်ပါတယ်။"],"Open the browser menu":["打开浏览器菜单","Browser menu ကို ဖွင့်ပါ"],"In Chrome or another supported browser, tap ⋮ or the browser menu.":["在 Chrome 或其他支持的浏览器中点击 ⋮ 或浏览器菜单。","Chrome ဒါမှမဟုတ် ထောက်ပံ့တဲ့ browser တစ်ခုမှာ ⋮ ဒါမှမဟုတ် browser menu ကို နှိပ်ပါ။"],"Tap “Install app”, “Add to Home screen”, or the install icon if your browser shows one.":["点击“安装应用”“添加到主屏幕”或浏览器显示的安装图标。","“Install app”၊ “Add to Home screen” ဒါမှမဟုတ် browser မှာ ပေါ်တဲ့ install icon ကို နှိပ်ပါ။"],"Confirm the prompt. Beauty Studio will be added to your Home Screen or app list.":["确认提示，Beauty Studio 会添加到主屏幕或应用列表。","ပေါ်လာတဲ့ အတည်ပြုချက်ကို လက်ခံပါ။ Beauty Studio ကို ပင်မမျက်နှာပြင် ဒါမှမဟုတ် app list ထဲ ထည့်ပေးပါမယ်။"],"On Mac, install the website as an app when your browser supports PWA installation.":["在 Mac 上，如果浏览器支持 PWA，可以将网站安装为应用。","Mac မှာ browser က PWA ကို ထောက်ပံ့ရင် ဝဘ်ဆိုဒ်ကို app အဖြစ် ထည့်သွင်းနိုင်ပါတယ်။"],"Safari: use File → Add to Dock. Chrome: use the install icon in the address bar or ⋮ menu.":["Safari：使用 文件 → 添加到 Dock。Chrome：使用地址栏安装图标或 ⋮ 菜单。","Safari: File → Add to Dock ကို သုံးပါ။ Chrome: address bar ထဲက install icon ဒါမှမဟုတ် ⋮ menu ကို သုံးပါ။"],"Launch it from your Dock, Applications, or installed apps.":["从 Dock、应用程序或已安装应用中打开。","Dock၊ Applications ဒါမှမဟုတ် ထည့်သွင်းထားတဲ့ app တွေကနေ ဖွင့်ပါ။"],"Chrome and Edge can install Beauty Studio as an app when PWA installation is supported.":["Chrome 和 Edge 在支持 PWA 时可以将 Beauty Studio 安装为应用。","PWA ကို ထောက်ပံ့ရင် Chrome နဲ့ Edge မှာ Beauty Studio ကို app အဖြစ် ထည့်သွင်းနိုင်ပါတယ်။"],"Chrome: click the install icon or ⋮. Edge: use Apps → Install this site as an app.":["Chrome：点击安装图标或 ⋮。Edge：使用 应用 → 将此网站安装为应用。","Chrome: install icon ဒါမှမဟုတ် ⋮ ကို နှိပ်ပါ။ Edge: Apps → Install this site as an app ကို သုံးပါ။"],"We couldn't identify a specific device. Use your browser's Install, Add to Home Screen, Add to Dock, or shortcut option.":["无法识别具体设备。请使用浏览器的安装、添加到主屏幕、添加到 Dock 或创建快捷方式选项。","သင့်စက်ကို သီးခြားမသိနိုင်ပါ။ Browser ရဲ့ Install၊ Add to Home Screen၊ Add to Dock ဒါမှမဟုတ် shortcut option ကို သုံးပါ။"],"Look for Install, Add to Home Screen, Add to Dock, Create shortcut, or Add to desktop.":["查找安装、添加到主屏幕、添加到 Dock、创建快捷方式或添加到桌面的选项。","Install၊ Add to Home Screen၊ Add to Dock၊ Create shortcut ဒါမှမဟုတ် Add to desktop ကို ရှာပါ။"],"Tip · Installation wording differs by browser. The site remains fully usable even when PWA installation is unavailable.":["提示 · 不同浏览器的安装名称可能不同。即使无法安装 PWA，网站仍可正常使用。","အကြံပြုချက် · Browser အလိုက် install အမည်ကွာနိုင်ပါတယ်။ PWA မရရင်တောင် ဝဘ်ဆိုဒ်ကို ပုံမှန်အသုံးပြုနိုင်ပါတယ်။"]});

  const LANG_KEY = 'beauty_studio_language';
  let currentLang = localStorage.getItem(LANG_KEY) || 'en';
  if(!['en','zh','my'].includes(currentLang)) currentLang='en';
  const original = new WeakMap();
  function translateText(text){ const key=text.trim(); const pair=I18N[key]; if(!pair)return null; return currentLang==='en' ? key : pair[currentLang==='my'?1:0]; }
  window.__beautyStudioGetLanguage=()=>currentLang;
  window.__beautyStudioTranslateText=(text)=>translateText(String(text??''));
  function walk(root){ const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); const nodes=[]; let n; while(n=walker.nextNode())nodes.push(n); nodes.forEach(node=>{ if(!node.nodeValue.trim())return; const parent=node.parentElement; if(!parent||['SCRIPT','STYLE','NOSCRIPT'].includes(parent.tagName))return; let base=original.get(node); if(base===undefined){base=node.nodeValue;original.set(node,base)} const t=translateText(base); if(t){const lead=base.match(/^\s*/)?.[0]||'';const trail=base.match(/\s*$/)?.[0]||'';node.nodeValue=lead+t+trail;} }); }
  function apply(){
    document.documentElement.lang=currentLang==='my'?'my':(currentLang==='zh'?'zh-CN':'en');
    walk(document.body);
    document.querySelectorAll('[placeholder]').forEach(el=>{const b=el.dataset.i18nPlaceholder||el.getAttribute('placeholder');if(!el.dataset.i18nPlaceholder)el.dataset.i18nPlaceholder=b;const t=translateText(b);if(t)el.setAttribute('placeholder',t)});
    document.querySelectorAll('[aria-label]').forEach(el=>{const b=el.dataset.i18nAria||el.getAttribute('aria-label');if(!el.dataset.i18nAria)el.dataset.i18nAria=b;const t=translateText(b);if(t)el.setAttribute('aria-label',t)});
    const b=document.getElementById('beautyLangToggle');
    if(b){
      const label=currentLang==='en'?'English':(currentLang==='zh'?'中文':'မြန်မာ');
      b.querySelector('.beauty-lang-current')?.replaceChildren(document.createTextNode(label));
      b.setAttribute('aria-expanded',b.classList.contains('open')?'true':'false');
      b.setAttribute('aria-label','Language / 语言 / ဘာသာစကား');
      b.querySelectorAll('[data-lang-choice]').forEach(item=>item.classList.toggle('active',item.dataset.langChoice===currentLang));
    }
    document.documentElement.classList.toggle('lang-my',currentLang==='my');
    window.dispatchEvent(new CustomEvent('beautyStudioLanguageChanged',{detail:{lang:currentLang}}));
  }
  function setLanguage(next){
    if(!['en','zh','my'].includes(next))return;
    currentLang=next;
    localStorage.setItem(LANG_KEY,currentLang);
    const menu=document.querySelector('.beauty-lang-menu');
    menu?.classList.remove('open');
    document.getElementById('beautyLangToggle')?.classList.remove('open');
    apply();
  }
  function addToggle(){
    if(document.getElementById('beautyLangToggle'))return;
    const wrap=document.createElement('div');
    wrap.className='beauty-lang-wrap';
    wrap.innerHTML=`
      <button id="beautyLangToggle" type="button" class="beauty-lang-toggle" aria-expanded="false" aria-label="Language / 语言 / ဘာသာစကား">
        <span class="beauty-lang-globe" aria-hidden="true">◎</span>
        <span class="beauty-lang-current">English</span>
        <span class="beauty-lang-chevron" aria-hidden="true">⌄</span>
      </button>
      <div class="beauty-lang-menu" role="menu" aria-label="Language selector">
        <button type="button" data-lang-choice="en" role="menuitem"><span>English</span><small>EN</small></button>
        <button type="button" data-lang-choice="zh" role="menuitem"><span>中文</span><small>中文</small></button>
        <button type="button" data-lang-choice="my" role="menuitem"><span>မြန်မာ</span><small>MY</small></button>
      </div>`;
    document.body.appendChild(wrap);
    const b=wrap.querySelector('#beautyLangToggle');
    const menu=wrap.querySelector('.beauty-lang-menu');
    b.addEventListener('click',()=>{
      const open=!menu.classList.contains('open');
      menu.classList.toggle('open',open); b.classList.toggle('open',open); b.setAttribute('aria-expanded',String(open));
    });
    wrap.querySelectorAll('[data-lang-choice]').forEach(item=>item.addEventListener('click',()=>setLanguage(item.dataset.langChoice)));
    document.addEventListener('click',e=>{if(!wrap.contains(e.target)){menu.classList.remove('open');b.classList.remove('open');b.setAttribute('aria-expanded','false')}});
  }
  // Do not observe the entire document. Dynamic D1 rendering can otherwise trigger a translation loop.
  function start(){
    addToggle();
    apply();
    [250,800,1800,3500,6000].forEach(ms=>setTimeout(apply,ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* V77 bilingual UI — extended copy */

/* V85 — localized D1 content, including future Admin-created services & gallery items. */
(function(){
  const lang=()=>window.__beautyStudioGetLanguage?.()||'en';
  const tr=v=>window.__beautyStudioTranslateText?.(String(v??''))||null;
  const pick=(o,b,f='')=>{if(!o)return f;const l=lang();const ks=l==='zh'?[b+'Zh',b+'_zh',b+'CN',b+'_cn']:l==='my'?[b+'My',b+'_my',b+'Mm',b+'_mm']:[b];for(const k of ks)if(o[k]!=null&&String(o[k]).trim())return String(o[k]);const raw=o[b]??f;return l==='en'?raw:(tr(raw)||raw||f)};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const services=()=>window.BEAUTY_STUDIO_CONTENT?.services||{};
  const gallery=()=>Array.isArray(window.BEAUTY_STUDIO_CONTENT?.gallery)?window.BEAUTY_STUDIO_CONTENT.gallery:[];
  function renderServices(){Object.entries(services()).forEach(([k,s])=>{document.querySelectorAll(`.service-card[data-service="${CSS.escape(k)}"]`).forEach(c=>{const q=c.querySelector.bind(c),kicker=q('.service-kicker span:first-child'),title=q('h3'),desc=q('.service-info > p'),tags=q('.service-bottom > span'),meta=q('.service-meta span');if(kicker)kicker.textContent=pick(s,'kicker','Service');if(title)title.textContent=pick(s,'title',pick(s,'name','Beauty Service'));if(desc)desc.textContent=pick(s,'description','');if(tags)tags.textContent=pick(s,'tags','');if(meta)meta.textContent=s.price||'';if(meta?.nextElementSibling)meta.nextElementSibling.textContent=s.duration||''});document.querySelectorAll(`[data-service-choice][data-service-key="${CSS.escape(k)}"]`).forEach(b=>{const display=pick(s,'title',pick(s,'name','Beauty Service'));b.dataset.serviceDisplay=display;b.dataset.servicePrice=s.price||'';b.dataset.serviceDuration=s.duration||'';const sp=b.querySelector('span'),sm=b.querySelector('small');if(sp)sp.textContent=display;if(sm)sm.textContent=`${s.price||''} · ${s.duration||''}`})})}
  function renderGallery(){const items=gallery(),grid=document.getElementById('work-grid');if(!grid)return;const cards=[...grid.querySelectorAll('.work-item')];items.forEach((it,i)=>{const c=cards[i];if(!c)return;const title=pick(it,'title',it.title||'Beauty Style'),style=pick(it,'style',it.style||''),desc=pick(it,'description',it.description||'');c.dataset.title=title;c.dataset.style=style;c.dataset.description=desc;c.dataset.styleName=pick(it,'styleName',title);const info=c.querySelector('div:last-child');if(info?.querySelector('strong'))info.querySelector('strong').textContent=title;if(info?.querySelector('span'))info.querySelector('span').textContent=style});const count=document.getElementById('galleryCount');if(count){const f=document.querySelector('.filters button.active')?.dataset.filter||'all';const n=items.filter(x=>f==='all'||String(x.category||'simple').toLowerCase()===f).length;count.textContent=`${n} ${lang()==='zh'?'款式':lang()==='my'?'ဒီဇိုင်း':n===1?'style':'styles'}`}}
  function renderModal(){const choose=document.getElementById('chooseServiceButton'),key=choose?.dataset.bookService,s=key?services()[key]:null;if(!s)return;const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('serviceModalTitle',pick(s,'title',pick(s,'name','Beauty Service')));set('serviceModalDescription',pick(s,'description',''));set('serviceModalKicker',pick(s,'kicker','Service'));set('serviceModalCaption',pick(s,'caption','Made with care.'));set('serviceIdealFor',pick(s,'idealFor','Everyday wear'));const pts=lang()==='zh'&&Array.isArray(s.pointsZh)?s.pointsZh:lang()==='my'&&Array.isArray(s.pointsMy)?s.pointsMy:(s.points||[]);const ul=document.getElementById('servicePoints');if(ul)ul.innerHTML=pts.map(x=>`<li>${esc(tr(x)||x)}</li>`).join('');const hi=document.getElementById('serviceHighlights');if(hi&&Array.isArray(s.highlights))hi.innerHTML=s.highlights.map(row=>`<div><span>✦</span><strong>${esc(tr(row?.[0])||row?.[0]||'')}</strong><small>${esc(tr(row?.[1])||row?.[1]||'')}</small></div>`).join('')}
  function renderGalleryModal(){const grid=document.getElementById('work-grid');const modal=document.getElementById('detailModal');if(!grid||!modal)return;const open=modal.classList.contains('open');if(!open)return;const title=document.getElementById('workDetailTitle'),style=document.getElementById('workDetailStyle'),desc=document.getElementById('workDetailDescription');const current=grid.querySelector('.work-item.is-active-work')||grid.querySelector('.work-item');if(current){const data=gallery()[[...grid.querySelectorAll('.work-item')].indexOf(current)];if(data){if(title)title.textContent=pick(data,'title',data.title||'Beauty Style');if(style)style.textContent=pick(data,'style',data.style||'');if(desc)desc.textContent=pick(data,'description',data.description||'')}}}
  function bindOpenRefresh(){document.querySelectorAll('.service-card[data-service]').forEach(card=>{if(card.dataset.v85LangBound==='1')return;card.dataset.v85LangBound='1';card.addEventListener('click',()=>setTimeout(renderModal,0))});document.getElementById('work-grid')?.addEventListener('click',event=>{const card=event.target.closest('.work-item');if(card){card.classList.add('is-active-work');setTimeout(renderGalleryModal,0)}})}
  function apply(){renderServices();renderGallery();renderModal();bindOpenRefresh();renderGalleryModal()}
  window.__beautyStudioLocalizedDynamic=apply;window.addEventListener('beautyStudioLanguageChanged',apply);window.addEventListener('beautyStudioD1ContentReady',apply);[500,1200,2500,5000].forEach(t=>setTimeout(apply,t));
})();

/* V86 — complete trilingual rendering for static + D1-created content */
(function(){
  const getLang=()=>window.__beautyStudioGetLanguage?.()||'en';
  const tr=v=>window.__beautyStudioTranslateText?.(String(v??''))||null;
  const clean=v=>String(v??'').trim();
  const pick=(o,base,fallback='')=>{
    if(!o) return fallback;
    const l=getLang();
    if(l==='en') return clean(o[base] ?? fallback);
    const suffixes=l==='zh'?['Zh','_zh','CN','_cn']:['My','_my','Mm','_mm'];
    for(const suffix of suffixes){
      const key=`${base}${suffix}`;
      if(o[key]!=null && clean(o[key])) return clean(o[key]);
    }
    const raw=clean(o[base] ?? fallback);
    return tr(raw)||raw||fallback;
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const services=()=>window.BEAUTY_STUDIO_CONTENT?.services||{};
  const gallery=()=>Array.isArray(window.BEAUTY_STUDIO_CONTENT?.gallery)?window.BEAUTY_STUDIO_CONTENT.gallery:[];

  function localizeValue(v){return tr(v)||v||'';}
  function localizeArray(o,base){
    const l=getLang();
    if(l==='zh' && Array.isArray(o?.[base+'Zh'])) return o[base+'Zh'];
    if(l==='my' && Array.isArray(o?.[base+'My'])) return o[base+'My'];
    return Array.isArray(o?.[base]) ? o[base].map(localizeValue) : [];
  }

  function refreshServices(){
    const list=services();
    document.querySelectorAll('.service-card[data-service]').forEach(card=>{
      const s=list[card.dataset.service]; if(!s) return;
      const title=pick(s,'title',pick(s,'name','Beauty Service'));
      const description=pick(s,'description','');
      const kicker=pick(s,'kicker','Service');
      const tags=pick(s,'tags','');
      const photoLabel=tr(s.kicker ? `THE ${String(s.kicker).toUpperCase()} EDIT` : '') || (getLang()==='zh'?'服务精选':getLang()==='my'?'ဝန်ဆောင်မှုရွေးချယ်မှု':'BEAUTY EDIT');
      const q=sel=>card.querySelector(sel);
      if(q('.service-kicker span:first-child')) q('.service-kicker span:first-child').textContent=kicker;
      if(q('h3')) q('h3').textContent=title;
      if(q('.service-info > p')) q('.service-info > p').textContent=description;
      if(q('.service-bottom > span')) q('.service-bottom > span').textContent=tags ? localizeValue(tags) : '';
      if(q('.service-photo-label')) q('.service-photo-label').textContent=photoLabel;
      const meta=card.querySelectorAll('.service-meta span');
      if(meta[0]) meta[0].textContent=s.price||'';
      if(meta[1]) meta[1].textContent=s.duration ? `${s.duration} min` : '';
      if(q('.service-photo small')) q('.service-photo small').textContent=s.durationShort|| (s.duration?`${s.duration} MIN`:'');
      const choices=document.querySelectorAll(`[data-service-choice][data-service-key="${CSS.escape(card.dataset.service)}"]`);
      choices.forEach(btn=>{
        btn.dataset.serviceChoice=title;
        btn.dataset.serviceDisplay=title;
        btn.dataset.servicePrice=s.price||'';
        btn.dataset.serviceDuration=s.duration||'';
        const sp=btn.querySelector('span'), sm=btn.querySelector('small');
        if(sp) sp.textContent=title;
        if(sm) sm.textContent=`${s.price||''} · ${s.duration||''} min`;
      });
    });

    // The booking step may contain buttons created before D1 finishes loading.
    document.querySelectorAll('[data-service-choice][data-service-key]').forEach(btn=>{
      const s=list[btn.dataset.serviceKey]; if(!s) return;
      const title=pick(s,'title',pick(s,'name','Beauty Service'));
      btn.dataset.serviceChoice=title;
      const sp=btn.querySelector('span'), sm=btn.querySelector('small');
      if(sp) sp.textContent=title;
      if(sm) sm.textContent=`${s.price||''} · ${s.duration||''} min`;
    });
  }

  function refreshGallery(){
    const items=gallery();
    const grid=document.getElementById('work-grid');
    if(!grid) return;
    [...grid.querySelectorAll('.work-item')].forEach((card,index)=>{
      const item=items[index]; if(!item) return;
      const title=pick(item,'title','Beauty Style');
      const style=pick(item,'style',pick(item,'category',''));
      const desc=pick(item,'description','');
      const category=pick(item,'category','Simple').toLowerCase();
      card.dataset.title=title;
      card.dataset.style=style;
      card.dataset.description=desc;
      card.dataset.styleName=pick(item,'styleName',title);
      const info=card.querySelector('div:last-child');
      if(info?.querySelector('strong')) info.querySelector('strong').textContent=title;
      if(info?.querySelector('span')) info.querySelector('span').textContent=style;
      const img=card.querySelector('.gallery-photo');
      if(img) img.alt=pick(item,'alt',title||'Beauty Studio nail design');
      card.dataset.category=category;
    });
    const count=document.getElementById('galleryCount');
    if(count){
      const n=items.length;
      const word=getLang()==='zh'?'款式':getLang()==='my'?'ဒီဇိုင်း':(n===1?'style':'styles');
      count.textContent=`${n} ${word}`;
    }
  }

  function refreshServiceModal(){
    const key=document.getElementById('chooseServiceButton')?.dataset.bookService;
    const s=key?services()[key]:null;
    if(!s) return;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??''};
    const tags=pick(s,'tags','').split(',').map(x=>x.trim()).filter(Boolean);
    set('serviceModalNumber',s.number||'');
    set('serviceModalDuration',s.duration?`${s.duration} MIN`:'');
    set('serviceModalTitle',pick(s,'title',pick(s,'name','Beauty Service')));
    set('serviceModalPrice',s.price|| (getLang()==='zh'?'价格待定':getLang()==='my'?'စျေးနှုန်းမသတ်မှတ်ရသေး':'Price on request'));
    set('serviceModalDurationText',s.duration?`${s.duration} min`:'');
    set('serviceModalDescription',pick(s,'description','A personalized service prepared around your preferred look.'));
    set('serviceModalKicker',pick(s,'kicker','Personalized'));
    set('serviceModalCaption',pick(s,'caption','Made with care.'));
    set('serviceIdealFor',pick(s,'idealFor',tags[0]||'Personalized care'));
    const rawHighlights=Array.isArray(s.highlights)?s.highlights:[];
    const rows=rawHighlights.length?rawHighlights:[
      [tags[0]||'Service','Tailored studio service'],
      [s.duration?`${s.duration} min`:'Flexible','Estimated appointment time'],
      [tags[1]||'Detail','Personalized finish']
    ];
    const hi=document.getElementById('serviceHighlights');
    if(hi){
      hi.hidden=false;
      hi.innerHTML=rows.slice(0,3).map(row=>{
        const pair=Array.isArray(row)?row:[row,'Studio detail'];
        return `<div><span>✦</span><strong>${esc(localizeValue(pair[0]))}</strong><small>${esc(localizeValue(pair[1]))}</small></div>`;
      }).join('');
    }
    const points=localizeArray(s,'points');
    const ul=document.getElementById('servicePoints');
    if(ul && points.length) ul.innerHTML=points.map(x=>`<li>${esc(x)}</li>`).join('');
  }

  function refreshGalleryModal(){
    const modal=document.getElementById('detailModal');
    const grid=document.getElementById('work-grid');
    if(!modal||!grid||!modal.classList.contains('open')) return;
    const cards=[...grid.querySelectorAll('.work-item')];
    const active=cards.find(c=>c.classList.contains('is-active-work'))||cards[0];
    if(!active) return;
    const index=cards.indexOf(active), item=gallery()[index];
    if(!item) return;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??''};
    set('modalTitle',pick(item,'title','Beauty Style'));
    set('modalStyle',pick(item,'style',pick(item,'category','')));
    set('modalDescription',pick(item,'description',''));
    const cat=String(item.category||'simple').toLowerCase();
    const moods={
      simple:['Clean & effortless','干净 · 轻松','သန့်ရှင်း · လွယ်ကူ'],
      elegant:['Soft & polished','柔和 · 精致','နူးညံ့ · သပ်ရပ်'],
      trendy:['Modern & expressive','现代 · 有表现力','ခေတ်မီ · ထင်ရှား'],
      cute:['Sweet & playful','甜美 · 活泼','ချစ်စရာ · ပျော်ရွှင်']
    };
    const mood=moods[cat]||moods.simple;
    set('modalMood',getLang()==='zh'?mood[1]:getLang()==='my'?mood[2]:mood[0]);
    const reco=item.recommendedService?services()[item.recommendedService]:null;
    set('modalRecommended',reco?pick(reco,'title',pick(reco,'name','Custom Nail Art')):tr('Custom Nail Art')||'Custom Nail Art');
  }

  function refreshInstallModal(){
    const modal=document.getElementById('installModal');
    if(!modal) return;
    const translateNode=(node)=>{
      if(node.nodeType!==Node.TEXT_NODE || !node.nodeValue.trim()) return;
      const parent=node.parentElement;
      if(!parent || ['SCRIPT','STYLE','NOSCRIPT'].includes(parent.tagName)) return;
      const key=node.parentElement?.dataset?.i18nBase || node.nodeValue.trim();
      const translated=tr(key);
      if(translated){
        node.parentElement.dataset.i18nBase=key;
        const lead=node.nodeValue.match(/^\s*/)?.[0]||'';
        const trail=node.nodeValue.match(/\s*$/)?.[0]||'';
        node.nodeValue=lead+translated+trail;
      }
    };
    const walker=document.createTreeWalker(modal,NodeFilter.SHOW_TEXT);const nodes=[];let n;while(n=walker.nextNode())nodes.push(n);nodes.forEach(translateNode);
    const action=document.getElementById('installModalAction');
    if(action){const base=action.dataset.i18nBase||action.textContent.trim();action.dataset.i18nBase=base;action.textContent=tr(base)||base;}
  }

  function refreshAll(){
    refreshServices();
    refreshGallery();
    refreshServiceModal();
    refreshGalleryModal();
    refreshInstallModal();
  }

  window.__beautyStudioRefreshLanguageV86=refreshAll;
  window.addEventListener('beautyStudioLanguageChanged',refreshAll);
  window.addEventListener('beautyStudioD1ContentReady',refreshAll);
  document.addEventListener('click',e=>{
    if(e.target.closest('.service-card,.work-item,[data-service-choice],#installBtn,#installMain,.device-card,[data-close-install]')) setTimeout(refreshAll,20);
  },true);
  const watchIds=['service-grid','work-grid','installModal'];
  watchIds.forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    new MutationObserver(()=>setTimeout(refreshAll,0)).observe(el,{childList:true,subtree:true});
  });
  [100,700,1600,3200,6000].forEach(ms=>setTimeout(refreshAll,ms));
})();


/* V87 — complete D1 name/field localization + notification localization.
   Strategy:
   1) Prefer explicit Admin fields: titleZh/titleMy, descriptionZh/descriptionMy, etc.
   2) Localize the current starter catalog when old records only have English fields.
   3) Keep arbitrary customer/admin-written message text unchanged; only system labels
      and system-generated booking notification service names are localized.
*/
(function(){
  const L=()=>window.__beautyStudioGetLanguage?.()||'en';
  const clean=v=>String(v??'').trim();
  const tr=v=>window.__beautyStudioTranslateText?.(clean(v))||null;
  const serviceMap={
    'gel manicure d1 live':{
      title:{en:'Gel Manicure D1 Live',zh:'凝胶美甲 D1 Live',my:'ဂျယ်လ် လက်သည်း D1 Live'},
      description:{en:'Clean, glossy and effortless.',zh:'干净、亮泽，自然又精致。',my:'သန့်ရှင်းတောက်ပပြီး သဘာဝကျသော အလှ။'},
      kicker:{en:'Everyday',zh:'日常款',my:'နေ့စဉ်စတိုင်'},
      tags:{en:'Clean finish, Everyday, Long-lasting',zh:'干净收尾，日常款，持久',my:'သန့်ရှင်းသပ်ရပ်၊ နေ့စဉ်စတိုင်၊ ကြာရှည်ခံ'},
      caption:{en:'Natural beauty, lasting glow.',zh:'自然之美，持久光泽。',my:'သဘာဝအလှ၊ ကြာရှည်တောက်ပမှု။'},
      idealFor:{en:'Everyday wear · special moments',zh:'日常佩戴 · 特别时刻',my:'နေ့စဉ်ဝတ်ဆင်မှု · အထူးအချိန်များ'}
    },
    'custom nail art d1xz.net live':{
      title:{en:'Custom Nail Art D1xz.net Live',zh:'定制美甲 D1xz.net Live',my:'စိတ်ကြိုက် လက်သည်းအလှ D1xz.net Live'},
      description:{en:'Personal details made for you.',zh:'为你量身打造的个性细节。',my:'သင့်အတွက် အထူးဖန်တီးထားသော ကိုယ်ပိုင်အသေးစိတ်များ။'},
      kicker:{en:'Signature',zh:'特色款',my:'ထူးခြားစတိုင်'},
      tags:{en:'Custom detail, Signature, Creative',zh:'专属细节，特色款，创意',my:'စိတ်ကြိုက်အသေးစိတ်၊ ထူးခြားစတိုင်၊ ဖန်တီးမှု'},
      caption:{en:'Made with care.',zh:'用心为你完成。',my:'ဂရုတစိုက် ဖန်တီးပေးထားသည်။'},
      idealFor:{en:'Custom looks · creative days',zh:'个性造型 · 创意时光',my:'စိတ်ကြိုက်ဒီဇိုင်း · ဖန်တီးမှုနေ့များ'}
    },
    'new service':{
      title:{en:'New Service',zh:'新服务',my:'ဝန်ဆောင်မှုအသစ်'},
      description:{en:'Add a short description.',zh:'添加简短描述。',my:'အကျဉ်းချုပ်ဖော်ပြချက် ထည့်ပါ။'},
      kicker:{en:'Service',zh:'服务',my:'ဝန်ဆောင်မှု'},
      tags:{en:'Service, Detail, Personalized',zh:'服务，细节，专属',my:'ဝန်ဆောင်မှု၊ အသေးစိတ်၊ စိတ်ကြိုက်'},
      caption:{en:'Made with care.',zh:'用心完成。',my:'ဂရုတစိုက် ဖန်တီးပေးထားသည်။'},
      idealFor:{en:'Personalized care',zh:'个性化护理',my:'စိတ်ကြိုက်ဂရုစိုက်မှု'}
    },
    'extension nails':{
      title:{en:'Extension Nails',zh:'延长甲',my:'လက်သည်းတိုးချဲ့ခြင်း'},
      description:{en:'Length with a polished finish.',zh:'增加长度，呈现精致光泽。',my:'အရှည်တိုးပြီး သပ်ရပ်တောက်ပသော အချောသတ်။'},
      kicker:{en:'Length',zh:'长度',my:'အရှည်'},
      tags:{en:'Length, Nails, Refined',zh:'长度，甲型，精致',my:'အရှည်၊ လက်သည်းပုံစံ၊ သပ်ရပ်'},
      caption:{en:'Made with care.',zh:'用心完成。',my:'ဂရုတစိုက် ဖန်တီးပေးထားသည်။'},
      idealFor:{en:'Longer nails · polished finish',zh:'延长造型 · 精致收尾',my:'လက်သည်းရှည် · သပ်ရပ်သော အချောသတ်'}
    },
    '延长甲':{
      title:{en:'Extension Nails',zh:'延长甲',my:'လက်သည်းတိုးချဲ့ခြင်း'},
      description:{en:'Length with a polished finish.',zh:'增加长度，呈现精致光泽。',my:'အရှည်တိုးပြီး သပ်ရပ်တောက်ပသော အချောသတ်။'},
      kicker:{en:'Length',zh:'长度',my:'အရှည်'},
      tags:{en:'Length, Nails, Refined',zh:'长度，甲型，精致',my:'အရှည်၊ လက်သည်းပုံစံ၊ သပ်ရပ်'},
      caption:{en:'Made with care.',zh:'用心完成。',my:'ဂရုတစိုက် ဖန်တီးပေးထားသည်။'},
      idealFor:{en:'Longer nails · polished finish',zh:'延长造型 · 精致收尾',my:'လက်သည်းရှည် · သပ်ရပ်သော အချောသတ်'}
    }
  };
  const galleryMap={
    'soft pearl':{en:'Soft Pearl',zh:'柔光珍珠',my:'နူးညံ့ပုလဲ'},
    'quiet luxury':{en:'Quiet Luxury',zh:'静奢',my:'တိတ်ဆိတ်သော ဇိမ်ခံမှု'},
    'rose chrome':{en:'Rose Chrome',zh:'玫瑰镜面',my:'နှင်းဆီခရုမ်း'},
    'little hearts':{en:'Little Hearts',zh:'小心心',my:'နှလုံးသားလေးများ'}
  };
  const fieldMap={
    'clean, glossy and effortless.':{zh:'干净、亮泽，自然又精致。',my:'သန့်ရှင်းတောက်ပပြီး သဘာဝကျသော အလှ။'},
    'personal details made for you.':{zh:'为你量身打造的个性细节。',my:'သင့်အတွက် အထူးဖန်တီးထားသော ကိုယ်ပိုင်အသေးစိတ်များ။'},
    'length with a polished finish.':{zh:'增加长度，呈现精致光泽。',my:'အရှည်တိုးပြီး သပ်ရပ်တောက်ပသော အချောသတ်။'},
    'add a short description.':{zh:'添加简短描述。',my:'အကျဉ်းချုပ်ဖော်ပြချက် ထည့်ပါ။'},
    'service':{zh:'服务',my:'ဝန်ဆောင်မှု'},
    'personalized':{zh:'专属服务',my:'စိတ်ကြိုက်ဝန်ဆောင်မှု'},
    'signature':{zh:'特色款',my:'ထူးခြားစတိုင်'},
    'everyday':{zh:'日常款',my:'နေ့စဉ်စတိုင်'},
    'length':{zh:'长度',my:'အရှည်'},
    'new service':{zh:'新服务',my:'ဝန်ဆောင်မှုအသစ်'}
  };
  function direct(v){
    const raw=clean(v), key=raw.toLowerCase();
    if(!raw)return raw;
    if(L()==='en')return raw;
    const sm=serviceMap[key];
    if(sm?.title && (key===sm.title.en.toLowerCase())) return sm.title[L()];
    const gm=galleryMap[key]; if(gm)return gm[L()];
    const fm=fieldMap[key]; if(fm)return fm[L()];
    const p=tr(raw); return p||raw;
  }
  function pick(o,base,fallback=''){
    if(!o)return fallback;
    const l=L();
    if(l==='en')return clean(o[base]??fallback);
    const suffixes=l==='zh'?['Zh','_zh','CN','_cn']:['My','_my','Mm','_mm'];
    for(const suffix of suffixes){
      const v=o[base+suffix];
      if(v!=null&&clean(v))return clean(v);
    }
    const raw=clean(o[base]??fallback);
    const key=raw.toLowerCase();
    const sm=serviceMap[key];
    if(sm?.[base]?.[l])return sm[base][l];
    if(base==='title'){
      const g=galleryMap[key]; if(g)return g[l];
    }
    return direct(raw)||fallback;
  }
  const services=()=>window.BEAUTY_STUDIO_CONTENT?.services||{};
  const gallery=()=>Array.isArray(window.BEAUTY_STUDIO_CONTENT?.gallery)?window.BEAUTY_STUDIO_CONTENT.gallery:[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function serviceByName(name){
    const raw=clean(name).toLowerCase();
    const entries=Object.entries(services());
    return entries.find(([k,s])=>{
      const vals=[s?.title,s?.name,s?.titleZh,s?.titleMy].map(v=>clean(v).toLowerCase());
      return vals.includes(raw)||clean(k).toLowerCase()===raw;
    })?.[1]||null;
  }

  function localizeNotification(item){
    const lang=L(), type=item?.type||'';
    const system={
      booking_confirmed:{title:{en:'Appointment confirmed',zh:'预约已确认',my:'ချိန်းဆိုမှု အတည်ပြုပြီးပါပြီ'},label:{en:'BOOKING CONFIRMED',zh:'预约已确认',my:'ချိန်းဆိုမှု အတည်ပြု'},},
      booking_cancelled:{title:{en:'Appointment update',zh:'预约状态更新',my:'ချိန်းဆိုမှု အခြေအနေ အပ်ဒိတ်'},label:{en:'BOOKING UPDATE',zh:'预约更新',my:'ချိန်းဆိုမှု အပ်ဒိတ်'}},
      booking_completed:{title:{en:'Appointment completed',zh:'预约已完成',my:'ချိန်းဆိုမှု ပြီးစီးပါပြီ'},label:{en:'BOOKING COMPLETE',zh:'预约完成',my:'ချိန်းဆိုမှု ပြီးစီး'}},
      booking_pending:{title:{en:'Booking received',zh:'已收到预约申请',my:'ချိန်းဆိုမှု တောင်းဆိုချက် ရရှိပါပြီ'},label:{en:'BOOKING RECEIVED',zh:'已收到预约',my:'ချိန်းဆိုမှု လက်ခံရရှိ'}},
      support_message:{title:{en:'New message from Beauty Studio',zh:'Beauty Studio 发来新消息',my:'Beauty Studio မှ မက်ဆေ့ချ်အသစ်'},label:{en:'NEW MESSAGE',zh:'新消息',my:'မက်ဆေ့ချ်အသစ်'}},
    };
    const cfg=system[type]||{title:{en:'Studio update',zh:'工作室更新',my:'စတူဒီယို အပ်ဒိတ်'},label:{en:'STUDIO UPDATE',zh:'工作室更新',my:'စတူဒီယို အပ်ဒိတ်'}};
    let title=cfg.title[lang]||cfg.title.en;
    let message=clean(item?.message);
    // Booking messages generated by the Worker are kept factual but the service name
    // and system date/time separators are localized.
    if(/^booking_/i.test(type)){
      const m=message.match(/^(.+?)\s*[·•|]\s*(\d{4}-\d{2}-\d{2})\s*[·•|]\s*(\d{1,2}:\d{2})(.*)$/);
      if(m){
        const s=serviceByName(m[1]);
        const name=s?pick(s,'title',m[1]):direct(m[1]);
        const sep=lang==='zh'?' · ':lang==='my'?' · ':' · ';
        message=`${name}${sep}${m[2]}${sep}${m[3]}${m[4]||''}`;
      }else{
        message=direct(message);
      }
    }
    return {label:cfg.label[lang]||cfg.label.en,title,message};
  }

  // Re-apply every D1-created service field, including the modal and booking choices.
  function refreshServices(){
    const list=services();
    document.querySelectorAll('.service-card[data-service]').forEach(card=>{
      const s=list[card.dataset.service]; if(!s)return;
      const q=x=>card.querySelector(x);
      const title=pick(s,'title',pick(s,'name','Beauty Service'));
      const desc=pick(s,'description','');
      const kicker=pick(s,'kicker','Service');
      if(q('h3'))q('h3').textContent=title;
      if(q('.service-info > p'))q('.service-info > p').textContent=desc;
      if(q('.service-kicker span:first-child'))q('.service-kicker span:first-child').textContent=kicker;
      if(q('.service-bottom > span'))q('.service-bottom > span').textContent=pick(s,'tags','');
      if(q('.service-photo-label'))q('.service-photo-label').textContent=L()==='zh'?'服务精选':L()==='my'?'ဝန်ဆောင်မှုရွေးချယ်မှု':'BEAUTY EDIT';
      const meta=card.querySelectorAll('.service-meta span');
      if(meta[0])meta[0].textContent=s.price||'';
      if(meta[1])meta[1].textContent=s.duration?`${s.duration} MIN`:'';
    });
    document.querySelectorAll('[data-service-choice][data-service-key]').forEach(btn=>{
      const s=list[btn.dataset.serviceKey];if(!s)return;
      const title=pick(s,'title',pick(s,'name','Beauty Service'));
      btn.dataset.serviceChoice=title;
      const sp=btn.querySelector('span'),sm=btn.querySelector('small');
      if(sp)sp.textContent=title;
      if(sm)sm.textContent=`${s.price||''} · ${s.duration||''} min`;
    });
  }

  function refreshServiceModal(){
    const key=document.getElementById('chooseServiceButton')?.dataset.bookService;
    const s=key?services()[key]:null;if(!s)return;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??''};
    set('serviceModalTitle',pick(s,'title',pick(s,'name','Beauty Service')));
    set('serviceModalDescription',pick(s,'description',''));
    set('serviceModalKicker',pick(s,'kicker','Service'));
    set('serviceModalCaption',pick(s,'caption','Made with care.'));
    set('serviceIdealFor',pick(s,'idealFor','Personalized care'));
    const tags=pick(s,'tags','').split(',').map(clean).filter(Boolean);
    const rows=Array.isArray(s.highlights)&&s.highlights.length?s.highlights:[
      [tags[0]||'Service', 'Tailored studio service'],
      [s.duration?`${s.duration} min`:'Flexible','Estimated appointment time'],
      [tags[1]||'Detail','Personalized finish']
    ];
    const hi=document.getElementById('serviceHighlights');
    if(hi)hi.innerHTML=rows.slice(0,3).map(r=>{
      const a=Array.isArray(r)?r:[r,'Studio detail'];
      return `<div><span>✦</span><strong>${esc(direct(a[0]))}</strong><small>${esc(direct(a[1]))}</small></div>`;
    }).join('');
    const points=L()==='zh'&&Array.isArray(s.pointsZh)?s.pointsZh:L()==='my'&&Array.isArray(s.pointsMy)?s.pointsMy:(Array.isArray(s.points)?s.points:[]);
    const ul=document.getElementById('servicePoints');
    if(ul)ul.innerHTML=points.map(x=>`<li>${esc(direct(x))}</li>`).join('');
  }

  function refreshGallery(){
    const items=gallery(),cards=[...document.querySelectorAll('#work-grid .work-item')];
    cards.forEach((card,i)=>{
      const it=items[i];if(!it)return;
      const title=pick(it,'title',it.title||'Beauty Style');
      const style=pick(it,'style',it.category||'');
      const desc=pick(it,'description',it.description||'');
      card.dataset.title=title;card.dataset.style=style;card.dataset.description=desc;
      const info=card.querySelector('div:last-child');
      if(info?.querySelector('strong'))info.querySelector('strong').textContent=title;
      if(info?.querySelector('span'))info.querySelector('span').textContent=style;
      const img=card.querySelector('.gallery-photo');if(img)img.alt=title;
    });
  }

  function refreshGalleryModal(){
    const modal=document.getElementById('detailModal'),grid=document.getElementById('work-grid');
    if(!modal||!grid||!modal.classList.contains('open'))return;
    const cards=[...grid.querySelectorAll('.work-item')];
    const active=cards.find(c=>c.classList.contains('is-active-work'))||cards[0];
    if(!active)return;
    const it=gallery()[cards.indexOf(active)];if(!it)return;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??''};
    set('modalTitle',pick(it,'title','Beauty Style'));
    set('modalStyle',pick(it,'style',it.category||''));
    set('modalDescription',pick(it,'description',''));
    set('modalWorkNumber',it.number||String(cards.indexOf(active)+1).padStart(2,'0'));
    set('modalMood',pick(it,'mood',''));
    set('modalNote',pick(it,'note','Love this look? Bring it as inspiration and the studio can fine-tune the details for you.'));
    const reco=it.recommendedService?services()[it.recommendedService]:null;
    if(reco)set('modalRecommended',pick(reco,'title',reco.name||'Custom Nail Art'));
  }

  function refreshNotifications(){
    const list=document.getElementById('customerNotificationList');
    if(!list)return;
    list.querySelectorAll('.customer-notification-item').forEach(item=>{
      const id=item.dataset.notificationId;
      const data=window.__beautyStudioNotificationCache?.find?.(x=>String(x.id)===String(id));
      if(!data)return;
      const n=localizeNotification(data);
      const small=item.querySelector('small'),strong=item.querySelector('strong'),p=item.querySelector('p');
      if(small)small.textContent=n.label;
      if(strong)strong.textContent=n.title;
      if(p)p.textContent=n.message;
    });
    const empty=list.querySelector('.customer-notification-empty');
    if(empty)empty.textContent=L()==='zh'?'暂无新通知。':L()==='my'?'အသစ်သော အပ်ဒိတ် မရှိသေးပါ။':'No new updates yet.';
    const footer=list.querySelector('.customer-notification-footer');
    if(footer)footer.textContent=L()==='zh'?'工作室通知会在刷新后保留。':L()==='my'?'စတူဒီယို အပ်ဒိတ်များကို refresh ပြီးနောက်လည်း သိမ်းထားပါမည်။':'Your studio updates stay here after refresh.';
  }

  window.__beautyStudioLocalizeNotification=localizeNotification;
  window.__beautyStudioRefreshLanguageV87=()=>{
    refreshServices();refreshGallery();refreshServiceModal();refreshGalleryModal();refreshNotifications();
  };
  window.addEventListener('beautyStudioLanguageChanged',window.__beautyStudioRefreshLanguageV87);
  window.addEventListener('beautyStudioD1ContentReady',window.__beautyStudioRefreshLanguageV87);
  [150,800,1800,3500,6000].forEach(ms=>setTimeout(window.__beautyStudioRefreshLanguageV87,ms));
})();


/* v88 — complete service localization layer
   Keeps D1 as the source of truth while localizing service cards, detail modal,
   booking labels and generated fallback copy. Explicit titleZh/titleMy/etc. win.
*/
(() => {
  const getLang = () => window.__beautyStudioGetLanguage?.() || 'en';
  const clean = v => String(v ?? '').trim();
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const content = () => window.BEAUTY_STUDIO_CONTENT || {};
  const services = () => content().services || {};

  const serviceProfiles = {
    'gel manicure d1 live': {
      title:{en:'Gel Manicure D1 Live',zh:'凝胶美甲 D1 Live',my:'ဂျယ်လ် လက်သည်း D1 Live'},
      description:{en:'Clean, glossy and effortless.',zh:'干净、亮泽，自然又精致。',my:'သန့်ရှင်းတောက်ပပြီး သဘာဝကျသော အလှ။'},
      kicker:{en:'Everyday',zh:'日常款',my:'နေ့စဉ်စတိုင်'},
      tags:{en:'Clean finish, Everyday, Long-lasting',zh:'干净收尾，日常款，持久',my:'သန့်ရှင်းသပ်ရပ်၊ နေ့စဉ်စတိုင်၊ ကြာရှည်ခံ'},
      caption:{en:'Natural beauty, lasting glow.',zh:'自然之美，持久光泽。',my:'သဘာဝအလှ၊ ကြာရှည်တောက်ပမှု။'},
      idealFor:{en:'Everyday wear · special moments',zh:'日常佩戴 · 特别时刻',my:'နေ့စဉ်ဝတ်ဆင်မှု · အထူးအချိန်များ'},
      highlights:[
        [{en:'Care',zh:'护理',my:'ဂရုစိုက်မှု'},{en:'Prep & shaping',zh:'修甲与塑形',my:'လက်သည်းပြင်ဆင်ခြင်းနှင့် ပုံဖော်ခြင်း'}],
        [{en:'Finish',zh:'收尾',my:'အချောသတ်'},{en:'Clean & polished',zh:'干净精致的收尾',my:'သန့်ရှင်းသပ်ရပ်သော အချောသတ်'}],
        [{en:'Feel',zh:'感受',my:'ခံစားချက်'},{en:'Made for you',zh:'为你定制',my:'သင့်အတွက် ဖန်တီးထားသည်'}]
      ],
      points:[
        {en:'Nail preparation & shaping',zh:'指甲修整与塑形',my:'လက်သည်းပြင်ဆင်ခြင်းနှင့် ပုံဖော်ခြင်း'},
        {en:'Gel color application',zh:'凝胶颜色涂布',my:'ဂျယ်လ်အရောင် လိမ်းပေးခြင်း'},
        {en:'Clean finish & care',zh:'精致收尾与护理',my:'သန့်ရှင်းသပ်ရပ်သော အချောသတ်နှင့် ဂရုစိုက်မှု'}
      ]
    },
    'custom nail art d1xz.net live': {
      title:{en:'Custom Nail Art D1xz.net Live',zh:'定制美甲 D1xz.net Live',my:'စိတ်ကြိုက် လက်သည်းအလှ D1xz.net Live'},
      description:{en:'Personal details made for you.',zh:'为你量身打造的个性细节。',my:'သင့်အတွက် အထူးဖန်တီးထားသော ကိုယ်ပိုင်အသေးစိတ်များ။'},
      kicker:{en:'Signature',zh:'特色款',my:'ထူးခြားစတိုင်'},
      tags:{en:'Custom detail, Signature, Creative',zh:'专属细节，特色款，创意',my:'စိတ်ကြိုက်အသေးစိတ်၊ ထူးခြားစတိုင်၊ ဖန်တီးမှု'},
      caption:{en:'Your mood, made into detail.',zh:'把你的心情变成细节。',my:'သင့်ခံစားချက်ကို အသေးစိတ်အဖြစ် ဖန်တီးပေးပါတယ်။'},
      idealFor:{en:'Custom looks · creative days',zh:'个性造型 · 创意时光',my:'စိတ်ကြိုက်ဒီဇိုင်း · ဖန်တီးမှုနေ့များ'},
      highlights:[
        [{en:'Base',zh:'基础护理',my:'အခြေခံဂရုစိုက်မှု'},{en:'Manicure included',zh:'包含基础美甲护理',my:'အခြေခံလက်သည်းအလှ ပြုလုပ်မှု ပါဝင်သည်'}],
        [{en:'Design',zh:'设计',my:'ဒီဇိုင်း'},{en:'Color & detail',zh:'颜色与细节',my:'အရောင်နှင့် အသေးစိတ်'}],
        [{en:'Plan',zh:'方案',my:'အစီအစဉ်'},{en:'Design consultation',zh:'设计沟通',my:'ဒီဇိုင်းတိုင်ပင်ခြင်း'}]
      ],
      points:[
        {en:'Base manicure included',zh:'包含基础美甲护理',my:'အခြေခံလက်သည်းအလှ ပြုလုပ်မှု ပါဝင်သည်'},
        {en:'Custom color & detail',zh:'定制颜色与细节',my:'စိတ်ကြိုက်အရောင်နှင့် အသေးစိတ်'},
        {en:'Design consultation',zh:'设计沟通',my:'ဒီဇိုင်းတိုင်ပင်ခြင်း'}
      ]
    },
    'extension nails': {
      title:{en:'Extension Nails',zh:'延长甲',my:'လက်သည်းတိုးချဲ့ခြင်း'},
      description:{en:'Length with a polished finish.',zh:'增加长度，呈现精致光泽。',my:'အရှည်တိုးပြီး သပ်ရပ်တောက်ပသော အချောသတ်။'},
      kicker:{en:'Length',zh:'长度',my:'အရှည်'},
      tags:{en:'Length, Nails, Refined',zh:'长度，甲型，精致',my:'အရှည်၊ လက်သည်းပုံစံ၊ သပ်ရပ်'},
      caption:{en:'Long, refined and beautifully yours.',zh:'修长、精致，真正属于你。',my:'ရှည်လျား၊ သပ်ရပ်ပြီး သင့်အတွက်ပဲ ဖြစ်ပါတယ်။'},
      idealFor:{en:'Longer nails · polished finish',zh:'延长造型 · 精致收尾',my:'လက်သည်းရှည် · သပ်ရပ်သော အချောသတ်'},
      highlights:[
        [{en:'Shape',zh:'甲型',my:'လက်သည်းပုံစံ'},{en:'Consultation',zh:'造型沟通',my:'တိုင်ပင်ခြင်း'}],
        [{en:'Length',zh:'长度',my:'အရှည်'},{en:'Extension application',zh:'延长甲制作',my:'လက်သည်းတိုးချဲ့ခြင်း'}],
        [{en:'Care',zh:'护理',my:'ဂရုစိုက်မှု'},{en:'Aftercare guidance',zh:'术后护理指导',my:'နောက်ဆက်တွဲ ဂရုစိုက်မှု လမ်းညွှန်'}]
      ],
      points:[
        {en:'Shape consultation',zh:'甲型沟通',my:'လက်သည်းပုံစံ တိုင်ပင်ခြင်း'},
        {en:'Extension application',zh:'延长甲制作',my:'လက်သည်းတိုးချဲ့ခြင်း'},
        {en:'Aftercare guidance',zh:'术后护理指导',my:'နောက်ဆက်တွဲ ဂရုစိုက်မှု လမ်းညွှန်'}
      ]
    },
    'new service': {
      title:{en:'New Service',zh:'新服务',my:'ဝန်ဆောင်မှုအသစ်'},
      description:{en:'Add a short description.',zh:'添加简短描述。',my:'အကျဉ်းချုပ်ဖော်ပြချက် ထည့်ပါ။'},
      kicker:{en:'Service',zh:'服务',my:'ဝန်ဆောင်မှု'},
      tags:{en:'Service, Detail, Personalized',zh:'服务，细节，专属',my:'ဝန်ဆောင်မှု၊ အသေးစိတ်၊ စိတ်ကြိုက်'},
      caption:{en:'Made with care.',zh:'用心完成。',my:'ဂရုတစိုက် ဖန်တီးပေးထားသည်။'},
      idealFor:{en:'Personalized care',zh:'个性化护理',my:'စိတ်ကြိုက်ဂရုစိုက်မှု'}
    }
  };

  const phrase = {
    'service':{zh:'服务',my:'ဝန်ဆောင်မှု'},
    'detail':{zh:'细节',my:'အသေးစိတ်'},
    'personalized':{zh:'专属',my:'စိတ်ကြိုက်'},
    'care':{zh:'护理',my:'ဂရုစိုက်မှု'},
    'finish':{zh:'收尾',my:'အချောသတ်'},
    'feel':{zh:'感受',my:'ခံစားချက်'},
    'base':{zh:'基础护理',my:'အခြေခံဂရုစိုက်မှု'},
    'design':{zh:'设计',my:'ဒီဇိုင်း'},
    'plan':{zh:'方案',my:'အစီအစဉ်'},
    'shape':{zh:'甲型',my:'လက်သည်းပုံစံ'},
    'length':{zh:'长度',my:'အရှည်'},
    'consultation':{zh:'沟通',my:'တိုင်ပင်ခြင်း'},
    'shape consultation':{zh:'甲型沟通',my:'လက်သည်းပုံစံ တိုင်ပင်ခြင်း'},
    'manicure included':{zh:'包含基础美甲护理',my:'အခြေခံလက်သည်းအလှ ပြုလုပ်မှု ပါဝင်သည်'},
    'prep & shaping':{zh:'修甲与塑形',my:'လက်သည်းပြင်ဆင်ခြင်းနှင့် ပုံဖော်ခြင်း'},
    'clean & polished':{zh:'干净精致的收尾',my:'သန့်ရှင်းသပ်ရပ်သော အချောသတ်'},
    'made for you':{zh:'为你定制',my:'သင့်အတွက် ဖန်တီးထားသည်'},
    'color & detail':{zh:'颜色与细节',my:'အရောင်နှင့် အသေးစိတ်'},
    'design consultation':{zh:'设计沟通',my:'ဒီဇိုင်းတိုင်ပင်ခြင်း'},
    'extension application':{zh:'延长甲制作',my:'လက်သည်းတိုးချဲ့ခြင်း'},
    'aftercare guidance':{zh:'术后护理指导',my:'နောက်ဆက်တွဲ ဂရုစိုက်မှု လမ်းညွှန်'},
    'tailored studio service':{zh:'为你定制的工作室服务',my:'သင့်အတွက် စိတ်ကြိုက်စတူဒီယိုဝန်ဆောင်မှု'},
    'estimated appointment time':{zh:'预计服务时长',my:'ခန့်မှန်းဝန်ဆောင်ချိန်'},
    'personalized finish':{zh:'专属精致收尾',my:'စိတ်ကြိုက် သပ်ရပ်သော အချောသတ်'},
    'studio preparation and finish':{zh:'工作室准备与收尾',my:'စတူဒီယိုပြင်ဆင်မှုနှင့် အချောသတ်'},
    'time confirmed with the studio':{zh:'具体时间由工作室确认',my:'အချိန်ကို စတူဒီယိုနှင့် အတည်ပြုပါမည်'},
    'flexible':{zh:'灵活安排',my:'အဆင်ပြေသလို စီစဉ်နိုင်သည်'},
    'price on request':{zh:'价格待定',my:'စျေးနှုန်း မသတ်မှတ်ရသေးပါ'},
    'made with care.':{zh:'用心完成。',my:'ဂရုတစိုက် ဖန်တီးပေးထားသည်။'},
    'personalized care':{zh:'个性化护理',my:'စိတ်ကြိုက်ဂရုစိုက်မှု'},
    'everyday wear · special moments':{zh:'日常佩戴 · 特别时刻',my:'နေ့စဉ်ဝတ်ဆင်မှု · အထူးအချိန်များ'},
    'custom looks · creative days':{zh:'个性造型 · 创意时光',my:'စိတ်ကြိုက်ဒီဇိုင်း · ဖန်တီးမှုနေ့များ'},
    'longer nails · polished finish':{zh:'延长造型 · 精致收尾',my:'လက်သည်းရှည် · သပ်ရပ်သော အချောသတ်'},
    'from':{zh:'起价',my:'စတင်စျေး'},
    'min':{zh:'分钟',my:'မိနစ်'},
    'minutes':{zh:'分钟',my:'မိနစ်'}
  };

  const norm = v => clean(v).toLowerCase().replace(/\s+/g,' ');
  const profileFor = s => {
    const candidates=[s?.title,s?.name,s?.titleZh,s?.titleMy,s?.id].map(norm).filter(Boolean);
    for(const c of candidates){ if(serviceProfiles[c]) return serviceProfiles[c]; }
    const joined=candidates.join(' | ');
    if(joined.includes('gel manicure')) return serviceProfiles['gel manicure d1 live'];
    if(joined.includes('custom nail art')) return serviceProfiles['custom nail art d1xz.net live'];
    if(joined.includes('extension') || joined.includes('延长甲') || joined.includes('လက်သည်းတိုး')) return serviceProfiles['extension nails'];
    if(joined.includes('new service') || joined.includes('新服务') || joined.includes('ဝန်ဆောင်မှုအသစ်')) return serviceProfiles['new service'];
    return null;
  };
  const explicit = (s, base) => {
    const l=getLang();
    if(l==='en') return clean(s?.[base]);
    const keys=l==='zh'?[`${base}Zh`,`${base}_zh`,`${base}CN`,`${base}_cn`]:[`${base}My`,`${base}_my`,`${base}Mm`,`${base}_mm`];
    for(const k of keys){ if(clean(s?.[k])) return clean(s[k]); }
    return '';
  };
  const trPhrase = v => {
    const raw=clean(v), l=getLang();
    if(!raw || l==='en') return raw;
    const p=phrase[norm(raw)];
    if(p?.[l]) return p[l];
    return window.__beautyStudioTranslate?.(raw) || raw;
  };
  const localized = (s, base, fallback='') => {
    const ex=explicit(s,base); if(ex)return ex;
    const raw=clean(s?.[base] ?? fallback);
    const profile=profileFor(s);
    if(profile?.[base]?.[getLang()]) return profile[base][getLang()];
    return trPhrase(raw) || raw;
  };
  const localizedArray = (s, base) => {
    const l=getLang();
    const explicitArray = l==='zh' ? s?.[`${base}Zh`] : l==='my' ? s?.[`${base}My`] : s?.[base];
    if(Array.isArray(explicitArray) && explicitArray.length) return explicitArray;
    const profile=profileFor(s);
    if(profile?.[base]) return profile[base];
    const raw=Array.isArray(s?.[base]) ? s[base] : [];
    return raw.map(x=>Array.isArray(x) ? x.map(trPhrase) : trPhrase(x));
  };
  const displayArrayValue = v => {
    if(v && typeof v==='object' && !Array.isArray(v)) return clean(v[getLang()] ?? v.en ?? '');
    return trPhrase(v);
  };
  const price = s => {
    const raw=clean(s?.price); if(!raw)return getLang()==='en'?'Price on request':getLang()==='zh'?'价格待定':'စျေးနှုန်း မသတ်မှတ်ရသေးပါ';
    if(getLang()==='en')return raw;
    return raw.replace(/^from\b\s*/i,'').trim() ? `${getLang()==='zh'?'起价':'စတင်စျေး'} ${raw.replace(/^from\b\s*/i,'').trim()}` : raw;
  };
  const duration = s => {
    const raw=clean(s?.duration); if(!raw)return '';
    if(getLang()==='en')return raw.replace(/\s*min(?:utes?)?$/i,'')+' min';
    return getLang()==='zh' ? raw.replace(/\s*min(?:utes?)?$/i,'')+' 分钟' : raw.replace(/\s*min(?:utes?)?$/i,'')+' မိနစ်';
  };
  const durationShort = s => {
    const raw=clean(s?.durationShort || s?.duration); if(!raw)return '';
    if(getLang()==='en')return raw.toUpperCase().includes('MIN')?raw.toUpperCase():raw+' MIN';
    const n=(raw.match(/\d+/)||[''])[0]; return getLang()==='zh'?`${n} 分钟`:`${n} မိနစ်`;
  };

  function renderCard(card,s){
    const q=x=>card.querySelector(x), title=localized(s,'title',localized(s,'name','Beauty Service'));
    const desc=localized(s,'description','');
    if(q('h3'))q('h3').textContent=title;
    if(q('.service-info > p'))q('.service-info > p').textContent=desc;
    if(q('.service-kicker span:first-child'))q('.service-kicker span:first-child').textContent=localized(s,'kicker','Service');
    if(q('.service-bottom > span'))q('.service-bottom > span').textContent=localized(s,'tags','');
    if(q('.service-photo-label'))q('.service-photo-label').textContent=getLang()==='zh'?'服务精选':getLang()==='my'?'ဝန်ဆောင်မှုရွေးချယ်မှု':'BEAUTY EDIT';
    const meta=card.querySelectorAll('.service-meta span');
    if(meta[0])meta[0].textContent=price(s);
    if(meta[1])meta[1].textContent=durationShort(s);
  }

  function renderBookingChoices(){
    document.querySelectorAll('[data-service-choice][data-service-key]').forEach(btn=>{
      const s=services()[btn.dataset.serviceKey]; if(!s)return;
      const title=localized(s,'title',localized(s,'name','Beauty Service'));
      btn.dataset.serviceChoice=title;
      const sp=btn.querySelector('span'), sm=btn.querySelector('small');
      if(sp)sp.textContent=title;
      if(sm)sm.textContent=`${price(s)} · ${duration(s)}`;
    });
  }

  function renderModal(){
    const choose=document.getElementById('chooseServiceButton'), key=choose?.dataset.bookService, s=key?services()[key]:null;
    if(!s)return;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=clean(v)};
    set('serviceModalNumber',s.number||'');
    set('serviceModalDuration',durationShort(s));
    set('serviceModalTitle',localized(s,'title',localized(s,'name','Beauty Service')));
    set('serviceModalPrice',price(s));
    set('serviceModalDurationText',duration(s));
    set('serviceModalDescription',localized(s,'description',''));
    set('serviceModalKicker',localized(s,'kicker','Service'));
    set('serviceModalCaption',localized(s,'caption','Made with care.'));
    set('serviceIdealFor',localized(s,'idealFor','Personalized care'));

    const rows=localizedArray(s,'highlights');
    const hi=document.getElementById('serviceHighlights');
    if(hi){
      const fallback=[
        ['Service','Tailored studio service'],
        [s.duration?`${s.duration} min`:'Flexible','Estimated appointment time'],
        ['Detail','Personalized finish']
      ];
      const source=rows.length?rows:fallback;
      hi.innerHTML=source.slice(0,3).map(row=>{
        const a=Array.isArray(row)?row:[row,'Studio detail'];
        return `<div><span>✦</span><strong>${esc(displayArrayValue(a[0]))}</strong><small>${esc(displayArrayValue(a[1]))}</small></div>`;
      }).join('');
    }

    const points=localizedArray(s,'points');
    const ul=document.getElementById('servicePoints');
    if(ul){
      const fallback=points.length?points:[localized(s,'description','Personalized service details'),'Studio preparation and finish',s.duration?`Estimated time: ${s.duration} minutes`:'Time confirmed with the studio'];
      ul.innerHTML=fallback.slice(0,4).map(x=>`<li>${esc(displayArrayValue(x))}</li>`).join('');
    }
    const note=document.querySelector('#serviceModal .service-modal-note');
    if(note)note.textContent=getLang()==='zh'?'最终价格可能因长度、设计细节和附加项目而有所变化。':getLang()==='my'?'နောက်ဆုံးစျေးနှုန်းက အရှည်၊ ဒီဇိုင်းအသေးစိတ်နဲ့ အပိုဝန်ဆောင်မှုအလိုက် ပြောင်းလဲနိုင်ပါတယ်။':'Final price may vary with length, design detail and add-ons.';
    const count=document.getElementById('serviceModalPhotoCount');
    if(count)count.textContent=`Beauty Studio · ${s.number||'01'} / ${String(Object.keys(services()).length).padStart(2,'0')}`;
  }

  function refresh(){
    document.querySelectorAll('.service-card[data-service]').forEach(card=>{const s=services()[card.dataset.service];if(s)renderCard(card,s)});
    renderBookingChoices();
    renderModal();
  }

  // Render after D1 content arrives and every time the language changes.
  window.addEventListener('beautyStudioD1ContentReady',refresh);
  window.addEventListener('beautyStudioLanguageChanged',refresh);
  document.addEventListener('click',e=>{
    const card=e.target.closest?.('.service-trigger[data-service]');
    if(card) setTimeout(renderModal,0);
  },true);
  [100,500,1200,2500,5000].forEach(ms=>setTimeout(refresh,ms));
})();


/* V90 — FINAL SERVICE LANGUAGE OVERRIDE
   Fixes the remaining D1 service rendering race/override:
   - identifies the starter services by their stable card keys (gel/art/extensions)
   - translates title + description + price label + duration label
   - translates service detail modal title/description/highlights/points
   - respects explicit Admin titleZh/titleMy/descriptionZh/descriptionMy/etc.
   - keeps arbitrary new Admin service names unchanged unless translated fields exist,
     preventing incorrect automatic guesses
   - re-applies after D1 card creation and language changes
*/
(() => {
  const L = () => window.__beautyStudioGetLanguage?.() || 'en';
  const clean = v => String(v ?? '').trim();
  const norm = v => clean(v).toLowerCase().replace(/\s+/g, ' ');
  const content = () => window.BEAUTY_STUDIO_CONTENT || {};
  const services = () => content().services || {};

  const profiles = {
    gel: {
      title:{en:'Gel Manicure D1 Live',zh:'凝胶美甲 D1 Live',my:'ဂျယ်လ် လက်သည်း D1 Live'},
      description:{en:'Clean, glossy and effortless.',zh:'干净、亮泽，自然又精致。',my:'သန့်ရှင်းတောက်ပပြီး သဘာဝကျသော အလှ။'},
      kicker:{en:'Everyday',zh:'日常款',my:'နေ့စဉ်စတိုင်'},
      tags:{en:'Clean finish, Everyday, Long-lasting',zh:'干净收尾，日常款，持久',my:'သန့်ရှင်းသပ်ရပ်၊ နေ့စဉ်စတိုင်၊ ကြာရှည်ခံ'},
      caption:{en:'Natural beauty, lasting glow.',zh:'自然之美，持久光泽。',my:'သဘာဝအလှ၊ ကြာရှည်တောက်ပမှု။'},
      idealFor:{en:'Everyday wear · special moments',zh:'日常佩戴 · 特别时刻',my:'နေ့စဉ်ဝတ်ဆင်မှု · အထူးအချိန်များ'},
      highlights:[
        [{en:'Care',zh:'护理',my:'ဂရုစိုက်မှု'},{en:'Prep & shaping',zh:'修甲与塑形',my:'လက်သည်းပြင်ဆင်ခြင်းနှင့် ပုံဖော်ခြင်း'}],
        [{en:'Finish',zh:'收尾',my:'အချောသတ်'},{en:'Clean & polished',zh:'干净精致的收尾',my:'သန့်ရှင်းသပ်ရပ်သော အချောသတ်'}],
        [{en:'Feel',zh:'感受',my:'ခံစားချက်'},{en:'Made for you',zh:'为你定制',my:'သင့်အတွက် ဖန်တီးထားသည်'}]
      ],
      points:[
        {en:'Nail preparation & shaping',zh:'指甲修整与塑形',my:'လက်သည်းပြင်ဆင်ခြင်းနှင့် ပုံဖော်ခြင်း'},
        {en:'Gel color application',zh:'凝胶颜色涂布',my:'ဂျယ်လ်အရောင် လိမ်းပေးခြင်း'},
        {en:'Clean finish & care',zh:'精致收尾与护理',my:'သန့်ရှင်းသပ်ရပ်သော အချောသတ်နှင့် ဂရုစိုက်မှု'}
      ]
    },
    art: {
      title:{en:'Custom Nail Art D1xz.net Live',zh:'定制美甲 D1xz.net Live',my:'စိတ်ကြိုက် လက်သည်းအလှ D1xz.net Live'},
      description:{en:'Personal details made for you.',zh:'为你量身打造的个性细节。',my:'သင့်အတွက် အထူးဖန်တီးထားသော ကိုယ်ပိုင်အသေးစိတ်များ။'},
      kicker:{en:'Signature',zh:'特色款',my:'ထူးခြားစတိုင်'},
      tags:{en:'Custom detail, Signature, Creative',zh:'专属细节，特色款，创意',my:'စိတ်ကြိုက်အသေးစိတ်၊ ထူးခြားစတိုင်၊ ဖန်တီးမှု'},
      caption:{en:'Your mood, made into detail.',zh:'把你的心情变成细节。',my:'သင့်ခံစားချက်ကို အသေးစိတ်အဖြစ် ဖန်တီးပေးပါတယ်။'},
      idealFor:{en:'Custom looks · creative days',zh:'个性造型 · 创意时光',my:'စိတ်ကြိုက်ဒီဇိုင်း · ဖန်တီးမှုနေ့များ'},
      highlights:[
        [{en:'Base',zh:'基础护理',my:'အခြေခံဂရုစိုက်မှု'},{en:'Manicure included',zh:'包含基础美甲护理',my:'အခြေခံလက်သည်းအလှ ပြုလုပ်မှု ပါဝင်သည်'}],
        [{en:'Design',zh:'设计',my:'ဒီဇိုင်း'},{en:'Color & detail',zh:'颜色与细节',my:'အရောင်နှင့် အသေးစိတ်'}],
        [{en:'Plan',zh:'方案',my:'အစီအစဉ်'},{en:'Design consultation',zh:'设计沟通',my:'ဒီဇိုင်းတိုင်ပင်ခြင်း'}]
      ],
      points:[
        {en:'Base manicure included',zh:'包含基础美甲护理',my:'အခြေခံလက်သည်းအလှ ပြုလုပ်မှု ပါဝင်သည်'},
        {en:'Custom color & detail',zh:'定制颜色与细节',my:'စိတ်ကြိုက်အရောင်နှင့် အသေးစိတ်'},
        {en:'Design consultation',zh:'设计沟通',my:'ဒီဇိုင်းတိုင်ပင်ခြင်း'}
      ]
    },
    extensions: {
      title:{en:'Extension Nails',zh:'延长甲',my:'လက်သည်းတိုးချဲ့ခြင်း'},
      description:{en:'Length with a polished finish.',zh:'增加长度，呈现精致光泽。',my:'အရှည်တိုးပြီး သပ်ရပ်တောက်ပသော အချောသတ်။'},
      kicker:{en:'Length',zh:'长度',my:'အရှည်'},
      tags:{en:'Length, Nails, Refined',zh:'长度，甲型，精致',my:'အရှည်၊ လက်သည်းပုံစံ၊ သပ်ရပ်'},
      caption:{en:'Long, refined and beautifully yours.',zh:'修长、精致，真正属于你。',my:'ရှည်လျား၊ သပ်ရပ်ပြီး သင့်အတွက်ပဲ ဖြစ်ပါတယ်။'},
      idealFor:{en:'Longer nails · polished finish',zh:'延长造型 · 精致收尾',my:'လက်သည်းရှည် · သပ်ရပ်သော အချောသတ်'},
      highlights:[
        [{en:'Shape',zh:'甲型',my:'လက်သည်းပုံစံ'},{en:'Consultation',zh:'造型沟通',my:'တိုင်ပင်ခြင်း'}],
        [{en:'Length',zh:'长度',my:'အရှည်'},{en:'Extension application',zh:'延长甲制作',my:'လက်သည်းတိုးချဲ့ခြင်း'}],
        [{en:'Care',zh:'护理',my:'ဂရုစိုက်မှု'},{en:'Aftercare guidance',zh:'术后护理指导',my:'နောက်ဆက်တွဲ ဂရုစိုက်မှု လမ်းညွှန်'}]
      ],
      points:[
        {en:'Shape consultation',zh:'甲型沟通',my:'လက်သည်းပုံစံ တိုင်ပင်ခြင်း'},
        {en:'Extension application',zh:'延长甲制作',my:'လက်သည်းတိုးချဲ့ခြင်း'},
        {en:'Aftercare guidance',zh:'术后护理指导',my:'နောက်ဆက်တွဲ ဂရုစိုက်မှု လမ်းညွှန်'}
      ]
    },
    new: {
      title:{en:'New Service',zh:'新服务',my:'ဝန်ဆောင်မှုအသစ်'},
      description:{en:'Add a short description.',zh:'添加简短描述。',my:'အကျဉ်းချုပ်ဖော်ပြချက် ထည့်ပါ။'},
      kicker:{en:'Service',zh:'服务',my:'ဝန်ဆောင်မှု'},
      tags:{en:'Service, Detail, Personalized',zh:'服务，细节，专属',my:'ဝန်ဆောင်မှု၊ အသေးစိတ်၊ စိတ်ကြိုက်'},
      caption:{en:'Made with care.',zh:'用心完成。',my:'ဂရုတစိုက် ဖန်တီးပေးထားသည်။'},
      idealFor:{en:'Personalized care',zh:'个性化护理',my:'စိတ်ကြိုက်ဂရုစိုက်မှု'}
    }
  };

  const phrase = {
    'service':{zh:'服务',my:'ဝန်ဆောင်မှု'},
    'detail':{zh:'细节',my:'အသေးစိတ်'},
    'personalized':{zh:'专属',my:'စိတ်ကြိုက်'},
    'care':{zh:'护理',my:'ဂရုစိုက်မှု'},
    'finish':{zh:'收尾',my:'အချောသတ်'},
    'feel':{zh:'感受',my:'ခံစားချက်'},
    'base':{zh:'基础护理',my:'အခြေခံဂရုစိုက်မှု'},
    'design':{zh:'设计',my:'ဒီဇိုင်း'},
    'plan':{zh:'方案',my:'အစီအစဉ်'},
    'shape':{zh:'甲型',my:'လက်သည်းပုံစံ'},
    'length':{zh:'长度',my:'အရှည်'},
    'consultation':{zh:'沟通',my:'တိုင်ပင်ခြင်း'},
    'shape consultation':{zh:'甲型沟通',my:'လက်သည်းပုံစံ တိုင်ပင်ခြင်း'},
    'extension application':{zh:'延长甲制作',my:'လက်သည်းတိုးချဲ့ခြင်း'},
    'aftercare guidance':{zh:'术后护理指导',my:'နောက်ဆက်တွဲ ဂရုစိုက်မှု လမ်းညွှန်'},
    'clean, glossy and effortless.':{zh:'干净、亮泽，自然又精致。',my:'သန့်ရှင်းတောက်ပပြီး သဘာဝကျသော အလှ။'},
    'personal details made for you.':{zh:'为你量身打造的个性细节。',my:'သင့်အတွက် အထူးဖန်တီးထားသော ကိုယ်ပိုင်အသေးစိတ်များ။'},
    'length with a polished finish.':{zh:'增加长度，呈现精致光泽。',my:'အရှည်တိုးပြီး သပ်ရပ်တောက်ပသော အချောသတ်။'},
    'add a short description.':{zh:'添加简短描述。',my:'အကျဉ်းချုပ်ဖော်ပြချက် ထည့်ပါ။'},
    'made with care.':{zh:'用心完成。',my:'ဂရုတစိုက် ဖန်တီးပေးထားသည်။'},
    'personalized care':{zh:'个性化护理',my:'စိတ်ကြိုက်ဂရုစိုက်မှု'},
    'everyday wear · special moments':{zh:'日常佩戴 · 特别时刻',my:'နေ့စဉ်ဝတ်ဆင်မှု · အထူးအချိန်များ'},
    'custom looks · creative days':{zh:'个性造型 · 创意时光',my:'စိတ်ကြိုက်ဒီဇိုင်း · ဖန်တီးမှုနေ့များ'},
    'longer nails · polished finish':{zh:'延长造型 · 精致收尾',my:'လက်သည်းရှည် · သပ်ရပ်သော အချောသတ်'},
    'tailored studio service':{zh:'为你定制的工作室服务',my:'သင့်အတွက် စိတ်ကြိုက်စတူဒီယိုဝန်ဆောင်မှု'},
    'estimated appointment time':{zh:'预计服务时长',my:'ခန့်မှန်းဝန်ဆောင်ချိန်'},
    'personalized finish':{zh:'专属精致收尾',my:'စိတ်ကြိုက် သပ်ရပ်သော အချောသတ်'},
    'base manicure included':{zh:'包含基础美甲护理',my:'အခြေခံလက်သည်းအလှ ပြုလုပ်မှု ပါဝင်သည်'},
    'custom color & detail':{zh:'定制颜色与细节',my:'စိတ်ကြိုက်အရောင်နှင့် အသေးစိတ်'},
    'design consultation':{zh:'设计沟通',my:'ဒီဇိုင်းတိုင်ပင်ခြင်း'},
    'nail preparation & shaping':{zh:'指甲修整与塑形',my:'လက်သည်းပြင်ဆင်ခြင်းနှင့် ပုံဖော်ခြင်း'},
    'gel color application':{zh:'凝胶颜色涂布',my:'ဂျယ်လ်အရောင် လိမ်းပေးခြင်း'},
    'clean finish & care':{zh:'精致收尾与护理',my:'သန့်ရှင်းသပ်ရပ်သော အချောသတ်နှင့် ဂရုစိုက်မှု'}
  };

  const keyAliases = {
    gel:'gel', manicure:'gel',
    art:'art', custom:'art',
    extensions:'extensions', extension:'extensions',
    'new service':'new', new:'new'
  };

  const esc = v => clean(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function profileFor(s, stableKey='') {
    const k = norm(stableKey);
    if (keyAliases[k]) return profiles[keyAliases[k]];
    const candidates = [s?.title,s?.name,s?.titleZh,s?.titleMy,s?.id].map(norm).filter(Boolean);
    for (const c of candidates) {
      if (profiles[c]) return profiles[c];
      if (c.includes('gel manicure')) return profiles.gel;
      if (c.includes('custom nail art')) return profiles.art;
      if (c.includes('extension') || c.includes('延长甲') || c.includes('လက်သည်းတိုး')) return profiles.extensions;
      if (c === 'new service' || c.includes('ဝန်ဆောင်မှုအသစ်')) return profiles.new;
    }
    return null;
  }

  function explicit(s, base) {
    const l = L();
    if (l === 'en') return clean(s?.[base]);
    const suffixes = l === 'zh'
      ? [`${base}Zh`,`${base}_zh`,`${base}CN`,`${base}_cn`]
      : [`${base}My`,`${base}_my`,`${base}Mm`,`${base}_mm`];
    for (const k of suffixes) if (clean(s?.[k])) return clean(s[k]);
    return '';
  }

  function translatePhrase(v) {
    const raw = clean(v);
    if (!raw || L() === 'en') return raw;
    const p = phrase[norm(raw)];
    if (p?.[L()]) return p[L()];
    return window.__beautyStudioTranslateText?.(raw) || raw;
  }

  function value(s, base, fallback='', stableKey='') {
    const ex = explicit(s, base);
    if (ex) return ex;
    const p = profileFor(s, stableKey);
    if (p?.[base]?.[L()]) return p[base][L()];
    const raw = clean(s?.[base] ?? fallback);
    return translatePhrase(raw);
  }

  function priceText(s) {
    const raw = clean(s?.price);
    if (!raw) return L()==='zh' ? '价格待定' : L()==='my' ? 'စျေးနှုန်း မသတ်မှတ်ရသေးပါ' : 'Price on request';
    if (L()==='en') return raw;
    const stripped = raw.replace(/^from\s*/i,'').trim();
    return `${L()==='zh'?'起价':'စတင်စျေး'} ${stripped}`;
  }

  function durationText(s, short=false) {
    const raw = clean(s?.durationShort || s?.duration);
    if (!raw) return '';
    const n = (raw.match(/\d+/)||[''])[0];
    if (!n) return raw;
    if (L()==='en') return short ? `${n} MIN` : `${n} min`;
    return L()==='zh' ? `${n} 分钟` : `${n} မိနစ်`;
  }

  function renderCard(card, s) {
    const stableKey = clean(card.dataset.service);
    const q = sel => card.querySelector(sel);

    const title = value(s,'title',value(s,'name','Beauty Service',stableKey),stableKey);
    const desc = value(s,'description','',stableKey);
    const kicker = value(s,'kicker','Service',stableKey);
    const tags = value(s,'tags','',stableKey);

    if (q('h3')) q('h3').textContent = title;
    if (q('.service-info > p')) q('.service-info > p').textContent = desc;
    if (q('.service-kicker span:first-child')) q('.service-kicker span:first-child').textContent = kicker;
    if (q('.service-bottom > span')) q('.service-bottom > span').textContent = tags;

    const photoLabel = q('.service-photo-label');
    if (photoLabel) {
      const labels = {
        en:'THE SERVICE EDIT',
        zh:'服务精选',
        my:'ဝန်ဆောင်မှုရွေးချယ်မှု'
      };
      photoLabel.textContent = labels[L()];
    }

    const meta = card.querySelectorAll('.service-meta span');
    if (meta[0]) meta[0].textContent = priceText(s);
    if (meta[1]) meta[1].textContent = durationText(s,true);

    const photoDuration = q('.service-photo small');
    if (photoDuration) photoDuration.textContent = durationText(s,true);
  }

  function renderModal() {
    const choose = document.getElementById('chooseServiceButton');
    const key = choose?.dataset.bookService;
    const s = key ? services()[key] : null;
    if (!s) return;

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = clean(v);
    };

    const p = profileFor(s,key);
    set('serviceModalNumber', s.number || '');
    set('serviceModalTitle', value(s,'title',value(s,'name','Beauty Service',key),key));
    set('serviceModalPrice', priceText(s));
    set('serviceModalDuration', durationText(s,true));
    set('serviceModalDurationText', durationText(s,false));
    set('serviceModalDescription', value(s,'description','',key));
    set('serviceModalKicker', value(s,'kicker','Service',key));
    set('serviceModalCaption', value(s,'caption','Made with care.',key));
    set('serviceIdealFor', value(s,'idealFor','Personalized care',key));

    const highlightData = (L() !== 'en' && Array.isArray(s?.[`highlights${L()==='zh'?'Zh':'My'}`]) && s[`highlights${L()==='zh'?'Zh':'My'}`].length)
      ? s[`highlights${L()==='zh'?'Zh':'My'}`]
      : (p?.highlights || s?.highlights || [
          ['Service','Tailored studio service'],
          [s.duration ? `${s.duration} min` : 'Flexible','Estimated appointment time'],
          ['Detail','Personalized finish']
        ]);

    const hi = document.getElementById('serviceHighlights');
    if (hi) {
      hi.innerHTML = highlightData.slice(0,3).map(row => {
        const a = Array.isArray(row) ? row : [row,'Studio detail'];
        const left = (a[0] && typeof a[0] === 'object') ? (a[0][L()] || a[0].en || '') : translatePhrase(a[0]);
        const right = (a[1] && typeof a[1] === 'object') ? (a[1][L()] || a[1].en || '') : translatePhrase(a[1]);
        return `<div><span>✦</span><strong>${esc(left)}</strong><small>${esc(right)}</small></div>`;
      }).join('');
    }

    const explicitPoints = L()==='zh' ? s?.pointsZh : L()==='my' ? s?.pointsMy : s?.points;
    const pointData = Array.isArray(explicitPoints) && explicitPoints.length ? explicitPoints : (p?.points || []);
    const ul = document.getElementById('servicePoints');
    if (ul) {
      ul.innerHTML = pointData.slice(0,4).map(item => {
        const v = item && typeof item === 'object' && !Array.isArray(item)
          ? (item[L()] || item.en || '')
          : translatePhrase(item);
        return `<li>${esc(v)}</li>`;
      }).join('');
    }

    const note = document.querySelector('#serviceModal .service-modal-note');
    if (note) {
      note.textContent = L()==='zh'
        ? '最终价格可能因长度、设计细节和附加项目而有所变化。'
        : L()==='my'
          ? 'နောက်ဆုံးစျေးနှုန်းက အရှည်၊ ဒီဇိုင်းအသေးစိတ်နဲ့ အပိုဝန်ဆောင်မှုအလိုက် ပြောင်းလဲနိုင်ပါတယ်။'
          : 'Final price may vary with length, design detail and add-ons.';
    }
  }

  function renderAll() {
    const list = services();
    document.querySelectorAll('.service-card[data-service]').forEach(card => {
      const s = list[card.dataset.service];
      if (s) renderCard(card,s);
    });

    document.querySelectorAll('[data-service-choice][data-service-key]').forEach(btn => {
      const s = list[btn.dataset.serviceKey];
      if (!s) return;
      const title = value(s,'title',value(s,'name','Beauty Service',btn.dataset.serviceKey),btn.dataset.serviceKey);
      btn.dataset.serviceChoice = title;
      const span = btn.querySelector('span');
      const small = btn.querySelector('small');
      if (span) span.textContent = title;
      if (small) small.textContent = `${priceText(s)} · ${durationText(s,false)}`;
    });

    renderModal();
  }

  let queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      renderAll();
    });
  }

  window.__beautyStudioRefreshServiceLanguageV90 = renderAll;
  window.addEventListener('beautyStudioLanguageChanged', queue);
  window.addEventListener('beautyStudioD1ContentReady', queue);
  document.addEventListener('click', e => {
    if (e.target.closest?.('.service-card,.service-trigger,[data-service-choice],#chooseServiceButton')) {
      setTimeout(queue, 30);
    }
  }, true);

  const grid = document.querySelector('.service-grid');
  if (grid) {
    const observer = new MutationObserver(mutations => {
      const structural = mutations.some(m => m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length));
      if (structural) queue();
    });
    observer.observe(grid,{childList:true,subtree:true});
  }

  [0,150,500,1200,2500,5000,8000].forEach(ms => setTimeout(queue,ms));
})();



/* v91 — accessibility + UI polish
   No visual redesign. This layer only improves keyboard/screen-reader behavior
   and keeps dynamic D1 UI announcements understandable.
*/
(() => {
  const mark = (el, attrs) => {
    if (!el) return;
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
  };

  mark(document.getElementById('customerNotifyFab'), {'aria-live':'polite'});
  mark(document.getElementById('supportFab'), {'aria-live':'polite'});

  const panel = document.getElementById('supportPanel');
  if (panel) mark(panel, {'role':'dialog','aria-modal':'true','aria-label':'Need Help'});

  const notices = document.getElementById('customerNotificationPanel');
  if (notices) mark(notices, {'role':'dialog','aria-modal':'true','aria-label':'Notifications'});

  // Make dynamically generated service/notification text announceable without
  // forcing focus or changing the visual layout.
  ['serviceModalTitle','serviceModalDescription','chosenServiceLabel'].forEach(id => {
    const el=document.getElementById(id);
    if(el) el.setAttribute('aria-live','polite');
  });

  // Keep the document language in sync with the existing language engine.
  window.addEventListener('beautyStudioLanguageChanged', e => {
    const lang=e?.detail?.lang;
    if(lang) document.documentElement.lang = lang==='zh'?'zh-CN':lang==='my'?'my':'en';
  });
})();


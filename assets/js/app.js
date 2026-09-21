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

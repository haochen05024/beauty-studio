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

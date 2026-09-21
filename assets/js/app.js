// Beauty Studio customer homepage.
// The page is intentionally dependency-free so it can be deployed directly
// to GitHub Pages or Cloudflare Pages and later connected to the Studio API.

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");

  const updateHeader = () => {
    if (!header) return;
    header.style.boxShadow = window.scrollY > 10
      ? "0 8px 30px rgba(40,30,25,.05)"
      : "none";
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
});

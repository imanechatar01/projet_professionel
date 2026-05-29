function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");

  if (menu) {
    menu.classList.toggle("open");
  }
}

function closeMobileMenu() {
  const menu = document.getElementById("mobile-menu");

  if (menu) {
    menu.classList.remove("open");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}

function openLightbox(el) {
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const source = el?.querySelector("img");

  if (!lightbox || !img || !source) return;

  img.src = source.src;
  img.alt = source.alt || "";
  lightbox.classList.add("open");
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");

  if (lightbox) {
    lightbox.classList.remove("open");
  }
}

function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop() || "web_site.html";
  const currentHash = window.location.hash;
  const navLinks = document.querySelectorAll(".nav-links a, .mobile-menu a");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");

    if (!href) return;

    link.classList.remove("active");
    link.classList.remove("nav-active");

    if (link.classList.contains("nav-cta")) return;

    const [linkPageRaw, linkHashRaw] = href.split("#");
    const linkPage = linkPageRaw || "web_site.html";
    const linkHash = linkHashRaw ? `#${linkHashRaw}` : "";

    if (linkHash) {
      if (currentPage === linkPage && currentHash === linkHash) {
        link.classList.add("active");
        link.classList.add("nav-active");
      }
      return;
    }

    if (href === currentPage || linkPage === currentPage) {
      link.classList.add("active");
      link.classList.add("nav-active");
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const scrollTopBtn = document.getElementById("scroll-top");

  if (scrollTopBtn) {
    window.addEventListener("scroll", function () {
      scrollTopBtn.classList.toggle("visible", window.scrollY > 400);
    });
  }

  setActiveNav();
});

window.addEventListener("hashchange", setActiveNav);
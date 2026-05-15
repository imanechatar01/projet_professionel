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

document.addEventListener("DOMContentLoaded", function () {
  const scrollTopBtn = document.getElementById("scroll-top");

  if (scrollTopBtn) {
    window.addEventListener("scroll", function () {
      scrollTopBtn.classList.toggle("visible", window.scrollY > 400);
    });
  }
});
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

function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop(); // ex: "messagerie.html"
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref && linkHref === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop();
    const links = document.querySelectorAll('.nav-links a');

    links.forEach(link => {
        const href = link.getAttribute('href');
        
        // Pour les pages normales (ex: web_site.html, catalogue.html, message.html)
        if (href && href !== '#' && !href.startsWith('#')) {
            if (href === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }
        
        // Pour Galerie et Contact (#galerie, #contact) : on ne met pas de classe active ici
        // car ils sont sur la même page (web_site.html)
        if (href === '#galerie' && currentPage === 'web_site.html') {
            // optionnel : détecter l'ancre dans l'URL
            if (window.location.hash === '#galerie') link.classList.add('active');
        }
        if (href === '#contact' && currentPage === 'web_site.html') {
            if (window.location.hash === '#contact') link.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', setActiveNav);
window.addEventListener('hashchange', setActiveNav);
document.addEventListener('DOMContentLoaded', setActiveNavLink);

  const contactForm = document.getElementById('contactForm');
  const contactSubmitBtn = document.getElementById('contactSubmitBtn');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nom = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!nom || !email || !message) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    contactSubmitBtn.disabled = true;
    contactSubmitBtn.textContent = 'Envoi en cours...';

    try {
      const response = await fetch('/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, message })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Message envoyé ! Je te répondrai rapidement.');
        contactForm.reset();
      } else {
        alert('❌ Erreur : ' + data.message);
      }
    } catch (error) {
      console.error('Erreur :', error);
      alert('❌ Erreur de connexion. Réessaie plus tard.');
    } finally {
      contactSubmitBtn.disabled = false;
      contactSubmitBtn.textContent = 'Envoyer le message';
    }
  });

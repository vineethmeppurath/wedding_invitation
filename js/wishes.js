const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzVUMyTbXuIc28aqYKMVllhQAkm288C3WIlwZIDJp4z6Ctx2KnVPl1m07N3Sm4KWEGuEA/exec";

$(document).ready(function() {
  const wishesList = document.getElementById('wishes-list');
  const wishesForm = document.getElementById('form-wishes');
  const submitBtn = wishesForm ? wishesForm.querySelector('input[type="submit"]') : null;
  const CACHE_KEY = "wedding_wishes_cache";

  // Helper function to render wishes array into DOM
  function renderWishes(wishes) {
    if (!wishesList) return;
    wishesList.innerHTML = '';
    if (wishes && wishes.length > 0) {
      wishes.forEach(wish => {
        const date = wish.date ? new Date(wish.date).toLocaleDateString() : '';
        const wishItem = document.createElement('div');
        wishItem.className = 'wish-item';
        wishItem.innerHTML = `
          <div class="wish-header">
            <strong>${escapeHTML(wish.name || '')}</strong>
            <span class="wish-date">${date}</span>
          </div>
          <div class="wish-message">${escapeHTML(wish.message || '')}</div>
        `;
        wishesList.appendChild(wishItem);
      });
    } else {
      wishesList.innerHTML = '<p class="text-white">Be the first to send a wish!</p>';
    }
  }

  // Fetch and display wishes
  function loadWishes() {
    if (WEB_APP_URL === "YOUR_GOOGLE_WEB_APP_URL_HERE") return;

    // 1. Instantly render from local cache if available
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          renderWishes(parsed);
        }
      } catch (e) {
        console.error('Error parsing cached wishes:', e);
      }
    } else {
      wishesList.innerHTML = '<p class="text-white">Loading wishes...</p>';
    }

    // 2. Fetch fresh data from backend
    fetch(WEB_APP_URL)
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          // Reverse data to show newest first
          const reversed = [...data].reverse();
          localStorage.setItem(CACHE_KEY, JSON.stringify(reversed));
          renderWishes(reversed);
        }
      })
      .catch(error => {
        console.error('Error fetching wishes:', error);
        if (!localStorage.getItem(CACHE_KEY)) {
          wishesList.innerHTML = '<p class="text-white">Unable to load wishes at the moment.</p>';
        }
      });
  }

  // Handle form submission
  if (wishesForm) {
    wishesForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (WEB_APP_URL === "YOUR_GOOGLE_WEB_APP_URL_HERE") {
        alert("Please replace 'YOUR_GOOGLE_WEB_APP_URL_HERE' with your actual Google Script URL in js/wishes.js.");
        return;
      }

      const formData = new FormData(wishesForm);
      const name = formData.get('name')?.toString().trim();
      const message = formData.get('message')?.toString().trim();

      if (!name || !message) {
        alert('Please enter both your name and message.');
        return;
      }

      const searchParams = new URLSearchParams(formData);
      const originalBtnValue = submitBtn.value;
      
      // Loading state
      submitBtn.value = "Sending...";
      submitBtn.disabled = true;

      // Optimistic UI update: render the new wish immediately
      const newWish = {
        name: name,
        message: message,
        date: new Date().toISOString()
      };

      let cached = [];
      try {
        cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
      } catch (e) {}
      cached.unshift(newWish);
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      renderWishes(cached);

      wishesForm.reset();

      fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: searchParams
      })
      .then(() => {
        submitBtn.value = "Wish Sent! ♥";
        setTimeout(() => {
          submitBtn.value = originalBtnValue;
          submitBtn.disabled = false;
        }, 2500);

        // Sync with server in background after short delay
        setTimeout(loadWishes, 3000);
      })
      .catch(error => {
        console.error('Error sending wish:', error);
        alert('An error occurred. Please try again.');
        submitBtn.value = originalBtnValue;
        submitBtn.disabled = false;
      });
    });
  }

  // Basic HTML escaping to prevent XSS
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
      }[tag])
    );
  }

  // Initial load
  loadWishes();
});


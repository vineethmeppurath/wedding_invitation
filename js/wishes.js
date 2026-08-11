const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz9T6H2-kjKSYHlAh1E02XoZXVy9gEa_gMxcRVceqNamTIgaeKvgMG8sXD0LMIsviIcvw/exec";

$(document).ready(function() {
  const wishesList = document.getElementById('wishes-list');
  const wishesForm = document.getElementById('form-wishes');
  const submitBtn = wishesForm ? wishesForm.querySelector('input[type="submit"]') : null;

  // Fetch and display wishes on load
  function loadWishes() {
    if (WEB_APP_URL === "YOUR_GOOGLE_WEB_APP_URL_HERE") return; // Don't fetch if placeholder
    
    fetch(WEB_APP_URL)
      .then(response => response.json())
      .then(data => {
        wishesList.innerHTML = ''; // Clear loading
        if (data && data.length > 0) {
          // Reverse data to show newest first
          data.reverse().forEach(wish => {
            const date = new Date(wish.date).toLocaleDateString();
            const wishItem = document.createElement('div');
            wishItem.className = 'wish-item';
            wishItem.innerHTML = `
              <div class="wish-header">
                <strong>${escapeHTML(wish.name)}</strong>
                <span class="wish-date">${date}</span>
              </div>
              <div class="wish-message">${escapeHTML(wish.message)}</div>
            `;
            wishesList.appendChild(wishItem);
          });
        } else {
          wishesList.innerHTML = '<p class="text-white">Be the first to send a wish!</p>';
        }
      })
      .catch(error => {
        console.error('Error fetching wishes:', error);
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
      const searchParams = new URLSearchParams(formData);
      const originalBtnValue = submitBtn.value;
      
      // Loading state
      submitBtn.value = "Sending...";
      submitBtn.disabled = true;

      fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: searchParams
      })
      .then(() => {
        // With 'no-cors' mode, we can't read the JSON response from Google,
        // so we assume it was successfully submitted.
        wishesForm.reset();
        wishesList.innerHTML = '<p class="text-white">Reloading wishes...</p>';
        
        // Add a slight delay before reloading to give Google Sheets time to save
        setTimeout(loadWishes, 1500);
      })
      .catch(error => {
        console.error('Error sending wish:', error);
        alert('An error occurred. Please try again.');
      })
      .finally(() => {
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

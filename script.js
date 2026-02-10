const R2_BASE = "https://photos.festivalshot.com";

function formatDate(iso) {
  const [year, month] = iso.split("-");
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

let photos = [];
let filtered = [];
let lightboxIndex = -1;
let currentIndex = 0;
let autoScrollTimer = null;

const gallery = document.getElementById("gallery");
const search = document.getElementById("search");
const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox.querySelector(".lightbox-img");
const lightboxCaption = lightbox.querySelector(".lightbox-caption");

// Load and render
fetch("photos.json")
  .then((res) => res.json())
  .then((data) => {
    photos = data;
    filtered = photos;
    render(filtered);
    startAutoScroll();
  });

function render(items) {
  gallery.innerHTML = "";
  currentIndex = 0;
  items.forEach((photo, i) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    img.src = `${R2_BASE}/${photo.file}`;
    img.alt = `${photo.artist} at ${photo.location}`;
    img.loading = "lazy";
    img.onload = () => figure.classList.add("loaded");

    const caption = document.createElement("figcaption");
    caption.innerHTML =
      `<span class="artist">${photo.artist}</span><br>` +
      `<span class="location">${photo.location}</span>` +
      (photo.date ? `<br><span class="date">${formatDate(photo.date)}</span>` : "");

    figure.appendChild(img);
    figure.appendChild(caption);
    figure.addEventListener("click", () => openLightbox(i));
    gallery.appendChild(figure);
  });
}

// Auto-scroll every 5 seconds, wrapping around
function startAutoScroll() {
  stopAutoScroll();
  autoScrollTimer = setInterval(() => {
    if (lightbox.hidden && filtered.length > 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, 5000);
}

function stopAutoScroll() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }
}

function scrollToIndex(index) {
  const figures = gallery.querySelectorAll("figure");
  if (figures.length === 0) return;
  currentIndex = index % figures.length;
  figures[currentIndex].scrollIntoView({ behavior: "smooth" });
}

// Track current index from manual scrolling
let scrollTimeout = null;
gallery.addEventListener("scroll", () => {
  // Reset auto-scroll timer on manual interaction
  startAutoScroll();

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    const figures = gallery.querySelectorAll("figure");
    const galleryRect = gallery.getBoundingClientRect();
    for (let i = 0; i < figures.length; i++) {
      const rect = figures[i].getBoundingClientRect();
      if (Math.abs(rect.top - galleryRect.top) < 10) {
        currentIndex = i;
        break;
      }
    }
  }, 100);
}, { passive: true });

// Infinite scroll — when reaching the end, jump back to start
gallery.addEventListener("scrollend", () => {
  const figures = gallery.querySelectorAll("figure");
  if (figures.length === 0) return;
  const last = figures[figures.length - 1];
  const galleryRect = gallery.getBoundingClientRect();
  const lastRect = last.getBoundingClientRect();
  if (Math.abs(lastRect.top - galleryRect.top) < 10) {
    // At the last photo — wrap to first on next advance
    currentIndex = figures.length - 1;
  }
});

// Search / filter
search.addEventListener("input", () => {
  const q = search.value.toLowerCase().trim();
  filtered = q
    ? photos.filter((p) => p.artist.toLowerCase().includes(q))
    : photos;
  render(filtered);
  startAutoScroll();
});

// Lightbox
function openLightbox(index) {
  lightboxIndex = index;
  showLightboxPhoto();
  lightbox.hidden = false;
  stopAutoScroll();
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxIndex = -1;
  startAutoScroll();
}

function showLightboxPhoto() {
  const photo = filtered[lightboxIndex];
  lightboxImg.src = `${R2_BASE}/${photo.file}`;
  lightboxImg.alt = `${photo.artist} at ${photo.location}`;
  const parts = [photo.artist, photo.location];
  if (photo.date) parts.push(formatDate(photo.date));
  lightboxCaption.textContent = parts.join(" — ");
}

// Lightbox wraps around too
function prevPhoto() {
  lightboxIndex = (lightboxIndex - 1 + filtered.length) % filtered.length;
  showLightboxPhoto();
}

function nextPhoto() {
  lightboxIndex = (lightboxIndex + 1) % filtered.length;
  showLightboxPhoto();
}

lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.querySelector(".lightbox-prev").addEventListener("click", prevPhoto);
lightbox.querySelector(".lightbox-next").addEventListener("click", nextPhoto);

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") prevPhoto();
  if (e.key === "ArrowRight") nextPhoto();
});

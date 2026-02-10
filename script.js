const R2_BASE = "https://photos.festivalshot.com";

function formatDate(iso) {
  const [year, month] = iso.split("-");
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

let photos = [];
let filtered = [];
let lightboxIndex = -1;

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
  });

function render(items) {
  gallery.innerHTML = "";
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

// Search / filter
search.addEventListener("input", () => {
  const q = search.value.toLowerCase().trim();
  filtered = q
    ? photos.filter((p) => p.artist.toLowerCase().includes(q))
    : photos;
  render(filtered);
});

// Lightbox
function openLightbox(index) {
  lightboxIndex = index;
  showLightboxPhoto();
  lightbox.hidden = false;
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxIndex = -1;
}

function showLightboxPhoto() {
  const photo = filtered[lightboxIndex];
  lightboxImg.src = `${R2_BASE}/${photo.file}`;
  lightboxImg.alt = `${photo.artist} at ${photo.location}`;
  const parts = [photo.artist, photo.location];
  if (photo.date) parts.push(formatDate(photo.date));
  lightboxCaption.textContent = parts.join(" — ");
}

function prevPhoto() {
  if (lightboxIndex > 0) {
    lightboxIndex--;
    showLightboxPhoto();
  }
}

function nextPhoto() {
  if (lightboxIndex < filtered.length - 1) {
    lightboxIndex++;
    showLightboxPhoto();
  }
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


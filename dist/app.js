(() => {
  'use strict';
  const data = JSON.parse(document.querySelector('#site-data').textContent);
  const photos = data.photos;
  const photoDialog = document.querySelector('#photo-dialog');
  const archiveDialog = document.querySelector('#archive-dialog');
  const galleryDialog = document.querySelector('#full-gallery-dialog');
  const dialogs = [photoDialog, archiveDialog, galleryDialog];
  const lightboxImage = document.querySelector('#lightbox-image');
  const lightboxCaption = document.querySelector('#lightbox-caption');
  const photoCounter = document.querySelector('#photo-counter');
  let activePhotos = photos;
  let activeCollection = 'all';
  let photoIndex = 0;
  function setPhoto(index) {
    photoIndex = (index + activePhotos.length) % activePhotos.length;
    const photo = activePhotos[photoIndex];
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;
    lightboxCaption.textContent = photo.caption;
    photoCounter.textContent = `${photoIndex + 1} / ${activePhotos.length}`;
  }
  function show(dialog) {
    dialog.showModal();
    document.body.classList.add('modal-open');
    scheduleRotation();
    scheduleStrip();
  }
  document.querySelectorAll('[data-photo]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      const card = button.closest('.carousel-card');
      if (card && card.dataset.position !== 'front') event.preventDefault();
    });
    button.addEventListener('click', () => {
      const card = button.closest('.carousel-card');
      if (card && card.dataset.position !== 'front') {
        changeFeaturedPhoto(Number(card.dataset.featuredIndex), true);
        button.focus({preventScroll: true});
        return;
      }
      activePhotos = card ? featuredPhotos : (button.closest('#full-gallery-dialog') && activeCollection !== 'all' ? photos.filter(photo => photo.collection === activeCollection) : photos);
      const index = activePhotos.findIndex(photo => photo.id === button.dataset.photo);
      if (index < 0) return;
      setPhoto(index);
      show(photoDialog);
    });
  });
  document.querySelector('#previous-photo').addEventListener('click', () => setPhoto(photoIndex - 1));
  document.querySelector('#next-photo').addEventListener('click', () => setPhoto(photoIndex + 1));
  photoDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); setPhoto(photoIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); setPhoto(photoIndex + 1); }
  });
  let touchStart = null;
  lightboxImage.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, {passive: true});
  lightboxImage.addEventListener('touchend', event => {
    if (touchStart === null) return;
    const diff = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 60) setPhoto(photoIndex + (diff < 0 ? 1 : -1));
    touchStart = null;
  }, {passive: true});
  document.querySelector('#open-archive').addEventListener('click', () => show(archiveDialog));
  function filterGallery(id) {
    const selected = data.collections.find(item => item.id === id);
    activeCollection = selected ? selected.id : 'all';
    document.querySelector('#full-gallery-heading').textContent = selected ? selected.title : 'Our photo album.';
    document.querySelector('.full-gallery-intro').textContent = selected ? selected.description : 'Small moments with Lux & Leo, collected along the way.';
    document.querySelectorAll('.gallery-photo').forEach(figure => { figure.hidden = activeCollection !== 'all' && figure.dataset.collection !== activeCollection; });
    document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeCollection)));
    const count = photos.filter(photo => activeCollection === 'all' || photo.collection === activeCollection).length;
    document.querySelector('#gallery-count').textContent = `${count} photographs to linger over.`;
    galleryDialog.scrollTop = 0;
  }
  function openGallery(id = 'all') {
    filterGallery(id);
    show(galleryDialog);
  }
  document.querySelector('#open-gallery').addEventListener('click', () => openGallery());
  document.querySelectorAll('[data-open-collection]').forEach(button => button.addEventListener('click', () => openGallery(button.dataset.openCollection)));
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => filterGallery(button.dataset.filter)));
  document.querySelector('.photo-close').addEventListener('click', () => photoDialog.close());
  document.querySelector('.archive-close').addEventListener('click', () => archiveDialog.close());
  document.querySelector('.gallery-close').addEventListener('click', () => galleryDialog.close());
  dialogs.forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (!dialogs.some(item => item.open)) document.body.classList.remove('modal-open');
      scheduleRotation();
      scheduleStrip();
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });

  // Featured photos are a selection; the full album always contains every photo.
  const collection = document.querySelector('#gallery');
  const featuredPhotos = data.featuredPhotoIds.map(id => photos.find(photo => photo.id === id));
  const featuredCards = [...document.querySelectorAll('.carousel-card')];
  const featuredCounter = document.querySelector('#carousel-counter');
  const rotationToggle = document.querySelector('#carousel-toggle');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let featuredIndex = 0;
  let rotationEnabled = !motionPreference.matches;
  let rotationTimer;
  let collectionVisible = true;
  let pointerOverCollection = false;
  function scheduleRotation() {
    clearTimeout(rotationTimer);
    const focused = collection.contains(document.activeElement) && document.activeElement !== rotationToggle;
    if (!rotationEnabled || featuredPhotos.length < 2 || !collectionVisible || document.hidden || focused || pointerOverCollection || dialogs.some(dialog => dialog.open)) return;
    rotationTimer = setTimeout(() => changeFeaturedPhoto(featuredIndex + 1), 6000);
  }
  function changeFeaturedPhoto(index, manual = false) {
    featuredIndex = (index + featuredPhotos.length) % featuredPhotos.length;
    const photo = featuredPhotos[featuredIndex];
    featuredCards.forEach((card, i) => {
      let offset = (i - featuredIndex + featuredPhotos.length) % featuredPhotos.length;
      if (offset > Math.floor(featuredPhotos.length / 2)) offset -= featuredPhotos.length;
      card.dataset.position = offset === 0 ? 'front' : offset === 1 ? 'right' : offset === -1 ? 'left' : offset > 1 ? 'back-right' : 'back-left';
      card.setAttribute('aria-hidden', String(offset !== 0));
      card.querySelector('button').tabIndex = offset === 0 ? 0 : -1;
    });
    featuredCounter.textContent = `${featuredIndex + 1} / ${featuredPhotos.length}`;
    if (manual) document.querySelector('#carousel-status').textContent = `Photo ${featuredIndex + 1} of ${featuredPhotos.length}. ${photo.caption}`;
    scheduleRotation();
  }
  function updateRotationToggle() {
    rotationToggle.textContent = rotationEnabled ? 'Pause' : 'Play';
    rotationToggle.setAttribute('aria-label', rotationEnabled ? 'Pause slideshow' : 'Play slideshow');
    scheduleRotation();
  }
  document.querySelector('#carousel-previous').addEventListener('click', () => changeFeaturedPhoto(featuredIndex - 1, true));
  document.querySelector('#carousel-next').addEventListener('click', () => changeFeaturedPhoto(featuredIndex + 1, true));
  rotationToggle.addEventListener('click', () => {
    rotationEnabled = !rotationEnabled;
    updateRotationToggle();
  });
  collection.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') { pointerOverCollection = true; scheduleRotation(); }
  });
  collection.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') { pointerOverCollection = false; scheduleRotation(); }
  });
  collection.addEventListener('focusin', scheduleRotation);
  collection.addEventListener('focusout', () => queueMicrotask(scheduleRotation));
  document.addEventListener('visibilitychange', scheduleRotation);
  motionPreference.addEventListener('change', event => {
    if (event.matches) rotationEnabled = false;
    updateRotationToggle();
  });
  if ('IntersectionObserver' in window) {
    const collectionObserver = new IntersectionObserver(entries => {
      collectionVisible = entries[0].isIntersecting;
      scheduleRotation();
    }, {threshold: .05});
    collectionObserver.observe(collection);
  }
  updateRotationToggle();

  // A slow, seamless filmstrip; visitors can pause it at any time.
  const strip = document.querySelector('.memory-strip');
  const stripToggle = document.querySelector('#memory-strip-toggle');
  const stripViewport = document.querySelector('.memory-strip-viewport');
  let stripEnabled = !motionPreference.matches;
  let stripMotionOptIn = false;
  let stripVisible = true;
  function scheduleStrip() {
    const paused = !stripEnabled || !stripVisible || document.hidden || dialogs.some(dialog => dialog.open);
    strip.classList.toggle('is-paused', paused);
    strip.classList.toggle('is-manual', motionPreference.matches && !stripMotionOptIn);
    strip.classList.toggle('motion-opt-in', stripMotionOptIn);
    stripToggle.textContent = stripEnabled ? 'Pause Ⅱ' : 'Play ▷';
    stripToggle.setAttribute('aria-label', stripEnabled ? 'Pause scrolling photos' : 'Play scrolling photos');
    stripToggle.setAttribute('aria-pressed', String(!stripEnabled));
  }
  function toggleStrip() {
    stripEnabled = !stripEnabled;
    if (stripEnabled && motionPreference.matches) stripMotionOptIn = true;
    scheduleStrip();
  }
  stripToggle.addEventListener('click', toggleStrip);
  stripViewport.addEventListener('pointerdown', () => { stripEnabled = false; scheduleStrip(); });
  stripViewport.addEventListener('keydown', event => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); toggleStrip(); }
  });
  stripViewport.addEventListener('focus', () => { stripEnabled = false; scheduleStrip(); });
  motionPreference.addEventListener('change', event => { if (event.matches) { stripEnabled = false; stripMotionOptIn = false; } scheduleStrip(); });
  document.addEventListener('visibilitychange', scheduleStrip);
  if ('IntersectionObserver' in window) {
    const stripObserver = new IntersectionObserver(entries => { stripVisible = entries[0].isIntersecting; scheduleStrip(); }, {threshold:.01});
    stripObserver.observe(strip);
  }
  scheduleStrip();
  let statusTimeout;
  function announce(message) {
    const status = document.querySelector('#status-message');
    status.textContent = message;
    status.classList.add('visible');
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => status.classList.remove('visible'), 4000);
  }
  document.querySelectorAll('[data-code]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.code);
        announce(`Copied ${button.dataset.code}`);
      } catch {
        announce(`Your code is ${button.dataset.code}. Select the code to copy it.`);
      }
    });
  });
  const navLinks = [...document.querySelectorAll('nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin: '-15% 0px -55% 0px', threshold: 0});
    document.querySelectorAll('#diary, #gallery, #links').forEach(section => observer.observe(section));
  }
})();

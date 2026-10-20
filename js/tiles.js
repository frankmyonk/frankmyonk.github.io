// Live test: only Circle gets the tabletop object for now.
const artByProject = { circle: 'circle' };

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touchDevice = matchMedia('(hover: none), (pointer: coarse)').matches;
const cards = document.querySelectorAll('#grid .card');

cards.forEach((card) => {
  const projectId = card.getAttribute('href')?.split('/').pop();
  const artId = artByProject[projectId];
  const frame = card.querySelector('.card-img');
  const fallback = frame?.querySelector('img');
  if (!frame || !fallback) return;

  if (!artId || card.querySelector('.badge')) return;
  frame.classList.add('tile-frame');
  frame.style.background = 'transparent';

  const scene = document.createElement('span');
  scene.className = 'tile-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.style.backgroundColor = 'transparent';
  scene.innerHTML = `<span class="tile-shadow-layer"><img src="img/tile/${artId}-shadow.png" alt=""></span><span class="tile-object-layer"><img src="img/tile/${artId}-obj.webp" alt=""></span>`;
  const objectImage = scene.querySelector('.tile-object-layer img');
  objectImage.addEventListener('error', () => {
    scene.remove();
    frame.classList.remove('tile-frame', 'tile-layered');
    frame.style.background = '';
  }, { once: true });
  frame.append(scene);
  frame.classList.add('tile-layered');

  if (!reduceMotion && touchDevice && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          card.classList.add('tile-visible');
          observer.unobserve(card);
        }
      });
    }, { threshold: 0.18 });
    observer.observe(card);
  } else {
    card.classList.add('tile-visible');
  }

  if (!reduceMotion && !touchDevice) {
    frame.addEventListener('pointermove', (event) => {
      const rect = frame.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      scene.style.setProperty('--dx', `${nx * 5}px`);
      scene.style.setProperty('--dy', `${ny * 4}px`);
      scene.style.setProperty('--rx', `${-ny * 1.5}deg`);
      scene.style.setProperty('--ry', `${nx * 1.8}deg`);
    });
    frame.addEventListener('pointerleave', () => {
      scene.style.setProperty('--dx', '0px');
      scene.style.setProperty('--dy', '0px');
      scene.style.setProperty('--rx', '0deg');
      scene.style.setProperty('--ry', '0deg');
    });
  }
});

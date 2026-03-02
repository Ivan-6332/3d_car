/**
 * NavDrive — Ceylon Route  |  script.js
 * Minimal, clean JS for cinematic car navigation UI
 */

'use strict';

/* ── Destination data ──────────────────────────────────────── */
const DESTINATIONS = {
  kandy: {
    name:        'Kandy',
    tag:         'Hill Country · 115 km · ~3 hrs',
    routeLabel:  'Kandy',
    dist:        '115 km',
    dur:         '~3 hrs',
    desc:        'A scenic city nestled in the heart of Sri Lanka\'s hill country, Kandy is home to the sacred Temple of the Tooth Relic and surrounded by lush tea plantations and misty mountain ranges that stretch endlessly to the horizon.',
    highlights:  ['Temple of the Tooth', 'Kandy Lake', 'Tea Country'],
    routeInfo:   'From Colombo · 115 km · ~3 hrs',
    imgLabel:    'KANDY — HILL CAPITAL',
  },
  galle: {
    name:        'Galle',
    tag:         'Southern Coast · 120 km · ~2.5 hrs',
    routeLabel:  'Galle',
    dist:        '120 km',
    dur:         '~2.5 hrs',
    desc:        'A UNESCO World Heritage Site on the southern tip of Sri Lanka, Galle Fort is a living testament to colonial Dutch architecture, cobblestone streets, and breathtaking Indian Ocean vistas stretching to the horizon.',
    highlights:  ['Galle Fort', 'Lighthouse', 'Dutch Architecture'],
    routeInfo:   'From Colombo · 120 km · ~2.5 hrs',
    imgLabel:    'GALLE — FORT CITY',
  },
  ella: {
    name:        'Ella',
    tag:         'Uva Province · 220 km · ~5 hrs',
    routeLabel:  'Ella',
    dist:        '220 km',
    dur:         '~5 hrs',
    desc:        'Perched high in the mountains of Uva Province, Ella is a dreamy highland town famous for the iconic Nine Arch Bridge, rolling tea estates, and dramatic viewpoints that look out over deep jungle valleys and sharp peaks.',
    highlights:  ['Nine Arch Bridge', 'Little Adam\'s Peak', 'Tea Estates'],
    routeInfo:   'From Colombo · 220 km · ~5 hrs',
    imgLabel:    'ELLA — MOUNTAIN TOWN',
  },
  trinco: {
    name:        'Trincomalee',
    tag:         'East Coast · 260 km · ~6 hrs',
    routeLabel:  'Trincomalee',
    dist:        '260 km',
    dur:         '~6 hrs',
    desc:        'Trincomalee boasts one of the world\'s finest natural harbours and some of the clearest, turquoise waters in South Asia. The city fuses ancient Hindu temples, colonial forts, and pristine coral-reef beaches in one remarkable destination.',
    highlights:  ['Marble Beach', 'Fort Frederick', 'Koneswaram Temple'],
    routeInfo:   'From Colombo · 260 km · ~6 hrs',
    imgLabel:    'TRINCOMALEE — EAST COAST',
  },
  jaffna: {
    name:        'Jaffna',
    tag:         'Northern Province · 395 km · ~8 hrs',
    routeLabel:  'Jaffna',
    dist:        '395 km',
    dur:         '~8 hrs',
    desc:        'Sri Lanka\'s vibrant northern capital offers a window into the island\'s rich Tamil heritage. From the towering walls of Jaffna Fort to the sacred Nallur Kandaswamy Temple and the serene Jaffna Lagoon, the city captivates every visitor.',
    highlights:  ['Jaffna Fort', 'Nallur Temple', 'Jaffna Lagoon'],
    routeInfo:   'From Colombo · 395 km · ~8 hrs',
    imgLabel:    'JAFFNA — NORTHERN CITY',
  },
  sigiriya: {
    name:        'Sigiriya',
    tag:         'Cultural Triangle · 172 km · ~4 hrs',
    routeLabel:  'Sigiriya',
    dist:        '172 km',
    dur:         '~4 hrs',
    desc:        'Rising 200 metres above the surrounding jungle, Sigiriya Rock Fortress is Sri Lanka\'s most iconic landmark. Once a royal palace complex, it is adorned with brilliant frescoes, terraced gardens, and panoramic views of the ancient Cultural Triangle.',
    highlights:  ['Rock Fortress', 'Frescoes', 'Lion\'s Gate'],
    routeInfo:   'From Colombo · 172 km · ~4 hrs',
    imgLabel:    'SIGIRIYA — ROCK FORTRESS',
  },
};

/* ── Theme toggle ──────────────────────────────────────────── */
(function () {
  const root        = document.documentElement;
  const STORAGE_KEY = 'navdrive-theme';

  // Apply saved preference immediately (before paint)
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light') root.setAttribute('data-theme', 'light');

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isLight = root.getAttribute('data-theme') === 'light';
      if (isLight) {
        root.removeAttribute('data-theme');
        localStorage.setItem(STORAGE_KEY, 'dark');
      } else {
        root.setAttribute('data-theme', 'light');
        localStorage.setItem(STORAGE_KEY, 'light');
      }
    });
  });
}());

/* ── DOM references ────────────────────────────────────────── */
const appShell          = document.querySelector('.app-shell');
const scene             = document.getElementById('scene');
const destinationSelect = document.getElementById('destinationSelect');
const startBtn          = document.getElementById('startBtn');
const detailsToggleBtn  = document.getElementById('detailsToggleBtn');
const detailsPanel      = document.getElementById('detailsPanel');
const closePanel        = document.getElementById('closePanel');
const panelHandle       = document.getElementById('panelHandle');

// Drive overlay
const driveOverlay = document.getElementById('driveOverlay');
const exitDriveBtn = document.getElementById('exitDriveBtn');
const hudDest      = document.getElementById('hudDest');
const hudDist      = document.getElementById('hudDist');

// Stats
const statDist = document.getElementById('statDist');
const statDur  = document.getElementById('statDur');

// Map
const routeTo   = document.getElementById('routeTo');
const mapPlaceholder = document.getElementById('mapPlaceholder');

// Details panel content
const locationName      = document.getElementById('locationName');
const locationTag       = document.getElementById('locationTag');
const locationImgLabel  = document.getElementById('locationImgLabel');
const locationDesc      = document.getElementById('locationDesc');
const locationHighlights = document.getElementById('locationHighlights');
const detailsRouteInfo  = document.getElementById('detailsRouteInfo');

/* ── State ─────────────────────────────────────────────────── */
let selectedKey    = '';
let journeyStarted = false;
let panelOpen      = false;

/* ── Helpers ───────────────────────────────────────────────── */
function setAttr(el, attr, val) {
  if (el) el.setAttribute(attr, val);
}

function setText(el, text) {
  if (el) el.textContent = text;
}

/* ── Destination select handler ────────────────────────────── */
destinationSelect.addEventListener('change', () => {
  selectedKey = destinationSelect.value;

  if (!selectedKey) {
    // Reset
    setText(statDist, '--');
    setText(statDur,  '--');
    setText(routeTo, '—');
    startBtn.disabled         = true;
    detailsToggleBtn.disabled = true;
    journeyStarted = false;
    scene.classList.remove('journey-started');

    if (panelOpen) closeDetailsPanel();
    return;
  }

  const dest = DESTINATIONS[selectedKey];

  // Update route stats
  setText(statDist, dest.dist);
  setText(statDur,  dest.dur);
  setText(routeTo, dest.routeLabel);

  // Highlight active stats
  document.querySelectorAll('.stat-item').forEach(el => {
    el.dataset.active = selectedKey ? 'true' : 'false';
  });

  // Enable start button
  startBtn.disabled = false;

  // Populate details panel
  populatePanel(dest);

  // If journey already started, keep state and re-show details toggle
  if (journeyStarted) {
    detailsToggleBtn.disabled = false;
  }
});

/* ── Start Journey button ──────────────────────────────────── */
startBtn.addEventListener('click', () => {
  if (!selectedKey) return;

  journeyStarted = true;
  const dest = DESTINATIONS[selectedKey];

  // Mark scene state
  scene.classList.add('journey-started');

  // ── Enter driving mode: collapse all UI, expand car full screen
  appShell.classList.add('driving-mode');

  // Show drive overlay after panels finish fading (CSS transition ~480ms)
  setTimeout(() => {
    driveOverlay.classList.add('is-visible');
    setAttr(driveOverlay, 'aria-hidden', 'false');
    setText(hudDest, dest.name);
    setText(hudDist, dest.dist);

    // Flash "Let's Go" splash text briefly
    const splash = document.getElementById('letsGoSplash');
    if (splash) {
      gsap.timeline()
        .set(splash, { opacity: 0, scale: 0.82 })
        .to(splash, { opacity: 1, scale: 1,    duration: 0.45, ease: 'back.out(1.6)' })
        .to(splash, { opacity: 0, scale: 1.08, duration: 0.55, ease: 'power2.in', delay: 1.0 });
    }
  }, 480);

  // Disable button while driving
  startBtn.disabled = true;
  setText(startBtn.querySelector('.start-btn__text'), 'En Route…');
  detailsToggleBtn.disabled = true;

  // Dispatch to Three.js module — decoupled via custom event
  window.dispatchEvent(new CustomEvent('navdrive:journey-start', {
    detail: { key: selectedKey },
  }));
});

/* ── Exit driving mode ─────────────────────────────────────── */
function exitDrivingMode() {
  window.dispatchEvent(new CustomEvent('navdrive:journey-exit'));
  driveOverlay.classList.remove('is-visible');
  setAttr(driveOverlay, 'aria-hidden', 'true');
  setTimeout(() => {
    appShell.classList.remove('driving-mode');
    scene.classList.remove('journey-started');
    journeyStarted = false;
    startBtn.disabled = false;
    setText(startBtn.querySelector('.start-btn__text'), 'Start Journey');
    detailsToggleBtn.disabled = true;
    if (panelOpen) closeDetailsPanel();
  }, 300);
}
exitDriveBtn.addEventListener('click', exitDrivingMode);

/* ── Journey arrived (fired by three-scene.js on car arrival) ── */
window.addEventListener('navdrive:journey-arrived', () => {
  // Re-enable controls
  startBtn.disabled = false;
  setText(startBtn.querySelector('.start-btn__text'), 'Start Journey');
  detailsToggleBtn.disabled = false;
  setAttr(detailsToggleBtn, 'aria-expanded', 'false');

  // Open destination spotlight panel after a cinematic pause
  setTimeout(() => {
    openDetailsPanel();
  }, 1200);
});

/* ── Details toggle button ─────────────────────────────────── */
detailsToggleBtn.addEventListener('click', () => {
  toggleDetailsPanel();
});

/* ── Panel handle click ────────────────────────────────────── */
panelHandle.addEventListener('click', () => {
  toggleDetailsPanel();
});
panelHandle.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleDetailsPanel();
  }
});

/* ── Close panel button ────────────────────────────────────── */
closePanel.addEventListener('click', () => {
  closeDetailsPanel();
});

/* ── Close panel on Escape key ─────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && panelOpen) {
    closeDetailsPanel();
  }
});

/* ── Panel open / close / toggle ───────────────────────────── */
function openDetailsPanel() {
  panelOpen = true;
  detailsPanel.classList.add('is-open');
  setAttr(detailsPanel, 'aria-hidden', 'false');
  setAttr(detailsToggleBtn, 'aria-expanded', 'true');
  setText(detailsToggleBtn, 'Hide Details');
}

function closeDetailsPanel() {
  panelOpen = false;
  detailsPanel.classList.remove('is-open');
  setAttr(detailsPanel, 'aria-hidden', 'true');
  setAttr(detailsToggleBtn, 'aria-expanded', 'false');
  setText(detailsToggleBtn, 'View Details');
}

function toggleDetailsPanel() {
  if (panelOpen) {
    closeDetailsPanel();
  } else {
    openDetailsPanel();
  }
}

/* ── Populate details panel with destination data ───────────── */
function populatePanel(dest) {
  setText(locationName,     dest.name);
  setText(locationTag,      dest.tag);
  setText(locationImgLabel, dest.imgLabel);
  setText(locationDesc,     dest.desc);
  setText(detailsRouteInfo, dest.routeInfo);

  // Rebuild highlight tags
  locationHighlights.innerHTML = '';
  dest.highlights.forEach(h => {
    const tag = document.createElement('span');
    tag.className = 'highlight-tag';
    tag.textContent = h;
    locationHighlights.appendChild(tag);
  });
}

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
  populatePanel(dest, selectedKey);

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
function populatePanel(dest, key) {
  setText(locationName,     dest.name);
  setText(locationTag,      dest.tag);
  setText(locationImgLabel, '');
  setText(locationDesc,     dest.desc);
  setText(detailsRouteInfo, dest.routeInfo);

  // Set real hero image when available
  const locationImg = document.getElementById('locationImg');
  const exploreKey = key || selectedKey;
  if (locationImg && exploreKey && EXPLORE_DATA[exploreKey]) {
    locationImg.src = EXPLORE_DATA[exploreKey].heroImg;
    locationImg.alt = dest.name;
    locationImg.style.display = 'block';
  } else if (locationImg) {
    locationImg.style.display = 'none';
    setText(locationImgLabel, dest.imgLabel);
  }

  // Rebuild highlight tags
  locationHighlights.innerHTML = '';
  dest.highlights.forEach(h => {
    const tag = document.createElement('span');
    tag.className = 'highlight-tag';
    tag.textContent = h;
    locationHighlights.appendChild(tag);
  });
}

/* ══════════════════════════════════════════════════════════════
   EXPLORE MORE — Destination guide data + logic
══════════════════════════════════════════════════════════════ */

/* ── Explore data ────────────────────────────────────────────── */
const EXPLORE_DATA = {
  kandy: {
    heroImg:  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600&q=80&fit=crop&auto=format',
    tagline:  'Sacred Hill Capital · Cultural Heart of Sri Lanka',
    places: [
      { name: 'Temple of the Sacred Tooth Relic', meta: 'UNESCO-listed Buddhist shrine in the royal palace complex', img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80&fit=crop', tags: ['Heritage','Must-Visit'], badge: 'rated', rating: '4.9' },
      { name: 'Kandy Lake',                        meta: 'Serene artificial lake built by the last king of Kandy', img: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=600&q=80&fit=crop', tags: ['Scenic','Walking'], badge: 'free', rating: '4.7' },
      { name: 'Peradeniya Botanical Gardens',      meta: 'Royal gardens with over 4,000 plant species on 147 acres', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80&fit=crop', tags: ['Nature','Gardens'], badge: 'rated', rating: '4.8' },
      { name: 'Bahiravakanda Buddha Statue',       meta: '26-metre white Buddha statue with panoramic city views', img: 'https://images.unsplash.com/photo-1591379280396-2f3fa3ea1067?w=600&q=80&fit=crop', tags: ['Spiritual','ViewPoint'], badge: 'free', rating: '4.6' },
    ],
    dining: [
      { name: "Queens Hotel",       meta: 'Colonial-era grand hotel restaurant — elegant & historic', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&fit=crop', tags: ['Fine Dining','Colonial'], rating: '4.5' },
      { name: 'The Pub',            meta: 'Classic Kandy bar-restaurant with local and Western fare', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80&fit=crop', tags: ['Bar','Mixed Menu'], rating: '4.3' },
      { name: 'Devon Restaurant',   meta: 'Local favourite for hearty Sri Lankan rice-and-curry meals', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop', tags: ['Local Cuisine','Budget-Friendly'], rating: '4.4' },
      { name: 'Kandy Museum Café',  meta: 'Tranquil courtyard café perfect for light bites & tea', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&fit=crop', tags: ['Café','Tea'], rating: '4.2' },
    ],
    shopping: [
      { name: 'Kandyan Arts Association', meta: 'Traditional Kandyan crafts — lacquerwork, brassware & batik', img: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80&fit=crop', tags: ['Handicrafts','Souvenirs'] },
      { name: 'Selyn Handlooms',          meta: 'Fair-trade textiles and woven fabrics made by local artisans', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80&fit=crop', tags: ['Textiles','Ethical'] },
      { name: 'Kandy City Centre Mall',   meta: 'Modern shopping mall with local & international brands', img: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80&fit=crop', tags: ['Mall','Fashion'] },
      { name: 'Olde Market',              meta: 'Vibrant covered spice & vegetable market since 1810', img: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80&fit=crop', tags: ['Spices','Local Market'] },
    ],
    hotels: [
      { name: "Earl's Regency Hotel",   meta: '5-star hillside resort with infinity pool & jungle views', img: 'https://images.unsplash.com/photo-1551882547-ff40c4a49d23?w=600&q=80&fit=crop', tags: ['5-Star','Resort','Pool'], badge: 'luxury', rating: '4.8' },
      { name: 'Theva Residency',        meta: 'Boutique hilltop villa overlooking the Knuckles mountain range', img: 'https://images.unsplash.com/photo-1566073771259-92f5f5fe1735?w=600&q=80&fit=crop', tags: ['Boutique','Views'], badge: 'luxury', rating: '4.7' },
      { name: 'Cinnamon Citadel',       meta: 'Riverside 4-star hotel merged with lush tropical gardens', img: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80&fit=crop', tags: ['4-Star','Riverside'], rating: '4.5' },
      { name: 'Hotel Suisse',           meta: 'British colonial heritage hotel near the lake since 1884', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80&fit=crop', tags: ['Heritage','Lake View'], rating: '4.3' },
    ],
    parking: [
      { name: 'KCC Mall Parking',       meta: 'Multi-storey covered parking · Rs 60/hr · 500+ bays', img: 'https://images.unsplash.com/photo-1506521781966-b9b61dc7069e?w=600&q=80&fit=crop', tags: ['Covered','24/7','CCTV'], badge: 'open24' },
      { name: 'Lake Drive Car Park',    meta: 'Open-air lakeside parking · Rs 40/hr · 200 bays', img: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&q=80&fit=crop', tags: ['Lakeside','Open Air'] },
      { name: 'Temple Area Municipal',  meta: 'Official parking near Temple of Tooth · Rs 50/entry', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop', tags: ['Official','Central'] },
    ],
    rentals: [
      { name: 'Malkey Rent a Car',      meta: 'Fleet of AC sedans & SUVs · driver available · from $25/day', img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e242?w=600&q=80&fit=crop', tags: ['Sedan','SUV','With Driver'], rating: '4.6' },
      { name: 'Casons Travels',         meta: 'Trusted Sri Lanka-wide car hire with English-speaking guides', img: 'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=600&q=80&fit=crop', tags: ['Tours','English Driver'], rating: '4.5' },
      { name: 'Pick Me Tuk',            meta: 'On-demand tuk-tuk app — fast & affordable for city hops', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80&fit=crop', tags: ['App','Tuk-Tuk','Budget'], rating: '4.4' },
    ],
    emergency: [
      { name: 'Kandy Teaching Hospital',        meta: 'Largest public hospital in Central Province · 24/7 A&E', img: 'https://images.unsplash.com/photo-1519494026892-476f5ba1c8fc?w=600&q=80&fit=crop', tags: ['24/7','A&E','Government'], badge: 'emergency' },
      { name: 'Nalanda Medical Centre',         meta: 'Private multi-specialty hospital on Dalada Veediya street', img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&q=80&fit=crop', tags: ['Private','Specialists'], badge: 'emergency' },
      { name: 'Cargills Pharmacy',              meta: 'Full-service pharmacy with pharmacist on duty · City Centre', img: 'https://images.unsplash.com/photo-1584308666744-b2a8e8a9b27b?w=600&q=80&fit=crop', tags: ['Pharmacy','Open Late'] },
      { name: 'Osuusala Government Pharmacy',   meta: 'Low-cost government pharmacy near clock tower · all-hours', img: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=600&q=80&fit=crop', tags: ['Pharmacy','24/7','Government'], badge: 'open24' },
    ],
  },

  galle: {
    heroImg:  'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1600&q=80&fit=crop&auto=format',
    tagline:  'UNESCO Fort City · Southern Coastal Gem',
    places: [
      { name: 'Galle Dutch Fort',          meta: 'UNESCO World Heritage colonial fortification from the 17th century', img: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600&q=80&fit=crop', tags: ['UNESCO','Heritage'], badge: 'rated', rating: '4.9' },
      { name: 'Galle Lighthouse',          meta: 'Iconic white lighthouse standing at the southernmost bastion', img: 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=600&q=80&fit=crop', tags: ['Scenic','Photography'], badge: 'free', rating: '4.7' },
      { name: 'Jungle Beach',              meta: 'Hidden cove with crystal waters accessible by a short hike', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80&fit=crop', tags: ['Beach','Snorkelling'], rating: '4.8' },
      { name: 'National Maritime Museum', meta: 'Fascinating colonial-era maritime exhibits inside the fort walls', img: 'https://images.unsplash.com/photo-1580737081703-ef79df5c85b0?w=600&q=80&fit=crop', tags: ['Museum','History'], rating: '4.4' },
    ],
    dining: [
      { name: 'Fortaleza Restaurant',    meta: 'Rooftop dining with Indian Ocean views inside the fort', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&fit=crop', tags: ['Rooftop','Seafood'], rating: '4.7' },
      { name: 'Lucky Fort Restaurant',   meta: 'Sri Lankan home-cooking with fresh daily catch', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop', tags: ['Local','Seafood'], rating: '4.5' },
      { name: 'Pedlar\'s Inn Café',      meta: 'Charming colonial courtyard café with excellent coffee', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&fit=crop', tags: ['Café','Brunch'], rating: '4.6' },
    ],
    shopping: [
      { name: 'Shoba Gems & Jewellery', meta: 'Certified gemstone store — sapphires, rubies & moonstones', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80&fit=crop', tags: ['Gems','Jewellery'] },
      { name: 'Stick No Bills Gallery', meta: 'Contemporary artwork and photography prints by local artists', img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80&fit=crop', tags: ['Art','Gallery'] },
      { name: 'Galle Fort Market',      meta: 'Weekend artisan market with handmade goods & street food', img: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80&fit=crop', tags: ['Artisan','Weekend Only'] },
    ],
    hotels: [
      { name: 'Amangalla',          meta: 'Ultra-luxury colonial mansion inside the fort — world class', img: 'https://images.unsplash.com/photo-1551882547-ff40c4a49d23?w=600&q=80&fit=crop', tags: ['Ultra Luxury','Fort'], badge: 'luxury', rating: '4.9' },
      { name: 'The Fort Printers',  meta: 'Boutique heritage hotel in a restored 18th-century Dutch building', img: 'https://images.unsplash.com/photo-1566073771259-92f5f5fe1735?w=600&q=80&fit=crop', tags: ['Boutique','Heritage'], rating: '4.7' },
      { name: 'Jetwing Lighthouse', meta: 'Geoffrey Bawa-designed seafront landmark resort', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80&fit=crop', tags: ['Design Hotel','Seafront'], badge: 'luxury', rating: '4.8' },
    ],
    parking: [
      { name: 'Fort Gate Car Park',      meta: 'Main entrance parking before the fort walls · Rs 50/hr', img: 'https://images.unsplash.com/photo-1506521781966-b9b61dc7069e?w=600&q=80&fit=crop', tags: ['Central','Open Air'] },
      { name: 'Galle Bus Stand Parking', meta: 'Large public lot near the bus terminal · Rs 30/hr', img: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&q=80&fit=crop', tags: ['Budget','Large Lot'] },
    ],
    rentals: [
      { name: 'Galle Rent A Car',    meta: 'Wide fleet of economy to luxury cars · from $22/day', img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e242?w=600&q=80&fit=crop', tags: ['Economy','4WD'], rating: '4.4' },
      { name: 'Unawatuna Scooters',  meta: 'Scooter & motorbike hire for coastal exploration · $8/day', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop', tags: ['Scooter','Motorbike'], rating: '4.3' },
    ],
    emergency: [
      { name: 'Karapitiya Teaching Hospital', meta: 'Main government hospital for Galle District · 24/7 A&E', img: 'https://images.unsplash.com/photo-1519494026892-476f5ba1c8fc?w=600&q=80&fit=crop', tags: ['24/7','Government','A&E'], badge: 'emergency' },
      { name: 'Nawaloka Hospitals Galle',     meta: 'Private hospital with ambulance & modern diagnostics', img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&q=80&fit=crop', tags: ['Private','Ambulance'], badge: 'emergency' },
      { name: 'Osu Sala Pharmacy',            meta: '24-hour pharmacy near the Galle bus stand', img: 'https://images.unsplash.com/photo-1584308666744-b2a8e8a9b27b?w=600&q=80&fit=crop', tags: ['Pharmacy','24/7'], badge: 'open24' },
    ],
  },

  ella: {
    heroImg:  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&fit=crop&auto=format',
    tagline:  'Mountain Tea Country · Highland Dreamscape',
    places: [
      { name: 'Nine Arch Bridge',      meta: 'Iconic colonial stone viaduct framed by tea estates', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&fit=crop', tags: ['Icon','Photography'], badge: 'rated', rating: '4.9' },
      { name: "Little Adam's Peak",    meta: '1,141m hilltop trek with sweeping 360° valley views', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&fit=crop', tags: ['Hiking','Views'], rating: '4.8' },
      { name: 'Ravana Falls',          meta: "30-metre cascading waterfall linked to the Ramayana legend", img: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&q=80&fit=crop', tags: ['Waterfall','Nature'], rating: '4.7' },
      { name: 'Lipton\'s Seat',        meta: 'Tea estate summit at 1,970m — Thomas Lipton surveyed his empire here', img: 'https://images.unsplash.com/photo-1598001476908-e34bade30f32?w=600&q=80&fit=crop', tags: ['Historical','Tea','ViewPoint'], rating: '4.8' },
    ],
    dining: [
      { name: 'Café Chill',           meta: 'Rooftop hangout with mountain views and great smoothie bowls', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&fit=crop', tags: ['Café','Rooftop','Vegan'], rating: '4.6' },
      { name: 'Ella Flower Garden',   meta: 'Family restaurant with hearty Sri Lankan buffets & fresh juices', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop', tags: ['Local','Buffet'], rating: '4.5' },
      { name: 'The Nest Restaurant',  meta: 'Cosy hillside spot with drop-dead valley views at sunset', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&fit=crop', tags: ['Views','Sunset'], rating: '4.7' },
    ],
    shopping: [
      { name: 'Ella Tea Shop',        meta: 'Locally sourced single-estate teas — take home a taste of Ella', img: 'https://images.unsplash.com/photo-1567922045116-2a00fae2ed03?w=600&q=80&fit=crop', tags: ['Tea','Souvenirs'] },
      { name: 'Ella Spice Garden',    meta: 'Organic spices and ayurvedic herb kits from the hill farms', img: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600&q=80&fit=crop', tags: ['Spices','Organic'] },
    ],
    hotels: [
      { name: '98 Acres Resort',       meta: 'Iconic mountaintop boutique resort inside a working tea estate', img: 'https://images.unsplash.com/photo-1551882547-ff40c4a49d23?w=600&q=80&fit=crop', tags: ['Tea Estate','Vista'], badge: 'luxury', rating: '4.9' },
      { name: 'Zion View Ella',        meta: 'Budget-friendly guesthouse with sweeping valley panoramas', img: 'https://images.unsplash.com/photo-1566073771259-92f5f5fe1735?w=600&q=80&fit=crop', tags: ['Budget','Views'], rating: '4.5' },
      { name: 'Ella Jungle Resort',    meta: 'Eco-cottages nestled in tropical jungle with plunge pools', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80&fit=crop', tags: ['Eco','Jungle','Pool'], rating: '4.7' },
    ],
    parking: [
      { name: 'Ella Town Car Park',    meta: 'Central open-air lot near the main street · Rs 40/hr', img: 'https://images.unsplash.com/photo-1506521781966-b9b61dc7069e?w=600&q=80&fit=crop', tags: ['Central','Town'] },
      { name: 'Nine Arch Bridge Park', meta: 'Dedicated lot at the bridge viewpoint trail head · Rs 100', img: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&q=80&fit=crop', tags: ['Tourist Site'] },
    ],
    rentals: [
      { name: 'Ella Trekkers Bikes',   meta: 'Mountain bikes & e-bikes for the hill trails · $7/day', img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80&fit=crop', tags: ['Bicycle','E-Bike'], rating: '4.6' },
      { name: 'Dream Tuk Ella',        meta: '3-wheeler hire for exploring tea country at your own pace', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80&fit=crop', tags: ['Tuk-Tuk','Self Drive'], rating: '4.4' },
    ],
    emergency: [
      { name: 'Ella Base Hospital',    meta: 'Government district hospital · 24/7 emergency ward', img: 'https://images.unsplash.com/photo-1519494026892-476f5ba1c8fc?w=600&q=80&fit=crop', tags: ['24/7','Government'], badge: 'emergency' },
      { name: 'Bandarawela Hospital',  meta: 'Full-facility private hospital 12 km from Ella town', img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&q=80&fit=crop', tags: ['Private','Nearest City'], badge: 'emergency' },
      { name: 'Ella Pharmacy',         meta: 'Stocked pharmacy on main street · open until 9 pm', img: 'https://images.unsplash.com/photo-1584308666744-b2a8e8a9b27b?w=600&q=80&fit=crop', tags: ['Pharmacy','Evenings'] },
    ],
  },

  trinco: {
    heroImg:  'https://images.unsplash.com/photo-1540202403-b7abd6747a18?w=1600&q=80&fit=crop&auto=format',
    tagline:  'East Coast Harbour City · Turquoise Seas',
    places: [
      { name: 'Marble Beach',          meta: 'Pristine white-crescent beach with crystal-clear coral waters', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80&fit=crop', tags: ['Beach','Snorkelling'], badge: 'rated', rating: '4.9' },
      { name: 'Koneswaram Temple',     meta: '600 BCE Hindu cliff-top temple with sweeping ocean panoramas', img: 'https://images.unsplash.com/photo-1591379280396-2f3fa3ea1067?w=600&q=80&fit=crop', tags: ['Temple','Clifftop'], rating: '4.8' },
      { name: 'Fort Frederick',        meta: 'Dutch-Portuguese fortress now used by the Sri Lanka Army', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80&fit=crop', tags: ['Fort','History'], rating: '4.5' },
      { name: 'Hot Springs — Kanniya', meta: '7 natural thermal spring wells just outside the city', img: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=600&q=80&fit=crop', tags: ['Natural','Unique'], rating: '4.4' },
    ],
    dining: [
      { name: 'Welcome Restaurant',    meta: 'Beloved seafood spot on the Trinco waterfront', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&fit=crop', tags: ['Seafood','Waterfront'], rating: '4.6' },
      { name: 'Lord\'s Restaurant',    meta: 'Comfort Sri Lankan fare popular with locals and tourists', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop', tags: ['Local','Budget'], rating: '4.4' },
    ],
    shopping: [
      { name: 'Trinco Market',         meta: 'Bustling local market with fresh produce, batik and handicrafts', img: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80&fit=crop', tags: ['Market','Handicrafts'] },
      { name: 'Samudra Seashells',     meta: 'Unique seashell jewellery and décor made locally', img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80&fit=crop', tags: ['Jewellery','Handmade'] },
    ],
    hotels: [
      { name: 'Welcombe Hotel',        meta: 'Prime beachfront hotel with stunning Indian Ocean vistas', img: 'https://images.unsplash.com/photo-1551882547-ff40c4a49d23?w=600&q=80&fit=crop', tags: ['Beachfront','Pool'], badge: 'luxury', rating: '4.7' },
      { name: 'Francesco\'s',          meta: 'Charming guesthouse by the sea — famous for its hospitality', img: 'https://images.unsplash.com/photo-1566073771259-92f5f5fe1735?w=600&q=80&fit=crop', tags: ['Guesthouse','Sea View'], rating: '4.6' },
    ],
    parking: [
      { name: 'Harbour Parking Area',  meta: 'Free public parking near the harbour entrance · large lot', img: 'https://images.unsplash.com/photo-1506521781966-b9b61dc7069e?w=600&q=80&fit=crop', tags: ['Free','Harbour'], badge: 'free' },
      { name: 'Bus Station Lot',       meta: 'Public lot adjacent to Trinco central bus terminal · Rs 30/hr', img: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&q=80&fit=crop', tags: ['Central','Budget'] },
    ],
    rentals: [
      { name: 'Trinco Car Hire',       meta: 'AC cars and vans · English-speaking guides available · $30/day', img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e242?w=600&q=80&fit=crop', tags: ['Car','Van','Guide'], rating: '4.4' },
      { name: 'Monkey Island Boats',   meta: 'Boat trips and whale-watching charters from Trinco harbour', img: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=600&q=80&fit=crop', tags: ['Boat','Whale Watching'], rating: '4.7' },
    ],
    emergency: [
      { name: 'Trincomalee General Hospital', meta: 'Main government hospital with A&E · Dockyard Rd', img: 'https://images.unsplash.com/photo-1519494026892-476f5ba1c8fc?w=600&q=80&fit=crop', tags: ['24/7','Government'], badge: 'emergency' },
      { name: 'Lanka Hospital Trinco',        meta: 'Private clinic with diagnostic lab and specialist wards', img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&q=80&fit=crop', tags: ['Private','Lab'], badge: 'emergency' },
      { name: 'City Pharmacy Trinco',         meta: 'Central pharmacy near Clock Tower · open late', img: 'https://images.unsplash.com/photo-1584308666744-b2a8e8a9b27b?w=600&q=80&fit=crop', tags: ['Pharmacy'] },
    ],
  },

  jaffna: {
    heroImg:  'https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=1600&q=80&fit=crop&auto=format',
    tagline:  'Northern Cultural Heartland · Tamil Heritage',
    places: [
      { name: 'Nallur Kandaswamy Temple', meta: 'Grand 13th-century Hindu temple — most sacred in northern Lanka', img: 'https://images.unsplash.com/photo-1591379280396-2f3fa3ea1067?w=600&q=80&fit=crop', tags: ['Temple','Heritage'], badge: 'rated', rating: '4.9' },
      { name: 'Jaffna Fort',              meta: 'Massive Portuguese-Dutch star-shaped fort by the lagoon', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80&fit=crop', tags: ['Fort','History'], rating: '4.7' },
      { name: 'Nagadipa Buddhist Temple', meta: 'Ancient temple on an island in the Jaffna Lagoon — boat access only', img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80&fit=crop', tags: ['Island Temple','Serene'], rating: '4.8' },
      { name: 'Casuarina Beach',          meta: 'Quiet Northern shore with shallow turquoise waters & casuarina trees', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80&fit=crop', tags: ['Beach','Peaceful'], rating: '4.6' },
    ],
    dining: [
      { name: 'Green Grass Hotel',     meta: 'Jaffna-style crab curry & traditional Tamil meals — unmissable', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop', tags: ['Crab Curry','Authentic'], rating: '4.8' },
      { name: 'Rio Ice Cream',         meta: 'Legendary Jaffna ice cream parlour – palmyrah ice cream is a must', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&fit=crop', tags: ['Ice Cream','Local Icon'], rating: '4.7' },
    ],
    shopping: [
      { name: 'Jaffna Market',         meta: 'Vibrant central market with dried fish, palmyrah crafts & palmyrah products', img: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80&fit=crop', tags: ['Market','Palmyrah Crafts'] },
      { name: 'Palmyrah Products',     meta: 'Traditional handicrafts woven from palmyrah palm by local artisans', img: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80&fit=crop', tags: ['Handicrafts','Woven'] },
    ],
    hotels: [
      { name: 'Jetwing Jaffna',        meta: 'Modern boutique hotel with rooftop pool on the Jaffna peninsula', img: 'https://images.unsplash.com/photo-1551882547-ff40c4a49d23?w=600&q=80&fit=crop', tags: ['Rooftop Pool','Boutique'], badge: 'luxury', rating: '4.8' },
      { name: 'Tilko Jaffna Hotel',    meta: 'Contemporary mid-range hotel in the heart of Jaffna city', img: 'https://images.unsplash.com/photo-1566073771259-92f5f5fe1735?w=600&q=80&fit=crop', tags: ['Central','Modern'], rating: '4.5' },
    ],
    parking: [
      { name: 'Jaffna Town Parking',   meta: 'Municipal car park near the hospital junction · Rs 30/hr', img: 'https://images.unsplash.com/photo-1506521781966-b9b61dc7069e?w=600&q=80&fit=crop', tags: ['Central'] },
    ],
    rentals: [
      { name: 'Jaffna Car Hire',       meta: 'Reliable car rental with local knowledge · from $28/day', img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e242?w=600&q=80&fit=crop', tags: ['Car','Local Driver'], rating: '4.5' },
      { name: 'Cycle Jaffna',          meta: 'Bicycle hire perfect for exploring the flat Jaffna peninsula · $3/day', img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80&fit=crop', tags: ['Bicycle','Eco'], rating: '4.4' },
    ],
    emergency: [
      { name: 'Jaffna Teaching Hospital', meta: 'Largest public hospital in Northern Province · 24/7 emergency', img: 'https://images.unsplash.com/photo-1519494026892-476f5ba1c8fc?w=600&q=80&fit=crop', tags: ['24/7','Government'], badge: 'emergency' },
      { name: 'Jaffna Osuusala',          meta: 'Government pharmacy near Teaching Hospital · low cost', img: 'https://images.unsplash.com/photo-1584308666744-b2a8e8a9b27b?w=600&q=80&fit=crop', tags: ['Pharmacy','Budget'] },
    ],
  },

  sigiriya: {
    heroImg:  'https://images.unsplash.com/photo-1586686777408-ad5c8d00bcf6?w=1600&q=80&fit=crop&auto=format',
    tagline:  'UNESCO Rock Fortress · Ancient Cultural Triangle',
    places: [
      { name: 'Sigiriya Rock Fortress',    meta: '5th-century palace atop a 200m volcanic rock — 8th wonder of the world', img: 'https://images.unsplash.com/photo-1586686777408-ad5c8d00bcf6?w=600&q=80&fit=crop', tags: ['UNESCO','Icon'], badge: 'rated', rating: '5.0' },
      { name: 'Dambulla Cave Temple',      meta: 'Golden Temple with 153 Buddha statues carved into a granite cave', img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80&fit=crop', tags: ['Cave Temple','Golden'], rating: '4.9' },
      { name: 'Pidurangala Rock',          meta: 'Rival hilltop to Sigiriya — better sunrise views, fewer crowds', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&fit=crop', tags: ['Sunrise','Hiking'], rating: '4.8' },
      { name: 'Minneriya Elephant Safari', meta: 'World-famous "Gathering" of over 200+ wild elephants near a lake', img: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=600&q=80&fit=crop', tags: ['Safari','Elephants'], badge: 'rated', rating: '4.9' },
    ],
    dining: [
      { name: 'Sigiri View Café',        meta: 'Rock-view café with Sri Lankan rice & curry and fresh king coconut', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop', tags: ['View Café','Local'], rating: '4.5' },
      { name: 'The Chena Restaurant',    meta: 'Fine dining at Chena Huts resort set among paddy fields', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&fit=crop', tags: ['Fine Dining','Resort'], rating: '4.7' },
    ],
    shopping: [
      { name: 'Cultural Village Crafts', meta: 'Handmade souvenirs — lacquer boxes, clay pots and devil masks', img: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80&fit=crop', tags: ['Crafts','Masks'] },
      { name: 'Elephant Fair',           meta: 'Eco-friendly elephants-motif apparel and wildlife art', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80&fit=crop', tags: ['Wildlife Art','Apparel'] },
    ],
    hotels: [
      { name: 'Chena Huts by Uga',      meta: 'Exclusive tented camp by an ancient wewa — wild & luxurious', img: 'https://images.unsplash.com/photo-1551882547-ff40c4a49d23?w=600&q=80&fit=crop', tags: ['Tented Camp','Wild Luxury'], badge: 'luxury', rating: '4.9' },
      { name: 'Jetwing Vil Uyana',      meta: 'Stilted eco-chalets overlooking a wetland bird sanctuary', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80&fit=crop', tags: ['Eco','Wetland'], badge: 'luxury', rating: '4.8' },
      { name: 'Flower Inn Sigiriya',    meta: 'Budget-friendly guesthouse minutes from the rock entrance', img: 'https://images.unsplash.com/photo-1566073771259-92f5f5fe1735?w=600&q=80&fit=crop', tags: ['Budget','Close to Rock'], rating: '4.4' },
    ],
    parking: [
      { name: 'Sigiriya Rock Car Park', meta: 'Official pay-and-display lot at the rock entrance · Rs 100', img: 'https://images.unsplash.com/photo-1506521781966-b9b61dc7069e?w=600&q=80&fit=crop', tags: ['Official','Rock Entrance'] },
      { name: 'Dambulla Temple Lot',    meta: 'Paved parking below the Dambulla cave temples · Rs 60', img: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&q=80&fit=crop', tags: ['Temple','Paved'] },
    ],
    rentals: [
      { name: 'Habarana Rent A Car',    meta: 'Jeep safaris & saloon rentals · experienced wildlife drivers', img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e242?w=600&q=80&fit=crop', tags: ['Jeep','Safari','4WD'], rating: '4.6' },
      { name: 'Sigiriya Cycle Hire',    meta: 'Bicycle hire to explore the surrounding villages & paddy fields', img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80&fit=crop', tags: ['Bicycle','Village Tours'], rating: '4.4' },
    ],
    emergency: [
      { name: 'Inamaluwa Hospital',     meta: 'Closest government hospital · 4 km from Sigiriya Rock', img: 'https://images.unsplash.com/photo-1519494026892-476f5ba1c8fc?w=600&q=80&fit=crop', tags: ['Government','Closest'], badge: 'emergency' },
      { name: 'Dambulla General Hospital', meta: 'Full-facility public hospital 20 km from Sigiriya', img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&q=80&fit=crop', tags: ['Full Facility','24/7'], badge: 'emergency' },
      { name: 'Sigiriya Pharmacy',      meta: 'Small pharmacy at the village junction near rock entrance', img: 'https://images.unsplash.com/photo-1584308666744-b2a8e8a9b27b?w=600&q=80&fit=crop', tags: ['Pharmacy'] },
    ],
  },
};

/* ── Category config (icon, label, accent colour) ─────────── */
const CATEGORIES = {
  places:    { label: 'Places to Visit',          accent: 'default',   catClass: '' },
  dining:    { label: 'Restaurants & Dining',      accent: 'default',   catClass: '' },
  shopping:  { label: 'Shopping & Stores',         accent: 'shop',      catClass: 'shop' },
  hotels:    { label: 'Hotels & Accommodation',    accent: 'hotel',     catClass: 'hotel' },
  parking:   { label: 'Parking Areas',             accent: 'parking',   catClass: 'parking' },
  rentals:   { label: 'Vehicle Rentals',           accent: 'rental',    catClass: 'rental' },
  emergency: { label: '🚨 Emergency — Hospitals & Pharmacies', accent: 'emergency', catClass: 'emergency' },
};

/* ── Explore overlay DOM refs ───────────────────────────────── */
const exploreOverlay   = document.getElementById('exploreOverlay');
const exploreBackdrop  = document.getElementById('exploreBackdrop');
const exploreBackBtn   = document.getElementById('exploreBackBtn');
const exploreHeroImg   = document.getElementById('exploreHeroImg');
const exploreDestName  = document.getElementById('exploreDestName');
const exploreDestTagline = document.getElementById('exploreDestTagline');
const exploreGrid      = document.getElementById('exploreGrid');
const exploreLoading   = document.getElementById('exploreLoading');
const exploreTabs      = document.querySelectorAll('.explore-tab');

let activeExploreTab  = 'places';
let currentExploreKey = '';

/* ── Open / close explore overlay ─────────────────────────── */
function openExplore() {
  if (!selectedKey || !EXPLORE_DATA[selectedKey]) return;
  currentExploreKey = selectedKey;
  const data = EXPLORE_DATA[selectedKey];

  // Set hero
  exploreHeroImg.src  = data.heroImg;
  exploreHeroImg.alt  = DESTINATIONS[selectedKey].name;
  setText(exploreDestName,    DESTINATIONS[selectedKey].name);
  setText(exploreDestTagline, data.tagline);

  // Reset to first tab
  activeExploreTab = 'places';
  exploreTabs.forEach(t => {
    t.classList.toggle('is-active', t.dataset.tab === 'places');
    t.setAttribute('aria-selected', t.dataset.tab === 'places' ? 'true' : 'false');
  });

  renderExploreCards(currentExploreKey, activeExploreTab);

  exploreOverlay.classList.add('is-open');
  exploreOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeExplore() {
  exploreOverlay.classList.remove('is-open');
  exploreOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ── Render cards for the active tab ──────────────────────── */
function renderExploreCards(key, tab) {
  const data     = EXPLORE_DATA[key];
  const items    = data[tab] || [];
  const catCfg   = CATEGORIES[tab];

  exploreLoading.style.display = 'none';
  exploreGrid.innerHTML = '';

  if (!items.length) {
    exploreGrid.innerHTML = '<p style="color:var(--clr-text-muted);font-size:0.82rem;padding:20px 0">No entries listed for this category.</p>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'xcard' + (tab === 'emergency' ? ' xcard--emergency' : '');

    const badgeHTML = item.badge
      ? `<span class="xcard__badge xcard__badge--${item.badge}">${badgeLabel(item.badge)}</span>`
      : '';

    const ratingHTML = item.rating
      ? `<div class="xcard__rating">
           <span class="xcard__stars">${starsFromRating(item.rating)}</span>
           <span class="xcard__rating-val">${item.rating}</span>
         </div>`
      : '';

    const tagsHTML = (item.tags || []).map(t => `<span class="xcard__tag">${t}</span>`).join('');

    card.innerHTML = `
      <div class="xcard__img-wrap">
        <img class="xcard__img" src="${item.img}" alt="${item.name}" loading="lazy" />
        <div class="xcard__img-overlay"></div>
        ${badgeHTML}
      </div>
      <div class="xcard__body">
        <span class="xcard__category${catCfg.catClass ? ` xcard__category--${catCfg.catClass}` : ''}">${catCfg.label}</span>
        <span class="xcard__name">${item.name}</span>
        <span class="xcard__meta">${item.meta}</span>
        ${ratingHTML}
        <div class="xcard__tags">${tagsHTML}</div>
      </div>
    `;
    exploreGrid.appendChild(card);
  });
}

function badgeLabel(badge) {
  const map = { emergency: '🚨 Emergency', free: 'Free', luxury: '★ Luxury', open24: '24 hrs', rated: '⭐ Top Rated' };
  return map[badge] || badge;
}

function starsFromRating(r) {
  const n = Math.round(parseFloat(r));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/* ── Tab click handler ─────────────────────────────────────── */
exploreTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const key = tab.dataset.tab;
    activeExploreTab = key;
    exploreTabs.forEach(t => {
      t.classList.toggle('is-active', t === tab);
      t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
    });
    exploreLoading.style.display = '';
    exploreGrid.innerHTML = '';
    // Small timeout for transition feel
    setTimeout(() => renderExploreCards(currentExploreKey, key), 100);
  });
});

/* ── Explore More button ───────────────────────────────────── */
document.querySelector('.explore-btn').addEventListener('click', () => {
  openExplore();
});

/* ── Close handlers ─────────────────────────────────────────── */
exploreBackBtn.addEventListener('click', closeExplore);
exploreBackdrop.addEventListener('click', closeExplore);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && exploreOverlay.classList.contains('is-open')) {
    closeExplore();
  }
});

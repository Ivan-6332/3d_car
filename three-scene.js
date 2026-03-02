/**
 * NavDrive — Ceylon Route  |  three-scene.js
 * Three.js scene + GLTFLoader — static render, no animation yet
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ── Container ─────────────────────────────────────────────────
const container = document.getElementById('car-container');

// ── Scene ─────────────────────────────────────────────────────
const scene = new THREE.Scene();

// ── Camera ────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  58,                                               // wider FOV for road depth
  container.clientWidth / container.clientHeight,   // aspect ratio
  0.1,                                              // near clip
  300                                               // far clip extended for long roads
);
camera.position.set(0, 1.0, 2.2);
camera.lookAt(0, 0, 0);

// ── Renderer ──────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha:     true,   // transparent — CSS gradient shows through
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 0);             // alpha 0 = fully transparent

// Shadow map — PCFSoft gives smooth penumbra edges
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

// Tone mapping — ACES Filmic gives natural highlight roll-off
renderer.toneMapping          = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure  = 1.1;

container.appendChild(renderer.domElement);

// ── Continuous render loop ───────────────────────────────────────
// setAnimationLoop is the modern replacement for a manual
// requestAnimationFrame loop and plays nicely with WebXR.
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

// ── Lighting ──────────────────────────────────────────────────
// All lights are neutral white — no colour cast.
// IBL-style three-light rig: key · fill · rim  plus hemisphere base.

// 1. Hemisphere sky/ground — cheap, physically plausible ambient base.
//    Sky slightly brighter than ground for a natural outdoor look.
const hemiLight = new THREE.HemisphereLight(
  0xffffff,   // sky colour   — neutral white
  0x444444,   // ground colour — dark grey (simulates dark tarmac bounce)
  0.5         // low intensity; key light does the heavy lifting
);
scene.add(hemiLight);

// 2. Key light — primary sun-like source from upper-left-front.
//    Positioned high enough to cast a clean shadow under the car.
const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
keyLight.position.set(-4, 8, 6);
keyLight.castShadow              = true;
keyLight.shadow.bias             = -0.0004;  // prevents shadow acne
keyLight.shadow.normalBias       = 0.02;
// Tight frustum around the car keeps shadow resolution sharp
keyLight.shadow.camera.near      = 1;
keyLight.shadow.camera.far       = 30;
keyLight.shadow.camera.left      = -4;
keyLight.shadow.camera.right     = 4;
keyLight.shadow.camera.top       = 4;
keyLight.shadow.camera.bottom    = -4;
keyLight.shadow.mapSize.width    = 4096;  // high-res shadow map
keyLight.shadow.mapSize.height   = 4096;
scene.add(keyLight);

// 3. Fill light — opposite side, very soft; opens shadows without
//    creating a second shadow.  No castShadow on fill.
const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(5, 3, -3);
scene.add(fillLight);

// 4. Rim / back light — grazes across the car roof and rear panels,
//    creating that premium studio silhouette separation.
const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);
rimLight.position.set(2, 4, -8);
scene.add(rimLight);

// ── Ground plane (shadow receiver) ────────────────────────────
// ShadowMaterial is fully transparent except where shadows fall,
// so the CSS background remains visible while the car shadow shows.
const groundGeo = new THREE.PlaneGeometry(80, 80);
const groundMat = new THREE.ShadowMaterial({
  opacity:     0.28,
  transparent: true,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x   = -Math.PI / 2;   // lay flat
ground.position.y   = 0;              // sits at world origin — car lands here
ground.receiveShadow = true;
scene.add(ground);

// ── Model + timeline references ─────────────────────────────────
let carModel       = null;
let introTimeline  = null;
let homeModelScale = 1;   // uniform scale used on the home screen

// ── GLTFLoader ────────────────────────────────────────────────
const loader = new GLTFLoader();

loader.load(
  './assests/models/car.glb',

  // ── onLoad ────────────────────────────────────────────────
  (gltf) => {
    const model = gltf.scene;

    // ① Enable shadows on every mesh inside the model
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow    = true;
        node.receiveShadow = true;
      }
    });

    // ② Centre the model at world origin
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);   // shift so bounding-box centre = (0,0,0)

    // ③ Auto-scale so the longest axis fits within 3 units
    const size      = box.getSize(new THREE.Vector3());
    const maxAxis   = Math.max(size.x, size.y, size.z);
    const targetSize = 2.4;
    homeModelScale = targetSize / maxAxis;
    model.scale.setScalar(homeModelScale);

    // ④ Sit the model on the ground plane (y = 0)
    const scaledBox = new THREE.Box3().setFromObject(model);
    model.position.y -= scaledBox.min.y;

    // ⑤ Add to scene and store reference
    scene.add(model);
    carModel = model;

    // ⑦ Record the resting Y so bounce returns to exact ground level
    const baseY = model.position.y;

    // ── Intro timeline (paused — call introTimeline.play() to trigger) ──
    // Camera drifts forward, car gives a subtle engine-start shudder.
    introTimeline = gsap.timeline({ paused: true });
    introTimeline
      // Camera eases closer, dropping slightly for a lower, more dramatic angle
      .to(camera.position, {
        z: 1.1, y: 0.5,
        duration: 1.4,
        ease: 'power2.inOut',
      })
      // Slight chassis tilt to camera-right (engine torque feel)
      .to(model.rotation, {
        z: 0.025,
        duration: 0.25,
        ease: 'power2.inOut',
      }, '<0.5')
      // Micro-lift — engine compression
      .to(model.position, {
        y: baseY + 0.07,
        duration: 0.18,
        ease: 'power2.out',
      }, '<0.1')
      // Settle back down with a soft bounce
      .to(model.position, {
        y: baseY,
        duration: 0.45,
        ease: 'bounce.out',
      }, '>')
      // Return tilt to neutral
      .to(model.rotation, {
        z: 0,
        duration: 0.35,
        ease: 'power2.inOut',
      }, '<');
  },

  // ── onProgress ────────────────────────────────────────────
  (xhr) => {
    if (xhr.lengthComputable) {
      const pct = Math.round((xhr.loaded / xhr.total) * 100);
      console.info(`[GLTFLoader] car.glb — ${pct}% loaded`);
    }
  },

  // ── onError ───────────────────────────────────────────────
  (error) => {
    console.error('[GLTFLoader] Failed to load car.glb:', error);
  }
);

// ── Responsive resize via ResizeObserver ──────────────────────
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    // No manual render call needed — setAnimationLoop handles it
  }
});

resizeObserver.observe(container);

// ══════════════════════════════════════════════════════════════════
//  JOURNEY SYSTEM
// ══════════════════════════════════════════════════════════════════

// ── Per-journey scene objects (cleared on each new journey) ───────
let journeyObjects = [];

function clearJourneyObjects() {
  journeyObjects.forEach(obj => {
    scene.remove(obj);
    obj.traverse(child => {
      gsap.killTweensOf(child.scale);
      gsap.killTweensOf(child.material);
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material?.dispose();
    });
  });
  journeyObjects = [];
}

// ── Road ribbon ────────────────────────────────────────────────────
function buildRoadRibbon(curve, WIDTH = 0.55) {
  const SEG   = 120;
  const pts   = curve.getPoints(SEG);
  const positions = [], uvs = [], indices = [];

  for (let i = 0; i < pts.length; i++) {
    const t      = i / (pts.length - 1);
    const tan    = curve.getTangentAt(t);
    const right  = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    positions.push(
      pts[i].x - right.x * WIDTH * 0.5, 0.006, pts[i].z - right.z * WIDTH * 0.5,
      pts[i].x + right.x * WIDTH * 0.5, 0.006, pts[i].z + right.z * WIDTH * 0.5
    );
    uvs.push(0, t * 12,  1, t * 12);
    if (i < pts.length - 1) {
      const b = i * 2;
      indices.push(b, b + 2, b + 1,  b + 1, b + 2, b + 3);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x16202e, roughness: 0.88, transparent: true, opacity: 0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// ── Center dashed line ─────────────────────────────────────────────
function buildCenterDashes(curve) {
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const p = curve.getPoint(i / 80);
    pts.push(new THREE.Vector3(p.x, 0.016, p.z));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({
    color: 0xffffff, transparent: true, opacity: 0,
    dashSize: 0.12, gapSize: 0.1,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  return line;
}

// ── Animated glow trace line ───────────────────────────────────────
function buildTraceLine(curve) {
  const SEGS = 100;
  const pts  = [];
  for (let i = 0; i <= SEGS; i++) {
    const p = curve.getPoint(i / SEGS);
    pts.push(new THREE.Vector3(p.x, 0.03, p.z));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  geo.setDrawRange(0, 0);  // hidden; animated via drawProxy
  const mat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 });
  return { line: new THREE.Line(geo, mat), geo, ptCount: SEGS + 1 };
}

// ── Google Maps-style destination pin ─────────────────────────────
function buildDestinationPin(target) {
  const g = new THREE.Group();
  g.position.set(target.x, 0, target.z);
  g.scale.setScalar(0); // popped in via GSAP back.out

  // Sub-group for the upright pin parts — shrunk independently on arrival
  const pinStick = new THREE.Group();
  g.add(pinStick);

  // Pin head
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xff1f1f, emissive: 0xff0000, emissiveIntensity: 0.7,
    roughness: 0.22, metalness: 0.05,
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), headMat);
  head.position.y = 0.75;
  pinStick.add(head);

  // Inner white dot (Google Maps signature)
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  dot.position.y = 0.75;
  pinStick.add(dot);

  // Stem — inverted cone, point faces down
  const stem = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.44, 14),
    new THREE.MeshStandardMaterial({ color: 0xcc0000, emissive: 0x880000, emissiveIntensity: 0.4, roughness: 0.5 })
  );
  stem.position.y = 0.27;
  stem.rotation.z = Math.PI;
  pinStick.add(stem);

  // Inner ground pulse ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff3333, transparent: true, opacity: 0.75, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.38, 40), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.012;
  g.add(ring);

  // Outer glow ring
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff5555, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.66, 40), glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.012;
  g.add(glow);

  return { group: g, pinStick, ring, ringMat, glow, glowMat };
}

// ── Engine start micro-shudder ─────────────────────────────────────
function playEngineStart() {
  if (!carModel) return;
  const baseY = carModel.position.y;
  gsap.timeline()
    .to(carModel.rotation, { z:  0.022, duration: 0.18, ease: 'power2.out' })
    .to(carModel.position, { y: baseY + 0.065, duration: 0.16, ease: 'power2.out' }, '<')
    .to(carModel.position, { y: baseY, duration: 0.45, ease: 'bounce.out' }, '>')
    .to(carModel.rotation, { z: 0, duration: 0.3, ease: 'power2.inOut' }, '<');
}

// ── Destination location table ─────────────────────────────────────
const locations = {
  kandy:    { x:  1.2,  y: 0, z: -14.0 },
  galle:    { x: -2.0,  y: 0, z: -18.0 },
  ella:     { x:  2.8,  y: 0, z: -24.0 },
  trinco:   { x:  4.5,  y: 0, z: -20.0 },
  jaffna:   { x:  0.4,  y: 0, z: -32.0 },
  sigiriya: { x: -1.0,  y: 0, z: -22.0 },
};

// ── driveToLocation ────────────────────────────────────────────────
function driveToLocation(key) {
  const target = locations[key];
  if (!target || !carModel) {
    console.warn(`[driveToLocation] Unknown location or model not ready: "${key}"`);
    return;
  }

  // Clear previous journey objects and tweens
  clearJourneyObjects();
  gsap.killTweensOf(carModel.position);
  gsap.killTweensOf(carModel.rotation);
  gsap.killTweensOf(carModel.scale);
  gsap.killTweensOf(camera.position);

  // Scale car down to driving size (keeps home-screen car larger)
  const driveScale = homeModelScale * (1.6 / 2.4);
  gsap.to(carModel.scale, { x: driveScale, y: driveScale, z: driveScale, duration: 0.7, ease: 'power2.inOut' });

  // ① Build a longer, more expressive curved road path using 5 control points
  const start = carModel.position.clone();
  const end   = new THREE.Vector3(target.x, 0, target.z);
  const total = end.z - start.z;

  // Inject gentle lateral sweeps at 30% and 65% of the route
  const s1x = (Math.random() * 2 - 1) * 1.6;
  const s2x = (Math.random() * 2 - 1) * 1.2;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(start.x, 0, start.z),
    new THREE.Vector3(start.x * 0.7 + end.x * 0.3 + s1x, 0, start.z + total * 0.28),
    new THREE.Vector3(start.x * 0.3 + end.x * 0.7 + s2x, 0, start.z + total * 0.62),
    new THREE.Vector3(end.x * 0.95, 0, end.z * 0.92),
    new THREE.Vector3(end.x, 0, end.z),
  ]);
  curve.tension = 0.4;

  // ② Timing based on curve length
  const dist      = curve.getLength();
  const TRACE_DUR = THREE.MathUtils.clamp(dist * 0.10, 0.9, 4.0);
  const DRIVE_DUR = THREE.MathUtils.clamp(dist * 0.38, 5.0, 18.0);

  // Road wider on long routes
  const roadWidth = THREE.MathUtils.clamp(dist * 0.016, 0.5, 0.9);

  // ③ Construct all 3D journey objects
  const road   = buildRoadRibbon(curve, roadWidth);
  const dashes = buildCenterDashes(curve);
  const { line: traceLine, geo: traceGeo, ptCount } = buildTraceLine(curve);
  const { group: pinGroup, pinStick, ring, ringMat, glow, glowMat } = buildDestinationPin(target);

  [road, dashes, traceLine, pinGroup].forEach(o => { scene.add(o); journeyObjects.push(o); });

  // ④ Master timeline
  const tl = gsap.timeline();

  // Engine start shudder fires independently at T=0
  playEngineStart();

  // Glow trace draws from car to destination
  const drawProxy = { count: 0 };
  tl.to(drawProxy, {
    count: ptCount,
    duration: TRACE_DUR,
    ease: 'power2.inOut',
    onUpdate() { traceGeo.setDrawRange(0, Math.floor(drawProxy.count)); },
  }, 0.35);

  // Road ribbon fades in behind the trace
  tl.to(road.material,      { opacity: 0.94, duration: 0.55, ease: 'power2.out' }, '>-0.15');
  tl.to(dashes.material,    { opacity: 0.45, duration: 0.4,  ease: 'power2.out' }, '<');

  // Trace dims to subtle guide glow
  tl.to(traceLine.material, { opacity: 0.22, duration: 0.5 },                      '<0.2');

  // Destination pin pops in with spring bounce
  tl.to(pinGroup.scale, { x: 1, y: 1, z: 1, duration: 0.55, ease: 'back.out(2.2)' }, '<0.1');

  // Car follows the curve
  const p = { t: 0 };
  tl.to(p, {
    t: 1,
    duration: DRIVE_DUR,
    ease: 'power2.inOut',
    delay: 0.2,

    onUpdate() {
      const pt  = curve.getPoint(p.t);
      const pt2 = curve.getPoint(Math.min(p.t + 0.008, 1));

      carModel.position.x = pt.x;
      carModel.position.z = pt.z;

      // Rotate to face travel direction
      const dx = pt2.x - pt.x;
      const dz = pt2.z - pt.z;
      if (Math.abs(dx) + Math.abs(dz) > 0.00005) {
        carModel.rotation.y = Math.atan2(dx, dz);
      }

      // Chassis pitch: nose dips on accel, lifts under braking
      carModel.rotation.x = p.t < 0.10  ? -0.030 * (p.t / 0.10)
                           : p.t > 0.90  ?  0.020 * ((p.t - 0.90) / 0.10)
                           : -0.015;

      // Camera stays close behind, low for a wide road perspective
      const behind = curve.getPoint(Math.max(p.t - 0.04, 0));
      const camH   = 2.2 + p.t * 0.6;   // rises slightly near destination
      camera.position.set(
        behind.x * 0.3 + pt.x * 0.7,
        camH,
        behind.z * 0.3 + pt.z * 0.7 + 6.5
      );
      camera.lookAt(pt.x, 0.25, pt.z);
    },

    onComplete() {
      // Straighten car on arrival
      gsap.to(carModel.rotation, { x: 0, y: 0, duration: 0.7, ease: 'power2.inOut' });

      // Fade out only the upright pin stick — rings keep pulsing
      gsap.to(pinStick.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: 'back.in(1.8)', delay: 0.3 });
      // Camera pulls back and focuses on the pin
      gsap.to(camera.position, {
        x: target.x - 1.5, z: target.z + 4.8, y: 1.7,
        duration: 1.4, ease: 'power2.out',
        onUpdate() { camera.lookAt(target.x, 0.4, target.z); },
      });

      // Endless pulsing ground rings
      gsap.fromTo(ring.scale,  { x: 1, y: 1, z: 1 },   { x: 2.8, y: 2.8, z: 2.8, duration: 1.0, ease: 'power2.out', repeat: -1, repeatDelay: 0.4 });
      gsap.fromTo(ringMat,     { opacity: 0.75 },        { opacity: 0,     duration: 1.0, ease: 'power2.out', repeat: -1, repeatDelay: 0.4 });
      gsap.fromTo(glow.scale,  { x: 1, y: 1, z: 1 },   { x: 3.2, y: 3.2, z: 3.2, duration: 1.3, ease: 'power2.out', repeat: -1, repeatDelay: 0.5, delay: 0.55 });
      gsap.fromTo(glowMat,     { opacity: 0.3 },         { opacity: 0,     duration: 1.3, ease: 'power2.out', repeat: -1, repeatDelay: 0.5, delay: 0.55 });

      // Notify the UI layer
      window.dispatchEvent(new CustomEvent('navdrive:journey-arrived', { detail: { key } }));
    },
  }, '>0.2');
}

// ── Listen for journey-start from UI layer ─────────────────────────
window.addEventListener('navdrive:journey-start', e => driveToLocation(e.detail.key));

// ── Restore home-screen car scale when driving mode exits ────────────
window.addEventListener('navdrive:journey-exit', () => {
  if (!carModel) return;
  gsap.killTweensOf(carModel.scale);
  gsap.to(carModel.scale, { x: homeModelScale, y: homeModelScale, z: homeModelScale, duration: 0.6, ease: 'power2.inOut' });
});

// ── Public exports ─────────────────────────────────────────────────
export { scene, camera, renderer, carModel, introTimeline, locations, driveToLocation };

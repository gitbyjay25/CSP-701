import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let device = null;
let currentModel = 'baseline.pth';
let isRollerSpinning = false;
let rollerMesh = null;

function dispose() {
  if (!device) return;
  const d = device;
  cancelAnimationFrame(d.frame);
  d.resize.disconnect();
  for (const [name, fn] of d.listeners) d.stage.removeEventListener(name, fn);
  d.scene.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
    }
  });
  d.renderer.dispose();
  d.renderer.domElement.remove();
  device = null;
  rollerMesh = null;
}

function mount() {
  dispose();
  const stage = document.querySelector('#printer-stage');
  if (!stage) return;

  const mobile = matchMedia('(max-width: 680px)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    stage.dataset.renderer = 'unavailable';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    -7.2, 7.2,
    mobile ? 11.2 : 5.8,
    mobile ? -11.2 : -5.8,
    0.1, 40
  );
  camera.position.set(0, 0, 18);
  camera.lookAt(0, 0, 0);

  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  stage.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const keyLight = new THREE.DirectionalLight(0xfff5de, 3.2);
  keyLight.position.set(-5, 8, 9);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xc6d8d2, 1.8);
  fillLight.position.set(6, -3, 5);
  scene.add(fillLight);

  const body = new THREE.Group();
  scene.add(body);

  const mat = (color, metal = 0.1, rough = 0.45) =>
    new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });

  function add(g, m, x = 0, y = 0, z = 0) {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    body.add(o);
    return o;
  }

  const width = mobile ? 12.8 : 13.8;
  const height = mobile ? 20.8 : 10.6;

  // Layer 1: Base Shadow/Rim Casing
  add(new RoundedBoxGeometry(width, height, 0.85, 8, 0.45), mat(0xabaea0, 0.2, 0.42));
  // Layer 2: Main Ivory Enclosure Body
  add(new RoundedBoxGeometry(width - 0.2, height - 0.22, 0.32, 8, 0.38), mat(0xdcdfcb, 0.08, 0.45), 0, 0.04, 0.42);
  // Layer 3: Bezel Lip Face
  add(new RoundedBoxGeometry(width - 0.45, height - 0.5, 0.15, 7, 0.3), mat(0xe5e4d2, 0.05, 0.52), 0, 0.06, 0.58);

  // Recessed Screen Well (Dark Bezel surrounding the amber display)
  const sx = mobile ? 0 : -2.1;
  const sy = mobile ? 2.5 : 0.22;
  const sw = mobile ? 11.2 : 8.8;
  const sh = mobile ? 13.8 : 8.8;
  add(new RoundedBoxGeometry(sw, sh, 0.1, 6, 0.15), mat(0x5c665a, 0.25, 0.35), sx, sy, 0.66);
  add(new RoundedBoxGeometry(sw - 0.14, sh - 0.14, 0.08, 6, 0.1), mat(0x1a261c, 0.2, 0.3), sx, sy, 0.71);

  // Physical Printer Slot & Roller Housing (on the right side or top right)
  const px = mobile ? 0 : 4.45;
  const py = mobile ? -6.2 : 0.22;
  const pw = mobile ? 10.8 : 3.8;
  const ph = mobile ? 6.2 : 8.8;

  // Printer Bay Bezel
  add(new RoundedBoxGeometry(pw, ph, 0.12, 6, 0.18), mat(0x4a5247, 0.3, 0.35), px, py, 0.66);
  // Printer Bay Bed (Deep charcoal recess)
  add(new RoundedBoxGeometry(pw - 0.16, ph - 0.16, 0.08, 6, 0.12), mat(0x111913, 0.2, 0.3), px, py, 0.71);

  // Printer Paper Exit Slit (The dark horizontal slot where paper emerges)
  const slotY = py + (mobile ? 1.8 : 3.2);
  const slitMesh = add(new THREE.BoxGeometry(pw - 0.5, 0.22, 0.3), mat(0x050806, 0.1, 0.2), px, slotY, 0.76);

  // Visible Thermal Roller Bar (Rubberized black cylinder inside paper mouth)
  const rollerRadius = 0.13;
  const rollerLength = pw - 0.65;
  const rollerGeom = new THREE.CylinderGeometry(rollerRadius, rollerRadius, rollerLength, 32);
  const rollerMat = mat(0x232524, 0.85, 0.2); // metallic knurled rubber
  const roller = new THREE.Mesh(rollerGeom, rollerMat);
  roller.rotation.z = Math.PI / 2;
  roller.position.set(px, slotY - 0.02, 0.78);
  body.add(roller);
  rollerMesh = roller;

  // Roller teeth / grip ridges
  for (let r = 0; r < 8; r++) {
    const ridgeX = px - rollerLength / 2 + (r + 0.5) * (rollerLength / 8);
    const ridge = add(new THREE.TorusGeometry(rollerRadius * 1.04, 0.018, 8, 32), mat(0xd77942, 0.4, 0.3), ridgeX, slotY - 0.02, 0.78);
    ridge.rotation.y = Math.PI / 2;
  }

  // Model Toggle Switch Lever in 3D
  const switchX = px;
  const switchY = py - (mobile ? 2.0 : 3.1);
  const switchBase = add(new THREE.CylinderGeometry(0.35, 0.4, 0.12, 32), mat(0x6e7467, 0.7, 0.25), switchX, switchY, 0.74);
  switchBase.rotation.x = Math.PI / 2;
  const switchLever = add(new THREE.CylinderGeometry(0.08, 0.11, 0.45, 16), mat(0xdb6b36, 0.3, 0.3), switchX, switchY + 0.12, 0.86);
  switchLever.rotation.x = Math.PI / 3;

  // Hex Screws on four corners
  for (const x of [-width / 2 + 0.65, width / 2 - 0.65]) {
    for (const y of [height / 2 - 0.65, -height / 2 + 0.65]) {
      const screw = add(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 16), mat(0x757c6d, 0.7, 0.25), x, y, 0.68);
      screw.rotation.x = Math.PI / 2;
      add(new THREE.BoxGeometry(0.09, 0.015, 0.005), mat(0x323a2f), x, y, 0.7);
    }
  }

  // Ventilation slots on chassis bottom/sides
  for (let i = 0; i < 6; i++) {
    add(new RoundedBoxGeometry(0.06, 0.45, 0.03, 3, 0.02), mat(0x606a59), mobile ? -4.5 + i * 0.3 : -5.8 + i * 0.25, py - (mobile ? 4.5 : 4.4), 0.7);
  }

  const d = {
    stage,
    scene,
    camera,
    renderer,
    body,
    roller,
    switchLever,
    yaw: 0.05,
    pitch: -0.03,
    turn: null,
    frame: 0,
    last: 0,
    listeners: [],
  };
  device = d;

  // Pointer interactions for 3D tilt
  const down = (e) => {
    e.preventDefault();
    renderer.domElement.setPointerCapture(e.pointerId);
    d.turn = { x: e.clientX, y: e.clientY, yaw: d.yaw, pitch: d.pitch };
    stage.dataset.dragging = 'true';
  };

  const move = (e) => {
    if (!d.turn) return;
    d.yaw = Math.max(-0.24, Math.min(0.24, d.turn.yaw + (e.clientX - d.turn.x) * 0.003));
    d.pitch = Math.max(-0.12, Math.min(0.12, d.turn.pitch + (e.clientY - d.turn.y) * 0.002));
    pose();
  };

  const up = () => {
    d.turn = null;
    stage.removeAttribute('data-dragging');
  };

  stage.addEventListener('pointerdown', down, { passive: false });
  stage.addEventListener('pointermove', move, { passive: false });
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  d.listeners.push(['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up]);

  function pose() {
    body.rotation.set(d.pitch, d.yaw, 0);
    body.updateMatrixWorld(true);

    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    const halfY = mobile ? 11.2 : 5.8;
    const halfX = 7.2;

    const project = (x, y) => {
      const v = new THREE.Vector3(x, y, 0.8).applyMatrix4(body.matrixWorld).project(camera);
      return [(v.x + 1) * stageW / 2, (1 - v.y) * stageH / 2];
    };

    const p = project(-halfX, halfY);
    const q = project(halfX, halfY);
    const r = project(-halfX, -halfY);

    const a = (q[0] - p[0]) / stageW;
    const b = (q[1] - p[1]) / stageW;
    const c = (r[0] - p[0]) / stageH;
    const f = (r[1] - p[1]) / stageH;

    document.querySelectorAll('.console-screen, .printer-bay-ui, .case-inscription, .case-led').forEach((elem) => {
      const x = elem.offsetLeft;
      const y = elem.offsetTop;
      const tx = p[0] + a * x + c * y - x;
      const ty = p[1] + b * x + f * y - y;
      elem.style.transformOrigin = '0 0';
      elem.style.transform = `matrix(${a},${b},${c},${f},${tx},${ty})`;
    });

    renderer.render(scene, camera);
  }

  d.pose = pose;

  function resize() {
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    pose();
  }

  d.resize = new ResizeObserver(resize);
  d.resize.observe(stage);
  stage.dataset.renderer = 'webgl';
  resize();

  // Animation frame loop for continuous roller spinning during print
  function frame(t) {
    d.frame = requestAnimationFrame(frame);
    if (device !== d || document.hidden || t - d.last < 30) return;
    d.last = t;

    if (isRollerSpinning && rollerMesh) {
      rollerMesh.rotation.x += 0.35;
      renderer.render(scene, camera);
    }
  }
  d.frame = requestAnimationFrame(frame);
}

export function setModelVisual(model) {
  currentModel = model;
  if (device && device.switchLever) {
    device.switchLever.rotation.x = model === 'final_tuned.pth' ? -Math.PI / 3 : Math.PI / 3;
    device.pose();
  }
}

export function setRollerSpinning(spinning) {
  isRollerSpinning = spinning;
}

export function rotateView(direction) {
  if (device) {
    device.yaw = Math.max(-0.24, Math.min(0.24, device.yaw + direction * 0.08));
    device.pose();
  }
}

export function resetView() {
  if (device) {
    device.yaw = 0.05;
    device.pitch = -0.03;
    device.pose();
  }
}

export function mountPrinterConsole() {
  mount();
  setModelVisual(currentModel);
  const media = matchMedia('(max-width: 680px)');
  const remount = () => mount();
  const scroll = () => device?.pose();
  media.addEventListener('change', remount);
  window.addEventListener('scroll', scroll, { passive: true });
  return () => {
    media.removeEventListener('change', remount);
    window.removeEventListener('scroll', scroll);
    dispose();
  };
}


import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';

const canvas = document.querySelector('#gl-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  45,
  canvas.width / canvas.height,
  0.1,
  100
);
camera.position.set(0, 0, 4);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

const geometry = new THREE.BufferGeometry();
geometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(globalThis.suzanneVertices, 3)
);
geometry.computeVertexNormals();
geometry.center();

const myObj = new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
myObj.rotation.x = -Math.PI / 2;
scene.add(myObj);

// Light
// Modern Three.js uses physically based light units. Math.PI matches the
// approximate brightness of intensity 1 in the older lighting model.
const light = new THREE.DirectionalLight(0xffffff, Math.PI);
light.position.set(1, 1, 1);
scene.add(light);

let autoRotate = true;
let dragging = false;
let lastX = 0;
let lastY = 0;

function resizeRenderer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pixelRatio = renderer.getPixelRatio();
  const needsResize = canvas.width !== Math.floor(width * pixelRatio)
    || canvas.height !== Math.floor(height * pixelRatio);
  if (!needsResize) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function perform(action) {
  if (action === 'left') myObj.rotation.y -= 0.15;
  if (action === 'right') myObj.rotation.y += 0.15;
  if (action === 'up') myObj.rotation.x -= 0.15;
  if (action === 'down') myObj.rotation.x += 0.15;
  if (action === 'zoom-in') camera.position.z = Math.max(2, camera.position.z - 0.25);
  if (action === 'zoom-out') camera.position.z = Math.min(8, camera.position.z + 0.25);
}

canvas.addEventListener('pointerdown', event => {
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', event => {
  if (!dragging) return;
  myObj.rotation.y += (event.clientX - lastX) * 0.01;
  myObj.rotation.x += (event.clientY - lastY) * 0.01;
  lastX = event.clientX;
  lastY = event.clientY;
});

canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; });
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  camera.position.z = Math.max(2, Math.min(8, camera.position.z + event.deltaY * 0.005));
}, { passive: false });

document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', () => perform(button.dataset.action));
});

const autoRotateButton = document.querySelector('#auto-rotate');
autoRotateButton.addEventListener('click', () => {
  autoRotate = !autoRotate;
  autoRotateButton.textContent = autoRotate ? 'Pause auto rotate' : 'Play auto rotate';
});

document.querySelector('#reset').addEventListener('click', () => {
  myObj.rotation.set(-Math.PI / 2, 0, 0);
  camera.position.z = 4;
  autoRotate = true;
  autoRotateButton.textContent = 'Pause auto rotate';
});

window.addEventListener('keydown', event => {
  const actions = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    '+': 'zoom-in', '=': 'zoom-in', '-': 'zoom-out'
  };
  if (!actions[event.key]) return;
  event.preventDefault();
  perform(actions[event.key]);
});

function animate() {
  requestAnimationFrame(animate);
  resizeRenderer();
  if (autoRotate && !dragging) myObj.rotation.y += 0.01;
  renderer.render(scene, camera);
}

animate();

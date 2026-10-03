const canvas = document.querySelector('#chair-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#dfe5ed');

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.up.set(0, 0, 1);
const target = new THREE.Vector3(0, 0.12, 2.0);
let azimuth = 0.72;
let elevation = 0.20;
let distance = 8.8;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

scene.add(new THREE.HemisphereLight(0xffffff, 0x758094, 2.0));
const keyLight = new THREE.DirectionalLight(0xfff1d8, 3.0);
keyLight.position.set(4, 5, 8);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xe1ebff, 1.1);
fillLight.position.set(-5, -3, 4);
scene.add(fillLight);

const chair = new THREE.Group();
scene.add(chair);

const plywood = new THREE.MeshStandardMaterial({
  color: 0xb98450,
  roughness: 0.38,
  metalness: 0,
  side: THREE.DoubleSide
});
const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x76502f, roughness: 0.48 });

function bezier(p0, p1, p2, p3, steps) {
  const points = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const y = u ** 3 * p0[0] + 3 * u ** 2 * t * p1[0] + 3 * u * t ** 2 * p2[0] + t ** 3 * p3[0];
    const z = u ** 3 * p0[1] + 3 * u ** 2 * t * p1[1] + 3 * u * t ** 2 * p2[1] + t ** 3 * p3[1];
    points.push(new THREE.Vector2(y, z));
  }
  return points;
}

function createBentShell() {
  const path = [
    ...bezier([-0.72, 4.05], [-0.78, 3.45], [-0.62, 2.45], [-0.45, 2.18], 18),
    ...bezier([-0.45, 2.18], [-0.25, 1.98], [0.62, 2.04], [0.86, 1.98], 18),
    ...bezier([0.86, 1.98], [1.08, 1.88], [1.08, 0.58], [1.18, 0.10], 20),
    new THREE.Vector2(1.18, 0.10)
  ];
  const halfWidth = 1.75 / 2;
  const halfThickness = 0.16 / 2;
  const vertices = [];
  const indices = [];

  path.forEach((point, i) => {
    const tangent = i === 0
      ? path[1].clone().sub(path[0])
      : i === path.length - 1
        ? path[i].clone().sub(path[i - 1])
        : path[i + 1].clone().sub(path[i - 1]);
    tangent.normalize();
    const normal = new THREE.Vector2(-tangent.y, tangent.x);
    for (const x of [-halfWidth, halfWidth]) {
      for (const side of [-1, 1]) {
        const y = point.x + normal.x * halfThickness * side;
        const z = point.y + normal.y * halfThickness * side;
        vertices.push(x, y, z);
      }
    }
  });

  for (let i = 0; i < path.length - 1; i++) {
    const a = i * 4;
    const b = (i + 1) * 4;
    indices.push(
      a, b, b + 1, a, b + 1, a + 1,
      a + 2, a + 3, b + 3, a + 2, b + 3, b + 2,
      a + 1, b + 1, b + 3, a + 1, b + 3, a + 3,
      a, a + 2, b + 2, a, b + 2, b
    );
  }
  const last = (path.length - 1) * 4;
  indices.push(0, 1, 3, 0, 3, 2, last, last + 2, last + 3, last, last + 3, last + 1);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const shell = new THREE.Mesh(geometry, plywood);
  shell.castShadow = true;
  shell.receiveShadow = true;
  return shell;
}

chair.add(createBentShell());

// Wide rear support panel. Its long axis follows the original Blender script.
const legBottom = new THREE.Vector3(0, -0.78, 0.10);
const legTop = new THREE.Vector3(0, -0.28, 2.08);
const legDirection = legTop.clone().sub(legBottom);
const legLength = legDirection.length();
const leg = new THREE.Mesh(
  new THREE.BoxGeometry(1.75 - 0.18, 0.30, legLength),
  edgeMaterial
);
leg.position.copy(legBottom.clone().add(legTop).multiplyScalar(0.5));
leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), legDirection.normalize());
leg.castShadow = true;
leg.receiveShadow = true;
chair.add(leg);

// A subtle ground plane gives the model a clear sense of scale and direction.
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0xe5e9ef, roughness: 0.9 })
);
floor.position.z = 0.015;
floor.receiveShadow = true;
scene.add(floor);

function updateCamera() {
  const horizontal = distance * Math.cos(elevation);
  camera.position.set(
    target.x + horizontal * Math.sin(azimuth),
    target.y + horizontal * Math.cos(azimuth),
    target.z + distance * Math.sin(elevation)
  );
  camera.lookAt(target);
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = renderer.getPixelRatio();
  if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

let dragging = false;
let previousX = 0;
let previousY = 0;
canvas.addEventListener('pointerdown', event => {
  dragging = true;
  previousX = event.clientX;
  previousY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!dragging) return;
  azimuth += (event.clientX - previousX) * 0.008;
  elevation = THREE.MathUtils.clamp(elevation - (event.clientY - previousY) * 0.006, -0.15, 1.15);
  previousX = event.clientX;
  previousY = event.clientY;
});
function stopDrag() { dragging = false; }
canvas.addEventListener('pointerup', stopDrag);
canvas.addEventListener('pointercancel', stopDrag);
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  distance = THREE.MathUtils.clamp(distance + event.deltaY * 0.008, 5.2, 14);
}, { passive: false });

document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
  const { action } = button.dataset;
  if (action === 'left') azimuth -= 0.12;
  if (action === 'right') azimuth += 0.12;
  if (action === 'up') elevation = THREE.MathUtils.clamp(elevation + 0.08, -0.15, 1.15);
  if (action === 'down') elevation = THREE.MathUtils.clamp(elevation - 0.08, -0.15, 1.15);
  if (action === 'zoom-in') distance = Math.max(5.2, distance - 0.45);
  if (action === 'zoom-out') distance = Math.min(14, distance + 0.45);
}));

document.querySelector('#reset').addEventListener('click', () => {
  azimuth = 0.72;
  elevation = 0.20;
  distance = 8.8;
});

updateCamera();
function animate() {
  requestAnimationFrame(animate);
  resize();
  updateCamera();
  renderer.render(scene, camera);
}
animate();

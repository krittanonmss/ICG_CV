const canvas = document.getElementById('study-canvas');
const mode = document.body.dataset.mode;
const data = globalThis.foxStudyData;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f2ee);
const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
camera.position.set(4, 2, 4);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
const controls = new SimpleOrbitControls(camera, canvas);
controls.minDistance = 0.5;
controls.maxDistance = 20;
controls.update();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8075, 0.85));
const sun = new THREE.DirectionalLight(0xffffff, 0.75);
sun.position.set(3, 5, 4);
scene.add(sun);
let model;
function loadObj(text) {
  const object = new THREE.OBJLoader().parse(text);
  object.traverse(part => {
    if (part.isMesh) part.material = new THREE.MeshStandardMaterial({ color: 0xb8bec9, roughness: 0.8 });
  });
  return object;
}
if (mode === 'obj') {
  // Parse the exported OBJ rather than substituting the GLB for this exercise.
  model = loadObj(data.obj);
} else {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  if (mode === 'texture') {
    const texture = new THREE.TextureLoader().load(data.texture);
    texture.flipY = true;
    texture.encoding = THREE.sRGBEncoding;
    material.map = texture;
  } else {
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
    material.vertexColors = true;
  }
  model = new THREE.Mesh(geometry, material);
}
scene.add(model);
document.querySelectorAll('[data-model]').forEach(button => button.addEventListener('click', () => {
  scene.remove(model);
  model.traverse(part => {
    if (part.isMesh) {
      part.geometry.dispose();
      part.material.dispose();
    }
  });
  model = loadObj(button.dataset.model === 'helmet' ? globalThis.helmetObjData : data.obj);
  scene.add(model);
  canvas.setAttribute('aria-label', button.dataset.model === 'helmet' ? 'Interactive helmet model' : 'Interactive fox model');
  document.querySelectorAll('[data-model]').forEach(item => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  document.getElementById('reset').click();
}));
document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
  const action = button.dataset.action;
  if (action === 'left') controls.theta -= 0.15;
  if (action === 'right') controls.theta += 0.15;
  if (action === 'zoom-in') controls.dolly(0.85);
  if (action === 'zoom-out') controls.dolly(1 / 0.85);
  controls.update();
}));
document.getElementById('reset').addEventListener('click', () => {
  controls.target.set(0, 0, 0);
  camera.position.set(4, 2, 4);
  controls.started = false;
  controls.update();
});
let viewportWidth = 0, viewportHeight = 0;
function draw() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (width > 0 && height > 0 && (width !== viewportWidth || height !== viewportHeight)) {
    viewportWidth = width;
    viewportHeight = height;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(draw);
}
draw();

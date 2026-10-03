const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe7e9ee);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
document.getElementById('material-stage').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
camera.position.set(4, 2.8, 6);
bindMaterialViewport(renderer, camera);
const controls = new SimpleOrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.minDistance = 1;
controls.maxDistance = 20;
controls.update();

// Large bright panels and a dark studio give metals visible reflections.
const studio = new THREE.Scene();
studio.background = new THREE.Color(0x202533);
function panel(color, width, height, position) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  mesh.position.set(...position);
  mesh.lookAt(0, 1, 0);
  studio.add(mesh);
}
panel(0xffffff, 4, 6, [-4, 3, 3]);
panel(0xb5d9ff, 2, 5, [4, 2, 1]);
panel(0xffdeb5, 3, 4, [0, 4, -4]);
const pmrem = new THREE.PMREMGenerator(renderer);
const environment = pmrem.fromScene(studio, 0.04);
scene.environment = environment.texture;
pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xffffff, 0x626a80, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 2);
key.position.set(-3, 6, 4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
scene.add(key);
const rim = new THREE.DirectionalLight(0xaacfff, 1.2);
rim.position.set(3, 4, -3);
scene.add(rim);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0xcdd1da, roughness: 0.65 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
let character = null;
const bodyMaterials = new Set();
const bytes = Uint8Array.from(atob(globalThis.pbrRobotBase64), c => c.charCodeAt(0));
new THREE.GLTFLoader().parse(bytes.buffer, '', gltf => {
  character = gltf.scene;
  const box = new THREE.Box3().setFromObject(character);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 3 / size.y;
  character.scale.setScalar(scale);
  character.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  character.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => {
      material.envMapIntensity = 1.5;
      if (material.name === 'Main') bodyMaterials.add(material);
    });
  });
  scene.add(character);
}, error => console.error('Unable to load robot:', error));
function updateMaterial() {
  bodyMaterials.forEach(material => {
    material.metalness = Number(document.getElementById('metalness').value);
    material.roughness = Number(document.getElementById('roughness').value);
  });
}
['metalness', 'roughness'].forEach(id => document.getElementById(id).addEventListener('input', updateMaterial));
document.getElementById('reset').addEventListener('click', () => {
  document.getElementById('metalness').value = '0.8';
  document.getElementById('roughness').value = '0.24';
  updateMaterial();
  camera.position.set(4, 2.8, 6);
  controls.target.set(0, 1.5, 0);
  controls.started = false;
  controls.update();
});
function draw() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(draw);
}
draw();

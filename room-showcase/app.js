const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f2ee);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
document.getElementById('material-stage').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(-10, 9, 12);
camera.lookAt(0, 1.5, 0);
const controls = new SimpleOrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.minDistance = 2;
controls.maxDistance = 40;
controls.enableTouchGestures = true;
controls.update();
scene.add(new THREE.HemisphereLight(0xffffff, 0xbab1aa, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(4, 8, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = sun.shadow.camera.bottom = -6;
sun.shadow.camera.right = sun.shadow.camera.top = 6;
sun.shadow.normalBias = 0.02;
scene.add(sun);
const plantTime = { value: 0 };
const plantMaterials = createRoomPlantMaterials(plantTime, { value: 1 });
let room = null;
let roomMixer = null;
const animationClock = new THREE.Clock();
const bytes = Uint8Array.from(atob(roomGlbBase64), c => c.charCodeAt(0));
new THREE.GLTFLoader().parse(bytes.buffer, '', gltf => {
  room = gltf.scene;
  roomMixer = new THREE.AnimationMixer(room);
  gltf.animations.forEach(clip => roomMixer.clipAction(clip).play());
  room.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = object.receiveShadow = true;
    const name = object.name.replace(/_/g, ' ');
    if (name.startsWith('Toon plant leaf')) object.material = plantMaterials.leafMaterial;
    else if (name.startsWith('Toon plant stem')) object.material = plantMaterials.stemMaterial;
    else if (name === 'Toon plant pot') object.material = plantMaterials.potMaterial;
    else if (name === 'Toon plant soil') object.material = plantMaterials.soilMaterial;
    if (object.name.replace(/_/g, ' ').startsWith('Personal info text')) object.visible = false;
  });
  scene.add(room);
  renderer.render(scene, camera);
}, error => console.error('Unable to load room:', error));
// Orbit and zoom the model without the home page's object interactions.
function resize() {
  const width = renderer.domElement.clientWidth;
  const height = renderer.domElement.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}
resize();
new ResizeObserver(resize).observe(renderer.domElement);
function draw() {
  plantTime.value = performance.now() / 1000;
  if (roomMixer) roomMixer.update(Math.min(animationClock.getDelta(), 0.1));
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(draw);
}
draw();

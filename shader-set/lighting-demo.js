/* Shared scene. Select a fragment shader through body[data-mode]. */
const mode = document.body.dataset.mode;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10141c);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.1, 2.8);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

document.querySelector("#shader-stage").appendChild(renderer.domElement);

bindShaderViewport(renderer, camera);
const controls = new SimpleOrbitControls(camera, renderer.domElement);

const uniforms = {
  uTime: { value: 0 },
  uLightDir: { value: new THREE.Vector3(0.45, 0.85, 1.0).normalize() },
  uLightColor: { value: new THREE.Color(0xffffff) },
  uColor: { value: new THREE.Color(0x217cff) },
  uAmbient: { value: 0.20 }
};

const vertexShader = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 pos = position;
    vec3 n = normalize(normal);
    float wave = sin(pos.y * 3.2 + uTime * 1.25) * .07
               + sin(pos.x * 4.3 - uTime * .95) * .05
               + sin((pos.x + pos.y + pos.z) * 3.0 + uTime * .75) * .04;
    pos += n * wave;
    pos.x *= .90 + .035 * sin(uTime * .8);
    pos.y *= 1.03 + .030 * cos(uTime * .7);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragments = {
  fragment: `
    uniform vec3 uColor;
    void main() {
      gl_FragColor = vec4(uColor, 1.0);
    }`,
  lambert: `
    uniform vec3 uLightDir, uLightColor, uColor;
    varying vec3 vNormal;
    void main() {
      float diffuse = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
      gl_FragColor = vec4(uColor * uLightColor * diffuse, 1.0);
    }`,
  'lambert-ambient': `
    uniform vec3 uLightDir, uLightColor, uColor; uniform float uAmbient;
    varying vec3 vNormal;
    void main() {
      float diffuse = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
      gl_FragColor = vec4(uColor * (uAmbient + uLightColor * diffuse), 1.0);
    }`,
  phong: `
    uniform vec3 uLightDir, uLightColor, uColor; uniform float uAmbient;
    varying vec3 vNormal, vWorldPosition;
    void main() {
      vec3 N = normalize(vNormal), L = normalize(uLightDir);
      vec3 V = normalize(cameraPosition - vWorldPosition);
      float diffuse = max(dot(N, L), 0.0);
      float specular = diffuse > 0.0 ? pow(max(dot(reflect(-L, N), V), 0.0), 48.0) : 0.0;
      vec3 lit = uColor * (uAmbient + uLightColor * diffuse) + uLightColor * specular * .8;
      gl_FragColor = vec4(lit, 1.0);
    }`,
  'cell-shade': `
    uniform vec3 uLightDir, uColor; uniform float uAmbient;
    varying vec3 vNormal;
    void main() {
      float diffuse = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
      float bands = diffuse < .20 ? .16 : diffuse < .48 ? .42 : diffuse < .76 ? .70 : 1.0;
      gl_FragColor = vec4(uColor * (uAmbient + bands), 1.0);
    }`
};

const mesh = new THREE.Mesh(
  new THREE.SphereBufferGeometry(.82, 128, 128),
  new THREE.ShaderMaterial({ vertexShader, fragmentShader: fragments[mode], uniforms })
);
scene.add(mesh);


function animate(ms) {
  uniforms.uTime.value = ms * .001;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

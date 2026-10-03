function createRoomPlantMaterials(timeUniform, plantLightLevel) {
    const plantVertexShader = `
      uniform float uTime;
      uniform float uSway;
      varying vec3 vNormal;
      varying vec3 vLight;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        float height = clamp((worldPosition.y - 0.65) / 0.9, 0.0, 1.0);
        worldPosition.x += sin(uTime * 1.8 + worldPosition.y * 2.4 + worldPosition.z) * 0.13 * height * uSway;
        worldPosition.z += cos(uTime * 1.3 + worldPosition.x * 2.0) * 0.05 * height * uSway;
        vNormal = normalize(normalMatrix * normal);
        vLight = normalize((viewMatrix * vec4(0.45, 0.9, 0.35, 0.0)).xyz);
        vec4 mvPosition = viewMatrix * worldPosition;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    const plantFragmentShader = `
      uniform vec3 uColor;
      uniform float uLightLevel;
      varying vec3 vNormal;
      varying vec3 vLight;
      void main() {
        float light = max(dot(normalize(vNormal), normalize(vLight)), 0.0);
        float band = light < 0.20 ? 0.25 : light < 0.48 ? 0.48 : light < 0.78 ? 0.75 : 1.0;
        gl_FragColor = vec4(uColor * band * uLightLevel, 1.0);
      }
    `;
    function plantMaterial(color, sway) {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTime: timeUniform,
          uSway: { value: sway },
          uColor: { value: new THREE.Color(color) },
          uLightLevel: plantLightLevel
        },
        vertexShader: plantVertexShader,
        fragmentShader: plantFragmentShader,
        side: THREE.DoubleSide
      });
    }
    const leafMaterial = plantMaterial(0x3ea84b, 1);
    const stemMaterial = plantMaterial(0x2c7438, 1);
    const potMaterial = plantMaterial(0xc78583, 0);
    const soilMaterial = plantMaterial(0x775545, 0);

return { leafMaterial, stemMaterial, potMaterial, soilMaterial };
}

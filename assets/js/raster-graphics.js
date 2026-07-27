const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.createImageData(canvas.width, canvas.height);
const pixels = imageData.data;

function putPixel(x, y, r, g, b, a = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;
  const index = (y * canvas.width + x) * 4;
  pixels[index] = r;
  pixels[index + 1] = g;
  pixels[index + 2] = b;
  pixels[index + 3] = a;
}

function drawRectFilled(x1, y1, x2, y2, r, g, b, a = 255) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) putPixel(x, y, r, g, b, a);
  }
}

const smilePalette = [null,0xC76A08,0xFFDF48,0xFFDE47,0xFFDD45,0xFFDC44,0xFFDA43,0xFFD942,0xFFD841,0xFFD640,0x3B2507,0xFFD53E,0xFFFFFF,0xFFD43D,0xFFD33C,0xFFD13B,0xFFD03A,0xFFCF39,0xFFCD37,0xF58B73,0xFFCC36,0xFFCB35,0xFFC934,0xFFC833,0x7A2E0B,0xFFC732,0xFFC630,0xFFC42F,0xFFC32E,0xFFC22D,0xFFC02C,0xFFBF2B,0xFFBE29,0xFFBD28];
const smileRows = [
  [[0,32]],[[0,12],[1,8],[0,12]],[[0,9],[1,4],[2,6],[1,4],[0,9]],
  [[0,8],[1,2],[3,12],[1,2],[0,8]],[[0,6],[1,2],[4,16],[1,2],[0,6]],
  [[0,5],[1,2],[5,18],[1,2],[0,5]],[[0,4],[1,2],[6,20],[1,2],[0,4]],
  [[0,4],[1,1],[7,22],[1,1],[0,4]],[[0,3],[1,1],[8,24],[1,1],[0,3]],
  [[0,2],[1,2],[9,5],[10,3],[9,8],[10,3],[9,5],[1,2],[0,2]],
  [[0,2],[1,1],[11,5],[10,1],[12,1],[10,3],[11,6],[10,1],[12,1],[10,3],[11,5],[1,1],[0,2]],
  [[0,2],[1,1],[13,5],[10,5],[13,6],[10,5],[13,5],[1,1],[0,2]],
  [[0,1],[1,2],[14,5],[10,5],[14,6],[10,5],[14,5],[1,2],[0,1]],
  [[0,1],[1,1],[15,7],[10,3],[15,8],[10,3],[15,7],[1,1],[0,1]],
  [[0,1],[1,1],[16,28],[1,1],[0,1]],[[0,1],[1,1],[17,28],[1,1],[0,1]],
  [[0,1],[1,1],[18,5],[19,1],[18,16],[19,1],[18,5],[1,1],[0,1]],
  [[0,1],[1,1],[20,3],[19,5],[20,12],[19,5],[20,3],[1,1],[0,1]],
  [[0,1],[1,1],[21,2],[19,7],[21,10],[19,7],[21,2],[1,1],[0,1]],
  [[0,1],[1,2],[22,2],[19,5],[22,12],[19,5],[22,2],[1,2],[0,1]],
  [[0,2],[1,1],[23,4],[19,1],[23,1],[24,2],[23,10],[24,2],[23,1],[19,1],[23,4],[1,1],[0,2]],
  [[0,2],[1,1],[25,6],[24,4],[25,6],[24,4],[25,6],[1,1],[0,2]],
  [[0,2],[1,2],[26,6],[24,12],[26,6],[1,2],[0,2]],
  [[0,3],[1,1],[27,7],[24,10],[27,7],[1,1],[0,3]],
  [[0,4],[1,1],[28,8],[24,6],[28,8],[1,1],[0,4]],
  [[0,4],[1,2],[29,20],[1,2],[0,4]],[[0,5],[1,2],[30,18],[1,2],[0,5]],
  [[0,6],[1,2],[31,16],[1,2],[0,6]],[[0,8],[1,2],[32,12],[1,2],[0,8]],
  [[0,9],[1,4],[33,6],[1,4],[0,9]],[[0,12],[1,8],[0,12]],[[0,32]]
];

function decodeSpriteRows(rows, palette) {
  return rows.map(row => row.flatMap(([colorIndex, count]) =>
    Array(count).fill(palette[colorIndex])
  ));
}

const smileSprite24Bit = decodeSpriteRows(smileRows, smilePalette);

let state = { x: 100, y: 100, degree: 0, scale: 1 };
let scaling = 0;
let rotating = 0;

function drawSprite24BitRotateScale(sprite, centerX, centerY, degree, scaleX, scaleY) {
  const spriteCenterX = sprite[0].length / 2;
  const spriteCenterY = sprite.length / 2;
  const radians = degree * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const color = sprite[row][col];
      if (color === null) continue;

      const localX = col - spriteCenterX;
      const localY = row - spriteCenterY;
      const rotatedX = localX * cos - localY * sin;
      const rotatedY = localX * sin + localY * cos;
      const transformedX = Math.round(rotatedX * scaleX);
      const transformedY = Math.round(rotatedY * scaleY);
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;
      putPixel(centerX + transformedX, centerY + transformedY, r, g, b);
    }
  }
}

function toScaledMousePos(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor((clientX - rect.left) * canvas.width / rect.width),
    y: Math.floor((clientY - rect.top) * canvas.height / rect.height)
  };
}

function updateStatus() {
  document.getElementById('position').textContent = `X: ${Math.round(state.x)} · Y: ${Math.round(state.y)}`;
  document.getElementById('rotation').textContent = `Rotation: ${state.degree}°`;
  document.getElementById('scale').textContent = `Scale: ${state.scale.toFixed(1)}×`;
}

function render() {
  drawRectFilled(0, 0, canvas.width - 1, canvas.height - 1, 255, 255, 255);
  state.scale = Math.max(0.2, Math.min(4, state.scale + scaling));
  state.degree += rotating;
  drawSprite24BitRotateScale(smileSprite24Bit, state.x, state.y, state.degree, state.scale, state.scale);
  ctx.putImageData(imageData, 0, 0);
  updateStatus();
  requestAnimationFrame(render);
}

canvas.addEventListener('pointermove', event => {
  const point = toScaledMousePos(event.clientX, event.clientY);
  state.x = point.x;
  state.y = point.y;
});

window.addEventListener('keydown', event => {
  if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'ArrowLeft') rotating = -1;
  if (event.key === 'ArrowRight') rotating = 1;
  if (event.key === 'ArrowUp') scaling = 0.02;
  if (event.key === 'ArrowDown') scaling = -0.02;
});

window.addEventListener('keyup', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') rotating = 0;
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') scaling = 0;
});

document.getElementById('scale-up').addEventListener('click', () => {
  state.scale = Math.min(4, state.scale + 0.1);
});

document.getElementById('scale-down').addEventListener('click', () => {
  state.scale = Math.max(0.2, state.scale - 0.1);
});

document.getElementById('rotate-left').addEventListener('click', () => {
  state.degree -= 5;
});

document.getElementById('rotate-right').addEventListener('click', () => {
  state.degree += 5;
});

document.getElementById('reset').addEventListener('click', () => {
  state = { x: 100, y: 100, degree: 0, scale: 1 };
  scaling = rotating = 0;
});

render();

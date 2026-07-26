(() => {
  'use strict';

  const canvas = document.querySelector('#paint-canvas');
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const pixels = imageData.data;
  const palette = document.querySelector('#palette');
  const currentColor = document.querySelector('#current-color');
  const toolStatus = document.querySelector('#tool-status');

  const colors = ['#172033','#667085','#ffffff','#e5484d','#30a46c','#3157d5','#f5d90a','#f76808','#8e4ec6','#d6409f','#12a594','#8d6e63'];
  const names = { pencil:'Pencil', eraser:'Eraser', line:'Line', rectangle:'Rectangle', ellipse:'Ellipse' };
  const white = { r:255, g:255, b:255, a:255 };
  let tool = 'pencil';
  let color = hexToRgba(colors[0]);
  let width = 2;
  let drawing = false;
  let start = null;
  let last = null;
  let snapshot = null;

  function hexToRgba(hex) {
    const value = Number.parseInt(hex.slice(1), 16);
    return { r:(value >> 16) & 255, g:(value >> 8) & 255, b:value & 255, a:255 };
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x:Math.round((event.clientX - rect.left) * canvas.width / rect.width),
      y:Math.round((event.clientY - rect.top) * canvas.height / rect.height)
    };
  }

  function putPixel(x, y, rgba) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;
    const index = (y * canvas.width + x) * 4;
    pixels[index] = rgba.r;
    pixels[index + 1] = rgba.g;
    pixels[index + 2] = rgba.b;
    pixels[index + 3] = rgba.a;
  }

  // Draw a circular group of pixels to create line thickness without ctx.lineWidth.
  function putBrush(x, y, rgba) {
    const radius = Math.max(0, (width - 1) / 2);
    const limit = Math.ceil(radius);
    for (let offsetY = -limit; offsetY <= limit; offsetY++) {
      for (let offsetX = -limit; offsetX <= limit; offsetX++) {
        if (offsetX * offsetX + offsetY * offsetY <= radius * radius + 0.25) {
          putPixel(x + offsetX, y + offsetY, rgba);
        }
      }
    }
  }

  // Integer Bresenham line algorithm.
  function drawLine(x1, y1, x2, y2, rgba) {
    x1 = Math.round(x1); y1 = Math.round(y1);
    x2 = Math.round(x2); y2 = Math.round(y2);
    const dx = Math.abs(x2 - x1);
    const stepX = x1 < x2 ? 1 : -1;
    const dy = -Math.abs(y2 - y1);
    const stepY = y1 < y2 ? 1 : -1;
    let error = dx + dy;

    while (true) {
      putBrush(x1, y1, rgba);
      if (x1 === x2 && y1 === y2) break;
      const doubledError = error * 2;
      if (doubledError >= dy) { error += dy; x1 += stepX; }
      if (doubledError <= dx) { error += dx; y1 += stepY; }
    }
  }

  function drawRectangle(x1, y1, x2, y2, rgba) {
    drawLine(x1, y1, x2, y1, rgba);
    drawLine(x2, y1, x2, y2, rgba);
    drawLine(x2, y2, x1, y2, rgba);
    drawLine(x1, y2, x1, y1, rgba);
  }

  function plotEllipsePoints(cx, cy, x, y, rgba) {
    putBrush(cx + x, cy + y, rgba);
    putBrush(cx - x, cy + y, rgba);
    putBrush(cx + x, cy - y, rgba);
    putBrush(cx - x, cy - y, rgba);
  }

  // Midpoint ellipse algorithm; every outline pixel is calculated manually.
  function drawEllipse(x1, y1, x2, y2, rgba) {
    const cx = Math.round((x1 + x2) / 2);
    const cy = Math.round((y1 + y2) / 2);
    const rx = Math.max(1, Math.round(Math.abs(x2 - x1) / 2));
    const ry = Math.max(1, Math.round(Math.abs(y2 - y1) / 2));
    const rxSquared = rx * rx;
    const rySquared = ry * ry;
    let x = 0;
    let y = ry;
    let dx = 0;
    let dy = 2 * rxSquared * y;
    let decision = rySquared - rxSquared * ry + 0.25 * rxSquared;

    while (dx < dy) {
      plotEllipsePoints(cx, cy, x, y, rgba);
      x++;
      dx += 2 * rySquared;
      if (decision < 0) decision += rySquared + dx;
      else { y--; dy -= 2 * rxSquared; decision += rySquared + dx - dy; }
    }

    decision = rySquared * (x + 0.5) * (x + 0.5)
      + rxSquared * (y - 1) * (y - 1) - rxSquared * rySquared;
    while (y >= 0) {
      plotEllipsePoints(cx, cy, x, y, rgba);
      y--;
      dy -= 2 * rxSquared;
      if (decision > 0) decision += rxSquared - dy;
      else { x++; dx += 2 * rySquared; decision += rxSquared - dy + dx; }
    }
  }

  function clearPixels() {
    for (let index = 0; index < pixels.length; index += 4) {
      pixels[index] = 255;
      pixels[index + 1] = 255;
      pixels[index + 2] = 255;
      pixels[index + 3] = 255;
    }
  }

  function render() {
    ctx.putImageData(imageData, 0, 0);
  }

  function restoreSnapshot() {
    if (snapshot) pixels.set(snapshot);
  }

  function drawShape(end) {
    const rgba = color;
    if (tool === 'line') drawLine(start.x, start.y, end.x, end.y, rgba);
    if (tool === 'rectangle') drawRectangle(start.x, start.y, end.x, end.y, rgba);
    if (tool === 'ellipse') drawEllipse(start.x, start.y, end.x, end.y, rgba);
  }

  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    drawing = true;
    start = last = point(event);
    canvas.setPointerCapture(event.pointerId);
    if (['line','rectangle','ellipse'].includes(tool)) snapshot = new Uint8ClampedArray(pixels);
    else {
      putBrush(last.x, last.y, tool === 'eraser' ? white : color);
      render();
    }
  });

  canvas.addEventListener('pointermove', event => {
    if (!drawing) return;
    event.preventDefault();
    const now = point(event);
    if (tool === 'pencil' || tool === 'eraser') {
      drawLine(last.x, last.y, now.x, now.y, tool === 'eraser' ? white : color);
      last = now;
    } else {
      restoreSnapshot();
      drawShape(now);
    }
    render();
  });

  function finish(event) {
    if (!drawing) return;
    if (['line','rectangle','ellipse'].includes(tool)) {
      restoreSnapshot();
      drawShape(point(event));
      render();
    }
    drawing = false;
    snapshot = start = last = null;
  }

  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);

  document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => {
    tool = button.dataset.tool;
    document.querySelectorAll('[data-tool]').forEach(item => item.classList.toggle('active', item === button));
    toolStatus.textContent = names[tool];
  }));

  document.querySelectorAll('[data-width]').forEach(button => button.addEventListener('click', () => {
    width = Number(button.dataset.width);
    document.querySelectorAll('[data-width]').forEach(item => item.classList.toggle('active', item === button));
  }));

  colors.forEach((value, index) => {
    const button = document.createElement('button');
    button.className = `swatch${index === 0 ? ' active' : ''}`;
    button.style.background = value;
    button.title = value;
    button.addEventListener('click', () => {
      color = hexToRgba(value);
      currentColor.style.background = value;
      currentColor.title = value;
      document.querySelectorAll('.swatch').forEach(item => item.classList.toggle('active', item === button));
    });
    palette.appendChild(button);
  });

  document.querySelector('#clear-canvas').addEventListener('click', () => {
    clearPixels();
    render();
  });

  clearPixels();
  render();
})();

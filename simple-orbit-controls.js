// Drag to rotate, right/shift-drag to pan, and wheel or middle-drag to zoom.
// Uses only Three.js vectors; no extra controls package is needed.
class SimpleOrbitControls {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this.target = new THREE.Vector3();
    this.enableRotate = true;
    this.enablePan = true;
    this.enableZoom = true;
    this.zoomToCursor = false;
    this.enableTouchGestures = false;
    this.minDistance = 0.5;
    this.maxDistance = 80;
    this.started = false;
    this.dragging = false;
    this.button = 0;
    this.panDrag = false;
    this.lastX = 0;
    this.lastY = 0;
    this.touchPoints = new Map();
    this.lastTouchDistance = 0;
    this.lastTouchMidpoint = null;

    canvas.addEventListener('contextmenu', event => event.preventDefault());
    canvas.addEventListener('pointerdown', event => {
      this.update();
      if (event.pointerType === 'touch' && this.enableTouchGestures) {
        this.touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.touchPoints.size === 1) {
          this.lastX = event.clientX;
          this.lastY = event.clientY;
        } else {
          this.lastTouchDistance = 0;
          this.lastTouchMidpoint = null;
        }
        canvas.setPointerCapture(event.pointerId);
        return;
      }
      this.dragging = true;
      this.button = event.button;
      this.panDrag = event.button === 2 || event.shiftKey;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' && this.enableTouchGestures) {
        if (!this.touchPoints.has(event.pointerId)) return;
        this.touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.touchPoints.size >= 2) {
          const [first, second] = Array.from(this.touchPoints.values());
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
          if (this.lastTouchDistance > 1 && distance > 1 && this.enableZoom) {
            this.dolly(this.lastTouchDistance / distance, midpoint.x, midpoint.y);
          }
          if (this.lastTouchMidpoint && this.enablePan) {
            this.panByPixels(midpoint.x - this.lastTouchMidpoint.x,
                             midpoint.y - this.lastTouchMidpoint.y);
            this.update();
          }
          this.lastTouchDistance = distance;
          this.lastTouchMidpoint = midpoint;
        } else {
          if (this.enableRotate) this.rotateByPixels(event.clientX - this.lastX,
                                                      event.clientY - this.lastY);
          this.lastX = event.clientX;
          this.lastY = event.clientY;
          this.update();
        }
        return;
      }
      if (!this.dragging) return;
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;

      if (this.button === 1 && this.enableZoom) this.dolly(Math.exp(dy * 0.01));
      else if (this.panDrag && this.enablePan) this.panByPixels(dx, dy);
      else if (this.button === 0 && this.enableRotate) this.rotateByPixels(dx, dy);
      this.update();
    });
    const stop = event => {
      if (event.pointerType === 'touch' && this.enableTouchGestures) {
        this.touchPoints.delete(event.pointerId);
        this.lastTouchDistance = 0;
        this.lastTouchMidpoint = null;
        if (this.touchPoints.size === 1) {
          const remaining = this.touchPoints.values().next().value;
          this.lastX = remaining.x;
          this.lastY = remaining.y;
        }
      }
      this.dragging = false;
    };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('wheel', event => {
      if (!this.enableZoom) return;
      event.preventDefault();
      const pixelDelta = event.deltaY * (event.deltaMode === 1 ? 16
        : event.deltaMode === 2 ? this.canvas.clientHeight : 1);
      this.dolly(Math.exp(pixelDelta * 0.0015), event.clientX, event.clientY);
    }, { passive: false });
  }

  rotateByPixels(dx, dy) {
    this.theta -= dx * 0.01;
    this.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.phi - dy * 0.01));
  }

  panByPixels(dx, dy) {
    const speed = this.radius * 0.002;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    this.target.addScaledVector(right, -dx * speed);
    this.target.addScaledVector(up, dy * speed);
  }

  dolly(factor, clientX, clientY) {
    const nextRadius = Math.max(this.minDistance,
      Math.min(this.maxDistance, this.radius * factor));
    if (nextRadius === this.radius) return;
    let anchorBefore = null;
    let plane = null;
    const rect = this.canvas.getBoundingClientRect();
    if (this.zoomToCursor && rect.width && rect.height) {
      this.camera.updateMatrixWorld();
      plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        this.camera.getWorldDirection(new THREE.Vector3()), this.target);
      const pointer = new THREE.Vector2(
        (clientX - rect.left) / rect.width * 2 - 1,
        -(clientY - rect.top) / rect.height * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, this.camera);
      anchorBefore = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
      this.radius = nextRadius;
      this.update();
      this.camera.updateMatrixWorld();
      raycaster.setFromCamera(pointer, this.camera);
      const anchorAfter = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
      if (anchorBefore && anchorAfter) this.target.add(anchorBefore.sub(anchorAfter));
    } else {
      this.radius = nextRadius;
    }
    this.update();
  }

  update() {
    if (!this.started) {
      const offset = this.camera.position.clone().sub(this.target);
      this.radius = offset.length();
      this.theta = Math.atan2(offset.x, offset.z);
      this.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / this.radius)));
      this.started = true;
    }
    const side = this.radius * Math.sin(this.phi);
    this.camera.position.set(
      this.target.x + side * Math.sin(this.theta),
      this.target.y + this.radius * Math.cos(this.phi),
      this.target.z + side * Math.cos(this.theta)
    );
    this.camera.lookAt(this.target);
  }
}

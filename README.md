# Interactive Computer Graphics CV

A responsive personal CV containing four interactive computer graphics demonstrations. The project runs directly in the browser with HTML, CSS, and JavaScript and does not require a build step.

## Graphics demonstrations

### Image Sprite

A 24-bit PNG sprite transformed with CSS.

- Move with the arrow keys or `W` `A` `S` `D`
- Rotate with `Q` / `E`
- Scale with `-` / `+`
- Use the on-screen controls on mouse and touch devices

### Raster Canvas

A 32 × 32 smile sprite drawn directly into an `ImageData` RGBA buffer.

- Move the pointer over the canvas to position the sprite
- Hold `←` / `→` to rotate
- Hold `↑` / `↓` to scale
- Rotation, scaling, pixel placement, and sprite decoding are implemented in JavaScript

### Paint Canvas

A raster paint program that writes every result into an `ImageData` buffer without Canvas path-drawing functions or external libraries.

- Pencil and eraser tools
- Line, rectangle, and ellipse tools
- Color palette and selectable brush widths
- Clear canvas control
- Bresenham line and midpoint ellipse algorithms

### 3D Suzanne

The standard Blender Suzanne mesh rendered from exported triangle vertices with Three.js.

- 968 triangles and 2,904 vertices
- White `MeshStandardMaterial` with directional lighting
- Automatic rotation with pause/play control
- Drag or use the arrow keys to rotate
- Scroll, `+`, `-`, or the on-screen controls to zoom
- Reset control

## Project structure

```text
.
├── index.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── images/
│   │   └── star-sprite.png
│   └── js/
│       ├── script.js
│       ├── paint-demo.js
│       ├── raster-graphics.js
│       ├── suzanne-3d.js
│       └── suzanne-vertices.js
└── demos/
    ├── paint-demo.html
    ├── raster-graphics.html
    └── suzanne-3d.html
```

## Running locally

Serve the project directory with any static HTTP server, then open `index.html`. An HTTP server is required for the ES module used by the Three.js demonstration.

For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select the `main` branch and `/ (root)` directory.
4. Save the configuration.

The site has no build step. Three.js is loaded as a pinned ES module from jsDelivr.

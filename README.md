# Portfolio GitHub Pages site

`index.html` is the full-screen 3D Portfolio Room and the home page of this static site. The three buttons in its top-right corner switch day/night lighting, zoom to the nine clickable project books, and download the Blender model. The former `portfolio-room/index.html` URL redirects back to the home page so older links still work.

| Path | Page |
| --- | --- |
| `index.html` | Interactive 3D Portfolio Room |
| `paint-canvas/index.html` | Paint Canvas |
| `raster-canvas/index.html` | Raster Canvas |
| `model-studies/index.html` | Model Studies menu (third book, after Raster) |
| `suzanne-3d/index.html` | 3D Suzanne |
| `bent-plywood-chair/index.html` | Bent Plywood Chair |
| `lighting-set/index.html` | Lighting Studies menu |
| `materials-set/index.html` | Material Studies menu |
| `shader-set/index.html` | Shader Studies menu |
| `obj-loader/index.html` | OBJ Loader |
| `vertex-color/index.html` | Vertex Color + Blender source |
| `vertex-color-web/index.html` | VertexColor Web |
| `vertex-uv-texture/index.html` | Vertex + UV + Tex |

The Lighting, Materials, and Shader menus link to their individual demonstrations. Every project page links back to the room. The room model, embedded GLB copy for local-file access, Blender source, and font live in `portfolio-room/`; shared page styles and orbit controls live at the site root.

Publish the **contents** of this directory at the root of a GitHub Pages site. The site needs no build step. For a local preview, run `python3 -m http.server 8000 --directory github-pages` from the parent directory and open `http://localhost:8000/`. Three.js and some project assets load from external CDNs and require an internet connection.

The four model studies use a credited Low Poly Fox from Sketchfab via the Khronos asset mirror. Source, OBJ, vertex-colored Blender/PLY files, texture, embedded data for file access and rebuild script are in `model-studies/`. See `model-studies/CREDITS.md`.

`room-showcase/index.html` shows the Blender room with orbit/zoom controls. Material Studies includes `character-pbr.html`, an original Blender-modeled metallic robot character with a studio reflection environment and metalness/roughness controls.

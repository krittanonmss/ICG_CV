# Low Poly Fox

Source on Sketchfab: https://sketchfab.com/3d-models/low-poly-fox-by-pixelmannen-animated-371dea88d7e04a76af5763f2a36866bc

Downloaded from the authorized Khronos sample asset mirror:
https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox

- Model: PixelMannen, CC0 1.0. https://opengameart.org/content/fox-and-shiba
- Rigging and animation: tomkranis, CC BY 4.0.
- Conversion to glTF: AsoboStudio and scurest, CC BY 4.0.
- License: https://creativecommons.org/licenses/by/4.0/

Changes for these studies: baked static pose, centered/rescaled mesh, exported OBJ and PLY, painted a separate blue/cyan/purple palette directly into vertex colors and created a Blender file with a vertex-color material. The original GLB is kept as source-fox.glb. No animation is used in the derived static demonstrations.

Pages: OBJ Loader parses the OBJ; Vertex Color includes the Blender and PLY deliverables; VertexColor Web renders the color attribute; Vertex + UV + Tex renders the original texture using the UV attribute.

## Damaged Helmet (second OBJ model)

Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DamagedHelmet

- Original model: theblueturtle_, CC BY-NC 4.0 (noncommercial). https://creativecommons.org/licenses/by-nc/4.0/
- Rebuild and glTF conversion: ctxwing, CC BY 4.0.
- Changes: normalized/centered static geometry and exported OBJ with vertex normals, rendered without the original PBR textures for the OBJ Loader exercise.
- Original GLB: source-helmet.glb. Converted file: helmet.obj. Rebuild: build-helmet.py.

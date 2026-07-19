# CV — GitHub Pages

A responsive personal CV with an Interactive Computer Graphics transformation demo.

## Project structure

```text
.
├── index.html
├── assets/
│   ├── css/styles.css
│   ├── images/star-sprite.png
│   └── js/
│       ├── script.js
│       └── paint-demo.js
└── demos/
    ├── raster-graphics.html
    └── paint-demo.html
```

## Controls

- Translate: Arrow keys or `W` `A` `S` `D`
- Rotate: `Q` / `E`
- Scale: `-` / `+`
- The on-screen controls work on touch devices too.
- Use the tabs in the Graphics section to switch between Image Sprite, Raster Canvas, and Paint Canvas.

## Publish on GitHub Pages

1. Push these files to a GitHub repository.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your main branch and the `/ (root)` folder, then click **Save**.

The site uses only HTML, CSS, and JavaScript, so no build step is required.

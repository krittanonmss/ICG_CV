const sprite = document.querySelector('#sprite');
const playground = document.querySelector('#playground');
const positionLabel = document.querySelector('#position');
const rotationLabel = document.querySelector('#rotation');
const scaleLabel = document.querySelector('#scale');

const initialState = { x: 0, y: 0, rotation: 0, scale: 1 };
let state = { ...initialState };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function render() {
  state.x = clamp(state.x, -playground.clientWidth * .36, playground.clientWidth * .36);
  state.y = clamp(state.y, -playground.clientHeight * .32, playground.clientHeight * .32);
  sprite.style.transform = `translate(calc(-50% + ${state.x}px), calc(-50% + ${state.y}px)) rotate(${state.rotation}deg) scale(${state.scale})`;
  positionLabel.textContent = `X ${Math.round(state.x)} · Y ${Math.round(state.y)}`;
  rotationLabel.textContent = `ROT ${state.rotation}°`;
  scaleLabel.textContent = `SCALE ${Math.round(state.scale * 100)}%`;
}

function perform(action) {
  const move = 16;
  if (action === 'up') state.y -= move;
  if (action === 'down') state.y += move;
  if (action === 'left') state.x -= move;
  if (action === 'right') state.x += move;
  if (action === 'rotate-left') state.rotation -= 10;
  if (action === 'rotate-right') state.rotation += 10;
  if (action === 'scale-down') state.scale = clamp(state.scale - .1, .3, 2);
  if (action === 'scale-up') state.scale = clamp(state.scale + .1, .3, 2);
  render();
}

const keyActions = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
  q: 'rotate-left', Q: 'rotate-left',
  e: 'rotate-right', E: 'rotate-right',
  '-': 'scale-down', _: 'scale-down',
  '+': 'scale-up', '=': 'scale-up'
};

window.addEventListener('keydown', (event) => {
  const action = keyActions[event.key];
  if (!action) return;
  event.preventDefault();
  perform(action);
});

document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('click', () => {
    perform(button.dataset.action);
    playground.focus({ preventScroll: true });
  });
});

document.querySelector('#reset').addEventListener('click', () => {
  state = { ...initialState };
  render();
  playground.focus({ preventScroll: true });
});

window.addEventListener('resize', render);
render();

const tabs = document.querySelectorAll('[role="tab"]');
const tabPanels = document.querySelectorAll('[role="tabpanel"]');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    tabPanels.forEach((panel) => {
      const selected = panel.id === tab.dataset.tab;
      panel.classList.toggle('active', selected);
      panel.hidden = !selected;
    });
    document.querySelector('.graphics-intro p').textContent = tab.dataset.tab === 'image-panel'
      ? 'Use the controls to translate, rotate, and scale a 24-bit RGB image sprite.'
      : tab.dataset.tab === 'raster-panel'
        ? 'Draw and transform a 24-bit RGB rocket directly on a raster canvas.'
        : 'Draw freely with pencil, eraser, line, rectangle, and ellipse tools.';
    document.querySelector('#reset').hidden = tab.dataset.tab !== 'image-panel';
    if (tab.dataset.tab === 'image-panel') playground.focus({ preventScroll: true });
    else document.querySelector(tab.dataset.tab === 'raster-panel' ? '#raster-frame' : '#paint-frame').focus();
  });
});

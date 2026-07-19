(() => {
  'use strict';
  const canvas = document.querySelector('#paint-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const palette = document.querySelector('#palette');
  const currentColor = document.querySelector('#current-color');
  const toolStatus = document.querySelector('#tool-status');
  const colors = ['#172033','#667085','#ffffff','#e5484d','#30a46c','#3157d5','#f5d90a','#f76808','#8e4ec6','#d6409f','#12a594','#8d6e63'];
  const names = { pencil:'Pencil', eraser:'Eraser', line:'Line', rectangle:'Rectangle', ellipse:'Ellipse' };
  let tool = 'pencil';
  let color = colors[0];
  let width = 2;
  let drawing = false;
  let start = null;
  let last = null;
  let snapshot = null;

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x:(event.clientX-rect.left)*canvas.width/rect.width, y:(event.clientY-rect.top)*canvas.height/rect.height };
  }
  function configure() {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
  }
  function freehand(from,to) {
    configure(); ctx.beginPath(); ctx.moveTo(from.x,from.y); ctx.lineTo(to.x,to.y); ctx.stroke();
  }
  function shape(end) {
    configure();
    const x=Math.min(start.x,end.x), y=Math.min(start.y,end.y);
    const w=Math.abs(end.x-start.x), h=Math.abs(end.y-start.y);
    ctx.beginPath();
    if(tool==='line'){ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);}
    if(tool==='rectangle')ctx.rect(x,y,w,h);
    if(tool==='ellipse'&&w&&h)ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);
    ctx.stroke();
  }
  function restore(){ if(snapshot)ctx.putImageData(snapshot,0,0); }
  canvas.addEventListener('pointerdown', event => {
    if(event.pointerType==='mouse'&&event.button!==0)return;
    event.preventDefault(); drawing=true; start=last=point(event); canvas.setPointerCapture(event.pointerId);
    if(['line','rectangle','ellipse'].includes(tool))snapshot=ctx.getImageData(0,0,canvas.width,canvas.height);
    else freehand(last,{x:last.x+.01,y:last.y+.01});
  });
  canvas.addEventListener('pointermove', event => {
    if(!drawing)return; event.preventDefault(); const now=point(event);
    if(['pencil','eraser'].includes(tool)){freehand(last,now);last=now;}else{restore();shape(now);}
  });
  function finish(event){
    if(!drawing)return;
    if(['line','rectangle','ellipse'].includes(tool)){restore();shape(point(event));}
    drawing=false; snapshot=start=last=null;
  }
  canvas.addEventListener('pointerup',finish);
  canvas.addEventListener('pointercancel',finish);
  document.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>{
    tool=button.dataset.tool;
    document.querySelectorAll('[data-tool]').forEach(item=>item.classList.toggle('active',item===button));
    toolStatus.textContent=names[tool];
  }));
  document.querySelectorAll('[data-width]').forEach(button=>button.addEventListener('click',()=>{
    width=Number(button.dataset.width);
    document.querySelectorAll('[data-width]').forEach(item=>item.classList.toggle('active',item===button));
  }));
  colors.forEach((value,index)=>{
    const button=document.createElement('button'); button.className=`swatch${index===0?' active':''}`; button.style.background=value; button.title=value;
    button.addEventListener('click',()=>{color=value;currentColor.style.background=value;currentColor.title=value;document.querySelectorAll('.swatch').forEach(item=>item.classList.toggle('active',item===button));});
    palette.appendChild(button);
  });
  document.querySelector('#clear-canvas').addEventListener('click',()=>ctx.clearRect(0,0,canvas.width,canvas.height));
})();

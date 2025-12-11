const canvas = document.getElementById('plot');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const el = id => document.getElementById(id);
const wS = el('w'), bS = el('b'), lrS = el('lr'), sigmoidCB = el('sigmoid');
const wVal = el('wVal'), bVal = el('bVal'), lrVal = el('lrVal');
const lossEl = el('loss'), accEl = el('acc');
const randBtn = el('rand'), gdBtn = el('gd'), stopBtn = el('stop'), resetBtn = el('reset');
const optBtns = [el('opt0'), el('opt1'), el('opt2')];
const newQuizBtn = el('newQuiz'), revealBtn = el('reveal'), explainEl = el('explain');

let data = [];
let w = parseFloat(wS.value), b = parseFloat(bS.value), lr = parseFloat(lrS.value);
let anim = null;
let quizOptions = null; // [{w,b,loss}...]
let selectedOpt = -1;
let revealed = false;

function generateData(n=40){
  data = [];
  for(let i=0;i<n;i++){
    const x = (Math.random()*6)-3; // [-3,3]
    const y = 1.8*x + (Math.random()*1.6-0.8); // linear with noise
    const label = y>0 ? 1 : 0;
    data.push({x,y,label});
  }
}

function model(x){ return w*x + b; }
function sigmoid(z){ return 1/(1+Math.exp(-z)); }

function toCanvasX(x){ return (x+3)/6 * W; }
function toCanvasY(y){ return H - ((y+6)/12 * H); }

function draw(){
  ctx.clearRect(0,0,W,H);
  // axes
  ctx.strokeStyle = '#eee'; ctx.lineWidth=1; ctx.beginPath();
  ctx.moveTo(0, toCanvasY(0)); ctx.lineTo(W, toCanvasY(0));
  ctx.moveTo(toCanvasX(0), 0); ctx.lineTo(toCanvasX(0), H);
  ctx.stroke();

  // points
  for(const p of data){
    const cx = toCanvasX(p.x), cy = toCanvasY(p.y);
    if(sigmoidCB.checked){
      ctx.fillStyle = p.label? '#ff00ff' : '#00ffff';
    } else {
      ctx.fillStyle = '#7fffd4';
    }
    // glow effect
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fill();
    // outer ring
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.5; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(cx,cy,7,0,Math.PI*2); ctx.stroke();
  }

  // line
  const x1 = -3, x2 = 3;
  const y1 = model(x1), y2 = model(x2);
  ctx.strokeStyle = '#7fffd4'; ctx.lineWidth=2; ctx.beginPath();
  ctx.moveTo(toCanvasX(x1), toCanvasY(y1)); ctx.lineTo(toCanvasX(x2), toCanvasY(y2)); ctx.stroke();

  // draw quiz candidate lines (faint)
  if(quizOptions){
    for(let i=0;i<quizOptions.length;i++){
      const q = quizOptions[i];
      ctx.lineWidth = (revealed && i===quizOptions.bestIndex)? 3 : 1.2;
      ctx.strokeStyle = (revealed && i===quizOptions.bestIndex)? 'rgba(24,150,80,0.95)' : 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.moveTo(toCanvasX(x1), toCanvasY(q.w*x1+q.b)); ctx.lineTo(toCanvasX(x2), toCanvasY(q.w*x2+q.b)); ctx.stroke();
    }
  }

  // sigmoid curve overlay if checked
  if(sigmoidCB.checked){
    ctx.beginPath(); ctx.lineWidth=2; ctx.strokeStyle='#7fffd4';
    for(let i=0;i<=200;i++){
      const sx = -3 + (i/200)*6; const p = sigmoid(model(sx));
      const cx = toCanvasX(sx), cy = toCanvasY((p*12)-6);
      if(i===0) ctx.moveTo(cx,cy); else ctx.lineTo(cx,cy);
    }
    ctx.stroke();
    // threshold line at p=0.5
    const ty = toCanvasY((0.5*12)-6);
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(0,ty); ctx.lineTo(W,ty); ctx.stroke(); ctx.setLineDash([]);
  }

  // update UI
  wVal.textContent = w.toFixed(2); bVal.textContent = b.toFixed(2); lrVal.textContent = lr.toFixed(3);
  const metrics = computeMetrics();
  lossEl.textContent = `Loss: ${metrics.loss.toFixed(4)}`;
  accEl.textContent = `Accuracy: ${('acc' in metrics)? (metrics.acc*100).toFixed(1)+'%' : '—'}`;
}

function computeMetrics(){
  const N = data.length;
  if(sigmoidCB.checked){
    let loss=0, correct=0;
    for(const p of data){
      const z = model(p.x); const prob = sigmoid(z);
      const y = p.label;
      const eps = 1e-9; const clipped = Math.min(Math.max(prob, eps), 1-eps);
      loss += -(y*Math.log(clipped) + (1-y)*Math.log(1-clipped));
      if((prob>=0.5) === (y===1)) correct++;
    }
    return {loss: loss/N, acc: correct/N};
  } else {
    let loss=0;
    for(const p of data){ const pred = model(p.x); loss += Math.pow(pred - p.y, 2); }
    return {loss: loss/data.length};
  }
}

function gdStep(){
  const N = data.length;
  let dw=0, db=0;
  if(sigmoidCB.checked){
    for(const p of data){ const z=model(p.x), pred=sigmoid(z); const err = pred - p.label; dw += err * p.x; db += err; }
    dw /= N; db /= N;
  } else {
    for(const p of data){ const pred = model(p.x); const err = pred - p.y; dw += err * p.x; db += err; }
    dw = (2/N)*dw; db = (2/N)*db;
  }
  // Clip gradients to prevent explosion
  const maxGrad = 10;
  dw = Math.max(Math.min(dw, maxGrad), -maxGrad);
  db = Math.max(Math.min(db, maxGrad), -maxGrad);
  w -= lr * dw; b -= lr * db;
}

function startAutoGD(){ if(anim) return; let steps=0; function step(){ gdStep(); const m = computeMetrics(); if(isNaN(m.loss) || m.loss > 1e6){ stopAutoGD(); return; } draw(); steps++; if(steps<10000 && anim) anim = requestAnimationFrame(step); else anim = null; } anim = requestAnimationFrame(step); }
function stopAutoGD(){ if(anim){ cancelAnimationFrame(anim); anim=null; } }

// events
wS.addEventListener('input', e=>{ w = parseFloat(e.target.value); draw(); });
bS.addEventListener('input', e=>{ b = parseFloat(e.target.value); draw(); });
lrS.addEventListener('input', e=>{ lr = parseFloat(e.target.value); draw(); });
sigmoidCB.addEventListener('change', e=>{ draw(); });
randBtn.addEventListener('click', ()=>{ generateData(); draw(); });
gdBtn.addEventListener('click', ()=>{ startAutoGD(); });
stopBtn.addEventListener('click', ()=>{ stopAutoGD(); });
resetBtn.addEventListener('click', ()=>{ w = 1; b = 0; wS.value = w; bS.value = b; draw(); });

// Quiz logic
function computeLossForCandidate(cw, cb){
  if(sigmoidCB.checked){
    let loss=0; const N=data.length; const eps=1e-9;
    for(const p of data){ const prob = sigmoid(cw*p.x + cb); const y=p.label; const c = Math.min(Math.max(prob, eps), 1-eps); loss += -(y*Math.log(c) + (1-y)*Math.log(1-c)); }
    return loss/N;
  } else {
    let loss=0; for(const p of data){ const pred = cw*p.x + cb; loss += Math.pow(pred - p.y, 2); } return loss/data.length;
  }
}

function generateQuiz(){
  quizOptions = [];
  // sample three candidates near random slopes/biases
  for(let i=0;i<3;i++){
    const cw = (Math.random()*10)-5; const cb = (Math.random()*8)-4; const loss = computeLossForCandidate(cw, cb);
    quizOptions.push({w:cw,b:cb,loss:loss});
  }
  // determine best (smallest loss)
  let best = 0; for(let i=1;i<quizOptions.length;i++) if(quizOptions[i].loss < quizOptions[best].loss) best = i; quizOptions.bestIndex = best;
  selectedOpt = -1; revealed = false; explainEl.textContent='';
  // update option labels
  for(let i=0;i<3;i++){ optBtns[i].textContent = `${String.fromCharCode(65+i)}: w=${quizOptions[i].w.toFixed(2)}, b=${quizOptions[i].b.toFixed(2)}`; optBtns[i].className='opt'; }
  draw();
}

for(let i=0;i<optBtns.length;i++){
  optBtns[i].addEventListener('click', ()=>{ selectedOpt = i; for(let j=0;j<optBtns.length;j++){ optBtns[j].classList.toggle('selected', j===selectedOpt); } });
}

newQuizBtn.addEventListener('click', ()=>{ generateQuiz(); });
revealBtn.addEventListener('click', ()=>{
  if(!quizOptions) return; revealed = true;
  const best = quizOptions.bestIndex; for(let i=0;i<optBtns.length;i++){
    optBtns[i].classList.remove('selected'); optBtns[i].classList.remove('correct'); optBtns[i].classList.remove('wrong');
    if(i===best) optBtns[i].classList.add('correct');
    else if(i===selectedOpt) optBtns[i].classList.add('wrong');
  }
  const metricName = sigmoidCB.checked? 'cross-entropy' : 'MSE';
  explainEl.textContent = `Answer: Option ${String.fromCharCode(65+best)} is best by ${metricName} (score ${quizOptions[best].loss.toFixed(4)}).`;
  draw();
});

// Create an initial quiz
generateQuiz();

// initialize
generateData(); draw();

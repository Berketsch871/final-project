const canvas = document.getElementById('plot');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const el = id => document.getElementById(id);
const wS = el('w'), bS = el('b'), lrS = el('lr'), sigmoidCB = el('sigmoid');
const wVal = el('wVal'), bVal = el('bVal'), lrVal = el('lrVal');
const lossEl = el('loss'), accEl = el('acc');
const randBtn = el('rand'), gdBtn = el('gd'), stopBtn = el('stop'), resetBtn = el('reset');
const questionEl = el('question');
const quizContainerEl = el('quizContainer');
const checkAllBtn = el('checkAllAnswers'), newQuestionsBtn = el('newQuestions'), explainEl = el('explain');

let data = [];
let w = parseFloat(wS.value), b = parseFloat(bS.value), lr = parseFloat(lrS.value);
let anim = null;
let currentQIdx = 0;
let selectedAns = -1;
let answered = false;

const questions = [
  {
    q: "What does MSE (Mean Squared Error) measure?",
    opts: ["A) Average distance from line to points", "B) Accuracy of predictions", "C) Learning rate", "D) Weight updates"],
    ans: 0,
    explain: "MSE measures the average squared distance between predicted and actual values. Lower MSE = better fit."
  },
  {
    q: "What does the sigmoid function do?",
    opts: ["A) Finds the best fit line", "B) Maps any value to 0-1 probability", "C) Calculates loss", "D) Randomizes data"],
    ans: 1,
    explain: "Sigmoid (σ(z) = 1/(1+e^-z)) converts any input to a probability between 0 and 1, useful for classification."
  },
  {
    q: "What does learning rate control?",
    opts: ["A) How fast weights update per step", "B) Number of data points", "C) The bias value", "D) Canvas size"],
    ans: 0,
    explain: "Learning rate (lr) is the step size. Higher lr = bigger jumps (risky), lower lr = smaller steps (careful)."
  },
  {
    q: "What is gradient descent doing?",
    opts: ["A) Plotting random points", "B) Iteratively updating weights to minimize loss", "C) Changing the data", "D) Applying sigmoid"],
    ans: 1,
    explain: "Gradient descent moves weights in the direction that reduces loss, step by step."
  },
  {
    q: "In classification mode, what loss is used?",
    opts: ["A) MSE (Mean Squared Error)", "B) Binary Cross-Entropy", "C) Absolute Error", "D) Random loss"],
    ans: 1,
    explain: "Classification uses binary cross-entropy: -(y*log(p) + (1-y)*log(1-p)), which penalizes wrong confidences."
  },
  {
    q: "Which optimization algorithm learns by reducing loss over iterations?",
    opts: ["A) Random search", "B) Grid search", "C) Gradient descent", "D) Brute force"],
    ans: 2,
    explain: "Gradient descent uses the gradient (derivative) of the loss to iteratively improve weights."
  },
  {
    q: "What does the weight (w) parameter do in a linear model?",
    opts: ["A) Controls the y-intercept", "B) Controls the slope of the line", "C) Shuffles data points", "D) Calculates loss"],
    ans: 1,
    explain: "Weight w is the slope in the linear equation y = wx + b. It determines how steep the line is."
  },
  {
    q: "What does the bias (b) parameter do?",
    opts: ["A) Controls the slope", "B) Changes the data", "C) Shifts the line up or down (y-intercept)", "D) Randomizes predictions"],
    ans: 2,
    explain: "Bias b is the y-intercept (where the line crosses the y-axis). It shifts the entire line vertically."
  },
  {
    q: "If your learning rate is too high, what might happen?",
    opts: ["A) Training is very slow", "B) The algorithm diverges and misses the minimum", "C) Loss always increases", "D) All weights become zero"],
    ans: 1,
    explain: "High learning rates can cause overshooting, where the algorithm jumps over the optimal solution."
  },
  {
    q: "If your learning rate is too low, what is the main downside?",
    opts: ["A) The model always overfits", "B) Training is very slow but stable", "C) Weights become negative", "D) Loss explodes"],
    ans: 1,
    explain: "Low learning rates take many iterations to converge, making training slow, though more stable."
  },
  {
    q: "What is the derivative used for in gradient descent?",
    opts: ["A) To shuffle data", "B) To determine the direction and magnitude of weight updates", "C) To calculate accuracy", "D) To generate random numbers"],
    ans: 1,
    explain: "The gradient (derivative) points in the direction of steepest increase in loss, so we move opposite to it."
  },
  {
    q: "What does 'overfitting' mean?",
    opts: ["A) Model fits training data too perfectly, poor generalization", "B) Model is underfitted", "C) Loss is too low", "D) Weights are too large"],
    ans: 0,
    explain: "Overfitting occurs when a model learns the training data too well, including noise, failing on new data."
  },
  {
    q: "What happens when you increase the weight (w) in a linear model?",
    opts: ["A) The line becomes horizontal", "B) The line becomes steeper", "C) The line disappears", "D) The data shifts"],
    ans: 1,
    explain: "Increasing w increases the slope, making the line steeper and changes its fit to the data."
  },
  {
    q: "In the model y = wx + b, which parameter is independent?",
    opts: ["A) y (output)", "B) x (input)", "C) w (weight)", "D) b (bias)"],
    ans: 1,
    explain: "x is the input feature; we don't change it. w and b are parameters we learn."
  },
  {
    q: "What is a good sign that your model is learning?",
    opts: ["A) Loss increases each step", "B) Loss decreases over iterations", "C) Loss stays constant", "D) Weights stay at zero"],
    ans: 1,
    explain: "Decreasing loss indicates the model is improving and making better predictions."
  },
  {
    q: "What does cross-entropy loss measure in classification?",
    opts: ["A) The difference between true and predicted probabilities", "B) The slope of the line", "C) The number of features", "D) The distance to the origin"],
    ans: 0,
    explain: "Cross-entropy measures how wrong your predicted probabilities are compared to the true labels."
  },
  {
    q: "If sigmoid outputs 0.9 and the true label is 1, is the model confident?",
    opts: ["A) No, it's unsure", "B) Yes, it's very confident and correct", "C) No, it's wrong", "D) Yes, confidence doesn't matter"],
    ans: 1,
    explain: "0.9 is a high probability for class 1, so the model is confident and correct in its prediction."
  },
  {
    q: "What is a gradient?",
    opts: ["A) A color shade", "B) The derivative of loss with respect to weights", "C) The learning rate", "D) A type of data point"],
    ans: 1,
    explain: "A gradient is the vector of partial derivatives telling us how loss changes for each weight."
  },
  {
    q: "In linear regression, which metric is commonly minimized?",
    opts: ["A) Accuracy", "B) Mean Squared Error (MSE)", "C) Precision", "D) Recall"],
    ans: 1,
    explain: "MSE is the standard loss function for regression problems."
  },
  {
    q: "What does regularization help prevent?",
    opts: ["A) Underfitting", "B) Learning rate issues", "C) Overfitting", "D) Convergence"],
    ans: 2,
    explain: "Regularization adds a penalty to large weights, discouraging overfitting."
  },
  {
    q: "How does negative slope look on a graph?",
    opts: ["A) Line goes up left to right", "B) Line goes down left to right", "C) Horizontal line", "D) No change"],
    ans: 1,
    explain: "Negative slope (w < 0) means the line decreases as x increases."
  },
  {
    q: "What is the range of sigmoid output?",
    opts: ["A) [-1, 1]", "B) [0, 1]", "C) [-∞, ∞]", "D) [0, 100]"],
    ans: 1,
    explain: "Sigmoid always outputs between 0 and 1, making it perfect for probabilities."
  },
  {
    q: "If you plot loss vs. iterations and it oscillates wildly, what might be wrong?",
    opts: ["A) Learning rate is too low", "B) Learning rate is too high", "C) Data is perfect", "D) Weights are random"],
    ans: 1,
    explain: "Wild oscillations indicate the learning rate is too large, causing overshooting."
  },
  {
    q: "What is batch gradient descent?",
    opts: ["A) Using one sample at a time", "B) Using all samples to compute gradients", "C) Randomizing samples", "D) Stopping after one iteration"],
    ans: 1,
    explain: "Batch GD computes gradients on the entire dataset before updating weights (most stable)."
  },
  {
    q: "In the sigmoid function, what does the linear part (wx + b) represent?",
    opts: ["A) The probability output", "B) The input to sigmoid, before squashing to [0,1]", "C) The loss", "D) The gradient"],
    ans: 1,
    explain: "The linear part wx + b is passed through sigmoid to produce the probability."
  },
  {
    q: "If two models have MSE values 0.5 and 0.3, which is better?",
    opts: ["A) Both are equal", "B) 0.5 is better", "C) 0.3 is better", "D) Can't tell without context"],
    ans: 2,
    explain: "Lower MSE is better, so 0.3 < 0.5 means the second model fits better."
  },
  {
    q: "What is a local minimum?",
    opts: ["A) The starting point of training", "B) A point where loss is low but not the absolute lowest", "C) The data point closest to the origin", "D) The minimum learning rate"],
    ans: 1,
    explain: "A local minimum is a valley in the loss landscape that's lower than nearby points but not global."
  },
  {
    q: "In classification, what does a sigmoid output of 0.5 mean?",
    opts: ["A) Definitely class 0", "B) Definitely class 1", "C) Maximum uncertainty between classes", "D) Error state"],
    ans: 2,
    explain: "0.5 is the decision boundary; the model is equally uncertain about both classes."
  },
  {
    q: "What is the purpose of the bias term (b) in a model?",
    opts: ["A) To speed up training", "B) To add flexibility, shifting predictions up/down", "C) To reduce overfitting", "D) To initialize weights"],
    ans: 1,
    explain: "Bias allows the model to fit lines not passing through the origin."
  },
  {
    q: "If w = 0, what does the model output?",
    opts: ["A) Always x", "B) Always b (constant prediction)", "C) Random values", "D) Zero"],
    ans: 1,
    explain: "If w = 0, then y = 0*x + b = b, a constant prediction regardless of x."
  },
  {
    q: "What is stochastic gradient descent (SGD)?",
    opts: ["A) Using all data each step", "B) Using one random sample at a time to update weights", "C) Using random weights", "D) Stopping training randomly"],
    ans: 1,
    explain: "SGD updates weights using one (or a few) random samples, faster but noisier than batch GD."
  },
  {
    q: "In gradient descent, why do we move opposite to the gradient?",
    opts: ["A) The gradient points down", "B) The gradient points in the direction of increasing loss, so opposite decreases it", "C) It's arbitrary", "D) To go faster"],
    ans: 1,
    explain: "The gradient points towards steeper loss, so moving opposite goes downhill faster."
  },
  {
    q: "What does a flat loss curve over iterations indicate?",
    opts: ["A) Perfect convergence", "B) Training has plateaued or converged", "C) Model is diverging", "D) Data is bad"],
    ans: 1,
    explain: "A flat curve means loss isn't changing, so the model has likely converged."
  },
  {
    q: "In binary classification with sigmoid, when is the prediction positive?",
    opts: ["A) When sigmoid output > 0.5", "B) When sigmoid output < 0.5", "C) When sigmoid output = 0", "D) Always positive"],
    ans: 0,
    explain: "Standard threshold: sigmoid > 0.5 → class 1, sigmoid ≤ 0.5 → class 0."
  },
  {
    q: "What does the term 'convergence' mean in training?",
    opts: ["A) Weights become zero", "B) Loss stops decreasing significantly, weights stabilize", "C) All data becomes same", "D) Accuracy is 100%"],
    ans: 1,
    explain: "Convergence means the optimization has reached a stable point where loss isn't improving."
  },
  {
    q: "If you have more data, how does it affect model training?",
    opts: ["A) Faster training", "B) More data can help generalization but requires longer training", "C) Guarantees better accuracy", "D) No effect"],
    ans: 1,
    explain: "More data is generally good but requires more computation and iterations to process."
  },
  {
    q: "What is feature scaling?",
    opts: ["A) Changing the model type", "B) Normalizing input features to similar ranges (e.g., 0-1)", "C) Removing features", "D) Multiplying by learning rate"],
    ans: 1,
    explain: "Feature scaling helps gradient descent converge faster by keeping inputs on similar scales."
  },
  {
    q: "In the loss function for regression, why use squared error?",
    opts: ["A) It's easy to compute", "B) Penalizes large errors more than small ones", "C) Random choice", "D) It's the only option"],
    ans: 1,
    explain: "Squaring emphasizes large errors, making the model prioritize fitting worse predictions."
  },
  {
    q: "What happens when you set learning rate to 0?",
    opts: ["A) Instant convergence", "B) No weight updates occur, training doesn't happen", "C) Fastest learning", "D) Random updates"],
    ans: 1,
    explain: "Learning rate 0 means no weight changes: new_w = w - 0 * gradient = w."
  },
  {
    q: "How does a decision boundary look in 2D classification?",
    opts: ["A) A single point", "B) A line (for linear models) separating the two classes", "C) Random scatter", "D) A circle"],
    ans: 1,
    explain: "Linear models create linear decision boundaries; sigmoid with linear wx+b creates a line."
  },
  {
    q: "What is the relationship between loss and accuracy?",
    opts: ["A) They're always equal", "B) Lower loss usually means higher accuracy", "C) No relationship", "D) Higher loss = higher accuracy"],
    ans: 1,
    explain: "Generally, lower loss indicates the model is making better predictions (higher accuracy)."
  },
  {
    q: "In a 2D scatter plot, when is MSE minimized?",
    opts: ["A) When the line touches one point", "B) When the line best fits all points overall", "C) When the line is horizontal", "D) When y-intercept is 0"],
    ans: 1,
    explain: "MSE is minimized when the line balances predictions across all points, not just touching one."
  },
  {
    q: "What is the impact of adding a constant to all weights?",
    opts: ["A) Loss stays the same", "B) Loss usually increases", "C) Model converges faster", "D) No impact on predictions"],
    ans: 1,
    explain: "Adding a constant to weights changes predictions and usually increases loss (unless offset by bias)."
  },
  {
    q: "When using sigmoid, how do you interpret sigmoid output 0.7?",
    opts: ["A) 70% confident it's class 0", "B) 70% confident it's class 1", "C) 70% accuracy", "D) 70% loss"],
    ans: 1,
    explain: "Sigmoid 0.7 ≈ 70% probability of class 1, so the model predicts class 1 with 70% confidence."
  },
  {
    q: "What could cause a model to have high training loss but train anyway?",
    opts: ["A) Bug in code", "B) Loss is decreasing despite high absolute value", "C) Learning rate is perfect", "D) No parameters to learn"],
    ans: 1,
    explain: "High absolute loss can still improve if it's getting smaller over iterations."
  },
  {
    q: "In linear regression y = wx + b, what is the dimension of x?",
    opts: ["A) Must be 1D (scalar)", "B) Can be any dimension", "C) Always 2D", "D) No dimensions"],
    ans: 0,
    explain: "In simple linear regression, x is a scalar input; multi-feature regression extends this."
  }
];
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
  // Clip gradients to prevent explosion (smaller clip for MSE stability)
  const maxGrad = sigmoidCB.checked ? 10 : 2;
  dw = Math.max(Math.min(dw, maxGrad), -maxGrad);
  db = Math.max(Math.min(db, maxGrad), -maxGrad);
  w -= lr * dw; b -= lr * db;
  // Update sliders to reflect new values
  wS.value = w; bS.value = b;
}

function startAutoGD(){ if(anim) return; let steps=0; function step(){ gdStep(); const m = computeMetrics(); if(isNaN(m.loss) || m.loss > 1e6){ stopAutoGD(); return; } draw(); steps++; if(steps<1000 && anim) anim = requestAnimationFrame(step); else anim = null; } anim = requestAnimationFrame(step); }
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

// Quiz rendering and logic
function shuffleArray(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function selectRandomQuestions(count = 5){
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateNewQuestions(){
  // Select 5 random questions from the pool
  const selected = selectRandomQuestions(5);
  
  // Create deep copies and shuffle options for each question
  const newQuestions = selected.map(q => {
    const copy = {
      q: q.q,
      opts: [...q.opts],
      ans: q.ans,
      explain: q.explain
    };
    
    const optWithIdx = copy.opts.map((opt, idx) => ({text: opt, origIdx: idx}));
    shuffleArray(optWithIdx);
    
    // Update correct answer index to match new order
    const newAnsIdx = optWithIdx.findIndex(o => o.origIdx === copy.ans);
    copy.opts = optWithIdx.map(o => o.text);
    copy.ans = newAnsIdx;
    delete copy.selected;
    
    return copy;
  });
  
  return newQuestions;
}

let currentQuestions = generateNewQuestions();

function renderAllQuestions(){
  explainEl.textContent = '';
  quizContainerEl.innerHTML = '';
  
  for(let qIdx = 0; qIdx < currentQuestions.length; qIdx++){
    const q = currentQuestions[qIdx];
    const qItem = document.createElement('div');
    qItem.className = 'quiz-item';
    
    const qText = document.createElement('div');
    qText.className = 'question-text';
    qText.textContent = `Q${qIdx + 1}. ${q.q}`;
    qItem.appendChild(qText);
    
    const optsDiv = document.createElement('div');
    optsDiv.className = 'opts';
    for(let i = 0; i < q.opts.length; i++){
      const btn = document.createElement('button');
      btn.className = 'opt';
      btn.textContent = q.opts[i];
      const qidx = qIdx;
      btn.addEventListener('click', () => { 
        currentQuestions[qidx].selected = i; 
        for(let j = 0; j < optsDiv.children.length; j++) 
          optsDiv.children[j].classList.toggle('selected', j === i); 
      });
      optsDiv.appendChild(btn);
    }
    qItem.appendChild(optsDiv);
    quizContainerEl.appendChild(qItem);
  }
}

function checkAllAnswers(){
  let correct = 0;
  const optsElems = document.querySelectorAll('.quiz-item');
  
  for(let i = 0; i < currentQuestions.length; i++){
    const q = currentQuestions[i];
    const qItem = optsElems[i];
    const opts = qItem.querySelectorAll('.opt');
    
    // Clear all classes
    for(let j = 0; j < opts.length; j++){
      opts[j].classList.remove('selected', 'correct', 'wrong');
    }
    
    // Show correct answer
    opts[q.ans].classList.add('correct');
    
    // Show selected answer if wrong
    if(q.selected !== undefined && q.selected !== q.ans){
      opts[q.selected].classList.add('wrong');
    }
    
    // Count correct
    if(q.selected === q.ans) correct++;
  }
  
  explainEl.textContent = `You got ${correct}/${currentQuestions.length} correct!`;
}

checkAllBtn.addEventListener('click', checkAllAnswers);

newQuestionsBtn.addEventListener('click', () => {
  currentQuestions = generateNewQuestions();
  explainEl.textContent = '';
  renderAllQuestions();
});

// initialize
generateData(); draw(); renderAllQuestions();

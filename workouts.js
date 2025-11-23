// workouts.js
// Uses simple REST endpoints if available, else falls back to localStorage
const API_BASE = '/api'; // <-- change if your Node API uses different base

const useApi = true; // set to false to force localStorage (for dev / offline)

function apiAvailable(){
  // naive check; in production you'd handle 401/500 carefully
  return useApi;
}

// storage helpers
const STORAGE_KEY = 'ft_workouts_v1';

function readLocal(){
  const txt = localStorage.getItem(STORAGE_KEY);
  return txt ? JSON.parse(txt) : [];
}
function writeLocal(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

async function fetchWorkouts(){
  if(apiAvailable()){
    try{
      const res = await fetch(`${API_BASE}/workouts`);
      if(!res.ok) throw new Error('API error');
      return await res.json();
    }catch(e){
      console.warn('API unavailable — falling back to localStorage', e);
      return readLocal();
    }
  }
  return readLocal();
}

async function saveWorkout(payload){
  if(apiAvailable()){
    try{
      const res = await fetch(`${API_BASE}/workouts`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error('API save failed');
      return await res.json();
    }catch(e){
      console.warn('Save to API failed — saving locally', e);
      const arr = readLocal();
      payload.id = Date.now();
      arr.unshift(payload);
      writeLocal(arr);
      return payload;
    }
  }else{
    const arr = readLocal();
    payload.id = Date.now();
    arr.unshift(payload);
    writeLocal(arr);
    return payload;
  }
}

async function deleteWorkout(id){
  if(apiAvailable()){
    try{
      const res = await fetch(`${API_BASE}/workouts/${id}`, {method:'DELETE'});
      if(res.ok) return true;
      throw new Error('Delete failed');
    }catch(e){
      console.warn('Delete API failed — deleting locally', e);
    }
  }
  const arr = readLocal().filter(w => w.id !== id);
  writeLocal(arr);
  return true;
}

// UI wiring
const form = document.getElementById('workoutForm');
const list = document.getElementById('workoutsList');
const clearBtn = document.getElementById('clearBtn');

async function renderList(){
  const data = await fetchWorkouts();
  list.innerHTML = '';
  if(!data.length){
    list.innerHTML = '<li class="workout-item">No workouts yet — add your first!</li>';
    return;
  }
  data.forEach(item => {
    const li = document.createElement('li');
    li.className = 'workout-item';
    li.innerHTML = `
      <div>
        <div style="font-weight:700">${item.exercise} <span style="font-weight:400;color:#6b7280">(${item.date})</span></div>
        <div style="font-size:13px;color:#374151">${item.sets} sets × ${item.reps} reps • ${item.duration} min</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-sm" data-id="${item.id}" data-action="delete">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });
}

list.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = Number(btn.dataset.id);
  if(btn.dataset.action === 'delete'){
    if(confirm('Delete this workout?')){
      await deleteWorkout(id);
      await renderList();
    }
  }
});

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const payload = {
    exercise: document.getElementById('exercise').value.trim(),
    sets: Number(document.getElementById('sets').value),
    reps: Number(document.getElementById('reps').value),
    duration: Number(document.getElementById('duration').value),
    date: document.getElementById('date').value || new Date().toISOString().slice(0,10)
  };
  await saveWorkout(payload);
  form.reset();
  document.getElementById('date').value = '';
  await renderList();
});

clearBtn.addEventListener('click', () => {
  if(confirm('Clear the form?')) form.reset();
});

renderList();

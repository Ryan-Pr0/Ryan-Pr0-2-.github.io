// dashboard.js
const API_BASE = '/api';
const useApi = true;
const STORAGE_KEY = 'ft_workouts_v1';

async function fetchWorkouts(){
  if(useApi){
    try{
      const res = await fetch(`${API_BASE}/workouts`);
      if(!res.ok) throw new Error('api failure');
      return await res.json();
    }catch(e){
      console.warn('API failed, falling back to localStorage', e);
    }
  }
  const txt = localStorage.getItem(STORAGE_KEY);
  return txt ? JSON.parse(txt) : [];
}

function summarize(workouts){
  const total = workouts.length;
  const totalMinutes = workouts.reduce((s,w)=> s + (Number(w.duration)||0),0);
  const totalHours = +(totalMinutes / 60).toFixed(2);
  const avgReps = workouts.length ? Math.round(workouts.reduce((s,w)=> s + (Number(w.reps)||0),0) / workouts.length) : 0;
  return { total, totalHours, avgReps };
}

function groupByWeekdays(workouts){
  // returns data for last 7 days
  const days = Array.from({length:7}).map((_,i)=>{
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0,10);
    return { key, label: d.toLocaleDateString(undefined, {weekday:'short'}) };
  });

  const map = {};
  days.forEach(d => map[d.key]=0);
  workouts.forEach(w=>{
    const k = w.date || new Date().toISOString().slice(0,10);
    if(k in map) map[k] += 1;
  });
  return { labels: days.map(d=>d.label), data: days.map(d=>map[d.key]||0) };
}

async function render(){
  const workouts = await fetchWorkouts();
  const s = summarize(workouts);
  document.getElementById('totalWorkouts').textContent = s.total;
  document.getElementById('totalHours').textContent = s.totalHours;
  document.getElementById('avgReps').textContent = s.avgReps;

  const grouped = groupByWeekdays(workouts);
  const ctx = document.getElementById('weekChart').getContext('2d');

  // simple Chart.js line
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: grouped.labels,
      datasets: [{
        label: 'Workouts',
        data: grouped.data,
        fill: true,
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero:true, ticks:{ stepSize:1 } }
      }
    }
  });

  // recent list
  const recentList = document.getElementById('recentList');
  recentList.innerHTML = '';
  workouts.slice(0,6).forEach(w=>{
    const li = document.createElement('li');
    li.className = 'workout-item';
    li.innerHTML = `<div><strong>${w.exercise}</strong> <span style="color:#6b7280">• ${w.date}</span><div style="font-size:13px;color:#374151">${w.sets}×${w.reps} • ${w.duration} min</div></div>`;
    recentList.appendChild(li);
  });
}

render();

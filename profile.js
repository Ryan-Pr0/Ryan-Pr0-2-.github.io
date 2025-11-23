// profile.js
const PROFILE_KEY = 'ft_profile_v1';
const form = document.getElementById('profileForm');

function readProfile(){
  const txt = localStorage.getItem(PROFILE_KEY);
  return txt ? JSON.parse(txt) : { fullName:'', email:'', weeklyGoal:3 };
}

function writeProfile(p){
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

document.addEventListener('DOMContentLoaded', () => {
  const p = readProfile();
  document.getElementById('fullName').value = p.fullName || '';
  document.getElementById('email').value = p.email || '';
  document.getElementById('weeklyGoal').value = p.weeklyGoal || 3;
});

form.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const p = {
    fullName: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    weeklyGoal: Number(document.getElementById('weeklyGoal').value) || 0
  };
  writeProfile(p);
  alert('Profile saved locally.');
});

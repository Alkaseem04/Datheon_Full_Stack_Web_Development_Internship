'use strict';
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('nav');
const metaTheme = document.querySelector('meta[name="theme-color"]');

function setTheme(theme){
  const isDark = theme === 'dark';
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  root.dataset.theme = isDark ? 'dark' : 'light';
  if(themeIcon){
    themeIcon.textContent = isDark ? '☀' : '☾';
    themeIcon.style.transform = isDark ? 'rotate(360deg)' : 'rotate(0deg)';
  }
  if(themeToggle){
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if(metaTheme){
    metaTheme.setAttribute('content', isDark ? '#0d1422' : '#f8fafc');
  }
  try{localStorage.setItem('alkaseem-theme', isDark ? 'dark' : 'light')}catch(e){}
}

const savedTheme = localStorage.getItem('alkaseem-theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme === 'dark' ? 'dark' : (savedTheme === 'light' ? 'light' : (prefersDark ? 'dark' : 'light'));
setTheme(initialTheme);

if(themeToggle){
  themeToggle.addEventListener('click', ()=>{
    const isDark = root.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
  });
}
function closeMenu(){nav.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open navigation');menuToggle.textContent='☰'}
menuToggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');menuToggle.textContent=open?'✕':'☰'});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
document.getElementById('year').textContent=new Date().getFullYear();
const projects={"sitesync": {"title": "SiteSync AI", "description": "An AI-powered infrastructure project management application linking construction progress reports to planned schedule activities using semantic and fuzzy matching.", "features": ["AI-assisted execution report extraction", "Semantic and fuzzy schedule matching", "Planner review and progress tracking"], "tags": ["AI", "NLP", "Semantic Matching", "Web Development"]}, "mrdoc": {"title": "Mr. Doc — Medical Assistance Platform", "description": "A healthcare application with appointments, medical records, prescriptions, emergency contacts and an AI chat interface with rule-based fallback.", "features": ["Appointments and medical records", "Authentication and REST APIs", "AI chat interface with fallback"], "tags": ["React", "Node.js", "Express.js", "MongoDB"]}, "waste": {"title": "Smart Waste Segregation Monitoring System", "description": "An ESP32-powered waste monitoring prototype using ultrasonic and moisture sensors, a web dashboard, alerts and SQLite analytics.", "features": ["Sensor-based fill and moisture tracking", "Dashboard analytics and reporting", "ESP32-to-backend integration"], "tags": ["ESP32", "IoT", "React", "Node.js", "SQLite"]}, "irrigation": {"title": "Automatic Plant Irrigation System", "description": "A sensor-based irrigation system designed to monitor soil conditions and support more efficient watering decisions.", "features": ["Soil condition monitoring", "Sensor-based automation", "Reduced manual monitoring"], "tags": ["IoT", "Sensors", "Automation"]}, "mushroom": {"title": "Mushroom Classification", "description": "A classification project using structured mushroom dataset features, preprocessing and Random Forest modeling.", "features": ["Dataset preprocessing", "Random Forest classification", "Mushroom category prediction"], "tags": ["Python", "scikit-learn", "Random Forest"]}};
const dialog=document.getElementById('project-dialog');
document.querySelectorAll('.detail-btn').forEach(button=>button.addEventListener('click',()=>{const project=projects[button.dataset.project];if(!project)return;document.getElementById('dialog-title').textContent=project.title;document.getElementById('dialog-description').textContent=project.description;const list=document.getElementById('dialog-features');list.replaceChildren(...project.features.map(item=>{const li=document.createElement('li');li.textContent=item;return li}));const tags=document.getElementById('dialog-tags');tags.replaceChildren(...project.tags.map(item=>{const tag=document.createElement('span');tag.textContent=item;return tag}));dialog.showModal()}));
function closeDialog(){dialog.close()}
document.getElementById('close-dialog').addEventListener('click',closeDialog);
document.getElementById('close-dialog-bottom').addEventListener('click',closeDialog);
dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog()});
document.getElementById('contact-form').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const name=form.elements.name.value.trim(),email=form.elements.email.value.trim(),message=form.elements.message.value.trim();const subject=encodeURIComponent('Portfolio inquiry from '+name);const body=encodeURIComponent('From: '+name+'\nReply to: '+email+'\n\n'+message);document.getElementById('form-note').textContent='Opening your email application. Please press Send there to deliver the message.';window.location.href='mailto:aalkaseemmalik@gmail.com?subject='+subject+'&body='+body});
const links=[...nav.querySelectorAll('a')];if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id))}})},{rootMargin:'-25% 0px -60% 0px'});document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section))}

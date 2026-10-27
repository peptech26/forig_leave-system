const $=s=>document.querySelector(s),K='forig-leave-v2';
const TYPES={'Annual Leave':21,'Sick Leave':15,'Casual Leave':10,'Maternity Leave':90,'Study Leave':30,'Conference/Meeting':14},STAGES=['HOD','Admin','Director'];
const NEED={hod:0,admin:1,director:2},START={staff:0,hod:1,admin:2,director:1};
const ROLE={staff:'Staff',hod:'Head of department',admin:'Administrator',director:'Director'};
const PAL=['#0f3b2e','#d9a21b','#4f8a6b','#7a8f9c','#8a5a2b','#2d5f8a'],col=t=>PAL[Object.keys(TYPES).indexOf(t)%6];
let S,me,view='home';
const save=()=>localStorage.setItem(K,JSON.stringify(S));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const U=id=>S.users.find(u=>u.id==id);
const fd=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const sha=async p=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('forig-salt:'+p)))].map(b=>b.toString(16).padStart(2,'0')).join('');
function days(a,b){let n=0;if(!a||!b)return 0;for(let d=new Date(a+'T00:00'),e=new Date(b+'T00:00');d<=e;d.setDate(d.getDate()+1)){const w=d.getDay();if(w&&w<6)n++}return n}
const used=(uid,t)=>S.leaves.filter(l=>l.uid==uid&&l.type==t&&l.status!='rejected').reduce((a,l)=>a+l.days,0);
const notify=(uid,msg)=>S.notes.unshift({uid,msg,at:Date.now(),read:0});
function notifyStage(l,msg){const r=Object.keys(NEED).find(k=>NEED[k]==l.stage);S.users.filter(u=>u.role==r&&(l.stage||u.div==U(l.uid).div)).forEach(u=>notify(u.id,msg))}
const queue=()=>S.leaves.filter(l=>l.status=='pending'&&l.stage==NEED[me.role]&&l.uid!=me.id&&(me.role!='hod'||U(l.uid).div==me.div));
function toast(m,bad){const t=document.createElement('div');t.className='toast-n'+(bad?' bad':'');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3800)}

async function init(){
  S=JSON.parse(localStorage.getItem(K)||'null');
  if(!S){const pw=await sha('forig2026'),u=(id,name,role,div,sec)=>({id,name,role,div,sec,rank:'Research Scientist',town:'Kumasi',appt:'2016-04-01',phone:'0244000000',active:1,email:name.toLowerCase().replace(/^dr\. /,'').split(' ')[0]+'@forig.org',pw});
    S={users:[u(1,'Ama Mensah','staff','Forestry Research','Silviculture'),u(2,'Kojo Boateng','hod','Forestry Research','Biodiversity'),u(3,'Efua Owusu','admin','Administration','Records'),u(4,'Dr. Yaw Asante','director','Administration','Directorate'),u(5,'Kwesi Darko','hod','Food Research','Food Science'),u(6,'Nana Adjei','staff','Food Research','Food Science')],
    divs:{'Forestry Research':['Silviculture','Biodiversity'],'Food Research':['Food Science','Nutrition'],'Administration':['Records','Finance','Directorate']},leaves:[],notes:[]};save()}
  me=U(sessionStorage.uid);render();
}
addEventListener('storage',e=>{if(e.key!=K)return;const before=me?S.notes.filter(n=>n.uid==me.id).length:0;S=JSON.parse(e.newValue);if(me){me=U(me.id);const n=S.notes.filter(x=>x.uid==me.id);if(n.length>before)toast(n[0].msg)}render()});

async function login(e){e.preventDefault();const u=S.users.find(x=>x.email==$('#em').value.trim().toLowerCase());
  if(u&&u.active!==0&&u.pw==await sha($('#pw').value)){me=u;sessionStorage.uid=u.id;view='home';render()}else toast('Email or password is incorrect.',1)}
const logout=()=>{sessionStorage.clear();me=null;render()};
const go=v=>{view=v;render()};

const chain=l=>STAGES.map((s,i)=>`<i class="${l.status=='rejected'&&i==l.stage?'no':i<l.start?'skip':i<l.stage?'ok':i==l.stage&&l.status=='pending'?'now':''}">${s}</i>`).join('');
const table=r=>r.length?`<div class="table-responsive"><table class="table align-middle"><thead><tr><th>Ref</th><th>Leave</th><th>Dates</th><th>Days</th><th>Approval</th><th></th></tr></thead><tbody>${r.map(l=>`<tr><td>LV-${String(l.id).padStart(4,'0')}</td><td>${l.type}</td><td>${fd(l.from)} to ${fd(l.to)}</td><td>${l.days}</td><td><div class="track" title="${esc(l.hist.map(h=>h.by+': '+(h.ok?'approved':h.note)).join('; '))}">${chain(l)}</div></td><td><a href="#" onclick="openForm(${l.id});return false">Form 4B</a></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">No applications yet. Once you apply, each one shows where it sits in the approval chain.</p>';
function rings(){let s='';Object.entries(TYPES).forEach(([t,tot],i)=>{const r=76-i*12,c=2*Math.PI*r,left=Math.max(tot-used(me.id,t),0)/tot;
  s+=`<circle cx="90" cy="90" r="${r}" fill="none" stroke="#dfe7e0" stroke-width="8"/><circle cx="90" cy="90" r="${r}" fill="none" stroke="${col(t)}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c*left} ${c}" transform="rotate(-90 90 90)"/>`});
  return `<svg viewBox="0 0 180 180" width="230" role="img" aria-label="Remaining leave days by type">${s}</svg>`}

const V={
 home:()=>`<h1>Good day, ${esc(me.name.replace(/^Dr\. /,'').split(' ')[0])}</h1><div class="row g-4"><div class="col-lg-5"><section class="sheet rings">${rings()}<ul class="key">${Object.entries(TYPES).map(([t,n])=>`<li><b style="background:${col(t)}"></b>${t}<span>${n-used(me.id,t)} of ${n} days left</span></li>`).join('')}</ul></section></div><div class="col-lg-7"><section class="sheet"><h2>Recent applications</h2>${table(S.leaves.filter(l=>l.uid==me.id).slice(-5).reverse())}</section></div></div>`,
 apply:()=>`<h1>Apply for leave</h1><form class="sheet f4" onsubmit="apply(event)">
  <div><label>Name</label><input value="${esc(me.name)}" readonly></div><div><label>Division and section</label><input value="${esc(me.div)}, ${esc(me.sec)}" readonly></div>
  <div><label for="type">Type of leave</label><select id="type" name="type">${Object.keys(TYPES).map(t=>`<option>${t}</option>`).join('')}</select></div><div><label>Working days requested</label><input id="dc" value="0" readonly></div>
  <div><label for="from">First day of leave</label><input type="date" id="from" name="from" required oninput="calc()"></div><div><label for="to">Last day of leave</label><input type="date" id="to" name="to" required oninput="calc()"></div>
  <div class="full"><label for="reason">Reason</label><textarea id="reason" name="reason" rows="2" required></textarea></div>
  <div><label for="addr">Address while on leave</label><input id="addr" name="addr" required></div><div><label for="relief">Officer who will relieve you</label><input id="relief" name="relief" required></div>
  <div class="full"><button class="btn btn-moss">Send for approval</button></div></form>`,
 mine:()=>`<h1>My applications</h1><section class="sheet">${table(S.leaves.filter(l=>l.uid==me.id).reverse())}</section>`,
 queue:()=>{const q=queue();return `<h1>Waiting for your decision</h1><section class="sheet">${q.length?q.map(l=>{const u=U(l.uid);return `<div class="req"><div class="info"><strong>${esc(u.name)}</strong>, ${esc(u.div)}<p>${l.type} leave, ${fd(l.from)} to ${fd(l.to)} (${l.days} working days). ${TYPES[l.type]-used(u.id,l.type)+l.days} days were available.</p><p>Reason: ${esc(l.reason)}. Relief: ${esc(l.relief)}.</p></div><div class="track">${chain(l)}</div><div><button class="btn btn-moss" onclick="decide(${l.id},1)">Approve</button> <button class="btn-out" onclick="decide(${l.id},0)">Reject</button></div></div>`}).join(''):'<p class="empty">All clear. New applications that reach your level appear here.</p>'}</section>`},
 depts:()=>`<h1>Divisions and sections</h1>${Object.entries(S.divs).map(([d,ss])=>`<section class="sheet mb-3"><div class="d-flex justify-content-between"><h2>${esc(d)}</h2><span class="empty">${S.users.filter(u=>u.div==d).length} staff</span></div><div class="chips">${ss.map(s=>`<span>${esc(s)}<button data-d="${esc(d)}" data-s="${esc(s)}" onclick="rmSec(this.dataset.d,this.dataset.s)" aria-label="Remove ${esc(s)}">×</button></span>`).join('')}</div><form class="inl" data-d="${esc(d)}" onsubmit="addSec(event)"><input class="f" name="n" placeholder="New section name" required><button class="btn btn-moss btn-sm">Add section</button></form></section>`).join('')}<form class="sheet inl" onsubmit="addDiv(event)"><input class="f" name="n" placeholder="New division name" required><button class="btn btn-moss btn-sm">Add division</button></form>`,
 notes:()=>{const n=S.notes.filter(x=>x.uid==me.id),h=`<h1>Notices</h1><section class="sheet">${n.length?n.map(x=>`<div class="note ${x.read?'':'new'}">${esc(x.msg)}<small>${new Date(x.at).toLocaleString('en-GB')}</small></div>`).join(''):'<p class="empty">No notices yet. Status changes on your applications show up here.</p>'}</section>`;n.forEach(x=>x.read=1);save();return h}
};

function render(){const a=$('#app');if(!me)return a.innerHTML=`<div class="login"><h1>FORIG Leave</h1><form class="sheet f4" onsubmit="login(event)" style="grid-template-columns:1fr"><div><label for="em">Email</label><input id="em" type="email" required autocomplete="username"></div><div><label for="pw">Password</label><input id="pw" type="password" required autocomplete="current-password"></div><button class="btn btn-moss">Sign in</button></form><p class="empty mt-3">Demo accounts (password forig2026): ama@ staff, kojo@ HOD, efua@ admin, yaw@ director, all @forig.org</p><p><a href="#" onclick="signupView();return false">Create an account</a></p></div>`;
  const body=V[view](),un=S.notes.filter(n=>n.uid==me.id&&!n.read).length,q=NEED[me.role]!=null?queue().length:0;
  const nav=[['home','Overview'],['apply','Apply for leave'],['mine','My applications'],...(NEED[me.role]!=null?[['queue','Approvals',q]]:[]),...(me.role=='admin'?[['depts','Departments'],['types','Leave types'],['people','Employees'],['reports','Reports']]:[]),...(['admin','director'].includes(me.role)?[['all','All applications']]:[]),['notes','Notices',un]];
  a.innerHTML=`<header class="bar"><div class="wrap d-flex flex-wrap align-items-center gap-3"><span class="brand">FORIG Leave</span><nav>${nav.map(([k,t,c])=>`<a href="#" class="${k==view?'on':''}" onclick="go('${k}');return false">${t}${c?`<em>${c}</em>`:''}</a>`).join('')}</nav><span class="who">${esc(me.name)}, ${ROLE[me.role]}<button onclick="logout()">Sign out</button></span></div></header><main class="wrap">${body}</main>`}

const calc=()=>{$('#dc').value=days($('#from').value,$('#to').value)};
function apply(e){e.preventDefault();const f=e.target,v=n=>f[n].value.trim(),t=v('type'),d=days(v('from'),v('to')),left=TYPES[t]-used(me.id,t);
  if(d<1)return toast('Pick dates that include at least one working day.',1);
  if(d>left)return toast(`You have ${left} days of ${t} leave left. This request needs ${d}.`,1);
  const s=START[me.role],l={id:S.leaves.length+1,uid:me.id,type:t,from:v('from'),to:v('to'),days:d,reason:v('reason'),addr:v('addr'),relief:v('relief'),stage:s,start:s,status:'pending',hist:[]};
  S.leaves.push(l);notifyStage(l,`${me.name} applied for ${d} days of ${t} leave.`);save();view='mine';render();toast('Sent to '+STAGES[s]+' for approval.')}
function decide(id,ok){const l=S.leaves.find(x=>x.id==id),note=ok?'':prompt('Why are you rejecting this? The applicant will see your reason.');if(!ok&&!note)return;
  l.hist.push({by:me.name,ok,note,at:Date.now()});
  if(!ok){l.status='rejected';notify(l.uid,`${STAGES[l.stage]} rejected your ${l.type} leave: ${note}`)}
  else{l.stage++;if(l.stage>2){l.status='approved';notify(l.uid,`Your ${l.type} leave starting ${fd(l.from)} is fully approved.`)}
   else{notify(l.uid,`${STAGES[l.stage-1]} approved your ${l.type} leave. It is now with ${STAGES[l.stage]}.`);notifyStage(l,`${U(l.uid).name}'s ${l.type} leave needs your decision.`)}}
  save();render();toast(ok?'Approved.':'Rejected.')}
const addSec=e=>{e.preventDefault();const d=e.target.dataset.d,n=e.target.n.value.trim();if(n&&!S.divs[d].includes(n))S.divs[d].push(n);save();render()};
const rmSec=(d,s)=>{if(confirm(`Remove ${s} from ${d}?`)){S.divs[d]=S.divs[d].filter(x=>x!=s);save();render()}};
const addDiv=e=>{e.preventDefault();const n=e.target.n.value.trim();if(n&&!S.divs[n])S.divs[n]=[];save();render()};
addEventListener('load',init);

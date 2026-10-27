/* Features ported from the original PHP forig_leave system */
let cur=0,pend=null,pf='';
const _render=render;render=function(){if(S){if(!S.types)S.types={...TYPES};Object.keys(TYPES).forEach(k=>delete TYPES[k]);Object.assign(TYPES,S.types)}_render();initSig()};

/* signature pad */
function initSig(){document.querySelectorAll('canvas.sig').forEach(c=>{if(c._on)return;c._on=1;const x=c.getContext('2d');x.lineWidth=2.5;x.lineCap='round';let d=0;
 const p=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]};
 c.onpointerdown=e=>{d=1;c.dataset.s=1;x.beginPath();x.moveTo(...p(e));c.setPointerCapture(e.pointerId)};
 c.onpointermove=e=>{if(d){x.lineTo(...p(e));x.stroke()}};c.onpointerup=()=>d=0})}
const sigBox=id=>`<div class="sigb full"><label>Signature (draw with mouse or finger)</label><canvas class="sig" id="${id}" width="420" height="110"></canvas><button type="button" class="lnk" onclick="clr('${id}')">Clear</button></div>`;
const clr=id=>{const c=$('#'+id);c.getContext('2d').clearRect(0,0,c.width,c.height);delete c.dataset.s};
const sigData=id=>{const c=$('#'+id);return c&&c.dataset.s?c.toDataURL():''};
const usedYear=uid=>S.leaves.filter(l=>l.uid==uid&&l.status=='approved').reduce((a,l)=>a+l.days,0);

/* Form 4B Part I */
V.apply=()=>`<h1>Application for part leave</h1><form class="sheet f4" onsubmit="apply(event)">
 <div><label>1. Name</label><input value="${esc(me.name)}" readonly></div><div><label>2. Rank</label><input value="${esc(me.rank)}" readonly></div>
 <div class="full"><label for="reason">3. Purpose of part leave</label><textarea id="reason" name="reason" rows="2" required></textarea></div>
 <div><label>4. Division and section</label><input value="${esc(me.div)}, ${esc(me.sec)}" readonly></div><div><label>5. Home town</label><input value="${esc(me.town)}" readonly></div>
 <div><label>6. Date of first appointment</label><input value="${fd(me.appt)}" readonly></div><div><label>7. Annual leave entitlement</label><input value="${TYPES['Annual Leave']} days" readonly></div>
 <div><label>8. Leave approved so far this year</label><input value="${usedYear(me.id)} days" readonly></div><div><label for="type">Type of leave</label><select id="type" name="type">${Object.keys(TYPES).map(t=>`<option>${t}</option>`).join('')}</select></div>
 <div><label for="from">10. Leave commences</label><input type="date" id="from" name="from" required oninput="calc()"></div><div><label for="to">Last day of leave</label><input type="date" id="to" name="to" required oninput="calc()"></div>
 <div><label>9. Working days applied for</label><input id="dc" value="0" readonly></div><div><label for="phone">Phone while on leave</label><input id="phone" name="phone" value="${esc(me.phone)}" required></div>
 <div class="full"><label for="addr">12. Address while on leave</label><input id="addr" name="addr" required></div>${sigBox('sg0')}
 <div class="full"><button class="btn btn-moss">Send for approval</button></div></form>`;
function apply(e){e.preventDefault();const f=e.target,v=n=>f[n].value.trim(),t=v('type'),d=days(v('from'),v('to')),left=TYPES[t]-used(me.id,t);
 if(d<1)return toast('Pick dates that include at least one working day.',1);
 if(d>left)return toast(`You have ${left} days of ${t} left. This request needs ${d}.`,1);
 const s=START[me.role],l={id:S.leaves.length+1,uid:me.id,type:t,from:v('from'),to:v('to'),days:d,reason:v('reason'),addr:v('addr'),phone:v('phone'),sig:sigData('sg0'),usedBefore:usedYear(me.id),stage:s,start:s,status:'pending',hist:[],rec:{}};
 S.leaves.push(l);notifyStage(l,`${me.name} applied for ${d} days of ${t}.`);save();view='mine';render();toast('Sent to '+STAGES[s]+' for approval.')}

/* Parts II and III: comments, successor, signature, director's fields */
V.queue=()=>{const q=queue();return `<h1>Waiting for your decision</h1><section class="sheet">${q.length?q.map(l=>{const u=U(l.uid),st=l.stage;return `<div class="req"><div class="info"><strong>${esc(u.name)}</strong>, ${esc(u.div)}<p>${l.type}, ${fd(l.from)} to ${fd(l.to)} (${l.days} working days). Purpose: ${esc(l.reason)}</p></div><div class="track">${chain(l)}</div>
 <div class="rv"><div class="full"><label>Your comment ${st==2?'(forwarding officer remarks)':''}</label><textarea id="c${l.id}" rows="2"></textarea></div>
 ${st==0?`<div class="full"><label>Officer to take over duties</label><select id="sc${l.id}"><option value="">None assigned</option>${S.users.filter(x=>x.div==u.div&&x.id!=u.id&&x.active!==0).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>`:''}
 ${st==2?`<div><label>Days approved</label><input type="number" id="ad${l.id}" value="${l.days}" min="1" max="${l.days}"></div><div><label>Leave days outstanding</label><input type="number" id="ou${l.id}" value="${TYPES[l.type]-used(u.id,l.type)}"></div><div><label>Leave expires on</label><input type="date" id="ex${l.id}" value="${l.to}"></div><div><label>Resume duty on</label><input type="date" id="rs${l.id}"></div>`:''}
 ${sigBox('sg'+l.id)}<div class="full"><button class="btn btn-moss" onclick="decide(${l.id},1)">Approve and sign</button> <button class="btn-out" onclick="decide(${l.id},0)">Reject</button></div></div></div>`}).join(''):'<p class="empty">All clear. New applications that reach your level appear here.</p>'}</section>`};
function decide(id,ok){const l=S.leaves.find(x=>x.id==id),v=n=>($('#'+n+id)||{}).value||'',note=v('c').trim(),sig=sigData('sg'+id);
 if(!ok&&!note)return toast('Add a comment explaining the rejection.',1);
 if(ok&&!sig)return toast('Sign in the box before approving.',1);
 const r={by:me.name,ok,note,sig,at:Date.now()};
 if(l.stage==0){const s=U(v('sc'));r.succ=s?s.name:''}
 if(l.stage==2&&ok){r.ex=v('ex');r.rs=v('rs');r.ou=v('ou');l.days=Math.min(+v('ad')||l.days,l.days)}
 l.rec[l.stage]=r;l.hist.push({by:me.name,ok,note});
 if(!ok){l.status='rejected';notify(l.uid,`${STAGES[l.stage]} rejected your ${l.type}: ${note}`)}
 else{l.stage++;if(l.stage>2){l.status='approved';notify(l.uid,`Your ${l.type} starting ${fd(l.from)} is fully approved for ${l.days} days.`)}
  else{notify(l.uid,`${STAGES[l.stage-1]} approved your ${l.type}. It is now with ${STAGES[l.stage]}.`);notifyStage(l,`${U(l.uid).name}'s ${l.type} needs your decision.`)}}
 save();render();toast(ok?'Approved.':'Rejected.')}

/* printable Form 4B */
const openForm=id=>{cur=id;view='form';render()};
V.form=()=>{const l=S.leaves.find(x=>x.id==cur),u=U(l.uid),R=l.rec||{},sg=s=>s?`<img src="${s}" alt="Signature">`:'<p class="empty">Not signed</p>',dl=a=>`<dl>${a.map(([k,x])=>`<dt>${k}</dt><dd>${esc(x||'')}&nbsp;</dd>`).join('')}</dl>`;
 const part=(n,t,i,extra)=>`<h3>${n} (${t})</h3>${R[i]?dl([['Decision',R[i].ok?'Recommended':'Rejected'],['Comment',R[i].note],...extra(R[i])])+sg(R[i].sig)+`<p class="empty">${R[i].by}, ${new Date(R[i].at).toLocaleDateString('en-GB')}</p>`:'<p class="empty">Waiting.</p>'}`;
 return `<div class="no-print mb-3"><button class="btn btn-moss" onclick="print()">Print Form 4B</button> <button class="btn-out" style="border-color:var(--ink);color:var(--ink)" onclick="go('mine')">Back</button></div><article class="sheet paper"><p class="empty">CSIR Form 4B, Council for Scientific and Industrial Research</p><h2>Application for part leave</h2>
 <h3>Part I (applicant)</h3>${dl([['Name',u.name],['Rank',u.rank],['Purpose',l.reason],['Division and section',u.div+', '+u.sec],['Home town',u.town],['First appointment',fd(u.appt)],['Annual entitlement',TYPES['Annual Leave']+' days'],['Leave approved before this',l.usedBefore+' days'],['Leave type',l.type],['Days applied for',l.days],['Commences, ends',fd(l.from)+' to '+fd(l.to)],['Address and phone',l.addr+', '+l.phone]])}${sg(l.sig)}
 ${part('Part II','Head of department',0,r=>[['Officer taking over',r.succ]])}${part('Admin review','Administrator',1,()=>[])}
 ${part('Part III','Director',2,r=>[['Days approved',l.days],['Leave expires',r.ex&&fd(r.ex)],['Resume duty',r.rs&&fd(r.rs)],['Days outstanding',r.ou]])}</article>`};

/* admin: leave types, employees, reports, all applications */
V.types=()=>`<h1>Leave types</h1><section class="sheet"><table class="table align-middle"><thead><tr><th>Type</th><th>Days per year</th><th></th></tr></thead><tbody>${Object.entries(TYPES).map(([t,n])=>`<tr><td>${esc(t)}</td><td><input type="number" class="f" style="width:90px" value="${n}" min="0" data-t="${esc(t)}" onchange="setAllow(this.dataset.t,this.value)"></td><td><button class="lnk" data-t="${esc(t)}" onclick="delType(this.dataset.t)">Remove</button></td></tr>`).join('')}</tbody></table>
 <form class="inl mt-3" onsubmit="addType(event)"><input class="f" name="n" placeholder="New leave type" required><input class="f" name="d" type="number" min="0" placeholder="Days" required style="max-width:100px"><button class="btn btn-moss btn-sm">Add type</button></form></section>`;
const setAllow=(t,n)=>{S.types[t]=+n;save();render()};
const delType=t=>{if(S.leaves.some(l=>l.type==t))return toast('Applications use this type, so it cannot be removed.',1);delete S.types[t];save();render()};
const addType=e=>{e.preventDefault();S.types[e.target.n.value.trim()]=+e.target.d.value;save();render()};
V.people=()=>`<h1>Employees</h1><section class="sheet"><select class="f mb-3" style="max-width:220px" onchange="pf=this.value;render()"><option value="">All roles</option>${Object.keys(ROLE).map(r=>`<option value="${r}" ${pf==r?'selected':''}>${ROLE[r]}</option>`).join('')}</select><div class="table-responsive"><table class="table align-middle"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Division</th><th>Status</th></tr></thead><tbody>${S.users.filter(u=>!pf||u.role==pf).map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td>
 <td><select class="f" onchange="setU(${u.id},'role',this.value)">${Object.keys(ROLE).map(r=>`<option value="${r}" ${u.role==r?'selected':''}>${ROLE[r]}</option>`).join('')}</select></td>
 <td><select class="f" onchange="setU(${u.id},'div',this.value)">${Object.keys(S.divs).map(d=>`<option ${u.div==d?'selected':''}>${esc(d)}</option>`).join('')}</select></td>
 <td><button class="lnk" onclick="setU(${u.id},'active',${u.active===0?1:0})">${u.active===0?'Inactive, activate':'Active, deactivate'}</button></td></tr>`).join('')}</tbody></table></div></section>`;
const setU=(id,k,v)=>{if(id==me.id&&k=='active'&&!+v)return toast('You cannot deactivate your own account.',1);U(id)[k]=k=='active'?+v:v;save();render()};
V.reports=()=>{const y=new Date().getFullYear(),L=S.leaves,M='JFMAMJJASOND'.split(''),by=(f,keys)=>keys.map(k=>[k,L.filter(l=>f(l)==k).length]),bars=a=>{const m=Math.max(1,...a.map(x=>x[1]));return a.map(([k,n])=>`<div class="rb"><span>${esc(k)}</span><i style="width:${n/m*100}%"></i><b>${n}</b></div>`).join('')};
 return `<h1>Reports for ${y}</h1><div class="row g-4"><div class="col-lg-6"><section class="sheet"><h2>Applications by month</h2>${bars(M.map((m,i)=>[m,L.filter(l=>new Date(l.from).getMonth()==i).length]))}</section></div>
 <div class="col-lg-6"><section class="sheet"><h2>Applications by leave type</h2>${bars(by(l=>l.type,Object.keys(TYPES)))}</section></div>
 <div class="col-lg-6"><section class="sheet"><h2>Days requested by division</h2>${bars(Object.keys(S.divs).map(d=>[d,L.filter(l=>U(l.uid).div==d).reduce((a,l)=>a+l.days,0)]))}</section></div>
 <div class="col-lg-6"><section class="sheet"><h2>Outcome</h2>${bars(by(l=>l.status,['pending','approved','rejected']))}</section></div></div>`};
V.all=()=>`<h1>All applications</h1><section class="sheet"><div class="table-responsive"><table class="table align-middle"><thead><tr><th>Employee</th><th>Division</th><th>Leave</th><th>Dates</th><th>Days</th><th>Approval</th><th></th></tr></thead><tbody>${S.leaves.slice().reverse().map(l=>{const u=U(l.uid);return `<tr><td>${esc(u.name)}</td><td>${esc(u.div)}</td><td>${l.type}</td><td>${fd(l.from)} to ${fd(l.to)}</td><td>${l.days}</td><td><div class="track">${chain(l)}</div></td><td><a href="#" onclick="openForm(${l.id});return false">Form 4B</a></td></tr>`}).join('')||'<tr><td colspan="7" class="empty">No applications yet.</td></tr>'}</tbody></table></div></section>`;

/* sign-up with 6-digit email code and password rules */
const pwErr=p=>[[/.{8}/,'8 characters'],[/[A-Z]/,'an uppercase letter'],[/[a-z]/,'a lowercase letter'],[/\d/,'a number'],[/[^A-Za-z0-9]/,'a special character']].filter(([r])=>!r.test(p)).map(x=>x[1]);
function signupView(){const i=(n,l,t='text')=>`<div><label>${l}</label><input name="${n}" type="${t}" required></div>`;
 $('#app').innerHTML=`<div class="login" style="max-width:640px"><h1>Create account</h1><form class="sheet f4" onsubmit="signup(event)">${i('name','Full name')}${i('email','Email','email')}<div><label>Division</label><select name="div">${Object.keys(S.divs).map(d=>`<option>${esc(d)}</option>`).join('')}</select></div>${i('sec','Section')}${i('rank','Rank')}${i('town','Home town')}${i('appt','Date of first appointment','date')}${i('phone','Phone')}${i('pw','Password','password')}${i('pw2','Confirm password','password')}<div class="full"><button class="btn btn-moss">Send verification code</button> <button type="button" class="lnk" onclick="render()">Back to sign in</button></div></form></div>`}
async function signup(e){e.preventDefault();const f=e.target,v=n=>f[n].value.trim(),bad=pwErr(f.pw.value);
 if(bad.length)return toast('Password needs '+bad.join(', ')+'.',1);
 if(f.pw.value!=f.pw2.value)return toast('Passwords do not match.',1);
 if(S.users.some(u=>u.email==v('email').toLowerCase()))return toast('That email is already registered.',1);
 pend={u:{id:Date.now(),name:v('name'),role:'staff',div:v('div'),sec:v('sec'),rank:v('rank'),town:v('town'),appt:v('appt'),phone:v('phone'),active:1,email:v('email').toLowerCase(),pw:await sha(f.pw.value)},code:String(Math.floor(1e5+Math.random()*9e5))};
 $('#app').innerHTML=`<div class="login"><h1>Verify your email</h1><form class="sheet f4" style="grid-template-columns:1fr" onsubmit="verify(event)"><div><label>6-digit code for ${esc(pend.u.email)}</label><input name="c" required inputmode="numeric" maxlength="6"></div><button class="btn btn-moss">Verify and create account</button></form></div>`;
 toast('Demo mode has no mail server. Your code is '+pend.code)}
function verify(e){e.preventDefault();if(e.target.c.value.trim()!=pend.code)return toast('That code is wrong.',1);S.users.push(pend.u);save();pend=null;render();toast('Account created. Sign in now.')}

/* Research Methods study pack: reveal buttons, quiz engine, mock engine, error log. */
(function(){
var K={err:'rm-errors-v1',done:'rm-done-v1',exam:'rm-exam-v1',mock:'rm-mock-v1'};
var TOPIC={L1:'Variables and biases',L2:'Tables and charts',L3:'Center',L4:'Spread',L5:'Relative position',L6:'Hypothesis tests and correlation',L7:'Regression'};
var LET='abcde';
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function get(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function rng(seed){var h=2166136261;for(var i=0;i<seed.length;i++)h=Math.imul(h^seed.charCodeAt(i),16777619);return function(){h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%10000)/10000}}
function order(id,n,shuffle){var a=[];for(var i=0;i<n;i++)a.push(i);if(!shuffle)return a;var r=rng(id);for(var j=n-1;j>0;j--){var k=Math.floor(r()*(j+1));var t=a[j];a[j]=a[k];a[k]=t}return a}
function strip(s){return String(s).replace(/<[^>]+>/g,'')}
function logError(e){var L=get(K.err,[]);var f=null;for(var i=0;i<L.length;i++)if(L[i].id===e.id)f=L[i];if(f){f.misses=(f.misses||1)+1;f.chosen=e.chosen;f.at=Date.now()}else{e.misses=1;e.at=Date.now();L.push(e)}set(K.err,L)}
function topicName(t){return TOPIC[t]||t}
function examDate(){var s=get(K.exam,null);return s?new Date(s+'T12:00:00'):null}
function dayDate(n){var e=examDate();if(!e)return null;var d=new Date(e);d.setDate(d.getDate()-(14-n));return d}
function fmt(d){return d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
function fmtShort(d){return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}

function itemHTML(it,id,num,shuffle,src){
  var ord=order(id,it.opts.length,shuffle);
  var h='<div class="qi" data-id="'+id+'">'+(src?'<p class="qsrc">'+esc(src)+'</p>':'')+'<div class="qb"><div class="qhead"><span class="qnum">'+num+'</span><div>'+it.q+'</div></div>'+(it.t?'<div class="tw">'+it.t+'</div>':'')+'<div class="opts">';
  for(var k=0;k<ord.length;k++)h+='<button class="opt" type="button" data-oi="'+ord[k]+'"><span class="lt">'+LET[k]+'</span><span>'+esc(it.opts[ord[k]])+'</span></button>';
  return h+'</div><div class="exp" hidden></div></div></div>';
}
function reveal(el,it,chosen){
  var bs=el.querySelectorAll('.opt');for(var i=0;i<bs.length;i++){var b=bs[i],oi=+b.getAttribute('data-oi');b.disabled=true;if(oi===it.correct)b.classList.add('right');else if(oi===chosen)b.classList.add('wrong')}
  var x=el.querySelector('.exp');x.hidden=false;
  x.innerHTML='<span class="verdict '+(chosen===it.correct?'ok">Right.':chosen==null?'no">Not answered.':'no">Not this one.')+'</span>'+it.exp;
}

/* learn-day quiz: answer shows on pick */
function quiz(cfg){
  var m=document.getElementById(cfg.mount);if(!m)return;var its=cfg.items,right=0,done=0;
  m.innerHTML=its.map(function(it,i){return itemHTML(it,'d'+cfg.day+'q'+i,i+1,true,it.src)}).join('');
  var chip=document.querySelector('[data-scorechip="'+cfg.mount+'"]');
  function upd(){if(chip)chip.innerHTML=done?'<span class="chip">'+right+' / '+its.length+'</span>':''}
  m.querySelectorAll('.qi').forEach(function(el,i){
    el.querySelectorAll('.opt').forEach(function(b){b.addEventListener('click',function(){
      var it=its[i],oi=+b.getAttribute('data-oi');reveal(el,it,oi);done++;
      if(oi===it.correct)right++;else logError({id:el.getAttribute('data-id'),src:'Day '+cfg.day,topic:it.tag,q:strip(it.q),chosen:it.opts[oi],correct:it.opts[it.correct]});
      upd();
    })});
  });
}

/* mock: nothing revealed until submit */
function mock(cfg){
  var m=document.getElementById(cfg.mount);if(!m)return;var its=cfg.items,timer=null,t0=null;
  var last=get(K.mock,{})[cfg.key];
  var h='<div class="clock"><button class="btn" type="button" data-start>Start the clock</button><span class="tval" data-tval>0:00</span><span class="muted" data-cnt>0 of '+its.length+' answered</span></div>';
  if(last)h+='<p class="note">Last time: '+last.score+' of '+last.n+(last.min!=null?' in '+last.min+' minutes':'')+'.</p>';
  h+=its.map(function(it,i){return itemHTML(it,cfg.key+'q'+i,i+1,!!cfg.shuffle,it.src||cfg.label)}).join('');
  h+='<p><button class="btn" type="button" data-submit>Mark my paper</button></p><div data-result></div>';
  m.innerHTML=h;
  var cnt=m.querySelector('[data-cnt]');
  function count(){cnt.textContent=m.querySelectorAll('.opt.picked').length+' of '+its.length+' answered'}
  m.querySelectorAll('.qi').forEach(function(el){el.querySelectorAll('.opt').forEach(function(b){b.addEventListener('click',function(){
    if(el.classList.contains('marked'))return;el.querySelectorAll('.opt').forEach(function(x){x.classList.remove('picked')});b.classList.add('picked');count()})})});
  var sb=m.querySelector('[data-start]');
  sb.addEventListener('click',function(){t0=Date.now();sb.disabled=true;sb.textContent='Clock running';timer=setInterval(function(){var s=Math.floor((Date.now()-t0)/1000);m.querySelector('[data-tval]').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},1000)});
  m.querySelector('[data-submit]').addEventListener('click',function(){
    var qs=m.querySelectorAll('.qi'),blank=m.querySelectorAll('.qi:not(.marked)').length-m.querySelectorAll('.opt.picked').length;
    if(blank>0&&!confirm(blank+' question'+(blank>1?'s are':' is')+' still blank. Blanks count as wrong but stay out of your error log. Mark the paper now?'))return;
    var sc=0,missed={};
    qs.forEach(function(el,i){var p=el.querySelector('.opt.picked'),ch=p?+p.getAttribute('data-oi'):null,it=its[i];el.classList.add('marked');reveal(el,it,ch);
      if(ch===it.correct)sc++;else{missed[it.tag]=(missed[it.tag]||0)+1;if(ch!=null)logError({id:el.getAttribute('data-id'),src:it.src||cfg.label,topic:it.tag,q:strip(it.q),chosen:it.opts[ch],correct:it.opts[it.correct]})}});
    clearInterval(timer);var min=t0?Math.round((Date.now()-t0)/60000):null;
    var R=get(K.mock,{});R[cfg.key]={score:sc,n:qs.length,min:min};set(K.mock,R);
    this.disabled=true;
    var ms=Object.keys(missed).sort(function(a,b){return missed[b]-missed[a]}).map(function(t){return esc(topicName(t))+' '+missed[t]}).join(', ');
    var res=m.querySelector('[data-result]');
    res.innerHTML='<div class="result"><p class="big">'+sc+' of '+qs.length+'</p><p>That is '+Math.round(sc/qs.length*100)+' out of 100'+(min!=null?', in '+min+' minutes':'')+'.</p>'+(ms?'<p>Missed by topic: '+ms+'. Scroll up: every question now shows its full explanation.</p>':'<p>Clean paper.</p>')+'</div><h2>Your error log</h2><div id="mocklog"></div>';
    mountErrorLog('mocklog');res.scrollIntoView({behavior:'smooth'});
  });
}

function prompt(){
  var L=get(K.err,[]);
  return 'I\'m studying for the Research Methods final (Bar-Ilan IMBA, course 70-348, Prof. Yevgeny Mugerman). The exam is 20 multiple-choice questions with five options (a) to (e); open materials; a t-table is attached.\nCourse conventions: variance and standard deviation divide by n; quartile positions use (n + 1) for raw data; two-sample t uses df = n1 + n2 - 2 and SE = sqrt(s1^2/n1 + s2^2/n2); if a df is not printed, use the nearest smaller row; one-sided claims read the one-tail header, "differs" reads the two-tail header.\n\nThese are the questions I got wrong:\n'+
  L.map(function(e,i){return (i+1)+'. ['+topicName(e.topic)+'] '+e.q+'\n   I chose: '+e.chosen+'\n   Correct: '+e.correct}).join('\n')+
  '\n\nPlease find the pattern in my mistakes and explain it in plain English in a few sentences. Then test me: write new exam-style multiple-choice questions (five options) on exactly these weak spots, one at a time. Wait for my answer before giving the solution.';
}
function mountErrorLog(id){
  var el=document.getElementById(id);if(!el)return;
  var L=get(K.err,[]).sort(function(a,b){return(b.misses||1)-(a.misses||1)});
  if(!L.length){el.innerHTML='<p class="note"><i>Nothing yet. Every question you get wrong lands here, in this browser, so you can come back to it.</i></p>';return}
  var by={};L.forEach(function(e){var t=topicName(e.topic);by[t]=(by[t]||0)+1});
  el.innerHTML='<p class="note">'+L.length+' question'+(L.length>1?'s':'')+' missed. By topic: '+Object.keys(by).sort(function(a,b){return by[b]-by[a]}).map(function(t){return esc(t)+' '+by[t]}).join(', ')+'.</p><ol class="elog">'+
  L.map(function(e){return '<li><p>'+esc(e.q)+'</p><p class="muted small">You chose: '+esc(e.chosen)+'<br>Right answer: '+esc(e.correct)+(e.misses>1?'<br>Missed '+e.misses+' times':'')+'</p></li>'}).join('')+
  '</ol><p><button class="btn" type="button" data-copy>Copy a prompt for Claude</button> <button class="btn ghost" type="button" data-clear>Clear the log</button></p><p class="note small" data-msg></p>';
  el.querySelector('[data-copy]').addEventListener('click',function(){var t=prompt(),b=this;
    function fb(){var ta=document.createElement('textarea');ta.className='pt';ta.value=t;b.parentNode.after(ta);ta.select();el.querySelector('[data-msg]').textContent='Your browser blocked copying. Select the text below and copy it.'}
    if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){el.querySelector('[data-msg]').textContent='Copied. Paste it into a new Claude chat.'},fb);else fb()});
  el.querySelector('[data-clear]').addEventListener('click',function(){if(confirm('Clear every saved mistake? This cannot be undone.')){set(K.err,[]);mountErrorLog(id)}});
}

function init(){
  document.querySelectorAll('[data-reveal]').forEach(function(b){b.addEventListener('click',function(){var r=document.getElementById(b.getAttribute('data-reveal'));var o=r.classList.toggle('open');b.classList.toggle('open',o);b.textContent=o?'Hide the answer':'Show the answer'})});
  document.querySelectorAll('[data-daydate]').forEach(function(el){var d=dayDate(+el.getAttribute('data-daydate'));if(d)el.textContent=' · '+fmt(d)});
  document.querySelectorAll('[data-rowdate]').forEach(function(el){var d=dayDate(+el.getAttribute('data-rowdate'));if(d)el.textContent=' · '+fmtShort(d)});
  var D=get(K.done,{});
  document.querySelectorAll('[data-dayrow]').forEach(function(el){if(D[el.getAttribute('data-dayrow')])el.classList.add('done')});
  document.querySelectorAll('[data-dot]').forEach(function(el){if(D[el.getAttribute('data-dot')])el.classList.add('on')});
  var db=document.querySelector('[data-done]');
  if(db){var n=db.getAttribute('data-done');function lab(){db.textContent=get(K.done,{})[n]?'Marked done. Undo':'Mark day '+n+' done';db.classList.toggle('ghost',!!get(K.done,{})[n])}lab();db.addEventListener('click',function(){var X=get(K.done,{});X[n]=!X[n];set(K.done,X);lab()})}
  var ex=document.getElementById('examdate');
  if(ex){ex.value=get(K.exam,'')||'';var info=document.getElementById('examinfo');var e=examDate();
    if(info)info.textContent=e?'Exam: '+e.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'. Every day now has its date.':'Set it, and every day gets a date, counted back from the exam.';
    ex.addEventListener('change',function(){set(K.exam,ex.value||null);location.reload()})}
  var n=Object.values(D).filter(Boolean).length,pc=document.getElementById('progress');if(pc&&n)pc.textContent=n+' of 13 days done.';
  if(document.getElementById('errorlog'))mountErrorLog('errorlog');
}
window.RM={quiz:quiz,mock:mock,mountErrorLog:mountErrorLog};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

// AI総合予想エンジン（位置別・周期・トレンド・差分・パターン）
const AW=[20,50,100,300],HL=d=>d>4?'H':'L',OE=d=>d%2?'O':'E',PN={3:['百','十','一'],4:['千','百','十','一']};
const nm1=a=>{const lo=Math.min(...a),hi=Math.max(...a);return a.map(v=>hi==lo?.5:(v-lo)/(hi-lo))};
const sigName={3:{'3':'トリプル','21':'ダブル','111':'ばらばら'},4:{'4':'クアドラプル','31':'トリプル','22':'ツーダブル','211':'ダブル','1111':'ばらばら'}};
const sig=c=>{const m={};c.forEach(d=>m[d]=(m[d]||0)+1);return Object.values(m).sort((a,b)=>b-a).join('')};
const cmp=z=>.4*z.pos+.2*z.cyc+.1*z.trd+.1*z.dif;
function aiModel(D,L){if(D._m&&D._m.N==D.length&&D._m.L==L)return D._m;const N=D.length,M={N,L,P:[],sumH:{},hlH:{},oeH:{},tyH:{},kH:{},kLast:{}},mw=x=>Math.max(1,Math.min(x,N));
 for(let p=0;p<L;p++){const st=[];
  for(let d=0;d<10;d++){let c=0,pv=-1,mx=0,mn=1e9;const w={};AW.forEach(x=>w[x]=0);
   for(let i=0;i<N;i++)if(D[i][p]==d){c++;if(pv>=0){mx=Math.max(mx,i-pv);mn=Math.min(mn,i-pv)}pv=i;AW.forEach(x=>{if(i>=N-x)w[x]++})}
   const cur=pv<0?N:N-1-pv,avg=c?N/c:N;mx=Math.max(mx,cur);
   st.push({d,c,fr:c/N,avg,cur,mx,mn:mn==1e9?0:mn,w,ex:AW.map(x=>mw(x)*c/N)})}
  const prev=D[N-1][p],dh=Array(10).fill(0),sd={};
  for(let i=1;i<N;i++){dh[(D[i][p]-D[i-1][p]+10)%10]++;const k=D[i][p]-D[i-1][p];sd[k]=(sd[k]||0)+1}
  const pos=nm1(st.map(s=>s.fr*.5+s.w[100]/mw(100)*.5)),cyc=nm1(st.map(s=>Math.min(s.cur/s.avg,3))),
   trd=nm1(st.map(s=>s.w[20]/mw(20)*.4+s.w[50]/mw(50)*.35+s.w[100]/mw(100)*.25)),dif=nm1(st.map(s=>dh[(s.d-prev+10)%10]));
  st.forEach((s,i)=>{s.pos=pos[i];s.cyc=cyc[i];s.trd=trd[i];s.dif=dif[i]});M.P.push({st,sd})}
 D.forEach((x,i)=>{const s=x.reduce((a,b)=>a+b,0),h=x.map(HL).join(''),o=x.map(OE).join(''),t=sig(x),k=[...x].sort((a,b)=>a-b).join('');
  M.sumH[s]=(M.sumH[s]||0)+1;M.hlH[h]=(M.hlH[h]||0)+1;M.oeH[o]=(M.oeH[o]||0)+1;M.tyH[t]=(M.tyH[t]||0)+1;M.kH[k]=(M.kH[k]||0)+1;M.kLast[k]=i});
 const mx=o=>Math.max(1,...Object.values(o));M.mS=mx(M.sumH);M.mH=mx(M.hlH);M.mO=mx(M.oeH);M.mT=mx(M.tyH);M.mK=mx(M.kH);D._m=M;return M}
// 総合スコア＝Position40%＋Cycle20%＋Trend10%＋Difference10%＋Pattern20%
function aiRank(M){if(M.R)return M.R;const L=M.L,n=10**L,rows=[],bx={},N=M.N;
 for(let v=0;v<n;v++){const c=String(v).padStart(L,'0').split('').map(Number);let s=0;
  for(let p=0;p<L;p++)s+=cmp(M.P[p].st[c[p]]);
  const pat=((M.sumH[c.reduce((a,b)=>a+b,0)]||0)/M.mS+(M.hlH[c.map(HL).join('')]||0)/M.mH+(M.oeH[c.map(OE).join('')]||0)/M.mO+(M.tyH[sig(c)]||0)/M.mT)/4,f=(s/L+.2*pat)*100;
  rows.push([c,f]);const k=[...c].sort((a,b)=>a-b).join('');bx[k]=bx[k]||[0,0];bx[k][0]+=f;bx[k][1]++}
 const box=Object.entries(bx).map(([k,[t,m]])=>{const kc=M.kH[k]||0,cur=kc?N-1-M.kLast[k]:N,avg=kc?N/kc:N,stat=kc?.5*kc/M.mK+.5*Math.min(cur/avg,3)/3:.5;return[k.split('').map(Number),.7*t/m+.3*stat*100]});
 rows.sort((a,b)=>b[1]-a[1]);box.sort((a,b)=>b[1]-a[1]);return M.R={st:rows,bx:box}}
function aiFc(D,L,kind,K){const M=aiModel(D,L);
 if(kind=='mi'){const q=[];for(let a=0;a<10;a++)for(let b=0;b<10;b++)q.push([[a,b],cmp(M.P[1].st[a])+cmp(M.P[2].st[b])]);return q.sort((x,y)=>y[1]-x[1]).slice(0,K).map(x=>x[0])}
 const R=aiRank(M);return(kind=='st'?R.st:R.bx).slice(0,K).map(x=>x[0])}
const rk=i=>i<20?'S':i<70?'A':'B';
function aiHome(D,L){const M=aiModel(D,L),R=aiRank(M),N=M.N,top=(a,f,k)=>[...a].sort(f).slice(0,k).map(s=>s.d).join('・');
 const hc=M.P.map((q,i)=>`<tr><th>${PN[L][i]}</th><td>${top(q.st,(a,b)=>b.trd-a.trd,2)}</td><td>${top(q.st,(a,b)=>b.cur/b.avg-a.cur/a.avg,2)}</td></tr>`).join('');
 const ty=Object.entries(sigName[L]).filter(([k])=>k!='1'.repeat(L)).map(([k,nm])=>{const c=M.tyH[k]||0,avg=c?N/c:0;let cur=N;for(let i=N-1;i>=0;i--)if(sig(D[i])==k){cur=N-1-i;break}return`<tr><td>${nm}</td><td>${(c/N*100).toFixed(1)}%</td><td>${avg.toFixed(1)}</td><td>${cur}</td><td><b>${avg?(cur/avg).toFixed(2):'-'}</b></td></tr>`}).join('');
 return`<div class="card"><h2>最新の当選番号</h2><b class="num">${D[N-1].join('')}</b></div>
 <div class="card"><h2>ストレート予想（上位5）</h2>${R.st.slice(0,5).map(([c,f])=>card(c.join(''),f,100,'AI総合 S')).join('')}</div>
 <div class="card"><h2>ボックス予想（上位5）</h2>${R.bx.slice(0,5).map(([c,f])=>card(c.join(''),f,100,'AI総合 S')).join('')}</div>
 <div class="card"><h2>ホット・コールド数字</h2><table><tr><th></th><th>ホット（直近の勢い）</th><th>コールド（周期超過）</th></tr>${hc}</table></div>
 <div class="card"><h2>ダブル・トリプルの周期</h2><table><tr><th>型</th><th>出現率</th><th>平均周期</th><th>現在周期</th><th>超過度</th></tr>${ty}</table><p class="mu">超過度が1を超えるほど、平均より長く出ていない型です。</p></div>`}
function aiList(D,L){const R=aiRank(aiModel(D,L)),kd=S.ak||'st',rg=S.ar||'S',lo={S:0,A:20,B:70}[rg],hi={S:20,A:70,B:170}[rg],a=(kd=='st'?R.st:R.bx).slice(lo,hi);
 return`<div class="card"><div class="seg">${[['st','ストレート'],['bx','ボックス']].map(([k,l])=>`<button class="${kd==k?'on':''}" onclick="S.ak='${k}';render()">${l}</button>`).join('')}</div>
 <div class="seg" style="margin-top:8px">${[['S','S（上位20）'],['A','A（21〜70位）'],['B','B（71〜170位）']].map(([k,l])=>`<button class="${rg==k?'on':''}" onclick="S.ar='${k}';render()">${l}</button>`).join('')}</div></div>
 <div class="card"><h2>${kd=='st'?'ストレート':'ボックス'}予想 ${rg}ランク</h2>${a.map(([c,f],i)=>`<div class="rc"><small>${lo+i+1}位</small><b class="num" style="font-size:20px">${c.join('')}</b><span>スコア ${f.toFixed(1)}</span></div>`).join('')}</div>`}
function aiDetail(D,L){const M=aiModel(D,L),N=M.N,p=Math.min(S.dp||0,L-1),dw=S.dw||50,wi=AW.indexOf(dw),ds=S.ds||'d',q=M.P[p],
 hot=[...q.st].sort((a,b)=>(b.w[dw]-b.ex[wi])-(a.w[dw]-a.ex[wi])).slice(0,3).map(s=>s.d),cold=[...q.st].sort((a,b)=>b.cur/b.avg-a.cur/a.avg).slice(0,3).map(s=>s.d),
 key={d:s=>s.d,fr:s=>-s.c,cur:s=>-s.cur,ov:s=>-s.cur/s.avg,hot:s=>-(s.w[dw]-s.ex[wi])}[ds],
 rows=[...q.st].sort((a,b)=>key(a)-key(b)).map(s=>{const df=s.w[dw]-s.ex[wi];return`<tr><td><b>${s.d}</b>${hot.includes(s.d)?'🔥':''}${cold.includes(s.d)?'❄':''}</td><td>${s.c}</td><td>${(s.fr*100).toFixed(1)}%</td><td>${s.avg.toFixed(1)}</td><td>${s.cur}</td><td>${s.mx}</td><td>${s.w[dw]}/${s.ex[wi].toFixed(1)}</td><td>${df>0?'+':''}${df.toFixed(1)}</td></tr>`}).join('');
 const sd=q.sd,ks=Object.keys(sd).map(Number).sort((a,b)=>a-b),mxd=Math.max(...Object.values(sd)),
 sums=D.map(x=>x.reduce((a,b)=>a+b,0)),mean=sums.reduce((a,b)=>a+b,0)/N,srt=[...sums].sort((a,b)=>a-b),med=srt[N>>1],
 mode=Object.entries(M.sumH).sort((a,b)=>b[1]-a[1])[0][0],sdv=Math.sqrt(sums.reduce((t,x)=>t+(x-mean)**2,0)/N),
 tb=(o,k)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,k).map(([a,c])=>`<tr><td>${a}</td><td>${c}</td><td>${(c/N*100).toFixed(1)}%</td></tr>`).join('');
 const sel=(k,arr,cur,fn)=>`<select onchange="S.${k}=${typeof arr[0][0]=='number'?'+':''}this.value;render()">${arr.map(([v,l])=>`<option value="${v}" ${v==cur?'selected':''}>${l}</option>`).join('')}</select>`;
 return`<div class="card"><div class="seg">${PN[L].map((n,i)=>`<button class="${p==i?'on':''}" onclick="S.dp=${i};render()">${n}の位</button>`).join('')}</div>
 <div class="row" style="margin-top:8px">${sel('dw',AW.map(w=>[w,'直近'+w+'回']),dw)}${sel('ds',[['d','数字順'],['fr','頻度順'],['cur','現在周期順'],['ov','周期超過順'],['hot','ホット順']],ds)}</div></div>
 <div class="card"><h2>${PN[L][p]}の位：数字別の分析</h2><table><tr><th>数字</th><th>回数</th><th>頻度</th><th>平均周期</th><th>現在</th><th>最長</th><th>直近 実際/期待</th><th>差</th></tr>${rows}</table><p class="mu">🔥ホット（期待を上回る）／❄コールド（平均周期に対し長く未出）。期待は全期間の出現率から計算しています。</p></div>
 <div class="card"><h2>${PN[L][p]}の位：前回との差分</h2>${ks.map(k=>`<div class="bar"><b style="width:28px">${k>0?'+':''}${k}</b><i style="width:${sd[k]/mxd*65}%"></i>${sd[k]}</div>`).join('')}</div>
 <div class="card"><h2>合計値</h2><p>平均 ${mean.toFixed(1)}／中央値 ${med}／最頻値 ${mode}／標準偏差 ${sdv.toFixed(1)}</p><table><tr><th>合計</th><th>回数</th><th>割合</th></tr>${tb(M.sumH,6)}</table></div>
 <div class="card"><h2>高低（H=5〜9, L=0〜4）</h2><table><tr><th>型</th><th>回数</th><th>割合</th></tr>${tb(M.hlH,8)}</table></div>
 <div class="card"><h2>奇偶（O=奇数, E=偶数）</h2><table><tr><th>型</th><th>回数</th><th>割合</th></tr>${tb(M.oeH,8)}</table></div>`}

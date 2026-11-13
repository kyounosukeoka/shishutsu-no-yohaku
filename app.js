'use strict';
/* 支出の余白：外部通信をしない、ブラウザ内暗号化の支出記録アプリ */
const STORAGE_KEY='shishutsu-no-yohaku-encrypted-v1';
const KDF_ITERATIONS=310000;
const CATEGORIES=[
  {id:'food',name:'食費',icon:'🥬',color:'#72a58c'},
  {id:'dining',name:'外食',icon:'🍽️',color:'#ca946e'},
  {id:'daily',name:'日用品',icon:'🧴',color:'#94b1bb'},
  {id:'transport',name:'交通費',icon:'🚃',color:'#8c9bbe'},
  {id:'housing',name:'住居・家賃',icon:'🏠',color:'#a9987b'},
  {id:'utility',name:'水道・光熱',icon:'💡',color:'#d1b35c'},
  {id:'communication',name:'通信・サブスク',icon:'📱',color:'#9e98c1'},
  {id:'hobby',name:'趣味・娯楽',icon:'🎨',color:'#c78ea4'},
  {id:'clothes',name:'衣服・美容',icon:'👔',color:'#b5a17c'},
  {id:'medical',name:'医療・健康',icon:'💊',color:'#90ad9b'},
  {id:'gift',name:'交際・贈り物',icon:'🎁',color:'#ccaaa2'},
  {id:'other',name:'その他',icon:'📦',color:'#939c9b'}
];
const EXTRA_COLORS=['#8aa7b8','#b39ebd','#d4a381','#8fb69e','#bfa774','#c79eaa','#97a8c3','#b7b68d'];
const COLOR_PALETTE=['#72a58c','#2e695c','#a2bf94','#8c9bbe','#4c80a7','#94b1bb','#9e98c1','#7665a7','#c78ea4','#d76883','#b74847','#ca946e','#d1b35c','#c6a051','#a9987b','#b5a17c','#939c9b','#4d6868','#343e4b','#8fb69e','#f3b59b','#ddabcf','#b7b68d','#e2cdb1'];
const normalizeColor=(color)=>/^#[0-9a-f]{6}$/i.test(String(color||''))?String(color).toLowerCase():'#939c9b';
const APP_VERSION='12.0.0';
const AUTO_UNLOCK_FLAG='shishutsu-no-yohaku-auto-unlock-v1';
const KEY_DB='shishutsu-no-yohaku-device-key-v1';
/* カテゴリー登録用：端末に標準搭載された絵文字から選択 */
const EMOJI_GROUPS=[
  {id:'food',name:'食べ物',emojis:'🍚 🍙 🍞 🥐 🥯 🍜 🍝 🍲 🍛 🍣 🍱 🍕 🍔 🍟 🥪 🥗 🥬 🥕 🥦 🍅 🥑 🍎 🍊 🍋 🍓 🍇 🍌 🧀 🥩 🍗 🐟 🦀 🥚 🥛 ☕ 🍵 🍰 🍪 🍫 🍺 🧋'},
  {id:'home',name:'暮らし',emojis:'🏠 🏡 🏢 🛋️ 🛏️ 🛁 🚿 🚽 🧹 🧺 🧻 🧴 🧼 🧽 🪥 🪒 💡 🔌 🔋 💧 🔥 🪴 🌿 🌷 🪞 🗝️ 🧰 🔧 🪛 🖨️ 📺 🧊'},
  {id:'travel',name:'交通・外出',emojis:'🚗 🚕 🚌 🚎 🚃 🚆 🚄 🚇 🚲 🛵 🏍️ ✈️ 🚀 🚢 ⛴️ 🚁 ⛽ 🅿️ 🚥 🛣️ 🧳 🗺️ 🏕️ ⛺ 🏖️ 🏨 🏯 🎫 🎟️'},
  {id:'shop',name:'買い物',emojis:'🛍️ 🛒 🧾 💰 💴 💳 🪙 👛 🎁 👕 👔 👗 👖 🧥 👟 👠 👞 🧦 🧢 👜 💼 🎒 ⌚ 💍 💎 🧸'},
  {id:'hobby',name:'趣味',emojis:'📚 📖 📕 ✏️ 🖊️ 📝 🎨 🖌️ 🎬 🎥 📷 📸 🎮 🕹️ 🎧 🎤 🎼 🎹 🎸 🎻 🥁 🧩 ♟️ 🏋️ ⚽ 🏀 🎾 🏸 🏊 🎣 🏂 🎿'},
  {id:'health',name:'健康・美容',emojis:'💊 💉 🏥 🩺 🩹 🦷 👓 🕶️ ✂️ 💇 💅 💄 🧖 🛀 🧘 💪 🫀 🧠 ❤️ 🐾 🐶 🐱 🐰 🐹'},
  {id:'people',name:'人・行事',emojis:'👨 👩 👶 👨‍👩‍👧 👪 💑 💒 💐 🎂 🎉 🎊 🎄 🎍 🎎 🎏 🪅 🎃 🌸 💌 🫶 🤝 🙏 🕯️'},
  {id:'work',name:'仕事・学び',emojis:'💻 🖥️ 📱 ☎️ 📞 📠 🖨️ 🗂️ 📁 📂 📋 📌 📎 📐 📏 🧮 📊 📈 📉 🏫 🎓 🧑‍💻 🏦 🏭 🏬 🔬 🔭'},
  {id:'other',name:'その他',emojis:'⭐ 🌟 ✨ ☀️ 🌙 ☁️ 🌧️ ❄️ 🌈 🌊 🍀 🌳 🌻 🔔 ⚡ 🎯 🏆 🥇 🧡 💙 💚 🤍 🖤 ✅ ❗ ❓ 🔑 📦 🔖 🪄'}
].map(group=>({...group,emojis:group.emojis.split(' ')}));
const EMOJI_TOTAL=EMOJI_GROUPS.reduce((n,group)=>n+group.emojis.length,0);

const RATING_NAMES={1:'無駄な出費だった',2:'やや無駄だった',3:'どちらともいえない',4:'良い支出だった',5:'支払って良かった'};
const $=(selector)=>document.querySelector(selector);
const $$=(selector)=>[...document.querySelectorAll(selector)];
const yen=(v)=>'¥'+Number(v||0).toLocaleString('ja-JP');
const num=(v)=>Number(v||0).toLocaleString('ja-JP');
const escapeHTML=(val)=>String(val??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeId=()=>crypto.randomUUID?.()||('id-'+Date.now()+'-'+Math.random().toString(36).slice(2));
const pad=(n)=>String(n).padStart(2,'0');
function today(){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function parseISO(s){const [y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d));}
function utcISO(d){return d.toISOString().slice(0,10);}
function addDays(date,days){const d=parseISO(date);d.setUTCDate(d.getUTCDate()+days);return utcISO(d);}
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;try{return utcISO(parseISO(s))===s;}catch{return false;}}
function shiftMonth(key,delta){const [y,m]=key.split('-').map(Number);const date=new Date(Date.UTC(y,m-1+delta,1));return utcISO(date).slice(0,7);}
function displayMonth(key){const [y,m]=key.split('-');return `${y}年${Number(m)}月`;}
function displayDate(key){if(!key)return '';const [y,m,d]=key.split('-');return `${Number(m)}月${Number(d)}日`;}
function monthRecords(key){return state.records.filter(r=>r.date.slice(0,7)===key);}
function sum(records){return records.reduce((t,r)=>t+Number(r.amount||0),0);}
function categoryById(id){return state.categories.find(c=>c.id===id)||{id,name:'未分類',icon:'◈',color:'#9ba5a0'};}
function totalsByCategory(records){const counts=new Map();for(const r of records)counts.set(r.category,(counts.get(r.category)||0)+r.amount);return [...counts.entries()].map(([id,total])=>({cat:categoryById(id),total})).sort((a,b)=>b.total-a.total);}
function sortedRecords(records){return [...records].sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt).localeCompare(String(a.createdAt)));}
function initialState(){return {version:1,records:[],categories:CATEGORIES.map(c=>({...c})),budgets:{},recurrings:[],skippedOccurrences:[]};}
let state=initialState();
let sessionKey=null,sessionSalt=null;
let saveQueue=Promise.resolve();
let viewMonth=today().slice(0,7),selectedDay=today();
let currentTab='record',currentChart='pie';
let ledgerMode='three', ledgerAnchor=today();
let entryCategory=null,entryAmount=0,entryPlanned='planned',entryRating=3,editingId=null;
let selectedNewCategoryIcon='📦',selectedEmojiGroup='food';
let calc={text:'0',left:null,operator:null,resetNext:false};
let toastTimer=null;

function encode64(bytes){return btoa(String.fromCharCode(...bytes));}
function decode64(str){return Uint8Array.from(atob(str),c=>c.charCodeAt(0));}
async function deriveKey(password,salt){const raw=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:decode64(salt),iterations:KDF_ITERATIONS},raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
function newSalt(){return encode64(crypto.getRandomValues(new Uint8Array(16)));}
async function encryptState(){const iv=crypto.getRandomValues(new Uint8Array(12));const bytes=new TextEncoder().encode(JSON.stringify(state));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},sessionKey,bytes);return JSON.stringify({version:1,salt:sessionSalt,iv:encode64(iv),data:encode64(new Uint8Array(ciphertext))});}
async function persistState(){if(!sessionKey)throw new Error('ロック中のため保存できません。');localStorage.setItem(STORAGE_KEY,await encryptState());}
function queueSave(){saveQueue=saveQueue.catch(()=>{}).then(persistState);saveQueue.catch(()=>toast('保存に失敗しました。端末の空き容量をご確認ください。',true));}
async function decryptSaved(password){const e=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!e||e.version!==1||typeof e.salt!=='string'||typeof e.iv!=='string'||typeof e.data!=='string')throw new Error('保存形式が正しくありません。');const key=await deriveKey(password,e.salt);const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode64(e.iv)},key,decode64(e.data));const loaded=JSON.parse(new TextDecoder().decode(bytes));if(!loaded||!Array.isArray(loaded.records)||!Array.isArray(loaded.categories)||!Array.isArray(loaded.recurrings))throw new Error('記録の形式が正しくありません。');return {loaded,key,salt:e.salt};}
/* ログイン省略時は、復号鍵をこの端末のIndexedDBに保持する。
   パスワードや平文データをlocalStorageに保存しない。 */
function deviceKeyStore(action,key){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in globalThis)){reject(new Error('このブラウザでは端末内の鍵保存を利用できません。'));return;}
    const request=indexedDB.open(KEY_DB,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('keys'))request.result.createObjectStore('keys');};
    request.onerror=()=>reject(request.error||new Error('端末鍵ストアにアクセスできません。'));
    request.onsuccess=()=>{
      const db=request.result;
      try{
        const tx=db.transaction('keys',action==='get'?'readonly':'readwrite');
        const store=tx.objectStore('keys');
        const req=action==='get'?store.get('current'):action==='put'?store.put(key,'current'):store.delete('current');
        let result=null;
        req.onsuccess=()=>{result=req.result;};
        tx.oncomplete=()=>{db.close();resolve(result);};
        tx.onerror=()=>{db.close();reject(tx.error||new Error('端末鍵を保存できません。'));};
        tx.onabort=()=>{db.close();reject(tx.error||new Error('端末鍵の保存が中断されました。'));};
      }catch(err){db.close();reject(err);}
    };
  });
}
function autoUnlockEnabled(){return localStorage.getItem(AUTO_UNLOCK_FLAG)==='1';}
function renderLoginPreference(){
  const toggle=$('#loginOnLaunch');if(!toggle)return;
  toggle.checked=!autoUnlockEnabled();
  $('#loginPreferenceStatus').textContent=toggle.checked?'起動時に数字パスワードを入力します。':'次回からこの端末ではパスワードなしで開きます。';
}
async function setLoginRequired(required){
  if(required){
    // 先に設定を無効化しておき、鍵の削除が失敗しても自動解除を行わない。
    localStorage.removeItem(AUTO_UNLOCK_FLAG);
    await deviceKeyStore('delete');
  }else{
    if(!sessionKey)throw new Error('ログイン後に設定してください。');
    await saveQueue;
    await deviceKeyStore('put',sessionKey);
    localStorage.setItem(AUTO_UNLOCK_FLAG,'1');
  }
  renderLoginPreference();
}
async function attemptAutoUnlock(){
  if(!autoUnlockEnabled()||!localStorage.getItem(STORAGE_KEY))return;
  const button=$('#authSubmit');button.disabled=true;
  $('#authDescription').textContent='端末内の記録を開いています…';
  try{
    const key=await deviceKeyStore('get');
    if(!key)throw new Error('端末鍵が見つかりません。');
    const e=JSON.parse(localStorage.getItem(STORAGE_KEY));
    const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode64(e.iv)},key,decode64(e.data));
    const loaded=JSON.parse(new TextDecoder().decode(bytes));
    if(!loaded||!Array.isArray(loaded.records)||!Array.isArray(loaded.categories)||!Array.isArray(loaded.recurrings))throw new Error('データの形式が正しくありません。');
    state=loaded;sessionKey=key;sessionSalt=e.salt;
    state.budgets ||= {};state.skippedOccurrences ||= [];
    const generated=generateRecurring();
    if(generated){await persistState();}
    showApp();if(generated)toast(`定期支出を${generated}件登録しました。`);
  }catch(err){
    console.warn('Auto unlock unavailable:',err);
    sessionKey=null;sessionSalt=null;state=initialState();
    localStorage.removeItem(AUTO_UNLOCK_FLAG);
    try{await deviceKeyStore('delete');}catch{}
    setupAuth();
    $('#authDescription').textContent='自動ログインができませんでした。数字パスワードで開いてください。';
  }finally{button.disabled=false;}
}
$('#loginOnLaunch').addEventListener('change',async(event)=>{
  const required=event.target.checked;
  event.target.disabled=true;
  try{await setLoginRequired(required);toast(required?'次回から起動時にパスワードを求めます。':'次回からこの端末ではログインを省略します。');}
  catch(err){console.error(err);renderLoginPreference();toast('変更できませんでした。ブラウザの保存設定をご確認ください。',true);}
  finally{event.target.disabled=false;}
});
function toast(message,isError=false){const box=$('#toast');box.textContent=message;box.style.background=isError?'#ab4646':'';box.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.add('hidden'),3300);}
function setupAuth(){$('#appVersion').textContent=`支出の余白　Ver.${APP_VERSION}`;const hasData=Boolean(localStorage.getItem(STORAGE_KEY));$('#confirmWrap').classList.toggle('hidden',hasData);$('#authDescription').textContent=hasData?'パスワードを入力すると、記録を開けます。':'この端末に、パスワードで保護された家計簿をつくります。';$('#authSubmit').textContent=hasData?'家計簿を開く':'家計簿をはじめる';$('#authError').textContent='';$('#authPassword').value='';$('#authConfirm').value='';$('#authPassword').autocomplete=hasData?'current-password':'new-password';$('#authPassword').previousElementSibling.textContent=hasData?'パスワード（数字入力対応）':'数字パスワード（4桁以上）';$('#authPassword').placeholder=hasData?'パスワードを入力':'数字4桁以上';}
function showApp(){renderLoginPreference();const t=today();$('#authScreen').classList.add('hidden');$('#app').classList.remove('hidden');$('#headerDate').textContent=`${Number(t.slice(5,7))}月${Number(t.slice(8,10))}日`;viewMonth=t.slice(0,7);selectedDay=t;ledgerAnchor=t;resetEntry();renderAll();goTab('record');}
async function lockApp(){await saveQueue.catch(()=>{});sessionKey=null;sessionSalt=null;state=initialState();$('#app').classList.add('hidden');$('#authScreen').classList.remove('hidden');$$('.modal').forEach(m=>m.classList.add('hidden'));document.body.style.overflow='';setupAuth();}
$('#authForm').addEventListener('submit',async(e)=>{e.preventDefault();const pw=$('#authPassword').value,hasData=Boolean(localStorage.getItem(STORAGE_KEY));const btn=$('#authSubmit');$('#authError').textContent='';if(hasData?!pw:!/^\d{4,}$/.test(pw)){$('#authError').textContent=hasData?'パスワードを入力してください。':'数字4桁以上で設定してください。';return;}if(!hasData&&pw!==$('#authConfirm').value){$('#authError').textContent='確認用のパスワードが一致しません。';return;}if(!globalThis.crypto?.subtle){$('#authError').textContent='暗号化機能が利用できません。HTTPSのGitHub Pagesで開いてください。';return;}
  btn.disabled=true;btn.textContent=hasData?'照合しています…':'暗号化しています…';
  try{if(hasData){const data=await decryptSaved(pw);state=data.loaded;sessionKey=data.key;sessionSalt=data.salt;state.budgets ||= {};state.skippedOccurrences ||= [];}else{state=initialState();sessionSalt=newSalt();sessionKey=await deriveKey(pw,sessionSalt);await persistState();}
    const generated=generateRecurring();if(generated>0){try{await persistState();}catch(err){console.error(err);}}
    showApp();if(generated)toast(`定期支出を${generated}件登録しました。`);
  }catch(err){console.error('Cannot unlock local records:',err);sessionKey=null;sessionSalt=null;$('#authError').textContent=hasData?'パスワードが違うか、保存データが破損しています。':'保存できませんでした。端末の空き容量をご確認ください。';}
  finally{btn.disabled=false;btn.textContent=hasData?'家計簿を開く':'家計簿をはじめる';$('#authPassword').value='';$('#authConfirm').value='';}
});
$('#lockBtn').addEventListener('click',lockApp);

function goTab(name){if(!['record','home','calendar','ledger','analysis','settings'].includes(name))return;currentTab=name;$$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${name}`));$$('.tab').forEach(b=>{const active=b.dataset.tab===name;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});if(name==='settings')renderSettings();if(name==='home')renderHome();if(name==='analysis')renderAnalysis();if(name==='calendar')renderCalendar();if(name==='ledger')renderLedger();window.scrollTo(0,0);}
$$('.tab').forEach(b=>b.addEventListener('click',()=>goTab(b.dataset.tab)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>goTab(b.dataset.go)));
$$('[data-month-delta]').forEach(b=>b.addEventListener('click',()=>{viewMonth=shiftMonth(viewMonth,Number(b.dataset.monthDelta));if(!selectedDay.startsWith(viewMonth))selectedDay=viewMonth+'-01';renderHome();renderCalendar();renderAnalysis();}));
function renderAll(){renderCategories();renderRating();renderRecents();renderHome();renderCalendar();renderAnalysis();renderSettings();renderBudgetHint();if(currentTab==='ledger')renderLedger();}

function resetEntry(){editingId=null;entryCategory=null;entryAmount=0;entryPlanned='planned';entryRating=3;$('#recordForm').reset();$('#entryDate').value=today();$('#entryMemo').value='';$('#entryAmount').value='';$('#entryHeading').textContent='今日の支出を記録';$('#submitRecord').textContent='＋ この支出を記録する';$('#submitRecordQuick').textContent='＋ この支出を記録する';$('#cancelEdit').classList.add('hidden');renderCategories();renderRating();renderEntryState();}
function renderCategories(){const grid=$('#categoryGrid');grid.innerHTML=state.categories.map(c=>`<button type="button" class="category-choice ${entryCategory===c.id?'selected':''}" data-category="${escapeHTML(c.id)}" aria-pressed="${entryCategory===c.id}"><span class="cat-emoji">${escapeHTML(c.icon)}</span><span class="cat-name">${escapeHTML(c.name)}</span></button>`).join('');}
$('#categoryGrid').addEventListener('click',(e)=>{const b=e.target.closest('[data-category]');if(!b)return;entryCategory=b.dataset.category;renderCategories();renderBudgetHint();});
$('#entryDate').addEventListener('change',renderBudgetHint);
function renderBudgetHint(){const el=$('#budgetHint');el.classList.remove('overspent');if(!entryCategory){el.textContent='カテゴリーを選ぶと、その月の残り予算が表示されます。';return;}const category=categoryById(entryCategory);const budget=Number(state.budgets[entryCategory]||0);if(!budget){el.textContent=`${category.icon} ${category.name}の月間予算は未設定です（設定から登録できます）。`;return;}const date=$('#entryDate').value||today();const month=date.slice(0,7);const used=sum(monthRecords(month).filter(r=>r.category===entryCategory && r.id!==editingId));const remaining=budget-used;const after=remaining-entryAmount;el.textContent=`${displayMonth(month)}・残り予算 ${yen(remaining)}（${entryAmount>0?'今回の記録後 '+yen(after):'設定 '+yen(budget)}）`;if(remaining<0||(entryAmount>0&&after<0))el.classList.add('overspent');}
function renderRating(){const parent=$('#ratingButtons');parent.innerHTML=[1,2,3,4,5].map(i=>`<button type="button" class="rating-btn ${i===entryRating?'selected':''}" data-rating="${i}" title="${RATING_NAMES[i]}" aria-label="${i}：${RATING_NAMES[i]}" aria-pressed="${i===entryRating}">${i}</button>`).join('');$('#ratingDescription').textContent=`${entryRating} / 5 － ${RATING_NAMES[entryRating]}`;$('#ratingDescription').style.color=entryRating<=2?'var(--red)':'var(--green-2)';}
$('#ratingButtons').addEventListener('click',(e)=>{const b=e.target.closest('[data-rating]');if(!b)return;entryRating=Number(b.dataset.rating);renderRating();});
function renderEntryState(){$('#amountDisplay').textContent=num(entryAmount);$('#entryAmount').value=entryAmount>0?String(entryAmount):'';$$('[data-planned]').forEach(b=>{const isSelected=b.dataset.planned===entryPlanned;b.classList.toggle('selected',isSelected);b.setAttribute('aria-pressed',String(isSelected));});renderBudgetHint();}
$('#planTypeGroup').addEventListener('click',(e)=>{const b=e.target.closest('[data-planned]');if(!b)return;entryPlanned=b.dataset.planned;renderEntryState();});
$('#cancelEdit').addEventListener('click',resetEntry);
$('#recordForm').addEventListener('submit',(e)=>{e.preventDefault();const date=$('#entryDate').value,memo=$('#entryMemo').value.trim();if(!validDate(date)){toast('正しい記録日を指定してください。',true);return;}if(!entryCategory){toast('カテゴリーを選択してください。',true);return;}if(!Number.isSafeInteger(entryAmount)||entryAmount<1||entryAmount>999999999){toast('電卓で1〜999,999,999円の金額を入力してください。',true);return;}
  if(editingId){const existing=state.records.find(r=>r.id===editingId);if(!existing){toast('編集対象が見つかりません。',true);return;}Object.assign(existing,{date,category:entryCategory,amount:entryAmount,memo,planned:entryPlanned,rating:entryRating,updatedAt:new Date().toISOString()});queueSave();toast('支出を更新しました。');}
  else{state.records.push({id:safeId(),date,category:entryCategory,amount:entryAmount,memo,planned:entryPlanned,rating:entryRating,createdAt:new Date().toISOString(),recurringId:null,scheduledDate:null});queueSave();toast(`${yen(entryAmount)}を記録しました。`);}
  resetEntry();renderAll();
});
function editRecord(id){const r=state.records.find(r=>r.id===id);if(!r)return;editingId=r.id;entryCategory=r.category;entryAmount=r.amount;entryPlanned=r.planned;entryRating=r.rating;$('#entryDate').value=r.date;$('#entryMemo').value=r.memo||'';$('#entryHeading').textContent='支出の記録を編集';$('#submitRecord').textContent='✓ 変更内容を保存する';$('#submitRecordQuick').textContent='✓ 変更内容を保存する';$('#cancelEdit').classList.remove('hidden');renderCategories();renderRating();renderEntryState();goTab('record');}
function deleteRecord(id){const r=state.records.find(r=>r.id===id);if(!r)return;if(!confirm(`${displayDate(r.date)}の${yen(r.amount)}を削除しますか？`))return;if(r.recurringId&&r.scheduledDate){const key=r.recurringId+'|'+r.scheduledDate;if(!state.skippedOccurrences.includes(key))state.skippedOccurrences.push(key);}state.records=state.records.filter(row=>row.id!==id);queueSave();if(editingId===id)resetEntry();renderAll();toast('記録を削除しました。');}
document.addEventListener('click',(e)=>{const edit=e.target.closest('[data-edit]');if(edit){editRecord(edit.dataset.edit);return;}const del=e.target.closest('[data-delete]');if(del){deleteRecord(del.dataset.delete);return;}});
function recordRow(r){const c=categoryById(r.category);return `<div class="record-item"><span class="record-emoji" style="background:${escapeHTML(c.color)}19">${escapeHTML(c.icon)}</span><div class="record-meta"><strong>${escapeHTML(r.memo||c.name)}</strong><small>${escapeHTML(displayDate(r.date))} ・ ${escapeHTML(c.name)} ・ 評価${Number(r.rating)}${r.recurringId?' ・ 定期':''}</small></div><div class="record-amount"><strong class="${r.planned==='unexpected'?'unexpected':''}">${yen(r.amount)}</strong><div class="record-actions"><button type="button" class="record-action" data-edit="${escapeHTML(r.id)}">編集</button><button type="button" class="record-action danger" data-delete="${escapeHTML(r.id)}">削除</button></div></div></div>`;}
function renderRecents(){const records=sortedRecords(state.records).slice(0,5);$('#recentRecords').innerHTML=records.length?records.map(recordRow).join(''):'<div class="empty-state">記録はまだありません。<br>最初の支出を登録してみましょう。</div>';}

/* 電卓：入力済みの金額を初期値として読み込み、確定時のみ入力欄を更新 */
function openCalculator(){calc={text:String(entryAmount||0),left:null,operator:null,resetNext:false};renderCalculator();$('#calculatorModal').classList.remove('hidden');document.body.style.overflow='hidden';}
function closeCalculator(){ $('#calculatorModal').classList.add('hidden');document.body.style.overflow='';}
function renderCalculator(){$('#calcValue').textContent=num(Number(calc.text));$('#calcExpression').textContent=calc.operator!==null?`${num(calc.left)} ${calc.operator}`:'';}
function calculate(left,right,op){if(op==='＋')return left+right;if(op==='−')return left-right;if(op==='×')return left*right;if(op==='÷')return right===0?NaN:left/right;return right;}
function applyOperator(op){const current=Number(calc.text);if(calc.operator!==null&&!calc.resetNext){const result=calculate(calc.left,current,calc.operator);if(!Number.isFinite(result)||result<0||result>999999999){toast('計算結果が不正です。',true);return;}calc.text=String(Math.round(result));calc.left=Number(calc.text);}else calc.left=current;calc.operator=op;calc.resetNext=true;}
function calcPress(key){if(key==='C'){calc={text:'0',left:null,operator:null,resetNext:false};}else if(key==='BACK'){if(calc.resetNext){calc.text='0';calc.resetNext=false;}else calc.text=calc.text.length>1?calc.text.slice(0,-1):'0';}else if(/^\d{1,2}$/.test(key)){if(calc.resetNext){calc.text=key==='00'?'0':key;calc.resetNext=false;}else{const candidate=calc.text==='0'?key:calc.text+key;calc.text=String(Math.min(999999999,Number(candidate)));}}else if(['＋','−','×','÷'].includes(key))applyOperator(key);else if(key==='='){if(calc.operator!==null){const result=calculate(calc.left,Number(calc.text),calc.operator);if(!Number.isFinite(result)||result<0||result>999999999){toast('計算結果が不正です（ゼロ除算など）。',true);return;}calc.text=String(Math.round(result));calc.left=null;calc.operator=null;calc.resetNext=true;}}renderCalculator();}
$('#amountButton').addEventListener('click',openCalculator);
$('#calcKeys').addEventListener('click',(e)=>{const key=e.target.closest('[data-key]');if(key)calcPress(key.dataset.key);});
$('#calcApply').addEventListener('click',()=>{if(calc.operator!==null)calcPress('=');const value=Number(calc.text);if(!Number.isSafeInteger(value)||value<0||value>999999999){toast('金額を確認してください。',true);return;}entryAmount=value;renderEntryState();closeCalculator();});
document.addEventListener('keydown',(e)=>{if($('#calculatorModal').classList.contains('hidden'))return;if(e.key==='Escape'){closeCalculator();return;}if(e.key==='Enter'){e.preventDefault();$('#calcApply').click();return;}if(/^\d$/.test(e.key)){e.preventDefault();calcPress(e.key);return;}const keys={'Backspace':'BACK','Delete':'C','+':'＋','-':'−','*':'×','/':'÷','=':'='};if(keys[e.key]){e.preventDefault();calcPress(keys[e.key]);}});

function renderHome(){const recs=monthRecords(viewMonth),total=sum(recs);$('#homeMonthTitle').textContent=displayMonth(viewMonth);$('#heroEyebrow').textContent=viewMonth===today().slice(0,7)?'今月の支出合計':'表示月の支出合計';$('#homeTotal').textContent=yen(total);const configured=Object.entries(state.budgets).filter(([,v])=>Number(v)>0);if(configured.length){const budgetSum=configured.reduce((s,[,v])=>s+Number(v),0);const usedSum=sum(recs.filter(r=>Number(state.budgets[r.category]||0)>0));const left=budgetSum-usedSum;$('#homeBudgetStatus').innerHTML=`予算設定済みのカテゴリー：<b>${configured.length}件</b> ／ 残り <b style="color:${left<0?'#ffc3b6':'#fff'}">${yen(left)}</b><br><span style="font-size:10px;color:#c0d5ce">※ 予算未設定のカテゴリーは含みません</span>`;}else $('#homeBudgetStatus').textContent='カテゴリーごとの予算は「設定」から登録できます。';
 const t=today(),weekday=(parseISO(t).getUTCDay()+6)%7,start=addDays(t,-weekday),end=addDays(start,6);$('#statDaily').textContent=yen(sum(state.records.filter(r=>r.date===t)));$('#statDailyDate').textContent=displayDate(t);$('#statWeekly').textContent=yen(sum(state.records.filter(r=>r.date>=start&&r.date<=end)));$('#statWeeklyDates').textContent=`${displayDate(start)}〜${displayDate(end)}`;$('#statMonthly').textContent=yen(total);$('#statMonthlyNote').textContent=`${recs.length}件の支出`;
 const totals=totalsByCategory(recs);const max=totals[0]?.total||1;$('#homeCategories').innerHTML=totals.length?totals.map(({cat,total:amount})=>`<div class="category-total"><div class="badge-icon" style="background:${escapeHTML(cat.color)}1f">${escapeHTML(cat.icon)}</div><div class="category-total-main"><div class="category-total-title"><span>${escapeHTML(cat.name)}</span><strong>${yen(amount)}</strong></div><div class="bar-bg"><div class="bar-fill" style="width:${Math.round(amount/max*100)}%;background:${escapeHTML(cat.color)}"></div></div></div></div>`).join(''):'<div class="empty-state">まだ支出の記録がありません。</div>';
 const low=recs.filter(r=>r.rating<=2),lowAmount=sum(low);let insight;if(!recs.length){insight='<div class="insight-box">最初の支出を記録すると、使い方を振り返るヒントがここに表示されます。</div>';}else if(low.length){const [top]=totalsByCategory(low);insight=`<div class="insight-box red"><div class="insight-title">見直し候補が ${low.length}件</div>満足度が低かった支出は合計 <b>${yen(lowAmount)}</b> です。特に「<b>${escapeHTML(top.cat.name)}</b>」に <b>${yen(top.total)}</b> あります。<br>自分にとって必要だったか、振り返ってみましょう。</div>`;}else{insight='<div class="insight-box"><div class="insight-title">低評価の支出はありません</div>今月は「無駄だった」「やや無駄だった」と評価した記録がありません。使って良かったものの傾向も見てみましょう。</div>';}$('#homeInsights').innerHTML=insight+'<p class="insight-sub">※ 見直し候補はあなた自身が付けた評価1〜2を集計したものです。</p>';
 const unplanned=recs.filter(r=>r.planned==='unexpected'),planned=recs.filter(r=>r.planned!=='unexpected');$('#homeUnexpected').innerHTML=`<div class="comparison-row"><span>予定外の支出</span><strong class="red">${yen(sum(unplanned))}</strong></div><div class="comparison-row"><span>件数</span><strong>${unplanned.length}件</strong></div><div class="comparison-row"><span>予定していた支出</span><strong>${yen(sum(planned))}</strong></div>`;
 $('#homeHistory').innerHTML=recs.length?sortedRecords(recs).map(recordRow).join(''):'<div class="empty-state">この月に登録された支出はありません。</div>';
}

function renderCalendar(){const [year,month]=viewMonth.split('-').map(Number);$('#calendarMonthTitle').textContent=displayMonth(viewMonth);const length=new Date(Date.UTC(year,month,0)).getUTCDate();const start=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7;const dayMap=new Map();for(const r of monthRecords(viewMonth)){if(!dayMap.has(r.date))dayMap.set(r.date,[]);dayMap.get(r.date).push(r);}let html='';const cells=Math.max(35,Math.ceil((start+length)/7)*7);for(let i=0;i<cells;i++){const d=i-start+1;if(d<1||d>length){html+='<span class="calendar-day blank" aria-hidden="true"></span>';continue;}const date=`${year}-${pad(month)}-${pad(d)}`,recs=dayMap.get(date)||[],amount=sum(recs),unexpected=recs.some(r=>r.planned==='unexpected');html+=`<button type="button" class="calendar-day ${date===selectedDay?'selected':''} ${date===today()?'today':''} ${unexpected?'has-unexpected':''}" data-calendar-date="${date}" aria-label="${d}日、支出${yen(amount)}" title="${d}日：${yen(amount)}" aria-pressed="${date===selectedDay}"><span class="day-number">${d}</span>${amount?`<span class="day-amount">${yen(amount)}</span>`:''}${unexpected?'<span class="day-indicator" aria-label="予定外の支出あり"></span>':''}</button>`;}$('#calendarGrid').innerHTML=html;renderSelectedDay();}
$('#calendarGrid').addEventListener('click',(e)=>{const b=e.target.closest('[data-calendar-date]');if(!b)return;selectedDay=b.dataset.calendarDate;renderCalendar();});
function renderSelectedDay(){const recs=state.records.filter(r=>r.date===selectedDay);$('#selectedDayTitle').textContent=`${displayDate(selectedDay)}の支出`;$('#selectedDayTotal').textContent=yen(sum(recs));const totals=totalsByCategory(recs);$('#dayCategories').innerHTML=totals.map(({cat,total})=>`<div class="comparison-row"><span>${escapeHTML(cat.icon)} ${escapeHTML(cat.name)}</span><strong>${yen(total)}</strong></div>`).join('')||'<div class="empty-state">この日の記録はありません。日付を選択してください。</div>';$('#dayRecords').innerHTML=sortedRecords(recs).map(recordRow).join('');}

function renderAnalysis(){const recs=monthRecords(viewMonth),largest=[...recs].sort((a,b)=>b.amount-a.amount)[0];$('#analysisMonthTitle').textContent=displayMonth(viewMonth);$('#analysisMax').textContent=yen(largest?.amount||0);$('#analysisMaxDetail').textContent=largest?`${displayDate(largest.date)}・${categoryById(largest.category).name}`:'記録なし';const low=recs.filter(r=>r.rating<=2),happy=recs.filter(r=>r.rating>=4);$('#analysisWaste').textContent=yen(sum(low));$('#analysisWastePct').textContent=`${low.length}件 ／ この月の記録から`;$('#analysisSatisfied').textContent=yen(sum(happy));$('#analysisSatisfiedPct').textContent=`${happy.length}件 ／ この月の記録から`;
 $$('.chart-tab').forEach(b=>b.classList.toggle('selected',b.dataset.chart===currentChart));const total=sum(recs),cats=totalsByCategory(recs);const chart=$('#analysisChart');if(!recs.length){chart.innerHTML='<div class="empty-state">この月の記録が増えるとグラフが表示されます。</div>';}else if(currentChart==='pie'){let sofar=0;const stops=cats.map(({cat,total:amount})=>{const begin=sofar;sofar+=amount/total*100;return `${normalizeColor(cat.color)} ${begin.toFixed(4)}% ${sofar.toFixed(4)}%`;}).join(',');chart.innerHTML=`<div class="donut-layout"><div class="donut" role="img" aria-label="カテゴリー別支出割合" style="background:conic-gradient(${stops})"><div class="donut-center"><small>合計支出</small><strong>${yen(total)}</strong></div></div><div class="chart-legend">${cats.map(({cat,total:amount})=>`<div class="legend-row"><i class="legend-dot" style="background:${normalizeColor(cat.color)}"></i><span class="legend-label">${escapeHTML(cat.name)}</span><span class="legend-value">${Math.round(amount/total*100)}%</span></div>`).join('')}</div></div>`;
 }else if(currentChart==='bar'){const max=cats[0]?.total||1;chart.innerHTML=cats.map(({cat,total:amount})=>`<div class="horizontal-bar"><span>${escapeHTML(cat.icon)} ${escapeHTML(cat.name)}</span><div class="bar-bg"><div class="bar-fill" style="width:${amount/max*100}%;background:${normalizeColor(cat.color)}"></div></div><b>${yen(amount)}</b></div>`).join('');}else{chart.innerHTML=lineChart(recs);}
 $('#ratingAnalysis').innerHTML=[1,2,3,4,5].map(rating=>{const filtered=recs.filter(r=>r.rating===rating),amount=sum(filtered);return `<div class="rating-row"><span class="rating-row-label">${rating}：${RATING_NAMES[rating]}</span><div class="bar-bg"><div class="bar-fill" style="width:${total?amount/total*100:0}%;background:${rating<=2?'#c47470':rating===3?'#c8b88c':'#79a78e'}"></div></div><span class="rating-row-amount">${yen(amount)}</span></div>`;}).join('');const unexpected=recs.filter(r=>r.planned==='unexpected'),a=sum(unexpected),b=total-a;$('#planAnalysis').innerHTML=`<div class="comparison-row"><span>予定していた支出</span><strong>${yen(b)}</strong></div><div class="comparison-row"><span style="color:var(--red)">予期していない支出</span><strong class="red">${yen(a)}</strong></div><div class="ratio-track"><span class="ratio-green" style="width:${total?b/total*100:0}%"></span><span class="ratio-red" style="width:${total?a/total*100:0}%"></span></div><div class="muted tiny">予定外：${unexpected.length}件 ／ 全${recs.length}件</div>`;
}
$$('.chart-tab').forEach(b=>b.addEventListener('click',()=>{currentChart=b.dataset.chart;renderAnalysis();}));
function lineChart(recs){const [year,month]=viewMonth.split('-').map(Number),days=new Date(Date.UTC(year,month,0)).getUTCDate();const daily=Array(days).fill(0);for(const r of recs)daily[Number(r.date.slice(-2))-1]+=r.amount;const max=Math.max(1,...daily),w=760,h=258,left=55,right=16,top=19,bottom=41,innerW=w-left-right,innerH=h-top-bottom;const point=(amount,index)=>`${(left+innerW*index/Math.max(days-1,1)).toFixed(1)},${(top+innerH*(1-amount/max)).toFixed(1)}`;const points=daily.map(point).join(' ');const area=`${left},${top+innerH} ${points} ${left+innerW},${top+innerH}`;const marks=[0,.5,1].map(v=>`<line x1="${left}" y1="${top+innerH*(1-v)}" x2="${w-right}" y2="${top+innerH*(1-v)}" stroke="#e5eae3" stroke-dasharray="4 4"/><text x="${left-10}" y="${top+innerH*(1-v)+5}" text-anchor="end" font-size="11" fill="#7f9087">${num(Math.round(max*v))}</text>`).join('');const labels=[1,Math.max(1,Math.floor(days/4)),Math.max(1,Math.floor(days/2)),Math.max(1,Math.floor(days*3/4)),days];const ticks=[...new Set(labels)].map(day=>`<text x="${left+innerW*(day-1)/Math.max(days-1,1)}" y="${h-16}" text-anchor="middle" font-size="11" fill="#7f9087">${day}日</text>`).join('');const series=totalsByCategory(recs).slice(0,6).map(({cat})=>{const values=Array(days).fill(0);for(const r of recs)if(r.category===cat.id)values[Number(r.date.slice(-2))-1]+=r.amount;return {cat,points:values.map(point).join(' ')};});
const categoryTrends=series.map(({cat,points})=>`<polyline points="${points}" fill="none" stroke="${normalizeColor(cat.color)}" stroke-width="2.7" opacity=".88" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
const trendLegend=series.map(({cat})=>`<span class="trend-category"><i style="background:${normalizeColor(cat.color)}"></i>${escapeHTML(cat.name)}</span>`).join('');
return `<svg class="line-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="日ごとの総支出と主なカテゴリー別支出を折れ線グラフで表示"><defs><linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#90b7a0" stop-opacity=".42"/><stop offset="1" stop-color="#90b7a0" stop-opacity=".03"/></linearGradient></defs>${marks}<polygon points="${area}" fill="url(#lineFill)"/>${categoryTrends}<polyline points="${points}" fill="none" stroke="#2e695c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${daily.map((v,i)=>v>0?`<circle cx="${left+innerW*i/Math.max(days-1,1)}" cy="${top+innerH*(1-v/max)}" r="3.2" fill="#2e695c"><title>${i+1}日 ${yen(v)}</title></circle>`:'').join('')}${ticks}</svg><p class="line-note">${displayMonth(viewMonth)}の日別支出額（円）</p><div class="trend-legend"><span class="trend-category"><i style="background:#2e695c"></i>全体の支出</span>${trendLegend}</div>${totalsByCategory(recs).length>6?'<p class="muted tiny">カテゴリー別の推移は支出額上位6カテゴリーを表示しています。</p>':''}`;}

/* 定期支出は「支払予定日になってから」生成。再起動しても重複しない。 */
function recurringOccurrence(start,index,frequency){const [y,m,d]=start.split('-').map(Number);if(frequency==='weekly')return addDays(start,index*7);if(frequency==='monthly'){const target=new Date(Date.UTC(y,m-1+index,1)),year=target.getUTCFullYear(),month=target.getUTCMonth()+1,last=new Date(Date.UTC(year,month,0)).getUTCDate();return `${year}-${pad(month)}-${pad(Math.min(d,last))}`;}if(frequency==='yearly'){const year=y+index,last=new Date(Date.UTC(year,m,0)).getUTCDate();return `${year}-${pad(m)}-${pad(Math.min(d,last))}`;}return null;}
function generateRecurring(){let generated=0;const now=today();for(const rule of state.recurrings){let nextIndex=Number.isSafeInteger(rule.nextIndex)?rule.nextIndex:0;for(let safety=0;safety<1200;safety++){const due=recurringOccurrence(rule.startDate,nextIndex,rule.frequency);if(!due||due>now)break;const occurrenceKey=rule.id+'|'+due;const exists=state.records.some(r=>r.recurringId===rule.id&&r.scheduledDate===due);if(!exists&&!state.skippedOccurrences.includes(occurrenceKey)){state.records.push({id:safeId(),date:due,category:rule.category,amount:rule.amount,memo:rule.name,planned:rule.planned,rating:rule.rating,createdAt:new Date().toISOString(),recurringId:rule.id,scheduledDate:due});generated++;}nextIndex++;}rule.nextIndex=nextIndex;}return generated;}
function renderSettings(){const settings=$('#budgetSettings');settings.innerHTML=state.categories.map(c=>`<div class="budget-setting-row"><label class="budget-cat" for="budget-${escapeHTML(c.id)}"><span>${escapeHTML(c.icon)}</span><span>${escapeHTML(c.name)}</span></label><input id="budget-${escapeHTML(c.id)}" type="number" inputmode="numeric" min="0" max="999999999" step="1" data-budget="${escapeHTML(c.id)}" value="${Number(state.budgets[c.id]||0)||''}" placeholder="未設定" aria-label="${escapeHTML(c.name)}の月間予算"><button type="button" class="color-palette-launch" data-edit-color="${escapeHTML(c.id)}" aria-label="${escapeHTML(c.name)}のグラフの色を変更" title="グラフの色を変更"><span class="color-swatch" style="background:${normalizeColor(c.color)}"></span><span class="color-palette-icon" aria-hidden="true">🎨</span></button></div>`).join('');$('#customCategories').innerHTML=state.categories.filter(c=>c.custom).map(c=>`<span class="custom-category"><span class="custom-category-icon">${escapeHTML(c.icon)}</span>${escapeHTML(c.name)}<button type="button" data-remove-category="${escapeHTML(c.id)}" aria-label="${escapeHTML(c.name)}を削除">×</button></span>`).join('');const freqs={weekly:'毎週',monthly:'毎月',yearly:'毎年'};$('#recurringList').innerHTML=state.recurrings.length?state.recurrings.map(r=>`<div class="recurring-list-item"><span class="record-emoji">${escapeHTML(categoryById(r.category).icon)}</span><div class="recurring-info"><strong>${escapeHTML(r.name)} ・ ${yen(r.amount)}</strong><small>${freqs[r.frequency]||''} ／ 初回 ${escapeHTML(displayDate(r.startDate))} ／ ${r.planned==='unexpected'?'予定外':'予定あり'}</small></div><button class="mini-delete" type="button" data-delete-recurring="${escapeHTML(r.id)}">削除</button></div>`).join(''):'<div class="empty-state">定期支出はまだ登録されていません。</div>';$('#recurringCategory').innerHTML=state.categories.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.icon)} ${escapeHTML(c.name)}</option>`).join('');renderBudgetSummary();renderEmojiPicker();renderNewCategoryPreview();renderCategoryOrderSettings();}

/* v6: 初期カテゴリーも含む全カテゴリーを、登録画面と同じ4列プレビューで編集する。 */
let editingCategorySlot=-1;
function renderCategoryOrderSettings(){
  const holder=$('#categoryOrderSettings');
  const categories=state.categories;
  const rows=[];
  for(let start=0;start<categories.length;start+=4){
    const buttons=categories.slice(start,start+4).map((category,offset)=>{
      const index=start+offset,rowNumber=Math.floor(start/4)+1;
      return `<button type="button" class="category-order-cell" data-category-slot="${index}" aria-label="${rowNumber}行目、左から${offset+1}番目、${escapeHTML(category.name)}。タップして変更"><span class="category-order-slot">${offset+1}番目</span><span class="category-order-icon" aria-hidden="true">${escapeHTML(category.icon)}</span><span class="category-order-name">${escapeHTML(category.name)}</span></button>`;
    }).join('');
    rows.push(`<div class="category-order-row"><div class="category-order-row-head"><strong>${Math.floor(start/4)+1}行目</strong><span>登録画面の並び</span></div><div class="category-order-cells">${buttons}</div></div>`);
  }
  holder.innerHTML=rows.join('');
}
$('#categoryOrderSettings').addEventListener('click',(event)=>{
  const button=event.target.closest('button[data-category-slot]');
  if(!button)return;
  const slot=Number(button.dataset.categorySlot);
  if(!Number.isInteger(slot)||slot<0||slot>=state.categories.length)return;
  editingCategorySlot=slot;
  const category=state.categories[slot],row=Math.floor(slot/4)+1,col=slot%4+1;
  $('#categoryOrderModalDescription').textContent=`${row}行目・左から${col}番目（現在：${category.icon} ${category.name}）を変更します。下からカテゴリーを選ぶと、その位置と入れ替わります。`;
  $('#categoryOrderOptions').innerHTML=state.categories.map((candidate,index)=>`<button type="button" class="category-order-option ${slot===index?'current':''}" data-category-swap="${escapeHTML(candidate.id)}" ${slot===index?'aria-current="true"':''}><span class="category-order-option-emoji" aria-hidden="true">${escapeHTML(candidate.icon)}</span><span class="category-order-option-name">${escapeHTML(candidate.name)}</span>${slot===index?'<span class="category-order-selected">現在</span>':''}</button>`).join('');
  modal('categoryOrder',true);
});
$('#categoryOrderOptions').addEventListener('click',(event)=>{
  const button=event.target.closest('[data-category-swap]');
  if(!button)return;
  const from=editingCategorySlot;
  const to=state.categories.findIndex(category=>category.id===button.dataset.categorySwap);
  modal('categoryOrder',false);
  if(!Number.isInteger(from)||from<0||from>=state.categories.length||to<0||from===to){editingCategorySlot=-1;return;}
  // カテゴリーのIDは不変。初期・追加カテゴリーとも同じ手順で位置のみ入れ替える。
  [state.categories[from],state.categories[to]]=[state.categories[to],state.categories[from]];
  editingCategorySlot=-1;
  queueSave();
  renderCategoryOrderSettings();
  renderCategories();
  // 月間予算は未保存の入力とスクロール位置を維持して並べ替える。
  const budgetHolder=$('#budgetSettings'),scrollPos=budgetHolder.scrollTop;
  const budgetRows=new Map($$('[data-budget]').map(input=>[input.dataset.budget,input.closest('.budget-setting-row')]));
  for(const category of state.categories){const row=budgetRows.get(category.id);if(row)budgetHolder.appendChild(row);}
  budgetHolder.scrollTop=scrollPos;
  // 定期支出のカテゴリー選択も同じ順序に更新する。
  const recurring=$('#recurringCategory'),previous=recurring.value;
  recurring.innerHTML=state.categories.map(category=>`<option value="${escapeHTML(category.id)}">${escapeHTML(category.icon)} ${escapeHTML(category.name)}</option>`).join('');
  if(state.categories.some(category=>category.id===previous))recurring.value=previous;
  toast('カテゴリーの表示順を変更しました。');
});
$('#categoryOrderModal').addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();modal('categoryOrder',false);}});

/* 保存前の入力値も含め、当月の月間予算合計を即座に更新 */
function renderBudgetSummary(){
  const inputs=$$('[data-budget]');
  let total=0,used=0,configured=0,invalid=false;
  for(const field of inputs){
    const raw=field.value.trim();
    if(raw&&!(/^(?:0|[1-9]\d*)$/.test(raw)&&Number(raw)<=999999999)){invalid=true;continue;}
    const amount=raw?Number(raw):0;
    if(amount>0){total+=amount;configured++;used+=sum(state.records.filter(r=>r.category===field.dataset.budget&&r.date.slice(0,7)===today().slice(0,7)));}
  }
  const left=total-used;
  const allSpent=sum(monthRecords(today().slice(0,7)));
  const unbudgeted=allSpent-used;
  $('#budgetTotalValue').textContent=yen(total);
  $('#budgetSpentValue').textContent=yen(used);
  $('#budgetRemainingValue').textContent=yen(left);
  $('#budgetRemainingValue').classList.toggle('over-budget',left<0);
  $('#budgetSummaryFill').style.width=(total>0?Math.min(100,used/total*100):0)+'%';
  $('#budgetSummaryFill').classList.toggle('over-budget',used>total&&total>0);
  $('#budgetSummaryNote').textContent=invalid?'入力に誤りがあります。予算は0〜999,999,999円の整数で入力してください。':
    configured===0?'カテゴリー別予算を入力すると、ここに合計と残額が表示されます。':
    `対象 ${configured}カテゴリー ／ 予算対象外の今月の支出 ${yen(unbudgeted)}（合計・残額に含まれません）`;
  $('#budgetSummaryNote').classList.toggle('over-budget',invalid);
}
$('#budgetSettings').addEventListener('input',(event)=>{if(event.target.matches('[data-budget]'))renderBudgetSummary();});

/* 分類タブからアイコンを選ぶ。選択した文字はカテゴリーデータと一緒に暗号化して保存。 */
function renderEmojiPicker(){
  $('#emojiCount').textContent=`全${EMOJI_TOTAL}種類`;
  $('#emojiGroups').innerHTML=EMOJI_GROUPS.map(group=>`<button type="button" class="emoji-group ${selectedEmojiGroup===group.id?'selected':''}" data-emoji-group="${group.id}" aria-pressed="${selectedEmojiGroup===group.id}">${group.name}</button>`).join('');
  const group=EMOJI_GROUPS.find(g=>g.id===selectedEmojiGroup)||EMOJI_GROUPS[0];
  $('#emojiPicker').innerHTML=group.emojis.map(emoji=>`<button type="button" class="emoji-option ${selectedNewCategoryIcon===emoji?'selected':''}" data-emoji="${escapeHTML(emoji)}" aria-label="${escapeHTML(emoji)}のアイコン" aria-pressed="${selectedNewCategoryIcon===emoji}">${escapeHTML(emoji)}</button>`).join('');
}
function renderNewCategoryPreview(){
  $('#newCategoryPreviewIcon').textContent=selectedNewCategoryIcon;
  $('#newCategoryPreviewName').textContent=$('#newCategoryName').value.trim()||'新しいカテゴリー';
}
$('#emojiGroups').addEventListener('click',(event)=>{const button=event.target.closest('[data-emoji-group]');if(!button)return;selectedEmojiGroup=button.dataset.emojiGroup;renderEmojiPicker();});
$('#emojiPicker').addEventListener('click',(event)=>{const button=event.target.closest('[data-emoji]');if(!button)return;selectedNewCategoryIcon=button.dataset.emoji;renderEmojiPicker();renderNewCategoryPreview();});
$('#newCategoryName').addEventListener('input',renderNewCategoryPreview);
$('#saveBudgets').addEventListener('click',()=>{let invalid=false;const budgets={...state.budgets};$$('[data-budget]').forEach(input=>{const value=input.value.trim();if(value!==''&&(!Number.isSafeInteger(Number(value))||Number(value)<0||Number(value)>999999999))invalid=true;else budgets[input.dataset.budget]=value===''?0:Number(value);});if(invalid){toast('予算は0〜999,999,999円の整数で入力してください。',true);return;}state.budgets=budgets;queueSave();renderBudgetSummary();renderBudgetHint();renderHome();toast('月間予算を保存しました。');});
$('#addCategory').addEventListener('click',()=>{const name=$('#newCategoryName').value.trim();if(!name||name.length>12){toast('カテゴリー名を12文字以内で入力してください。',true);return;}if(state.categories.some(c=>c.name===name)){toast('同じ名前のカテゴリーが登録されています。',true);return;}if(state.categories.length>=32){toast('カテゴリーは最大32件までです。',true);return;}state.categories.push({id:safeId(),name,icon:selectedNewCategoryIcon,color:EXTRA_COLORS[state.categories.filter(c=>c.custom).length%EXTRA_COLORS.length],custom:true});$('#newCategoryName').value='';selectedNewCategoryIcon='📦';selectedEmojiGroup='food';queueSave();renderAll();toast(`「${name}」を追加しました。`);});
/* v7: カテゴリー削除時は過去の支出と、今後生成される定期支出の分類を「その他」に変更。
   ID, 金額, 日付, 使い道, 評価, 予定区分, 定期支出とのひも付けはそのまま維持。 */
function removeCustomCategory(id){
  const category=state.categories.find(c=>c.id===id);
  if(!category||!category.custom){toast('削除できるのは追加したカテゴリーのみです。',true);return;}
  const other=state.categories.find(c=>c.id==='other');
  if(!other){toast('移行先の「その他」が見つかりません。削除は行いませんでした。',true);return;}
  const count=state.records.filter(r=>r.category===id).length;
  const rules=state.recurrings.filter(r=>r.category===id).length;
  const message=`「${category.name}」を削除しますか？\n\n過去の支出 ${count}件、定期支出 ${rules}件のカテゴリーを「その他」に移します。\n金額・使い道・日付・評価などは残ります。\nこのカテゴリーの月間予算と色設定は削除されます。`;
  if(!confirm(message))return;
  for(const record of state.records)if(record.category===id)record.category='other';
  for(const rule of state.recurrings)if(rule.category===id)rule.category='other';
  state.categories=state.categories.filter(c=>c.id!==id);
  delete state.budgets[id];
  if(entryCategory===id)entryCategory='other';
  queueSave();renderAll();
  toast(`「${category.name}」を削除し、支出${count}件・定期${rules}件を「その他」に移しました。`);
}
$('#customCategories').addEventListener('click',(e)=>{const button=e.target.closest('[data-remove-category]');if(button)removeCustomCategory(button.dataset.removeCategory);});

/* 月間予算の一覧から選ぶグラフの色。スクロール枠に隠れない独立ダイアログ。 */
let editingColorCategory=null, pendingCategoryColor='#939c9b';
function renderColorPalette(){
  $('#colorPaletteChoices').innerHTML=COLOR_PALETTE.map(color=>`<button type="button" data-color-preset="${color}" class="color-preset ${pendingCategoryColor===color?'selected':''}" style="--preset-color:${color}" aria-label="色 ${color}" aria-pressed="${pendingCategoryColor===color}"></button>`).join('');
  $('#categoryColorNative').value=pendingCategoryColor;
  $('#categoryColorPreview').style.background=pendingCategoryColor;
  $('#colorHexValue').textContent=pendingCategoryColor.toUpperCase();
}
$('#budgetSettings').addEventListener('click',(event)=>{
  const button=event.target.closest('[data-edit-color]');if(!button)return;
  const category=state.categories.find(c=>c.id===button.dataset.editColor);if(!category)return;
  editingColorCategory=category.id;pendingCategoryColor=normalizeColor(category.color);
  $('#colorPaletteCategory').textContent=`${category.icon} ${category.name}`;
  renderColorPalette();modal('colorPalette',true);
});
$('#colorPaletteChoices').addEventListener('click',(event)=>{
  const b=event.target.closest('[data-color-preset]');if(!b)return;
  pendingCategoryColor=normalizeColor(b.dataset.colorPreset);renderColorPalette();
});
$('#categoryColorNative').addEventListener('input',(event)=>{
  pendingCategoryColor=normalizeColor(event.target.value);renderColorPalette();
});
$('#applyCategoryColor').addEventListener('click',()=>{
  const category=state.categories.find(c=>c.id===editingColorCategory);
  if(!category){modal('colorPalette',false);return;}
  category.color=normalizeColor(pendingCategoryColor);
  const swatch=$(`[data-edit-color="${category.id}"] .color-swatch`);
  if(swatch)swatch.style.background=category.color;
  editingColorCategory=null;modal('colorPalette',false);
  queueSave();renderRecents();renderHome();renderCalendar();renderAnalysis();
  toast(`「${category.name}」の色を保存しました。`);
});
function modal(name,open){const el=$(`#${name}Modal`);el.classList.toggle('hidden',!open);document.body.style.overflow=open?'hidden':'';}
$('#openRecurring').addEventListener('click',()=>{$('#recurringForm').reset();$('#recurringStart').value=today();renderSettings();modal('recurring',true);});
$$('[data-close]').forEach(el=>el.addEventListener('click',()=>{if(el.dataset.close==='calculator')closeCalculator();else modal(el.dataset.close,false);}));
$('#recurringForm').addEventListener('submit',(e)=>{e.preventDefault();const name=$('#recurringName').value.trim(),amount=Number($('#recurringAmount').value),category=$('#recurringCategory').value,frequency=$('#recurringFrequency').value,startDate=$('#recurringStart').value,planned=$('#recurringPlan').value,rating=Number($('#recurringRating').value);if(!name||!Number.isSafeInteger(amount)||amount<1||amount>999999999||!state.categories.some(c=>c.id===category)||!validDate(startDate)||!['weekly','monthly','yearly'].includes(frequency)){toast('定期支出の入力内容を確認してください。',true);return;}state.recurrings.push({id:safeId(),name,amount,category,frequency,startDate,planned,rating,nextIndex:0});const count=generateRecurring();queueSave();modal('recurring',false);renderAll();toast(`定期支出を登録しました。${count?'初回の支出も記録しました。':''}`);});
$('#recurringList').addEventListener('click',(e)=>{const b=e.target.closest('[data-delete-recurring]');if(!b)return;if(!confirm('この定期支出の今後の自動登録を停止しますか？\n※すでに登録済みの支出は残ります。'))return;state.recurrings=state.recurrings.filter(r=>r.id!==b.dataset.deleteRecurring);queueSave();renderSettings();toast('定期支出の自動登録を停止しました。');});

/* 家計簿：左列はカテゴリー、日付の各セルには使い道＋金額。
   同一カテゴリーは日ごとの最大明細数ぶんだけ行を増やす。
   保存済み支出の中身や暗号化形式は変更しない。 */
const LEDGER_WEEKDAYS=['日','月','火','水','木','金','土'];
const LEDGER_CANVAS_WIDTH=1500,LEDGER_CANVAS_HEIGHT=1060,LEDGER_ROWS_PER_PAGE=11;
let ledgerDownloadUrls=[];
function ledgerDates(){
  let first,count;
  if(ledgerMode==='three'){first=addDays(ledgerAnchor,-2);count=3;}
  else if(ledgerMode==='week'){const d=parseISO(ledgerAnchor).getUTCDay();first=addDays(ledgerAnchor,-((d+6)%7));count=7;}
  else{first=ledgerAnchor.slice(0,7)+'-01';const [y,m]=first.split('-').map(Number);count=new Date(Date.UTC(y,m,0)).getUTCDate();}
  return Array.from({length:count},(_,i)=>addDays(first,i));
}
function ledgerHeaderDate(d){return `${Number(d.slice(5,7))}/${Number(d.slice(8,10))}（${LEDGER_WEEKDAYS[parseISO(d).getUTCDay()]}）`;}
function ledgerItemName(r){return String(r.memo||'').trim().replace(/\s+/g,' ')||'使い道未入力';}
function ledgerBuild(dates){
  const dateSet=new Set(dates),ordered=new Map(state.categories.map((c,i)=>[c.id,i]));
  const recs=state.records.filter(r=>dateSet.has(r.date)).sort((a,b)=>
    a.date.localeCompare(b.date)||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a.id||'').localeCompare(String(b.id||'')));
  const byCategory=new Map(),totals=new Map(dates.map(d=>[d,0]));
  for(const r of recs){
    totals.set(r.date,totals.get(r.date)+Number(r.amount||0));
    if(!byCategory.has(r.category))byCategory.set(r.category,new Map());
    const dayMap=byCategory.get(r.category);
    if(!dayMap.has(r.date))dayMap.set(r.date,[]);
    dayMap.get(r.date).push(r);
  }
  const groups=[],rows=[];
  const keys=[...byCategory.keys()].sort((a,b)=>(ordered.get(a)??999)-(ordered.get(b)??999)||String(a).localeCompare(String(b)));
  for(const id of keys){
    const days=byCategory.get(id),category=categoryById(id);
    // 同じ使い道名であるかどうかには関係なく、日付ごとに順に1～N件目を置く。
    const rowCount=Math.max(1,...[...days.values()].map(items=>items.length));
    const total=[...days.values()].reduce((t,items)=>t+sum(items),0);
    const group={categoryId:id,category,total,rowCount,rows:[]};
    for(let i=0;i<rowCount;i++){
      const values=new Map();
      for(const d of dates){const r=days.get(d)?.[i];if(r)values.set(d,r);}
      const row={categoryId:id,category,categoryTotal:total,groupIndex:i,groupSize:rowCount,byDate:values};
      rows.push(row);group.rows.push(row);
    }
    groups.push(group);
  }
  return {dates,groups,rows,totals,grandTotal:sum(recs),recordCount:recs.length};
}
function ledgerCategoryStart(rows,i){return i===0||rows[i].categoryId!==rows[i-1].categoryId;}
function renderLedger(){
  const dates=ledgerDates(),ledger=ledgerBuild(dates);
  $$('.ledger-mode').forEach(b=>{const selected=b.dataset.ledgerMode===ledgerMode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  $('#ledgerPeriod').textContent=`${dates[0]} ～ ${dates[dates.length-1]}`;
  let out='<thead><tr><th scope="col" class="ledger-index">カテゴリー</th>'+dates.map(d=>`<th scope="col" class="ledger-date ${d===today()?'ledger-current':''}">${escapeHTML(ledgerHeaderDate(d))}${d===today()?'<small>本日</small>':''}</th>`).join('')+'<th scope="col" class="ledger-total-col">カテゴリー合計</th></tr></thead><tbody>';
  if(!ledger.rows.length){
    out+='<tr><th class="ledger-index">記録なし</th>'+dates.map(()=>'<td class="ledger-empty">—</td>').join('')+'<td class="ledger-total-col">—</td></tr>';
  }
  for(const group of ledger.groups){
    group.rows.forEach((row,i)=>{
      const first=i===0;
      out+=`<tr class="ledger-item-row${first?' ledger-category-start':''}">`;
      if(first)out+=`<th scope="rowgroup" rowspan="${group.rowCount}" class="ledger-index ledger-group-label"><span class="ledger-entry-cat"><span class="ledger-cat-dot" style="background:${normalizeColor(group.category.color)}"></span>${escapeHTML(group.category.icon)} ${escapeHTML(group.category.name)}</span><small class="ledger-group-count">${group.rows.reduce((n,r)=>n+r.byDate.size,0)}件</small></th>`;
      for(const d of dates){
        const r=row.byDate.get(d);
        out+=r?`<td class="ledger-entry ${r.planned==='unexpected'?'ledger-unexpected':''}"><span class="ledger-entry-memo">${escapeHTML(ledgerItemName(r))}</span><strong>${yen(r.amount)}</strong>${r.planned==='unexpected'?'<small>予定外</small>':''}</td>`:'<td class="ledger-empty">—</td>';
      }
      if(first)out+=`<td rowspan="${group.rowCount}" class="ledger-total-col ledger-category-total">${yen(group.total)}</td>`;
      out+='</tr>';
    });
  }
  out+='<tr class="ledger-sum"><th class="ledger-index">日別合計</th>'+dates.map(d=>`<td>${yen(ledger.totals.get(d))}</td>`).join('')+`<td class="ledger-total-col">${yen(ledger.grandTotal)}</td></tr></tbody>`;
  $('#ledgerTable').innerHTML=out;
  $('#ledgerTotal').textContent=`表示期間の支出合計：${yen(ledger.grandTotal)}（${ledger.recordCount}件／${ledger.groups.length}カテゴリー）`;
  const scroller=$('#ledgerScroll');
  if(ledgerMode==='month'){
    requestAnimationFrame(()=>{const now=dates.indexOf(today());if(now>=0){const cell=$$('#ledgerTable thead .ledger-date')[now];if(cell)scroller.scrollLeft=Math.max(0,cell.offsetLeft-scroller.clientWidth/3);}else scroller.scrollLeft=0;});
  }else scroller.scrollLeft=0;
}
$$('[data-ledger-mode]').forEach(b=>b.addEventListener('click',()=>{ledgerMode=b.dataset.ledgerMode;ledgerAnchor=today();renderLedger();}));
function ledgerMove(direction){if(ledgerMode==='three')ledgerAnchor=addDays(ledgerAnchor,3*direction);else if(ledgerMode==='week')ledgerAnchor=addDays(ledgerAnchor,7*direction);else ledgerAnchor=shiftMonth(ledgerAnchor.slice(0,7),direction)+'-01';renderLedger();}
$('#ledgerPrev').addEventListener('click',()=>ledgerMove(-1));
$('#ledgerNext').addEventListener('click',()=>ledgerMove(1));
$('#ledgerToday').addEventListener('click',()=>{ledgerAnchor=today();renderLedger();});
function ledgerChunks(){const dates=ledgerDates(),result=[];for(let i=0;i<dates.length;i+=7)result.push(dates.slice(i,i+7));return result;}
function ledgerExportPages(){
  const pages=[];
  for(const dates of ledgerChunks()){
    const book=ledgerBuild(dates),rows=book.rows;
    const totalPages=Math.max(1,Math.ceil(rows.length/LEDGER_ROWS_PER_PAGE));
    for(let part=0;part<totalPages;part++){
      pages.push({dates,rows:rows.slice(part*LEDGER_ROWS_PER_PAGE,(part+1)*LEDGER_ROWS_PER_PAGE),
        rangeTotal:book.grandTotal,rangeCount:book.recordCount,part:part+1,totalParts:totalPages});
    }
  }
  return pages;
}
/* A4横と同じ比率の画像を、PDF/PNG/JPEGのすべてで共通利用する。 */
function ledgerDrawPage(ctx,page,top,W=LEDGER_CANVAS_WIDTH,H=LEDGER_CANVAS_HEIGHT){
  const ink='#263d34',grid='#a3b3a6',soft='#ebf2ec',heavy='#5a7463';
  const drawText=(v,x,y,size=18,bold=false,color=ink,align='left',width=280)=>{
    ctx.fillStyle=color;ctx.font=`${bold?'700 ':'400 '}${size}px -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
    ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(v),x,y,width);
  };
  const line=(x,y,x2,y2,width=1,color=grid)=>{ctx.beginPath();ctx.lineWidth=width;ctx.strokeStyle=color;ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();};
  const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  // 細かい文字は幅に合わせて切り詰め、極端に横縮みさせない。
  const wrapMemo=(value,maxWidth)=>{
    ctx.font='14px -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
    const chars=[...String(value)],parts=[],limit=2;let s='';
    for(let i=0;i<chars.length;i++){
      if(ctx.measureText(s+chars[i]).width>maxWidth&&s){parts.push(s);s='';}
      s+=chars[i];
      if(parts.length>=limit){parts[limit-1]=parts[limit-1].slice(0,-1)+'…';return parts;}
    }
    if(s)parts.push(s);
    return parts.slice(0,limit);
  };
  rect(0,top,W,H,'#fff');
  drawText('支出の余白　｜　家計簿',46,top+47,30,true);
  drawText(`${page.dates[0]} ～ ${page.dates[page.dates.length-1]}　　期間合計 ${yen(page.rangeTotal)}`,W-45,top+49,18,true,ink,'right',870);
  drawText(`カテゴリー別に集約 ／ 日付のセルに使い道と金額 ／ ${page.part}/${page.totalParts}頁${page.totalParts>1?'（この日付範囲）':''}`,46,top+81,15,false,'#5b7365','left',1300);
  const l=40,r=W-40,t=top+113,b=top+H-39,headerH=61,footerH=60;
  const labelW=215,totalW=122,dayW=(r-l-labelW-totalW)/page.dates.length;
  const cols=[l,l+labelW];for(let i=1;i<=page.dates.length;i++)cols.push(l+labelW+i*dayW);cols.push(r);
  const rows=page.rows.length?page.rows:[{categoryId:'',category:{name:'',icon:'',color:'#fff'},byDate:new Map(),categoryTotal:0,groupIndex:0,groupSize:1}];
  const bodyH=b-t-headerH-footerH,rowH=bodyH/Math.max(1,LEDGER_ROWS_PER_PAGE);
  rect(l,t,r-l,headerH,soft);
  rect(l,b-footerH,r-l,footerH,soft);
  for(let i=0;i<=rows.length;i++){
    const y=t+headerH+i*rowH;
    const categoryChange=i===rows.length||ledgerCategoryStart(rows,i);
    line(categoryChange?l:l+labelW,y,categoryChange?r:r-totalW,y,categoryChange?3:1,categoryChange?heavy:grid);
  }
  line(l,t,r,t,1.3,heavy);line(l,b,r,b,1.3,heavy);
  line(l,b-footerH,r,b-footerH,2,heavy);
  for(const x of cols)line(x,t,x,b,1,grid);
  drawText('カテゴリー',l+labelW/2,t+headerH/2,20,true,ink,'center',labelW-14);
  page.dates.forEach((d,i)=>drawText(ledgerHeaderDate(d),l+labelW+(i+.5)*dayW,t+headerH/2,19,true,ink,'center',dayW-8));
  drawText('カテゴリ計',r-totalW/2,t+headerH/2,17,true,ink,'center',totalW-9);
  const pageDayTotals=new Map(page.dates.map(d=>[d,0]));
  rows.forEach((row,i)=>{
    const y=t+headerH+i*rowH;
    page.dates.forEach((d,di)=>{
      const r0=row.byDate.get(d);if(!r0)return;
      pageDayTotals.set(d,pageDayTotals.get(d)+Number(r0.amount||0));
      const cellX=l+labelW+di*dayW,center=cellX+dayW/2;
      const memoLines=wrapMemo(ledgerItemName(r0),dayW-14);
      memoLines.forEach((tx,k)=>drawText(tx,cellX+7,y+15+k*16,14,false,ink,'left',dayW-14));
      if(r0.planned==='unexpected')drawText('予定外',cellX+8,y+rowH-13,11,true,'#b13d3b','left',dayW-15);
      drawText(yen(r0.amount),cellX+dayW-8,y+rowH-14,18,true,r0.planned==='unexpected'?'#b13d3b':ink,'right',dayW-15);
    });
  });
  // カテゴリー列・右端合計列は、同一カテゴリーの連続行を1つの結合セルのように描画する。
  for(let i=0;i<rows.length;){
    const row=rows[i],first=i,categoryId=row.categoryId;
    while(i<rows.length&&rows[i].categoryId===categoryId)i++;
    const count=i-first,mid=t+headerH+first*rowH+count*rowH/2;
    if(!categoryId){drawText('記録なし',l+13,mid,16);continue;}
    const continued=first===0&&row.groupIndex>0;
    const categoryLabel=`${row.category.icon} ${row.category.name}${continued?'（続）':''}`;
    rect(l+8,mid-23,5,46,normalizeColor(row.category.color));
    drawText(categoryLabel,l+20,mid-7,17,true,ink,'left',labelW-27);
    drawText(`${row.groupSize}行`,l+20,mid+19,13,false,'#526f5c','left',labelW-27);
    drawText(yen(row.categoryTotal),r-9,mid,18,true,ink,'right',totalW-15);
  }
  const footY=b-footerH/2;
  drawText('日別合計',l+labelW/2,footY,19,true,ink,'center',labelW-10);
  page.dates.forEach((d,i)=>drawText(yen(pageDayTotals.get(d)),l+labelW+(i+.5)*dayW,footY,18,true,ink,'center',dayW-12));
  drawText(yen([...pageDayTotals.values()].reduce((a,b)=>a+b,0)),r-9,footY,20,true,ink,'right',totalW-14);
}
function ledgerCanvas(){const canvas=document.createElement('canvas');canvas.width=LEDGER_CANVAS_WIDTH;canvas.height=LEDGER_CANVAS_HEIGHT;return canvas;}
function ledgerCanvasBlob(canvas,mime,quality=.9){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('ファイルを生成できませんでした。')),mime,quality));}
/* 印刷用非表示iframeを使わず、各ページJPEGをPDFの画像XObjectとして直接埋め込む。 */
function ledgerPdfBlob(images){
  const encoder=new TextEncoder(),parts=[],offsets=[0];let size=0;
  const append=part=>{const bytes=typeof part==='string'?encoder.encode(part):part;parts.push(bytes);size+=bytes.byteLength;};
  const obj=(id,body)=>{offsets[id]=size;append(`${id} 0 obj\n${body}\nendobj\n`);};
  append('%PDF-1.4\n%Yohaku\n');
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  const kids=images.map((_,i)=>`${3+i*3} 0 R`).join(' ');
  obj(2,`<< /Type /Pages /Kids [ ${kids} ] /Count ${images.length} >>`);
  images.forEach(({bytes,width,height},i)=>{
    const pid=3+i*3,cid=pid+1,iid=pid+2;
    obj(pid,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im${i} ${iid} 0 R >> >> /Contents ${cid} 0 R >>`);
    const drawing=`q\n842 0 0 595 0 0 cm\n/Im${i} Do\nQ\n`;
    obj(cid,`<< /Length ${encoder.encode(drawing).length} >>\nstream\n${drawing}endstream`);
    offsets[iid]=size;append(`${iid} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.byteLength} >>\nstream\n`);
    append(bytes);append('\nendstream\nendobj\n');
  });
  const xref=size,maxObj=2+images.length*3;
  append(`xref\n0 ${maxObj+1}\n0000000000 65535 f \n`);
  for(let i=1;i<=maxObj;i++)append(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  append(`trailer\n<< /Size ${maxObj+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts,{type:'application/pdf'});
}
function ledgerOfferDownloads(files){
  for(const url of ledgerDownloadUrls)URL.revokeObjectURL(url);
  ledgerDownloadUrls=[];
  const target=$('#ledgerExportResult');target.replaceChildren();
  const caption=document.createElement('p');caption.className='ledger-export-message';
  caption.textContent='ファイルを作成しました。下のリンクから保存してください。iPhoneではリンクを開き、共有 →「ファイルに保存」を選択できます。';
  target.appendChild(caption);
  const links=document.createElement('div');links.className='ledger-download-links';target.appendChild(links);
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  for(const file of files){
    const url=URL.createObjectURL(file.blob);ledgerDownloadUrls.push(url);
    const a=document.createElement('a');a.className='btn btn-outline ledger-file-link';a.href=url;a.download=file.filename;a.target='_blank';a.rel='noopener';
    a.textContent=`↓ ${file.filename} を開く・保存`;links.appendChild(a);
    if(!ios&&files.length===1){a.click();}
  }
  toast('ファイルを作成しました。保存用リンクをご利用ください。');
}
async function ledgerExport(type){
  const btn=$(`#ledger${type==='pdf'?'Pdf':type==='png'?'Png':'Jpeg'}`),before=btn.textContent;
  btn.disabled=true;btn.textContent='生成中…';
  try{
    const pages=ledgerExportPages(),ext=type==='jpeg'?'jpg':type;
    const stem=`支出の余白_家計簿_${ledgerDates()[0]}_${ledgerMode}`;
    if(type==='pdf'){
      const images=[];
      for(const page of pages){
        const canvas=ledgerCanvas(),ctx=canvas.getContext('2d');if(!ctx)throw Error('PDF生成に対応していません。');
        ledgerDrawPage(ctx,page,0);
        const jpeg=await ledgerCanvasBlob(canvas,'image/jpeg',.9);
        images.push({bytes:new Uint8Array(await jpeg.arrayBuffer()),width:canvas.width,height:canvas.height});
        canvas.width=1;canvas.height=1;
      }
      ledgerOfferDownloads([{filename:`${stem}.pdf`,blob:ledgerPdfBlob(images)}]);
    }else{
      const mime=type==='png'?'image/png':'image/jpeg',files=[];
      // 5ページまでは画像1枚に連結。多い場合はiPhoneのメモリ不足防止のためページごとに保存。
      if(pages.length<=5){
        const canvas=document.createElement('canvas');canvas.width=LEDGER_CANVAS_WIDTH;canvas.height=LEDGER_CANVAS_HEIGHT*pages.length;
        const ctx=canvas.getContext('2d');if(!ctx)throw Error('画像の生成に対応していません。');
        pages.forEach((page,i)=>ledgerDrawPage(ctx,page,i*LEDGER_CANVAS_HEIGHT));
        files.push({filename:`${stem}.${ext}`,blob:await ledgerCanvasBlob(canvas,mime,.9)});
        canvas.width=1;canvas.height=1;
      }else{
        for(let i=0;i<pages.length;i++){
          const canvas=ledgerCanvas(),ctx=canvas.getContext('2d');if(!ctx)throw Error('画像の生成に対応していません。');
          ledgerDrawPage(ctx,pages[i],0);
          files.push({filename:`${stem}_${String(i+1).padStart(2,'0')}.${ext}`,blob:await ledgerCanvasBlob(canvas,mime,.9)});
          canvas.width=1;canvas.height=1;
        }
      }
      ledgerOfferDownloads(files);
    }
  }catch(e){console.error('家計簿の出力失敗',e);toast(e.message||'書き出しに失敗しました。',true);}
  finally{btn.disabled=false;btn.textContent=before;}
}
$('#ledgerPdf').addEventListener('click',()=>{void ledgerExport('pdf');});
$('#ledgerPng').addEventListener('click',()=>{void ledgerExport('png');});
$('#ledgerJpeg').addEventListener('click',()=>{void ledgerExport('jpeg');});

/* CSVと暗号化バックアップ */
function downloadFile(filename,data,mime){const blob=new Blob([data],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
function csvCell(value){let s=String(value??'');if(/^[\s\u0000-\u001f]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
$('#exportCsv').addEventListener('click',()=>{const header=['記録日','カテゴリー','金額（円）','支出の種類','評価（1-5）','評価の内容','メモ','定期支出'];const rows=sortedRecords(state.records).map(r=>[r.date,categoryById(r.category).name,r.amount,r.planned==='unexpected'?'予期していない':'予定していた',r.rating,RATING_NAMES[r.rating]||'',r.memo||'',r.recurringId?'はい':'いいえ']);const csv='\ufeff'+[header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');downloadFile(`支出の余白_${today()}.csv`,csv,'text/csv;charset=utf-8');toast('CSVを書き出しました。');});
$('#exportBackup').addEventListener('click',async()=>{try{await saveQueue;const data=localStorage.getItem(STORAGE_KEY);downloadFile(`支出の余白_暗号化バックアップ_${today()}.json`,data,'application/json');toast('暗号化バックアップを書き出しました。');}catch{toast('バックアップの作成に失敗しました。',true);}});
$('#importBackup').addEventListener('click',()=>{$('#backupFile').click();});
$('#backupFile').addEventListener('change',async(e)=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>20*1024*1024)throw Error('バックアップファイルが大きすぎます。');const raw=await file.text(),data=JSON.parse(raw);if(data.version!==1||typeof data.salt!=='string'||typeof data.iv!=='string'||typeof data.data!=='string')throw Error('暗号化バックアップの形式ではありません。');if(!confirm('現在の支出記録をバックアップの内容で上書きします。先に今のバックアップを書き出しましたか？'))return;await saveQueue;localStorage.removeItem(AUTO_UNLOCK_FLAG);try{await deviceKeyStore('delete');}catch{}localStorage.setItem(STORAGE_KEY,JSON.stringify(data));await lockApp();toast('バックアップを読み込みました。バックアップのパスワードで開いてください。');}catch(err){toast(err.message||'復元に失敗しました。',true);}});
$('#changePassword').addEventListener('click',async()=>{const pass=$('#newPassword').value,check=$('#newPasswordConfirm').value;if(!/^\d{4,}$/.test(pass)){toast('新しいパスワードは数字4桁以上で入力してください。',true);return;}if(pass!==check){toast('新しいパスワードが一致しません。',true);return;}if(!confirm('パスワードを変更しますか？以前のパスワードでは開けなくなります。'))return;const button=$('#changePassword');button.disabled=true;try{await saveQueue;const previousKey=sessionKey,previousSalt=sessionSalt;sessionSalt=newSalt();sessionKey=await deriveKey(pass,sessionSalt);try{await persistState();}catch(err){sessionKey=previousKey;sessionSalt=previousSalt;throw err;}if(autoUnlockEnabled()){try{await deviceKeyStore('put',sessionKey);}catch(err){localStorage.removeItem(AUTO_UNLOCK_FLAG);renderLoginPreference();toast('パスワードは変更しましたが、自動ログインは解除されました。',true);$('#newPassword').value='';$('#newPasswordConfirm').value='';return;}}$('#newPassword').value='';$('#newPasswordConfirm').value='';toast('パスワードを変更しました。');}catch{toast('パスワードの変更に失敗しました。',true);}finally{button.disabled=false;}});

/* 見た目はすぐに読み込み、記録はパスワード入力後のみ復号 */
setupAuth();
attemptAutoUnlock();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});

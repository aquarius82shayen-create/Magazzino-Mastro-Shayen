const KEY="mastro_shayen_magazzino_v1";
let data=JSON.parse(localStorage.getItem(KEY)||'{"items":[],"recipes":[]}');
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function save(){localStorage.setItem(KEY,JSON.stringify(data));renderAll()}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.classList.remove("show"),2400)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function openModal(html){$("#modalContent").innerHTML=html;$("#modal").classList.remove("hidden");document.body.style.overflow="hidden"}
function closeModal(){$("#modal").classList.add("hidden");document.body.style.overflow=""}
$("#modalClose").onclick=closeModal;
function showView(v){$$(".view").forEach(x=>x.classList.remove("active"));$("#"+v).classList.add("active");$$(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.view===v));window.scrollTo(0,0)}
$$(".nav-btn").forEach(b=>b.onclick=()=>showView(b.dataset.view));
$("#settingsBtn").onclick=()=>showView("settings");
$("#closeSettings").onclick=()=>showView("dashboard");

function dateState(d){if(!d)return"";const now=new Date(),x=new Date(d+"T23:59:59"),days=(x-now)/86400000;if(days<0)return"expired";if(days<=30)return"warning";return""}
function grouped(){const map={};data.items.forEach(i=>{const key=(i.category+"|"+i.name.trim()).toLowerCase();if(!map[key])map[key]={name:i.name.trim(),category:i.category,total:0,unit:i.unit,lots:[]};map[key].total+=Number(i.qty)||0;map[key].lots.push(i)});return Object.values(map)}
function unitForLots(g){return g.unit||g.lots[0]?.unit||""}

function renderDashboard(){renderInventory()}
function renderInventory(){
  const q=$("#inventorySearch").value.toLowerCase();
  const c=$("#categoryFilter").value;
  const groups=grouped().filter(g=>(!q||g.name.toLowerCase().includes(q))&&(!c||g.category===c));

  if(!groups.length){
    $("#inventoryList").innerHTML='<div class="empty">Nessun materiale trovato.</div>';
    return;
  }

  const order=["Malti","Luppoli","Lieviti","Additivi"];

  if(!c){
    $("#inventoryList").innerHTML=order.map(category=>{
      const items=groups.filter(g=>g.category===category);
      if(!items.length) return "";
      return `<section class="inventory-section">
        <h2 class="inventory-section-title">${category}</h2>
        <div class="inventory-section-list">
          ${items.map(g=>inventoryGroupHTML(g)).join("")}
        </div>
      </section>`;
    }).join("");
  }else{
    $("#inventoryList").innerHTML=groups.map(g=>inventoryGroupHTML(g)).join("");
  }
}
function inventoryGroupHTML(g){
  return `<div class="item">
    <div class="item-main">
      <strong>${esc(g.name)} — ${g.total} ${esc(g.lots[0].unit)}</strong>
      <small>${esc(g.category)}</small>
      <details>
        <summary>Dettaglio lotti</summary>
        <div class="lot-details">
          ${g.lots.map(l=>`<div>${esc(l.name)} ${esc(l.expiry||"Nessuna scadenza")} — <b>${l.qty} ${esc(l.unit)}</b> ${dateState(l.expiry)==="expired"?'<span class="expired">SCADUTO</span>':dateState(l.expiry)==="warning"?'<span class="warning">IN SCADENZA</span>':""}</div>`).join("")}
        </div>
      </details>
    </div>
    <button class="secondary" onclick="editGroup('${encodeURIComponent(g.name)}')">Gestisci</button>
  </div>`;
}
function renderRecipes(){
 $("#recipeList").innerHTML=data.recipes.length?data.recipes.map(r=>{
  const by=c=>r.ingredients.filter(i=>i.category===c);
  return `<article class="recipe-card">${r.image?`<img class="recipe-image" src="${r.image}" alt="Etichetta">`:""}<div class="recipe-title">${esc(r.name)}</div>${r.style?`<div class="recipe-style">${esc(r.style)}</div>`:""}${cats.map(([c,icon])=>by(c).length?`<div class="recipe-section"><h4>${icon} ${c}</h4>${by(c).map(i=>`<div class="ingredient-line"><span>${esc(i.name)}</span><b>${i.qty} ${esc(i.unit)}</b></div>`).join("")}</div>`:"").join("")}<div class="recipe-actions"><button class="primary scale-btn" data-id="${r.id}">⬇ Scala dal magazzino</button><button class="secondary edit-btn" data-id="${r.id}">Modifica</button></div>${r.scaled?`<div class="scale-info">✓ Ultima scalatura: ${new Date(r.scaledAt).toLocaleDateString("it-IT")}</div>`:""}</article>`
 }).join(""):'<div class="empty">Nessuna ricetta. Premi “＋ Nuova ricetta” per inserire nome, etichetta e tutte le materie prime in un’unica schermata.</div>';
 $$(".edit-btn").forEach(b=>b.onclick=()=>recipeEditor(data.recipes.find(r=>r.id===b.dataset.id)));
 $$(".scale-btn").forEach(b=>b.onclick=()=>scaleRecipe(b.dataset.id));
}
$("#newRecipe").onclick=()=>recipeEditor();

async function scaleRecipe(id){
 const r=data.recipes.find(x=>x.id===id);if(!r)return;
 if(r.scaled&&!confirm("Hai già scalato dal magazzino, vuoi scalare NUOVAMENTE?"))return;
 let plan=[],problems=[];
 for(const ing of r.ingredients){
  const lots=data.items.filter(x=>x.name.toLowerCase()===ing.name.toLowerCase()&&x.category===ing.category&&x.unit===ing.unit).sort((a,b)=>(a.expiry||"9999").localeCompare(b.expiry||"9999"));
  const total=lots.reduce((s,x)=>s+Number(x.qty),0);
  if(total<ing.qty)problems.push(`${ing.name}: richiesti ${ing.qty}${ing.unit}, disponibili ${total}${ing.unit}`);
  else plan.push({ing,lots});
 }
 if(problems.length){alert("Materiale insufficiente:\n\n"+problems.join("\n")+"\n\nNessuna quantità è stata modificata.");return}
 const preview=plan.map(p=>{let need=p.ing.qty,lines=[];for(const l of p.lots){if(need<=0)break;const take=Math.min(need,Number(l.qty));lines.push(`${l.name} (${l.expiry||"senza scadenza"}) → ${take}${l.unit}`);need-=take}return `${p.ing.name}:\n  ${lines.join("\n  ")}`}).join("\n\n");
 if(!confirm("Confermi la scalatura?\n\n"+preview))return;
 for(const p of plan){let need=p.ing.qty;for(const l of p.lots){if(need<=0)break;const take=Math.min(need,Number(l.qty));l.qty-=take;need-=take}}
 r.scaled=true;r.scaledAt=new Date().toISOString();save();toast("Ricetta scalata dal magazzino")
}

$("#backupBtn").onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mastro_shayen_backup.json";a.click();URL.revokeObjectURL(a.href)};
$("#restoreFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const x=JSON.parse(rd.result);if(!x.items||!x.recipes)throw 0;if(confirm("Sostituire i dati attuali con il backup?")){data=x;save();toast("Backup caricato")}}catch{alert("Backup non valido")}};rd.readAsText(f)};
$$("[data-reset]").forEach(b=>b.onclick=()=>{const c=b.dataset.reset;if(confirm("Reset del reparto "+c+"?")){data.items=data.items.filter(i=>i.category!==c);save();toast("Reparto resettato")}});
$("#resetAll").onclick=()=>{if(confirm("ATTENZIONE: eliminare TUTTO il magazzino e tutte le ricette?")){data={items:[],recipes:[]};save();toast("Dati azzerati")}};
if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js").catch(()=>{});
renderAll();
function renderAll(){renderDashboard();renderRecipes()}

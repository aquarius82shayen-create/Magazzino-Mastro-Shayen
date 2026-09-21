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
  const groups=grouped().filter(g=>{
    const q=$("#inventorySearch").value.toLowerCase().trim(),c=$("#categoryFilter").value;
    return (!q||g.name.toLowerCase().includes(q))&&(!c||g.category===c)
  }).sort((a,b)=>a.name.localeCompare(b.name));
  const all=grouped();
  $("#statMaterials").textContent=all.length;
  $("#statLots").textContent=data.items.length;
  $("#statExpired").textContent=data.items.filter(i=>dateState(i.expiry)==="expired").length;
  $("#inventoryList").innerHTML=groups.length?groups.map(g=>{
    const lots=[...g.lots].sort((a,b)=>(a.expiry||"9999").localeCompare(b.expiry||"9999"));
    return `<article class="material-card">
      <div class="material-main">
        <div><div class="material-name">${esc(g.name)}</div><div class="material-meta">${esc(g.category)} · ${lots.length} ${lots.length===1?"lotto":"lotti"}</div></div>
        <div class="material-total">${g.total} ${esc(unitForLots(g))}</div>
      </div>
      <details><summary class="material-details">Dettaglio lotti</summary>
        <div class="material-details">${lots.map(l=>{
          const st=dateState(l.expiry);
          return `<div class="lot"><span>${esc(l.expiry?new Date(l.expiry+"T12:00:00").getFullYear():"Senza scadenza")} · ${l.expiry?new Date(l.expiry+"T12:00:00").toLocaleDateString("it-IT"):"—"}</span><span><b>${l.qty} ${esc(l.unit)}</b> ${st==="expired"?'<span class="lot-expired">SCADUTO</span>':st==="warning"?'<span class="lot-warning">IN SCADENZA</span>':""}</span></div>`
        }).join("")}</div>
      </details>
      <div class="card-actions"><button class="small-btn" onclick="addLotTo('${encodeURIComponent(g.name)}','${g.category}')">＋ Aggiungi lotto</button><button class="small-btn" onclick="manageLots('${encodeURIComponent(g.name)}','${g.category}')">Gestisci</button></div>
    </article>`
  }).join(""):'<div class="empty">Nessun materiale trovato.</div>';
}
$("#inventorySearch").addEventListener("input",renderInventory);$("#categoryFilter").addEventListener("change",renderInventory);

function addProductForm(name="",cat="Malti"){openModal(`<form class="form" id="productForm"><h2>＋ Aggiungi lotto</h2><div class="form-grid"><label>Materiale<input name="name" required value="${esc(name)}" placeholder="es. Citra"></label><label>Reparto<select name="category"><option ${cat==="Malti"?"selected":""}>Malti</option><option ${cat==="Luppoli"?"selected":""}>Luppoli</option><option ${cat==="Lieviti"?"selected":""}>Lieviti</option><option ${cat==="Additivi"?"selected":""}>Additivi</option></select></label><label>Quantità<input name="qty" type="number" min="0" step="0.01" required></label><label>Unità<select name="unit"><option>g</option><option>kg</option><option>bustine</option><option>pz</option><option>ml</option><option>l</option></select></label><label>Data di scadenza<input name="expiry" type="date"></label><label>Scorta minima<input name="min" type="number" min="0" step="0.01" value="0"></label></div><button class="primary">Salva lotto</button></form>`);$("#productForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);data.items.push({id:crypto.randomUUID(),name:f.get("name").trim(),category:f.get("category"),qty:Number(f.get("qty")),unit:f.get("unit"),expiry:f.get("expiry"),min:Number(f.get("min")||0)});closeModal();save();toast("Lotto aggiunto al magazzino")}}
$("#addProduct").onclick=()=>addProductForm();
window.addLotTo=(n,c)=>addProductForm(decodeURIComponent(n),c);

window.manageLots=(n,c)=>{
 const name=decodeURIComponent(n),lots=data.items.filter(i=>i.name.toLowerCase()===name.toLowerCase()&&i.category===c);
 openModal(`<div class="form"><h2>${esc(name)}</h2><p class="muted">Totale: ${lots.reduce((s,x)=>s+Number(x.qty),0)} ${esc(lots[0]?.unit||"")}</p>${lots.map(l=>`<div class="material-card"><div class="material-main"><div><b>${l.expiry?new Date(l.expiry+"T12:00:00").toLocaleDateString("it-IT"):"Senza scadenza"}</b><div class="material-meta">${l.qty} ${esc(l.unit)} ${dateState(l.expiry)==="expired"?"· SCADUTO":""}</div></div><button class="danger" onclick="deleteLot('${l.id}')">Elimina</button></div></div>`).join("")}<button class="primary" onclick="closeModal();addProductForm('${esc(name)}','${esc(c)}')">＋ Aggiungi lotto</button></div>`)
};
window.deleteLot=id=>{if(confirm("Eliminare questo lotto?")){data.items=data.items.filter(i=>i.id!==id);save();closeModal();toast("Lotto eliminato")}};

function materialOptions(selected=""){
 const gs=grouped().sort((a,b)=>a.name.localeCompare(b.name));
 return `<option value="">Seleziona materiale…</option>`+gs.map(g=>`<option value="${esc(g.name)}" ${g.name===selected?"selected":""}>${esc(g.name)} — ${g.total} ${esc(unitForLots(g))}</option>`).join("")
}
const cats=[["Malti","🌾"],["Luppoli","🌿"],["Lieviti","🧫"],["Additivi","⚗️"]];
function ingredientRow(x={}){return `<div class="ingredient-row"><input class="iname" list="materialList" placeholder="Materiale" value="${esc(x.name||"")}" required><input class="iqty" type="number" min="0" step="0.01" placeholder="Qtà" value="${x.qty||""}" required><select class="iunit"><option ${x.unit==="g"?"selected":""}>g</option><option ${x.unit==="kg"?"selected":""}>kg</option><option ${x.unit==="bustine"?"selected":""}>bustine</option><option ${x.unit==="pz"?"selected":""}>pz</option><option ${x.unit==="ml"?"selected":""}>ml</option><option ${x.unit==="l"?"selected":""}>l</option></select><button type="button" class="remove-ing" title="Rimuovi">×</button></div>`}
function sectionRows(cat,ingredients){const arr=ingredients.filter(x=>x.category===cat);return arr.length?arr.map(ingredientRow).join(""):ingredientRow({})}
function recipeEditor(r=null){
 const ingredients=r?.ingredients||[];
 const list=grouped().sort((a,b)=>a.name.localeCompare(b.name));
 const datalist=list.map(g=>`<option value="${esc(g.name)}">${esc(g.name)} — ${g.total} ${esc(unitForLots(g))}</option>`).join("");
 openModal(`<form class="form recipe-editor" id="recipeForm">
  <h2>${r?"✎ Modifica ricetta":"＋ Nuova ricetta"}</h2>
  <label>Nome della ricetta<input name="name" required value="${esc(r?.name||"")}" placeholder="es. Regina di Cuori"></label>
  <label>Stile <input name="style" value="${esc(r?.style||"")}" placeholder="es. Pils"></label>
  <label>Etichetta (facoltativa)<input type="file" name="image" accept="image/png,image/jpeg"></label>
  <datalist id="materialList">${datalist}</datalist>
  ${cats.map(([cat,icon])=>`<section class="ingredient-section"><div class="ingredient-section-head"><h3><span class="section-icon">${icon}</span> ${cat}</h3><span class="muted">${ingredients.filter(x=>x.category===cat).length} righe</span></div><div class="ingredient-table" data-category="${cat}">${sectionRows(cat,ingredients)}</div><button type="button" class="add-row" data-add="${cat}">＋ Aggiungi riga</button></section>`).join("")}
  <div class="editor-actions"><button type="button" class="secondary" id="cancelRecipe">Annulla</button><button class="primary">Salva ricetta</button></div>
 </form>`);
 $$(".add-row").forEach(b=>b.onclick=()=>{$(`[data-category="${b.dataset.add}"]`).insertAdjacentHTML("beforeend",ingredientRow({}));});
 $$(".remove-ing").forEach(b=>b.onclick=()=>{const row=b.closest(".ingredient-row");const table=row.parentElement;if(table.children.length>1)row.remove();else{row.querySelector(".iname").value="";row.querySelector(".iqty").value="";}});
 $("#cancelRecipe").onclick=closeModal;
 $("#recipeForm").onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target);let image=r?.image||"";const file=f.get("image");
  if(file&&file.size)image=await new Promise(res=>{const rd=new FileReader();rd.onload=()=>res(rd.result);rd.readAsDataURL(file)});
  const ingredients=[];
  cats.forEach(([cat])=>{document.querySelectorAll(`[data-category="${cat}"] .ingredient-row`).forEach(row=>{const name=row.querySelector(".iname").value.trim(),qty=Number(row.querySelector(".iqty").value),unit=row.querySelector(".iunit").value;if(name&&qty>0)ingredients.push({category:cat,name,qty,unit})})});
  const obj={id:r?.id||crypto.randomUUID(),name:f.get("name").trim(),style:f.get("style").trim(),image,ingredients,scaled:r?.scaled||false,scaledAt:r?.scaledAt||null};
  if(r)data.recipes=data.recipes.map(x=>x.id===r.id?obj:x);else data.recipes.push(obj);
  closeModal();save();toast("Ricetta salvata");
 };
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

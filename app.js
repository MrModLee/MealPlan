const data = window.MEAL_SITE_DATA;
const £ = n => `£${Number(n).toFixed(2)}`;
const fmtQty = (q,u) => `${Number(q).toLocaleString('en-GB')} ${u}`;
const clsForInstruction = s => s.includes('BUY FRESH') ? 'fresh' : s.includes('BRING FORWARD') ? 'forward' : s.includes('TOP UP') ? 'topup' : 'buy';

function initStats(){
  const total = data.weeks.reduce((a,w)=>a+w.checkout,0);
  const avg = data.weeks.flatMap(w=>w.days).reduce((a,d)=>({k:a.k+d.kcal,p:a.p+d.protein}),{k:0,p:0});
  const days = data.weeks.flatMap(w=>w.days).length;
  document.getElementById('stats').innerHTML = `
    <div class="stat"><span>Budget</span><strong>£50</strong><small>weekly cap</small></div>
    <div class="stat"><span>4-week spend</span><strong>${£(total)}</strong><small>estimated checkout</small></div>
    <div class="stat"><span>Average calories</span><strong>${Math.round(avg.k/days)}</strong><small>kcal/day</small></div>
    <div class="stat"><span>Average protein</span><strong>${Math.round(avg.p/days)}g</strong><small>per day</small></div>`;
  document.getElementById('budget-note').textContent = data.meta.budgetNote;
}

function makeTabs(elId, prefix, count, showFn){
  const el=document.getElementById(elId);
  el.innerHTML='';
  for(let i=1;i<=count;i++){
    const b=document.createElement('button'); b.className='tab'+(i===1?' active':''); b.textContent=`Week ${i}`;
    b.onclick=()=>{document.querySelectorAll(`#${prefix} .week-view, #${prefix} .shop-view, #${prefix} .batch-view`).forEach(x=>x.classList.remove('active')); document.querySelectorAll(`#${elId} .tab`).forEach(x=>x.classList.remove('active')); b.classList.add('active'); showFn(i)};
    el.appendChild(b);
  }
}

function initMealPlans(){
  const wrap=document.getElementById('mealPlans'); wrap.innerHTML='';
  data.weeks.forEach(w=>{
    const sec=document.createElement('div'); sec.className='week-view'+(w.week===1?' active':''); sec.dataset.week=w.week;
    sec.innerHTML=`<h3>Week ${w.week} meal plan</h3><span class="week-total">Estimated checkout: ${£(w.checkout)}</span>
    <table class="meal-table"><thead><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Dinner for two</th><th>Snacks</th><th>Kcal</th><th>Protein</th></tr></thead><tbody>
      ${w.days.map(d=>`<tr><td><strong>${d.day}</strong></td><td>${d.breakfast}</td><td>${d.lunch}</td><td>${d.dinner}</td><td>${d.snacks.join('<br>')}</td><td>${d.kcal}</td><td>${d.protein}g</td></tr>`).join('')}
    </tbody></table>`;
    wrap.appendChild(sec);
  });
  makeTabs('weekTabs','mealPlans',4,(i)=>document.querySelector(`#mealPlans [data-week="${i}"]`).classList.add('active'));
}

function initShopping(){
  const wrap=document.getElementById('shoppingLists'); wrap.innerHTML='';
  data.shopping.forEach(w=>{
    const bySection={}; w.entries.forEach(e=>{(bySection[e.section] ||= []).push(e)});
    const sec=document.createElement('div'); sec.className='shop-view'+(w.week===1?' active':''); sec.dataset.week=w.week;
    sec.innerHTML=`<h3>Week ${w.week} shopping list</h3><span class="week-total">Checkout estimate: ${£(w.total)}</span>`+
      Object.entries(bySection).map(([section,items])=>`<h4>${section}</h4><table class="shop-table"><thead><tr><th>Item</th><th>Needed</th><th>Action</th><th>Store</th><th>Pack / price</th><th>Cost</th><th>Carry out</th></tr></thead><tbody>`+
      items.map(e=>`<tr><td><strong>${e.item}</strong></td><td>${fmtQty(e.need,e.unit)}</td><td><span class="pill ${clsForInstruction(e.instruction)}">${e.instruction.replaceAll(' - ',' — ')}</span></td><td>${e.store}</td><td>${fmtQty(e.packSize,e.unit)} · ${£(e.price)}</td><td><strong>${£(e.cost)}</strong></td><td>${fmtQty(e.carryOut,e.unit)}</td></tr>`).join('')+`</tbody></table>`).join('');
    wrap.appendChild(sec);
  });
  makeTabs('shopTabs','shoppingLists',4,(i)=>document.querySelector(`#shoppingLists [data-week="${i}"]`).classList.add('active'));
}

function initBatch(){
  const wrap=document.getElementById('batchGuides'); wrap.innerHTML='';
  data.batch.forEach(w=>{
    const sec=document.createElement('div'); sec.className='batch-view'+(w.week===1?' active':''); sec.dataset.week=w.week;
    sec.innerHTML=`<h3>Week ${w.week} batch cooking</h3>` + w.sessions.map(s=>`<div class="batch-session"><h4>${s.label}: covers ${s.coverage}</h4>
      <h5>Exact ingredients to prepare</h5><table class="compact-table"><thead><tr><th>Ingredient</th><th>Amount</th><th>Section</th></tr></thead><tbody>${s.ingredients.map(i=>`<tr><td>${i.item}</td><td>${fmtQty(i.qty,i.unit)}</td><td>${i.section}</td></tr>`).join('')}</tbody></table>
      <h5>Containers and storage</h5><div class="container-list">${s.containers.map(c=>`<div class="container-card"><strong>${c.day}</strong><p><b>Breakfast:</b> ${c.breakfast}<br><b>Lunch:</b> ${c.lunch}<br><b>Dinner:</b> ${c.dinner}<br><b>Snacks:</b> ${c.snacks.join('; ')}</p><p><span class="pill ${c.storage.startsWith('Fridge')?'fresh':'forward'}">${c.storage}</span></p></div>`).join('')}</div>
      ${s.rice.length?`<h5>Rice handling</h5><table class="compact-table"><thead><tr><th>Day</th><th>Dry rice</th><th>Store</th><th>Instruction</th></tr></thead><tbody>${s.rice.map(r=>`<tr><td>${r.day}</td><td>${r.dryRiceG} g</td><td>${r.storage}</td><td>${r.note}</td></tr>`).join('')}</tbody></table>`:''}
      ${s.tofuNotes.length?`<p class="note"><strong>Tofu note:</strong> ${s.tofuNotes.join(' ')}</p>`:''}
    </div>`).join('');
    wrap.appendChild(sec);
  });
  makeTabs('batchTabs','batchGuides',4,(i)=>document.querySelector(`#batchGuides [data-week="${i}"]`).classList.add('active'));
}

function recipeHTML(r){
  return `<details class="recipe-card" open data-course="${r.course}" data-text="${(r.id+' '+r.name+' '+r.course+' '+r.ingredients.map(i=>i.item).join(' ')).toLowerCase()}">
    <summary><span><span class="recipe-id">${r.id}</span> <span class="recipe-title">${r.name}</span></span><span class="pill">${r.course}</span></summary>
    <div class="recipe-body"><p><b>Serves:</b> ${r.serves} · <b>Nutrition:</b> ${r.kcal} kcal / ${r.protein}g protein</p>
    <h5>Ingredients</h5><ul class="ingredients">${r.ingredients.map(i=>`<li>${fmtQty(i.qty,i.unit)} ${i.item}</li>`).join('')}</ul>
    <h5>Method</h5><p>${r.method}</p><h5>Storage</h5><p>${r.storage}</p></div></details>`;
}
function initRecipes(){
  const courses=[...new Set(data.recipes.map(r=>r.course))];
  const filter=document.getElementById('courseFilter'); courses.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;filter.appendChild(o)});
  const wrap=document.getElementById('recipeCards');
  function render(){
    const q=document.getElementById('recipeSearch').value.trim().toLowerCase(); const c=filter.value;
    let html='';
    courses.forEach(course=>{
      const rs=data.recipes.filter(r=>r.course===course && (c==='all'||c===course) && (!q || (r.id+' '+r.name+' '+r.ingredients.map(i=>i.item).join(' ')).toLowerCase().includes(q)));
      if(rs.length) html += `<h3 class="course-heading">${course}s</h3><div class="recipe-grid">${rs.map(recipeHTML).join('')}</div>`;
    });
    wrap.innerHTML=html || '<p>No recipes found.</p>';
  }
  document.getElementById('recipeSearch').addEventListener('input', render); filter.addEventListener('change', render); render();
  document.getElementById('expandAll').onclick=()=>document.querySelectorAll('details').forEach(d=>d.open=true);
  document.getElementById('collapseAll').onclick=()=>document.querySelectorAll('details').forEach(d=>d.open=false);
}

initStats(); initMealPlans(); initShopping(); initBatch(); initRecipes();

const initialMembers = [
  { id: "petr", name: "Petr", initials: "P", selected: true, preferences: [{ ingredient: "houby", level: "never", label: "Nejím houby" }] },
  { id: "jana", name: "Jana", initials: "J", selected: true, preferences: [] },
  { id: "ema", name: "Ema", initials: "E", selected: true, preferences: [{ ingredient: "pálivé", level: "dislike", label: "Méně pálivé" }] },
  { id: "matej", name: "Matěj", initials: "M", selected: true, preferences: [] }
];

const recipes = [
  { id: "paprika", name: "Kuře na paprice", type: "Oběd", image: "public/assets/kure-na-paprice.png", time: 45, servings: 4, description: "Klasika, která u nás nikdy nezklame. Jemná omáčka, šťavnaté kuře a nadýchané knedlíky.", ingredients: ["kuřecí stehna", "smetana", "cibule", "paprika", "knedlík"], missing: ["smetana", "kuřecí stehna"] },
  { id: "lentils", name: "Čočková polévka", type: "Polévka", image: "public/assets/cockova-polevka.png", time: 35, servings: 4, description: "Vydatná, poctivá a plná chuti.", ingredients: ["čočka", "mrkev", "brambory", "cibule"], missing: ["čočka"] },
  { id: "vegetables", name: "Pečená zelenina", type: "Hlavní jídlo", image: "public/assets/pecena-zelenina.png", time: 40, servings: 4, description: "Barevná, voňavá a jednoduchá.", ingredients: ["cuketa", "paprika", "brambory", "cibule"], missing: ["cuketa"] },
  { id: "mushroom", name: "Houbové rizoto", type: "Hlavní jídlo", image: "public/assets/cockova-polevka.png", time: 40, servings: 4, description: "Krémové rizoto s parmazánem a bylinkami.", ingredients: ["houby", "rýže", "parmazán", "vývar"], missing: ["houby", "rýže"] }
];

const defaultState = { view: "plan", selectedDay: 2, members: initialMembers, shopping: [] };
let state;
try { state = { ...defaultState, ...JSON.parse(localStorage.getItem("spajzka-state") || "{}") }; }
catch { state = structuredClone(defaultState); }

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const days = [{ name: "Po", date: 14 }, { name: "Út", date: 15 }, { name: "St", date: 16 }, { name: "Čt", date: 17 }, { name: "Pá", date: 18 }, { name: "So", date: 19 }, { name: "Ne", date: 20 }];

function icon(id) { return `<svg aria-hidden="true"><use href="#i-${id}" /></svg>`; }
function save() { localStorage.setItem("spajzka-state", JSON.stringify(state)); }
function announce(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(announce.timer); announce.timer = setTimeout(() => toast.classList.remove("show"), 2400); }
function selectedMembers() { return state.members.filter(member => member.selected); }
function conflicts(recipe) {
  return selectedMembers().flatMap(member => member.preferences
    .filter(pref => pref.level === "never" && recipe.ingredients.some(ingredient => ingredient.includes(pref.ingredient)))
    .map(pref => ({ member: member.name, ingredient: pref.ingredient })));
}
function avatars(members = selectedMembers()) { return members.map(member => `<span class="avatar" title="${member.name}">${member.initials}</span>`).join(""); }

function renderHeader() {
  document.querySelector("#headerAvatars").innerHTML = avatars(state.members);
  document.querySelectorAll(".bottom-nav button").forEach(button => button.classList.toggle("active", button.dataset.view === state.view));
  const count = state.shopping.filter(item => !item.done).length || 2;
  document.querySelector("#cartBadge").textContent = count;
}

function recipeRow(recipe) {
  const conflict = conflicts(recipe)[0];
  return `<article class="recipe-row" data-recipe="${recipe.id}" tabindex="0">
    <img src="${recipe.image}" alt="${recipe.name}" />
    <div><span class="tag">${recipe.type}</span><h3>${recipe.name}</h3><p>${recipe.description}</p><div class="row-meta"><span>${icon("clock")} ${recipe.time} min</span><span>${recipe.servings} porce</span></div></div>
    <div class="fit ${conflict ? "blocked" : ""}"><span class="status-icon">${conflict ? "×" : icon("check")}</span><span>${conflict ? `${conflict.member}: ${conflict.ingredient}` : "Vhodné pro všechny"}</span></div>
  </article>`;
}

function renderPlan() {
  const featured = recipes[0];
  const conflict = conflicts(featured)[0];
  app.innerHTML = `<section class="view">
    <div class="planner-head"><h1>Duben 2025</h1><div class="week-nav"><button aria-label="Předchozí týden">‹</button><strong>Tento týden</strong><button aria-label="Další týden">›</button></div></div>
    <div class="days" aria-label="Výběr dne">${days.map((day, index) => `<button class="day ${state.selectedDay === index ? "active" : ""}" data-day="${index}"><span>${day.name}</span><b>${day.date}</b></button>`).join("")}</div>
    <article class="featured">
      <div class="featured-copy"><span class="meal-type">${featured.type}</span><h2>${featured.name}</h2><p>${featured.description}</p><div class="meta"><span>${icon("clock")} ${featured.time} min</span><span>${featured.servings} porce</span><span class="avatar-stack">${avatars()}</span></div></div>
      <img class="featured-image" src="${featured.image}" alt="Kuře na paprice s houskovým knedlíkem" />
      <div class="fit-panel"><div class="fit-message ${conflict ? "blocked" : ""}"><span class="status-icon">${conflict ? "×" : icon("check")}</span><div><strong>${conflict ? `${conflict.member}: pozor na ${conflict.ingredient}` : "Vhodné pro všechny"}</strong><small>${conflict ? "Vyberte jiný recept nebo vhodnou náhradu." : "Tento recept si může dát celá vybraná rodina."}</small></div></div><button class="pantry-message" id="addMissing"><span class="status-icon">${icon("plus")}</span><div><strong>Ingredience u nás doma</strong><small>Chybí ${featured.missing.length} suroviny</small></div><span class="chips">${featured.missing.map(item => `<span class="chip">${item}</span>`).join("")}</span></button></div>
    </article>
    <section class="ideas"><div class="section-heading"><h2 class="section-title">Další nápady</h2><button class="text-button" data-go="recipes">Zobrazit všechny recepty →</button></div><div class="recipe-list">${recipes.slice(1, 3).map(recipeRow).join("")}</div></section>
  </section>`;
}

function renderRecipes() {
  const ordered = [...recipes].sort((a, b) => conflicts(a).length - conflicts(b).length);
  app.innerHTML = `<section class="view"><header class="page-head"><h1>Recepty pro vás</h1><p>Řazení se mění podle toho, kdo bude jíst. Každé omezení umíme vysvětlit.</p></header><div class="recipe-list">${ordered.map(recipeRow).join("")}</div></section>`;
}

function renderFamily() {
  const active = selectedMembers()[0] || state.members[0];
  app.innerHTML = `<section class="view"><header class="page-head"><h1>Pro koho vaříme?</h1><p>Vyberte strávníky. Recepty okamžitě přizpůsobíme jejich potřebám.</p></header>
    <div class="people-grid">${state.members.map(member => `<button class="person ${member.selected ? "active" : ""}" data-member="${member.id}" aria-pressed="${member.selected}"><span class="avatar">${member.initials}</span><strong>${member.name}</strong><small>${member.preferences.length ? member.preferences.map(p => p.label).join(", ") : "Bez omezení"}</small></button>`).join("")}</div>
    <section class="preference-box"><h2>Naučte Špajzku, co máte rádi</h2><p>Napište běžnou větou preference pro ${active.name}. Před uložením ji můžete zkontrolovat.</p><form class="preference-form" id="preferenceForm"><input id="preferenceInput" autocomplete="off" placeholder="Například: Já nejím houby" aria-label="Nová stravovací preference" /><button class="primary">Uložit preference</button></form><div class="preferences">${active.preferences.map((pref, index) => `<div class="preference-item"><span><strong>${pref.label}</strong><br><small>Tvrdé omezení · ${pref.ingredient}</small></span><button data-remove-pref="${index}" data-person="${active.id}">Odstranit</button></div>`).join("") || `<div class="empty">Zatím tu nejsou žádná omezení.</div>`}</div></section>
  </section>`;
}

function renderShopping() {
  if (!state.shopping.length) state.shopping = recipes[0].missing.map((name, index) => ({ id: `${name}-${index}`, name, amount: index ? "500 g" : "1 ks", done: false }));
  app.innerHTML = `<section class="view"><header class="page-head"><h1>Nákupní seznam</h1><p>Suroviny jsou sloučené z naplánovaných jídel. Před odesláním na Rohlík je vždy zkontrolujete.</p></header><div class="shopping-list">${state.shopping.map(item => `<label class="shopping-item ${item.done ? "done" : ""}"><input type="checkbox" data-shopping="${item.id}" ${item.done ? "checked" : ""}/><span>${item.name}</span><strong>${item.amount}</strong></label>`).join("")}</div><div class="shopping-actions"><button class="primary" id="rohlikDemo">Připravit košík na Rohlíku</button></div></section>`;
}

function render() {
  renderHeader();
  ({ plan: renderPlan, recipes: renderRecipes, shopping: renderShopping, family: renderFamily }[state.view] || renderPlan)();
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-day]").forEach(button => button.addEventListener("click", () => { state.selectedDay = Number(button.dataset.day); save(); render(); }));
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => changeView(button.dataset.go)));
  document.querySelectorAll("[data-member]").forEach(button => button.addEventListener("click", () => { const member = state.members.find(item => item.id === button.dataset.member); member.selected = !member.selected; save(); render(); announce(member.selected ? `${member.name} bude jíst` : `${member.name} tentokrát nejí`); }));
  document.querySelectorAll("[data-shopping]").forEach(input => input.addEventListener("change", () => { const item = state.shopping.find(entry => entry.id === input.dataset.shopping); item.done = input.checked; save(); render(); }));
  document.querySelectorAll("[data-remove-pref]").forEach(button => button.addEventListener("click", () => { const person = state.members.find(item => item.id === button.dataset.person); person.preferences.splice(Number(button.dataset.removePref), 1); save(); render(); announce("Preference byla odstraněna"); }));
  document.querySelector("#addMissing")?.addEventListener("click", () => { state.shopping = recipes[0].missing.map((name, index) => ({ id: `${name}-${index}`, name, amount: index ? "500 g" : "1 ks", done: false })); save(); changeView("shopping"); announce("Chybějící suroviny jsou v seznamu"); });
  document.querySelector("#rohlikDemo")?.addEventListener("click", () => announce("Napojení na Rohlík MCP přidáme v další etapě"));
  document.querySelector("#preferenceForm")?.addEventListener("submit", event => {
    event.preventDefault(); const input = document.querySelector("#preferenceInput"); const text = input.value.trim(); if (!text) return;
    const person = selectedMembers()[0] || state.members[0]; const lower = text.toLowerCase();
    const ingredient = ["houby", "ryby", "špenát", "cibuli", "arašídy", "lepek"].find(word => lower.includes(word)) || text.replace(/^(já\s+)?(nejím|nemám rád|nesnáším)\s+/i, "").trim();
    person.preferences.push({ ingredient, level: lower.includes("nemám rád") ? "dislike" : "never", label: text }); save(); render(); announce(`Uloženo pro ${person.name}: ${text}`);
  });
}

function changeView(view) { state.view = view; save(); render(); document.querySelector("#app").focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "smooth" }); }
document.querySelectorAll(".bottom-nav button").forEach(button => button.addEventListener("click", () => changeView(button.dataset.view)));
render();

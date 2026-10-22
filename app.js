const initialMembers = [
  { id: "petr", name: "Petr", initials: "P", selected: true, preferences: [{ ingredient: "houby", level: "never", label: "Nejím houby" }] },
  { id: "jana", name: "Jana", initials: "J", selected: true, preferences: [] },
  { id: "ema", name: "Ema", initials: "E", selected: true, preferences: [{ ingredient: "pálivé", level: "dislike", label: "Méně pálivé" }] },
  { id: "matej", name: "Matěj", initials: "M", selected: true, preferences: [] }
];

const seedRecipes = [
  {
    id: "paprika", name: "Kuře na paprice", type: "Oběd", image: "public/assets/kure-na-paprice.png", time: 45, servings: 4,
    description: "Klasika, která u nás nikdy nezklame. Jemná omáčka, šťavnaté kuře a nadýchané knedlíky.",
    ingredients: [
      { name: "kuřecí stehna", amount: "600 g" }, { name: "smetana", amount: "250 ml" }, { name: "cibule", amount: "2 ks" },
      { name: "sladká paprika", amount: "2 lžíce" }, { name: "houskový knedlík", amount: "1 ks" }
    ],
    steps: ["Cibuli nakrájejte najemno a pomalu ji osmahněte dozlatova.", "Přidejte kuře, krátce opečte a zasypte paprikou.", "Podlijte vývarem a duste přibližně 30 minut.", "Vmíchejte smetanu, krátce provařte a dochuťte."],
    missing: ["smetana", "kuřecí stehna"]
  },
  {
    id: "lentils", name: "Čočková polévka", type: "Polévka", image: "public/assets/cockova-polevka.png", time: 35, servings: 4,
    description: "Vydatná, poctivá a plná chuti.",
    ingredients: [{ name: "čočka", amount: "300 g" }, { name: "mrkev", amount: "2 ks" }, { name: "brambory", amount: "3 ks" }, { name: "cibule", amount: "1 ks" }],
    steps: ["Čočku propláchněte a zeleninu nakrájejte.", "Vše zalijte vodou nebo vývarem.", "Vařte doměkka a dochuťte majoránkou."], missing: ["čočka"]
  },
  {
    id: "vegetables", name: "Pečená zelenina", type: "Hlavní jídlo", image: "public/assets/pecena-zelenina.png", time: 40, servings: 4,
    description: "Barevná, voňavá a jednoduchá.",
    ingredients: [{ name: "cuketa", amount: "2 ks" }, { name: "paprika", amount: "3 ks" }, { name: "brambory", amount: "600 g" }, { name: "cibule", amount: "2 ks" }],
    steps: ["Troubu rozehřejte na 210 °C.", "Zeleninu nakrájejte na podobně velké kusy.", "Promíchejte s olejem a pečte 30 minut."], missing: ["cuketa"]
  },
  {
    id: "mushroom", name: "Houbové rizoto", type: "Hlavní jídlo", image: "public/assets/cockova-polevka.png", time: 40, servings: 4,
    description: "Krémové rizoto s parmazánem a bylinkami.",
    ingredients: [{ name: "houby", amount: "400 g" }, { name: "rýže", amount: "320 g" }, { name: "parmazán", amount: "80 g" }, { name: "vývar", amount: "1 l" }],
    steps: ["Houby očistěte a opečte.", "Rýži krátce orestujte.", "Postupně přilévejte vývar a míchejte.", "Vmíchejte houby a parmazán."], missing: ["houby", "rýže"]
  }
];

const days = [{ name: "Po", date: 14 }, { name: "Út", date: 15 }, { name: "St", date: 16 }, { name: "Čt", date: 17 }, { name: "Pá", date: 18 }, { name: "So", date: 19 }, { name: "Ne", date: 20 }];
const defaultPlan = {
  0: { recipeId: "lentils", servings: 4 }, 1: { recipeId: "vegetables", servings: 4 }, 2: { recipeId: "paprika", servings: 4 },
  3: { recipeId: "paprika", servings: 4 }, 4: { recipeId: "vegetables", servings: 4 }, 5: { recipeId: "lentils", servings: 4 }, 6: { recipeId: "paprika", servings: 4 }
};
const defaultState = {
  view: "plan", previousView: "plan", selectedDay: 2, activeMemberId: "petr", members: initialMembers,
  recipes: seedRecipes, shopping: [], pantry: [], mealPlan: defaultPlan, detailRecipeId: null, editRecipeId: null, pendingPreference: null
};

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem("spajzka-state") || "{}");
    const migratedPlan = Object.fromEntries(Object.entries(stored.mealPlan || {}).map(([day, entry]) => [day, typeof entry === "string" ? { recipeId: entry, servings: 4 } : entry]));
    return {
      ...structuredClone(defaultState),
      ...stored,
      mealPlan: { ...defaultPlan, ...migratedPlan },
      members: stored.members || structuredClone(initialMembers),
      recipes: stored.recipes || structuredClone(seedRecipes),
      pantry: stored.pantry || [],
      shopping: (stored.shopping || []).map(item => ({ ...item, recipe: item.recipe || "Dříve přidaná položka" }))
    };
  } catch {
    return structuredClone(defaultState);
  }
}

let state = loadState();
const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}
function icon(id) { return `<svg aria-hidden="true"><use href="#i-${id}" /></svg>`; }
function save() { localStorage.setItem("spajzka-state", JSON.stringify(state)); }
function announce(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}
function selectedMembers() { return state.members.filter(member => member.selected); }
function activeMember() { return state.members.find(member => member.id === state.activeMemberId) || state.members[0]; }
function getRecipe(id) { return state.recipes.find(recipe => recipe.id === id) || state.recipes[0]; }
function selectedPlan() { return state.mealPlan[state.selectedDay] || { recipeId: state.recipes[0].id, servings: state.recipes[0].servings }; }
function selectedRecipe() { return getRecipe(selectedPlan().recipeId); }
function conflicts(recipe) {
  const ingredientNames = recipe.ingredients.map(item => item.name.toLocaleLowerCase("cs"));
  return selectedMembers().flatMap(member => member.preferences
    .filter(pref => pref.level === "never" && ingredientNames.some(ingredient => ingredient.includes(pref.ingredient.toLocaleLowerCase("cs"))))
    .map(pref => ({ member: member.name, ingredient: pref.ingredient })));
}
function avatars(members = selectedMembers()) {
  return members.map(member => `<span class="avatar" title="${escapeHTML(member.name)}">${escapeHTML(member.initials)}</span>`).join("");
}

function renderHeader() {
  document.querySelector("#headerAvatars").innerHTML = avatars(state.members);
  document.querySelectorAll(".bottom-nav button").forEach(button => button.classList.toggle("active", button.dataset.view === state.view || (state.view === "detail" && button.dataset.view === state.previousView)));
  const count = state.shopping.filter(item => !item.done).length;
  const badge = document.querySelector("#cartBadge");
  badge.textContent = count;
  badge.hidden = count === 0;
}

function compatibility(recipe) {
  const conflict = conflicts(recipe)[0];
  if (!selectedMembers().length) return { blocked: true, title: "Vyberte alespoň jednoho strávníka", detail: "Bez výběru nemůžeme recept zkontrolovat." };
  if (conflict) return { blocked: true, title: `${conflict.member} nejí ${conflict.ingredient}`, detail: "Zvolte jiný recept nebo upravte suroviny." };
  return { blocked: false, title: "Vhodné pro všechny", detail: "Recept vyhovuje všem vybraným strávníkům." };
}

function ingredientKey(name, unit = "") {
  return `${name.toLocaleLowerCase("cs").trim()}|${unit.toLocaleLowerCase("cs").trim()}`;
}
function parseAmount(amount) {
  const match = String(amount).trim().match(/^([\d.,]+)\s*(.*)$/);
  return match ? { value: Number(match[1].replace(",", ".")), unit: match[2].trim() } : { value: null, unit: String(amount).trim() };
}
function formatAmount(value, unit) {
  if (value === null) return unit;
  const rounded = Math.round(value * 100) / 100;
  return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(rounded)}${unit ? ` ${unit}` : ""}`;
}
function plannedIngredients() {
  const grouped = new Map();
  Object.values(state.mealPlan).forEach(plan => {
    const recipe = getRecipe(plan.recipeId);
    if (!recipe) return;
    const ratio = Number(plan.servings || recipe.servings) / Number(recipe.servings || 1);
    recipe.ingredients.forEach(ingredient => {
      const parsed = parseAmount(ingredient.amount);
      const key = ingredientKey(ingredient.name, parsed.unit);
      const current = grouped.get(key) || { key, name: ingredient.name, value: parsed.value === null ? null : 0, unit: parsed.unit, sources: new Set() };
      if (parsed.value !== null) current.value += parsed.value * ratio;
      current.sources.add(recipe.name);
      grouped.set(key, current);
    });
  });
  return [...grouped.values()].map(item => ({ ...item, amount: formatAmount(item.value, item.unit), sources: [...item.sources], atHome: state.pantry.includes(item.key) }));
}

function recipeRow(recipe, options = {}) {
  const fit = compatibility(recipe);
  return `<article class="recipe-row" data-recipe="${recipe.id}" tabindex="0" role="button" aria-label="Otevřít recept ${escapeHTML(recipe.name)}">
    <img src="${recipe.image}" alt="${escapeHTML(recipe.name)}" />
    <div><span class="tag">${escapeHTML(recipe.type)}</span><h3>${escapeHTML(recipe.name)}</h3><p>${escapeHTML(recipe.description)}</p><div class="row-meta"><span>${icon("clock")} ${recipe.time} min</span><span>${recipe.servings} porce</span></div></div>
    <div class="fit ${fit.blocked ? "blocked" : ""}"><span class="status-icon">${fit.blocked ? "×" : icon("check")}</span><span>${escapeHTML(fit.title)}</span>${options.showPlan ? `<button class="small-action" data-plan-recipe="${recipe.id}">Naplánovat</button>` : ""}</div>
  </article>`;
}

function renderPlan() {
  const featured = selectedRecipe();
  const fit = compatibility(featured);
  app.innerHTML = `<section class="view">
    <div class="planner-head"><h1>Duben 2025</h1><div class="week-nav"><button aria-label="Předchozí týden">‹</button><strong>Tento týden</strong><button aria-label="Další týden">›</button></div></div>
    <div class="days" aria-label="Výběr dne">${days.map((day, index) => `<button class="day ${state.selectedDay === index ? "active" : ""}" data-day="${index}" aria-pressed="${state.selectedDay === index}"><span>${day.name}</span><b>${day.date}</b><small>${escapeHTML(getRecipe(state.mealPlan[index].recipeId).name)}</small></button>`).join("")}</div>
    <article class="featured">
      <div class="featured-copy"><span class="meal-type">${escapeHTML(featured.type)}</span><h2>${escapeHTML(featured.name)}</h2><p>${escapeHTML(featured.description)}</p><div class="meta"><span>${icon("clock")} ${featured.time} min</span><span>${selectedPlan().servings} porce</span><span class="avatar-stack">${avatars()}</span></div><button class="text-button open-featured" data-recipe="${featured.id}">Otevřít recept →</button></div>
      <img class="featured-image" src="${featured.image}" alt="${escapeHTML(featured.name)}" />
      <div class="fit-panel"><div class="fit-message ${fit.blocked ? "blocked" : ""}"><span class="status-icon">${fit.blocked ? "×" : icon("check")}</span><div><strong>${escapeHTML(fit.title)}</strong><small>${escapeHTML(fit.detail)}</small></div></div><button class="pantry-message" id="addMissing"><span class="status-icon">${icon("plus")}</span><div><strong>Co chybí doma</strong><small>${featured.missing.length ? `Chybí ${featured.missing.length} suroviny` : "Všechno máme"}</small></div><span class="chips">${featured.missing.map(item => `<span class="chip">${escapeHTML(item)}</span>`).join("")}</span></button></div>
    </article>
    <section class="ideas"><div class="section-heading"><h2 class="section-title">Další nápady</h2><button class="text-button" data-go="recipes">Zobrazit všechny recepty →</button></div><div class="recipe-list">${state.recipes.filter(recipe => recipe.id !== featured.id).slice(0, 2).map(recipeRow).join("")}</div></section>
  </section>`;
}

function renderRecipes() {
  const ordered = [...state.recipes].sort((a, b) => conflicts(a).length - conflicts(b).length);
  app.innerHTML = `<section class="view"><header class="page-head page-head-action"><div><h1>Recepty pro vás</h1><p>Recept můžete otevřít nebo rovnou naplánovat na ${days[state.selectedDay].name.toLowerCase()} ${days[state.selectedDay].date}. dubna.</p></div><button class="primary" id="newRecipe">Přidat vlastní recept</button></header><div class="recipe-list">${ordered.map(recipe => recipeRow(recipe, { showPlan: true })).join("")}</div></section>`;
}

function renderDetail() {
  const recipe = getRecipe(state.detailRecipeId);
  const fit = compatibility(recipe);
  const isPlanned = selectedPlan().recipeId === recipe.id;
  app.innerHTML = `<article class="view recipe-detail">
    <button class="back-button" id="backFromDetail">‹ Zpět</button>
    <header class="detail-hero"><div><span class="meal-type">${escapeHTML(recipe.type)}</span><h1>${escapeHTML(recipe.name)}</h1><p>${escapeHTML(recipe.description)}</p><div class="meta"><span>${icon("clock")} ${recipe.time} min</span><span>${recipe.servings} porce</span></div></div><img src="${recipe.image}" alt="${escapeHTML(recipe.name)}" /></header>
    <div class="detail-fit ${fit.blocked ? "blocked" : ""}"><span class="status-icon">${fit.blocked ? "×" : icon("check")}</span><div><strong>${escapeHTML(fit.title)}</strong><small>${escapeHTML(fit.detail)}</small></div></div>
    <div class="detail-actions"><label class="serving-control">Porcí <input id="plannedServings" type="number" min="1" max="20" value="${isPlanned ? selectedPlan().servings : recipe.servings}" /></label><button class="secondary" id="editCurrentRecipe">Upravit recept</button><button class="primary" id="planCurrentRecipe">${isPlanned ? `Aktualizovat plán na ${days[state.selectedDay].name}` : `Naplánovat na ${days[state.selectedDay].name}`}</button><button class="secondary" id="addRecipeMissing">Zobrazit nákup týdne</button></div>
    <div class="recipe-columns"><section><h2>Suroviny</h2><ul class="ingredients">${recipe.ingredients.map(item => `<li><span>${escapeHTML(item.name)}</span><strong>${escapeHTML(item.amount)}</strong></li>`).join("")}</ul></section><section><h2>Jak to doma vaříme</h2><ol class="steps">${recipe.steps.map(step => `<li>${escapeHTML(step)}</li>`).join("")}</ol></section></div>
  </article>`;
}

function renderEditor() {
  const recipe = state.editRecipeId ? getRecipe(state.editRecipeId) : null;
  const draft = recipe || { name: "", type: "Hlavní jídlo", image: "public/assets/pecena-zelenina.png", time: 30, servings: 4, description: "", ingredients: [{ name: "", amount: "" }], steps: [""] };
  app.innerHTML = `<section class="view editor-view">
    <button class="back-button" id="cancelRecipeEdit">‹ Zpět na recepty</button>
    <header class="page-head"><h1>${recipe ? "Upravit recept" : "Nový rodinný recept"}</h1><p>Suroviny zadávejte po řádcích ve formátu „název | množství“. Díky tomu je Špajzka dokáže spojit v nákupním seznamu.</p></header>
    <form class="recipe-form" id="recipeForm">
      <div class="form-section form-main"><h2>Základ receptu</h2><div class="form-grid">
        <label>Název<input name="name" required maxlength="80" value="${escapeHTML(draft.name)}" /></label>
        <label>Typ<select name="type"><option ${draft.type === "Hlavní jídlo" ? "selected" : ""}>Hlavní jídlo</option><option ${draft.type === "Polévka" ? "selected" : ""}>Polévka</option><option ${draft.type === "Oběd" ? "selected" : ""}>Oběd</option><option ${draft.type === "Večeře" ? "selected" : ""}>Večeře</option></select></label>
        <label>Čas v minutách<input name="time" type="number" min="1" max="600" required value="${draft.time}" /></label>
        <label>Výchozí počet porcí<input name="servings" type="number" min="1" max="20" required value="${draft.servings}" /></label>
        <label class="wide">Krátký popis<textarea name="description" rows="3" maxlength="240" required>${escapeHTML(draft.description)}</textarea></label>
        <label class="wide">Fotografie<select name="image"><option value="public/assets/kure-na-paprice.png" ${draft.image.includes("kure") ? "selected" : ""}>Kuře na paprice</option><option value="public/assets/cockova-polevka.png" ${draft.image.includes("cockova") ? "selected" : ""}>Polévka</option><option value="public/assets/pecena-zelenina.png" ${draft.image.includes("zelenina") ? "selected" : ""}>Pečená zelenina</option></select></label>
      </div></div>
      <div class="form-section"><h2>Suroviny</h2><label><span class="visually-hidden">Suroviny</span><textarea name="ingredients" rows="8" required placeholder="cibule | 2 ks&#10;smetana | 250 ml">${escapeHTML(draft.ingredients.map(item => `${item.name} | ${item.amount}`).join("\n"))}</textarea></label><small>Stejný název a jednotka se v nákupu automaticky sečtou.</small></div>
      <div class="form-section"><h2>Jak to doma vaříme</h2><label><span class="visually-hidden">Jednotlivé kroky</span><textarea name="steps" rows="8" required placeholder="Každý krok napište na samostatný řádek.">${escapeHTML(draft.steps.join("\n"))}</textarea></label></div>
      <div class="form-actions">${recipe ? `<button class="danger" type="button" id="deleteRecipe">Smazat recept</button>` : ""}<button class="secondary" type="button" id="cancelRecipeEditBottom">Zrušit</button><button class="primary" type="submit">${recipe ? "Uložit změny" : "Vytvořit recept"}</button></div>
    </form>
  </section>`;
}

function renderFamily() {
  const member = activeMember();
  const pending = state.pendingPreference;
  app.innerHTML = `<section class="view"><header class="page-head"><h1>Pro koho vaříme?</h1><p>Zaškrtnutí určuje strávníky. Tlačítkem Upravit profil zvolíte, co si má Špajzka o daném člověku pamatovat.</p></header>
    <div class="people-grid">${state.members.map(item => `<article class="person ${item.selected ? "active" : ""} ${item.id === member.id ? "editing" : ""}"><button class="person-select" data-member="${item.id}" aria-pressed="${item.selected}"><span class="avatar">${item.initials}</span><span><strong>${escapeHTML(item.name)}</strong><small>${item.selected ? "Bude jíst" : "Tentokrát nejí"}</small></span></button><button class="edit-person" data-edit-person="${item.id}">${item.id === member.id ? "Upravuji" : "Upravit profil"}</button></article>`).join("")}</div>
    <section class="preference-box"><h2>Co si pamatuji o ${escapeHTML(member.name)}</h2><p>Napište běžnou větou novou preferenci. Nejdřív ukážeme, jak jsme ji pochopili, a teprve potom ji uložíme.</p>
      <form class="preference-form" id="preferenceForm"><input id="preferenceInput" autocomplete="off" placeholder="Například: Já nejím houby" aria-label="Nová stravovací preference" /><button class="primary">Pochopit větu</button></form>
      ${pending ? `<div class="learning-review"><span class="status-icon">${icon("spark")}</span><div><small>Špajzka navrhuje</small><strong>${escapeHTML(pending.level === "never" ? "Nikdy nenabízet" : "Doporučovat méně")}: ${escapeHTML(pending.ingredient)}</strong><p>Původní věta: „${escapeHTML(pending.label)}“</p></div><div class="review-actions"><button class="primary" id="confirmPreference">Potvrdit</button><button class="secondary" id="cancelPreference">Zrušit</button></div></div>` : ""}
      <div class="preferences">${member.preferences.map((pref, index) => `<div class="preference-item"><span><strong>${escapeHTML(pref.label)}</strong><br><small>${pref.level === "never" ? "Tvrdé omezení" : "Nižší priorita"} · ${escapeHTML(pref.ingredient)}</small></span><button data-remove-pref="${index}" data-person="${member.id}">Odstranit</button></div>`).join("") || `<div class="empty">Zatím tu nejsou žádná omezení.</div>`}</div>
    </section></section>`;
}

function renderShopping() {
  const ingredients = plannedIngredients();
  const needed = ingredients.filter(item => !item.atHome);
  app.innerHTML = `<section class="view"><header class="page-head"><h1>Nákup na celý týden</h1><p>Špajzka sečetla ${ingredients.length} různých surovin ze sedmi naplánovaných jídel. Označte, co už máte doma.</p></header>
    <div class="shopping-summary"><strong>${needed.length}</strong><span>položek zbývá koupit</span><small>${ingredients.length - needed.length} máte doma</small></div>
    <div class="shopping-list">${ingredients.map(item => `<label class="shopping-item ${item.atHome ? "done" : ""}"><input type="checkbox" data-pantry="${escapeHTML(item.key)}" ${item.atHome ? "checked" : ""}/><span>${escapeHTML(item.name)}<small>${escapeHTML(item.sources.join(" · "))}</small></span><strong>${escapeHTML(item.amount)}</strong></label>`).join("")}</div>
    <div class="shopping-actions"><button class="secondary" id="resetPantry">Označit vše jako chybějící</button><button class="primary" id="rohlikDemo" ${needed.length ? "" : "disabled"}>Připravit ${needed.length} položek na Rohlíku</button></div>
  </section>`;
}

function render() {
  renderHeader();
  ({ plan: renderPlan, recipes: renderRecipes, detail: renderDetail, editor: renderEditor, shopping: renderShopping, family: renderFamily }[state.view] || renderPlan)();
  bindEvents();
}

function openRecipe(id) {
  state.previousView = state.view === "detail" ? state.previousView : state.view;
  state.detailRecipeId = id;
  state.view = "detail";
  save(); render(); window.scrollTo({ top: 0, behavior: "smooth" });
}
function changeView(view) {
  state.view = view; state.pendingPreference = null; save(); render();
  document.querySelector("#app").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function addMissing(recipe) {
  const items = recipe.ingredients.filter(item => recipe.missing.includes(item.name)).map(item => ({ id: `${recipe.id}-${item.name}`, name: item.name, amount: item.amount, recipe: recipe.name, done: false }));
  const existing = new Set(state.shopping.map(item => item.id));
  const fresh = items.filter(item => !existing.has(item.id));
  state.shopping.push(...fresh);
  save(); renderHeader(); announce(fresh.length ? "Chybějící suroviny jsou v seznamu" : "Všechny suroviny už v seznamu jsou");
}
function parseRecipeLines(value, kind) {
  return value.split("\n").map(line => line.trim()).filter(Boolean).map(line => {
    if (kind === "steps") return line;
    const [name, ...amountParts] = line.split("|");
    return { name: name.trim(), amount: amountParts.join("|").trim() || "dle potřeby" };
  });
}
function parsePreference(text) {
  const lower = text.toLocaleLowerCase("cs");
  const known = ["houby", "ryby", "špenát", "cibuli", "arašídy", "lepek", "laktózu", "maso"];
  const ingredient = known.find(word => lower.includes(word)) || text.replace(/^(já\s+)?(nejím|nemám rád|nesnáším|nechci)\s+/i, "").trim();
  return { ingredient: ingredient || text, level: lower.includes("nemám rád") || lower.includes("moc nemusím") ? "dislike" : "never", label: text };
}

function bindEvents() {
  document.querySelectorAll("[data-day]").forEach(button => button.addEventListener("click", () => { state.selectedDay = Number(button.dataset.day); save(); render(); }));
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => changeView(button.dataset.go)));
  document.querySelectorAll("[data-recipe]").forEach(row => {
    row.addEventListener("click", event => { if (!event.target.closest("[data-plan-recipe]")) openRecipe(row.dataset.recipe); });
    row.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openRecipe(row.dataset.recipe); } });
  });
  document.querySelectorAll("[data-plan-recipe]").forEach(button => button.addEventListener("click", event => { event.stopPropagation(); const recipe = getRecipe(button.dataset.planRecipe); state.mealPlan[state.selectedDay] = { recipeId: recipe.id, servings: recipe.servings }; save(); announce(`${recipe.name} je v plánu na ${days[state.selectedDay].name}`); render(); }));
  document.querySelectorAll("[data-member]").forEach(button => button.addEventListener("click", () => { const member = state.members.find(item => item.id === button.dataset.member); member.selected = !member.selected; save(); render(); announce(member.selected ? `${member.name} bude jíst` : `${member.name} tentokrát nejí`); }));
  document.querySelectorAll("[data-edit-person]").forEach(button => button.addEventListener("click", () => { state.activeMemberId = button.dataset.editPerson; state.pendingPreference = null; save(); render(); }));
  document.querySelectorAll("[data-pantry]").forEach(input => input.addEventListener("change", () => { const key = input.dataset.pantry; state.pantry = input.checked ? [...new Set([...state.pantry, key])] : state.pantry.filter(item => item !== key); save(); render(); }));
  document.querySelectorAll("[data-remove-pref]").forEach(button => button.addEventListener("click", () => { const person = state.members.find(item => item.id === button.dataset.person); person.preferences.splice(Number(button.dataset.removePref), 1); save(); render(); announce("Preference byla odstraněna"); }));
  document.querySelector("#addMissing")?.addEventListener("click", () => changeView("shopping"));
  document.querySelector("#addRecipeMissing")?.addEventListener("click", () => changeView("shopping"));
  document.querySelector("#planCurrentRecipe")?.addEventListener("click", () => { const recipe = getRecipe(state.detailRecipeId); const servings = Math.max(1, Number(document.querySelector("#plannedServings").value) || recipe.servings); state.mealPlan[state.selectedDay] = { recipeId: recipe.id, servings }; save(); announce(`Recept je v plánu na ${days[state.selectedDay].name} pro ${servings} porce`); render(); });
  document.querySelector("#backFromDetail")?.addEventListener("click", () => changeView(state.previousView || "recipes"));
  document.querySelector("#newRecipe")?.addEventListener("click", () => { state.editRecipeId = null; changeView("editor"); });
  document.querySelector("#editCurrentRecipe")?.addEventListener("click", () => { state.editRecipeId = state.detailRecipeId; changeView("editor"); });
  document.querySelector("#cancelRecipeEdit")?.addEventListener("click", () => changeView("recipes"));
  document.querySelector("#cancelRecipeEditBottom")?.addEventListener("click", () => changeView("recipes"));
  document.querySelector("#recipeForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const ingredients = parseRecipeLines(data.get("ingredients"), "ingredients");
    const steps = parseRecipeLines(data.get("steps"), "steps");
    if (!ingredients.length || !steps.length) { announce("Doplňte alespoň jednu surovinu a jeden krok"); return; }
    const current = state.editRecipeId ? getRecipe(state.editRecipeId) : null;
    const recipe = {
      id: current?.id || `recipe-${Date.now()}`, name: data.get("name").trim(), type: data.get("type"), image: data.get("image"),
      time: Number(data.get("time")), servings: Number(data.get("servings")), description: data.get("description").trim(),
      ingredients, steps, missing: ingredients.map(item => item.name), custom: current?.custom ?? true
    };
    const index = state.recipes.findIndex(item => item.id === recipe.id);
    if (index >= 0) state.recipes[index] = recipe; else state.recipes.push(recipe);
    state.detailRecipeId = recipe.id; state.editRecipeId = recipe.id; state.view = "recipes"; save(); announce(current ? "Recept byl upraven" : "Recept byl vytvořen"); openRecipe(recipe.id);
  });
  document.querySelector("#deleteRecipe")?.addEventListener("click", () => {
    if (!window.confirm("Opravdu chcete tento recept smazat? Z naplánovaných dnů ho nahradíme jiným receptem.")) return;
    if (state.recipes.length === 1) { announce("Poslední recept nelze smazat"); return; }
    const deletedId = state.editRecipeId; state.recipes = state.recipes.filter(recipe => recipe.id !== deletedId);
    const replacement = state.recipes[0]; Object.keys(state.mealPlan).forEach(day => { if (state.mealPlan[day].recipeId === deletedId) state.mealPlan[day] = { recipeId: replacement.id, servings: replacement.servings }; });
    state.editRecipeId = null; state.detailRecipeId = null; save(); announce("Recept byl smazán"); changeView("recipes");
  });
  document.querySelector("#resetPantry")?.addEventListener("click", () => { state.pantry = []; save(); render(); });
  document.querySelector("#rohlikDemo")?.addEventListener("click", () => announce("Bezpečné napojení na Rohlík MCP připravíme v serverové etapě"));
  document.querySelector("#preferenceForm")?.addEventListener("submit", event => { event.preventDefault(); const input = document.querySelector("#preferenceInput"); const text = input.value.trim(); if (!text) { input.focus(); return; } state.pendingPreference = parsePreference(text); save(); render(); });
  document.querySelector("#confirmPreference")?.addEventListener("click", () => { const member = activeMember(); member.preferences.push(state.pendingPreference); state.pendingPreference = null; save(); render(); announce(`Preference byla uložena pro ${member.name}`); });
  document.querySelector("#cancelPreference")?.addEventListener("click", () => { state.pendingPreference = null; save(); render(); });
}

document.querySelectorAll(".bottom-nav button").forEach(button => button.addEventListener("click", () => changeView(button.dataset.view)));
render();

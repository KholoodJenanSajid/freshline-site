// ---------- Synthetic data generation (deterministic seed, mirrors the React prototype) ----------
const CATEGORIES = [
  { name: "Dairy", items: ["Toned Milk 500ml", "Paneer 200g", "Curd 400g", "Butter 100g", "Cheese Slices"], shelfLife: [3, 7], velocity: [8, 25] },
  { name: "Vegetables", items: ["Tomato 1kg", "Spinach Bunch", "Onion 1kg", "Capsicum 500g", "Coriander Bunch"], shelfLife: [2, 6], velocity: [10, 30] },
  { name: "Bakery", items: ["Brown Bread", "Multigrain Bread", "Burger Buns", "Croissant Pack"], shelfLife: [2, 4], velocity: [6, 18] },
  { name: "Fruits", items: ["Banana Dozen", "Apple 1kg", "Papaya", "Grapes 500g"], shelfLife: [3, 8], velocity: [5, 15] },
  { name: "Ready-to-eat", items: ["Veg Sandwich", "Sushi Box", "Salad Bowl", "Smoothie Bottle"], shelfLife: [1, 3], velocity: [4, 12] },
];

function seedRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateInventory() {
  const rand = seedRandom(42);
  const items = [];
  let id = 1;
  CATEGORIES.forEach((cat) => {
    cat.items.forEach((name) => {
      const shelfLifeDays = cat.shelfLife[0] + Math.floor(rand() * (cat.shelfLife[1] - cat.shelfLife[0]));
      const ageInDays = Math.floor(rand() * shelfLifeDays * 1.3);
      const daysLeft = Math.max(0, shelfLifeDays - ageInDays);
      const dailyVelocity = cat.velocity[0] + rand() * (cat.velocity[1] - cat.velocity[0]);
      const stock = Math.floor(5 + rand() * 60);
      const unitPrice = Math.floor(20 + rand() * 180);
      const daysToSellOut = stock / dailyVelocity;
      const riskScore = daysToSellOut - daysLeft;

      let risk = "safe";
      if (daysLeft <= 0) risk = "expired";
      else if (riskScore > 1.5) risk = "high";
      else if (riskScore > 0) risk = "medium";

      items.push({
        id: id++, name, category: cat.name, shelfLifeDays, daysLeft, stock,
        dailyVelocity: Math.round(dailyVelocity * 10) / 10, unitPrice,
        daysToSellOut: Math.round(daysToSellOut * 10) / 10, risk,
        riskScore: Math.round(riskScore * 10) / 10,
      });
    });
  });
  return items;
}

const ACTIONS = {
  high: { label: "Discount 40%" },
  medium: { label: "Discount 20%" },
  expired: { label: "Route to NGO" },
  safe: { label: "No action" },
};

const RISK_META = {
  safe: { label: "Safe", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  medium: { label: "At Risk", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  high: { label: "High Risk", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  expired: { label: "Expired", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

function applyAction(item, actionTaken) {
  const fullLoss = item.stock * item.unitPrice;
  if (!actionTaken) {
    if (item.risk === "high" || item.risk === "expired") return { recovered: 0, lost: fullLoss };
    return { recovered: fullLoss, lost: 0 };
  }
  if (item.risk === "expired") return { recovered: fullLoss * 0.15, lost: fullLoss * 0.85 };
  if (item.risk === "high") {
    const sold = fullLoss * 0.6;
    return { recovered: sold * 0.6, lost: fullLoss - sold };
  }
  if (item.risk === "medium") {
    const sold = fullLoss * 0.85;
    return { recovered: sold * 0.8, lost: fullLoss - sold };
  }
  return { recovered: fullLoss, lost: 0 };
}

// ---------- State ----------
const inventory = generateInventory();
let actionsApplied = {};
let categoryFilter = "All";

const fmt = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

// ---------- Render ----------
function render() {
  // Stats
  let totalValue = 0, totalAtRisk = 0, itemsFlagged = 0, lostNoAction = 0, lostWithAction = 0;
  inventory.forEach((it) => {
    const value = it.stock * it.unitPrice;
    totalValue += value;
    if (it.risk !== "safe") { itemsFlagged++; totalAtRisk += value; }
    lostWithAction += applyAction(it, !!actionsApplied[it.id]).lost;
    lostNoAction += applyAction(it, false).lost;
  });
  const saved = lostNoAction - lostWithAction;
  const appliedCount = Object.values(actionsApplied).filter(Boolean).length;

  document.getElementById("sku-count").textContent = `LIVE · ${inventory.length} SKUs tracked`;
  document.getElementById("stat-total").textContent = fmt(totalValue);
  document.getElementById("stat-total-foot").textContent = `across ${inventory.length} SKUs`;
  document.getElementById("stat-flagged").textContent = `${itemsFlagged} items`;
  document.getElementById("stat-flagged-foot").textContent = `${fmt(totalAtRisk)} exposed`;
  document.getElementById("stat-loss").textContent = fmt(lostNoAction);
  document.getElementById("stat-saved").textContent = fmt(saved);
  document.getElementById("stat-saved-foot").textContent = `${appliedCount} actions applied`;

  // Category filters
  const categories = ["All", ...CATEGORIES.map((c) => c.name)];
  const filterEl = document.getElementById("category-filters");
  filterEl.innerHTML = "";
  categories.forEach((c) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (categoryFilter === c ? " active" : "");
    chip.textContent = c;
    chip.onclick = () => { categoryFilter = c; render(); };
    filterEl.appendChild(chip);
  });

  // Rows
  const riskOrder = { expired: 0, high: 1, medium: 2, safe: 3 };
  let list = categoryFilter === "All" ? inventory : inventory.filter((i) => i.category === categoryFilter);
  list = [...list].sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

  const rowsEl = document.getElementById("item-rows");
  rowsEl.innerHTML = "";
  list.forEach((item) => {
    const meta = RISK_META[item.risk];
    const pct = Math.max(0, Math.min(100, (item.daysLeft / item.shelfLifeDays) * 100));
    const isApplied = !!actionsApplied[item.id];
    const action = ACTIONS[item.risk];

    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `
      <div>
        <div class="item-name">${item.name}</div>
        <div class="item-cat">${item.category}</div>
      </div>
      <div>
        <span class="risk-badge" style="color:${meta.color};background:${meta.bg}">${meta.label}</span>
      </div>
      <div class="freshness-cell">
        <div class="freshness-track"><div class="freshness-fill" style="width:${pct}%;background:${meta.color}"></div></div>
        <span class="freshness-label">${item.daysLeft}d left / ${item.shelfLifeDays}d shelf life</span>
      </div>
      <div class="num-cell">${item.stock} units</div>
      <div class="num-cell" style="color:${item.riskScore > 0 ? '#f59e0b' : '#8d98a6'}">${item.daysToSellOut}d to sell · ${item.daysLeft}d to expiry</div>
      <div></div>
    `;
    const actionCell = row.lastElementChild;
    if (item.risk === "safe") {
      actionCell.innerHTML = `<span style="font-size:12px;color:var(--text-dim)">—</span>`;
    } else {
      const toggle = document.createElement("div");
      toggle.className = "action-toggle" + (isApplied ? " applied" : "");
      toggle.textContent = isApplied ? "✓ Applied" : action.label;
      toggle.onclick = () => { actionsApplied[item.id] = !actionsApplied[item.id]; render(); };
      actionCell.appendChild(toggle);
    }
    rowsEl.appendChild(row);
  });
}

document.getElementById("apply-all-btn").onclick = () => {
  const next = {};
  inventory.forEach((it) => { if (it.risk !== "safe") next[it.id] = true; });
  actionsApplied = next;
  render();
};
document.getElementById("reset-btn").onclick = () => { actionsApplied = {}; render(); };

render();

(() => {
const moneyBox = document.getElementById("money-box");
const catalogTotal = document.getElementById("catalog-total");
const spentTotal = document.getElementById("spent-total");
const itemsBought = document.getElementById("items-bought");
const itemsLeft = document.getElementById("items-left");
const shopGrid = document.getElementById("shop-grid");
const shopMsg = document.getElementById("shop-msg");
const affordCopy = document.getElementById("afford-copy");
const moneyProgressFill = document.getElementById("money-progress-fill");
const elonFace = document.getElementById("elon-face");
const elonMoodTitle = document.getElementById("elon-mood-title");
const elonMoodCopy = document.getElementById("elon-mood-copy");
const cartList = document.getElementById("cart-list");
const cartEmpty = document.getElementById("cart-empty");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const backToTopButton = document.getElementById("elon-back-to-top");
const shopLayout = document.querySelector(".elon-shop-layout");
const cartPanel = document.querySelector(".elon-cart-panel");
const header = document.querySelector("header");

const ELON_STORAGE_KEY = "fgh-elon-money-state-v1";
const INITIAL_MONEY = 200000000000;
let money = INITIAL_MONEY;
let statusMessage = "Pick your first impossible purchase.";
let cartPanelTicking = false;
let cartPanelCurrentOffset = 0;
let cartPanelTargetOffset = 0;
let cartPanelAnimationId = 0;

const recordGameHistory = (payload) => {
  if (window.FGHProfile && typeof window.FGHProfile.recordHistory === "function") {
    window.FGHProfile.recordHistory(payload);
  }
};

const facePaths = {
  fresh: "../assets/elon-money/elonface1.png",
  spendLow: "../assets/elon-money/elonface2.png",
  spendHigh: "../assets/elon-money/elonface3.png",
  spendAll: "../assets/elon-money/elonface4.png",
};

const items = [
  {
    key: "tesla-car",
    name: "Tesla Car",
    price: 100000,
    icon: "🚗",
    description: "Instant driveway flex for a billionaire with no patience for traffic.",
    joke: "Still cheaper than a chaotic social media week.",
    accent: "#ff6b35",
    soft: "rgba(255, 107, 53, 0.16)",
    deep: "rgba(255, 107, 53, 0.24)",
    quantity: 0,
    maxStock: Infinity,
  },
  {
    key: "private-jet",
    name: "Private Jet",
    price: 50000000,
    icon: "✈️",
    description: "Skip the line, skip the airport, skip every normal human inconvenience.",
    joke: "Boarding group: billionaire only.",
    accent: "#2f80ed",
    soft: "rgba(47, 128, 237, 0.16)",
    deep: "rgba(47, 128, 237, 0.24)",
    quantity: 0,
    maxStock: Infinity,
  },
  {
    key: "mansion",
    name: "Mansion",
    price: 5000000,
    icon: "🏛️",
    description: "More rooms than anyone needs and just enough echo for dramatic entrances.",
    joke: "Finally, a starter home.",
    accent: "#c084fc",
    soft: "rgba(192, 132, 252, 0.16)",
    deep: "rgba(192, 132, 252, 0.24)",
    quantity: 0,
    maxStock: Infinity,
  },
  {
    key: "gold-gun",
    name: "Gold Gun",
    price: 500000,
    icon: "🔫",
    description: "A terrible idea made shinier, louder, and more expensive than necessary.",
    joke: "Tasteful? No. Expensive? Absolutely.",
    accent: "#f2c94c",
    soft: "rgba(242, 201, 76, 0.16)",
    deep: "rgba(242, 201, 76, 0.24)",
    quantity: 0,
    maxStock: Infinity,
  },
  {
    key: "private-island",
    name: "Private Island",
    price: 10000000,
    icon: "🏝️",
    description: "Beachfront privacy for when the neighbors are the entire ocean.",
    joke: "Wi-Fi not included. Palm trees probably are.",
    accent: "#00b894",
    soft: "rgba(0, 184, 148, 0.16)",
    deep: "rgba(0, 184, 148, 0.24)",
    quantity: 0,
    maxStock: 1,
  },
  {
    key: "spacex-rocket",
    name: "SpaceX Rocket",
    price: 60000000,
    icon: "🚀",
    description: "The fastest possible way to turn cash into fire, noise, and bragging rights.",
    joke: "Launch one more flex into orbit.",
    accent: "#eb5757",
    soft: "rgba(235, 87, 87, 0.16)",
    deep: "rgba(235, 87, 87, 0.24)",
    quantity: 0,
    maxStock: Infinity,
  },
  {
    key: "football-team",
    name: "Football Team",
    price: 2000000000,
    icon: "🏈",
    description: "Own the roster, the stadium, the drama, and every overreaction on game day.",
    joke: "A casual weekend purchase.",
    accent: "#1f9d55",
    soft: "rgba(31, 157, 85, 0.16)",
    deep: "rgba(31, 157, 85, 0.24)",
    quantity: 0,
    maxStock: Infinity,
  },
  {
    key: "luxury-watch",
    name: "Luxury Watch",
    price: 1000000,
    icon: "⌚",
    description: "A million-dollar reminder that time is money and you have too much of both.",
    joke: "At this price it should slow time down.",
    accent: "#9b51e0",
    soft: "rgba(155, 81, 224, 0.16)",
    deep: "rgba(155, 81, 224, 0.24)",
    quantity: 0,
    maxStock: Infinity,
  },
  {
    key: "vineyard",
    name: "Vineyard",
    price: 500000000,
    icon: "🍇",
    description: "Buy the land, buy the bottles, and pretend the weather is part of the brand.",
    joke: "For when grape juice needs better marketing.",
    accent: "#8e5a3c",
    soft: "rgba(142, 90, 60, 0.16)",
    deep: "rgba(142, 90, 60, 0.24)",
    quantity: 0,
    maxStock: Infinity,
  },
  {
    key: "youtube-company",
    name: "YouTube Company",
    price: 10000000000,
    icon: "▶️",
    description: "Acquire the algorithm and every unskippable ad in one giant flex.",
    joke: "Smash that buy button.",
    accent: "#ff3b30",
    soft: "rgba(255, 59, 48, 0.16)",
    deep: "rgba(255, 59, 48, 0.24)",
    quantity: 0,
    maxStock: 1,
  },
];

const TOTAL_STORE_COST = items.reduce((total, item) => total + item.price, 0);
const formatter = new Intl.NumberFormat("en-US");

function formatMoney(value) {
  return `$${formatter.format(value)}`;
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function loadElonState() {
  try {
    const raw = localStorage.getItem(ELON_STORAGE_KEY);
    return raw ? safeParse(raw) : null;
  } catch (error) {
    return null;
  }
}

function applyElonState(savedState) {
  if (!savedState || typeof savedState !== "object") return;

  const quantities = savedState.quantities && typeof savedState.quantities === "object"
    ? savedState.quantities
    : {};
  let remainingMoney = INITIAL_MONEY;

  items.forEach((item) => {
    const rawQuantity = Number(quantities[item.key]);
    const requestedQuantity = Number.isFinite(rawQuantity) ? Math.max(0, Math.floor(rawQuantity)) : 0;
    const affordableQuantity = Math.floor(remainingMoney / item.price);
    const stockLimit = Number.isFinite(item.maxStock) ? item.maxStock : affordableQuantity;
    const nextQuantity = Math.min(requestedQuantity, stockLimit, affordableQuantity);
    item.quantity = nextQuantity;
    remainingMoney -= item.price * nextQuantity;
  });

  money = Math.max(0, remainingMoney);
  if (typeof savedState.statusMessage === "string" && savedState.statusMessage.trim()) {
    statusMessage = savedState.statusMessage.trim().slice(0, 140);
  }
}

function buildElonState() {
  return {
    version: 1,
    money,
    quantities: items.reduce((result, item) => {
      result[item.key] = item.quantity;
      return result;
    }, {}),
    statusMessage,
    updatedAt: Date.now(),
  };
}

function saveElonState() {
  try {
    localStorage.setItem(ELON_STORAGE_KEY, JSON.stringify(buildElonState()));
  } catch (error) {
    // Ignore storage errors.
  }
}

function getPurchasedItems() {
  return items.filter((item) => item.quantity > 0);
}

function getBuyableItems() {
  return items.filter((item) => item.quantity < item.maxStock);
}

function getTotalQuantity() {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function getSingleStockItems() {
  return items.filter((item) => item.maxStock === 1);
}

function setStatusMessage(message) {
  statusMessage = message;
  if (shopMsg) shopMsg.textContent = message;
}

function updateElonFace() {
  if (!elonFace || !elonMoodTitle || !elonMoodCopy) return;

  const spent = INITIAL_MONEY - money;
  const totalQuantity = getTotalQuantity();
  const affordableItems = getBuyableItems().filter((item) => item.price <= money);
  const spendRatio = INITIAL_MONEY > 0 ? spent / INITIAL_MONEY : 0;

  let nextSrc = facePaths.fresh;
  let title = "Fresh Wallet Energy";
  let copy = "He has not noticed the shopping spree yet.";

  if (money <= 0 || affordableItems.length === 0) {
    nextSrc = facePaths.spendAll;
    title = "Wallet Vaporized";
    copy = "The budget is tapped out. The luxury spree finally caught up with him.";
  } else if (totalQuantity > 0 && spendRatio >= 0.55) {
    nextSrc = facePaths.spendHigh;
    title = "Luxury Damage";
    copy = "The catalog is getting thinner and the billionaire smile is fading fast.";
  } else if (totalQuantity > 0) {
    nextSrc = facePaths.spendLow;
    title = "Mildly Concerned";
    copy = "The spending has started, but the wallet still looks annoyingly healthy.";
  }

  if (elonFace.getAttribute("src") !== nextSrc) {
    elonFace.setAttribute("src", nextSrc);
  }

  elonMoodTitle.textContent = title;
  elonMoodCopy.textContent = copy;
}

function updateDashboard() {
  const spent = INITIAL_MONEY - money;
  const purchased = getPurchasedItems();
  const buyableItems = getBuyableItems();
  const totalQuantity = getTotalQuantity();
  const singleStockItems = getSingleStockItems();
  const singleStockLeft = singleStockItems.filter((item) => item.quantity < item.maxStock).length;
  const affordableItems = buyableItems.filter((item) => item.price <= money);
  const progress = TOTAL_STORE_COST > 0 ? Math.min(100, (spent / TOTAL_STORE_COST) * 100) : 0;

  if (catalogTotal) catalogTotal.textContent = formatMoney(TOTAL_STORE_COST);
  if (moneyBox) moneyBox.textContent = formatMoney(money);
  if (spentTotal) spentTotal.textContent = formatMoney(spent);
  if (cartTotal) cartTotal.textContent = formatMoney(spent);
  if (itemsBought) itemsBought.textContent = `${totalQuantity} total`;
  if (itemsLeft) itemsLeft.textContent = `${singleStockLeft} / ${singleStockItems.length}`;
  if (moneyProgressFill) moneyProgressFill.style.width = `${progress}%`;

  if (cartCount) {
    cartCount.textContent = `${totalQuantity} item${totalQuantity === 1 ? "" : "s"}`;
  }

  if (affordCopy) {
    if (affordableItems.length === buyableItems.length && buyableItems.length > 0) {
      const biggestFlex = affordableItems.reduce(
        (highest, item) => (item.price > highest.price ? item : highest),
        affordableItems[0]
      );
      affordCopy.textContent = `He can still afford every available item type. Biggest flex left: ${biggestFlex.name} for ${formatMoney(biggestFlex.price)}.`;
    } else if (affordableItems.length > 0) {
      const biggestAffordable = affordableItems.reduce(
        (highest, item) => (item.price > highest.price ? item : highest),
        affordableItems[0]
      );
      affordCopy.textContent = `He can still afford ${affordableItems.length} item type${affordableItems.length === 1 ? "" : "s"}. Biggest available flex: ${biggestAffordable.name}.`;
    } else if (buyableItems.length === 0) {
      affordCopy.textContent = "The rare items are gone and the repeat buys have already done their damage.";
    } else {
      affordCopy.textContent = "The wallet cannot reach any item right now. Time to sell something back.";
    }
  }

  updateElonFace();
}

function renderShop() {
  if (!shopGrid) return;

  shopGrid.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "elon-item-card";
    card.style.setProperty("--item-accent", item.accent);
    card.style.setProperty("--item-soft", item.soft);
    card.style.setProperty("--item-deep", item.deep);

    const canAfford = money >= item.price;
    const atMaxStock = item.quantity >= item.maxStock;
    const isSingleStock = item.maxStock === 1;
    const affordLabel = atMaxStock
      ? "Sold Out"
      : canAfford
        ? "Can Elon afford this? Yes"
        : "Can Elon afford this? Not now";
    const affordClass = atMaxStock ? "is-sold" : canAfford ? "is-yes" : "is-no";
    card.innerHTML = `
      <div class="elon-item-media">
        <span class="elon-item-emoji" aria-hidden="true">${item.icon}</span>
        ${isSingleStock ? '<span class="elon-item-badge">Single Stock</span>' : ""}
      </div>
      <div class="elon-item-body">
        <div class="elon-item-head">
          <h3>${item.name}</h3>
          <span class="elon-item-afford ${affordClass}">
            ${affordLabel}
          </span>
        </div>
        <p>${item.description}</p>
        <div class="elon-item-price-row">
          <strong class="elon-item-price">${formatMoney(item.price)}</strong>
          <span class="elon-item-joke">${item.joke}</span>
        </div>
        <div class="elon-item-controls">
          <button class="elon-control-button is-sell" type="button" data-item-sell="${item.key}" ${item.quantity > 0 ? "" : "disabled"}>
            Sell
          </button>
          <span class="elon-item-qty" aria-label="${item.name} amount">${item.quantity}</span>
          <button class="elon-control-button is-buy" type="button" data-item-buy="${item.key}" ${!canAfford || atMaxStock ? "disabled" : ""}>
            Buy
          </button>
        </div>
      </div>
    `;

    const sellButton = card.querySelector("[data-item-sell]");
    const buyButton = card.querySelector("[data-item-buy]");
    if (sellButton) {
      sellButton.addEventListener("click", () => sellItem(item.key));
    }
    if (buyButton) {
      buyButton.addEventListener("click", () => buyItem(item.key));
    }

    shopGrid.appendChild(card);
  });
}

function renderCart() {
  if (!cartList || !cartEmpty) return;

  const purchased = getPurchasedItems();
  cartList.innerHTML = "";

  if (purchased.length === 0) {
    cartEmpty.hidden = false;
    cartList.hidden = true;
    return;
  }

  cartEmpty.hidden = true;
  cartList.hidden = false;

  purchased.forEach((item) => {
    const row = document.createElement("li");
    row.className = "elon-cart-item";
    row.innerHTML = `
      <span class="elon-cart-item-icon" aria-hidden="true">${item.icon}</span>
      <div class="elon-cart-item-copy">
        <strong>${item.name}</strong>
        <span>${item.quantity} x ${formatMoney(item.price)}</span>
      </div>
      <div class="elon-cart-item-price">${formatMoney(item.quantity * item.price)}</div>
    `;
    cartList.appendChild(row);
  });
}

function renderState() {
  renderShop();
  renderCart();
  updateDashboard();
  setStatusMessage(statusMessage);
  syncCartPanelPosition(true);
}

function buyItem(itemKey) {
  const item = items.find((entry) => entry.key === itemKey);
  if (!item) return;

  if (item.quantity >= item.maxStock) {
    setStatusMessage(`${item.name} is single-stock and already sold out.`);
    saveElonState();
    updateDashboard();
    return;
  }

  if (money < item.price) {
    setStatusMessage("Even Elon cannot afford that one right now.");
    saveElonState();
    updateDashboard();
    return;
  }

  money -= item.price;
  item.quantity += 1;

  if (item.maxStock === 1 && item.quantity === item.maxStock) {
    setStatusMessage(`${item.name} claimed. That single-stock flex is gone now.`);
  } else {
    setStatusMessage(`${item.name} added. You now own ${item.quantity}.`);
  }

  recordGameHistory({
    game: "Spend Elon Money",
    action: "Purchased",
    details: `Item: ${item.name} | Price: ${formatMoney(item.price)} | Wallet Left: ${formatMoney(money)}`,
  });

  saveElonState();
  renderState();
}

function sellItem(itemKey) {
  const item = items.find((entry) => entry.key === itemKey);
  if (!item) return;

  if (item.quantity <= 0) {
    setStatusMessage(`No ${item.name} to sell yet.`);
    saveElonState();
    updateDashboard();
    return;
  }

  item.quantity -= 1;
  money += item.price;
  setStatusMessage(`${item.name} sold. ${item.quantity > 0 ? `You still own ${item.quantity}.` : "Back to zero."}`);
  saveElonState();
  renderState();
}

function goToTop() {
  const prefersReducedMotion = document.body.classList.contains("reduce-motion");
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

function setCartPanelOffset(offset) {
  cartPanelCurrentOffset = offset;
  document.documentElement.style.setProperty("--elon-panel-offset", `${offset}px`);
}

function getCartPanelTargetOffset() {
  if (!shopLayout || !cartPanel) return;

  const desktopLayout = window.matchMedia("(min-width: 1261px)").matches;
  if (!desktopLayout) {
    return 0;
  }

  const headerHeight = header ? header.offsetHeight : 0;
  const layoutTop = shopLayout.getBoundingClientRect().top + window.scrollY;
  const startScroll = Math.max(0, layoutTop - headerHeight - 20);
  const maxOffset = Math.max(0, shopLayout.offsetHeight - cartPanel.offsetHeight);
  return Math.min(maxOffset, Math.max(0, window.scrollY - startScroll));
}

function animateCartPanelOffset() {
  cartPanelAnimationId = 0;

  const reduceMotion = document.body.classList.contains("reduce-motion");
  if (reduceMotion) {
    setCartPanelOffset(cartPanelTargetOffset);
    return;
  }

  const delta = cartPanelTargetOffset - cartPanelCurrentOffset;
  if (Math.abs(delta) < 0.5) {
    setCartPanelOffset(cartPanelTargetOffset);
    return;
  }

  setCartPanelOffset(cartPanelCurrentOffset + delta * 0.18);
  cartPanelAnimationId = window.requestAnimationFrame(animateCartPanelOffset);
}

function syncCartPanelPosition(force = false) {
  const nextOffset = getCartPanelTargetOffset() || 0;
  cartPanelTargetOffset = nextOffset;

  if (force) {
    if (cartPanelAnimationId) {
      window.cancelAnimationFrame(cartPanelAnimationId);
      cartPanelAnimationId = 0;
    }
    setCartPanelOffset(nextOffset);
    return;
  }

  if (!cartPanelAnimationId) {
    cartPanelAnimationId = window.requestAnimationFrame(animateCartPanelOffset);
  }
}

function requestCartPanelSync(force = false) {
  if (cartPanelTicking && !force) return;
  cartPanelTicking = true;
  window.requestAnimationFrame(() => {
    syncCartPanelPosition(force);
    cartPanelTicking = false;
  });
}

if (backToTopButton) {
  const toggleBackToTop = () => {
    backToTopButton.classList.toggle("visible", window.scrollY > 220);
  };

  backToTopButton.addEventListener("click", goToTop);
  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();
}

window.addEventListener(
  "scroll",
  () => {
    requestCartPanelSync();
  },
  { passive: true }
);
window.addEventListener("resize", () => requestCartPanelSync(true));

window.addEventListener("storage", (event) => {
  if (event.key !== ELON_STORAGE_KEY) return;
  applyElonState(loadElonState());
  renderState();
});

applyElonState(loadElonState());
renderState();
saveElonState();
})();

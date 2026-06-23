// ============================================================
//  order.js — DRIPSTORE
//  Handles: Products, Cart, Order ID, bKash flow, Telegram
// ============================================================

// ─── TELEGRAM CONFIG ────────────────────────────────────────
// ⚠️ Replace with your actual Bot Token and Chat ID
const TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN_HERE";
const TELEGRAM_CHAT_ID   = "YOUR_CHAT_ID_HERE";
// ────────────────────────────────────────────────────────────

// ─── PRODUCT DATA ───────────────────────────────────────────
const TSHIRTS = [
  { id: "ts1", name: "Classic Black Tee",    price: 650, img: "tshirt1.png", desc: "A timeless black tee with a relaxed fit. Made from 100% premium cotton for all-day comfort." },
  { id: "ts2", name: "Oversized White Drop", price: 700, img: "tshirt2.png", desc: "Clean oversized silhouette with dropped shoulders. The everyday staple you didn't know you needed." },
  { id: "ts3", name: "Urban Graphic Print",  price: 750, img: "tshirt3.png", desc: "Bold street-art inspired graphics printed on heavyweight cotton. Stand out in the crowd." },
  { id: "ts4", name: "Acid Wash Vintage",    price: 750, img: "tshirt4.png", desc: "Retro acid-wash treatment for a lived-in look. Each piece is unique." },
  { id: "ts5", name: "Minimalist Logo Tee",  price: 680, img: "tshirt5.png", desc: "Subtle Matrix Hub logo embroidered on the chest. Less is more." },
];

const JERSEYS = [
  { id: "jr1", name: "Classic Sports Jersey",   price: 950,  img: "jersey1.png" },
  { id: "jr2", name: "Retro Away Kit",          price: 1050, img: "jersey2.png" },
  { id: "jr3", name: "Premium Home Jersey",     price: 1100, img: "jersey3.png" },
  { id: "jr4", name: "Street Edition Jersey",   price: 980,  img: "jersey4.png" },
  { id: "jr5", name: "Collector's Kit",         price: 1200, img: "jersey5.png" },
];

// ─── STATE ──────────────────────────────────────────────────
let cart = []; // { id, name, price, type }

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderProducts("tshirt-grid", TSHIRTS, "T-Shirt");
  renderProducts("jersey-grid", JERSEYS, "Jersey");

  // Pick up any items added from the product detail page
  const pending = JSON.parse(sessionStorage.getItem("pendingCart") || "[]");
  if (pending.length > 0) {
    pending.forEach(p => {
      cart.push({ uid: Date.now() + Math.random(), id: p.id, name: p.name, price: p.price, type: p.type || "T-Shirt" });
    });
    sessionStorage.removeItem("pendingCart");
    updateCartUI();
  }
});

// ─── RENDER PRODUCTS ────────────────────────────────────────
function renderProducts(gridId, products, type) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = "";
  products.forEach(p => {
    const isTshirt = type === "T-Shirt";
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-img-wrap" ${isTshirt ? `onclick="window.location='product.html?id=${p.id}'"` : ""} style="${isTshirt ? 'cursor:pointer' : ''}">
        <img src="${p.img}" alt="${p.name}"
          onerror="this.parentElement.innerHTML='<div class=&quot;img-placeholder&quot;>👕</div>'"/>
      </div>
      <div class="product-info">
        <span class="product-type-tag">${type}</span>
        <div class="product-name">${isTshirt ? `<a href="product.html?id=${p.id}" class="product-name-link">${p.name}</a>` : p.name}</div>
        <div class="product-price">৳${p.price.toLocaleString()}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${isTshirt ? `<a href="product.html?id=${p.id}" class="view-btn">View Details</a>` : ""}
          <button class="add-to-cart-btn" id="btn-${p.id}" onclick="addToCart('${p.id}', '${escapeQuotes(p.name)}', ${p.price}, '${type}')">
            + Add to Cart
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ─── CART FUNCTIONS ──────────────────────────────────────────
function addToCart(id, name, price, type) {
  // Allow multiple of same item
  const cartItem = { uid: Date.now() + Math.random(), id, name, price, type };
  cart.push(cartItem);

  // Flash button
  const btn = document.getElementById("btn-" + id);
  if (btn) {
    btn.textContent = "✓ Added!";
    btn.classList.add("added");
    setTimeout(() => {
      btn.textContent = "+ Add to Cart";
      btn.classList.remove("added");
    }, 1200);
  }

  updateCartUI();
  renderSidebarCart();
}

function removeFromCart(uid) {
  cart = cart.filter(item => item.uid !== uid);
  updateCartUI();
  renderSidebarCart();
}

function updateCartUI() {
  const count    = cart.length;
  const total    = cart.reduce((s, i) => s + i.price, 0);

  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-total").textContent  = "৳" + total.toLocaleString();
  document.getElementById("sidebar-total").textContent = "৳" + total.toLocaleString();

  // Order section cart
  const listEl = document.getElementById("cart-items-list");
  if (count === 0) {
    listEl.innerHTML = '<p class="empty-cart">No items in cart yet.</p>';
  } else {
    listEl.innerHTML = cart.map(item => `
      <div class="cart-item-row">
        <span class="cart-item-name">${item.name} <small style="color:var(--muted)">(${item.type})</small></span>
        <span class="cart-item-price">৳${item.price.toLocaleString()}</span>
        <button class="remove-item" onclick="removeFromCart(${item.uid})">✕</button>
      </div>
    `).join("");
  }
}

function renderSidebarCart() {
  const el = document.getElementById("sidebar-cart-items");
  if (cart.length === 0) {
    el.innerHTML = '<p class="empty-cart" style="padding:16px 0;color:var(--muted)">Cart is empty.</p>';
    return;
  }
  el.innerHTML = cart.map(item => `
    <div class="cart-item-row">
      <span class="cart-item-name">${item.name}</span>
      <span class="cart-item-price">৳${item.price.toLocaleString()}</span>
      <button class="remove-item" onclick="removeFromCart(${item.uid})">✕</button>
    </div>
  `).join("");
}

// ─── CART SIDEBAR OPEN/CLOSE ─────────────────────────────────
function openCart() {
  renderSidebarCart();
  document.getElementById("cart-sidebar").classList.add("open");
  document.getElementById("cart-overlay").classList.add("active");
}
function closeCart() {
  document.getElementById("cart-sidebar").classList.remove("open");
  document.getElementById("cart-overlay").classList.remove("active");
}

// ─── ORDER ID GENERATOR ──────────────────────────────────────
function generateOrderId() {
  const prefix = "MH";
  const ts     = Date.now().toString(36).toUpperCase();
  const rand   = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

// ─── PLACE ORDER ─────────────────────────────────────────────
async function placeOrder() {
  const name    = document.getElementById("customer-name").value.trim();
  const phone   = document.getElementById("customer-phone").value.trim();
  const address = document.getElementById("customer-address").value.trim();
  const size    = document.getElementById("customer-size").value;
  const trxId   = document.getElementById("trx-id").value.trim();
  const trxAmt  = document.getElementById("trx-amount").value.trim();

  // Validation
  if (!name || !phone || !address || !size) {
    showAlert("Please fill in all your details (name, phone, address, size)."); return;
  }
  if (cart.length === 0) {
    showAlert("Your cart is empty! Please add at least one product."); return;
  }
  if (!trxId || !trxAmt) {
    showAlert("Please enter your bKash Transaction ID and Amount."); return;
  }

  const orderId  = generateOrderId();
  const total    = cart.reduce((s, i) => s + i.price, 0);
  const itemList = cart.map((i, idx) => `  ${idx + 1}. ${i.name} (${i.type}) — ৳${i.price.toLocaleString()}`).join("\n");

  // Build Telegram message
  const message = `
🛍️ *NEW ORDER — MATRIX HUB*

🆔 *Order ID:* \`${orderId}\`
👤 *Name:* ${name}
📞 *Phone:* ${phone}
🏠 *Address:* ${address}
📏 *Size:* ${size}

📦 *Items:*
${itemList}

💰 *Order Total:* ৳${total.toLocaleString()}

💳 *bKash TrxID:* \`${trxId}\`
💵 *Amount Sent:* ৳${trxAmt}

🕐 *Time:* ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}
  `.trim();

  // Send to Telegram
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram error:", data);
      // Still show success to customer — log issue on your end
    }
  } catch (err) {
    console.error("Failed to send Telegram notification:", err);
  }

  // Show success modal
  document.getElementById("modal-order-id").textContent = `Order ID: ${orderId}`;
  document.getElementById("success-modal").classList.add("active");

  // Reset
  cart = [];
  updateCartUI();
  document.getElementById("order-form").reset();
}

// ─── MODAL ───────────────────────────────────────────────────
function closeModal() {
  document.getElementById("success-modal").classList.remove("active");
}

// ─── SIMPLE ALERT (replaces browser alert) ──────────────────
function showAlert(msg) {
  const existing = document.getElementById("drip-alert");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.id = "drip-alert";
  el.style.cssText = `
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:#E63946; color:#fff; padding:14px 28px;
    border-radius:8px; font-weight:700; font-size:0.9rem;
    z-index:9999; box-shadow:0 4px 24px rgba(0,0,0,0.4);
    animation: slideUp 0.3s ease;
  `;
  el.textContent = "⚠ " + msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

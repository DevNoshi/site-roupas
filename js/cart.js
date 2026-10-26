const WHATSAPP = "5511999999999"; // troque pelo número da loja (DDI+DDD+número)
const IMG = "imagens-atualizadas/";
const ROUPA = ["M", "G", "GG"], UNICO = ["Único"];

// Para adicionar/editar produtos, mexa só aqui: [id, nome, preço, imagem, categoria, tamanhos]
const PRODUCTS = [
  ["001", "Moletom Branco Masculino", 199.9, "moleton1-branco.png", "Agasalhos", ROUPA],
  ["002", "Moletom Cinza Masculino", 100, "moleton1-cinza.png", "Agasalhos", ROUPA],
  ["003", "Calça de Moletom", 100, "calcamoleton1-preta.png", "Calças", ROUPA],
  ["004", "Bermuda Oakley Masculina", 99.9, "bermuda1-oakley.png", "Bermudas", ROUPA],
  ["005", "Bermuda Oakley Masculina", 99.9, "bermuda2-oakley.png", "Bermudas", ROUPA],
  ["006", "Bermuda Oakley Masculina", 99.9, "bermuda3-oakley.png", "Bermudas", ROUPA],
  ["007", "Bermuda Oakley Masculina", 99.9, "bermuda4-oakley.png", "Bermudas", ROUPA],
  ["008", "Camiseta Branca Masculina", 79.9, "camiseta1-branca.png", "Camisetas", ROUPA],
  ["009", "Camiseta Marrom Masculina", 69.9, "camiseta2-marrom.png", "Camisetas", ROUPA],
  ["010", "Camiseta QuickSilver Masculina", 79.9, "camiseta3-quick.png", "Camisetas", ROUPA],
  ["011", "Camiseta QuickSilver Masculina", 79.9, "camiseta4-quick.png", "Camisetas", ROUPA],
  ["012", "Boné Oakley", 119.9, "bone1-oakley.png", "Acessórios", UNICO],
  ["013", "Moletom Nike Masculino", 139.9, "moletonnike1.png", "Agasalhos", ROUPA],
  ["014", "Toca Supreme", 69.9, "toca1-azul.png", "Acessórios", UNICO],
  ["015", "Blusa Parka Supreme", 1299.9, "blusa2-parka.png", "Agasalhos", ROUPA], // confira o preço
].map(([id, title, price, img, cat, sizes]) => ({ id, title, price, img: IMG + img, cat, sizes }));

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const brl = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const prod = id => PRODUCTS.find(p => p.id === id);

/* ---------- carrinho ---------- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem("noshi-cart")) || []; } catch { cart = []; }
cart = cart.filter(i => prod(i.id));

const total = () => cart.reduce((s, i) => s + prod(i.id).price * i.qty, 0);

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2000);
}

function save() {
  try { localStorage.setItem("noshi-cart", JSON.stringify(cart)); } catch {}
  render();
}

function add(id, size) {
  const it = cart.find(i => i.id === id && i.size === size);
  it ? it.qty++ : cart.push({ id, size, qty: 1 });
  save();
}

function change(id, size, d) {
  const it = cart.find(i => i.id === id && i.size === size);
  if (!it) return;
  it.qty += d;
  if (it.qty < 1) cart = cart.filter(i => i !== it);
  save();
}

function line(i) {
  const p = prod(i.id);
  return `<div class="line" data-id="${i.id}" data-size="${i.size}">
    <img src="${p.img}" alt="${p.title}" />
    <div>
      <p class="t">${p.title}</p>
      <p class="m">${i.size === "Único" ? "Tamanho único" : "Tam. " + i.size} · ${brl(p.price)}</p>
      <div class="qty">
        <button data-a="dec" aria-label="Diminuir">−</button><span>${i.qty}</span><button data-a="inc" aria-label="Aumentar">+</button>
      </div>
    </div>
    <button class="rm" data-a="rm" aria-label="Remover ${p.title}">✕</button>
  </div>`;
}

function render() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  const count = $("#cart-count");
  if (count) count.textContent = n;
  $$(".cart-list").forEach(el => {
    el.innerHTML = cart.length ? cart.map(line).join("") : '<p class="none">Seu carrinho está vazio.</p>';
  });
  $$(".cart-total").forEach(el => (el.textContent = brl(total())));
  $$("#checkout-btn,#whatsapp-btn").forEach(b => (b.disabled = !cart.length));
  const go = $("#go-checkout");
  if (go) go.style.display = cart.length ? "" : "none";
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-a]");
  if (!b) return;
  const l = b.closest(".line");
  change(l.dataset.id, l.dataset.size, { inc: 1, dec: -1, rm: -999 }[b.dataset.a]);
});

/* ---------- gaveta do carrinho (index) ---------- */
const drawer = $("#drawer");
function toggle(open) {
  document.body.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", !open);
}
if (drawer) {
  $("#cart-open").onclick = () => toggle(true);
  $("#cart-close").onclick = $("#overlay").onclick = () => toggle(false);
  document.addEventListener("keydown", e => e.key === "Escape" && toggle(false));
}

/* ---------- vitrine (index) ---------- */
const grid = $("#grid");
if (grid) {
  const state = { cat: "Todos", q: "", sort: "" };
  const cats = ["Todos", ...new Set(PRODUCTS.map(p => p.cat))];
  $("#chips").innerHTML = cats.map(c => `<button class="chip" data-cat="${c}" aria-pressed="${c === "Todos"}">${c}</button>`).join("");

  const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  function showProducts() {
    let list = PRODUCTS.filter(p => (state.cat === "Todos" || p.cat === state.cat) && norm(p.title).includes(norm(state.q)));
    if (state.sort === "asc") list.sort((a, b) => a.price - b.price);
    if (state.sort === "desc") list.sort((a, b) => b.price - a.price);
    if (state.sort === "az") list.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    grid.innerHTML = list.length ? list.map(p => `
      <article class="card" data-id="${p.id}">
        <div class="ph"><img loading="lazy" src="${p.img}" alt="${p.title}" /></div>
        <h3>${p.title}</h3>
        <p class="price">${brl(p.price)}</p>
        <div class="sizes" role="group" aria-label="Tamanho">
          ${p.sizes.map(s => `<button type="button" class="sz${p.sizes.length === 1 ? " on" : ""}" data-size="${s}" aria-pressed="${p.sizes.length === 1}">${s}</button>`).join("")}
        </div>
        <button class="add">Adicionar ao carrinho</button>
      </article>`).join("") : '<p class="empty">Nenhuma peça encontrada. Tente outra busca ou categoria.</p>';
  }

  $("#chips").onclick = e => {
    const c = e.target.closest(".chip");
    if (!c) return;
    state.cat = c.dataset.cat;
    $$(".chip").forEach(x => x.setAttribute("aria-pressed", x === c));
    showProducts();
  };
  $("#search").oninput = e => { state.q = e.target.value; showProducts(); };
  $("#sort").onchange = e => { state.sort = e.target.value; showProducts(); };

  grid.onclick = e => {
    const card = e.target.closest(".card");
    if (!card) return;
    const sz = e.target.closest(".sz");
    if (sz) {
      $$(".sz", card).forEach(x => { x.classList.toggle("on", x === sz); x.setAttribute("aria-pressed", x === sz); });
    } else if (e.target.closest(".add")) {
      const on = $(".sz.on", card);
      if (!on) return toast("Escolha um tamanho");
      add(card.dataset.id, on.dataset.size);
      toggle(true);
    }
  };
  showProducts();
}

/* ---------- checkout ---------- */
const form = $("#checkout-form");
if (form) {
  const digits = s => s.replace(/\D/g, "");

  $("#phone").oninput = e => {
    const d = digits(e.target.value).slice(0, 11);
    e.target.value = d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
      : d.length > 2 ? d.replace(/(\d{2})(\d{0,5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "") : d;
  };

  $("#cep").oninput = async e => {
    const d = digits(e.target.value).slice(0, 8);
    e.target.value = d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
    const hint = $("#cep-hint");
    if (d.length < 8) return (hint.textContent = "");
    hint.textContent = "Buscando endereço…";
    try {
      const r = await (await fetch(`https://viacep.com.br/ws/${d}/json/`)).json();
      if (r.erro) throw 0;
      $("#address").value = [r.logradouro, r.bairro, `${r.localidade} - ${r.uf}`].filter(Boolean).join(", ") + ", nº ";
      hint.textContent = "Complete com número e complemento.";
      $("#address").focus();
    } catch {
      hint.textContent = "CEP não encontrado. Preencha o endereço manualmente.";
    }
  };

  const valid = () => form.reportValidity();
  const summary = () => {
    const d = Object.fromEntries(new FormData(form));
    const itens = cart.map(i => `• ${i.qty}x ${prod(i.id).title} (${i.size}) - ${brl(prod(i.id).price * i.qty)}`).join("\n");
    return `Olá! Quero fazer um pedido na The Clothing Noshi:\n\n${itens}\n\nTotal: ${brl(total())}\n\nNome: ${d.name}\nTelefone: ${d.phone}\nE-mail: ${d.email}\nCEP: ${d.cep}\nEndereço: ${d.address}`;
  };

  $("#whatsapp-btn").onclick = () => {
    if (!cart.length || !valid()) return;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(summary())}`, "_blank", "noopener");
  };

  form.onsubmit = e => {
    e.preventDefault();
    if (!cart.length || !valid()) return;
    // Aqui entra o envio real (API/gateway de pagamento). Por enquanto só confirma e limpa.
    cart = [];
    save();
    form.hidden = true;
    $("#done").hidden = false;
    toast("Pedido enviado");
  };
}

/* ---------- tema escuro ---------- */
function setTheme(t, persist) {
  document.documentElement.dataset.theme = t;
  $$(".theme-toggle").forEach(b => b.setAttribute("aria-checked", t === "dark"));
  if (persist) try { localStorage.setItem("noshi-theme", t); } catch {}
}
setTheme(document.documentElement.dataset.theme || "light");
$$(".theme-toggle").forEach(b => (b.onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true)));

render();

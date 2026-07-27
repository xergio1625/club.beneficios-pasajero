import { APP_CONFIG, buildWhatsAppUrl } from "./config.js";

const currencyFormatter = new Intl.NumberFormat(APP_CONFIG.locale, {
  style: "currency",
  currency: APP_CONFIG.currency,
  maximumFractionDigits: 0
});

const state = {
  products: [],
  onboardCategory: "all",
  onboardQuery: "",
  negotiatedQuery: ""
};

function formatPrice(product) {
  if (Number.isFinite(product.price)) return currencyFormatter.format(product.price);
  return product.externalListingUrl ? "Ver precio en Facebook" : "Consultar precio";
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isAllowedPaymentLink(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && APP_CONFIG.mercadoPagoHosts.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function createActionLink(label, href, className = "button button-small button-quiet") {
  const link = document.createElement("a");
  link.className = className;
  link.href = href;
  link.textContent = label;
  return link;
}

function createPaymentOptions(product) {
  const container = document.createElement("div");
  container.className = "payment-options";

  const hint = document.createElement("p");
  hint.className = "payment-hint";
  const negotiated = product.category === "used";
  hint.textContent = negotiated
    ? "Este producto requiere acordar precio, estado, pago y entrega antes de concretar la compra."
    : "Confirma disponibilidad antes de pagar.";
  container.append(hint);

  const methods = new Set(product.paymentMethods || []);
  if (product.externalListingUrl) {
    const externalListing = createActionLink("Ver publicación en Facebook", product.externalListingUrl, "button button-small button-primary");
    externalListing.target = "_blank";
    externalListing.rel = "noopener noreferrer";
    container.append(externalListing);
  }

  if (!negotiated && methods.has("mercadopago") && isAllowedPaymentLink(product.paymentLink)) {
    const mercadoPago = createActionLink("Pagar con Mercado Pago", product.paymentLink, "button button-small button-primary");
    mercadoPago.target = "_blank";
    mercadoPago.rel = "noopener noreferrer";
    container.append(mercadoPago);
  }

  if (!negotiated && methods.has("transfer")) {
    const priceDetail = Number.isFinite(product.price) ? ` (${currencyFormatter.format(product.price)})` : "";
    const message = `Hola, quiero confirmar disponibilidad de “${product.name}”${priceDetail} y solicitar los datos de transferencia.`;
    const transfer = createActionLink("Solicitar transferencia", buildWhatsAppUrl(message));
    transfer.target = "_blank";
    transfer.rel = "noopener noreferrer";
    container.append(transfer);
  }

  if (!negotiated && methods.has("cash")) {
    const cash = document.createElement("p");
    cash.className = "payment-hint";
    cash.textContent = "Efectivo a bordo disponible. Idealmente paga con el monto exacto.";
    container.append(cash);
  }

  const priceDetail = Number.isFinite(product.price) ? `, publicado en ${currencyFormatter.format(product.price)}` : "";
  const confirmMessage = negotiated
    ? `Hola, me interesa “${product.name}”${priceDetail}. Quisiera conversar sobre el precio, estado y forma de entrega.`
    : `Hola, quisiera confirmar disponibilidad de “${product.name}”${Number.isFinite(product.price) ? ` por ${currencyFormatter.format(product.price)}` : ""}.`;
  const confirm = createActionLink(negotiated ? "Negociar por WhatsApp" : "Confirmar por WhatsApp", buildWhatsAppUrl(confirmMessage), "button button-small button-dark");
  confirm.target = "_blank";
  confirm.rel = "noopener noreferrer";
  container.append(confirm);

  return container;
}

function renderProduct(product, template) {
  const card = template.content.firstElementChild.cloneNode(true);
  const image = card.querySelector(".product-image");
  const badge = card.querySelector(".availability-badge");
  const action = card.querySelector(".product-action");
  const negotiated = product.category === "used";

  image.src = product.image;
  image.alt = product.name;
  card.querySelector(".product-brand").textContent = product.brand;
  card.querySelector(".product-condition").textContent = product.condition;
  card.querySelector(".product-name").textContent = product.name;
  card.querySelector(".product-description").textContent = product.description;
  card.querySelector(".product-price").textContent = formatPrice(product);
  badge.textContent = product.available ? (negotiated ? "Disponible para negociar" : "Disponible") : "Agotado";

  if (!product.available) {
    badge.classList.add("is-unavailable");
    action.disabled = true;
    action.textContent = "No disponible";
  } else {
    const currentOptions = card.querySelector(".payment-options");
    const options = createPaymentOptions(product);
    currentOptions.replaceWith(options);
    options.hidden = true;
    action.addEventListener("click", () => {
      const willOpen = options.hidden;
      options.hidden = !willOpen;
      action.textContent = willOpen ? "Ocultar detalles" : (negotiated ? "Ver detalles" : "Ver opciones");
      action.setAttribute("aria-expanded", String(willOpen));
    });
    action.textContent = negotiated ? "Ver detalles" : "Ver opciones";
    action.setAttribute("aria-expanded", "false");
  }

  requestAnimationFrame(() => card.classList.add("is-visible"));
  return card;
}

function getVisibleProducts(view) {
  const query = view === "negotiated" ? state.negotiatedQuery : state.onboardQuery;
  return state.products.filter((product) => {
    const matchesView = view === "negotiated" ? product.category === "used" : product.category !== "used";
    const matchesCategory = view === "negotiated" || state.onboardCategory === "all" || product.category === state.onboardCategory;
    const haystack = normalize(`${product.name} ${product.brand} ${product.description} ${product.condition}`);
    return matchesView && matchesCategory && haystack.includes(query);
  });
}

function render(view) {
  const grid = document.querySelector(`[data-product-grid="${view}"]`);
  const status = document.querySelector(`[data-results-status="${view}"]`);
  const template = document.querySelector("#product-template");
  if (!grid || !status || !template) return;

  const products = getVisibleProducts(view);
  grid.replaceChildren();

  if (!products.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No encontramos productos con esos criterios. Prueba otra búsqueda o consulta por WhatsApp.";
    grid.append(empty);
  } else {
    const fragment = document.createDocumentFragment();
    products.forEach((product) => fragment.append(renderProduct(product, template)));
    grid.append(fragment);
  }

  grid.setAttribute("aria-busy", "false");
  const productLabel = products.length === 1 ? "producto" : "productos";
  status.textContent = view === "negotiated"
    ? `${products.length} ${productLabel} para negociar`
    : `${products.length} ${productLabel} disponibles a bordo`;
}

function bindControls() {
  document.querySelectorAll("[data-catalog-search]").forEach((search) => {
    search.addEventListener("input", (event) => {
      const view = event.target.dataset.catalogSearch;
      if (view === "negotiated") state.negotiatedQuery = normalize(event.target.value);
      else state.onboardQuery = normalize(event.target.value);
      render(view);
    });
  });

  const filterGroup = document.querySelector('[data-filter-group="onboard"]');
  filterGroup?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    state.onboardCategory = button.dataset.filter;
    filterGroup.querySelectorAll("[data-filter]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    render("onboard");
  });
}

export async function initCatalog() {
  bindControls();
  const grids = document.querySelectorAll("[data-product-grid]");
  const statuses = document.querySelectorAll("[data-results-status]");

  try {
    const response = await fetch("./data/catalog.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`No se pudo cargar el catálogo (${response.status})`);
    const products = await response.json();
    if (!Array.isArray(products)) throw new TypeError("El catálogo debe ser una lista");
    state.products = products;
    render("negotiated");
    render("onboard");
  } catch (error) {
    grids.forEach((grid) => {
      const message = document.createElement("p");
      message.className = "empty-state";
      message.textContent = "El catálogo no está disponible en este momento. Puedes consultar directamente por WhatsApp.";
      grid.replaceChildren(message);
      grid.setAttribute("aria-busy", "false");
    });
    statuses.forEach((status) => {
      status.textContent = "No fue posible cargar los productos";
    });
    console.error(error);
  }
}

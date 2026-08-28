import { APP_CONFIG, buildWhatsAppUrl, isPlaceholder } from "./config.js";
import { initCatalog } from "./catalog.js?v=20260726-inventory";
import { submitLead } from "./crm.js";

const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      return false;
    }
    return true;
  }
};

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

async function loadDeferredLibraries() {
  try {
    await loadScript("./assets/icons/lucide.min.js");
    refreshIcons();
    await loadScript("./assets/icons/qrcode.min.js");
    setupQrCode();
  } catch (error) {
    console.error("No se pudieron cargar los recursos visuales diferidos", error);
  }
}

function setupTheme() {
  const toggle = document.querySelector("[data-theme-toggle]");
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const initial = storage.get("club-theme") || preferred;
  document.documentElement.dataset.theme = initial;

  const updateButton = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    toggle?.setAttribute("aria-label", dark ? "Activar modo claro" : "Activar modo oscuro");
    if (toggle) toggle.innerHTML = `<i data-lucide="${dark ? "sun" : "moon"}"></i>`;
    refreshIcons();
  };

  toggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    storage.set("club-theme", next);
    updateButton();
  });

  updateButton();
}

function setupNavigation() {
  const header = document.querySelector("[data-header]");
  const menu = document.querySelector("[data-nav-menu]");
  const toggle = document.querySelector("[data-menu-toggle]");

  const closeMenu = () => {
    menu?.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Abrir menú");
  };

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  toggle?.addEventListener("click", () => {
    const open = !menu?.classList.contains("is-open");
    menu?.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });

  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function setupReveal() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsObserver = "IntersectionObserver" in window;

  const prepareElement = (element) => {
    if (element.dataset.revealReady) return;
    element.dataset.revealReady = "true";

    if (element.matches(".service-layout")) {
      element.dataset.reveal = element.classList.contains("service-layout-reverse") ? "right" : "left";
    } else if (element.matches(".section-heading")) {
      element.dataset.reveal = "heading";
    } else if (element.matches(".quick-link, .product-card")) {
      element.dataset.reveal = "card";
      const siblings = [...element.parentElement.children].filter((item) => item.matches(".quick-link, .product-card"));
      element.style.setProperty("--reveal-delay", `${Math.min(siblings.indexOf(element) * 70, 280)}ms`);
    }
  };

  const revealImmediately = (element) => {
    prepareElement(element);
    element.classList.add("is-visible");
  };

  if (reducedMotion || !supportsObserver) {
    document.querySelectorAll(".reveal:not(.is-visible)").forEach(revealImmediately);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

  const observeElement = (element) => {
    if (element.classList.contains("is-visible")) return;
    prepareElement(element);
    observer.observe(element);
  };

  document.querySelectorAll(".reveal:not(.is-visible)").forEach(observeElement);

  const dynamicContentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches(".reveal")) observeElement(node);
        node.querySelectorAll?.(".reveal").forEach(observeElement);
      });
    });
  });

  dynamicContentObserver.observe(document.body, { childList: true, subtree: true });
}

function setupExternalLinks() {
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    const key = link.dataset.whatsapp;
    link.href = buildWhatsAppUrl(APP_CONFIG.messages[key] || APP_CONFIG.messages.general);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    if (isPlaceholder(APP_CONFIG.whatsappNumber)) link.title = "Configura el número de WhatsApp en js/config.js";
  });

  document.querySelectorAll("[data-email-link]").forEach((link) => {
    link.href = `mailto:${APP_CONFIG.email}`;
  });

  document.querySelectorAll("[data-social-link]").forEach((link) => {
    link.href = APP_CONFIG.social[link.dataset.socialLink] || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  document.querySelectorAll("[data-ebc-link]").forEach((link) => {
    if (!APP_CONFIG.ebcPartnerUrl) {
      link.setAttribute("aria-disabled", "true");
      link.title = "Enlace oficial pendiente de configuración";
      link.addEventListener("click", (event) => event.preventDefault());
      return;
    }
    link.href = APP_CONFIG.ebcPartnerUrl;
    link.target = "_blank";
    link.rel = "sponsored noopener noreferrer";
  });
}

function setupDialogs() {
  const welcomeDialog = document.querySelector("#welcome-dialog");
  const leadDialog = document.querySelector("#lead-dialog");
  const privacyDialog = document.querySelector("#privacy-dialog");
  const leadForm = document.querySelector("#lead-form");
  let activeTrigger = null;

  const openDialog = (dialog, trigger) => {
    if (!dialog) return;
    activeTrigger = trigger || document.activeElement;
    dialog.showModal();
    document.body.classList.add("is-locked");
  };

  const closeDialog = (dialog) => {
    if (!dialog?.open) return;
    dialog.close();
    document.body.classList.remove("is-locked");
    activeTrigger?.focus?.();
  };

  document.querySelectorAll(".modal").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener("close", () => document.body.classList.remove("is-locked"));
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(dialog));
    });
  });

  const setLeadMode = (mode) => {
    if (!leadForm || !leadDialog) return;
    const finance = mode === "finance";
    leadForm.reset();
    leadForm.elements.leadType.value = finance ? "finance" : "gift";
    leadDialog.querySelector("[data-lead-eyebrow]").textContent = finance ? "Educación financiera" : "Plantilla gratuita";
    leadDialog.querySelector("[data-lead-title]").textContent = finance ? "Recibe Segundo ingreso con método" : "Recibe tu planilla de ingresos y gastos";
    leadDialog.querySelector("[data-lead-description]").textContent = finance
      ? "Ordena tus finanzas, compara alternativas y comprende los riesgos. Nombre y WhatsApp son obligatorios; el correo es opcional."
      : "Descarga la planilla directamente. Si quieres, deja tus datos opcionales más abajo para recibir seguimiento.";
    leadDialog.querySelector("[data-submit-label]").textContent = finance ? "Recibir guía gratuita" : "Descargar planilla";
    const emailField = leadDialog.querySelector("[data-email-field]");
    emailField.querySelector("span").textContent = finance ? "Correo electrónico (opcional)" : "Correo electrónico (opcional)";
    emailField.querySelector("input").required = false;
    const followupField = leadDialog.querySelector(".followup-consent");
    followupField.hidden = !finance;
    const financialField = leadDialog.querySelector(".financial-consent");
    financialField.hidden = !finance;
    financialField.querySelector("input").required = finance;
    const generalConsent = leadForm.querySelector("input[name='generalConsent']");
    if (generalConsent) generalConsent.required = false;
    const status = leadDialog.querySelector("[data-form-status]");
    status.textContent = "";
    status.className = "form-status";
  };

  document.querySelectorAll("[data-open-gift]").forEach((button) => {
    button.addEventListener("click", () => {
      setLeadMode("gift");
      openDialog(leadDialog, button);
    });
  });

  document.querySelector("[data-open-finance]")?.addEventListener("click", (event) => {
    setLeadMode("finance");
    openDialog(leadDialog, event.currentTarget);
  });

  document.querySelector("[data-open-privacy]")?.addEventListener("click", (event) => openDialog(privacyDialog, event.currentTarget));

  document.querySelector("[data-welcome-gift]")?.addEventListener("click", (event) => {
    closeDialog(welcomeDialog);
    setLeadMode("gift");
    openDialog(leadDialog, event.currentTarget);
  });

  if (!storage.get("club-welcome-seen")) {
    window.setTimeout(() => {
      storage.set("club-welcome-seen", "true");
      openDialog(welcomeDialog, null);
    }, 900);
  }

  leadForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(leadForm);
    const leadType = formData.get("leadType");
    const status = leadForm.querySelector("[data-form-status]");
    const submitButton = leadForm.querySelector("button[type='submit']");
    const triggerGiftDownload = () => {
      const download = document.createElement("a");
      download.href = "./Presupuesto mensual.xlsm";
      download.download = "Presupuesto mensual.xlsm";
      document.body.append(download);
      download.click();
      download.remove();
    };

    if (leadType === "gift") {
      const data = {
        leadType,
        firstname: String(formData.get("firstname") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        generalConsent: formData.get("generalConsent") === "on",
        followupConsent: formData.get("followupConsent") === "on",
        financialConsent: formData.get("financialConsent") === "on"
      };
      const hasOptionalData = Boolean(data.firstname || data.phone || data.email);
      status.className = "form-status";
      status.textContent = "Preparando la descarga…";
      submitButton.disabled = true;

      try {
        if (hasOptionalData && data.generalConsent) {
          await submitLead(data);
        }
        status.classList.add("is-success");
        status.textContent = data.firstname || data.phone || data.email
          ? "Tu planilla comenzará a descargarse. Gracias por dejar tus datos opcionales."
          : "Tu planilla comenzará a descargarse.";
        triggerGiftDownload();
        leadForm.reset();
      } catch (error) {
        console.error(error);
        status.classList.add("is-error");
        status.textContent = "La descarga comenzará de todas formas. Si quieres, puedes seguir por WhatsApp.";
        triggerGiftDownload();
      } finally {
        submitButton.disabled = false;
      }
      return;
    }

    if (!leadForm.reportValidity()) return;

    let phone = String(formData.get("phone") || "").trim();
    const phoneInput = leadForm.elements.phone;
    const phoneDigits = phone.replace(/\D/g, "");
    const normalizedPhone = phoneDigits.startsWith("56") ? phoneDigits : `56${phoneDigits}`;
    if (!/^569\d{8}$/.test(normalizedPhone)) {
      phoneInput.setAttribute("aria-invalid", "true");
      phoneInput.setCustomValidity("Ingresa un WhatsApp chileno válido, por ejemplo +56 9 1234 5678.");
      phoneInput.reportValidity();
      phoneInput.addEventListener("input", () => {
        phoneInput.removeAttribute("aria-invalid");
        phoneInput.setCustomValidity("");
      }, { once: true });
      return;
    }
    phone = `+${normalizedPhone}`;

    const data = {
      leadType,
      firstname: String(formData.get("firstname") || "").trim(),
      phone,
      email: String(formData.get("email") || "").trim(),
      generalConsent: formData.get("generalConsent") === "on",
      followupConsent: formData.get("followupConsent") === "on",
      financialConsent: formData.get("financialConsent") === "on"
    };
    status.className = "form-status";
    status.textContent = "Enviando tu solicitud…";
    submitButton.disabled = true;

    try {
      const result = await submitLead(data);
      if (result.ok) {
        status.classList.add("is-success");
        status.textContent = "Solicitud recibida. Tu guía está lista.";
        const guideLink = document.createElement("a");
        guideLink.href = "./assets/documents/guia-segundo-ingreso.html";
        guideLink.target = "_blank";
        guideLink.rel = "noopener";
        guideLink.className = "text-link";
        guideLink.textContent = "Abrir la guía";
        status.append(document.createElement("br"), guideLink);
        leadForm.reset();
      } else {
        status.classList.add("is-error");
        status.textContent = "HubSpot aún no está configurado. Continúa por WhatsApp para solicitar la guía.";
        const message = `Hola, soy ${data.firstname}. Quiero solicitar la guía Segundo ingreso con método.`;
        const fallback = document.createElement("a");
        fallback.href = buildWhatsAppUrl(message);
        fallback.target = "_blank";
        fallback.rel = "noopener noreferrer";
        fallback.className = "text-link";
        fallback.textContent = "Continuar por WhatsApp";
        status.append(document.createElement("br"), fallback);
      }
    } catch (error) {
      status.classList.add("is-error");
      status.textContent = "No pudimos conectar con HubSpot. Tus datos no se guardaron; intenta nuevamente o usa WhatsApp.";
      console.error(error);
    } finally {
      submitButton.disabled = false;
    }
  });
}

function setupVisitCounter() {
  const previous = Number.parseInt(storage.get("club-visit-count") || "0", 10);
  const count = Number.isFinite(previous) ? previous + 1 : 1;
  storage.set("club-visit-count", String(count));
  document.querySelectorAll("[data-visit-count]").forEach((element) => {
    element.textContent = String(count);
  });
}

function setupQrCode() {
  const container = document.querySelector("#qr-code");
  if (!container || !window.QRCode) return;
  const target = isPlaceholder(APP_CONFIG.publicUrl) ? window.location.href : APP_CONFIG.publicUrl;
  new window.QRCode(container, {
    text: target,
    width: 100,
    height: 100,
    colorDark: "#10231f",
    colorLight: "#ffffff",
    correctLevel: window.QRCode.CorrectLevel.M
  });
}

async function init() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
  setupTheme();
  setupNavigation();
  setupExternalLinks();
  setupDialogs();
  setupVisitCounter();
  setupReveal();
  await initCatalog();
  const scheduleLibraries = () => window.setTimeout(loadDeferredLibraries, 500);
  if (document.readyState === "complete") scheduleLibraries();
  else window.addEventListener("load", scheduleLibraries, { once: true });
}

init();
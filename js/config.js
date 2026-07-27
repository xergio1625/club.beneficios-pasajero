export const APP_CONFIG = Object.freeze({
  locale: "es-CL",
  currency: "CLP",
  publicUrl: "https://xergio1625.github.io/club.beneficios-pasajero/",
  whatsappNumber: "+56991495704",
  email: "xergio.1625@gmail.com",
  social: {
    instagram: "https://instagram.com/TU_USUARIO",
    linkedin: "www.linkedin.com/in/sergio-inostroza-riffo-409964123"
  },
  ebcPartnerUrl: "https://client.ebccrm.com/signup?linkCode=D2953963-a07",
  hubspot: {
    portalId: "49682748",
    forms: {
      gift: "1d9384b2-9f63-4e39-b6ef-0f3906705381",
      finance: "546bd2ed-18a3-4221-9fdc-930b8815942c",
      service: "29124d0a-05a0-41f5-af19-e4b6951c5dba"
    },
    fields: {
      firstname: "firstname",
      phone: "hs_whatsapp_phone_number",
      email: "email",
      message: "message"
    },
    customPropertiesEnabled: true,
    properties: {
      interest: "club_interest",
      qrSource: "club_qr_source",
      campaign: "club_campaign",
      leadMagnet: "club_lead_magnet",
      followupConsent: "club_followup_consent",
      financialConsent: "club_financial_consent"
    }
  },
  mercadoPagoHosts: [
    "mpago.la",
    "mercadopago.cl",
    "www.mercadopago.cl",
    "link.mercadopago.com"
  ],
  messages: {
    general: "Hola, conocí el Club de Beneficios durante mi viaje y quisiera más información.",
    vigahome: "Hola, quisiera solicitar información sobre una evaluación de agua con VigaHome.",
    smartsoft: "Hola, vi la landing mediante el QR y quisiera cotizar una página, aplicación web o proyecto de software similar.",
    "mundo-creativo": "Hola, quisiera conocer el catálogo de Mundo Creativo.",
    "mobile-shield": "Hola, quisiera consultar compatibilidad de carcasa o hidrogel para mi teléfono.",
    "uber-landing": "Hola, me inscribí en Uber Driver con tu enlace de referido y quisiera solicitar una landing personalizada a mi nombre."
  }
});

export function buildWhatsAppUrl(message) {
  const number = APP_CONFIG.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function isPlaceholder(value) {
  return !value || /TU_|ejemplo|00000000/i.test(value);
}

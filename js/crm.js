import { APP_CONFIG } from "./config.js";

function getAttribution() {
  const params = new URLSearchParams(window.location.search);
  return {
    qrSource: params.get("source") || params.get("utm_source") || "direct",
    campaign: params.get("campaign") || params.get("utm_campaign") || "onboard-club",
    medium: params.get("utm_medium") || "qr"
  };
}

function getFormGuid(leadType) {
  if (leadType === "finance") return APP_CONFIG.hubspot.forms.finance;
  if (leadType === "service") return APP_CONFIG.hubspot.forms.service;
  return APP_CONFIG.hubspot.forms.gift;
}

function buildMessage(data, attribution) {
  const details = [
    `Interés: ${data.leadType}`,
    `Origen QR: ${attribution.qrSource}`,
    `Campaña: ${attribution.campaign}`,
    `Medio: ${attribution.medium}`,
    `Consentimiento financiero: ${data.financialConsent ? "Sí" : "No"}`
  ];
  if (data.leadType === "finance") details.push(`Seguimiento educativo: ${data.followupConsent ? "Sí" : "No"}`);
  return details.join(" | ");
}

function buildFields(data, attribution) {
  const standardFields = APP_CONFIG.hubspot.fields;
  const fields = [
    { name: standardFields.firstname, value: data.firstname },
    { name: standardFields.phone, value: data.phone },
    { name: standardFields.message, value: buildMessage(data, attribution) }
  ];

  if (data.email) fields.push({ name: standardFields.email, value: data.email });

  if (APP_CONFIG.hubspot.customPropertiesEnabled) {
    const properties = APP_CONFIG.hubspot.properties;
    fields.push(
      { name: properties.interest, value: data.leadType },
      { name: properties.qrSource, value: attribution.qrSource },
      { name: properties.campaign, value: attribution.campaign },
      { name: properties.financialConsent, value: data.financialConsent ? "true" : "false" }
    );
    if (data.leadType === "finance") {
      fields.push(
        { name: properties.leadMagnet, value: "guia-segundo-ingreso" },
        { name: properties.followupConsent, value: data.followupConsent ? "true" : "false" }
      );
    }
  }

  return fields;
}

export function isHubSpotConfigured(leadType) {
  return Boolean(APP_CONFIG.hubspot.portalId && getFormGuid(leadType));
}

export async function submitLead(data) {
  const formGuid = getFormGuid(data.leadType);
  if (!APP_CONFIG.hubspot.portalId || !formGuid) {
    return { ok: false, configured: false };
  }

  const attribution = getAttribution();
  const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(APP_CONFIG.hubspot.portalId)}/${encodeURIComponent(formGuid)}`;
  const payload = {
    submittedAt: Date.now(),
    fields: buildFields(data, attribution),
    context: {
      pageUri: window.location.href,
      pageName: document.title
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = new Error(`HubSpot respondió con estado ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return { ok: true, configured: true };
}
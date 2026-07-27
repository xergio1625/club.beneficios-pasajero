# Club de Beneficios del Pasajero

Landing estática mobile first para productos a bordo, servicios especializados, un presupuesto mensual en Excel y educación financiera. Funciona en GitHub Pages sin backend propio.

## Ejecutar localmente

No abras `index.html` directamente porque el navegador bloqueará la carga de `data/catalog.json`. Sirve la carpeta por HTTP:

```powershell
py -m http.server 8000
```

Abre `http://localhost:8000`.

## Configuración obligatoria

Edita `js/config.js` antes de publicar:

- `publicUrl`: URL definitiva de GitHub Pages.
- `whatsappNumber`: número chileno sin `+`, espacios ni guiones. Ejemplo: `56912345678`.
- `email`: correo de contacto real.
- `social`: enlaces reales de Instagram y LinkedIn.
- `ebcPartnerUrl`: enlace IB oficial y autorizado por EBC.
- `hubspot.portalId`: identificador de la cuenta de HubSpot.
- `hubspot.forms`: GUID de cada formulario.

También reemplaza `TU-USUARIO`, `TU-REPOSITORIO` y los metadatos provisionales de `index.html`, `robots.txt` y `sitemap.xml`.

## HubSpot Free

La landing usa la Forms API pública. No necesita token, Private App ni secreto en el frontend.

1. Crea tres formularios en HubSpot: presupuesto mensual, guía financiera y servicios.
2. Incluye en cada formulario los campos estándar `firstname`, `email`, `phone` y `message`.
3. Copia el Portal ID y los Form GUID a `js/config.js`.
4. Mantén `customPropertiesEnabled: false` para la primera prueba. La atribución, interés y consentimiento financiero se registrarán dentro de `message`.
5. Realiza un envío de prueba y confirma que el contacto aparece en HubSpot.
6. Crea vistas o listas guardadas para separar `gift`, `finance` y `service` usando el contenido de `message`.

HubSpot Free no se trata como si tuviera workflows de pago. El seguimiento se realiza con vistas, listas disponibles, tareas y plantillas manuales. Cuando el portal tenga propiedades personalizadas incluidas en los formularios, puedes activar `customPropertiesEnabled` y mapear sus nombres internos en `config.js`.

La API rechazará campos que no existan o no estén aceptados por el formulario. Nunca añadas tokens privados a este repositorio.

## Consentimiento y privacidad

- El formulario exige autorización para procesar la solicitud.
- El contenido financiero exige un consentimiento adicional.
- Email y teléfono no se guardan en `localStorage`.
- `localStorage` se usa únicamente para tema, contador local y bienvenida.
- Si HubSpot falla o no está configurado, los datos permanecen en memoria y se ofrece continuar voluntariamente por WhatsApp.
- Actualiza el responsable, finalidad, retención y canales de ejercicio de derechos antes de publicar.

Si habilitas el tracking code o cookies de HubSpot, implementa un gestor de consentimiento antes de cargarlos. La integración actual no instala el tracking code.

## Catálogo y pagos

Edita `data/catalog.json`. Cada producto admite:

```json
{
  "id": "identificador-unico",
  "name": "Nombre",
  "category": "snacks",
  "price": null,
  "available": true,
  "paymentMethods": ["transfer", "cash"],
  "paymentLink": ""
}
```

Categorías activas: `snacks` y `used`.

- `snacks` pertenece exclusivamente a **Compra durante tu viaje**. Actualmente contiene agua mineral con gas y pañuelos desechables.
- `used` pertenece exclusivamente a **Ventas por acuerdo**. No se entrega durante el viaje: precio, estado, forma de pago y entrega se negocian previamente.
- Las publicaciones externas pueden usar `externalListingUrl` para abrir su ficha original de Facebook Marketplace.

- Mercado Pago solo aparece con una URL HTTPS de un dominio permitido en `mercadoPagoHosts`.
- Transferencia solicita los datos por WhatsApp; no publiques datos bancarios en JSON.
- Efectivo aparece solo cuando `cash` está habilitado.
- La disponibilidad y el pago se confirman manualmente.
- GitHub Pages no puede recibir webhooks ni validar pagos automáticamente.

## EBC y contenido financiero

- Publica únicamente el enlace IB proporcionado y autorizado por EBC.
- Confirma que la entidad correspondiente puede aceptar residentes de Chile.
- Somete marca, textos, incentivos y materiales al proceso de aprobación aplicable.
- No prometas rentabilidad, señales, recuperación de pérdidas ni resultados garantizados.
- No recopiles depósitos, patrimonio, operaciones, credenciales ni documentos financieros mediante estos formularios.
- Registra comisiones en HubSpot únicamente después de conciliarlas con reportes oficiales.

## Lead magnet financiero

La sección Capital Bridge entrega **Segundo ingreso con método**. Su fuente editable está en `assets/documents/guia-segundo-ingreso.html` y se puede imprimir como PDF manteniendo tamaño A4.

En el formulario financiero, nombre y WhatsApp son obligatorios; el correo y el permiso de seguimiento educativo son opcionales. El formulario general del presupuesto mantiene correo obligatorio y un flujo de entrega independiente.

La entrega financiera usa un enlace visible después de que HubSpot confirma el contacto. Mantén una fecha y número de edición en el recurso cuando actualices su contenido. Configura el formulario `finance` de HubSpot para aceptar email vacío y crea `club_followup_consent` antes de activar propiedades personalizadas.

## Regalo general

El formulario `gift` entrega `Presupuesto mensual.xlsm`, un libro de Excel habilitado para macros. El archivo se distribuye sin modificar para conservar su proyecto VBA, formularios y automatizaciones.

El usuario debe abrirlo con Excel de escritorio. Las macros no funcionan en Excel para la web y pueden requerir **Habilitar contenido**. Recomienda habilitarlas únicamente cuando el archivo provenga de esta landing y el usuario confíe en su origen.

HubSpot registra esta solicitud en `club_interest` con el valor `gift`. No requiere añadir una opción nueva a `club_lead_magnet`; esa propiedad se reserva para el recurso financiero cuando corresponda.

## Recursos que debes sustituir

- Fotografías de productos: son referenciales; reemplázalas con fotos reales del inventario antes de vender.
- `product-charger.webp` reutiliza temporalmente una imagen de conectividad.
- Testimonios: los bloques actuales son placeholders y no deben convertirse en testimonios ficticios.
- Datos de contacto, enlace EBC, Mercado Pago, QR, canonical y Open Graph.
- Textos legales y responsable de privacidad.

Las fotografías referenciales proceden de Unsplash y se descargaron para uso local bajo su licencia. Conserva un registro de los identificadores originales o reemplázalas por material propio.

## Publicar en GitHub Pages

La forma recomendada es publicar con GitHub Actions para no depender de una carpeta o rama manual.

1. Crea el repositorio en GitHub y sube esta carpeta a la rama `main`.
2. En GitHub abre **Settings > Pages**.
3. En **Build and deployment**, selecciona **GitHub Actions**.
4. Haz push de los cambios y espera a que el workflow despliegue la landing.
5. Cuando GitHub muestre la URL final, reemplaza `TU-USUARIO` y `TU-REPOSITORIO` en `index.html`, `js/config.js`, `robots.txt` y `sitemap.xml`.
6. Verifica la página pública y prueba la URL real con `?source=vehicle-01&utm_source=uber-qr&utm_campaign=onboard-club`.

Si prefieres el método clásico, puedes usar **Deploy from a branch** con la rama principal y la raíz del repositorio, pero el workflow deja la publicación más estable y repetible.

Todas las rutas de producción son relativas y funcionan bajo un repositorio de proyecto.

## Checklist previo a producción

- Contactos y enlaces reales configurados.
- Formularios HubSpot probados con contactos de prueba.
- Fotografías, precios y stock reales.
- Enlaces de Mercado Pago probados en una compra controlada.
- Enlace EBC y contenido aprobados.
- Testimonios reales con autorización o sección retirada.
- Aviso de privacidad definitivo.
- Navegación por teclado y prueba móvil completadas.
- Lighthouse y accesibilidad revisados sobre la URL publicada.

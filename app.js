const STORAGE_KEY = "farm-ledger-records";
const DOWNLOADS_MANIFEST = "downloads.json?v=14";

const starterRecords = [
  {
    id: crypto.randomUUID(),
    date: "2026-05-18",
    field: "Greenhouse",
    category: "Harvest",
    description: "Tomato picking for co-op delivery",
    quantity: 184,
    unit: "kg",
    amount: 920
  },
  {
    id: crypto.randomUUID(),
    date: "2026-05-17",
    field: "River Block",
    category: "Input",
    description: "Drip line fittings and compost",
    quantity: 1,
    unit: "lot",
    amount: -286.5
  },
  {
    id: crypto.randomUUID(),
    date: "2026-05-16",
    field: "North Pasture",
    category: "Labor",
    description: "Fencing crew",
    quantity: 14,
    unit: "hours",
    amount: -420
  },
  {
    id: crypto.randomUUID(),
    date: "2026-05-15",
    field: "Orchard",
    category: "Sale",
    description: "Farm stand citrus sales",
    quantity: 62,
    unit: "kg",
    amount: 558
  },
  {
    id: crypto.randomUUID(),
    date: "2026-05-13",
    field: "Greenhouse",
    category: "Maintenance",
    description: "Shade cloth repair",
    quantity: 3,
    unit: "panels",
    amount: -96
  }
];

const form = document.querySelector("#entryForm");
const rows = document.querySelector("#ledgerRows");
const fieldFilter = document.querySelector("#fieldFilter");
const categoryFilter = document.querySelector("#categoryFilter");
const downloadStatus = document.querySelector("#downloadStatus");
const phoneDownload = document.querySelector("#phoneDownload");
const windowsDownload = document.querySelector("#windowsDownload");
const phoneVersion = document.querySelector("#phoneVersion");
const windowsVersion = document.querySelector("#windowsVersion");
const manifestUpdated = document.querySelector("#manifestUpdated");
const webAppLink = document.querySelector("#webAppLink");
const appPopup = document.querySelector("#appPopup");
const appPopupMessage = document.querySelector("#appPopupMessage");
const appPopupAction = document.querySelector("#appPopupAction");
const appPopupClose = document.querySelector("#appPopupClose");

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0
});

let records = loadRecords();
let deferredInstallPrompt = null;

const dateInput = document.querySelector("#date");
if (dateInput) {
  dateInput.valueAsDate = new Date();
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const record = {
    id: crypto.randomUUID(),
    date: data.get("date"),
    field: data.get("field"),
    category: data.get("category"),
    description: data.get("description").trim(),
    quantity: Number(data.get("quantity") || 0),
    unit: data.get("unit").trim(),
    amount: Number(data.get("amount"))
  };

  records = [record, ...records];
  saveRecords();
  form.reset();
  if (dateInput) {
    dateInput.valueAsDate = new Date();
  }
  render();
});

fieldFilter?.addEventListener("change", render);
categoryFilter?.addEventListener("change", render);

document.querySelector("#contactForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#email").value.trim();
  const joined = JSON.parse(localStorage.getItem("farm-ledger-waitlist") || "[]");
  localStorage.setItem("farm-ledger-waitlist", JSON.stringify([...new Set([...joined, email])]));
  document.querySelector("#contactMessage").textContent = "Thanks. Your email is saved on this device and ready for follow-up.";
  event.target.reset();
});

rows?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;

  records = records.filter((record) => record.id !== button.dataset.delete);
  saveRecords();
  render();
});

webAppLink?.addEventListener("click", handleAppAction);
appPopupClose?.addEventListener("click", closeAppPopup);
appPopup?.addEventListener("click", (event) => {
  if (event.target === appPopup) {
    closeAppPopup();
  }
});

document.querySelectorAll(".social-link[href='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
  });
});

function loadRecords() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return starterRecords;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : starterRecords;
  } catch {
    return starterRecords;
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function render() {
  if (!rows || !fieldFilter || !categoryFilter) return;

  syncFilters();
  renderStats();
  renderRows();
}

function syncFilters() {
  const selectedField = fieldFilter.value;
  const selectedCategory = categoryFilter.value;
  const fields = ["All", ...new Set(records.map((record) => record.field))];
  const categories = ["All", ...new Set(records.map((record) => record.category))];

  fieldFilter.innerHTML = fields.map((field) => optionMarkup(field, selectedField, "All fields")).join("");
  categoryFilter.innerHTML = categories.map((category) => optionMarkup(category, selectedCategory, "All categories")).join("");
}

function optionMarkup(value, selectedValue, allLabel) {
  const selected = value === selectedValue ? " selected" : "";
  const label = value === "All" ? allLabel : value;
  return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`;
}

function filteredRecords() {
  return records
    .filter((record) => fieldFilter.value === "All" || record.field === fieldFilter.value)
    .filter((record) => categoryFilter.value === "All" || record.category === categoryFilter.value)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderStats() {
  const income = records.filter((record) => record.amount > 0).reduce((sum, record) => sum + record.amount, 0);
  const expenses = records.filter((record) => record.amount < 0).reduce((sum, record) => sum + record.amount, 0);
  const net = income + expenses;
  const harvest = records
    .filter((record) => record.category === "Harvest" && record.unit.toLowerCase() === "kg")
    .reduce((sum, record) => sum + record.quantity, 0);

  setText("#netBalance", currency.format(net));
  setText("#incomeTotal", currency.format(income));
  setText("#expenseTotal", currency.format(Math.abs(expenses)));
  setText("#harvestTotal", `${harvest.toLocaleString()} kg`);
}

function renderRows() {
  const visibleRecords = filteredRecords();

  if (!visibleRecords.length) {
    rows.innerHTML = `<tr><td class="empty-state" colspan="7">No records match these filters.</td></tr>`;
    return;
  }

  rows.innerHTML = visibleRecords.map((record) => {
    const amountClass = record.amount >= 0 ? "positive" : "negative";
    const quantity = record.quantity ? `${record.quantity.toLocaleString()} ${escapeHtml(record.unit)}` : "-";

    return `
      <tr>
        <td>${formatDate(record.date)}</td>
        <td>${escapeHtml(record.field)}</td>
        <td><span class="chip">${escapeHtml(record.category)}</span></td>
        <td>${escapeHtml(record.description)}</td>
        <td>${quantity}</td>
        <td class="amount ${amountClass}">${currency.format(record.amount)}</td>
        <td><button class="delete-btn" type="button" data-delete="${record.id}" aria-label="Delete ${escapeHtml(record.description)}">X</button></td>
      </tr>
    `;
  }).join("");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

async function loadDownloadLinks() {
  if (!phoneDownload || !windowsDownload) return;

  try {
    const response = await fetch(`${DOWNLOADS_MANIFEST}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Manifest returned ${response.status}`);
    }

    const manifest = await response.json();
    applyDownloadLink(phoneDownload, phoneVersion, manifest.phone);
    applyDownloadLink(windowsDownload, windowsVersion, manifest.windows);
    if (manifest.web?.url && webAppLink) {
      webAppLink.href = manifest.web.url;
    }

    const releaseName = manifest.web?.version
      ? `Online app version ${manifest.web.version}`
      : manifest.latestVersion
        ? `Version ${manifest.latestVersion}`
        : "Latest version";
    const updated = manifest.updatedAt ? `Updated ${formatManifestDate(manifest.updatedAt)}` : "Release manifest ready";
    downloadStatus.textContent = `${releaseName} is ready to download.`;
    manifestUpdated.textContent = updated;
  } catch {
    downloadStatus.textContent = "Download links are temporarily unavailable. Please try again shortly.";
    phoneVersion.textContent = "Latest link unavailable";
    windowsVersion.textContent = "Latest link unavailable";
    manifestUpdated.textContent = "Release manifest unavailable";
  }
}

function applyDownloadLink(anchor, versionElement, release) {
  if (!release?.url) {
    anchor.setAttribute("aria-disabled", "true");
    anchor.removeAttribute("download");
    anchor.href = "#contact";
    versionElement.textContent = "Coming soon";
    return;
  }

  anchor.href = release.url;
  if (isExternalUrl(release.url)) {
    anchor.removeAttribute("download");
  } else if (getDownloadPath(release.url).endsWith(".apk")) {
    anchor.setAttribute("download", "farming-ledger-mobile-app.apk");
  } else if (getDownloadPath(release.url).endsWith(".zip")) {
    anchor.setAttribute("download", "farming-ledger-windows-app.zip");
  }
  anchor.removeAttribute("aria-disabled");

  const version = release.version ? `Version ${release.version}` : "Latest version";
  const size = release.size ? ` - ${release.size}` : "";
  versionElement.textContent = `${version}${size}`;
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value);
}

function getDownloadPath(value) {
  return value.split(/[?#]/, 1)[0];
}

function formatManifestDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

async function handleAppAction(event) {
  const link = event.currentTarget;
  const target = link.dataset.installTarget || "online";

  if (target === "launch") {
    event.preventDefault();
    showAppPopup("Open the real Farming Ledger web app in a new page.", link.href);
    return;
  }

  event.preventDefault();

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    showAppPopup(result.outcome === "accepted"
      ? "Farming Ledger is being installed. You can open it from your device apps."
      : fallbackInstallText(target), link.href);
    return;
  }

  showAppPopup(fallbackInstallText(target), link.href);
}

function fallbackInstallText(target) {
  const ua = navigator.userAgent.toLowerCase();

  if (target === "phone" && /iphone|ipad|ipod/.test(ua)) {
    return "On iPhone: tap Share, then Add to Home Screen.";
  }

  if (target === "phone") {
    return "On Android: tap the browser menu, then Install app or Add to Home screen.";
  }

  return "On Windows: click the install icon in the address bar, or open Chrome menu > Save and share > Install page.";
}

function showAppPopup(message, actionUrl) {
  if (!appPopup || !appPopupMessage || !appPopupAction) return;

  appPopupMessage.textContent = message;
  appPopupAction.href = actionUrl;
  appPopup.setAttribute("aria-hidden", "false");
  appPopupClose?.focus();
}

function closeAppPopup() {
  appPopup?.setAttribute("aria-hidden", "true");
}

loadDownloadLinks();
registerServiceWorker();
render();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

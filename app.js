const STORAGE_KEY = "farm-ledger-records";
const DOWNLOADS_MANIFEST = "downloads.json";

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

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0
});

let records = loadRecords();

document.querySelector("#date").valueAsDate = new Date();

form.addEventListener("submit", (event) => {
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
  document.querySelector("#date").valueAsDate = new Date();
  render();
});

fieldFilter.addEventListener("change", render);
categoryFilter.addEventListener("change", render);

document.querySelector("#contactForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#email").value.trim();
  const joined = JSON.parse(localStorage.getItem("farm-ledger-waitlist") || "[]");
  localStorage.setItem("farm-ledger-waitlist", JSON.stringify([...new Set([...joined, email])]));
  document.querySelector("#contactMessage").textContent = "Thanks. Your email is saved on this device for the launch list.";
  event.target.reset();
});

rows.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;

  records = records.filter((record) => record.id !== button.dataset.delete);
  saveRecords();
  render();
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

  document.querySelector("#netBalance").textContent = currency.format(net);
  document.querySelector("#incomeTotal").textContent = currency.format(income);
  document.querySelector("#expenseTotal").textContent = currency.format(Math.abs(expenses));
  document.querySelector("#harvestTotal").textContent = `${harvest.toLocaleString()} kg`;
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

    const releaseName = manifest.latestVersion ? `Version ${manifest.latestVersion}` : "Latest version";
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
  anchor.toggleAttribute("download", !isExternalUrl(release.url));
  anchor.removeAttribute("aria-disabled");

  const version = release.version ? `Version ${release.version}` : "Latest version";
  const size = release.size ? ` - ${release.size}` : "";
  versionElement.textContent = `${version}${size}`;
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value);
}

function formatManifestDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

loadDownloadLinks();
render();

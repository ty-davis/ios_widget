// Baby Health Entry
// Run this script inside Scriptable to record and review shared events.

const storage = importModule("Baby Health Storage");
let data = [];
let setupError = null;

try {
  await storage.migrateLegacyData();
  data = await storage.loadEvents();
} catch (error) {
  setupError = error.message;
}

await mainMenu();
Script.complete();

async function mainMenu() {
  if (setupError) {
    await showMessage("Shared folder setup needed", `${setupError}\n\nCreate the File Bookmark described in the README, then run this script again.`);
    return;
  }

  const alert = new Alert();
  alert.title = "Baby health";
  alert.message = `${data.filter((event) => event.type === "breastfeeding").length} breastfeeds · ${data.filter((event) => event.type === "bottle").length} bottles · ${data.filter((event) => event.type === "medication").length} medications recorded`;
  alert.addAction("Log breastfeeding");
  alert.addAction("Log bottle feeding");
  alert.addAction("Log medication");
  alert.addAction("Review today");
  alert.addAction("Manage recent entry");
  alert.addCancelAction("Close");

  const choice = await alert.presentSheet();
  if (choice === 0) await logFeed();
  if (choice === 1) await logBottle();
  if (choice === 2) await logMedication();
  if (choice === 3) await reviewToday();
  if (choice === 4) await manageRecentEntry();
}

async function logFeed() {
  const sideAlert = new Alert();
  sideAlert.title = "Breastfeeding side";
  sideAlert.addAction("Left");
  sideAlert.addAction("Right");
  sideAlert.addAction("Both");
  sideAlert.addCancelAction("Cancel");
  const sideChoice = await sideAlert.presentSheet();
  if (sideChoice < 0) return;

  const duration = await askText("Duration", "Minutes", "15");
  if (duration === null) return;
  const durationMinutes = Number(duration);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
    await showMessage("Invalid duration", "Enter a number of minutes, such as 12.");
    return;
  }

  const time = await askText("When did it start?", "Use YYYY-MM-DD HH:mm or `now`", "now");
  if (time === null) return;
  const startedAt = parseDateInput(time);
  if (!startedAt) {
    await showMessage("Invalid time", "Use `now` or a date like 2026-09-16 14:30.");
    return;
  }

  const notes = await askText("Notes", "Optional", "");
  if (notes === null) return;

  addEvent({
    id: createId("feed"),
    type: "breastfeeding",
    date: startedAt.toISOString(),
    durationMinutes: Math.round(durationMinutes),
    side: ["left", "right", "both"][sideChoice],
    notes
  });
  await showMessage("Saved", "Breastfeeding record added.");
}

async function logMedication() {
  const name = await askText("Medication", "Name", "");
  if (name === null || !name.trim()) return;

  const dose = await askText("Dose", "Optional, for example 1", "");
  if (dose === null) return;
  const unit = await askText("Unit", "Optional, for example mL or drop", "");
  if (unit === null) return;

  const time = await askText("When was it taken?", "Use YYYY-MM-DD HH:mm or `now`", "now");
  if (time === null) return;
  const takenAt = parseDateInput(time);
  if (!takenAt) {
    await showMessage("Invalid time", "Use `now` or a date like 2026-09-16 14:30.");
    return;
  }

  const notes = await askText("Notes", "Optional", "");
  if (notes === null) return;

  addEvent({
    id: createId("medication"),
    type: "medication",
    name: name.trim(),
    date: takenAt.toISOString(),
    dose: dose.trim(),
    unit: unit.trim(),
    notes
  });
  await showMessage("Saved", "Medication record added. This script does not calculate or recommend doses.");
}

async function logBottle() {
  const amount = await askText("Bottle amount", "Enter a number, for example 120", "");
  if (amount === null) return;
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    await showMessage("Invalid amount", "Enter a positive number for the amount.");
    return;
  }

  const unit = await askText("Bottle unit", "For example mL or oz", "mL");
  if (unit === null || !unit.trim()) return;

  const time = await askText("When was it fed?", "Use YYYY-MM-DD HH:mm or `now`", "now");
  if (time === null) return;
  const fedAt = parseDateInput(time);
  if (!fedAt) {
    await showMessage("Invalid time", "Use `now` or a date like 2026-09-16 14:30.");
    return;
  }

  const notes = await askText("Notes", "Optional", "");
  if (notes === null) return;

  addEvent({
    id: createId("bottle"),
    type: "bottle",
    date: fedAt.toISOString(),
    amount: numericAmount,
    unit: unit.trim(),
    notes
  });
  await showMessage("Saved", "Bottle-feeding record added.");
}

async function reviewToday() {
  const feeds = data.filter((record) => record.type === "breastfeeding" && isToday(record.date)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const bottles = data.filter((record) => record.type === "bottle" && isToday(record.date)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const medications = data.filter((record) => record.type === "medication" && isToday(record.date)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const lines = ["FEEDS"];

  if (!feeds.length && !bottles.length) lines.push("None");
  for (const feed of feeds) {
    lines.push(`${formatTime(feed.date)}  ${capitalize(feed.side)} · ${feed.durationMinutes} min`);
  }
  for (const bottle of bottles) {
    lines.push(`${formatTime(bottle.date)}  Bottle · ${bottle.amount} ${bottle.unit}`);
  }

  lines.push("", "MEDICATIONS");
  if (!medications.length) lines.push("None");
  for (const medication of medications) {
    lines.push(`${formatTime(medication.date)}  ${medication.name} ${medication.dose} ${medication.unit}`.trim());
  }

  await showMessage("Today", lines.join("\n"));
}

async function manageRecentEntry() {
  const records = data.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  if (!records.length) {
    await showMessage("No records", "There are no entries to manage.");
    return;
  }

  const alert = new Alert();
  alert.title = "Recent entries";
  records.forEach((item) => alert.addAction(describeRecord(item)));
  alert.addCancelAction("Cancel");
  const choice = await alert.presentSheet();
  if (choice < 0) return;

  const selected = records[choice];
  const action = new Alert();
  action.title = "Manage entry";
  action.addAction("Delete");
  action.addCancelAction("Cancel");
  const actionChoice = await action.presentSheet();
  if (actionChoice !== 0) return;

  const confirmation = new Alert();
  confirmation.title = "Delete this entry?";
  confirmation.message = describeRecord(selected);
  confirmation.addDestructiveAction("Delete");
  confirmation.addCancelAction("Keep");
  if (await confirmation.presentAlert() !== 0) return;

  storage.appendEvent({
    id: createId("deletion"),
    type: "deletion",
    targetId: selected.id,
    date: new Date().toISOString()
  });
  data = data.filter((record) => record.id !== selected.id);
  await showMessage("Deleted", "The record was removed.");
}

async function askText(title, message, value) {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addTextField("", value);
  alert.addAction("Save");
  alert.addCancelAction("Cancel");
  const choice = await alert.presentAlert();
  return choice === 0 ? alert.textFieldValue(0) : null;
}

async function showMessage(title, message) {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addAction("OK");
  await alert.presentAlert();
}

function parseDateInput(value) {
  if (value.trim().toLowerCase() === "now") return new Date();
  const normalized = value.trim().replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function createId(prefix) {
  return storage.createEventId(prefix);
}

function addEvent(event) {
  storage.appendEvent(event);
  data.push(event);
}

function isToday(value) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function describeRecord(item) {
  if (item.type === "breastfeeding") {
    return `${formatTime(item.date)} · Feed · ${capitalize(item.side)} · ${item.durationMinutes} min`;
  }
  if (item.type === "bottle") {
    return `${formatTime(item.date)} · Bottle · ${item.amount} ${item.unit}`;
  }
  return `${formatTime(item.date)} · ${item.name} · ${item.dose} ${item.unit}`.trim();
}

function capitalize(value) {
  return String(value || "unknown").charAt(0).toUpperCase() + String(value || "unknown").slice(1);
}

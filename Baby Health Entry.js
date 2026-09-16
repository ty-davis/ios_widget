// Baby Health Entry
// Run this script inside Scriptable to record and review local events.

const DATA_FILE = "BabyHealthData.json";
const fm = FileManager.local();
const dataPath = fm.joinPath(fm.documentsDirectory(), DATA_FILE);

let data = readData();
await mainMenu();
Script.complete();

async function mainMenu() {
  const alert = new Alert();
  alert.title = "Baby health";
  alert.message = `${data.feeds.length} feeds · ${data.medications.length} medications recorded`;
  alert.addAction("Log breastfeeding");
  alert.addAction("Log medication");
  alert.addAction("Review today");
  alert.addAction("Manage recent entry");
  alert.addCancelAction("Close");

  const choice = await alert.presentSheet();
  if (choice === 0) await logFeed();
  if (choice === 1) await logMedication();
  if (choice === 2) await reviewToday();
  if (choice === 3) await manageRecentEntry();
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

  data.feeds.push({
    id: createId("feed"),
    startedAt: startedAt.toISOString(),
    durationMinutes: Math.round(durationMinutes),
    side: ["left", "right", "both"][sideChoice],
    notes
  });
  saveData();
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

  data.medications.push({
    id: createId("medication"),
    name: name.trim(),
    takenAt: takenAt.toISOString(),
    dose: dose.trim(),
    unit: unit.trim(),
    notes
  });
  saveData();
  await showMessage("Saved", "Medication record added. This script does not calculate or recommend doses.");
}

async function reviewToday() {
  const feeds = data.feeds.filter((record) => isToday(record.startedAt)).sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
  const medications = data.medications.filter((record) => isToday(record.takenAt)).sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));
  const lines = ["FEEDS"];

  if (!feeds.length) lines.push("None");
  for (const feed of feeds) {
    lines.push(`${formatTime(feed.startedAt)}  ${capitalize(feed.side)} · ${feed.durationMinutes} min`);
  }

  lines.push("", "MEDICATIONS");
  if (!medications.length) lines.push("None");
  for (const medication of medications) {
    lines.push(`${formatTime(medication.takenAt)}  ${medication.name} ${medication.dose} ${medication.unit}`.trim());
  }

  await showMessage("Today", lines.join("\n"));
}

async function manageRecentEntry() {
  const records = [
    ...data.feeds.map((record) => ({ type: "feed", record, date: record.startedAt })),
    ...data.medications.map((record) => ({ type: "medication", record, date: record.takenAt }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

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

  const collection = selected.type === "feed" ? data.feeds : data.medications;
  const index = collection.findIndex((record) => record.id === selected.record.id);
  if (index >= 0) collection.splice(index, 1);
  saveData();
  await showMessage("Deleted", "The record was removed.");
}

function readData() {
  if (!fm.fileExists(dataPath)) return { version: 1, feeds: [], medications: [] };
  try {
    const parsed = JSON.parse(fm.readString(dataPath));
    return {
      version: 1,
      feeds: Array.isArray(parsed.feeds) ? parsed.feeds : [],
      medications: Array.isArray(parsed.medications) ? parsed.medications : []
    };
  } catch (error) {
    return { version: 1, feeds: [], medications: [] };
  }
}

function saveData() {
  fm.writeString(dataPath, JSON.stringify(data, null, 2));
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
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  if (item.type === "feed") {
    return `${formatTime(item.record.startedAt)} · Feed · ${capitalize(item.record.side)} · ${item.record.durationMinutes} min`;
  }
  return `${formatTime(item.record.takenAt)} · ${item.record.name} · ${item.record.dose} ${item.record.unit}`.trim();
}

function capitalize(value) {
  return String(value || "unknown").charAt(0).toUpperCase() + String(value || "unknown").slice(1);
}

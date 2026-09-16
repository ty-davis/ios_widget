// Baby Health Widget
// Reads local records created by Baby Health Entry.js.

const DATA_FILE = "BabyHealthData.json";

const fm = FileManager.local();
const dataPath = fm.joinPath(fm.documentsDirectory(), DATA_FILE);
const data = readData();
const widget = createWidget(data);

// iOS controls the actual schedule, but this gives it a reasonable refresh hint.
widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
widget.url = "scriptable:///run?scriptName=Baby%20Health%20Dashboard";
Script.setWidget(widget);
Script.complete();

function readData() {
  if (!fm.fileExists(dataPath)) {
    return { version: 1, feeds: [], bottles: [], medications: [] };
  }

  try {
    return JSON.parse(fm.readString(dataPath));
  } catch (error) {
    return { version: 1, feeds: [], bottles: [], medications: [] };
  }
}

function createWidget(data) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#17212B");
  widget.setPadding(16, 16, 14, 16);

  const latestFeeding = latestFeedingRecord(data);
  if (latestFeeding) {
    const feedHeader = widget.addText("LAST FEED");
    feedHeader.font = Font.boldSystemFont(9);
    feedHeader.textColor = new Color("#8FA8B8");

    const feedAge = widget.addText(relativeTime(latestFeeding.date));
    feedAge.font = Font.boldSystemFont(24);
    feedAge.textColor = new Color("#F7D794");

    const feedSummary = widget.addText(feedingSummary(latestFeeding));
    feedSummary.font = Font.systemFont(12);
    feedSummary.textColor = new Color("#C7D4DC");

    const feedTime = widget.addText(formatTime(latestFeeding.date));
    feedTime.font = Font.systemFont(10);
    feedTime.textColor = new Color("#718897");
  } else {
    const empty = widget.addText("No feeding recorded yet");
    empty.font = Font.boldSystemFont(15);
    empty.textColor = new Color("#F7D794");
  }

  widget.addSpacer(12);

  const medicationHeader = widget.addText("RECENT MEDICATION");
  medicationHeader.font = Font.boldSystemFont(9);
  medicationHeader.textColor = new Color("#8FA8B8");

  const recentMedication = latest(data.medications);
  if (recentMedication) {
    const medication = widget.addText(`${recentMedication.name} · ${recentMedication.dose} ${recentMedication.unit}`.trim());
    medication.font = Font.boldSystemFont(13);
    medication.textColor = new Color("#B8E0D2");

    const medicationTime = widget.addText(formatTime(recentMedication.takenAt));
    medicationTime.font = Font.systemFont(11);
    medicationTime.textColor = new Color("#C7D4DC");
  } else {
    const none = widget.addText("No medication recorded");
    none.font = Font.systemFont(12);
    none.textColor = new Color("#C7D4DC");
  }

  widget.addSpacer();
  const footer = widget.addText(`Updated ${formatTime(new Date().toISOString())}`);
  footer.font = Font.systemFont(9);
  footer.textColor = new Color("#718897");

  return widget;
}

function latest(records) {
  return records
    .filter((record) => record && (record.startedAt || record.takenAt))
    .sort((a, b) => new Date(b.startedAt || b.takenAt) - new Date(a.startedAt || a.takenAt))[0];
}

function latestFeedingRecord(data) {
  const breastfeedings = (data.feeds || []).map((record) => ({ type: "breast", record, date: record.startedAt }));
  const bottles = (data.bottles || []).map((record) => ({ type: "bottle", record, date: record.fedAt }));
  return latest([...breastfeedings, ...bottles].map((item) => ({ ...item, startedAt: item.date })));
}

function feedingSummary(item) {
  if (item.type === "bottle") {
    return `Bottle · ${item.record.amount} ${item.record.unit}`.trim();
  }
  return `${capitalize(item.record.side)} · ${item.record.durationMinutes} min`;
}

function relativeTime(value) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m ago` : `${hours}h ago`;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function capitalize(value) {
  return String(value || "unknown").charAt(0).toUpperCase() + String(value || "unknown").slice(1);
}

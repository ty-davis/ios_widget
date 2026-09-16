// Baby Health Storage
// Shared append-only event storage for the other Baby Health scripts.

const SHARED_BOOKMARK_NAME = "Baby Health Shared";
const EVENTS_DIRECTORY_NAME = "BabyHealthEvents";
const LEGACY_FILE_NAME = "BabyHealthData.json";

const iCloud = FileManager.iCloud();
const local = FileManager.local();

async function loadEvents(includeDeleted = false) {
  const directory = getEventsDirectory();
  const names = iCloud.listContents(directory);
  const events = [];

  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const path = iCloud.joinPath(directory, name);
    await iCloud.downloadFileFromiCloud(path);

    try {
      const event = JSON.parse(iCloud.readString(path));
      if (event && event.id && event.type) events.push(event);
    } catch (error) {
      // Ignore an incomplete or corrupt event file and keep the other records usable.
    }
  }

  if (includeDeleted) return events;

  const deletedIds = new Set(events.filter((event) => event.type === "deletion").map((event) => event.targetId));
  return events
    .filter((event) => event.type !== "deletion" && !deletedIds.has(event.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function appendEvent(event) {
  const directory = getEventsDirectory();
  const fileName = `${event.id}.json`;
  const path = iCloud.joinPath(directory, fileName);
  iCloud.writeString(path, JSON.stringify(event, null, 2));
}

async function migrateLegacyData() {
  const legacyPath = local.joinPath(local.documentsDirectory(), LEGACY_FILE_NAME);
  if (!local.fileExists(legacyPath)) return 0;

  let legacy;
  try {
    legacy = JSON.parse(local.readString(legacyPath));
  } catch (error) {
    return 0;
  }

  const existing = await loadEvents(true);
  const existingIds = new Set(existing.flatMap((event) => [event.id, event.targetId]).filter(Boolean));
  const records = [
    ...(Array.isArray(legacy.feeds) ? legacy.feeds : []).map((record) => ({
      ...record,
      type: "breastfeeding",
      date: record.startedAt
    })),
    ...(Array.isArray(legacy.bottles) ? legacy.bottles : []).map((record) => ({
      ...record,
      type: "bottle",
      date: record.fedAt
    })),
    ...(Array.isArray(legacy.medications) ? legacy.medications : []).map((record) => ({
      ...record,
      type: "medication",
      date: record.takenAt
    }))
  ];

  let migrated = 0;
  for (const record of records) {
    if (!record.id || existingIds.has(record.id)) continue;
    appendEvent(record);
    existingIds.add(record.id);
    migrated += 1;
  }
  return migrated;
}

function createEventId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getEventsDirectory() {
  if (!iCloud.bookmarkExists(SHARED_BOOKMARK_NAME)) {
    throw new Error(`Create a Scriptable File Bookmark named "${SHARED_BOOKMARK_NAME}" first.`);
  }

  const root = iCloud.bookmarkedPath(SHARED_BOOKMARK_NAME);
  const directory = iCloud.joinPath(root, EVENTS_DIRECTORY_NAME);
  if (!iCloud.isDirectory(directory)) iCloud.createDirectory(directory, true);
  return directory;
}

module.exports = {
  appendEvent,
  createEventId,
  loadEvents,
  migrateLegacyData,
  sharedBookmarkName: SHARED_BOOKMARK_NAME
};

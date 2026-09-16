// Baby Health Dashboard
// A shared, app-like history view for records created by Baby Health Entry.js.

const storage = importModule("Baby Health Storage");
const webView = new WebView();
let events = [];
let setupError = null;

try {
  await storage.migrateLegacyData();
  events = await storage.loadEvents();
} catch (error) {
  setupError = error.message;
}

await webView.loadHTML(renderHtml(normalizeRecords(events), setupError));
await webView.present(true);
Script.complete();

function normalizeRecords(events) {
  return events.map((record) => ({
      id: record.id,
      type: record.type,
      date: record.date,
      side: record.side || "unknown",
      durationMinutes: Number(record.durationMinutes || 0),
      amount: Number(record.amount || 0),
      unit: record.unit || "",
      name: record.name || "Medication",
      dose: record.dose || "",
      notes: record.notes || ""
    }))
    .filter((record) => record.date && !Number.isNaN(new Date(record.date).getTime()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderHtml(records, setupError) {
  const serializedRecords = JSON.stringify(records).replace(/</g, "\\u003c");
  const setupBanner = setupError
    ? '<div class="setup-error"><strong>Shared folder setup needed</strong><br>' + escapeHtmlForHtml(setupError) + '<br><br>Open Scriptable settings and create the shared File Bookmark described in the README.</div>'
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="color-scheme" content="dark">
  <style>
    :root {
      --background: #101820;
      --surface: #17232d;
      --surface-light: #20313d;
      --border: #2b414f;
      --text: #f2f6f7;
      --muted: #94aab6;
      --yellow: #f7d794;
      --green: #b8e0d2;
      --blue: #9bc4d8;
      --purple: #c4b5e8;
      --radius: 18px;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px 16px 36px;
      background: var(--background);
      color: var(--text);
      font: -apple-system-body, -apple-system, BlinkMacSystemFont, sans-serif;
    }
    main { max-width: 760px; margin: 0 auto; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 30px; letter-spacing: -0.8px; }
    h2 { font-size: 20px; letter-spacing: -0.2px; }
    h3 { font-size: 14px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
    .subtitle { color: var(--muted); margin-top: 5px; font-size: 14px; }
    .setup-error { background: #3b2d1b; border: 1px solid #8d6b32; border-radius: var(--radius); padding: 15px; color: var(--yellow); line-height: 1.45; margin-bottom: 18px; font-size: 13px; }
    .entry-link {
      display: inline-block;
      padding: 10px 13px;
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--green);
      text-decoration: none;
      font-size: 13px;
      white-space: nowrap;
    }
    .segmented { display: flex; gap: 7px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 18px; }
    button {
      appearance: none;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: transparent;
      color: var(--muted);
      padding: 10px 14px;
      font: inherit;
      font-size: 13px;
      white-space: nowrap;
    }
    button.active { background: var(--surface-light); color: var(--text); border-color: var(--blue); }
    .cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 24px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 15px; min-height: 92px; }
    .card .value { display: block; font-size: 25px; font-weight: 700; color: var(--yellow); margin-top: 8px; letter-spacing: -0.5px; }
    .card .detail { color: var(--muted); font-size: 12px; margin-top: 4px; }
    section { margin-top: 26px; }
    .section-heading { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 11px; }
    .section-note { color: var(--muted); font-size: 12px; }
    .chart { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 12px 11px; }
    .chart-row { display: flex; align-items: end; gap: 6px; height: 126px; overflow-x: auto; }
    .day { min-width: 35px; height: 100%; display: flex; flex-direction: column; justify-content: end; align-items: center; gap: 5px; }
    .bars { height: 100px; display: flex; align-items: end; gap: 3px; }
    .bar { width: 10px; min-height: 3px; border-radius: 5px 5px 2px 2px; }
    .bar.breast { background: var(--yellow); }
    .bar.bottle { background: var(--blue); }
    .day-label { color: var(--muted); font-size: 10px; }
    .legend { display: flex; gap: 15px; margin-top: 13px; color: var(--muted); font-size: 11px; }
    .legend span::before { content: ""; display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; background: var(--yellow); }
    .legend span.bottle-legend::before { background: var(--blue); }
    .trend-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .trend { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 15px; }
    .trend .big { font-size: 22px; font-weight: 700; margin: 7px 0 3px; color: var(--green); }
    .trend p { color: var(--muted); font-size: 12px; line-height: 1.45; }
    .medication-list, .event-list { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .medication, .event { padding: 13px 15px; border-bottom: 1px solid var(--border); }
    .medication:last-child, .event:last-child { border-bottom: 0; }
    .row { display: flex; justify-content: space-between; gap: 12px; }
    .primary { font-size: 14px; font-weight: 600; }
    .secondary { color: var(--muted); font-size: 12px; margin-top: 4px; }
    .event-type { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.7px; }
    .empty { padding: 22px 15px; color: var(--muted); text-align: center; font-size: 13px; }
    @media (min-width: 540px) {
      body { padding: 32px 24px 48px; }
      .cards { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <main>
    <header class="header">
      <div>
        <h1>Overview</h1>
        <p class="subtitle" id="range-label">Today</p>
      </div>
      <a class="entry-link" href="scriptable:///run?scriptName=Baby%20Health%20Entry">Log/manage event</a>
    </header>

    ${setupBanner}

    <nav class="segmented" id="range-buttons">
      <button data-range="today" class="active">Today</button>
      <button data-range="7">7 days</button>
      <button data-range="30">30 days</button>
      <button data-range="all">All time</button>
    </nav>

    <div class="cards" id="summary"></div>

    <section>
      <div class="section-heading"><h2>Daily activity</h2><span class="section-note" id="chart-note"></span></div>
      <div class="chart" id="chart"></div>
    </section>

    <section>
      <div class="section-heading"><h2>Trends</h2><span class="section-note">Selected range</span></div>
      <div class="trend-grid" id="trends"></div>
    </section>

    <section>
      <div class="section-heading"><h2>Medications</h2><span class="section-note">Recorded doses</span></div>
      <div class="medication-list" id="medications"></div>
    </section>

    <section>
      <div class="section-heading"><h2>History</h2><span class="section-note" id="event-count"></span></div>
      <nav class="segmented" id="type-buttons">
        <button data-type="all" class="active">All</button>
        <button data-type="breastfeeding">Breastfeeding</button>
        <button data-type="bottle">Bottle</button>
        <button data-type="medication">Medication</button>
      </nav>
      <div class="event-list" id="events"></div>
    </section>
  </main>

  <script>
    const records = ${serializedRecords};
    const state = { range: "today", type: "all" };

    document.querySelectorAll("#range-buttons button").forEach((button) => {
      button.addEventListener("click", () => {
        state.range = button.dataset.range;
        document.querySelectorAll("#range-buttons button").forEach((item) => item.classList.toggle("active", item === button));
        render();
      });
    });

    document.querySelectorAll("#type-buttons button").forEach((button) => {
      button.addEventListener("click", () => {
        state.type = button.dataset.type;
        document.querySelectorAll("#type-buttons button").forEach((item) => item.classList.toggle("active", item === button));
        render();
      });
    });

    function render() {
      const filtered = records.filter((record) => inRange(record.date, state.range));
      const label = state.range === "today" ? "Today" : state.range === "all" ? "All recorded time" : \`Last \${state.range} days\`;
      document.getElementById("range-label").textContent = label;
      renderSummary(filtered);
      renderChart(filtered);
      renderTrends(filtered);
      renderMedications(filtered);
      renderEvents(filtered);
    }

    function renderSummary(items) {
      const breast = items.filter((item) => item.type === "breastfeeding");
      const bottles = items.filter((item) => item.type === "bottle");
      const medications = items.filter((item) => item.type === "medication");
      const minutes = breast.reduce((sum, item) => sum + item.durationMinutes, 0);
      const amount = bottles.reduce((sum, item) => sum + item.amount, 0);
      const unit = commonUnit(bottles);
      const bottleDetail = unit ? \`\${formatNumber(amount)} \${unit} total\` : bottles.length ? "Mixed units" : "No bottles";
      document.getElementById("summary").innerHTML = [
        card("Breastfeeds", breast.length, \`\${formatDuration(minutes)} total\`),
        card("Bottle feeds", bottles.length, bottleDetail),
        card("Medications", medications.length, "recorded doses"),
        card("Total events", items.length, "all event types")
      ].join("");
    }

    function renderChart(items) {
      const days = dailyItems(items);
      const maxMinutes = Math.max(1, ...days.map((day) => day.minutes));
      const maxAmount = Math.max(1, ...days.map((day) => day.amount));
      document.getElementById("chart-note").textContent = days.length > 14 ? "Most recent 14 days" : "Minutes and bottle amount";
      if (!days.length) {
        document.getElementById("chart").innerHTML = '<div class="empty">No activity in this range.</div>';
        return;
      }
      const bars = days.slice(-14).map((day) => \`
        <div class="day">
          <div class="bars">
            <div class="bar breast" style="height:\${Math.max(3, day.minutes / maxMinutes * 100)}px" title="\${day.minutes} breastfeeding minutes"></div>
            <div class="bar bottle" style="height:\${Math.max(3, day.amount / maxAmount * 100)}px" title="\${formatNumber(day.amount)} bottle amount"></div>
          </div>
          <span class="day-label">\${day.label}</span>
        </div>\`).join("");
      document.getElementById("chart").innerHTML = \`<div class="chart-row">\${bars}</div><div class="legend"><span>Breastfeeding minutes</span><span class="bottle-legend">Bottle amount</span></div>\`;
    }

    function renderTrends(items) {
      const breast = items.filter((item) => item.type === "breastfeeding");
      const bottles = items.filter((item) => item.type === "bottle");
      const left = breast.filter((item) => item.side === "left").length;
      const right = breast.filter((item) => item.side === "right").length;
      const both = breast.filter((item) => item.side === "both").length;
      const averageDuration = breast.length ? Math.round(breast.reduce((sum, item) => sum + item.durationMinutes, 0) / breast.length) : 0;
      const averageAmount = bottles.length ? bottles.reduce((sum, item) => sum + item.amount, 0) / bottles.length : 0;
      const unit = commonUnit(bottles);
      document.getElementById("trends").innerHTML = [
        trend("Average breastfeed", breast.length ? \`\${averageDuration} min\` : "-", \`\${left} left · \${right} right · \${both} both\`),
        trend("Average bottle", bottles.length && unit ? \`\${formatNumber(averageAmount)} \${unit}\` : bottles.length ? "Mixed units" : "-", \`\${bottles.length} bottle feeds\`),
        trend("Busiest day", busiestDay(items), "Most recorded events"),
        trend("Active days", new Set(items.map((item) => dayKey(item.date))).size, "Days with at least one event")
      ].join("");
    }

    function renderMedications(items) {
      const medications = items.filter((item) => item.type === "medication");
      const groups = {};
      medications.forEach((item) => {
        groups[item.name] = groups[item.name] || [];
        groups[item.name].push(item);
      });
      const names = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
      document.getElementById("medications").innerHTML = names.length ? names.map((name) => {
        const group = groups[name];
        const last = group.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        return \`<div class="medication"><div class="row"><span class="primary">\${escapeHtml(name)}</span><span class="primary">\${group.length}</span></div><div class="secondary">Last recorded \${formatDateTime(last.date)} · \${escapeHtml([last.dose, last.unit].filter(Boolean).join(" "))}</div></div>\`;
      }).join("") : '<div class="empty">No medication recorded in this range.</div>';
    }

    function renderEvents(items) {
      const visible = items.filter((item) => state.type === "all" || item.type === state.type);
      document.getElementById("event-count").textContent = \`\${visible.length} event\${visible.length === 1 ? "" : "s"}\`;
      document.getElementById("events").innerHTML = visible.length ? visible.map((item) => {
        const details = item.type === "breastfeeding" ? \`\${capitalize(item.side)} · \${item.durationMinutes} min\` : item.type === "bottle" ? \`Bottle · \${formatNumber(item.amount)} \${escapeHtml(item.unit)}\` : [item.name, item.dose, item.unit].filter(Boolean).map(escapeHtml).join(" · ");
        return \`<div class="event"><div class="row"><span class="primary">\${details}</span><span class="event-type">\${eventLabel(item.type)}</span></div><div class="secondary">\${formatDateTime(item.date)}\${item.notes ? \` · \${escapeHtml(item.notes)}\` : ""}</div></div>\`;
      }).join("") : '<div class="empty">No events in this range.</div>';
    }

    function card(title, value, detail) { return \`<div class="card"><h3>\${title}</h3><span class="value">\${value}</span><div class="detail">\${detail}</div></div>\`; }
    function trend(title, value, detail) { return \`<div class="trend"><h3>\${title}</h3><div class="big">\${value}</div><p>\${detail}</p></div>\`; }
    function eventLabel(type) { return type === "breastfeeding" ? "Breast" : type === "bottle" ? "Bottle" : "Medication"; }
    function capitalize(value) { return String(value || "unknown").charAt(0).toUpperCase() + String(value || "unknown").slice(1); }
    function formatNumber(value) { return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 }); }
    function formatDuration(minutes) { const hours = Math.floor(minutes / 60); const rest = minutes % 60; return hours ? \`\${hours}h \${rest}m\` : \`\${rest} min\`; }
    function formatDateTime(value) { return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
    function dayKey(value) { const date = new Date(value); return \`\${date.getFullYear()}-\${date.getMonth()}-\${date.getDate()}\`; }
    function commonUnit(items) { const units = items.map((item) => item.unit).filter(Boolean); return units.length && units.every((unit) => unit === units[0]) ? units[0] : ""; }
    function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }

    function inRange(value, range) {
      if (range === "all") return true;
      const date = new Date(value);
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      if (range !== "today") start.setDate(start.getDate() - Number(range) + 1);
      return date >= start;
    }

    function dailyItems(items) {
      const days = {};
      items.forEach((item) => {
        const date = new Date(item.date);
        const key = dayKey(item.date);
        if (!days[key]) days[key] = { date, minutes: 0, amount: 0 };
        if (item.type === "breastfeeding") days[key].minutes += item.durationMinutes;
        if (item.type === "bottle") days[key].amount += item.amount;
      });
      return Object.values(days).sort((a, b) => a.date - b.date).map((day) => ({
        ...day,
        label: day.date.toLocaleDateString([], { weekday: "short" }).slice(0, 3)
      }));
    }

    function busiestDay(items) {
      const counts = {};
      items.forEach((item) => { const key = dayKey(item.date); counts[key] = (counts[key] || 0) + 1; });
      const busiest = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (!busiest) return "-";
      const date = new Date(busiest[0].split("-").map(Number)[0], Number(busiest[0].split("-")[1]), Number(busiest[0].split("-")[2]));
      return \`\${date.toLocaleDateString([], { weekday: "short" })} (\${busiest[1]})\`;
    }

    render();
  </script>
</body>
</html>`;
}

function escapeHtmlForHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

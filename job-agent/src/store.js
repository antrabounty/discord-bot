const fs = require('fs');
const path = require('path');

const SEEN_FILE = path.join(__dirname, '..', 'data', 'seen.json');

function loadSeen() {
  try {
    return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveSeen(seen) {
  fs.mkdirSync(path.dirname(SEEN_FILE), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(seen).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(SEEN_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
}

module.exports = { loadSeen, saveSeen };

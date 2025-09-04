// ============================ src/logging/middleware.js ============================
// Mandatory Logging Integration: A simple middleware that writes structured logs to localStorage.
// Replace or extend this with YOUR pre-test Logging Middleware implementation if required by the evaluation.

const LOG_KEY = "affordmed_logs_v1";

function loadLogs() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

function writeLog(entry) {
  const logs = loadLogs();
  logs.push(entry);
  saveLogs(logs);
}

export function loggingMiddleware(dispatch) {
  return (action) => {
    const entry = {
      ts: new Date().toISOString(),
      type: action?.type || "UNKNOWN",
      payloadShape: action && action.payload ? Object.keys(action.payload) : [],
      route: typeof window !== "undefined" ? window.location.pathname : "",
      meta: { app: "AFFORDMED-URL-SHORTENER" },
    };
    writeLog(entry);
    dispatch(action);
  };
}

export function getAllLogs() {
  return loadLogs();
}

export function clearLogs() {
  saveLogs([]);
}


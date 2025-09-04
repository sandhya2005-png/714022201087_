import React, { createContext, useContext, useMemo, useReducer } from "react";
import { loggingMiddleware } from "./logging/middleware";
import {
  generateCode,
  isValidShortcode,
  nowISO,
  minutesFromNowISO,
  parseValidInt,
  isValidUrl,
} from "./utils";

// Storage helpers (localStorage-based persistence)
const LS_KEYS = {
  LINKS: "affordmed_links_v1",
  LOGS: "affordmed_logs_v1",
  CLICKS: (code) => `affordmed_clicks_${code}_v1`,
};

function loadLinks() {
  try {
    const raw = localStorage.getItem(LS_KEYS.LINKS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLinks(links) {
  localStorage.setItem(LS_KEYS.LINKS, JSON.stringify(links));
}

function loadClicks(code) {
  try {
    const raw = localStorage.getItem(LS_KEYS.CLICKS(code));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveClicks(code, arr) {
  localStorage.setItem(LS_KEYS.CLICKS(code), JSON.stringify(arr));
}

// Actions
const ACTIONS = {
  CREATE_MANY: "CREATE_MANY",
  REDIRECT_HIT: "REDIRECT_HIT",
  CLEAR_EXPIRED: "CLEAR_EXPIRED",
};

const initialState = {
  links: loadLinks(), // { code: { code, url, createdAt, expiresAt, validityMins } }
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.CREATE_MANY: {
      const nextLinks = { ...state.links };
      for (const item of action.payload.results) {
        nextLinks[item.code] = item;
      }
      saveLinks(nextLinks);
      return { ...state, links: nextLinks };
    }
    case ACTIONS.CLEAR_EXPIRED: {
      const now = new Date().toISOString();
      const nextLinks = {};
      Object.values(state.links).forEach((l) => {
        if (!l.expiresAt || l.expiresAt > now) nextLinks[l.code] = l;
      });
      saveLinks(nextLinks);
      return { ...state, links: nextLinks };
    }
    case ACTIONS.REDIRECT_HIT: {
      // only clicks array is persisted per-code; links map unchanged here
      const { code, click } = action.payload;
      const clicks = loadClicks(code);
      clicks.push(click);
      saveClicks(code, clicks);
      return state;
    }
    default:
      return state;
  }
}

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  // wire middleware
  const [state, baseDispatch] = useReducer(reducer, initialState);
  const dispatch = useMemo(
    () => loggingMiddleware(baseDispatch),
    [baseDispatch]
  );

  const api = useMemo(() => ({
    state,
    // Create multiple short links at once (up to 5)
    createMany: (items) => {
      // items: Array<{ url, validityMins?, customCode? }>
      const results = [];
      const errors = [];

      if (!Array.isArray(items) || items.length === 0)
        return { results, errors: ["No items provided"] };

      // Enforce max 5
      const batch = items.slice(0, 5);

      const allCodes = new Set(Object.keys(state.links));

      batch.forEach((it, idx) => {
        // Validation
        const url = (it.url || "").trim();
        if (!isValidUrl(url)) {
          errors.push({ index: idx, message: "Invalid URL" });
          return;
        }
        let mins = parseValidInt(it.validityMins);
        if (mins == null) mins = 30; // default
        if (mins <= 0) {
          errors.push({ index: idx, message: "Validity must be a positive integer (minutes)" });
          return;
        }
        // Code handling
        let code;
        if (it.customCode) {
          const c = it.customCode.trim();
          if (!isValidShortcode(c)) {
            errors.push({ index: idx, message: "Custom shortcode must be 4-32 chars, alphanumeric only" });
            return;
          }
          if (allCodes.has(c)) {
            errors.push({ index: idx, message: `Shortcode \"${c}\" already exists` });
            return;
          }
          code = c;
        } else {
          let tries = 0;
          do {
            code = generateCode(6);
            tries += 1;
          } while (allCodes.has(code) && tries < 10);
          if (allCodes.has(code)) {
            errors.push({ index: idx, message: "Failed to generate unique shortcode; try again" });
            return;
          }
        }
        allCodes.add(code);

        const createdAt = nowISO();
        const expiresAt = minutesFromNowISO(mins);
        const record = {
          code,
          url,
          createdAt,
          expiresAt,
          validityMins: mins,
          clicks: 0,
        };
        results.push(record);
      });

      // persist via reducer
      dispatch({ type: ACTIONS.CREATE_MANY, payload: { results } });

      // log outcome via middleware-aware dispatch wrapper (already used above)
      return { results, errors };
    },

    getLink: (code) => state.links[code] || null,

    getAllLinks: () => Object.values(state.links).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),

    getClicks: (code) => loadClicks(code),

    addClick: (code, click) => {
      dispatch({ type: ACTIONS.REDIRECT_HIT, payload: { code, click } });
    },

    clearExpired: () => dispatch({ type: ACTIONS.CLEAR_EXPIRED }),
  }), [state, dispatch]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  return useContext(StoreCtx);
}

export { ACTIONS };


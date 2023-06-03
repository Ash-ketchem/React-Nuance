import { useSyncExternalStore } from "react";

export const create = (createStore) => {
  let globalStore = {};

  const subscribers = new Map();

  const subscribe = (key, callback) => {
    if (key && subscribers.has(key)) {
      // a valid key cannot be rewritten (used for tracking state)
      //undefined keys can be overwritten (used for setter functions)
      throw new Error("cannot have two states with same key");
    }
    subscribers.set(key, callback);
    return () => {
      subscribers.delete(key);
    };
  };
  const set = (setter, key = null) => {
    globalStore = { ...globalStore, ...setter(globalStore) };

    if (key) {
      if (Array.isArray(key)) {
        key.forEach((k) => subscribers.has(k) && subscribers.get(k)());
      } else {
        subscribers.has(key) && subscribers.get(key)();
      }
    } else {
      subscribers.forEach((value, key, map) => value());
    }
  };
  globalStore = createStore(set);

  const get = () => globalStore;

  return (selector, key, serverSnapshot = null) => {
    if (typeof selector === "function") {
      if (!key) {
        if (typeof selector(get()) !== "function") {
          while (true) {
            key = crypto.randomUUID();
            if (!subscribers.has(key)) {
              break;
            }
          }
        }
      }

      const state = useSyncExternalStore(
        (callback) => subscribe(key, callback),
        () => selector(get()),
        () => (serverSnapshot ? serverSnapshot : selector(get()))
      );

      return state;
    } else if (Array.isArray(selector)) {
      return selector.map((s) =>
        useSyncExternalStore(
          (callback) => subscribe(key, callback),
          () => get()[s],
          () => (serverSnapshot ? serverSnapshot : get()[s])
        )
      );
    } else {
      return [get(), set];
    }
  };
};

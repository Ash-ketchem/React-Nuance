import { useSyncExternalStore } from "react";

export const create = (createStore) => {
  let globalStore = {};

  const subscribers = new Map();

  const subscribe = (key, callback) => {
    let callbacks = null;
    try {
      if (!key) return;

      callbacks = subscribers.get(key);

      if (!callbacks) {
        callbacks = new Set();
        subscribers.set(key, callbacks);
      }

      callbacks.add(callback);
    } catch (error) {
      console.log("error has occured in the subscription function", error);
    } finally {
      return () => {
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            subscribers.delete(key);
          }
        }
      };
    }
  };

  const set = (setter, key = null) => {
    try {
      globalStore = { ...globalStore, ...setter(globalStore) };

      if (!key) {
        subscribers.forEach((callbacks) =>
          callbacks.forEach((callback) => callback())
        );
        return;
      }

      if (Array.isArray(key)) {
        key.forEach((k) =>
          subscribers.get(k)?.forEach((callback) => callback())
        );
      } else {
        subscribers.get(key)?.forEach((callback) => callback());
      }
    } catch (error) {
      console.log("error has occured in the set function", error);
    }
  };

  globalStore = createStore(set);

  const get = () => globalStore;

  return (selector, key, serverSnapshot = null) => {
    if (!selector) {
      throw new Error("invalid selector");
    }

    if (typeof selector === "function") {
      if (!key && typeof selector(get()) !== "function") {
        // generate a random unique key
        while (true) {
          key = crypto.randomUUID();
          if (!subscribers.has(key)) {
            break;
          }
        }
      }

      const state = useSyncExternalStore(
        (callback) => subscribe(key, callback),
        () => selector(get()),
        () => serverSnapshot ?? selector(get())
      );

      return state;
    } else if (Array.isArray(selector)) {
      return selector.map((s) =>
        useSyncExternalStore(
          (callback) => subscribe(key, callback),
          () => get()[s],
          () => serverSnapshot ?? get()[s]
        )
      );
    } else {
      return [get(), set];
    }
  };
};

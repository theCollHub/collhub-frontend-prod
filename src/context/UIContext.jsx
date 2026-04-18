// src/context/UIContext.jsx
import React, { createContext, useContext, useState } from "react";

const UIContext = createContext();

export function UIProvider({ children }) {
  const [hideBottomNav, setHideBottomNav] = useState(false);
  return (
    <UIContext.Provider value={{ hideBottomNav, setHideBottomNav }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
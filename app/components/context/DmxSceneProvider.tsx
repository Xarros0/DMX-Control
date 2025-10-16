"use client";
import React, { createContext, useContext } from "react";
import useDmxScene from "../hooks/useDmxScene";

// Create a context for the DMX scene
const DmxSceneContext = createContext<ReturnType<typeof useDmxScene> | null>(null);

// Provider component
export const DmxSceneProvider = ({ children }: { children: React.ReactNode }) => {
  const scene = useDmxScene(); // ← Single shared instance
  return <DmxSceneContext.Provider value={scene}>{children}</DmxSceneContext.Provider>;
};

// Custom hook to consume the shared DMX scene
export const useDmxSceneContext = () => {
  const ctx = useContext(DmxSceneContext);
  if (!ctx) {
    throw new Error("useDmxSceneContext must be used within a DmxSceneProvider");
  }
  return ctx;
};

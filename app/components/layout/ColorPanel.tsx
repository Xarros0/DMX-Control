"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ColorPanel({
  selectedColor,
  handleColorPicker,
  rgb,
  handleRgbChange,
  presets,
  applyPreset,
  savePreset,
  deletePreset,
}) {
  return (
    <div className="col-span-4">
      <div className="bg-white p-4 rounded shadow flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold px-2">Color</div>
          <div className="text-sm text-gray-500 px-2">
            Selected: {selectedColor}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="color"
            value={selectedColor}
            onChange={handleColorPicker}
            className="w-32 h-32 border-4 border-white shadow"
          />

          <div className="flex-1 space-y-2">
            {["r", "g", "b"].map((ch) => (
              <div key={ch}>
                <Label>{ch.toUpperCase()}</Label>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  onChange={(e) => handleRgbChange(ch, Number(e.target.value))}
                />
              </div>
            ))}
          </div>

          {/* Presets */}
          <div className="flex-1">
            <div className="text-sm font-medium mb-2 px-1">Presets</div>
            <div className="grid grid-cols-2 gap-2 px-1">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className="p-2 border rounded text-sm text-left"
                >
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-500">
                    {p.type === "static" ? p.color : "Effect"}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2 px-1">
              <button
                onClick={() => deletePreset(presets[presets.length - 1]?.id)}
                className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Delete Preset -
              </button>
              <button
                onClick={savePreset}
                className="px-3 py-2 rounded bg-gray-800 text-white hover:bg-gray-700"
              >
                Save Preset +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

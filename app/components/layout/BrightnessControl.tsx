"use client";
import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  brightness: number;
  onBrightnessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  allOn: () => void;
  allOff: () => void;
};

export default function BrightnessControl({
  brightness,
  onBrightnessChange,
  allOn,
  allOff,
}: Props) {
  return (
    <div className="col-span-2">
      <div className="flex flex-col items-center gap-6 bg-white rounded shadow p-4">
        <div className="text-sm font-semibold text-gray-500">BRIGHTNESS</div>
        <div className="w-25 h-56 bg-gray-100 rounded-md flex flex-col items-center justify-center p-4">
          <div className="mb-2 text-2xl">☀️</div>
          <input
            type="range"
            min={0}
            max={100}
            value={brightness}
            onChange={onBrightnessChange}
            className="-rotate-90 h-36"
            aria-label="Brightness"
          />
          <div className="mt-2 text-sm text-gray-600">{brightness}%</div>
        </div>

        <div className="flex flex-col gap-2 w-[90%]">
          <Button onClick={allOn}>All On</Button>
          <Button
            onClick={allOff}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            All Off
          </Button>
        </div>
      </div>
    </div>
  );
}

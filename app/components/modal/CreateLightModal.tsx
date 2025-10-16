"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Control, Group } from "../types/dmx";

type Props = {
  open: boolean;
  onClose: () => void;
  groups: Group[];
  groupId: string | null;
  name: string;
  dmxAddress: number;
  controls: Control[];
  setName: (name: string) => void;
  setDmxAddress: (addr: number) => void;
  setGroupId: (id: string | null) => void;
  setControls: (controls: Control[]) => void;
  onCreate: () => void;
};

export default function CreateLightModal({
  open,
  onClose,
  groups,
  groupId,
  name,
  dmxAddress,
  controls,
  setName,
  setDmxAddress,
  setGroupId,
  setControls,
  onCreate,
}: Props) {
  if (!open) return null;

  const defaultChannels = ["Intensity", "Red", "Green", "Blue", "Pan"];

  const addControl = () => {
    const newControlName = `Channel ${controls.length + 1}`;
    setControls([...controls, { name: newControlName, value: 0 }]);
  };

  const removeControl = (idx: number) => {
    setControls(controls.filter((_, i) => i !== idx));
  };

  const updateControlName = (idx: number, newName: string) => {
    const newControls = [...controls];
    newControls[idx].name = newName;
    setControls(newControls);
  };

  const updateControlValue = (idx: number, value: number) => {
    const newControls = [...controls];
    newControls[idx].value = value;
    setControls(newControls);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[400px] max-w-full shadow-lg flex flex-col gap-4">
        <h2 className="text-lg font-bold">Create New Light</h2>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* DMX Address */}
        <div>
          <label className="block text-sm font-medium mb-1">DMX Address</label>
          <input
            type="number"
            min={1}
            max={512}
            value={dmxAddress}
            onChange={(e) => setDmxAddress(Number(e.target.value))}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Group Selector */}
        <div>
          <label className="block text-sm font-medium mb-1">Group</label>
          <select
            value={groupId ?? ""}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">Controls</label>
          {controls.map((c, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateControlName(idx, e.target.value)}
                className="border p-1 flex-1 rounded"
              />
              <input
                type="number"
                value={c.value}
                min={0}
                max={255}
                onChange={(e) => updateControlValue(idx, Number(e.target.value))}
                className="border p-1 w-20 rounded"
              />
              <Button
                type="button"
                className="text-red-500 text-xl font-bold p-1"
                onClick={() => removeControl(idx)}
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            type="button"
            className="mt-2"
            onClick={addControl}
          >
            + Add Channel
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}

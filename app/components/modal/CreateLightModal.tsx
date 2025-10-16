"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Control, Group } from "../types/dmx";
import { useChannelNames } from "../state/channelNamesState";

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
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  // ✅ Global channel name manager
  const { channelNames, addChannelName } = useChannelNames();

  // ✅ Prefill new lights with global defaults if empty
  useEffect(() => {
    if (open && controls.length === 0) {
      const defaultControls: Control[] = channelNames.map((name) => ({
        name,
        value: 0,
      }));
      setControls(defaultControls);
    }
  }, [open]); // only when modal opens

  // ✅ Collect all unique channel names across existing lights
  const existingChannelNames = useMemo(() => {
    const names = new Set<string>(channelNames);
    groups.forEach((g) =>
      g.lights.forEach((l) =>
        l.controls.forEach((c) => names.add(c.name))
      )
    );
    return Array.from(names);
  }, [groups, channelNames]);

  if (!open) return null;

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

  const handleAddNewChannel = () => {
    const trimmed = newChannelName.trim();
    if (!trimmed) return;

    // ✅ Save globally
    addChannelName(trimmed);

    // ✅ Update last channel slot with the new name
    setControls((prev) => {
      const last = [...prev];
      if (last.length > 0) {
        last[last.length - 1].name = trimmed;
      } else {
        last.push({ name: trimmed, value: 0 });
      }
      return last;
    });

    setShowNewChannelModal(false);
    setNewChannelName("");
  };

  return (
    <>
      {/* Main Modal */}
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
                {/* Channel Name Dropdown */}
                <select
                  value={c.name}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setShowNewChannelModal(true);
                    } else {
                      updateControlName(idx, e.target.value);
                    }
                  }}
                  className="border p-1 flex-1 rounded"
                >
                  {[...existingChannelNames, c.name]
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  <option value="__new__">+ New Channel...</option>
                </select>

                {/* Value */}
                <input
                  type="number"
                  value={c.value}
                  min={0}
                  max={255}
                  onChange={(e) =>
                    updateControlValue(idx, Number(e.target.value))
                  }
                  className="border p-1 w-20 rounded"
                />

                {/* Delete */}
                <Button
                  type="button"
                  className="text-red-500 text-xl font-bold p-1"
                  onClick={() => removeControl(idx)}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button type="button" className="mt-2" onClick={addControl}>
              + Add Channel
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={onClose}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
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

      {/* New Channel Modal */}
      {showNewChannelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-[300px] flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Add New Channel</h3>
            <input
              type="text"
              placeholder="Enter channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="border p-2 rounded"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowNewChannelModal(false)}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNewChannel}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

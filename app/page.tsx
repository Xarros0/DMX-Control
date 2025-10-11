"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Control = { name: string; value: number };

type Light = {
  id: string;
  name: string;
  dmxAddress: number; // 1-512
  controls: Control[]; // up to 5
  x?: number; // 0-100
  y?: number; // 0-100
  on?: boolean;
};

type Group = { id: string; name: string; color: string; lights: Light[] };

export default function Home() {
  // App state
  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const raw =
        typeof window !== "undefined" && localStorage.getItem("dmx_scene_v1");
      if (raw) {
        return JSON.parse(raw) as Group[];
      }
    } catch (e) {
      /* ignore */
    }

    // mock data initial state
    return [
      {
        id: "g1",
        name: "Group 1",
        color: "indigo",
        lights: Array.from({ length: 4 }).map((_, i) => ({
          id: `1-${i + 1}`,
          name: `Light ${i + 1}`,
          dmxAddress: i + 1,
          controls: [
            { name: "Intensity", value: 255 },
            { name: "Red", value: 0 },
            { name: "Green", value: 0 },
            { name: "Blue", value: 0 },
          ],
          on: true,
        })),
      },
      {
        id: "g2",
        name: "Group 2",
        color: "green",
        lights: Array.from({ length: 3 }).map((_, i) => ({
          id: `2-${i + 1}`,
          name: `Light ${i + 5}`,
          dmxAddress: 10 + i,
          controls: [
            { name: "Intensity", value: 200 },
            { name: "Red", value: 0 },
            { name: "Green", value: 0 },
            { name: "Blue", value: 0 },
          ],
          on: true,
        })),
      },
    ];
  });

  const [selectedScope, setSelectedScope] = useState<
    | { type: "master" }
    | { type: "group"; id: string }
    | { type: "light"; id: string }
  >({ type: "master" });

  const [presets, setPresets] = useState(() => [
    { id: "p1", name: "Rainbow", type: "effect" },
    { id: "p2", name: "Static Color", type: "static", color: "#ffffff" },
  ]);

  // selected light color / values tracked when selecting a light
  const [nextLightIndex, setNextLightIndex] = useState<number>(() => {
    // find largest light number in names like "Light N"
    let max = 0;
    for (const g of groups) {
      for (const l of g.lights) {
        const m = l.name.match(/Light\s*(\d+)/);
        if (m) max = Math.max(max, Number(m[1]));
      }
    }
    return max + 1;
  });

  const [masterBrightness, setMasterBrightness] = useState(50);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [rgb, setRgb] = useState({ r: 255, g: 255, b: 255 });

  function handleBrightnessChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setMasterBrightness(val);
    const scaled = Math.round((val / 100) * 255);
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        lights: g.lights.map((l) => ({
          ...l,
          controls: l.controls.map((c) =>
            c.name === "Intensity" ? { ...c, value: scaled } : c
          ),
        })),
      }))
    );
  }

  function allOn() {
    updateAllLights({ on: true });
  }
  function allOff() {
    updateAllLights({ on: false });
  }

  function handleColorPicker(e: React.ChangeEvent<HTMLInputElement>) {
    const hex = e.target.value;
    setSelectedColor(hex);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setRgb({ r, g, b });

    // update red/green/blue controls only
    setGroups((prev) =>
      prev.map((gr) => ({
        ...gr,
        lights: gr.lights.map((l) => ({
          ...l,
          controls: l.controls.map((c) => {
            if (c.name === "Red") return { ...c, value: r };
            if (c.name === "Green") return { ...c, value: g };
            if (c.name === "Blue") return { ...c, value: b };
            return c;
          }),
        })),
      }))
    );
  }

  function handleRgbChange(channel: "r" | "g" | "b", val: number) {
    const newRgb = { ...rgb, [channel]: val };
    setRgb(newRgb);
    const newColor = `#${[newRgb.r, newRgb.g, newRgb.b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")}`;
    setSelectedColor(newColor);
    setGroups((prev) =>
      prev.map((gr) => ({
        ...gr,
        lights: gr.lights.map((l) => ({
          ...l,
          controls: l.controls.map((c) => {
            if (c.name === "Red") return { ...c, value: newRgb.r };
            if (c.name === "Green") return { ...c, value: newRgb.g };
            if (c.name === "Blue") return { ...c, value: newRgb.b };
            return c;
          }),
        })),
      }))
    );
  }

  // Create Light modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGroupId, setModalGroupId] = useState<string | null>(null);
  const [modalDmxAddress, setModalDmxAddress] = useState<number>(1);
  const [modalControls, setModalControls] = useState<Control[]>([
    { name: "Intensity", value: 255 },
    { name: "Red", value: 0 },
    { name: "Green", value: 0 },
    { name: "Blue", value: 0 },
    { name: "Pan", value: 0 },
  ]);
  const [modalName, setModalName] = useState("");

  // save to localStorage on every groups change
  useEffect(() => {
    try {
      localStorage.setItem("dmx_scene_v1", JSON.stringify(groups));
    } catch (e) {
      /* ignore */
    }
  }, [groups]);

  // Helpers
  const allLights = useMemo(
    () => groups.flatMap((g) => g.lights.map((l) => ({ ...l, groupId: g.id }))),
    [groups]
  );

  function updateLight(
    groupId: string,
    lightId: string,
    patch: Partial<Light>
  ) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          lights: g.lights.map((l) =>
            l.id === lightId ? { ...l, ...patch } : l
          ),
        };
      })
    );
  }

  function updateAllLights(patch: Partial<Light>) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        lights: g.lights.map((l) => ({ ...l, ...patch })),
      }))
    );
  }

  // add light using modal - external addLight button will open modal with target group
  function openCreateLightModal(groupId?: string | null) {
    setModalGroupId(groupId ?? null);
    setModalDmxAddress(1);
    setModalControls([
      { name: "Intensity", value: 255 },
      { name: "Red", value: 0 },
      { name: "Green", value: 0 },
      { name: "Blue", value: 0 },
      { name: "Pan", value: 0 },
    ]);
    setModalName(`Light ${nextLightIndex}`);
    setModalOpen(true);
  }

  function createLightFromModal() {
    const targetGroupId = modalGroupId ?? groups[0]?.id;
    if (!targetGroupId) return;
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== targetGroupId) return g;
        const newLight: Light = {
          id: `${targetGroupId}-${g.lights.length + 1}`,
          name: modalName || `Light ${nextLightIndex}`,
          dmxAddress: Math.max(1, Math.min(512, Math.round(modalDmxAddress))),
          controls: modalControls.slice(0, 5),
          on: true,
        };
        return { ...g, lights: [...g.lights, newLight] };
      })
    );
    setNextLightIndex((n) => n + 1);
    setModalOpen(false);
  }

  function deleteGroup(groupId: string) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    // if selected group was deleted, fallback to master
    if (selectedScope.type === "group" && selectedScope.id === groupId)
      setSelectedScope({ type: "master" });
  }

  // GLOBAL add/delete light buttons (delete removes last light in selected group or last group)
  function addLightGlobal() {
    const groupId =
      selectedScope.type === "group" ? selectedScope.id : groups[0]?.id;
    openCreateLightModal(groupId ?? null);
  }

  function deleteLightGlobal() {
    if (selectedScope.type === "light") {
      // delete selected light
      const lightId = selectedScope.id;
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          lights: g.lights.filter((l) => l.id !== lightId),
        }))
      );
      setSelectedScope({ type: "master" });
      return;
    }
    // if group selected, remove last light in the group
    if (selectedScope.type === "group") {
      const gid = selectedScope.id;
      setGroups((prev) =>
        prev.map((g) =>
          g.id === gid ? { ...g, lights: g.lights.slice(0, -1) } : g
        )
      );
      return;
    }
    // else remove last light in last group
    setGroups((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      return prev.map((g, i) =>
        i === prev.length - 1 ? { ...g, lights: last.lights.slice(0, -1) } : g
      );
    });
  }

  // when selecting a light, load its x/y if present
  useEffect(() => {
    if (selectedScope.type === "light") {
      const l = allLights.find((x) => x.id === selectedScope.id);
      if (l) {
        setSelectedColor(
          l.controls[0]?.value !== undefined
            ? `#${Number(l.controls[0]?.value)
                .toString(16)
                .padStart(2, "0")}0000`
            : selectedColor
        );
      }
    }
  }, [selectedScope]);

  // compute group-wide control names when group selected
  const groupControlNames = useMemo(() => {
    if (selectedScope.type !== "group") return [];
    const g = groups.find((x) => x.id === selectedScope.id);
    if (!g) return [];
    // union of control names in group
    const names = new Set<string>();
    for (const l of g.lights) for (const c of l.controls) names.add(c.name);
    return Array.from(names);
  }, [selectedScope, groups]);

  // set group control -> updates that control for all lights with that control name
  function setGroupControlValue(
    groupId: string,
    controlName: string,
    value: number
  ) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          lights: g.lights.map((l) => {
            const controls = l.controls.map((c) =>
              c.name === controlName ? { ...c, value } : c
            );
            // if light lacked the control, add it to the end
            if (!controls.some((c) => c.name === controlName))
              controls.push({ name: controlName, value });
            return { ...l, controls };
          }),
        };
      })
    );
  }

  function savePreset() {
    const id = "p" + (presets.length + 1);
    setPresets((prev) => [
      ...prev,
      {
        id,
        name: `Preset ${prev.length + 1}`,
        type: "static",
        color: selectedColor,
      },
    ]);
  }

  function deletePreset(presetId) {
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
  }

  function applyPreset(p) {
    if (p.type === "static") {
      // apply static color to all lights
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          lights: g.lights.map((l) => ({ ...l, color: p.color })),
        }))
      );
      setSelectedColor(p.color);
    } else {
      // effect preset stub
      console.log("Start effect:", p.name);
    }
  }

  // This function is where you'd send values to DMX backend
  function sendToDmx() {
    const payload = { masterBrightness, groups };
    console.log("DMX payload -> send to server:", payload);
  }

  // Call sendToDmx whenever relevant state changes - for demo we just expose a button

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-[80%] mx-auto grid grid-cols-12 gap-8">
            {/* LEFT: Master brightness + controls column */}
            <aside className="col-span-2">
              <Card className="flex flex-col items-center gap-6">
                <div className="text-sm font-semibold text-gray-500">
                  BRIGHTNESS
                </div>
                <div className="w-25 h-56 bg-gray-100 rounded-md flex flex-col items-center justify-center p-4">
                  <div className="mb-2 text-2xl">☀️</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masterBrightness}
                    onChange={handleBrightnessChange}
                    className="-rotate-90 h-36"
                    aria-label="Brightness"
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    {masterBrightness}%
                  </div>
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
              </Card>
            </aside>

            {/* MIDDLE: Groups + Lights */}
            <main className="col-span-6">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-4">
                  <div className="w-20">
                    <Button
                      onClick={() => setSelectedScope({ type: "master" })}
                      className={
                        selectedScope.type === "master"
                          ? "bg-gray-800 text-white"
                          : ""
                      }
                    >
                      Master
                    </Button>
                  </div>
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className={`rounded border-2 p-3
                        ${
                          group.color === "indigo"
                            ? "border-indigo-500 bg-indigo-50"
                            : ""
                        }
                        ${
                          group.color === "green"
                            ? "border-green-400 bg-green-50"
                            : ""
                        }
                        ${
                          group.color === "red"
                            ? "border-red-400 bg-red-50"
                            : ""
                        }
                        ${
                          group.color === "amber"
                            ? "border-amber-300 bg-amber-50"
                            : ""
                        }
                        ${
                          group.color === "blue"
                            ? "border-blue-400 bg-blue-50"
                            : ""
                        }
                        ${
                          group.color === "purple"
                            ? "border-purple-400 bg-purple-50"
                            : ""
                        }
                        ${
                          group.color === "pink"
                            ? "border-pink-400 bg-pink-50"
                            : ""
                        }
                        ${
                          group.color === "teal"
                            ? "border-teal-400 bg-teal-50"
                            : ""
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="select-group"
                              checked={
                                selectedScope.type === "group" &&
                                selectedScope.id === group.id
                              }
                              onChange={() =>
                                setSelectedScope({
                                  type: "group",
                                  id: group.id,
                                })
                              }
                            />
                            <div className="text-sm font-semibold">
                              {group.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ({group.lights.length} lights)
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            DMX base: {group.lights[0]?.dmxAddress ?? "—"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-3">
                        {group.lights.map((light) => (
                          <div
                            key={light.id}
                            className={`p-2 border rounded bg-white shadow-sm cursor-pointer ${
                              selectedScope.type === "light" &&
                              selectedScope.id === light.id
                                ? "ring-4 ring-b  lack"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedScope({ type: "light", id: light.id })
                            }
                          >
                            <div className="text-sm text-gray-700 mb-1">
                              {light.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Addr: {light.dmxAddress}
                            </div>
                            <div className="text-sm mt-2">
                              {light.controls
                                .slice(0, 4)
                                .map((c) => `${c.name}:${c.value}`)
                                .join(" | ")}
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <input
                                  type="checkbox"
                                  checked={light.on}
                                  onChange={(e) =>
                                    updateLight(group.id, light.id, {
                                      on: e.target.checked,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="">
                    <select
                      value={
                        selectedScope.type === "group" ? selectedScope.id : ""
                      }
                      onChange={(e) =>
                        setSelectedScope({ type: "group", id: e.target.value })
                      }
                      className="flex-1 rounded border px-2"
                      aria-label="Select group"
                    >
                      <option value="">Select group</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>

                    <Button onClick={addLightGlobal}>Add Light +</Button>
                    <Button
                      onClick={deleteLightGlobal}
                      className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      Delete Light -
                    </Button>
                    <Button
                      onClick={() => {
                        // add group helper (keeps color cycling)
                        const colorOptions = [
                          "indigo",
                          "green",
                          "red",
                          "amber",
                          "blue",
                          "purple",
                          "pink",
                          "teal",
                        ];
                        setGroups((prev) => {
                          const id = `g${prev.length + 1}`;
                          const color =
                            colorOptions[prev.length % colorOptions.length];
                          return [
                            ...prev,
                            {
                              id,
                              name: `Group ${prev.length + 1}`,
                              color,
                              lights: [],
                            },
                          ];
                        });
                      }}
                    >
                      Add Group +
                    </Button>
                    <Button
                      onClick={() => deleteGroup(groups[groups.length - 1]?.id)}
                      className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      Delete Group -
                    </Button>

                    <Button
                      onClick={() => {
                        localStorage.setItem(
                          "dmx_scene_v1",
                          JSON.stringify(groups)
                        );
                      }}
                    >
                      Save Scene
                    </Button>
                    <Button
                      onClick={() => {
                        const raw = localStorage.getItem("dmx_scene_v1");
                        if (raw) setGroups(JSON.parse(raw));
                      }}
                      className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      Load Scene
                    </Button>
                  </div>
                </div>
              </div>
            </main>

            {/* RIGHT: Color picker + Presets + XY */}
            <aside className="col-span-4">
              <Card>
                <div className="flex flex-col gap-4">
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
                      <div>
                        <Label>Red</Label>
                        <input
                          type="range"
                          min={0}
                          max={255}
                          value={rgb.r}
                          onChange={(e) =>
                            handleRgbChange("r", Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label>Green</Label>
                        <input
                          type="range"
                          min={0}
                          max={255}
                          value={rgb.g}
                          onChange={(e) =>
                            handleRgbChange("g", Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label>Blue</Label>
                        <input
                          type="range"
                          min={0}
                          max={255}
                          value={rgb.b}
                          onChange={(e) =>
                            handleRgbChange("b", Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-medium mb-2 px-1">
                        Presets
                      </div>
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

                      <div className="mt-3 flex gap-2 px-1  ">
                        <button
                          onClick={() =>
                            deletePreset(presets[presets.length - 1]?.id)
                          }
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

                  <div>
                    {selectedScope.type === "master" && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">
                          Master controls
                        </div>
                        <div className="space-y-2">
                          <div>
                            Apply master brightness to all lights when sending.
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedScope.type === "group" && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">
                          Group:{" "}
                          {groups.find((g) => g.id === selectedScope.id)?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Adjust attributes shared by lights in this group
                        </div>

                        {groupControlNames.length === 0 && (
                          <div className="text-sm text-gray-500">
                            No controls in group
                          </div>
                        )}

                        {groupControlNames.map((name) => {
                          // compute initial value using first light that has the control
                          const g = groups.find(
                            (x) => x.id === selectedScope.id
                          )!;
                          const sample = g.lights.find((l) =>
                            l.controls.some((c) => c.name === name)
                          );
                          const init =
                            sample?.controls.find((c) => c.name === name)
                              ?.value ?? 0;
                          return (
                            <div key={name} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <div>{name}</div>
                                <div className="text-sm text-gray-500">
                                  {init}
                                </div>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={255}
                                defaultValue={init}
                                onChange={(e) =>
                                  setGroupControlValue(
                                    selectedScope.id,
                                    name,
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedScope.type === "light" && (
                      <div className="space-y-3 px-2">
                        {(() => {
                          const lit = allLights.find(
                            (l) => l.id === selectedScope.id
                          );
                          if (!lit) return <div>Light not found</div>;
                          const groupId = lit.groupId;
                          return (
                            <div>
                              <div className="text-sm font-medium">
                                {lit.name}
                              </div>
                              <div className="text-sm text-gray-500 mb-2">
                                DMX: {lit.dmxAddress}
                              </div>

                              {/* list controls */}
                              {lit.controls.map((c, idx) => (
                                <div key={c.name} className="space-y-1 mb-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <div>{c.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {c.value}
                                    </div>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={255}
                                    value={c.value}
                                    onChange={(e) => {
                                      const v = Number(e.target.value);
                                      // update single control in that light
                                      setGroups((prev) =>
                                        prev.map((g) =>
                                          g.id === groupId
                                            ? {
                                                ...g,
                                                lights: g.lights.map((l) =>
                                                  l.id === lit.id
                                                    ? {
                                                        ...l,
                                                        controls:
                                                          l.controls.map(
                                                            (cc, i) =>
                                                              i === idx
                                                                ? {
                                                                    ...cc,
                                                                    value: v,
                                                                  }
                                                                : cc
                                                          ),
                                                      }
                                                    : l
                                                ),
                                              }
                                            : g
                                        )
                                      );
                                    }}
                                  />
                                </div>
                              ))}

                              {/* show X/Y if present */}
                              {typeof lit.x !== "undefined" && (
                                <div className="mt-2">
                                  <div className="text-sm">X</div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={lit.x}
                                    onChange={(e) =>
                                      updateLight(lit.groupId, lit.id, {
                                        x: Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                              )}
                              {typeof lit.y !== "undefined" && (
                                <div className="mt-2">
                                  <div className="text-sm">Y</div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={lit.y}
                                    onChange={(e) =>
                                      updateLight(lit.groupId, lit.id, {
                                        y: Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                              )}

                              <div className="mt-3 flex gap-2 px-2">
                                <Button
                                  onClick={() => {
                                    /* quick jump: select group */ setSelectedScope(
                                      { type: "group", id: lit.groupId }
                                    );
                                  }}
                                >
                                  Select Group
                                </Button>
                                <Button
                                  onClick={() => {
                                    /* remember state already in groups */ setGroups(
                                      (prev) => prev
                                    );
                                  }}
                                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                                >
                                  Save Light
                                </Button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 px-2">
                    <Button onClick={sendToDmx}>Send to DMX</Button>
                  </div>
                </div>
              </Card>
            </aside>
          </div>

          {/* Modal for creating lights */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded shadow p-6 w-[520px] max-w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">Create Light</div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-sm text-gray-500"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Light name</Label>
                    <Input
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>DMX address (1-512)</Label>
                    <input
                      type="number"
                      min={1}
                      max={512}
                      value={modalDmxAddress}
                      onChange={(e) =>
                        setModalDmxAddress(Number(e.target.value))
                      }
                      className="w-full rounded border px-2 py-1"
                    />
                  </div>

                  <div>
                    <Label>Assign to Group</Label>
                    <select
                      value={modalGroupId ?? groups[0]?.id}
                      onChange={(e) => setModalGroupId(e.target.value)}
                      className="w-full rounded border px-2 py-1"
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Controls (max 5)</div>
                      <div className="text-sm text-gray-500">
                        Name + DMX value (0-255)
                      </div>
                    </div>
                    <div className="space-y-2 mt-2">
                      {modalControls.map((c, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            className="flex-1 rounded border px-2 py-1"
                            value={c.name}
                            onChange={(e) =>
                              setModalControls((prev) =>
                                prev.map((x, idx) =>
                                  idx === i ? { ...x, name: e.target.value } : x
                                )
                              )
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={c.value}
                            onChange={(e) =>
                              setModalControls((prev) =>
                                prev.map((x, idx) =>
                                  idx === i
                                    ? { ...x, value: Number(e.target.value) }
                                    : x
                                )
                              )
                            }
                            className="w-24 rounded border px-2 py-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      onClick={() => {
                        setModalOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={createLightFromModal}>Create Light</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* small debug footer */}
          <div className="max-w-[1200px] mx-auto mt-6">
            <Card>
              <CardContent>
                <div className="text-sm text-gray-700">
                  Selected:{" "}
                  {selectedScope.type === "master"
                    ? "Master"
                    : selectedScope.type === "group"
                    ? `Group ${selectedScope.id}`
                    : `Light ${selectedScope.id}`}
                </div>
                <pre className="mt-2 text-sm text-gray-700 bg-gray-100 p-2 rounded">
                  {JSON.stringify({ groups, masterBrightness }, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

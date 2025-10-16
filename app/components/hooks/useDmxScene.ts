"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Control, Group, Light } from "../types/dmx";

export default function useDMXScene() {
  // ────────────────────────────────
  // STATE
  // ────────────────────────────────
  type Preset =
  | { id: string; name: string; type: "effect" }
  | { id: string; name: string; type: "static"; color: string };

  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const raw =
        typeof window !== "undefined" && localStorage.getItem("dmx_scene_v1");
      if (raw) return JSON.parse(raw) as Group[];
    } catch {}
    // fallback demo data
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
    ];
  });

  const [selectedScope, setSelectedScope] = useState<
    | { type: "master" }
    | { type: "group"; id: string }
    | { type: "light"; id: string }
  >({ type: "master" });

  const [presets, setPresets] = useState<Preset[]>([
    { id: "p1", name: "Rainbow", type: "effect" },
    { id: "p2", name: "Static Color", type: "static", color: "#ffffff" },
  ]);

  const [masterBrightness, setMasterBrightness] = useState(50);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [rgb, setRgb] = useState({ r: 255, g: 255, b: 255 });
  const router = useRouter();

  // ────────────────────────────────
  // MODAL STATE
  // ────────────────────────────────
  const defaultChannels: Control[] = [
    { name: "Intensity", value: 255 },
    { name: "Red", value: 0 },
    { name: "Green", value: 0 },
    { name: "Blue", value: 0 },
    { name: "Pan", value: 0 },
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [modalGroupId, setModalGroupId] = useState<string | null>(null);
  const [modalDmxAddress, setModalDmxAddress] = useState<number>(1);
  const [modalControls, setModalControls] = useState<Control[]>([
    ...defaultChannels,
  ]);
  const [modalName, setModalName] = useState("");

  // ────────────────────────────────
  // HELPERS
  // ────────────────────────────────
  const allLights = useMemo(
    () => groups.flatMap((g) => g.lights.map((l) => ({ ...l, groupId: g.id }))),
    [groups]
  );

  // Determine the next default "Light N" number for a given group based on existing names
  const getNextLightNumberForGroup = (groupId: string): number => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return 1;
    let maxNum = 0;
    for (const l of group.lights) {
      const m = /^Light\s+(\d+)$/i.exec(l.name?.trim() ?? "");
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n)) maxNum = Math.max(maxNum, n);
      }
    }
    return maxNum + 1;
  };

  // Determine the next numeric suffix for light id `${groupId}-N` within a group (avoids collisions if some were deleted)
  const getNextLightIdSuffixForGroup = (groupId: string): number => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return 1;
    let maxId = 0;
    const re = new RegExp(
      `^${groupId.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}-(\\d+)$`
    );
    for (const l of group.lights) {
      const m = re.exec(l.id);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n)) maxId = Math.max(maxId, n);
      }
    }
    // Also consider simple append by length+1 to keep continuity if none matched
    return Math.max(maxId + 1, group.lights.length + 1);
  };

  function updateLight(
    groupId: string,
    lightId: string,
    patch: Partial<Light>
  ) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              lights: g.lights.map((l) =>
                l.id === lightId ? { ...l, ...patch } : l
              ),
            }
          : g
      )
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

  // ────────────────────────────────
  // HANDLERS
  // ────────────────────────────────
  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const allOn = () => updateAllLights({ on: true });
  const allOff = () => updateAllLights({ on: false });

  const handleColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setSelectedColor(hex);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setRgb({ r, g, b });

    setGroups((prev) =>
      prev.map((gr) => {
        if (selectedScope.type === "master") {
          // Apply to all lights
          return {
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
          };
        }

        if (selectedScope.type === "group" && gr.id === selectedScope.id) {
          // Apply only to this group
          return {
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
          };
        }

        if (selectedScope.type === "light") {
          // Apply only to selected light
          return {
            ...gr,
            lights: gr.lights.map((l) =>
              l.id === selectedScope.id
                ? {
                    ...l,
                    controls: l.controls.map((c) => {
                      if (c.name === "Red") return { ...c, value: r };
                      if (c.name === "Green") return { ...c, value: g };
                      if (c.name === "Blue") return { ...c, value: b };
                      return c;
                    }),
                  }
                : l
            ),
          };
        }

        return gr;
      })
    );
  };

  const handleRgbChange = (channel: "r" | "g" | "b", val: number) => {
    const newRgb = { ...rgb, [channel]: val };
    setRgb(newRgb);
    const newColor = `#${[newRgb.r, newRgb.g, newRgb.b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")}`;
    setSelectedColor(newColor);

    setGroups((prev) =>
      prev.map((gr) => {
        if (selectedScope.type === "master") {
          // Apply to all lights
          return {
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
          };
        }

        if (selectedScope.type === "group" && gr.id === selectedScope.id) {
          // Apply to all lights in this group
          return {
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
          };
        }

        if (selectedScope.type === "light") {
          // Apply to only this light
          return {
            ...gr,
            lights: gr.lights.map((l) =>
              l.id === selectedScope.id
                ? {
                    ...l,
                    controls: l.controls.map((c) => {
                      if (c.name === "Red") return { ...c, value: newRgb.r };
                      if (c.name === "Green") return { ...c, value: newRgb.g };
                      if (c.name === "Blue") return { ...c, value: newRgb.b };
                      return c;
                    }),
                  }
                : l
            ),
          };
        }

        return gr;
      })
    );
  };

  const openCreateLightModal = (groupId?: string | null) => {
    const targetGroupId = groupId ?? groups[0]?.id ?? null;
    setModalGroupId(targetGroupId);
    setModalDmxAddress(1);
    setModalControls([...defaultChannels]);
    const nextNum = targetGroupId
      ? getNextLightNumberForGroup(targetGroupId)
      : 1;
    setModalName(`Light ${nextNum}`);
    setModalOpen(true);
  };

  const createLightFromModal = () => {
    const targetGroupId = modalGroupId ?? groups[0]?.id;
    if (!targetGroupId) return;
    const nextIdSuffix = getNextLightIdSuffixForGroup(targetGroupId);
    const defaultName = `Light ${getNextLightNumberForGroup(targetGroupId)}`;
    const finalName = (modalName || "").trim() || defaultName;

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== targetGroupId) return g;
        const newLight: Light = {
          id: `${targetGroupId}-${nextIdSuffix}`,
          name: finalName,
          dmxAddress: Math.max(1, Math.min(512, Math.round(modalDmxAddress))),
          controls: modalControls,
          on: true,
        };
        return { ...g, lights: [...g.lights, newLight] };
      })
    );
    setModalOpen(false);
  };

  // addControl/removeControl were unused here; channel management happens inside CreateLightModal

  const deleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (selectedScope.type === "group" && selectedScope.id === groupId)
      setSelectedScope({ type: "master" });
  };

  const addLightGlobal = () => {
    const groupId =
      selectedScope.type === "group" ? selectedScope.id : groups[0]?.id;
    openCreateLightModal(groupId ?? null);
  };

  const deleteLightGlobal = () => {
    if (selectedScope.type === "light") {
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
    if (selectedScope.type === "group") {
      const gid = selectedScope.id;
      setGroups((prev) =>
        prev.map((g) =>
          g.id === gid ? { ...g, lights: g.lights.slice(0, -1) } : g
        )
      );
      return;
    }
  };

  const groupControlNames = useMemo(() => {
    if (selectedScope.type !== "group") return [];
    const g = groups.find((x) => x.id === selectedScope.id);
    if (!g) return [];
    const names = new Set<string>();
    for (const l of g.lights) for (const c of l.controls) names.add(c.name);
    return Array.from(names);
  }, [selectedScope, groups]);

  const setGroupControlValue = (
    groupId: string,
    controlName: string,
    value: number
  ) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              lights: g.lights.map((l) => {
                const controls = l.controls.map((c) =>
                  c.name === controlName ? { ...c, value } : c
                );
                return { ...l, controls };
              }),
            }
      )
    );
  };

  const savePreset = () => {
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
  };

  const deletePreset = (presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  const applyPreset = (p: Preset) => {
    if (p.type === "static") {
      const hex = p.color;
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;
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
      setSelectedColor(hex);
      setRgb({ r, g, b });
    } else {
      console.log("Start effect:", p.name);
    }
  };

  const sendToDmx = () => {
    console.log("DMX payload:", { masterBrightness, groups });
  };

  useEffect(() => {
    if (selectedScope.type === "light") {
      const light = allLights.find((l) => l.id === selectedScope.id);
      if (!light) return;

      const red = light.controls.find((c) => c.name === "Red")?.value ?? 0;
      const green = light.controls.find((c) => c.name === "Green")?.value ?? 0;
      const blue = light.controls.find((c) => c.name === "Blue")?.value ?? 0;

      setRgb({ r: red, g: green, b: blue });
      setSelectedColor(
        `#${[red, green, blue]
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("")}`
      );
    }

    if (selectedScope.type === "group") {
      const group = groups.find((g) => g.id === selectedScope.id);
      if (!group) return;

      // For groups, we can take the first light's color as representative
      const firstLight = group.lights[0];
      if (!firstLight) return;

      const red = firstLight.controls.find((c) => c.name === "Red")?.value ?? 0;
      const green =
        firstLight.controls.find((c) => c.name === "Green")?.value ?? 0;
      const blue =
        firstLight.controls.find((c) => c.name === "Blue")?.value ?? 0;

      setRgb({ r: red, g: green, b: blue });
      setSelectedColor(
        `#${[red, green, blue]
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("")}`
      );
    }
  }, [selectedScope, groups, allLights]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("dmx_scene_v1", JSON.stringify(groups));
    } catch {}
  }, [groups]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      router.push("/mobile");
    }
  }, []);

  // ────────────────────────────────
  // EXPORT
  // ────────────────────────────────
  return {
    groups,
    setGroups,
    selectedScope,
    setSelectedScope,
    allLights,
    masterBrightness,
    handleBrightnessChange,
    allOn,
    allOff,
    selectedColor,
    setSelectedColor,
    handleColorPicker,
    rgb,
    setRgb,
    handleRgbChange,
    presets,
    applyPreset,
    savePreset,
    deletePreset,
    modalOpen,
    setModalOpen,
    modalGroupId,
    setModalGroupId,
    modalDmxAddress,
    setModalDmxAddress,
    modalControls,
    setModalControls,
    modalName,
    setModalName,
    openCreateLightModal,
    createLightFromModal,
    updateLight,
    updateAllLights,
    addLightGlobal,
    deleteLightGlobal,
    groupControlNames,
    setGroupControlValue,
    deleteGroup,
    sendToDmx,

  };
}
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Group, Light } from "../types/dmx";

type Props = {
  selectedScope:
    | { type: "master" }
    | { type: "group"; id: string }
    | { type: "light"; id: string };
  groups: Group[];
  allLights: (Light & { groupId: string })[];
  setRgb: (rgb: { r: number; g: number; b: number }) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  groupControlNames: string[];
  setGroupControlValue: (
    groupId: string,
    controlName: string,
    value: number
  ) => void;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  updateLight: (
    groupId: string,
    lightId: string,
    patch: Partial<Light>
  ) => void;
  setSelectedScope: (scope: any) => void;
  sendToDmx: () => void;
};

export default function LightDetailPanel({
  selectedScope,
  groups,
  allLights,
  setRgb,
  selectedColor,
  setSelectedColor,
  groupControlNames,
  setGroupControlValue,
  setGroups,
  updateLight,
  setSelectedScope,
  sendToDmx,
}: Props) {
  return (
    <div className="col-span-4">
      <div className="bg-white p-4 rounded shadow flex flex-col gap-4">
        {selectedScope.type === "master" && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Master controls</div>
            <div className="text-sm text-gray-500">
              Apply master brightness to all lights when sending.
            </div>
          </div>
        )}

        {selectedScope.type === "group" &&
          (() => {
            const g = groups.find((x) => x.id === selectedScope.id);
            if (!g) return null;
            return (
              <div className="space-y-3">
                <div className="text-sm font-medium">Group: {g.name}</div>
                <div className="text-sm text-gray-500">
                  Adjust attributes shared by lights in this group.
                </div>

                {groupControlNames.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No controls in group
                  </div>
                )}

                {groupControlNames.map((name) => {
                  const sample = g.lights.find((l) =>
                    l.controls.some((c) => c.name === name)
                  );
                  const init =
                    sample?.controls.find((c) => c.name === name)?.value ?? 0;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div>{name}</div>
                        <div className="text-sm text-gray-500">{init}</div>
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
            );
          })()}

        {selectedScope.type === "light" &&
          (() => {
            const lit = allLights.find((l) => l.id === selectedScope.id);
            if (!lit) return <div>Light not found</div>;
            const groupId = lit.groupId;

            return (
              <div className="space-y-3">
                <div className="text-sm font-medium">{lit.name}</div>
                <div className="text-sm text-gray-500 mb-2">
                  DMX: {lit.dmxAddress}
                </div>

                {lit.controls.map((c, idx) => (
                  <div key={c.name} className="space-y-1 mb-2">
                    <div className="flex items-center justify-between text-sm">
                      <div>{c.name}</div>
                      <div className="text-sm text-gray-500">{c.value}</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={c.value}
                      onChange={(e) => {
                        const v = Number(e.target.value);

                        // Update light's controls
                        setGroups((prev) =>
                          prev.map((g) =>
                            g.id === groupId
                              ? {
                                  ...g,
                                  lights: g.lights.map((l) =>
                                    l.id === lit.id
                                      ? {
                                          ...l,
                                          controls: l.controls.map((cc, i) =>
                                            i === idx ? { ...cc, value: v } : cc
                                          ),
                                        }
                                      : l
                                  ),
                                }
                              : g
                          )
                        );

                        // Update rgb / selectedColor if changing RGB
                        if (
                          c.name === "Red" ||
                          c.name === "Green" ||
                          c.name === "Blue"
                        ) {
                          const newRgb = {
                            r:
                              c.name === "Red"
                                ? v
                                : lit.controls.find((x) => x.name === "Red")
                                    ?.value ?? 0,
                            g:
                              c.name === "Green"
                                ? v
                                : lit.controls.find((x) => x.name === "Green")
                                    ?.value ?? 0,
                            b:
                              c.name === "Blue"
                                ? v
                                : lit.controls.find((x) => x.name === "Blue")
                                    ?.value ?? 0,
                          };
                          // Update parent states
                          setRgb(newRgb);
                          setSelectedColor(
                            `#${[newRgb.r, newRgb.g, newRgb.b]
                              .map((x) => x.toString(16).padStart(2, "0"))
                              .join("")}`
                          );
                        }
                      }}
                    />
                  </div>
                ))}

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

                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() =>
                      setSelectedScope({ type: "group", id: lit.groupId })
                    }
                  >
                    Select Group
                  </Button>
                  <Button
                    onClick={() => setGroups((prev) => prev)}
                    className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                  >
                    Save Light
                  </Button>
                </div>
              </div>
            );
          })()}

        <div className="mt-2">
          <Button onClick={sendToDmx}>Send to DMX</Button>
        </div>
      </div>
    </div>
  );
}

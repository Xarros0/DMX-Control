"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Group, Light } from "../types/dmx";

type Props = {
  groups: Group[];
  selectedScope: any;
  setSelectedScope: (scope: any) => void;
  addLightGlobal: () => void;
  updateLight: (
    groupId: string,
    lightId: string,
    patch: Partial<Light>
  ) => void;
  deleteLightGlobal: () => void;
  deleteGroup: (groupId: string) => void;
  openCreateGroup: () => void;
};

export default function GroupList({
  groups,
  selectedScope,
  setSelectedScope,
  updateLight,
  addLightGlobal,
  deleteLightGlobal,
  deleteGroup,
  openCreateGroup,
}: Props) {
  return (
    <div className="col-span-6">
      <div className="space-y-4">
        <div className="w-20">
          <Button
            onClick={() => setSelectedScope({ type: "master" })}
            className={
              selectedScope.type === "master" ? "bg-gray-800 text-white" : ""
            }
          >
            Master
          </Button>
        </div>

        {groups.map((group) => (
          <div
            key={group.id}
            className={`rounded border-2 p-3 ${
              group.color === "indigo"
                ? "border-indigo-500 bg-indigo-50"
                : group.color === "green"
                ? "border-green-400 bg-green-50"
                : group.color === "red"
                ? "border-red-400 bg-red-50"
                : group.color === "amber"
                ? "border-amber-300 bg-amber-50"
                : group.color === "blue"
                ? "border-blue-400 bg-blue-50"
                : group.color === "purple"
                ? "border-purple-400 bg-purple-50"
                : group.color === "pink"
                ? "border-pink-400 bg-pink-50"
                : "border-teal-400 bg-teal-50"
            }`}
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
                      setSelectedScope({ type: "group", id: group.id })
                    }
                  />
                  <div>{group.name}</div>
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
                  onClick={() =>
                    setSelectedScope({ type: "light", id: light.id })
                  }
                  className={`p-2 border rounded bg-white shadow-sm cursor-pointer ${
                    selectedScope.type === "light" &&
                    selectedScope.id === light.id
                      ? "ring-4 ring-black"
                      : ""
                  }`}
                >
                  <div className="text-sm font-medium">{light.name}</div>
                  <div className="text-sm text-gray-500">
                    Addr: {light.dmxAddress}
                  </div>
                  <div className="text-sm mt-1">
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

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={addLightGlobal}>Add Light +</Button>
          <Button
            onClick={deleteLightGlobal}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Delete Light -
          </Button>
          <Button onClick={openCreateGroup}>Add Group +</Button>
          <Button
            onClick={() => {
              if (selectedScope.type === "group") {
                deleteGroup(selectedScope.id);
                setSelectedScope({ type: "master" }); // optional: reset selection
              }
            }}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Delete Group -
          </Button>
        </div>
      </div>
    </div>
  );
}

  "use client";
  import React from "react";
  import { Card, CardContent } from "@/components/ui/card";
  import BrightnessControl from "./components/layout/BrightnessControl";
  import GroupList from "./components/layout/GroupList";
  import ColorPanel from "./components/layout/ColorPanel";
  import LightDetailPanel from "./components/layout/LightDetailPanel";
  import CreateLightModal from "./components/modal/CreateLightModal";
  import { useDmxSceneContext } from "./components/context/DmxSceneProvider";

  export default function Home() {
    const scene = useDmxSceneContext();
    // ────────────────────────────────
    // RENDER
    // ────────────────────────────────
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-[100%] mx-auto grid grid-cols-12 gap-4">
              <BrightnessControl
                brightness={scene.masterBrightness}
                onBrightnessChange={scene.handleBrightnessChange}
                allOn={scene.allOn}
                allOff={scene.allOff}
              />

              <GroupList
                groups={scene.groups}
                selectedScope={scene.selectedScope}
                setSelectedScope={scene.setSelectedScope}
                addLightGlobal={scene.addLightGlobal}
                updateLight={scene.updateLight}
                deleteLightGlobal={scene.deleteLightGlobal}
                deleteGroup={scene.deleteGroup}
                openCreateGroup={() => {
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
                  scene.setGroups((prev) => {
                    const id = `g${prev.length + 1}`;
                    const color = colorOptions[prev.length % colorOptions.length];
                    return [
                      ...prev,
                      { id, name: `Group ${prev.length + 1}`, color, lights: [] },
                    ];
                  });
                }}
              />

              <aside className="col-span-4">
                <div className="flex flex-col gap-4">
                  <ColorPanel
                    selectedColor={scene.selectedColor}
                    handleColorPicker={scene.handleColorPicker}
                    rgb={scene.rgb}
                    handleRgbChange={scene.handleRgbChange}
                    presets={scene.presets}
                    applyPreset={scene.applyPreset}
                    savePreset={scene.savePreset}
                    deletePreset={scene.deletePreset}
                  />
                  <LightDetailPanel
                    selectedScope={scene.selectedScope}
                    groups={scene.groups}
                    allLights={scene.allLights}
                    setRgb={scene.setRgb}
                    selectedColor={scene.selectedColor}
                    setSelectedColor={scene.setSelectedColor}
                    groupControlNames={scene.groupControlNames}
                    setGroupControlValue={scene.setGroupControlValue}
                    setGroups={scene.setGroups}
                    updateLight={scene.updateLight}
                    setSelectedScope={scene.setSelectedScope}
                    sendToDmx={scene.sendToDmx}
                  />
                </div>
              </aside>
            </div>

            <CreateLightModal
              open={scene.modalOpen}
              onClose={() => scene.setModalOpen(false)}
              groups={scene.groups}
              name={scene.modalName}
              dmxAddress={scene.modalDmxAddress}
              controls={scene.modalControls}
              groupId={scene.modalGroupId}
              setName={scene.setModalName}
              setDmxAddress={scene.setModalDmxAddress}
              setGroupId={scene.setModalGroupId}
              setControls={scene.setModalControls}
              onCreate={scene.createLightFromModal}
            />

            {/* small debug footer */}
            <div className="max-w-[1200px] mx-auto mt-6">
              <Card>
                <CardContent>
                  <div className="text-sm text-gray-700">
                    Selected:{" "}
                    {scene.selectedScope.type === "master"
                      ? "Master"
                      : scene.selectedScope.type === "group"
                      ? `Group ${scene.selectedScope.id}`
                      : `Light ${scene.selectedScope.id}`}
                  </div>
                  <pre className="mt-2 text-sm text-gray-700 bg-gray-100 p-2 rounded">
                    {JSON.stringify({ groups: scene.groups, masterBrightness: scene.masterBrightness }, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

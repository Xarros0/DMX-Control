"use client";
import React, { useState } from "react";
import BrightnessControl from "../components/layout/BrightnessControl";
import GroupList from "../components/layout/GroupList";
import ColorPanel from "../components/layout/ColorPanel";
import LightDetailPanel from "../components/layout/LightDetailPanel";
import CreateLightModal from "../components/modal/CreateLightModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDmxSceneContext } from "../components/context/DmxSceneProvider";

export default function MobilePage() {
  const scene = useDmxSceneContext(); // Shared global DMX scene logic
  const [activeTab, setActiveTab] = useState("groups");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 gap-4 pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b p-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold">DMX Controller</h1>
      </header>

      {/* Brightness + All On/Off */}
      <BrightnessControl
        brightness={scene.masterBrightness}
        onBrightnessChange={scene.handleBrightnessChange}
        allOn={scene.allOn}
        allOff={scene.allOff}
      />

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="color">Color</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* ────────────────────────────────
            GROUPS TAB
        ──────────────────────────────── */}
        <TabsContent value="groups" className="mt-4">
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
        </TabsContent>

        {/* ────────────────────────────────
            COLOR TAB
        ──────────────────────────────── */}
        <TabsContent value="color" className="mt-4">
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
        </TabsContent>

        {/* ────────────────────────────────
            DETAILS TAB
        ──────────────────────────────── */}
        <TabsContent value="details" className="mt-4">
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
        </TabsContent>
      </Tabs>

      {/* ────────────────────────────────
          LIGHT CREATION MODAL
      ──────────────────────────────── */}
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
    </div>
  );
}

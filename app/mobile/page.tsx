"use client";
import React, { useState } from "react";
import BrightnessControl from "../components/layout/BrightnessControl";
import GroupList from "../components/layout/GroupList";
import ColorPanel from "../components/layout/ColorPanel";
import LightDetailPanel from "../components/layout/LightDetailPanel";
import CreateLightModal from "../components/modal/CreateLightModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Group, Light, Control } from "../components/types/dmx";

export default function MobilePage() {
  const [activeTab, setActiveTab] = useState("groups");

  // You can import or reuse your state logic here — or use a context if you split it.
  // For this example, we’ll just stub minimal props.
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedScope, setSelectedScope] = useState<
    { type: "master" } | { type: "group"; id: string } | { type: "light"; id: string }
  >({ type: "master" });
  const [masterBrightness, setMasterBrightness] = useState(50);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 gap-4 pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b p-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold">DMX Controller</h1>
      </header>

      {/* Brightness and global controls */}
      <BrightnessControl
        brightness={masterBrightness}
        onBrightnessChange={(e) => setMasterBrightness(Number(e.target.value))}
        allOn={() => console.log("All On")}
        allOff={() => console.log("All Off")}
      />

      {/* Tabs for navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="color">Color</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Groups/Lights list */}
        <TabsContent value="groups" className="mt-4">
          <GroupList
            groups={groups}
            selectedScope={selectedScope}
            setSelectedScope={setSelectedScope}
            addLightGlobal={() => {}}
            updateLight={() => {}}
            deleteLightGlobal={() => {}}
            deleteGroup={() => {}}
            openCreateGroup={() => {}}
          />
        </TabsContent>

        {/* Color control */}
        <TabsContent value="color" className="mt-4">
          <ColorPanel
            selectedColor="#ffffff"
            handleColorPicker={() => {}}
            rgb={{ r: 255, g: 255, b: 255 }}
            handleRgbChange={() => {}}
            presets={[]}
            applyPreset={() => {}}
            savePreset={() => {}}
            deletePreset={() => {}}
          />
        </TabsContent>

        {/* Light details */}
        <TabsContent value="details" className="mt-4">
          <LightDetailPanel
            selectedScope={selectedScope}
            groups={groups}
            allLights={[]}
            setRgb={() => {}}
            selectedColor="#ffffff"
            setSelectedColor={() => {}}
            groupControlNames={[]}
            setGroupControlValue={() => {}}
            setGroups={setGroups}
            updateLight={() => {}}
            setSelectedScope={setSelectedScope}
            sendToDmx={() => console.log("Send DMX")}
          />
        </TabsContent>
      </Tabs>

      {/* Optional modal */}
      <CreateLightModal
        open={false}
        onClose={() => {}}
        groups={groups}
        name=""
        dmxAddress={1}
        controls={[]}
        groupId={null}
        setName={() => {}}
        setDmxAddress={() => {}}
        setGroupId={() => {}}
        setControls={() => {}}
        onCreate={() => {}}
      />
    </div>
  );
}

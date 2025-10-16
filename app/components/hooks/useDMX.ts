import { useEffect, useState } from "react";
import { Group } from "../types/dmx";

export function useDMX() {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("dmx_scene_v1");
    if (raw) setGroups(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem("dmx_scene_v1", JSON.stringify(groups));
  }, [groups]);

  return { groups, setGroups };
}

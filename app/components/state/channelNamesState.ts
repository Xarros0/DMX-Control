import { useEffect, useState } from "react";

const DEFAULT_CHANNELS = ["Intensity", "Red", "Green", "Blue", "Pan"];

export function useChannelNames() {
  const [channelNames, setChannelNames] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("channelNames");
      return saved ? JSON.parse(saved) : DEFAULT_CHANNELS;
    }
    return DEFAULT_CHANNELS;
  });

  // persist changes to localStorage
  useEffect(() => {
    localStorage.setItem("channelNames", JSON.stringify(channelNames));
  }, [channelNames]);

  const addChannelName = (name: string) => {
    if (!name.trim()) return;
    if (!channelNames.includes(name)) {
      setChannelNames([...channelNames, name]);
    }
  };

  return { channelNames, addChannelName };
}

export type Control = { name: string; value: number };

export type Light = {
  id: string;
  name: string;
  dmxAddress: number;
  controls: Control[];
  x?: number;
  y?: number;
  on?: boolean;
};

export type Group = {
  id: string;
  name: string;
  color: string;
  lights: Light[];
};

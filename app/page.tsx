'use client'
import React, { useMemo, useState } from 'react'
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

export default function Home() {
  // App state
  const [groups, setGroups] = useState(() => {
    // initial groups matching the picture
    return [
      {
        id: 'g1',
        name: 'Group 1',
        color: 'indigo',
        lights: Array.from({ length: 4 }).map((_, i) => ({ id: `1-${i+1}`, name: `Light ${i+1}`, color: '#ffffff', on: true })),
      },
      {
        id: 'g2',
        name: 'Group 2',
        color: 'green',
        lights: Array.from({ length: 3 }).map((_, i) => ({ id: `2-${i+1}`, name: `Light ${i+5}`, color: '#ffffff', on: true })),
      },
      {
        id: 'g3',
        name: 'Group 3',
        color: 'red',
        lights: Array.from({ length: 4 }).map((_, i) => ({ id: `3-${i+1}`, name: `Light ${i+8}`, color: '#ffffff', on: true })),
      },
      {
        id: 'g4',
        name: 'Group 4',
        color: 'amber',
        lights: Array.from({ length: 2 }).map((_, i) => ({ id: `4-${i+1}`, name: `Light ${i+12}`, color: '#ffffff', on: true })),
      },
    ]
  })

  const [masterBrightness, setMasterBrightness] = useState(50)
  const [selectedLight, setSelectedLight] = useState(null)
  const [selectedColor, setSelectedColor] = useState('#ffd500')
  const [presets, setPresets] = useState(() => [
    { id: 'p1', name: 'Rainbow', type: 'effect' },
    { id: 'p2', name: 'Static Color', type: 'static', color: '#ffd500' },
  ])
  const [xy, setXy] = useState({ x: 50, y: 50 })

  // Helpers
  const allLights = useMemo(() => groups.flatMap(g => g.lights.map(l => ({...l, groupId: g.id}))), [groups])

  function updateLight(groupId, lightId, patch) {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return { ...g, lights: g.lights.map(l => l.id === lightId ? { ...l, ...patch } : l) }
    }))
  }

  function addLightToGroup(groupId) {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      const nextIndex = g.lights.length + 1
      return { ...g, lights: [...g.lights, { id: `${groupId}-${nextIndex}`, name: `Light ${Math.floor(Math.random()*1000)}`, color: '#ffffff', on: true }] }
    }))
  }

  function deleteLight(groupId, lightId) {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, lights: g.lights.filter(l => l.id !== lightId) } : g))
    if (selectedLight === lightId) setSelectedLight(null)
  }

  function addGroup() {
    setGroups(prev => {
      const id = `g${prev.length + 1}`
      return [...prev, { id, name: `Group ${prev.length + 1}`, color: 'gray', lights: [] }]
    })
  }

  function deleteGroup(groupId) {
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }

  function savePreset() {
    const id = 'p' + (presets.length + 1)
    setPresets(prev => [...prev, { id, name: `Preset ${prev.length+1}`, type: 'static', color: selectedColor }])
  }

  function deletePreset(presetId) {
    setPresets(prev => prev.filter(p => p.id !== presetId))
  }

  function applyPreset(p) {
    if (p.type === 'static') {
      // apply static color to all lights
      setGroups(prev => prev.map(g => ({ ...g, lights: g.lights.map(l => ({ ...l, color: p.color })) })))
      setSelectedColor(p.color)
    } else {
      // effect preset stub
      console.log('Start effect:', p.name)
    }
  }

  // This function is where you'd send values to DMX backend
  function sendToDmx() {
    const payload = {
      masterBrightness,
      groups,
      xy,
    }
    // Replace this with WebSocket/HTTP to DMX server
    console.log('DMX payload', payload)
  }

  // Call sendToDmx whenever relevant state changes - for demo we just expose a button

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

        <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-12 gap-8">
        {/* LEFT: Master brightness + controls column */}
        <aside className="col-span-3">
          <Card className="flex flex-col items-center gap-6">
            <div className="text-sm font-semibold text-gray-500">BRIGHTNESS</div>
            <div className="w-28 h-48 bg-gray-100 rounded-md flex flex-col items-center justify-center p-4">
              <div className="mb-2 text-2xl">☀️</div>
              <input
                type="range"
                min={0}
                max={100}
                value={masterBrightness}
                onChange={e => setMasterBrightness(Number(e.target.value))}
                className="rotate-180 h-36"
                aria-label="Brightness"
              />
              <div className="mt-2 text-sm text-gray-600">{masterBrightness}%</div>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Button onClick={() => { /* master on */ }}>All On</Button>
              <Button onClick={() => { /* master off */ }} className="bg-gray-200 text-gray-800">All Off</Button>
            </div>
          </Card>
        </aside>

        {/* MIDDLE: Groups + Lights */}
        <main className="col-span-6">
          <div className="flex items-start gap-4">
            <div className="w-20">
              <div className="shadow p-2 rounded bg-white text-center text-sm">Master</div>
            </div>
            <div className="flex-1 space-y-4">
              {groups.map(group => (
                <div key={group.id} className={`rounded border-2 p-3 ${group.color === 'indigo' ? 'border-indigo-500 bg-indigo-50' : ''} ${group.color === 'green' ? 'border-green-400 bg-green-50' : ''} ${group.color === 'red' ? 'border-red-400 bg-red-50' : ''} ${group.color === 'amber' ? 'border-amber-300 bg-amber-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{group.name}</div>
                    <div className="flex gap-2">
                      <Button onClick={() => addLightToGroup(group.id)} className="px-3 py-1 text-xs">Add Light +</Button>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        className="px-3 py-1 text-xs rounded bg-gray-200"
                      >Delete Group -</button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {group.lights.map(light => (
                      <div key={light.id} className={`p-2 border rounded bg-white shadow-sm relative ${selectedLight === light.id ? 'ring-4 ring-black' : ''}`}>
                        <div className="text-xs text-gray-700 mb-2">{light.name}</div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <input
                              type="checkbox"
                              checked={light.on}
                              onChange={e => updateLight(group.id, light.id, { on: e.target.checked })}
                            />
                          </div>
                          <button
                            className="px-2 py-1 text-xs rounded bg-gray-100"
                            onClick={() => { setSelectedLight(light.id); setSelectedColor(light.color) }}
                          >Select</button>
                        </div>

                        <div className="mt-2 flex gap-2">
                          <button onClick={() => deleteLight(group.id, light.id)} className="text-xs px-2 py-1 rounded bg-red-50">-</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-4 mt-4">
                <Button onClick={addGroup}>Add Group +</Button>
                <button onClick={() => console.log('delete light (global)')} className="px-4 py-2 rounded bg-gray-200">Delete Light -</button>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT: Color picker + Presets + XY */}
        <aside className="col-span-3">
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Color</div>
                <div className="text-xs text-gray-500">Selected: {selectedColor}</div>
              </div>

              {/* color wheel placeholder - using input color for simplicity */}
              <div className="flex items-center gap-4">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-green-200 via-yellow-200 to-pink-200 shadow-inner flex items-center justify-center">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={e => { setSelectedColor(e.target.value); if (selectedLight) { const l = allLights.find(x => x.id === selectedLight); if (l) updateLight(l.groupId, l.id, { color: e.target.value }) } }}
                    className="w-24 h-24 rounded-full border-4 border-white shadow"
                    aria-label="Color picker"
                  />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium mb-2">Presets</div>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map(p => (
                      <button key={p.id} onClick={() => applyPreset(p)} className="p-2 border rounded text-sm text-left">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.type === 'static' ? p.color : 'Effect'}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button onClick={() => deletePreset(presets[presets.length-1]?.id)} className="px-3 py-2 rounded bg-gray-200">Delete Preset -</button>
                    <button onClick={savePreset} className="px-3 py-2 rounded bg-gray-800 text-white">Save Preset +</button>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Position (XY)</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500">X-axis</div>
                    <input type="range" min={0} max={100} value={xy.x} onChange={e => setXy(prev => ({ ...prev, x: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Y-axis</div>
                    <input type="range" min={0} max={100} value={xy.y} onChange={e => setXy(prev => ({ ...prev, y: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <Button onClick={sendToDmx}>Send to DMX</Button>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* small debug footer */}
      <div className="max-w-[1200px] mx-auto mt-6">
        <Card>
          <div className="text-xs text-gray-600">Selected light: {selectedLight || '—'}. Master: {masterBrightness}%</div>
          <pre className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded">{JSON.stringify({ groups, masterBrightness, selectedColor, xy }, null, 2)}</pre>
        </Card>
      </div>
    </div>
      </main>
    </div>
  );
}

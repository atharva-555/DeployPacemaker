"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Nav } from "@/components/nav"

export default function RefVoltagePage() {
  const { toast } = useToast()
  const [dacValue, setDacValue] = useState(128) // Midpoint (approx 1.65V)
  const [isLoading, setIsLoading] = useState(false)

  const ESP32_IP = "192.168.0.106" // Update as needed

  const voltage = (dacValue / 255 * 3.3).toFixed(2) // Convert to volts

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`http://${ESP32_IP}/set_ref?value=${dacValue}`)
      if (response.ok) {
        toast({
          title: "Success",
          description: `Reference voltage set to ${voltage} V`,
        })
      } else {
        throw new Error("Failed to set reference voltage")
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not connect to ESP32",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Reference Voltage Control</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div>
                <label
                  htmlFor="voltage"
                  className="block text-sm font-medium text-gray-700"
                >
                  Output Voltage (V)
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Set the reference voltage (0-3.3V)
                </p>
                <div className="mt-2">
                  <input
                    type="range"
                    id="voltage"
                    min="0"
                    max="255"
                    value={dacValue}
                    onChange={(e) => setDacValue(parseInt(e.target.value))}
                    className="w-full"
                    aria-label="Reference voltage in volts"
                  />
                  <div className="mt-2 text-center text-2xl font-bold text-indigo-600">
                    {voltage} V
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                >
                  {isLoading ? "Setting..." : "Set Voltage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
} 
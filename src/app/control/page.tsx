"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Nav } from "@/components/nav"
import { useToast } from "@/components/ui/use-toast"

export default function ControlPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const ESP32_IP = "192.168.89.253" // 🔁 replace with your ESP32 IP
  const [bpm, setBpm] = useState(60)
  const [dacValue, setDacValue] = useState(128) // Midpoint (approx 1.65V)
  const [pacingVoltage, setPacingVoltage] = useState(128) // Midpoint for pacing voltage
  const [isLoadingBpm, setIsLoadingBpm] = useState(false)
  const [isLoadingSensitivity, setIsLoadingSensitivity] = useState(false)
  const [isLoadingPacingVoltage, setIsLoadingPacingVoltage] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState("")
  const [naturalPulseCount, setNaturalPulseCount] = useState(0)
  const [isStimulated, setIsStimulated] = useState(false)
  const [pulseWidth, setPulseWidth] = useState(300)
  const [isLoadingPulseWidth, setIsLoadingPulseWidth] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [stimulatedPulseCount, setStimulatedPulseCount] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }
  }, [status, router])

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    let isPolling = true;
    
    const pollStatus = async () => {
      if (!isPolling) return;
      
      try {
        const response = await fetch(`http://${ESP32_IP}/status`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(2000)
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log("ESP32 Status Data Received:", data);
          console.log("Received pulseWidth from ESP32:", data.pulseWidth);
          setIsConnected(true)
          setLastEvent(data.lastEvent)
          setIsStimulated(data.stimulated)
          setNaturalPulseCount(data.naturalPulseCount)
          setPulseWidth(data.pulseWidth || 300)
          setStimulatedPulseCount(data.stimulatedPulseCount || 0)
          setLastUpdateTime(formatTime(Date.now()))
          retryCount = 0
          setConnectionAttempts(0)
        } else {
          console.log('Status response not OK:', response.status)
          setIsConnected(false)
          retryCount++
          setConnectionAttempts(prev => prev + 1)
        }
      } catch (error) {
        console.error('Connection error:', error)
        setIsConnected(false)
        retryCount++
        setConnectionAttempts(prev => prev + 1)
      }
    }

    const interval = setInterval(() => {
      if (retryCount < maxRetries) {
        pollStatus()
      } else {
        console.log('Max retries reached, attempting to reconnect...')
        // Try to reconnect after a delay
        setTimeout(() => {
          retryCount = 0
          pollStatus()
        }, 5000) // Wait 5 seconds before retrying
      }
    }, 500) // Poll more frequently (every 500ms)

    // Initial poll
    pollStatus()

    return () => {
      isPolling = false
      clearInterval(interval)
    }
  }, [])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    return null
  }

  const voltage = (dacValue / 255 * 3.3).toFixed(2) // Convert to volts
  const pacingVoltageDisplay = (pacingVoltage / 255 * 3.3).toFixed(2)

  const handleBpmSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingBpm(true)

    try {
      console.log(`Attempting to set BPM to ${bpm} at http://${ESP32_IP}/set_bpm`)
      const response = await fetch(`http://${ESP32_IP}/set_bpm?bpm=${bpm}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain',
        }
      })
      const text = await response.text()
      console.log('Response status:', response.status)
      console.log('Response text:', text)
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `BPM set to ${bpm}`,
        })
      } else {
        toast({
          title: "Error",
          description: text || "Failed to set BPM",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to ESP32. Please check the connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingBpm(false)
    }
  }

  const handleSensitivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingSensitivity(true)

    try {
      console.log(`Attempting to set sensitivity to ${dacValue} at http://${ESP32_IP}/set_ref`)
      const response = await fetch(`http://${ESP32_IP}/set_ref?value=${dacValue}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain',
        }
      })
      const text = await response.text()
      console.log('Response status:', response.status)
      console.log('Response text:', text)
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Sensitivity set to ${voltage}V`,
        })
      } else {
        toast({
          title: "Error",
          description: text || "Failed to set sensitivity",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to ESP32. Please check the connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSensitivity(false)
    }
  }

  const handlePacingVoltageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingPacingVoltage(true)

    try {
      console.log(`Attempting to set pacing voltage to ${pacingVoltage} at http://${ESP32_IP}/set_pacing_voltage`)
      const response = await fetch(`http://${ESP32_IP}/set_pacing_voltage?value=${pacingVoltage}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain',
        }
      })
      const text = await response.text()
      console.log('Response status:', response.status)
      console.log('Response text:', text)
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Pacing voltage set to ${(pacingVoltage / 255 * 3.3).toFixed(2)}V`,
        })
      } else {
        toast({
          title: "Error",
          description: text || "Failed to set pacing voltage",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to ESP32. Please check the connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPacingVoltage(false)
    }
  }

  const handlePulseWidthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingPulseWidth(true)

    try {
      console.log(`Attempting to set pulse width to ${pulseWidth}ms at http://${ESP32_IP}/set_pulse_width`)
      const response = await fetch(`http://${ESP32_IP}/set_pulse_width?width=${pulseWidth}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain',
        }
      })
      const text = await response.text()
      console.log('Response status:', response.status)
      console.log('Response text:', text)
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Pulse width set to ${pulseWidth}ms`,
        })
      } else {
        toast({
          title: "Error",
          description: text || "Failed to set pulse width",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to ESP32. Please check the connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPulseWidth(false)
    }
  }

  // Add this new function to format the timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            {/* Header with Connection Status */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Pacemaker Control Panel</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {isConnected ? 'Connected' : 'Disconnected - Retrying...'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Last Update: {lastUpdateTime || 'Never'}
                </div>
              </div>
            </div>

            {/* Real-time Status Dashboard */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Real-time Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Connection Status Card */}
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Connection Status</div>
                  <div className="flex items-center justify-between">
                    <div className={`text-lg font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-1">
                      <span>Attempts:</span>
                      <span className="font-semibold">{connectionAttempts}</span>
                    </div>
                  </div>
                </div>

                {/* Stimulation Status Card */}
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Stimulation Status</div>
                  <div className="text-lg font-semibold">
                    <span className={isStimulated ? 'text-red-600' : 'text-green-600'}>
                      {isStimulated ? 'Stimulating' : 'Natural Rhythm'}
                    </span>
                  </div>
                </div>

                {/* Natural Pulse Count Card */}
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Stimulated Pulses</div>
                  <div className="text-lg font-semibold text-indigo-600">
                    {stimulatedPulseCount}
                  </div>
                </div>

                {/* Pulse Width Card */}
                <div className="bg-white rounded-lg border p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Current Pulse Width</div>
                  <div className="text-lg font-semibold text-indigo-600">
                    {pulseWidth} ms
                  </div>
                </div>
              </div>
            </div>

            {/* Event Log */}
            <div className="mb-8 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Event Log</h3>
              <div className="bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-600">Last Event:</p>
                <p className="font-medium mt-1">{lastEvent || 'No events yet'}</p>
              </div>
            </div>

            {/* Control Forms */}
            <div className="mt-6 space-y-8">
              {/* BPM Control - Temporarily Disabled
              <form onSubmit={handleBpmSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="bpm"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Target Heart Rate (BPM)
                  </label>
                  <div className="mt-2">
                    <input
                      type="range"
                      id="bpm"
                      name="bpm"
                      min="30"
                      max="180"
                      value={bpm}
                      onChange={(e) => setBpm(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="mt-2 text-center text-2xl font-bold text-indigo-600">
                      {bpm} BPM
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoadingBpm}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                  >
                    {isLoadingBpm ? "Setting..." : "Set BPM"}
                  </button>
                </div>
              </form>
              */}

              <form onSubmit={handleSensitivitySubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="sensitivity"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sensitivity (V)
                  </label>
                  <div className="mt-2">
                    <input
                      type="range"
                      id="sensitivity"
                      name="sensitivity"
                      min="0"
                      max="255"
                      value={dacValue}
                      onChange={(e) => setDacValue(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="mt-2 text-center text-2xl font-bold text-indigo-600">
                      {voltage} V
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoadingSensitivity}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                  >
                    {isLoadingSensitivity ? "Setting..." : "Set Sensitivity"}
                  </button>
                </div>
              </form>

              <form onSubmit={handlePacingVoltageSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="pacingVoltage"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Pacing Voltage (V)
                  </label>
                  <div className="mt-2">
                    <input
                      type="range"
                      id="pacingVoltage"
                      name="pacingVoltage"
                      min="0"
                      max="255"
                      value={pacingVoltage}
                      onChange={(e) => setPacingVoltage(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="mt-2 text-center text-2xl font-bold text-indigo-600">
                      {pacingVoltageDisplay} V
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoadingPacingVoltage}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                  >
                    {isLoadingPacingVoltage ? "Setting..." : "Set Pacing Voltage"}
                  </button>
                </div>
              </form>

              <form onSubmit={handlePulseWidthSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="pulseWidth"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Pulse Width (ms)
                  </label>
                  <div className="mt-2">
                    <input
                      type="range"
                      id="pulseWidth"
                      name="pulseWidth"
                      min="50"
                      max="700"
                      step="10"
                      value={pulseWidth}
                      onChange={(e) => setPulseWidth(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="mt-2 text-center text-2xl font-bold text-indigo-600">
                      {pulseWidth} ms
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoadingPulseWidth}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                  >
                    {isLoadingPulseWidth ? "Setting..." : "Set Pulse Width"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
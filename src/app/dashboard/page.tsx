"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Nav } from "@/components/nav"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Placeholder for heartbeat waveform and history data
const liveWaveformPlaceholder = [
  { uv: 400, pv: 2400, amt: 2400 },
  { uv: 300, pv: 1398, amt: 2210 },
  { uv: 200, pv: 9800, amt: 2290 },
  { uv: 278, pv: 3908, amt: 2000 },
  { uv: 189, pv: 4800, amt: 2181 },
  { uv: 239, pv: 3800, amt: 2500 },
  { uv: 349, pv: 4300, amt: 2100 },
];

const heartRateHistoryPlaceholder = [
  { time: '3:22:27 AM', bpm: 85 },
  { time: '3:22:29 AM', bpm: 65 },
  { time: '3:22:31 AM', bpm: 82 },
  { time: '3:22:33 AM', bpm: 90 },
  { time: '3:22:35 AM', bpm: 75 },
  { time: '3:22:37 AM', bpm: 88 },
  { time: '3:22:39 AM', bpm: 78 },
  { time: '3:22:41 AM', bpm: 86 },
  { time: '3:22:43 AM', bpm: 70 },
  { time: '3:22:46 AM', bpm: 68 },
];

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const ESP32_IP = "192.168.89.253" // 🔁 replace with your ESP32 IP

  const [currentHeartRate, setCurrentHeartRate] = useState(0) // Will be calculated from ESP32 data
  const [naturalPulseCount, setNaturalPulseCount] = useState(0)
  const [stimulatedPulseCount, setStimulatedPulseCount] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  const [isStimulated, setIsStimulated] = useState(false)
  const [lastEvent, setLastEvent] = useState("")
  const [pulseWidth, setPulseWidth] = useState(0)

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }

    let retryCount = 0;
    const maxRetries = 3;
    let isPolling = true;
    let lastPulseTotal = 0; // To calculate BPM difference
    let lastPollTime = Date.now();
    
    const pollStatus = async () => {
      if (!isPolling) return;
      
      try {
        const response = await fetch(`/api/esp32-proxy?path=status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(2000)
        })
        
        if (response.ok) {
          const data = await response.json()
          setIsConnected(true)
          setLastEvent(data.lastEvent)
          setIsStimulated(data.stimulated)
          setNaturalPulseCount(data.naturalPulseCount)
          setStimulatedPulseCount(data.stimulatedPulseCount)
          setPulseWidth(data.pulseWidth || 300)

          // Calculate current heart rate (BPM)
          const totalPulses = data.naturalPulseCount + data.stimulatedPulseCount;
          const currentTime = Date.now();
          const timeElapsedSeconds = (currentTime - lastPollTime) / 1000;

          if (timeElapsedSeconds > 0) {
            const pulsesSinceLastPoll = totalPulses - lastPulseTotal;
            const calculatedBPM = (pulsesSinceLastPoll / timeElapsedSeconds) * 60;
            setCurrentHeartRate(Math.round(calculatedBPM));
          } else {
            setCurrentHeartRate(0); // Cannot calculate BPM if no time elapsed
          }

          lastPulseTotal = totalPulses;
          lastPollTime = currentTime;
          setLastUpdateTime(formatTime(currentTime))
          retryCount = 0
        } else {
          console.log('Dashboard Status response not OK (via proxy):', response.status)
          setIsConnected(false)
          retryCount++
          setCurrentHeartRate(0); // Reset BPM on disconnection
        }
      } catch (error) {
        console.error('Dashboard Connection error (via proxy):', error)
        setIsConnected(false)
        retryCount++
        setCurrentHeartRate(0); // Reset BPM on connection error
      }
    }

    const interval = setInterval(() => {
      if (retryCount < maxRetries) {
        pollStatus()
      } else {
        console.log('Max retries reached on dashboard, attempting to reconnect...')
        setTimeout(() => {
          retryCount = 0
          pollStatus()
        }, 5000)
      }
    }, 1000) // Poll every 1 second for dashboard data

    pollStatus()

    return () => {
      isPolling = false
      clearInterval(interval)
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null // Or a loading spinner, as redirect is handled by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Current Heart Rate Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-1 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Current Heart Rate</h2>
            <div className="relative text-green-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-lg font-bold">{currentHeartRate}</span>
            </div>
            <div className="text-5xl font-bold text-gray-800 mb-4 flex items-center">
              {currentHeartRate} BPM
              {isConnected && (
                <span className="relative flex h-3 w-3 ml-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </div>
            <span className="inline-flex items-center rounded-md bg-gray-800 px-3 py-1 text-sm font-medium text-white">
              {isConnected ? 'Live Data' : 'Disconnected'}
            </span>
          </div>

          {/* Live Heartbeat Waveform Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-purple-700">Live Heartbeat Waveform</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={liveWaveformPlaceholder}>
                <XAxis dataKey="name" hide={true} />
                <YAxis hide={true} />
                <Tooltip />
                <Line type="monotone" dataKey="uv" stroke="#82ca9d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* New: Pulse Bifurcation and Total Counts */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Pulses Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-indigo-700">Pulse Origin & Total Beats</h2>
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium text-gray-700 flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-600">Natural Pulses:</span>
                </p>
                <p className="text-2xl font-bold text-gray-800">{naturalPulseCount}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium text-gray-700 flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-red-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6H12a2.25 2.25 0 00-2.25 2.25v10.5M12 12.75l-3 3m0 0l-3-3m3 3V12" />
                  </svg>
                  <span className="text-red-600">Stimulated Pulses:</span>
                </p>
                <p className="text-2xl font-bold text-gray-800">{stimulatedPulseCount}</p>
              </div>
              <hr className="my-3 border-gray-200" />
              <div className="flex justify-between items-center">
                <p className="text-xl font-bold text-gray-800">
                  Total Beats:
                </p>
                <p className="text-3xl font-extrabold text-blue-700">{naturalPulseCount + stimulatedPulseCount}</p>
              </div>
            </div>
          </div>

          {/* Current Status Overview Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-orange-700">Status Overview</h2>
            <div className="flex flex-col space-y-3">
              <p className="text-lg font-medium text-gray-700">
                <span className="font-bold">Connection:</span>
                <span className={`ml-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </p>
              <p className="text-lg font-medium text-gray-700">
                <span className="font-bold">Stimulation:</span>
                <span className={`ml-2 ${isStimulated ? 'text-red-600' : 'text-green-600'}`}>
                  {isStimulated ? 'Active' : 'Natural Rhythm'}
                </span>
              </p>
              <p className="text-lg font-medium text-gray-700">
                <span className="font-bold">Current Pulse Width:</span> {pulseWidth} ms
              </p>
              <p className="text-lg font-medium text-gray-700">
                <span className="font-bold">Last Event:</span> {lastEvent || 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* Heart Rate History Card */}
        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-green-700">Heart Rate History</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={heartRateHistoryPlaceholder}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="bpm" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </main>
    </div>
  )
} 
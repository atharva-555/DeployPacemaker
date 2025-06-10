import { NextRequest, NextResponse } from 'next/server';

const ESP32_IP_ADDRESS = process.env.ESP32_IP || '192.168.89.253'; // Use environment variable for production

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path'); // e.g., "status", "set_bpm", etc.

    if (!path) {
      return NextResponse.json({ error: 'Path parameter missing' }, { status: 400 });
    }

    // Reconstruct the query string for the ESP32
    let queryString = '';
    searchParams.forEach((value, key) => {
      if (key !== 'path') {
        queryString += `&${key}=${value}`;
      }
    });
    if (queryString) {
      queryString = `?${queryString.substring(1)}`; // Remove leading '&'
    }

    const esp32Url = `http://${ESP32_IP_ADDRESS}/${path}${queryString}`;
    console.log(`Proxying request to ESP32: ${esp32Url}`);

    const response = await fetch(esp32Url, {
      method: 'GET',
      // No CORS mode needed as this is server-to-server
      // Add a timeout for the server-side fetch as well
      signal: AbortSignal.timeout(5000) // 5 second timeout for proxy to ESP32
    });

    if (!response.ok) {
      console.error(`ESP32 response not OK: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      return NextResponse.json({ error: `ESP32 responded with status ${response.status}: ${errorText}` }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      return new NextResponse(text, { status: 200, headers: { 'Content-Type': contentType || 'text/plain' } });
    }

  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy failed to connect or fetch from ESP32.', details: error.message }, { status: 500 });
  }
} 
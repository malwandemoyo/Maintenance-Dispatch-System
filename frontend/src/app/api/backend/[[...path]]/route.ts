import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function proxyRequest(
  req: NextRequest,
  props: Promise<{ params: Promise<{ path?: string[] }> }>
) {
  try {
    // Extract path from params (Next.js catch-all route)
    const { params } = await props;
    const { path = [] } = await params;
    
    // Reconstruct the full path from the catch-all array
    // The original request was /api/backend/api/auth/login/
    // path array will be ['api', 'auth', 'login'] (trailing slash not included)
    // Check the original nextUrl to see if it had a trailing slash
    const originalPathname = req.nextUrl.pathname; // e.g., /api/backend/api/auth/login/
    const hasTrailingSlash = originalPathname.endsWith('/');
    
    let pathname = '/' + path.join('/');
    if (hasTrailingSlash && !pathname.endsWith('/')) {
      pathname += '/';
    }
    
    const search = req.nextUrl.search;
    const fullUrl = `${BACKEND}${pathname}${search}`;

    console.debug(`[proxy] ${req.method} ${fullUrl} (path array: ${JSON.stringify(path)}, trailing slash: ${hasTrailingSlash})`);

    // Build headers, forwarding most from the request
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'host') return;
      headers.set(key, value);
    });

    // Prepare request body for applicable methods
    let body: BodyInit | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const buffer = await req.arrayBuffer();
      if (buffer && buffer.byteLength > 0) {
        body = Buffer.from(buffer);
      }
    }

    // Fetch from Django backend
    const res = await fetch(fullUrl, {
      method: req.method,
      headers,
      body,
    });

    // Build response, preserving all headers including Set-Cookie
    const responseBody = await res.arrayBuffer();
    const response = new NextResponse(responseBody, {
      status: res.status,
      statusText: res.statusText,
    });

    // Copy all headers from backend response
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Handle Set-Cookie specially (can appear multiple times)
      if (lowerKey === 'set-cookie') {
        response.headers.append('set-cookie', value);
      } else {
        response.headers.set(key, value);
      }
    });

    return response;
  } catch (err) {
    console.error('[proxy] error:', err);
    return NextResponse.json(
      { error: 'proxy_error', detail: String(err) },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  props: Promise<{ params: Promise<{ path?: string[] }> }>
) {
  return proxyRequest(req, props);
}

export async function POST(
  req: NextRequest,
  props: Promise<{ params: Promise<{ path?: string[] }> }>
) {
  return proxyRequest(req, props);
}

export async function PUT(
  req: NextRequest,
  props: Promise<{ params: Promise<{ path?: string[] }> }>
) {
  return proxyRequest(req, props);
}

export async function PATCH(
  req: NextRequest,
  props: Promise<{ params: Promise<{ path?: string[] }> }>
) {
  return proxyRequest(req, props);
}

export async function DELETE(
  req: NextRequest,
  props: Promise<{ params: Promise<{ path?: string[] }> }>
) {
  return proxyRequest(req, props);
}

export async function HEAD(
  req: NextRequest,
  props: Promise<{ params: Promise<{ path?: string[] }> }>
) {
  return proxyRequest(req, props);
}

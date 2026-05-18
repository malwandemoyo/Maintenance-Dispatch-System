import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxyRequest(req: NextRequest, props: RouteContext) {
  try {
    // Extract path from params (Next.js catch-all route)
    const { path = [] } = await props.params;

    // Reconstruct the full path from the catch-all array
    // Check the raw request URL (from referer or reconstruct from nextUrl)
    // Use the nextUrl.href which is the full URL including search
    const nextUrlStr = req.nextUrl.href;
    const backendPrefix = "/api/backend";
    const backendPrefixIndex = nextUrlStr.indexOf(backendPrefix);

    let pathname: string;
    let search: string;

    if (backendPrefixIndex !== -1) {
      // Extract everything after /api/backend from the full URL
      const afterPrefix = nextUrlStr.substring(
        backendPrefixIndex + backendPrefix.length,
      );
      const queryIndex = afterPrefix.indexOf("?");
      if (queryIndex !== -1) {
        pathname = afterPrefix.substring(0, queryIndex);
        search = afterPrefix.substring(queryIndex);
      } else {
        pathname = afterPrefix;
        search = "";
      }
    } else {
      // Fallback: reconstruct from path array
      pathname = "/" + path.join("/");
      search = req.nextUrl.search;
    }

    // Ensure pathname is at least /
    if (!pathname) pathname = "/";

    // Django requires trailing slashes for API endpoints
    if (!pathname.endsWith("/") && pathname.startsWith("/api/")) {
      pathname += "/";
    }

    const fullUrl = `${BACKEND}${pathname}${search}`;

    console.debug(`[proxy] ${req.method} ${fullUrl}`);

    // Build headers, forwarding most from the request
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() === "host") return;
      headers.set(key, value);
    });

    // Prepare request body for applicable methods
    let body: BodyInit | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
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
      if (lowerKey === "set-cookie") {
        response.headers.append("set-cookie", value);
      } else {
        response.headers.set(key, value);
      }
    });

    return response;
  } catch (err) {
    console.error("[proxy] error:", err);
    return NextResponse.json(
      { error: "proxy_error", detail: String(err) },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest, props: RouteContext) {
  return proxyRequest(req, props);
}

export async function POST(req: NextRequest, props: RouteContext) {
  return proxyRequest(req, props);
}

export async function PUT(req: NextRequest, props: RouteContext) {
  return proxyRequest(req, props);
}

export async function DELETE(req: NextRequest, props: RouteContext) {
  return proxyRequest(req, props);
}

export async function HEAD(req: NextRequest, props: RouteContext) {
  return proxyRequest(req, props);
}

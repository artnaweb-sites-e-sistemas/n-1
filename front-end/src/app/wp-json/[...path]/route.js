import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WP_ORIGIN = "https://adminloja.n-1edicoes.org";

/** Headers hop-by-hop que não devem ser reencaminhados. */
const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

/**
 * Proxy fiel para /wp-json/* do WordPress.
 * PUT/PATCH/DELETE → POST + X-HTTP-Method-Override (IIS/GoDaddy bloqueia esses verbos).
 */
async function proxyToWordPress(request, context) {
  const { path: pathSegments } = await context.params;
  const path = Array.isArray(pathSegments) ? pathSegments.join("/") : String(pathSegments || "");
  const search = request.nextUrl?.search || new URL(request.url).search || "";
  const targetUrl = `${WP_ORIGIN}/wp-json/${path}${search}`;

  const originalMethod = request.method.toUpperCase();
  const overrideMethods = new Set(["PUT", "PATCH", "DELETE"]);
  const useOverride = overrideMethods.has(originalMethod);
  const outboundMethod = useOverride ? "POST" : originalMethod;

  const outboundHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    outboundHeaders.set(key, value);
  });

  if (useOverride) {
    outboundHeaders.set("X-HTTP-Method-Override", originalMethod);
  }

  const init = {
    method: outboundMethod,
    headers: outboundHeaders,
    redirect: "manual",
    cache: "no-store",
  };

  if (originalMethod !== "GET" && originalMethod !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  const upstream = await fetch(targetUrl, init);

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    // Evita conflito com compressão já tratada pelo runtime do Next.
    if (lower === "content-encoding") return;
    responseHeaders.set(key, value);
  });

  // HEAD: sem body na resposta.
  if (originalMethod === "HEAD") {
    return new NextResponse(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }

  const responseBody = await upstream.arrayBuffer();
  return new NextResponse(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request, context) {
  return proxyToWordPress(request, context);
}

export async function POST(request, context) {
  return proxyToWordPress(request, context);
}

export async function PUT(request, context) {
  return proxyToWordPress(request, context);
}

export async function PATCH(request, context) {
  return proxyToWordPress(request, context);
}

export async function DELETE(request, context) {
  return proxyToWordPress(request, context);
}

export async function OPTIONS(request, context) {
  return proxyToWordPress(request, context);
}

export async function HEAD(request, context) {
  return proxyToWordPress(request, context);
}

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
 * Em alguns deploys Vercel, Authorization some de req.headers e vai para
 * x-vercel-sc-headers (JSON). Recupera sem logar o valor.
 */
function recoverAuthorizationFromVercel(request) {
  const raw = request.headers.get("x-vercel-sc-headers");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const auth = parsed?.Authorization || parsed?.authorization;
    return typeof auth === "string" && auth.length > 0 ? auth : null;
  } catch {
    return null;
  }
}

/**
 * Proxy fiel para /wp-json/* do WordPress.
 * PUT/PATCH/DELETE → POST + X-HTTP-Method-Override (IIS/GoDaddy bloqueia esses verbos).
 * Credenciais WooCommerce: Authorization (Basic) e/ou ?consumer_key&consumer_secret.
 */
async function proxyToWordPress(request, context) {
  const { path: pathSegments } = await context.params;
  const path = Array.isArray(pathSegments)
    ? pathSegments.join("/")
    : String(pathSegments || "");

  // Query string integral (consumer_key / consumer_secret do WooCommerce).
  const incomingUrl = new URL(request.url);
  const search = incomingUrl.search; // inclui "?" quando houver params
  const targetUrl = `${WP_ORIGIN}/wp-json/${path}${search}`;

  const originalMethod = request.method.toUpperCase();
  const overrideMethods = new Set(["PUT", "PATCH", "DELETE"]);
  const useOverride = overrideMethods.has(originalMethod);
  const outboundMethod = useOverride ? "POST" : originalMethod;

  const outboundHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    // Não reenviar o envelope interno da Vercel ao WordPress.
    if (lower === "x-vercel-sc-headers") return;
    outboundHeaders.set(key, value);
  });

  // Authorization: garantir repasse explícito (header pode sumir no forEach / Vercel).
  let authorization =
    request.headers.get("authorization") || recoverAuthorizationFromVercel(request);
  if (authorization) {
    outboundHeaders.set("Authorization", authorization);
  }

  // Outros headers de autenticação / WooCommerce.
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower.startsWith("x-wc-") || lower.startsWith("x-api-")) {
      outboundHeaders.set(key, value);
    }
  });

  if (useOverride) {
    outboundHeaders.set("X-HTTP-Method-Override", originalMethod);
  }

  // TEMP: validação de credenciais / query string — remover após confirmar.
  console.log("[wp-json proxy]", {
    method: originalMethod,
    outboundMethod,
    targetUrl,
    hasAuthorization: Boolean(authorization),
    hasConsumerKeyInQuery: incomingUrl.searchParams.has("consumer_key"),
    hasConsumerSecretInQuery: incomingUrl.searchParams.has("consumer_secret"),
  });

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
    if (lower === "content-encoding") return;
    responseHeaders.set(key, value);
  });

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

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

function isSkuReconcileEnabled() {
  return String(process.env.SKU_RECONCILE_ENABLED || "").toLowerCase() === "true";
}

/** POST de criação de produto (não subcaminhos como /products/123). */
function isProductCreatePath(method, path) {
  if (method !== "POST") return false;
  const normalized = String(path || "").replace(/\/+$/, "");
  return normalized === "wc/v2/products" || normalized === "wc/v3/products";
}

function buildOutboundHeaders(request, useOverride, originalMethod) {
  const outboundHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === "x-vercel-sc-headers") return;
    outboundHeaders.set(key, value);
  });

  const authorization =
    request.headers.get("authorization") || recoverAuthorizationFromVercel(request);
  if (authorization) {
    outboundHeaders.set("Authorization", authorization);
  }

  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower.startsWith("x-wc-") || lower.startsWith("x-api-")) {
      outboundHeaders.set(key, value);
    }
  });

  if (useOverride) {
    outboundHeaders.set("X-HTTP-Method-Override", originalMethod);
  }

  return { outboundHeaders, authorization: Boolean(authorization) };
}

/**
 * Busca produto existente por SKU, reutilizando Authorization e/ou
 * consumer_key/consumer_secret da query da requisição original.
 */
async function findProductBySku(sku, request, authHeaders) {
  const incomingUrl = new URL(request.url);
  const lookupUrl = new URL(`${WP_ORIGIN}/wp-json/wc/v3/products`);
  lookupUrl.searchParams.set("sku", sku);

  const ck = incomingUrl.searchParams.get("consumer_key");
  const cs = incomingUrl.searchParams.get("consumer_secret");
  if (ck) lookupUrl.searchParams.set("consumer_key", ck);
  if (cs) lookupUrl.searchParams.set("consumer_secret", cs);

  const headers = new Headers();
  const authorization = authHeaders.get("Authorization") || authHeaders.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  }
  headers.set("Accept", "application/json");

  const res = await fetch(lookupUrl.toString(), {
    method: "GET",
    headers,
    redirect: "manual",
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json().catch(() => null);
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }
  return data[0];
}

/**
 * Proxy fiel para /wp-json/* do WordPress.
 * PUT/PATCH/DELETE → POST + X-HTTP-Method-Override (IIS/GoDaddy bloqueia esses verbos).
 * Credenciais WooCommerce: Authorization (Basic) e/ou ?consumer_key&consumer_secret.
 * Com SKU_RECONCILE_ENABLED=true: POST /wc/v2|v3/products reconcilia por SKU.
 */
async function proxyToWordPress(request, context) {
  const { path: pathSegments } = await context.params;
  const path = Array.isArray(pathSegments)
    ? pathSegments.join("/")
    : String(pathSegments || "");

  const incomingUrl = new URL(request.url);
  const search = incomingUrl.search;
  const targetUrl = `${WP_ORIGIN}/wp-json/${path}${search}`;

  const originalMethod = request.method.toUpperCase();
  const overrideMethods = new Set(["PUT", "PATCH", "DELETE"]);
  const useOverride = overrideMethods.has(originalMethod);
  const outboundMethod = useOverride ? "POST" : originalMethod;

  const { outboundHeaders, authorization: hasAuthorization } = buildOutboundHeaders(
    request,
    useOverride,
    originalMethod
  );

  let bodyBuffer = null;
  if (originalMethod !== "GET" && originalMethod !== "HEAD") {
    bodyBuffer = await request.arrayBuffer();
  }

  // Reconciliação por SKU (vínculo em massa Olist → WooCommerce).
  if (isSkuReconcileEnabled() && isProductCreatePath(originalMethod, path) && bodyBuffer) {
    let payload = null;
    try {
      const text = new TextDecoder().decode(bodyBuffer);
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    const sku =
      payload && typeof payload.sku === "string" ? payload.sku.trim() : "";

    if (sku) {
      try {
        const existing = await findProductBySku(sku, request, outboundHeaders);
        if (existing && existing.id) {
          console.log("[wp-json proxy] SKU reconcile", {
            sku,
            id: existing.id,
          });
          return NextResponse.json(existing, {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (err) {
        console.error("[wp-json proxy] SKU reconcile lookup failed", {
          sku,
          message: err?.message || String(err),
        });
        // Segue para criação normal se a consulta falhar.
      }
    }
  }

  const init = {
    method: outboundMethod,
    headers: outboundHeaders,
    redirect: "manual",
    cache: "no-store",
  };

  if (bodyBuffer && bodyBuffer.byteLength > 0) {
    init.body = bodyBuffer;
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

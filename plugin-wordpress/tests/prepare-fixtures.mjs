// Download pinned official WooCommerce sources for isolated PHP regression tests.
// Run from the repository root. No store access or credentials are used.
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const files = {
  "class-wc-discounts.php": "e9c38424800939c66852a3615542eb941c8302e56633dd76a2935b77b3a2cd7d",
  "class-wc-coupon.php": "86edcb4b3f84e2160cb1d7a73b54be40c56612ce6637d09c63a4d3bf00d61256",
  "class-wc-brands-coupons.php": "305ef6a5a5fc690f17266b2f8f5dfe98548b086c1cafc9d7054f377b09fe2139",
};
await mkdir("dist/coupon-tests", { recursive: true });
for (const [name, hash] of Object.entries(files)) {
  const response = await fetch(`https://raw.githubusercontent.com/woocommerce/woocommerce/9.9.5/plugins/woocommerce/includes/${name}`);
  if (!response.ok) throw new Error(`WooCommerce source: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== hash) throw new Error(`Source changed: ${name}`);
  await writeFile(`dist/coupon-tests/${name}`, bytes);
}
console.log("Official WooCommerce test sources downloaded and verified.");

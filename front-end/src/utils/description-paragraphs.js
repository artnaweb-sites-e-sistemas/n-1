/**
 * Extrai o primeiro parágrafo e o restante do conteúdo (descrição/catálogo).
 * Usado para mostrar o primeiro parágrafo abaixo do título e o restante na área de descrição.
 * @param {string} content - HTML (catalogContent) ou texto (description)
 * @param {boolean} isHtml - true se content for HTML
 * @returns {{ firstParagraph: string, restContent: string }}
 */
export function getFirstParagraphAndRest(content, isHtml) {
  if (!content || !String(content).trim()) {
    return { firstParagraph: "", restContent: content || "" };
  }
  const raw = String(content).trim();
  if (isHtml) {
    const match = raw.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (match) {
      const firstParagraph = match[1].replace(/<[^>]+>/g, "").trim();
      const restContent = raw.replace(/<p[^>]*>[\s\S]*?<\/p>/i, "").trim();
      return { firstParagraph, restContent };
    }
    // Sem <p>: NÃO fazer strip_tags do HTML inteiro (gera "Comprar ... Anterior Próximo").
    // Mantém o HTML completo em restContent; o caller pode usar product.description
    // para o parágrafo ao lado do título.
    return {
      firstParagraph: "",
      restContent: raw,
    };
  }
  const parts = raw.split(/\n\n+/);
  const firstParagraph = (parts[0] || "").trim();
  const restContent = parts.slice(1).join("\n\n").trim();
  return { firstParagraph, restContent };
}

/**
 * Parágrafo limpo para exibir ao lado do título.
 * Prefere o 1º <p> do catalogContent; se ausente/poluído, usa description.
 */
export function getProductLeadParagraph(product) {
  const catalogContent = product?.catalogContent || "";
  const description = String(product?.description || "").trim();
  const isHtml = Boolean(catalogContent && String(catalogContent).trim());
  const rawContent = catalogContent || description || "";
  const { firstParagraph } = getFirstParagraphAndRest(rawContent, isHtml);

  if (firstParagraph && !isPollutedLeadParagraph(firstParagraph)) {
    return firstParagraph;
  }
  if (description && !isPollutedLeadParagraph(description)) {
    return description;
  }
  return firstParagraph || "";
}

function isPollutedLeadParagraph(text) {
  const t = String(text || "");
  if (t.length > 1500) return true;
  if (/^\s*comprar\b/i.test(t)) return true;
  if (/\banterior\b/i.test(t) && /\bpr[oó]ximo\b/i.test(t)) return true;
  return false;
}

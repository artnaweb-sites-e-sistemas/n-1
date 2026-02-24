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
    return {
      firstParagraph: raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      restContent: "",
    };
  }
  const parts = raw.split(/\n\n+/);
  const firstParagraph = (parts[0] || "").trim();
  const restContent = parts.slice(1).join("\n\n").trim();
  return { firstParagraph, restContent };
}

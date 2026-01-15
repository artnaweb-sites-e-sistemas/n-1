/**
 * Gera a URL do produto no formato /livros/slug
 * @param {Object} product - Objeto do produto com slug ou title
 * @param {string|number} productId - ID do produto (fallback)
 * @returns {string} URL do produto
 */
export function getProductUrl(product, productId = null) {
  // Se o produto tem slug, usar diretamente
  if (product?.slug) {
    return `/livros/${product.slug}`;
  }
  
  // Se não tem slug mas tem title, gerar slug a partir do título
  if (product?.title) {
    const slug = generateSlug(product.title);
    return `/livros/${slug}`;
  }
  
  // Fallback para ID (compatibilidade com código antigo)
  if (productId || product?._id || product?.id) {
    const id = productId || product._id || product.id;
    return `/product-details/${id}`;
  }
  
  return '/shop';
}

/**
 * Gera slug a partir de um título
 * @param {string} title - Título do produto
 * @returns {string} Slug gerado
 */
function generateSlug(title) {
  if (!title) return '';
  
  // Converter para minúsculas
  let slug = title.toLowerCase();
  
  // Remover acentos (simplificado)
  slug = slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Remover caracteres especiais, manter apenas letras, números e espaços
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  
  // Substituir espaços e múltiplos hífens por um único hífen
  slug = slug.replace(/[\s-]+/g, '-');
  
  // Remover hífens no início e fim
  slug = slug.trim().replace(/^-+|-+$/g, '');
  
  return slug;
}


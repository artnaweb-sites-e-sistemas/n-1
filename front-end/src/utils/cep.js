/**
 * Consulta endereço pelo CEP (ViaCEP — uso público, sem chave).
 * @param {string} cepDigits — apenas números (8 dígitos)
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ street: string, neighborhood: string, city: string, state: string } | null>}
 */
export async function fetchAddressByCep(cepDigits, signal) {
  const cep = String(cepDigits || "").replace(/\D/g, "");
  if (cep.length !== 8) {
    return null;
  }

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error("Falha ao consultar CEP");
  }

  const data = await res.json();
  if (!data || data.erro === true) {
    return null;
  }

  return {
    street: String(data.logradouro || "").trim(),
    neighborhood: String(data.bairro || "").trim(),
    city: String(data.localidade || "").trim(),
    state: String(data.uf || "").trim(),
  };
}

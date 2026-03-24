import { NextResponse } from 'next/server';

const BREVO_API = 'https://api.brevo.com/v3/contacts';

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Inscreve e-mail numa lista do Brevo (servidor — chave nunca exposta ao browser).
 * POST { "email": "a@b.com" }
 *
 * Env: BREVO_API_KEY, BREVO_LIST_ID (número da lista no Brevo)
 */
export async function POST(request) {
  const apiKey = process.env.BREVO_API_KEY;
  const listIdRaw = process.env.BREVO_LIST_ID;

  if (!apiKey || !listIdRaw) {
    return NextResponse.json(
      { ok: false, message: 'Newsletter não configurada no servidor.' },
      { status: 503 }
    );
  }

  const listId = parseInt(String(listIdRaw).trim(), 10);
  if (Number.isNaN(listId) || listId < 1) {
    return NextResponse.json(
      { ok: false, message: 'Lista inválida (BREVO_LIST_ID).' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON inválido.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, message: 'Informe um e-mail válido.' }, { status: 400 });
  }

  try {
    const res = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      return NextResponse.json({ ok: true, message: 'Inscrição realizada com sucesso!' });
    }

    // Contato já existe — com updateEnabled o Brevo costuma 201; alguns casos retornam erro explícito
    if (res.status === 400 && data?.code === 'duplicate_parameter') {
      return NextResponse.json({
        ok: true,
        message: 'Este e-mail já está inscrito. Obrigado!',
      });
    }

    const msg =
      typeof data?.message === 'string'
        ? data.message
        : 'Não foi possível concluir a inscrição. Tente novamente.';
    return NextResponse.json({ ok: false, message: msg }, { status: res.status >= 400 ? res.status : 502 });
  } catch (err) {
    console.error('[newsletter/brevo]', err);
    return NextResponse.json(
      { ok: false, message: 'Erro ao comunicar com o serviço de e-mail.' },
      { status: 502 }
    );
  }
}

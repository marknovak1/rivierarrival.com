function originOf(request) {
  return new URL(request.url).origin;
}

function getCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || a.length === 0) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

const CLEAR_STATE_COOKIE = 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';

function handshake(payload) {
  const status = payload.error ? 'error' : 'success';
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body>
<script>
(function () {
  function receiveMessage(e) {
    if (e.origin !== window.location.origin || e.source !== window.opener) return;
    window.opener.postMessage(${JSON.stringify(message)}, window.location.origin);
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', window.location.origin);
})();
</script>
</body></html>`;
  return new Response(html, {
    status: payload.error ? 400 : 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': CLEAR_STATE_COOKIE
    }
  });
}

export async function GET(request) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return handshake({
      error: 'invalid',
      errorCode: 'not_configured',
      provider: 'github'
    });
  }

  const params = new URL(request.url).searchParams;
  const returnedState = params.get('state') || '';
  const cookieState = getCookie(request, 'oauth_state') || '';
  if (!timingSafeEqual(returnedState, cookieState)) {
    return handshake({
      error: 'invalid',
      errorCode: 'state_mismatch',
      provider: 'github'
    });
  }

  const code = params.get('code') || '';
  if (!code) {
    return handshake({
      error: 'invalid',
      errorCode: 'missing_code',
      provider: 'github'
    });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${originOf(request)}/api/callback`
    })
  });

  const body = await tokenRes.json();
  if (!body.access_token) {
    return handshake({
      error: 'invalid',
      errorCode: body.error || 'token_exchange_failed',
      provider: 'github'
    });
  }

  return handshake({
    token: body.access_token,
    provider: 'github'
  });
}

function originOf(request) {
  return new URL(request.url).origin;
}

function handshake(payload) {
  const status = payload.error ? 'error' : 'success';
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body>
<script>
(function () {
  function receiveMessage(e) {
    window.opener.postMessage(${JSON.stringify(message)}, e.origin);
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body></html>`;
  return new Response(html, {
    status: payload.error ? 400 : 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
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

  const code = new URL(request.url).searchParams.get('code') || '';
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

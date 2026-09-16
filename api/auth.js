function originOf(request) {
  return new URL(request.url).origin;
}

function randomState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function setupPage() {
  return `<!doctype html><meta charset="utf-8"><title>CMS login is not set up yet</title>
<body style="font-family: Georgia, serif; max-width: 40em; margin: 3em auto; line-height: 1.5">
<h1>GitHub login is not configured</h1>
<p>Add a GitHub OAuth App and set <code>OAUTH_CLIENT_ID</code> and
<code>OAUTH_CLIENT_SECRET</code> on the Vercel project. See the pull request
for the one-time setup steps.</p></body>`;
}

export function GET(request) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    return new Response(setupPage(), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  const state = randomState();
  const redirectUri = `${originOf(request)}/api/callback`;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('scope', 'public_repo');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    }
  });
}

// Contact form handler: validates a JSON submission and forwards it by email via Resend.
// Env: RESEND_API_KEY (Resend API key), CONTACT_TO (inbox that receives submissions).

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function field(data, key) {
  const value = data[key];
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    return json(415, { ok: false, error: 'Please send the form as JSON.' });
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { ok: false, error: 'The form data could not be read.' });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return json(400, { ok: false, error: 'The form data could not be read.' });
  }

  // Honeypot: real visitors never see or fill this field. Pretend success so bots move on.
  if (field(data, 'website')) return json(200, { ok: true });

  const name = field(data, 'name').replace(/[\r\n]+/g, ' ');
  const email = field(data, 'email');
  const message = field(data, 'message');

  if (!name || !email || !message) {
    return json(400, { ok: false, error: 'Please fill in your name, email and question.' });
  }
  if (name.length > MAX_NAME) {
    return json(400, { ok: false, error: 'Your name is too long.' });
  }
  if (email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: 'Please enter a valid email address.' });
  }
  if (message.length > MAX_MESSAGE) {
    return json(400, { ok: false, error: `Please keep your question under ${MAX_MESSAGE} characters.` });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!apiKey || !to) {
    console.error('contact: RESEND_API_KEY or CONTACT_TO is not set');
    return json(500, { ok: false, error: 'The form is not available right now. Please try again later.' });
  }

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Riviera Arrival <contact@rivieraarrival.com>',
        to: [to],
        reply_to: email,
        subject: `New question from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}\n`,
      }),
    });
  } catch (error) {
    console.error('contact: Resend request failed', error);
    return json(502, { ok: false, error: 'Your message could not be sent. Please try again.' });
  }

  if (!response.ok) {
    console.error('contact: Resend responded', response.status, await response.text().catch(() => ''));
    return json(502, { ok: false, error: 'Your message could not be sent. Please try again.' });
  }

  return json(200, { ok: true });
}

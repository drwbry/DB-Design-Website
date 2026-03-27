export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    if (request.method !== 'POST') {
      return json({ success: false, message: 'Method not allowed' }, 405);
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, message: 'Invalid JSON' }, 400);
    }

    // Validate shared secret
    if (body.secret !== env.WORKER_SECRET) {
      return json({ success: false, message: 'Unauthorized' }, 401);
    }

    // Build email
    const subject = body.subject || 'New Form Submission — The Web Foundry';
    const lines = Object.entries(body)
      .filter(([k]) => !['secret', 'botcheck'].includes(k))
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top">${k}</td><td style="padding:4px 0">${v}</td></tr>`);
    const html = `<table style="font-family:sans-serif;font-size:14px;color:#333">${lines.join('')}</table>`;

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Web Foundry Forms <forms@cincinnatiwebfoundry.com>',
        to: [env.TO_EMAIL],
        subject,
        html,
        reply_to: body.email || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return json({ success: false, message: 'Email delivery failed' }, 500);
    }

    return json({ success: true });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

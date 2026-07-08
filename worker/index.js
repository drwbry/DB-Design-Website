export default {
  async fetch(request, env, ctx) {
    // ── CORS: validate origin ──────────────────────────────────
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
    const originAllowed = allowed.includes(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(originAllowed ? origin : ''),
      });
    }

    if (!originAllowed && origin !== '') {
      return json({ success: false, message: 'Forbidden' }, 403, origin);
    }

    if (request.method !== 'POST') {
      return json({ success: false, message: 'Method not allowed' }, 405, origin);
    }

    // ── Parse body ─────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, message: 'Invalid JSON' }, 400, origin);
    }

    // ── Honeypot check ─────────────────────────────────────────
    if (body.botcheck) {
      return json({ success: true }, 200, origin);
    }

    // ── Turnstile verification ─────────────────────────────────
    const turnstileToken = body['cf-turnstile-response'];
    if (!turnstileToken) {
      return json({ success: false, message: 'Verification required' }, 400, origin);
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: request.headers.get('CF-Connecting-IP') || '',
      }),
    });
    const verify = await verifyRes.json();
    if (!verify.success) {
      return json({ success: false, message: 'Verification failed' }, 403, origin);
    }

    // ── KV lookup: resolve site config from site_id ───────────
    let toEmail = env.TO_EMAIL;
    let siteBusinessName = 'The Web Foundry';
    let brandColor = '#D4A853';   // Web Foundry gold
    let headerBg = '#0A0A0A';    // Web Foundry black
    let siteUrl = 'https://cincinnatiwebfoundry.com';
    let isClientSite = false;
    const siteId = body.site_id || '';
    if (siteId && env.WEB_FOUNDRY_SITES) {
      const raw = await env.WEB_FOUNDRY_SITES.get(siteId);
      if (raw) {
        try {
          const config = JSON.parse(raw);
          if (config.toEmail) toEmail = config.toEmail;
          if (config.businessName) siteBusinessName = config.businessName;
          if (config.brandColor) brandColor = config.brandColor;
          if (config.headerBg) headerBg = config.headerBg;
          if (config.siteUrl) siteUrl = config.siteUrl;
          isClientSite = true;
        } catch {}
      }
    }

    // ── Build internal notification email ──────────────────────
    const subject = body.subject || `New Form Submission — ${siteBusinessName}`;
    const lines = Object.entries(body)
      .filter(([k]) => !['secret', 'botcheck', 'cf-turnstile-response', 'subject', 'site_id'].includes(k))
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`);
    const internalHtml = `<table style="font-family:sans-serif;font-size:14px;color:#333">${lines.join('')}</table>`;

    // ── Send internal notification to site owner ───────────────
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Web Foundry Forms <forms@cincinnatiwebfoundry.com>',
        to: [toEmail],
        subject,
        html: internalHtml,
        reply_to: body.email || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return json({ success: false, message: 'Email delivery failed' }, 500, origin);
    }

    // ── Send confirmation email to submitter ───────────────────
    if (body.email) {
      const firstName = (body.name || '').split(' ')[0] || 'there';
      const displayName = siteBusinessName;
      const safeFirstName = escapeHtml(firstName);
      const safeDisplayName = escapeHtml(displayName);

      // ── Dynamic submission summary rows ─────────────────────
      const hiddenFields = ['secret', 'botcheck', 'cf-turnstile-response', 'subject', 'site_id', 'email'];
      const fieldLabels = {
        name: 'Name', business_name: 'Business', phone: 'Phone',
        website_url: 'Website', message: 'Message',
      };
      const summaryRows = Object.entries(body)
        .filter(([k, v]) => !hiddenFields.includes(k) && v)
        .map(([k, v], i, arr) => {
          const label = fieldLabels[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const border = i < arr.length - 1 ? 'border-bottom:1px solid #EEEEEE;' : '';
          return `<tr><td style="padding:10px 16px;${border}font-size:13px;color:#888888;width:36%;">${escapeHtml(label)}</td><td style="padding:10px 16px;${border}font-size:13px;color:#111111;">${escapeHtml(v)}</td></tr>`;
        })
        .join('');

      // ── CTA block (only for Web Foundry, not client sites) ──
      const ctaBlock = isClientSite ? '' : `
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:${brandColor};border-radius:4px;">
                    <a href="${siteUrl}" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${headerBg};text-decoration:none;letter-spacing:0.06em;text-transform:uppercase;">View Our Work &rarr;</a>
                  </td>
                </tr>
              </table>`;

      const confirmationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>We received your message — ${safeDisplayName}</title>
</head>
<body style="margin:0;padding:0;background-color:#F2F2F2;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2F2F2;">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="background-color:${headerBg};padding:36px 44px;border-radius:8px 8px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${brandColor};font-weight:700;letter-spacing:0.02em;">${safeDisplayName}</p>
                  </td>
                  <td align="right" valign="middle">
                    <p style="margin:0;font-size:11px;color:rgba(240,235,224,0.35);letter-spacing:0.1em;text-transform:uppercase;">Confirmation</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent rule -->
          <tr>
            <td style="background-color:${brandColor};height:3px;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#FFFFFF;padding:48px 44px 40px;">

              <p style="margin:0 0 10px;font-size:12px;color:#AAAAAA;letter-spacing:0.12em;text-transform:uppercase;">Hi ${safeFirstName},</p>
              <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:30px;color:${headerBg};font-weight:700;line-height:1.2;letter-spacing:-0.01em;">We've got your<br/>message.</h1>
              <p style="margin:0 0 ${isClientSite ? '36px' : '16px'};font-size:15px;color:#555555;line-height:1.75;">We'll review your inquiry and be in touch within <strong style="color:#111111;">24 hours</strong>.</p>
${isClientSite ? '' : `              <p style="margin:0 0 36px;font-size:15px;color:#555555;line-height:1.75;">In the meantime, take a look at what we've built for other Cincinnati small businesses.</p>
`}
${ctaBlock}

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:40px 0 32px;">
                <tr><td style="border-top:1px solid #EEEEEE;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <!-- Submission summary -->
              <p style="margin:0 0 14px;font-size:11px;color:#AAAAAA;letter-spacing:0.12em;text-transform:uppercase;">Your Submission</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #EEEEEE;border-radius:6px;overflow:hidden;">
                ${summaryRows}
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9F9F9;padding:24px 44px;border-top:1px solid #EEEEEE;border-radius:0 0 8px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top">
                    <p style="margin:0 0 3px;font-size:12px;color:#888888;font-weight:700;">${safeDisplayName}</p>
                  </td>
                  <td align="right" valign="top">
                    <p style="margin:0;font-size:11px;color:#CCCCCC;line-height:1.6;">You received this because<br/>you submitted a contact form.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      ctx.waitUntil(fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'The Web Foundry <forms@cincinnatiwebfoundry.com>',
          to: [body.email],
          subject: `We received your message — ${displayName}`,
          html: confirmationHtml,
        }),
      }));
    }

    return json({ success: true }, 200, origin);
  },
};

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

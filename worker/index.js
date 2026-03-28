export default {
  async fetch(request, env, ctx) {
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

    // Build internal notification email
    const subject = body.subject || 'New Form Submission — The Web Foundry';
    const lines = Object.entries(body)
      .filter(([k]) => !['secret', 'botcheck'].includes(k))
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top">${k}</td><td style="padding:4px 0">${v}</td></tr>`);
    const internalHtml = `<table style="font-family:sans-serif;font-size:14px;color:#333">${lines.join('')}</table>`;

    // Send internal notification to Foundry inbox
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
        html: internalHtml,
        reply_to: body.email || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return json({ success: false, message: 'Email delivery failed' }, 500);
    }

    // Send confirmation email to submitter
    if (body.email) {
      const firstName = (body.name || '').split(' ')[0] || 'there';
      const businessName = body.business_name || '';
      const phoneRow = body.phone
        ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #EEEEEE;font-size:13px;color:#888888;width:36%;">Phone</td><td style="padding:10px 16px;border-bottom:1px solid #EEEEEE;font-size:13px;color:#111111;">${body.phone}</td></tr>`
        : '';
      const websiteRow = body.website_url
        ? `<tr><td style="padding:10px 16px;font-size:13px;color:#888888;">Website</td><td style="padding:10px 16px;font-size:13px;color:#111111;">${body.website_url}</td></tr>`
        : '';
      const businessRow = businessName
        ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #EEEEEE;font-size:13px;color:#888888;">Business</td><td style="padding:10px 16px;border-bottom:1px solid #EEEEEE;font-size:13px;color:#111111;">${businessName}</td></tr>`
        : '';

      const confirmationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>We received your message — The Web Foundry</title>
</head>
<body style="margin:0;padding:0;background-color:#F2F2F2;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2F2F2;">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0A0A0A;padding:36px 44px;border-radius:8px 8px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#D4A853;font-weight:700;letter-spacing:0.02em;">The Web Foundry</p>
                    <p style="margin:5px 0 0;font-size:11px;color:rgba(240,235,224,0.45);letter-spacing:0.14em;text-transform:uppercase;">Cincinnati</p>
                  </td>
                  <td align="right" valign="middle">
                    <p style="margin:0;font-size:11px;color:rgba(240,235,224,0.35);letter-spacing:0.1em;text-transform:uppercase;">Confirmation</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold rule -->
          <tr>
            <td style="background-color:#D4A853;height:3px;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#FFFFFF;padding:48px 44px 40px;">

              <p style="margin:0 0 10px;font-size:12px;color:#AAAAAA;letter-spacing:0.12em;text-transform:uppercase;">Hi ${firstName},</p>
              <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#0A0A0A;font-weight:700;line-height:1.2;letter-spacing:-0.01em;">We've got your<br/>message.</h1>
              <p style="margin:0 0 16px;font-size:15px;color:#555555;line-height:1.75;">${businessName ? `Thanks for reaching out about <strong style="color:#111111;">${businessName}</strong>. We` : 'We'}'ll review your inquiry and be in touch within <strong style="color:#111111;">24 hours</strong>.</p>
              <p style="margin:0 0 36px;font-size:15px;color:#555555;line-height:1.75;">In the meantime, take a look at what we've built for other Cincinnati small businesses.</p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#D4A853;border-radius:4px;">
                    <a href="https://cincinnatiwebfoundry.com" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#0A0A0A;text-decoration:none;letter-spacing:0.06em;text-transform:uppercase;">View Our Work &rarr;</a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:40px 0 32px;">
                <tr><td style="border-top:1px solid #EEEEEE;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <!-- Submission summary -->
              <p style="margin:0 0 14px;font-size:11px;color:#AAAAAA;letter-spacing:0.12em;text-transform:uppercase;">Your Submission</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #EEEEEE;border-radius:6px;overflow:hidden;">
                <tr>
                  <td style="padding:10px 16px;border-bottom:1px solid #EEEEEE;font-size:13px;color:#888888;width:36%;">Name</td>
                  <td style="padding:10px 16px;border-bottom:1px solid #EEEEEE;font-size:13px;color:#111111;">${body.name || ''}</td>
                </tr>
                ${businessRow}
                ${phoneRow}
                ${websiteRow}
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9F9F9;padding:24px 44px;border-top:1px solid #EEEEEE;border-radius:0 0 8px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top">
                    <p style="margin:0 0 3px;font-size:12px;color:#888888;font-weight:700;">The Web Foundry &mdash; Cincinnati</p>
                    <p style="margin:0;font-size:11px;color:#BBBBBB;">cincinnatiwebfoundry.com</p>
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

      // Keep worker alive until confirmation sends, but don't block the response
      ctx.waitUntil(fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'The Web Foundry <forms@cincinnatiwebfoundry.com>',
          to: [body.email],
          subject: 'We received your message — The Web Foundry',
          html: confirmationHtml,
        }),
      }));
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

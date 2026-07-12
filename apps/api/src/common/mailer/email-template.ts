// Inline styles throughout — email clients (Gmail, Outlook, etc.) strip or
// unreliably support <style> blocks and external CSS, so this can't reuse
// the web app's Tailwind/CSS-variable token system. The brand color below
// is a static hex approximation of the web app's --primary token for this
// reason, not a token reference.
const BRAND_COLOR = '#4f46e5';

export interface EmailTemplateParams {
  heading: string;
  body: string;
  buttonLabel: string;
  link: string;
}

export interface EmailContent {
  html: string;
  text: string;
}

export function buildEmailTemplate({ heading, body, buttonLabel, link }: EmailTemplateParams): EmailContent {
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;background-color:${BRAND_COLOR};">
                <span style="color:#ffffff;font-size:18px;font-weight:600;">ERP Smart</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">${heading}</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">${body}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:6px;background-color:${BRAND_COLOR};">
                      <a href="${link}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${buttonLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;">
                  If the button doesn't work, copy and paste this link into your browser:<br />
                  <a href="${link}" style="color:${BRAND_COLOR};word-break:break-all;">${link}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#fafafa;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:12px;color:#a1a1aa;">
                  This is an automated message from ERP Smart. If you didn't expect this email, you can safely ignore it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${heading}\n\n${body}\n\n${buttonLabel}: ${link}\n\nIf you didn't expect this email, you can safely ignore it.`;

  return { html, text };
}

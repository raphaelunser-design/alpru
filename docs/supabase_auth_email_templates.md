# Supabase Auth E-Mail-Vorlagen

Diese Vorlage ist für **Authentication > Email Templates > Reset Password** gedacht.
Sie nutzt die offizielle Supabase-Variable `{{ .ConfirmationURL }}`.

## Reset Password

**Subject**

```text
Setze dein Alpivo-Passwort zurück
```

**HTML**

```html
<div style="margin:0;padding:0;background:#07111f;font-family:Inter,Arial,sans-serif;color:#e6edf7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0d1a2b;border:1px solid rgba(179,221,255,0.18);border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:30px 30px 12px 30px;">
              <div style="font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:#9db2cc;">Alpivo Konto</div>
              <h1 style="margin:14px 0 0 0;font-size:28px;line-height:1.18;color:#ffffff;">Passwort zurücksetzen</h1>
              <p style="margin:16px 0 0 0;font-size:15px;line-height:1.65;color:#bfd0e5;">
                Du hast angefragt, dein Alpivo-Passwort neu zu setzen. Über den folgenden Button kannst du ein neues Passwort vergeben.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 30px 8px 30px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#bae6fd;color:#07111f;text-decoration:none;font-weight:700;font-size:15px;border-radius:10px;padding:14px 20px;">
                Neues Passwort festlegen
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 30px 30px 30px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#93a8c2;">
                Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren. Dein bisheriges Passwort bleibt unverändert.
              </p>
              <p style="margin:18px 0 0 0;font-size:12px;line-height:1.6;color:#71849d;">
                Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
                <span style="word-break:break-all;color:#a9c8e8;">{{ .ConfirmationURL }}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
```

## Redirect URLs

Diese URLs sollten in Supabase unter **Authentication > URL Configuration > Redirect URLs** erlaubt sein:

```text
https://alpivo.de/auth/callback
https://www.alpivo.de/auth/callback
https://ski-match-chi.vercel.app/auth/callback
http://localhost:3002/auth/callback
```

Die Alpivo-App leitet Reset- und Magic-Link-Mails jetzt über `/auth/callback`, tauscht dort PKCE-Codes in eine Session um und zeigt danach die Passwort-Maske in `/accountauth=recovery`.

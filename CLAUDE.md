@AGENTS.md

## Dev login

For local debugging, a dev account's credentials are in `.env`
(`DEV_LOGIN_EMAIL` / `DEV_LOGIN_PASSWORD`, gitignored — never checked in).
Read them from there when a login is needed; never duplicate the actual
values into this file or any other tracked/committed location.

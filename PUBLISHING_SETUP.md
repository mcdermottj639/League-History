# Enable publishing once

The app code is ready. Firebase must authorize a publisher before the first save.
Your existing parlay picks and the Lab passphrase are separate from this sign-in.

1. Open [your Firebase project](https://console.firebase.google.com/project/nectars-bologna/overview).
2. Authentication → Sign-in method → enable **Email/Password**. Under Users, add your publisher email and a password. Copy that user's **UID**. Do not send the password in chat or commit it.
3. Realtime Database → Rules: keep your existing `picks` rules unchanged. Add the `rankings` sibling from `rankings.rules.json` under `rules`, replacing `REPLACE_WITH_PUBLISHER_UID` with that UID. Publish the rules. Do not grant writes at the database root.
4. Project settings → General: copy **Web API Key** (register a Web app if needed). This is a public project identifier, not your password.
5. Open the Power Rankings Lab → Publish → enter that API key and publisher email/password. The publisher sign-in is remembered on this device and renewed automatically. The password is never stored. API key/email and a Firebase refresh token are stored locally; short-lived access tokens stay in memory.
6. Signing in continues the pending Publish action. Confirm replacement if that week already exists. Wait for **Saved. These rankings are now live for everyone**. Open the league's Rankings tab on another phone to verify.

Every following week: edit → Publish. Normal reloads and reopening on this device keep you signed in. No JSON export or GitHub commit.
In the main app’s Rankings tab, the publisher sees Edit rankings / Unpublish above the same published table everyone reads. Edit opens that saved week, including older seasons, and preserves its original stats and date. Draft edits stay on the device until Save changes for everyone succeeds.

Unpublish removes only the selected week and leaves your draft untouched. A failed or timed-out request does not mark a draft published; check the Rankings tab before retrying an uncertain save.

The existing Lab passphrase is a convenience gate, not server authorization. Only the Firebase UID named in the rules can write rankings. Signing out of publishing clears the remembered session. Cleared browser data, a private browsing session ending, or a revoked account/password change can require sign-in again.

Invited Lab users can still prepare and share drafts but cannot publish directly. Public visitors can read published rankings without accounts.

## Validation before enabling

In Firebase Rules Playground, verify an unauthenticated write to `/rankings/2026/1` is denied; an authenticated write with a different UID is denied; the configured publisher's valid twelve-team payload is allowed; deleting that single week as the publisher is allowed. Existing parlay picks must remain readable and writable under their original rules.

The code tests mock Firebase responses. Production rules, credentials, CORS, and an actual successful save require this one-time setup and a real-device check.

Reference: [Firebase conditional writes](https://firebase.google.com/docs/database/rest/save-data#section-conditional-requests).

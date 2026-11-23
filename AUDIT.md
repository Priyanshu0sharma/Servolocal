# Servolocal engineering audit

Completed 23 November 2026 against GitHub baseline `9ed9154`. The review followed the customer checkout, merchant fulfilment, rider delivery and admin approval paths through the FastAPI backend, three web apps and the Flutter customer app.

## Findings and repairs

| Priority | Finding | Change and evidence |
| --- | --- | --- |
| Critical | Wallet credit depended on a callback amount and could repeat. Online checkout could mark an order paid without confirming funds. | The server binds new payment intents to the account and purpose, verifies the signature and captured INR amount, and consumes the checkout payment once. Wallet credit, bonus and ledger entry commit together. Regression tests verify one credit after two confirmations and a paid order using a simulated gateway. |
| High | Customer tracking and merchant writes lacked consistent ownership checks. Suspended sessions could retain privileged access. | Tracking requires the purchasing account. Merchant inventory, orders and opening controls use shop ownership. Privileged routes check the current account and role. Tests exercise four separate role identities. |
| High | Rider details and handover codes could be disclosed outside the assigned job. Delivery confirmation could credit earnings more than once. | Unassigned offers omit exact customer details. Pickup and delivery require the assigned rider and the appropriate order state. The customer tracker stops sharing rider coordinates after delivery. Tests cover pickup, GPS updates, handover and repeat confirmation. |
| High | New shops could bypass approval. The seller dashboard could show another shop's inventory or an order status the server had rejected. | New shops await approval. Owners can prepare inventory, submit product photos and load their own settings. Merchant order status changes appear after the API confirms them. The admin shop list counts orders, and commission edits apply to future orders at shops in the affected category. |
| High | Checkout displayed a locally estimated total. The mobile app could simulate a successful order and delivery while offline. | Web checkout uses a server quote. Native checkout asks for confirmation of the server total. Stock, payment, line items and order events commit together. The mobile provider polls authenticated tracking and resets order state when the account changes. |
| High | Storage uploads were public and credentialed CORS allowed arbitrary Vercel subdomains. | Uploads require a seller or admin session. The API restricts folders and media types and checks file signatures and a 5 MiB limit for direct uploads. CORS uses explicit origins. SMTP diagnostics require an admin. |
| High | Production dependency audits reported Next.js and PostCSS advisories, including critical findings for the partner and admin apps. | Updated all three web manifests and lockfiles. Each production dependency audit subsequently reported zero known vulnerabilities. |
| Medium | An older address lookup could label a newer map pin. Coverage could appear available without an open shop. | Address selection restores saved coordinates, ignores superseded lookups and checks approved open shops. The selected pin opens in Google Maps. Checkout accepts a doorstep pin. |

## Delivery tracking

The partner web app requests device GPS when the rider goes on duty. During delivery it sends device readings to the backend. The customer can open the tracker after checkout or from account order history. It polls every five seconds while open and displays the shop, the doorstep when coordinates are available, and the assigned rider's latest eligible position. A reading older than 45 seconds is labelled as last known. At 15 minutes the rider marker disappears. Customers can pan and recenter the map.

The web apps use Leaflet and OpenStreetMap. A universal Maps URL opens a selected address pin in Google Maps. GPS requires permission and a secure context. The rider web app must stay active for regular updates. Traffic-based arrival estimates and native background GPS are outside this implementation. [Google Maps URL documentation](https://developers.google.com/maps/documentation/urls/get-started)

## Verification evidence

| Check | Result |
| --- | --- |
| FastAPI | 30 workflow tests passed against an isolated SQLite database. Payments used a simulated provider. |
| Customer, partner and admin web apps | All three passed TypeScript checks and Next.js 15.5.29 production builds. |
| Browser checks | Headless Chrome verified pin restoration, keyboard panning, the Google Maps link and pin confirmation. A separate test opened a tracked order from history, verified all three markers, observed stale-to-fresh GPS updates and closed the tracker. External services and location readings used fixtures. |
| Production JavaScript dependencies | Each lockfile returned zero known vulnerabilities from `npm audit --omit=dev`. |
| Python environment | `pip check` passed. Version-specific PyPI advisory records for 73 installed distributions flagged the local pip installer. The remaining checked distributions returned no advisory records. The backend requirements use version ranges. |
| Secret scanning | A targeted scan of tracked files for common credential patterns and private key filenames found no matches. Git history and deployment settings were outside this scan. Dedicated Semgrep and Gitleaks executables were unavailable. |
| Flutter | Source and API contracts reviewed. The Flutter SDK was unavailable on the host. Native build, widget tests and physical-device behavior remain unverified. |

## Release checks and remaining risks

1. Deploy backend and web changes together. Confirm Render has the intended database, a persistent JWT secret, payment and email configuration, and explicit Vercel origins. The backend implements ownership enforcement, payment checks and the GPS response contract.
2. Validate email OTP, Razorpay capture, refunds, merchant image uploads and two-device tracking in staging. Older payment intents without account ownership need manual reconciliation. A payment captured before a stock or price change can also require reconciliation. Automated refunds and payment webhooks remain open work. [Razorpay payment documentation](https://razorpay.com/docs/api/payments/fetch-with-id/)
3. Exercise concurrent purchases, stock changes, rider payouts and wallet credits on PostgreSQL. SQLite tests verify transaction outcomes. PostgreSQL row locking under load needs separate verification.
4. Rider UPI payouts previously debited the wallet and reported an external transfer without a payout provider. The endpoint now returns unavailable and preserves the balance. Merchant dues clearance also requires reconciliation until a verified settlement flow is integrated.
5. Browser sessions still use bearer tokens in local storage. Presigned uploads need storage-side size and quota controls. Review historical wallet entries, orders and access logs to assess the impact before these fixes.
6. Check the native app's sample catalogue and saved-address data before distribution. The interactive live delivery map in this release is in the customer web app.

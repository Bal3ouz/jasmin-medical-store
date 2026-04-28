# DNS

Domain registrar: confirm with owner before phase-2 launch.

- `jasmin-medical-store.com` → CNAME → `jasmin-web-prod.ondigitalocean.app`
- `www.jasmin-medical-store.com` → CNAME → `jasmin-web-prod.ondigitalocean.app`
- `admin.jasmin-medical-store.com` → CNAME → `jasmin-admin-prod.ondigitalocean.app`

Ensure TLS is auto-provisioned by DigitalOcean (Let's Encrypt) once the CNAME resolves.

# Deploy notes — Hetzner + Caddy

Target server: `188.245.96.6` (SSH alias `ghostdata`, user `data`).
Domain: `jasminmedical.store` on GoDaddy.

## DNS records (set in GoDaddy)

```
Type  Name  Value          TTL
A     @     188.245.96.6   600
A     www   188.245.96.6   600
A     team  188.245.96.6   600
```

Wait until `dig +short jasminmedical.store` returns `188.245.96.6` before
asking Caddy to issue certs (HTTP-01 challenge needs the records live).

## First-time deploy

```bash
ssh ghostdata
git clone git@github.com:Bal3ouz/jasmin-medical-store.git ~/jasmin
cd ~/jasmin
cp .env.production.example .env.production
# fill in Supabase URL / keys / DB pooler URI
docker compose build
docker compose up -d
docker compose ps    # both services should show 'healthy'
```

Then on the host (one-time Caddy update, requires sudo):

```bash
sudo cat ~/jasmin/deploy/Caddyfile.snippet >> /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo journalctl -u caddy -n 50 --no-pager   # watch for "certificate obtained"
```

Verify:

```bash
curl -sI https://jasminmedical.store | head -1          # → HTTP/2 200
curl -sI https://team.jasminmedical.store/login | head -1
```

## Update deploy

```bash
ssh ghostdata
cd ~/jasmin
git pull
docker compose build
docker compose up -d
```

## Rollback

```bash
git log --oneline -10
git checkout <prev-sha>
docker compose build
docker compose up -d
```

## Common ops

```bash
docker compose logs -f web        # tail web logs
docker compose logs -f admin      # tail admin logs
docker compose restart web        # bounce one service
docker compose down               # stop everything (keeps images)
```

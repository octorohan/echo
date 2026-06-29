# Echo

Anonymous end-to-end encrypted video chat. No accounts. No tracking. No bullshit.

## Architecture

```
packages/
├── shared/      TypeScript types shared across all packages
├── signaling/   WebSocket server — handles SDP/ICE relay between peers
├── matching/    Matching service — mood queue, compatibility, behavioral scoring
└── frontend/    React SPA — WebRTC, chat bubbles, reactions, UI
```

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript |
| Signaling | Node.js + ws + TypeScript |
| Matching | Node.js + TypeScript |
| State | Redis (Upstash) |
| TURN | Coturn (Oracle Cloud VM) |
| SFU (group rooms) | mediasoup |
| Hosting | Cloudflare Pages (frontend) + Oracle Cloud (backend) |

## Getting started

```bash
# install all workspace dependencies
npm install

# copy env files and fill in values
cp packages/signaling/.env.example packages/signaling/.env
cp packages/matching/.env.example packages/matching/.env
cp packages/frontend/.env.example packages/frontend/.env

# build shared types first
npm run build -w @echo/shared

# run everything in dev mode
npm run dev
```

## Services

- Frontend: http://localhost:5173
- Signaling: ws://localhost:3001
- Matching: internal (communicates via Redis pub/sub)

## Environment variables

### signaling/.env
| Key | Description |
|---|---|
| PORT | WebSocket server port (default 3001) |
| REDIS_URL | Upstash or local Redis URL |

### matching/.env
| Key | Description |
|---|---|
| REDIS_URL | Same Redis instance as signaling |
| RELAXATION_LEVEL_1_MS | ms before mood matching relaxes (default 30000) |
| RELAXATION_LEVEL_2_MS | ms before matching opens to all moods (default 60000) |
| BAN_SCORE_THRESHOLD | behavioral score to trigger soft-ban (default 10) |

### frontend/.env
| Key | Description |
|---|---|
| VITE_SIGNALING_URL | WebSocket URL of signaling server |
| VITE_TURN_URL | TURN server URL |
| VITE_TURN_USER | TURN username |
| VITE_TURN_PASS | TURN credential |

## Privacy architecture

- All video/audio is DTLS-SRTP encrypted (WebRTC default)
- Text chat uses WebRTC data channels — server never sees messages
- TURN servers relay media so neither peer exposes their real IP
- NSFW detection runs client-side in a WebWorker — frames never leave the browser
- No cookies. No persistent identifiers beyond ephemeral localStorage token (30-day expiry)
- Tor and VPN users are allowed

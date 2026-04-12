<div align="center">

# [IMS] Intern Management System · Protocol v2.0

![IMS Hero Banner](frontend/src/assets/ims_hero_banner.png)

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Modern-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Secure-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

**Institutional Recruitment & Strategic Stream Management.**
A high-fidelity, dual-portal ecosystem designed to automate and elevate the internship application lifecycle. Built for **LOOPLAB** recruitment streams.

[🚀 Discovery Portal](#-discovery-portal) • [🏛 Command Center](#-command-center) • [🛠 Setup Protocol](#-setup-protocol)

</div>

---

## 🏛 System Architecture

The IMS operates on a synchronized protocol between the **Organizational Command Center** (Staff) and the **Intern Discovery Portal**.

```mermaid
sequenceDiagram
    autonumber
    participant I as Intern Portal
    participant B as Backend API
    participant S as Staff Dashboard
    participant D as PostgreSQL

    Note over I,D: Protocol Initialization
    S->>B: POST /job-posts/ (Initialize Stream)
    B-->>D: Commit Metadata & Semantic Tags
    I->>B: GET /job-posts/status=Live
    B-->>I: Broadcast High-Fidelity Cards
    
    Note over I,S: Ingestion Pulse
    I->>B: POST /applications/ (Deploy CV)
    B-->>D: Atomic Protocol Registration
    B-->>S: Real-time Signal (Socket/Notif)
```

---

## 🚀 Mission Critical Features

| 🛠 Core Engineering | 🎨 Discovery UI |
| :--- | :--- |
| **Semantic Tagging Engine**<br>Dynamic HSL generation ensures categories like `AI Research` and `UX/UI Design` are visually distinct with neon-pill branding. | **Media-First Recruitment**<br>Immersive 16:9 4K video and image banner support for every opening to maximize intern engagement. |
| **Automated Ingestion**<br>Direct CV and metadata ingestion via Mailgun inbound webhooks with intelligent duplicate detection. | **Strategic Occupancy**<br>Real-time "Seats Left" monitoring to create a professional sense of urgency and transparency. |

---

## 📂 File System Blueprint

```text
ims-protocol/
├── backend/                # Core Command Logic (FastAPI)
│   ├── app/
│   │   ├── models/         # Institutional Schema
│   │   ├── routes/         # Operational Endpoints
│   │   └── schemas/        # Data Integrity Protocols
│   └── uploads/            # Encrypted Media Stream
├── frontend/               # User Interface Layer (React/Vite)
│   ├── src/
│   │   ├── pages/          # Institutional Views
│   │   ├── components/     # Reusable UI Modules
│   │   └── services/       # API Communications
└── README.md               # Strategic Documentation
```

---

## 🛠 Operational Setup Protocol

> [!IMPORTANT]
> **Credential Registry**: Default Admin: `admin@looplab.io` / Password: `admin123`
> **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Phase 1: Institutional Infrastructure
Ensure your environment meets the global standards: **Python 3.10+**, **Node.js 18+**, and **PostgreSQL**.

### Phase 2: Backend Deployment
```bash
cd backend
python -m venv .venv
# Windows Initialization:
.venv\Scripts\activate
# Install Core Modules:
pip install -r requirements.txt
# Sync Meta-Schema:
python add_tags_column.py
# Execute Local Server:
uvicorn app.main:app --reload
```

### Phase 3: Interface Initialization
```bash
cd frontend
npm install
npm run dev
```

---

## 🛡 Security & Governance
- **Protocol Isolation**: Candidate CVs and sensitive media are stored outside the public web root.
- **Role-Aware Favicons**: Dynamic branding (Technical Cube for Staff, Paper Plane for Interns).
- **JWT Authorization**: 256-bit encrypted session management for organizational roles.

---

<div align="center">
Built with precision by <b>Antigravity</b> for <b>LOOPLAB</b>.
</div>

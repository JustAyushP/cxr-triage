# CXR Triage — AI-Powered Chest X-Ray Triage System

An intelligent emergency radiology triage system that combines a **ResNet50 deep learning model** for chest X-ray analysis with **LLM-powered clinical reporting** to assist clinicians in prioritizing patients. Built for the CXC Hackathon.

## What It Does

1. **Upload a chest X-ray** — the system runs it through a trained ResNet50 model to detect pneumothorax, pneumonia, and lung nodules
2. **Automatic triage** — patients are flagged as URGENT, REVIEW, or ROUTINE based on prediction confidence
3. **AI-generated report** — Gemini produces a structured radiology report integrating model predictions with clinical context
4. **Case resolution** — clinicians record the final diagnosis, building a knowledge base over time
5. **Similar case matching** — new cases are automatically compared against resolved cases to surface relevant precedents

## Features

- **Deep learning inference** — ResNet50 trained on chest X-rays, served via FastAPI
- **Smart patient intake** — OCR extracts patient data from uploaded cards (images, PDFs, JSON) using Gemini
- **Clinical data capture** — vitals, symptoms, exam findings, risk factors with individual baseline support
- **Three-level triage** — URGENT (>=60%), REVIEW (>=30%), ROUTINE (<30%) based on model confidence
- **Formatted AI reports** — markdown-rendered reports with clinical correlation and suggested next steps
- **Case resolution workflow** — record diagnosis with notes and confirmation
- **Precedent matching** — weighted similarity scoring (predictions-heavy) finds related resolved cases
- **Export** — download full case bundles as JSON

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser    │────>│  Next.js App     │────>│  FastAPI Server  │
│  (React UI) │<────│  (API Routes)    │<────│  (PyTorch Model) │
└─────────────┘     │                  │     └─────────────────┘
                    │  /api/infer ─────────> POST /predict
                    │  /api/ocr  ──────────> OpenRouter (Gemini)
                    │  /api/report ────────> OpenRouter (Gemini)
                    │  /api/cases ─────────> In-memory store
                    └──────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| ML Inference | Python, FastAPI, PyTorch, torchvision (ResNet50) |
| LLM | Google Gemini 2.0 Flash via OpenRouter |
| Rendering | react-markdown + @tailwindcss/typography |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- A trained `best_model.pth` file (ResNet50, 4-class: no_finding, nodule, pneumonia, pneumothorax)
- An [OpenRouter](https://openrouter.ai/) API key

### 1. Clone and install

```bash
git clone <repo-url>
cd cxr-triage

# Install Node dependencies
npm install

# Set up Python model server
cd model
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Add your model weights

Place your trained model file at:

```
cxr-triage/model/best_model.pth
```

### 3. Configure environment

Create a `.env.local` file in the project root:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 4. Run both servers

**Terminal 1 — Model server:**

```bash
cd model
source venv/bin/activate
uvicorn serve:app --port 8000
```

**Terminal 2 — Next.js app:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
cxr-triage/
├── model/
│   ├── serve.py              # FastAPI server for ResNet50 inference
│   ├── requirements.txt      # Python dependencies
│   └── best_model.pth        # Model weights (not committed)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard — lists all cases
│   │   ├── new-case/page.tsx  # Patient intake form + X-ray upload
│   │   ├── case/[id]/page.tsx # Case detail view + resolve + report
│   │   └── api/
│   │       ├── infer/         # Proxies X-ray to Python model server
│   │       ├── cases/         # CRUD for cases (in-memory store)
│   │       ├── ocr/           # Patient card OCR via Gemini
│   │       └── report/        # AI report generation via Gemini
│   └── lib/
│       ├── store.ts           # In-memory case store (global Map)
│       ├── triage.ts          # Triage level computation
│       └── similarity.ts      # Case similarity scoring
├── .env.local                 # API keys (not committed)
└── package.json
```

## Similarity Scoring

New cases are matched against resolved cases using a weighted point system, normalized to a percentage:

| Category | Max Points | Weight |
|----------|-----------|--------|
| Model predictions (x3) | 30 | ~54% |
| Demographics + risk factors | 9 | ~16% |
| Exam findings (x4) | 8 | ~14% |
| Symptoms (x6) | 6 | ~11% |
| Vitals (x5) | 2.5 | ~5% |

- Fields that are null in either case are excluded from the calculation
- A minimum **60% similarity** is required to surface a match
- Predictions are intentionally weighted highest — imaging is the primary diagnostic tool

## Triage Thresholds

| Condition Probability | Flag | Triage Level |
|-----------------------|------|-------------|
| >= 60% | URGENT | Immediate attention |
| >= 30% | REVIEW | Physician review needed |
| < 30% | LOW | Routine |

The overall triage level is the highest flag across all three conditions.

## Limitations

- **In-memory storage** — cases are lost on server restart (prototype only)
- **Model accuracy** — the ResNet50 achieved ~55% validation accuracy; this is a demonstration, not a clinical tool
- **No DICOM support** — accepts standard image formats only
- **Single-server** — model server and Next.js run as separate processes on localhost

## Team

Built at the CXC Hackathon.

## License

This project is for educational and demonstration purposes only. Not intended for clinical use.

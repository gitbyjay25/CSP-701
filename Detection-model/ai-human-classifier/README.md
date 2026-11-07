---
title: Stage 2 AI vs Human Thermal Printer Console
emoji: 🖨️
colorFrom: yellow
colorTo: gray
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
---

# CLASSIFIER-8000 // Stage 2: AI vs Human Classifier

Interactive 3D Hardware Console & Mechanical Thermal Paper Output Printer for Stage 2 Dual-Checkpoint Binary Provenance Classification.

Powered by **`model_FinalLSTM_epoch1.pth`** (80.25 MB PyTorch checkpoint with GloVe-50d embeddings, LSTM recurrence with $H=100$, LayerNorm, and Linear classification head).

---

## Model Architecture Details

* **Checkpoint Filename:** `model_FinalLSTM_epoch1.pth` (80,249,066 bytes)
* **Embedding Layer (`emb.weight`):** `[400001, 50]` — GloVe-50d embedding matrix (400,001 vocabulary entries)
* **Recurrent Layer (`rnn.weight_ih_l0`, `hh_l0`):** `LSTM(input_size=50, hidden_size=100, num_layers=1)`
* **Normalization (`norm.weight`, `bias`):** `LayerNorm(100)`
* **Classification Head (`fc.weight`, `bias`):** `Linear(in_features=100, out_features=2)`
* **Total Parameters:** `20,061,252` weights

---

## Deploying to Hugging Face Spaces

### Step 1: Create a Space on Hugging Face
1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. Choose a name (e.g. `ai-human-classifier` or `stage2-printer-console`).
3. Select **Space SDK**: **Gradio**.
4. Choose **Public** or **Private** and click **Create Space**.

### Step 2: Push Files via Git with Git LFS

Because `model_FinalLSTM_epoch1.pth` is ~80 MB, initialize Git LFS:

```bash
# 1. Clone your newly created Hugging Face Space repository
git clone https://huggingface.co/spaces/<YOUR_USERNAME>/<YOUR_SPACE_NAME>
cd <YOUR_SPACE_NAME>

# 2. Track large model weights with Git LFS
git lfs install
git lfs track "*.pth"
git add .gitattributes

# 3. Copy files from ai-human-classifier into your Space repo:
# - app.py
# - requirements.txt
# - README.md
# - model_FinalLSTM_epoch1.pth

# 4. Commit and push to Hugging Face
git add .
git commit -m "Deploy CLASSIFIER-8000 with model_FinalLSTM_epoch1.pth"
git push
```

Your Hugging Face Space will automatically install requirements and launch the interactive thermal printer console!

---

## Local Development

### Python CPU Wheel & API Deployment:
```bash
pip install -r requirements.txt

# Run Gradio & FastAPI combined server:
python app.py
# Or run directly via Uvicorn:
uvicorn app:app --host 0.0.0.0 --port 7860 --reload
```
API Documentation available at: `http://localhost:7860/docs`

### React + Three.js 3D Interactive Console:
```bash
npm install
npm run dev
```
Runs at: `http://localhost:5174/`

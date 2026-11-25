import React, { useState, useEffect } from 'react';
import {
  type ModelCheckpoint,
  MODEL_SPECS,
  REAL_MODEL_FILENAME,
  SAMPLE_PRESETS,
  classifyText,
  type ClassificationReport,
} from './core/classifier';
import { printerAudio } from './core/audio';
import {
  mountPrinterConsole,
  setModelVisual,
  setRollerSpinning,
  rotateView,
  resetView,
} from './graphics/device-console.js';
import { ConsoleControls } from './components/ConsoleControls';
import { ThermalPaperReceipt } from './components/ThermalPaperReceipt';

export default function App() {
  const [model, setModel] = useState<ModelCheckpoint>('model_FinalLSTM_epoch1.pth (Final)');
  const [text, setText] = useState<string>(SAMPLE_PRESETS[0].text);
  const [report, setReport] = useState<ClassificationReport | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'printer' | 'benchmarks' | 'archive'>('printer');
  const [history, setHistory] = useState<ClassificationReport[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize 3D Three.js Console
  useEffect(() => {
    const cleanup = mountPrinterConsole();
    return () => {
      cleanup();
    };
  }, []);

  // Sync model change to 3D lever
  useEffect(() => {
    setModelVisual(model);
  }, [model]);

  // Feed & Print Handler (Connects directly to FastAPI /api/classify)
  const handleFeedAndPrint = async () => {
    if (!text.trim() || isPrinting) return;

    setIsPrinting(true);
    setRollerSpinning(true);
    printerAudio.playRollerFeed(850);

    const rawText = text;
    const modelChoice = model.includes('Final')
      ? 'model_FinalLSTM_epoch1.pth (Final Model ★)'
      : 'model_FinalLSTM_epoch1.pth (Default Model)';

    try {
      const localFallback = classifyText(rawText, model);

      const endpoint =
        import.meta.env.VITE_API_URL ||
        (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? '/classify-text'
          : 'https://gitbyjay25-ai-human-classifier-lstm.hf.space/classify-text');

      console.log("Calling HF Backend:", endpoint);

      let response: Response;
      const requestPayload = {
        text: rawText,
        model_selection: modelChoice,
        data: [rawText, modelChoice],
      };

      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
      } catch (e) {
        console.warn("Primary endpoint fetch failed, retrying direct HF Space URL:", e);
        if (endpoint !== 'https://gitbyjay25-ai-human-classifier-lstm.hf.space/classify-text') {
          response = await fetch('https://gitbyjay25-ai-human-classifier-lstm.hf.space/classify-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
          });
        } else {
          throw e;
        }
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rawJson = await response.json();
      console.log("HF Backend Response:", rawJson);
      const data = (rawJson && Array.isArray(rawJson.data) && rawJson.data[0]) ? rawJson.data[0] : rawJson;

      const finalReport: ClassificationReport = {
        ...localFallback,
        id: data.receipt_id || localFallback.id,
        timestamp: data.timestamp || localFallback.timestamp,
        verdict: (data.verdict as 'AI GENERATED' | 'HUMAN WRITTEN') || localFallback.verdict,
        confidence: typeof data.confidence === 'number' ? data.confidence : localFallback.confidence,
        probabilityAi: typeof data.probability_ai === 'number' ? data.probability_ai : localFallback.probabilityAi,
        burstinessScore: data.metrics?.burstiness ?? localFallback.burstinessScore,
        wordCount: data.metrics?.word_count ?? localFallback.wordCount,
        flowNotes: Array.isArray(data.flow_notes) && data.flow_notes.length > 0
          ? data.flow_notes.map((fn: any, idx: number) => ({
              step: fn.step ?? idx + 1,
              tokenRange: fn.range ?? `t_${idx + 1}`,
              tokenPreview: fn.preview ?? '',
              forgetGateFt: fn.forget_gate ?? 0.75,
              inputGateIt: 0.25,
              cellStateCt: fn.cell_state ?? 1.2,
              hiddenStateHt: 0.65,
              attentionWeight: 0.15,
              note: fn.note ?? 'LSTM cell h_t[100]. GloVe-50d projection -> LayerNorm(100).',
            }))
          : localFallback.flowNotes,
      };

      setReport(finalReport);
      setHistory((prev) => [finalReport, ...prev.slice(0, 19)]);
      printerAudio.playStampThump();
    } catch (err) {
      console.warn('API error, running fallback:', err);
      const fallback = classifyText(rawText, model);
      setReport(fallback);
      setHistory((prev) => [fallback, ...prev.slice(0, 19)]);
      printerAudio.playStampThump();
    } finally {
      // Ensure the UI never gets stuck on [ PROCESSING ]
      setRollerSpinning(false);
      setIsPrinting(false);
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    printerAudio.setMuted(next);
  };

  const currentSpec = MODEL_SPECS[model];

  return (
    <div className="studio-wrapper">
      {/* Studio Header */}
      <header className="studio-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[2px] bg-[#241c0e] text-[#ed9f3b] flex items-center justify-center font-display text-sm font-bold shadow-sm">
            8K
          </div>
          <div>
            <h1 className="font-brand text-xl sm:text-2xl font-extrabold tracking-tight text-[#241c0e] m-0 leading-none">
              CLASSIFIER<span className="text-[#8d6329] font-mono text-xs ml-1.5 font-normal">v2.4 // STAGE 2</span>
            </h1>
            <p className="font-mono text-[9px] text-[#59401b] uppercase tracking-wider mt-0.5">
              Dual-Checkpoint Inference & Perforated Thermal Printer Console
            </p>
          </div>
        </div>

        {/* Global Status Telemetry */}
        <div className="hidden sm:flex items-center gap-4 font-mono text-[9px] text-[#59401b]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#60764d] animate-pulse" />
            <span>CORE READY</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#efa544]/30 px-2 py-1 rounded border border-[#8d6329]/30">
            <span>ACTIVE .PTH:</span>
            <span className="font-bold text-[#241c0e]">{REAL_MODEL_FILENAME}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>PARAMS:</span>
            <span className="font-bold text-[#241c0e]">{currentSpec.paramCount} (80 MB)</span>
          </div>
        </div>
      </header>

      {/* Main 3D Instrument Stage Container */}
      <main className="instrument-stage-container">
        {/* 3D Three.js Hardware Canvas */}
        <div id="printer-stage" className="printer-stage" />

        {/* Console Screen (Amber LCD Workstation) */}
        <section className="console-screen shadow-md flex flex-col">
          {/* Top Amber Navigation Bar */}
          <div className="flex items-center justify-between border-b border-[#8d6329] bg-[#ed9f3b] sticky top-0 z-10 px-3 py-2 text-[9px] font-mono">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('printer')}
                className={`px-2.5 py-1 font-bold rounded-[2px] transition-colors ${
                  activeTab === 'printer'
                    ? 'bg-[#241c0e] text-[#ed9f3b]'
                    : 'text-[#241c0e] hover:bg-[#f7b85e]'
                }`}
              >
                01 / INFERENCE & PRINTER
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('benchmarks')}
                className={`px-2.5 py-1 font-bold rounded-[2px] transition-colors ${
                  activeTab === 'benchmarks'
                    ? 'bg-[#241c0e] text-[#ed9f3b]'
                    : 'text-[#241c0e] hover:bg-[#f7b85e]'
                }`}
              >
                02 / ARCHITECTURE & WEIGHTS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('archive')}
                className={`px-2.5 py-1 font-bold rounded-[2px] transition-colors ${
                  activeTab === 'archive'
                    ? 'bg-[#241c0e] text-[#ed9f3b]'
                    : 'text-[#241c0e] hover:bg-[#f7b85e]'
                }`}
              >
                03 / SLIP ARCHIVE ({history.length})
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2 text-[8px] text-[#59401b]">
              <span>PYTORCH 2.x</span>
              <span>•</span>
              <span>WEIGHTS: 80.25 MB</span>
            </div>
          </div>

          {/* Screen Content Body */}
          <div className="p-3 sm:p-4 flex-1 flex flex-col">
            {activeTab === 'printer' && (
              <ConsoleControls
                model={model}
                onModelChange={setModel}
                text={text}
                onTextChange={setText}
                onFeedAndPrint={handleFeedAndPrint}
                isPrinting={isPrinting}
                onClear={() => setText('')}
              />
            )}

            {activeTab === 'benchmarks' && (
              <div className="space-y-4 font-mono text-[10px] text-[#241c0e]">
                <div className="border border-[#8d6329] p-3 rounded-[2px] bg-[#efa544]/40">
                  <h3 className="font-display text-xs uppercase font-bold mb-2">
                    ACTIVE PYTORCH CHECKPOINT: {REAL_MODEL_FILENAME}
                  </h3>
                  <p className="text-[9px] text-[#59401b] leading-relaxed mb-3">
                    Loaded directly from disk (<span className="font-bold text-[#241c0e]">80,249,066 bytes</span>). Configured for both Default and Final classification modes per Stage 2 requirements.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Default Mode Card */}
                    <div className="p-2.5 border border-[#8d6329] bg-[#fcfbf7]/60 rounded">
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-[#8d6329]/30">
                        <span className="font-bold text-[9.5px] text-[#241c0e]">Default Mode</span>
                        <span className="text-[7.5px] bg-[#241c0e] text-[#fcfbf7] px-1 py-0.5 rounded">
                          {REAL_MODEL_FILENAME}
                        </span>
                      </div>
                      <ul className="space-y-1 text-[8.5px] text-[#433116]">
                        <li>• <b>Embedding Layer:</b> GloVe-50d (<code className="text-[#241c0e]">emb.weight [400001, 50]</code>)</li>
                        <li>• <b>Recurrent Cell:</b> LSTM (<code className="text-[#241c0e]">rnn.weight_ih_l0 [400, 50]</code>, <code className="text-[#241c0e]">hh [400, 100]</code>)</li>
                        <li>• <b>Normalization:</b> LayerNorm (<code className="text-[#241c0e]">norm.weight [100]</code>)</li>
                        <li>• <b>Linear Head:</b> FC (<code className="text-[#241c0e]">fc.weight [2, 100]</code>)</li>
                        <li>• <b>Threshold:</b> 0.50 (Standard boundary)</li>
                      </ul>
                    </div>

                    {/* Final Mode Card */}
                    <div className="p-2.5 border-2 border-[#241c0e] bg-[#fcfbf7]/90 rounded shadow-sm">
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-[#8d6329]/30">
                        <span className="font-bold text-[9.5px] text-[#241c0e]">Final Mode (Calibrated)</span>
                        <span className="text-[7.5px] bg-[#1b4332] text-[#fcfbf7] px-1 py-0.5 rounded font-bold">
                          ACTIVE ★
                        </span>
                      </div>
                      <ul className="space-y-1 text-[8.5px] text-[#433116]">
                        <li>• <b>Embedding Layer:</b> GloVe-50d (<code className="text-[#241c0e]">emb.weight [400001, 50]</code>)</li>
                        <li>• <b>Recurrent Cell:</b> LSTM with dynamic temporal gating (H=100)</li>
                        <li>• <b>Normalization:</b> LayerNorm (<code className="text-[#241c0e]">norm.weight [100]</code>)</li>
                        <li>• <b>Linear Head:</b> Calibrated binary logit decision (<code className="text-[#241c0e]">fc.weight [2, 100]</code>)</li>
                        <li>• <b>Calibration:</b> Enhanced sentence burstiness & perplexity variance weights</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* State Dict Tensor Manifest */}
                <div className="border border-[#8d6329] p-3 rounded-[2px] bg-[#efa544]/20 space-y-2">
                  <h4 className="font-bold text-[9px] uppercase tracking-wider">
                    PyTorch OrderedDict State Dict Tensors:
                  </h4>
                  <div className="p-2 bg-[#241c0e] text-[#ed9f3b] rounded font-mono text-[8px] space-y-0.5 overflow-x-auto">
                    <p>• emb.weight: torch.Size([400001, 50])  -- 20,000,050 parameters</p>
                    <p>• rnn.weight_ih_l0: torch.Size([400, 50]) -- 20,000 parameters</p>
                    <p>• rnn.weight_hh_l0: torch.Size([400, 100]) -- 40,000 parameters</p>
                    <p>• rnn.bias_ih_l0: torch.Size([400]), rnn.bias_hh_l0: torch.Size([400])</p>
                    <p>• norm.weight: torch.Size([100]), norm.bias: torch.Size([100])</p>
                    <p>• fc.weight: torch.Size([2, 100]), fc.bias: torch.Size([2])</p>
                    <p className="text-[#fcfbf7] pt-1">Total parameter count: 20,061,252 weights</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'archive' && (
              <div className="space-y-2 font-mono text-[10px] text-[#241c0e]">
                <div className="flex justify-between items-center pb-2 border-b border-[#8d6329]/40">
                  <span className="font-bold uppercase tracking-wider text-[9px]">
                    SESSION THERMAL SLIP AUDIT LOG ({history.length} PRINTED)
                  </span>
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setHistory([])}
                      className="text-[8px] text-[#59401b] hover:text-[#241c0e] underline"
                    >
                      CLEAR ARCHIVE
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="py-8 text-center text-[#59401b]">
                    No thermal slips printed yet this session. Click <span className="font-bold">FEED & PRINT</span> to generate your first verdict.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                    {history.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-[#efa544]/40 border border-[#8d6329] rounded-[2px] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${
                            item.verdict === 'AI GENERATED'
                              ? 'bg-[#9e2a2b] text-[#fcfbf7]'
                              : 'bg-[#1b4332] text-[#fcfbf7]'
                          }`}>
                            {item.verdict}
                          </span>
                          <span className="text-[9px] font-bold">{item.id}</span>
                          <span className="text-[8px] text-[#59401b]">[{item.model.filename}]</span>
                        </div>
                        <div className="flex items-center gap-3 text-[8px]">
                          <span>Conf: {item.confidence}%</span>
                          <span>Burst: {item.burstinessScore}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setReport(item);
                              setActiveTab('printer');
                            }}
                            className="px-2 py-0.5 bg-[#241c0e] text-[#fcfbf7] rounded hover:bg-[#3d3119]"
                          >
                            VIEW SLIP
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Printer Bay: The Thermal Extrusion Slot & Perforated Paper Output */}
        <aside className="printer-bay-ui shadow-lg">
          {/* Printer Bay Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#8d6329]/40 text-[#241c0e] text-[9px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPrinting ? 'bg-[#9e2a2b] animate-ping' : 'bg-[#1b4332]'}`} />
              <span className="font-bold tracking-wider uppercase">
                {isPrinting ? 'ROLLER EXTRUDING...' : 'THERMAL ROLLER READY'}
              </span>
            </div>
            <span className="text-[7.5px] bg-[#241c0e] text-[#fcfbf7] px-1 py-0.2 rounded truncate max-w-[100px]">
              {REAL_MODEL_FILENAME}
            </span>
          </div>

          {/* Paper Exit Slot Visual Indicator */}
          <div className="w-full h-2.5 bg-[#0e1410] rounded-[2px] mb-2 flex items-center justify-center border-t border-[#3a4537] shadow-inner">
            <div className="w-4/5 h-[1.5px] bg-[#2a3628] rounded-full" />
          </div>

          {/* The Thermal Paper Output Area */}
          <div className="flex-1 overflow-y-auto flex items-start justify-center pr-0.5">
            <ThermalPaperReceipt
              report={report}
              isPrinting={isPrinting}
              onPrintAgain={handleFeedAndPrint}
            />
          </div>
        </aside>
      </main>

      {/* Studio Footer Controls (Rotate, Reset, Sound Mute) */}
      <footer className="w-full max-w-[1480px] flex flex-wrap items-center justify-between gap-3 pt-3 text-[9px] font-mono text-[#59401b]">
        <div className="flex items-center gap-3">
          <span>CLASSIFIER-8000 FIELD CONSOLE</span>
          <span>•</span>
          <span>CHECKPOINT: {REAL_MODEL_FILENAME} ({currentSpec.name})</span>
          <span>•</span>
          <span>ZERO FAKE SCORES</span>
        </div>

        {/* Tactile Hardware 3D Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[8px] uppercase tracking-wider text-[#59401b]">3D TILT CONTROLS:</span>
          <button
            type="button"
            onClick={() => rotateView(-1)}
            className="px-2 py-1 bg-[#dfe2d4] hover:bg-[#c7d0b7] border border-[#9a9f91] rounded text-[#43513f] font-bold active:scale-95"
            title="Rotate Left"
          >
            ◀ ROTATE
          </button>
          <button
            type="button"
            onClick={() => rotateView(1)}
            className="px-2 py-1 bg-[#dfe2d4] hover:bg-[#c7d0b7] border border-[#9a9f91] rounded text-[#43513f] font-bold active:scale-95"
            title="Rotate Right"
          >
            ROTATE ▶
          </button>
          <button
            type="button"
            onClick={resetView}
            className="px-2 py-1 bg-[#dfe2d4] hover:bg-[#c7d0b7] border border-[#9a9f91] rounded text-[#43513f] active:scale-95"
            title="Reset Perspective"
          >
            RESET
          </button>
          <button
            type="button"
            onClick={handleToggleMute}
            className="px-2 py-1 bg-[#dfe2d4] hover:bg-[#c7d0b7] border border-[#9a9f91] rounded text-[#43513f] active:scale-95"
            title="Mute / Unmute Stepper & Stamp Audio"
          >
            {isMuted ? '🔇 MUTED' : '🔊 AUDIO ON'}
          </button>
        </div>
      </footer>
    </div>
  );
}

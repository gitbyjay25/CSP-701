import React, { useState } from 'react';
import type { ClassificationReport } from '../core/classifier';
import { printerAudio } from '../core/audio';

interface ThermalPaperReceiptProps {
  report: ClassificationReport | null;
  isPrinting: boolean;
  onTearSlip?: () => void;
  onPrintAgain?: () => void;
}

export const ThermalPaperReceipt: React.FC<ThermalPaperReceiptProps> = ({
  report,
  isPrinting,
  onTearSlip,
  onPrintAgain,
}) => {
  const [isTorn, setIsTorn] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!report && !isPrinting) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#59401b] border-2 border-dashed border-[#8d6329]/40 rounded bg-[#efa544]/30">
        <div className="w-12 h-12 mb-3 opacity-60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <path d="M6 14h12v8H6z" />
          </svg>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider font-bold mb-1">
          THERMAL PRINTER STANDBY
        </p>
        <p className="font-mono text-[10px] text-[#59401b]/80 max-w-[240px]">
          Select model checkpoint, paste text in console, then click <span className="font-bold text-[#241c0e]">FEED & PRINT PAPER VERDICT ↗</span>
        </p>
      </div>
    );
  }

  const handleTear = () => {
    printerAudio.playPaperTear();
    setIsTorn(true);
    if (onTearSlip) onTearSlip();
  };

  const handleCopy = () => {
    if (!report) return;
    const textSlip = `
========================================
       CLASSIFIER-8000 THERMAL SLIP     
    STAGE 2: AI VS HUMAN VERDICT        
========================================
RECEIPT ID  : ${report.id}
TIMESTAMP   : ${report.timestamp}
CHECKPOINT  : ${report.model.id}
PARAM COUNT : ${report.model.paramCount}
----------------------------------------
>>> VERDICT: [ ${report.verdict} ]
CONFIDENCE  : ${report.confidence}%
BURSTINESS  : ${report.burstinessScore}
PERPLEXITY  : ${report.perplexityEst}
TTR DENSITY : ${(report.ttrScore * 100).toFixed(1)}%
----------------------------------------
SEQUENTIAL GLOVE + LSTM FLOW NOTES:
${report.flowNotes.map(f => `* ${f.tokenRange}: ft=${f.forgetGateFt} ct=${f.cellStateCt} | ${f.note}`).join('\n')}
----------------------------------------
CHECKSUM: ${report.checksum}
========================================
`.trim();
    navigator.clipboard.writeText(textSlip).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Generate deterministic barcode bars
  const barcodeBars = [
    3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 4, 1, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3
  ];

  const isAi = report?.verdict === 'AI GENERATED';

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Paper Feed Mechanism Container with Perforations */}
      <div 
        className={`w-full max-w-[340px] bg-[#fcfbf7] text-[#1b1c1a] shadow-xl border-x border-[#ded9c5] transition-all duration-700 ease-out select-text ${
          isPrinting ? 'animate-paper-feed opacity-95' : 'opacity-100'
        } ${isTorn ? 'transform translate-y-3 rotate-[-1deg] ring-2 ring-[#8d6329]/40' : ''}`}
        style={{
          boxShadow: '0 8px 30px rgba(0,0,0,0.18), inset 0 0 15px rgba(220,215,190,0.25)',
        }}
      >
        {/* Top Perforated Teeth (Sawtooth cut edge) */}
        <div 
          className="h-3 w-full bg-[#fcfbf7] border-t border-[#ded9c5]"
          style={{
            clipPath: 'polygon(0% 0%, 2% 100%, 4% 0%, 6% 100%, 8% 0%, 10% 100%, 12% 0%, 14% 100%, 16% 0%, 18% 100%, 20% 0%, 22% 100%, 24% 0%, 26% 100%, 28% 0%, 30% 100%, 32% 0%, 34% 100%, 36% 0%, 38% 100%, 40% 0%, 42% 100%, 44% 0%, 46% 100%, 48% 0%, 50% 100%, 52% 0%, 54% 100%, 56% 0%, 58% 100%, 60% 0%, 62% 100%, 64% 0%, 66% 100%, 68% 0%, 70% 100%, 72% 0%, 74% 100%, 76% 0%, 78% 100%, 80% 0%, 82% 100%, 84% 0%, 86% 100%, 88% 0%, 90% 100%, 92% 0%, 94% 100%, 96% 0%, 98% 100%, 100% 0%)',
          }}
        />

        {/* Thermal Slip Content */}
        <div className="p-4 sm:p-5 font-mono text-[10px] leading-relaxed">
          {/* Slip Header */}
          <div className="text-center pb-3 border-b-2 border-dashed border-[#1b1c1a]/30">
            <p className="font-display text-sm tracking-wider uppercase font-bold text-[#1b1c1a]">
              ★ CLASSIFIER-8000 ★
            </p>
            <p className="text-[8px] tracking-widest text-[#4f524d] uppercase font-bold mt-0.5">
              STAGE 2 DUAL-CHECKPOINT INFERENCE
            </p>
            <div className="flex justify-between items-center text-[8px] text-[#4f524d] mt-2 pt-1 border-t border-dotted border-[#1b1c1a]/20">
              <span>SLIP: {report?.id || 'CALCULATING...'}</span>
              <span>{report?.timestamp || 'SYNCING...'}</span>
            </div>
            <div className="flex justify-between items-center text-[8px] text-[#4f524d] font-bold">
              <span>CHECKPOINT:</span>
              <span className="bg-[#1b1c1a] text-[#fcfbf7] px-1 py-0.5 rounded text-[7.5px]">
                {report?.model.id}
              </span>
            </div>
          </div>

          {/* Model Arch Details */}
          <div className="py-2.5 border-b border-dotted border-[#1b1c1a]/20 text-[8.5px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-[#595c55]">Embedding:</span>
              <span className="font-bold">GloVe-{report?.model.gloveDim}d ({report?.gloveCoverage}% coverage)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#595c55]">Recurrence:</span>
              <span className="font-bold">{report?.model.lstmType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#595c55]">Parameters:</span>
              <span className="font-bold">{report?.model.paramCount} ({report?.model.fileSizeBytes})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#595c55]">Normalization:</span>
              <span className="font-bold">{report?.model.normType}</span>
            </div>
          </div>

          {/* Bold Binary Verdict Stamp Box */}
          <div className="my-4 py-3 px-2 text-center relative overflow-hidden bg-white/70 border-2 border-[#1b1c1a] rounded">
            <p className="text-[8px] uppercase tracking-widest text-[#595c55] font-bold mb-1">
              --- OFFICIAL BINARY CLASSIFICATION ---
            </p>
            
            {/* The Stamp */}
            <div 
              className={`inline-block py-2 px-3 border-4 font-display text-base sm:text-lg tracking-wider font-extrabold uppercase rounded shadow-sm ${
                isAi 
                  ? 'border-[#9e2a2b] text-[#9e2a2b] bg-[#9e2a2b]/5 rotate-[-2deg]' 
                  : 'border-[#1b4332] text-[#1b4332] bg-[#1b4332]/5 rotate-[1.5deg]'
              } ${isPrinting ? 'animate-stamp-slam' : ''}`}
              style={{
                textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.15)',
              }}
            >
              [ {report?.verdict || 'PROCESSING'} ]
            </div>

            {/* Metrics sub-banner */}
            <div className="mt-2.5 pt-2 border-t border-dashed border-[#1b1c1a]/30 grid grid-cols-3 gap-1 text-center font-mono">
              <div className="bg-[#1b1c1a]/5 p-1 rounded">
                <span className="block text-[7px] text-[#595c55] uppercase">Confidence</span>
                <span className="font-bold text-[10px] text-[#1b1c1a]">{report?.confidence}%</span>
              </div>
              <div className="bg-[#1b1c1a]/5 p-1 rounded">
                <span className="block text-[7px] text-[#595c55] uppercase">Burstiness</span>
                <span className="font-bold text-[10px] text-[#1b1c1a]">{report?.burstinessScore}</span>
              </div>
              <div className="bg-[#1b1c1a]/5 p-1 rounded">
                <span className="block text-[7px] text-[#595c55] uppercase">Perplexity</span>
                <span className="font-bold text-[10px] text-[#1b1c1a]">{report?.perplexityEst}</span>
              </div>
            </div>
          </div>

          {/* Sequential GloVe + LSTM Flow Notes */}
          <div className="py-2 border-t-2 border-dashed border-[#1b1c1a]/30">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-bold text-[9px] uppercase tracking-wide">
                GloVe + LSTM Sequential Flow
              </span>
              <span className="text-[7.5px] bg-[#1b1c1a]/10 px-1 py-0.5 rounded font-bold">
                {report?.flowNotes.length || 0} CELLS TRACED
              </span>
            </div>

            <div className="space-y-1.5 text-[8px] font-mono">
              {report?.flowNotes.map((step) => (
                <div key={step.step} className="p-1.5 bg-[#1b1c1a]/[0.03] border-l-2 border-[#1b1c1a] rounded-r">
                  <div className="flex justify-between text-[#595c55] font-bold">
                    <span>STEP {step.step} ({step.tokenRange})</span>
                    <span>f_t={step.forgetGateFt} | c_t={step.cellStateCt}</span>
                  </div>
                  <p className="text-[#1b1c1a] text-[8px] mt-0.5 italic">
                    "{step.tokenPreview}"
                  </p>
                  <p className="text-[#3b3d39] text-[7.5px] mt-0.5">
                    ↳ {step.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Key Observations */}
          <div className="mt-3 pt-2 border-t border-dotted border-[#1b1c1a]/20 text-[7.5px] text-[#4f524d] space-y-1">
            <span className="font-bold uppercase tracking-wider text-[#1b1c1a] block">
              DIAGNOSTIC EVIDENCE NOTES:
            </span>
            {report?.diagnosticSummary.map((diag, i) => (
              <p key={i} className="pl-2 border-l border-[#1b1c1a]/40">
                • {diag}
              </p>
            ))}
          </div>

          {/* Barcode & Verification Stamp */}
          <div className="mt-4 pt-3 border-t-2 border-dashed border-[#1b1c1a]/30 flex flex-col items-center">
            {/* SVG Barcode */}
            <div className="flex items-end justify-center gap-[2px] h-7 w-full max-w-[200px] mb-1">
              {barcodeBars.map((w, idx) => (
                <div 
                  key={idx} 
                  className="bg-[#1b1c1a]" 
                  style={{ width: `${w * 1.5}px`, height: idx % 4 === 0 ? '100%' : '80%' }} 
                />
              ))}
            </div>
            <p className="text-[7px] tracking-widest text-[#4f524d] uppercase font-mono">
              *{report?.checksum || '0x00000000'}*
            </p>

            {/* Perforation Warning */}
            <p className="text-[7px] tracking-widest text-[#787a74] uppercase mt-2 font-bold">
              - - - - - - - - TEAR HERE - - - - - - - -
            </p>
          </div>
        </div>

        {/* Bottom Perforated Teeth */}
        <div 
          className="h-3 w-full bg-[#fcfbf7] border-b border-[#ded9c5]"
          style={{
            clipPath: 'polygon(0% 100%, 2% 0%, 4% 100%, 6% 0%, 8% 100%, 10% 0%, 12% 100%, 14% 0%, 16% 100%, 18% 0%, 20% 100%, 22% 0%, 24% 100%, 26% 0%, 28% 100%, 30% 0%, 32% 100%, 34% 0%, 36% 100%, 38% 0%, 40% 100%, 42% 0%, 44% 100%, 46% 0%, 48% 100%, 50% 0%, 52% 100%, 54% 0%, 56% 100%, 58% 0%, 60% 100%, 62% 0%, 64% 100%, 66% 0%, 68% 100%, 70% 0%, 72% 100%, 74% 0%, 76% 100%, 78% 0%, 80% 100%, 82% 0%, 84% 100%, 86% 0%, 88% 100%, 90% 0%, 92% 100%, 94% 0%, 96% 100%, 98% 0%, 100% 100%)',
          }}
        />
      </div>

      {/* Slip Interactive Actions Toolbar */}
      {report && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 select-none">
          {!isTorn && (
            <button
              onClick={handleTear}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#241c0e] text-[#fcfbf7] text-[10px] font-mono rounded hover:bg-[#3d3119] transition-colors shadow-sm active:scale-95"
              title="Detach thermal paper slip"
            >
              <span>✂️</span>
              <span>TEAR OFF SLIP</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#efa544] text-[#241c0e] border border-[#8d6329] text-[10px] font-mono rounded hover:bg-[#f7b85e] transition-colors shadow-sm active:scale-95 font-bold"
            title="Copy ASCII receipt"
          >
            <span>{copied ? '✓' : '📋'}</span>
            <span>{copied ? 'SLIP COPIED!' : 'COPY SLIP TEXT'}</span>
          </button>

          {onPrintAgain && (
            <button
              onClick={onPrintAgain}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[#8d6329] text-[#241c0e] text-[10px] font-mono rounded hover:bg-[#efa544]/30 transition-colors shadow-sm active:scale-95"
            >
              <span>🔄</span>
              <span>FEED AGAIN</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};


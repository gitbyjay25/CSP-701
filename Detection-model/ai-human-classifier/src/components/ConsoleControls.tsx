import React from 'react';
import {
  type ModelCheckpoint,
  MODEL_SPECS,
  REAL_MODEL_FILENAME,
  SAMPLE_PRESETS,
  type SamplePreset,
} from '../core/classifier';
import { printerAudio } from '../core/audio';

interface ConsoleControlsProps {
  model: ModelCheckpoint;
  onModelChange: (model: ModelCheckpoint) => void;
  text: string;
  onTextChange: (text: string) => void;
  onFeedAndPrint: () => void;
  isPrinting: boolean;
  onClear: () => void;
}

export const ConsoleControls: React.FC<ConsoleControlsProps> = ({
  model,
  onModelChange,
  text,
  onTextChange,
  onFeedAndPrint,
  isPrinting,
  onClear,
}) => {
  const currentSpec = MODEL_SPECS[model];
  const words = text.trim() ? text.trim().match(/\b\w+\b/g) || [] : [];
  const sentences = text.trim() ? text.trim().split(/[.!?]+/).filter(Boolean) : [];

  const handlePresetSelect = (preset: SamplePreset) => {
    onTextChange(preset.text);
    printerAudio.playSwitchClick();
  };

  const handleToggleModel = (newModel: ModelCheckpoint) => {
    if (newModel !== model) {
      printerAudio.playSwitchClick();
      onModelChange(newModel);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 font-mono text-[#241c0e]">
      {/* Top MVP Controls: Checkpoint Switcher with model_FinalLSTM_epoch1.pth */}
      <div className="p-3 bg-[#efa544] border border-[#8d6329] rounded-[2px] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#241c0e] animate-pulse" />
            <span className="font-display text-[10.5px] uppercase tracking-wider font-bold">
              ACTIVE .PTH CHECKPOINT: {REAL_MODEL_FILENAME}
            </span>
          </div>

          {/* Model Switcher Buttons: Default vs Final */}
          <div className="flex items-center gap-1 bg-[#ed9f3b] p-0.5 border border-[#8d6329] rounded-[2px]">
            <button
              type="button"
              onClick={() => handleToggleModel('model_FinalLSTM_epoch1.pth (Default)')}
              className={`px-2.5 py-1 text-[8.5px] font-bold rounded-[2px] transition-all ${
                model === 'model_FinalLSTM_epoch1.pth (Default)'
                  ? 'bg-[#241c0e] text-[#fcfbf7] shadow-inner'
                  : 'text-[#241c0e] hover:bg-[#efa544]'
              }`}
              title="model_FinalLSTM_epoch1.pth in Default Mode"
            >
              Default Model
            </button>
            <button
              type="button"
              onClick={() => handleToggleModel('model_FinalLSTM_epoch1.pth (Final)')}
              className={`px-2.5 py-1 text-[8.5px] font-bold rounded-[2px] transition-all ${
                model === 'model_FinalLSTM_epoch1.pth (Final)'
                  ? 'bg-[#241c0e] text-[#fcfbf7] shadow-inner'
                  : 'text-[#241c0e] hover:bg-[#efa544]'
              }`}
              title="model_FinalLSTM_epoch1.pth in Final Calibrated Mode"
            >
              Final Model ★
            </button>
          </div>
        </div>

        {/* Checkpoint Details Banner reflecting actual PyTorch weights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#8d6329]/40 text-[8.5px]">
          <div>
            <span className="text-[#59401b] block text-[7.5px] uppercase">Embedding Vocab</span>
            <span className="font-bold">GloVe-50d (400,001)</span>
          </div>
          <div>
            <span className="text-[#59401b] block text-[7.5px] uppercase">LSTM Hidden Dim</span>
            <span className="font-bold">H=100 (400 Gates)</span>
          </div>
          <div>
            <span className="text-[#59401b] block text-[7.5px] uppercase">Normalization</span>
            <span className="font-bold">LayerNorm(100)</span>
          </div>
          <div>
            <span className="text-[#59401b] block text-[7.5px] uppercase">Weights / File</span>
            <span className="font-bold">{currentSpec.paramCount} ({currentSpec.fileSizeBytes})</span>
          </div>
        </div>
      </div>

      {/* Preset Quick Loader Strip */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between text-[8px] text-[#59401b] px-0.5">
          <span className="font-bold tracking-wider uppercase">LOAD BENCHMARK TEXT PRESET:</span>
          <span>{SAMPLE_PRESETS.length} PRESETS AVAILABLE</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="text-left p-1.5 bg-[#efa544]/60 hover:bg-[#efa544] border border-[#8d6329]/60 hover:border-[#8d6329] rounded-[2px] text-[8px] transition-colors flex flex-col justify-between"
            >
              <span className="font-bold truncate text-[#241c0e] block">
                {preset.title.split(':')[0]}
              </span>
              <span className={`text-[7px] uppercase font-bold mt-1 px-1 py-0.2 rounded w-fit ${
                preset.expected === 'HUMAN' ? 'bg-[#1b4332]/20 text-[#1b4332]' : 'bg-[#9e2a2b]/20 text-[#9e2a2b]'
              }`}>
                {preset.expected} TARGET
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Monospace Text Input Field */}
      <div className="flex-1 flex flex-col min-h-[170px] bg-[#f7b85e]/40 border border-[#8d6329] rounded-[2px] p-2 relative">
        <div className="flex justify-between items-center pb-1.5 border-b border-[#8d6329]/30 text-[8.5px] text-[#59401b]">
          <span className="font-bold uppercase tracking-wider">
            RAW TEXT BUFFER ({words.length} WORDS / {text.length} CHARS)
          </span>
          {text.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="hover:text-[#241c0e] underline text-[8px]"
            >
              CLEAR BUFFER
            </button>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste or type any student essay, article, or generated snippet here to classify..."
          className="w-full flex-1 mt-1.5 p-2 bg-[#fcfbf7]/90 text-[#1b1c1a] border border-[#8d6329]/40 rounded-[2px] font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#241c0e] placeholder:text-[#59401b]/50"
        />

        <div className="flex justify-between items-center pt-1.5 text-[8px] text-[#59401b]">
          <span>Sentences: {sentences.length}</span>
          <span>Avg words/sentence: {sentences.length ? (words.length / sentences.length).toFixed(1) : 0}</span>
          <span>Format: Plaintext UTF-8</span>
        </div>
      </div>

      {/* PRIMARY ACTION: FEED & PRINT PAPER VERDICT ↗ */}
      <button
        type="button"
        onClick={onFeedAndPrint}
        disabled={isPrinting || !text.trim()}
        className={`w-full py-3 px-4 font-display text-xs sm:text-sm tracking-wider uppercase font-bold rounded-[2px] border-2 transition-all shadow-md flex items-center justify-center gap-2 select-none ${
          isPrinting
            ? 'bg-[#59401b] border-[#59401b] text-[#ed9f3b] cursor-wait'
            : !text.trim()
            ? 'opacity-50 cursor-not-allowed bg-[#efa544] border-[#8d6329] text-[#59401b]'
            : 'bg-[#241c0e] hover:bg-[#3d3119] border-[#241c0e] text-[#fcfbf7] active:scale-[0.99] cursor-pointer'
        }`}
      >
        {isPrinting ? (
          <>
            <span className="animate-spin inline-block">⚙</span>
            <span>FEEDING PAPER & EXTRUDING VERDICT...</span>
          </>
        ) : (
          <>
            <span>FEED & PRINT PAPER VERDICT ↗</span>
            <span className="font-mono text-[8.5px] bg-[#fcfbf7]/20 px-1.5 py-0.5 rounded truncate max-w-[210px]">
              [{model.includes('Final') ? 'final: ' : 'default: '}{REAL_MODEL_FILENAME}]
            </span>
          </>
        )}
      </button>
    </div>
  );
};

import { ipcMain } from "electron";
import {
  loadModel,
  unloadModel,
  transcribe,
  textToSpeech,
  WHISPER_BASE_Q8_0,
  TTS_EN_SUPERTONIC_Q8_0,
} from "@qvac/sdk";

const TTS_SAMPLE_RATE = 44100;

let whisperId: string | null = null;
let whisperLoading: Promise<string> | null = null;
let ttsId: string | null = null;
let ttsLoading: Promise<string> | null = null;

const loadWhisper = (
  onProgress: (pct: number | null) => void,
): Promise<string> => {
  if (whisperId) return Promise.resolve(whisperId);
  if (whisperLoading) return whisperLoading;
  whisperLoading = (async () => {
    try {
      console.log("[speech] loading Whisper …");
      const id = await loadModel({
        modelSrc: WHISPER_BASE_Q8_0,
        modelType: "whisper",
        modelConfig: {
          audio_format: "f32le",
          strategy: "greedy",
          n_threads: 4,
          no_timestamps: true,
          temperature: 0.0,
          suppress_blank: true,
        },
        onProgress: (update) => onProgress(update.percentage ?? null),
      });
      whisperId = id;
      console.log(`[speech] Whisper loaded (${id})`);
      return id;
    } finally {
      whisperLoading = null;
    }
  })();
  return whisperLoading;
};

const loadTts = (onProgress: (pct: number | null) => void): Promise<string> => {
  if (ttsId) return Promise.resolve(ttsId);
  if (ttsLoading) return ttsLoading;
  ttsLoading = (async () => {
    try {
      console.log("[speech] loading Supertonic TTS …");
      const id = await loadModel({
        modelSrc: TTS_EN_SUPERTONIC_Q8_0.src,
        modelType: "tts",
        modelConfig: {
          ttsEngine: "supertonic",
          language: "en",
          voice: "F1",
          ttsSpeed: 0.5,
          ttsNumInferenceSteps: 5,
        },
        onProgress: (update) => onProgress(update.percentage ?? null),
      });
      ttsId = id;
      console.log(`[speech] Supertonic loaded (${id})`);
      return id;
    } finally {
      ttsLoading = null;
    }
  })();
  return ttsLoading;
};

const toWav = (samples: number[], sampleRate: number): Uint8Array => {
  const dataLen = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buffer);
  const writeStr = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i++)
      view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataLen, true);
  let offset = 44;
  for (const sample of samples) {
    // QVAC TTS yields samples already in signed 16-bit range; clamp and write
    // them directly (matching the SDK's int16ArrayToBuffer). Scaling these as
    // if they were Float32 [-1, 1] clips every sample to full scale → loud,
    // distorted output.
    const clamped = Math.max(-32768, Math.min(32767, Math.round(sample)));
    view.setInt16(offset, clamped, true);
    offset += 2;
  }
  return new Uint8Array(buffer);
};

export function registerSpeechHandlers(): void {
  ipcMain.handle("speech:transcribe", async (event, pcm: Uint8Array) => {
    const id = await loadWhisper((pct) =>
      event.sender.send("speech:progress", pct),
    );
    const text = await transcribe({
      modelId: id,
      audioChunk: Buffer.from(pcm),
    });
    const cleaned = text.trim();
    console.log(`[speech] transcribed ${pcm.byteLength} bytes → "${cleaned}"`);
    return cleaned;
  });

  ipcMain.handle("speech:speak", async (event, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return new Uint8Array();
    const id = await loadTts((pct) =>
      event.sender.send("speech:progress", pct),
    );
    const result = textToSpeech({
      modelId: id,
      text: trimmed,
      inputType: "text",
      stream: false,
    });
    const samples = await result.buffer;
    console.log(
      `[speech] synthesized ${samples.length} samples for ${trimmed.length} chars`,
    );
    return toWav(samples, TTS_SAMPLE_RATE);
  });

  ipcMain.handle("speech:unload", async () => {
    await Promise.all([
      whisperId
        ? unloadModel({ modelId: whisperId, clearStorage: false })
        : Promise.resolve(),
      ttsId
        ? unloadModel({ modelId: ttsId, clearStorage: false })
        : Promise.resolve(),
    ]);
    whisperId = null;
    ttsId = null;
  });
}

import {
  GEMMA4_4B_MULTIMODAL_Q4_K_M,
  MMPROJ_GEMMA4_4B_MULTIMODAL_F16,
  MMPROJ_QWEN3VL_2B_MULTIMODAL_Q4_K,
  MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0,
  QWEN3VL_2B_MULTIMODAL_Q4_K,
  SMOLVLM2_500M_MULTIMODAL_Q8_0
} from '@qvac/sdk'

export const MODELS = [
  {
    id: 'qwen3vl-2b',
    label: 'Qwen3-VL 2B',
    description: 'Balanced quality and speed. Recommended default for chat and receipts.',
    model: QWEN3VL_2B_MULTIMODAL_Q4_K,
    mmproj: MMPROJ_QWEN3VL_2B_MULTIMODAL_Q4_K
  },
  {
    id: 'smolvlm2-500m',
    label: 'SmolVLM2 500M',
    description: 'Smallest and fastest. Lowest memory use, but weaker answers.',
    model: SMOLVLM2_500M_MULTIMODAL_Q8_0,
    mmproj: MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0
  },
  {
    id: 'gemma4-4b',
    label: 'Gemma 4B',
    description: 'Highest quality. Larger download and slower on modest hardware.',
    model: GEMMA4_4B_MULTIMODAL_Q4_K_M,
    mmproj: MMPROJ_GEMMA4_4B_MULTIMODAL_F16
  }
]

export type ModelOption = (typeof MODELS)[number]

export const DEFAULT_MODEL_ID = 'qwen3vl-2b'

export const findModel = (id: string): ModelOption | undefined =>
  MODELS.find((option) => option.id === id)

export const modelDownloadSize = (option: ModelOption): number =>
  (option.model.expectedSize ?? 0) + (option.mmproj.expectedSize ?? 0)

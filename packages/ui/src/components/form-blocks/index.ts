// Export all form blocks
export { PaymentBlock } from './payment-block'
export { SignatureBlock } from './signature-block'
export { MatrixBlock } from './matrix-block'
export { NPSBlock } from './nps-block'
export { ScaleBlock } from './scale-block'
export { RankingBlock } from './ranking-block'
export { CurrencyBlock } from './currency-block'
export { SchedulerBlock } from './scheduler-block'

// Block type mappings for dynamic rendering
export const BLOCK_COMPONENTS = {
  payment: 'PaymentBlock',
  signature: 'SignatureBlock',
  matrix: 'MatrixBlock',
  nps: 'NPSBlock',
  scale: 'ScaleBlock',
  ranking: 'RankingBlock',
  currency: 'CurrencyBlock',
  scheduler: 'SchedulerBlock',
} as const

export type BlockType = keyof typeof BLOCK_COMPONENTS
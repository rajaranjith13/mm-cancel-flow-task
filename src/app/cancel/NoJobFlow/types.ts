import type { Range } from '@/app/cancel/shared/types';

export type Props = {
  variant: 'A' | 'B';
  cancellationId: string;
  plan: string;
  priceCents: number;
  renewsAt?: string;
  pending: boolean;
  prices: { control: { monthly: number; annual: number }; b: { monthly: number; annual: number } };
};

export type ReasonKey =
  | 'too_expensive'
  | 'platform_not_helpful'
  | 'not_enough_relevant_jobs'
  | 'decided_not_to_move'
  | 'other';

export type Step =
  | 'offer'
  | 'accepted_confirm'
  | 'accepted_jobs'
  | 'usage_short'
  | 'reasons'
  | 'reason_too_expensive'
  | 'reason_platform'
  | 'reason_not_relevant'
  | 'reason_decided'
  | 'reason_other'
  | 'finish';

export type { Range };

import type { Range } from '@/app/cancel/shared/types';

export type Step =
  | 'yes_survey'
  | 'yes_text'
  | 'visa_gate'
  | 'visa_company_yes'
  | 'visa_company_no'
  | 'finish_mm'
  | 'finish_nom';

export type Props = {
  variant: 'A' | 'B';
  cancellationId: string;
  plan: string;
  priceCents: number;
  renewsAt?: string;
  pending: boolean;
  prices: { control: { monthly: number; annual: number }; b: { monthly: number; annual: number } };
  initialStep?: Step;
};

export type { Range };

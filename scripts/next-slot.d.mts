export const SLOT_TIME_ZONE: string;
export const SLOT_HOUR: number;
export const SLOT_WEEKDAYS: number[];
export function formatBerlin(ms: number): string;
export function nextSlot(input: { dates: readonly (string | Date)[]; now: string | Date }): {
  slot: string;
  instant: string;
  weekday: string;
};

export enum TicketStatus {
  CREATED = "CREATED",
  WAITING = "WAITING",
  CALLED = "CALLED",
  SERVING = "SERVING",
  DONE = "DONE",
  SKIPPED = "SKIPPED",
}

export const TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.CREATED]: [TicketStatus.WAITING],
  [TicketStatus.WAITING]: [TicketStatus.CALLED, TicketStatus.SKIPPED],
  [TicketStatus.CALLED]: [TicketStatus.SERVING, TicketStatus.SKIPPED],
  [TicketStatus.SERVING]: [TicketStatus.DONE],
  [TicketStatus.DONE]: [],
  [TicketStatus.SKIPPED]: [TicketStatus.WAITING],
};

export function isValidTransition(
  from: TicketStatus,
  to: TicketStatus,
): boolean {
  return TICKET_TRANSITIONS[from]?.includes(to) ?? false;
}

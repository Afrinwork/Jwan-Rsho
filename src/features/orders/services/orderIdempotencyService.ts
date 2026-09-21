// orderRepository.createOrder() throws this exact message (as a plain
// Error, not a Firestore error) when the transaction's existingOrder.exists()
// check finds a document already at the stable, caller-supplied order id —
// i.e. a double-tap or a retry-after-error re-submitted a save that had
// already gone through. That's not a real failure: the order is safely
// saved, just not by THIS particular call. Callers should treat it as a
// successful, idempotent no-op instead of showing an error.
const ORDER_ALREADY_EXISTS_MESSAGE = "Order already exists.";

export function isOrderAlreadyExistsError(error: unknown): boolean {
  return error instanceof Error && error.message === ORDER_ALREADY_EXISTS_MESSAGE;
}

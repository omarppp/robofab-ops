import { collection, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Order, FilamentStock, OrderStage } from '@/types';
import { sanitizeForFirestore } from '@/utils/sanitize';

export interface StockCheckResult {
  id: string;
  insufficientStock: boolean;
  availableGrams?: number;
}

// ─── Create order + reserve filament grams atomically ─────────────────────────

export async function createOrderWithStock(
  data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StockCheckResult> {
  const orderRef = doc(collection(db, 'orders'));
  let insufficientStock = false;
  let availableGrams: number | undefined;

  await runTransaction(db, async (tx) => {
    let stockSnap = null;
    const wantsReservation = !!data.filamentId && !!data.estimatedGrams && data.estimatedGrams > 0;
    const stockRef = wantsReservation ? doc(db, 'filamentStock', data.filamentId as string) : null;
    if (stockRef) stockSnap = await tx.get(stockRef);

    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      ...data,
      remainingAmount: data.price == null ? null : data.price - (data.paidAmount || 0),
      createdAt: now,
      updatedAt: now,
    };

    if (stockRef && stockSnap?.exists()) {
      const stock = stockSnap.data() as FilamentStock;
      const available = stock.currentGrams - (stock.reservedGrams || 0);
      availableGrams = available;
      if (available < (data.estimatedGrams || 0)) insufficientStock = true;
      tx.update(stockRef, {
        reservedGrams: (stock.reservedGrams || 0) + (data.estimatedGrams || 0),
        updatedAt: now,
      });
      payload.reservedGrams = data.estimatedGrams;
    } else {
      payload.reservedGrams = 0;
    }

    tx.set(orderRef, sanitizeForFirestore(payload) as Record<string, unknown>);
  });

  return { id: orderRef.id, insufficientStock, availableGrams };
}

// ─── Update order, adjusting filament reservation if filament/grams changed ────

export async function updateOrderWithStock(
  id: string,
  data: Partial<Order>,
  previous: Order
): Promise<StockCheckResult> {
  let insufficientStock = false;
  let availableGrams: number | undefined;

  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', id);
    const now = new Date().toISOString();

    const newFilamentId = data.filamentId !== undefined ? data.filamentId : previous.filamentId;
    const newEstGrams = data.estimatedGrams !== undefined ? data.estimatedGrams : previous.estimatedGrams;
    const filamentChanged = newFilamentId !== previous.filamentId;
    const gramsChanged = newEstGrams !== previous.estimatedGrams;
    const canAdjust = !previous.stockConsumed && (filamentChanged || gramsChanged);

    let newReserved = previous.reservedGrams || 0;

    if (canAdjust) {
      if (filamentChanged) {
        // Read both docs (if any) BEFORE writing either — Firestore transactions
        // require all reads to precede all writes.
        const oldRef = previous.filamentId ? doc(db, 'filamentStock', previous.filamentId) : null;
        const newRef = newFilamentId ? doc(db, 'filamentStock', newFilamentId) : null;
        const oldSnap = oldRef ? await tx.get(oldRef) : null;
        const newSnap = newRef ? await tx.get(newRef) : null;

        if (oldRef && oldSnap?.exists() && previous.reservedGrams) {
          const oldStock = oldSnap.data() as FilamentStock;
          tx.update(oldRef, {
            reservedGrams: Math.max(0, (oldStock.reservedGrams || 0) - previous.reservedGrams),
            updatedAt: now,
          });
        }

        newReserved = 0;
        if (newRef && newSnap?.exists() && newEstGrams && newEstGrams > 0) {
          const newStock = newSnap.data() as FilamentStock;
          const available = newStock.currentGrams - (newStock.reservedGrams || 0);
          availableGrams = available;
          if (available < newEstGrams) insufficientStock = true;
          tx.update(newRef, {
            reservedGrams: (newStock.reservedGrams || 0) + newEstGrams,
            updatedAt: now,
          });
          newReserved = newEstGrams;
        }
      } else if (gramsChanged && newFilamentId) {
        // Same filament, different grams — adjust the delta on the single doc.
        const stockRef = doc(db, 'filamentStock', newFilamentId);
        const stockSnap = await tx.get(stockRef);
        if (stockSnap.exists()) {
          const stock = stockSnap.data() as FilamentStock;
          const delta = (newEstGrams || 0) - (previous.reservedGrams || 0);
          const available = stock.currentGrams - (stock.reservedGrams || 0);
          availableGrams = available - delta;
          if (availableGrams < 0) insufficientStock = true;
          tx.update(stockRef, {
            reservedGrams: Math.max(0, (stock.reservedGrams || 0) + delta),
            updatedAt: now,
          });
          newReserved = newEstGrams || 0;
        }
      }
    }

    const raw: Record<string, unknown> = { ...data, updatedAt: now };
    if (canAdjust) raw.reservedGrams = newReserved;
    if (data.price !== undefined || data.paidAmount !== undefined) {
      // `data.price === null` means the user explicitly cleared the field —
      // that must win over `previous.price`, so undefined/null can't be conflated via `??`.
      const newPrice = data.price !== undefined ? data.price : previous.price;
      const newPaid = data.paidAmount !== undefined ? data.paidAmount : previous.paidAmount;
      raw.remainingAmount = newPrice == null ? null : newPrice - (newPaid || 0);
    }
    tx.update(orderRef, sanitizeForFirestore(raw) as Record<string, unknown>);
  });

  return { id, insufficientStock, availableGrams };
}

// ─── Finish printing: release reservation, consume actual grams from stock ────

export async function finishPrintingAndConsume(orderId: string, actualGrams?: number): Promise<void> {
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) return;
    const order = orderSnap.data() as Order;
    const now = new Date().toISOString();
    const consumeGrams = actualGrams ?? order.estimatedGrams ?? 0;

    const stockRef = order.filamentId && !order.stockConsumed ? doc(db, 'filamentStock', order.filamentId) : null;
    const stockSnap = stockRef ? await tx.get(stockRef) : null;

    if (stockRef && stockSnap?.exists()) {
      const stock = stockSnap.data() as FilamentStock;
      tx.update(stockRef, {
        reservedGrams: Math.max(0, (stock.reservedGrams || 0) - (order.reservedGrams || 0)),
        currentGrams: Math.max(0, (stock.currentGrams || 0) - consumeGrams),
        usedGrams: (stock.usedGrams || 0) + consumeGrams,
        updatedAt: now,
      });
    }

    tx.update(orderRef, sanitizeForFirestore({
      stage: 'postProcessing',
      printingFinishedAt: now,
      actualGrams: consumeGrams,
      stockConsumed: true,
      updatedAt: now,
    }) as Record<string, unknown>);
  });
}

// ─── Cancel order: release any un-consumed reservation ────────────────────────

export async function cancelOrderWithStock(orderId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) return;
    const order = orderSnap.data() as Order;
    const now = new Date().toISOString();

    const shouldRelease = !order.stockConsumed && order.filamentId && order.reservedGrams;
    const stockRef = shouldRelease ? doc(db, 'filamentStock', order.filamentId as string) : null;
    const stockSnap = stockRef ? await tx.get(stockRef) : null;

    if (stockRef && stockSnap?.exists()) {
      const stock = stockSnap.data() as FilamentStock;
      tx.update(stockRef, {
        reservedGrams: Math.max(0, (stock.reservedGrams || 0) - (order.reservedGrams || 0)),
        updatedAt: now,
      });
    }

    tx.update(orderRef, { stage: 'cancelled', cancelledAt: now, reservedGrams: 0, updatedAt: now });
  });
}

// ─── Safe manual stage jump (e.g. from a Kanban column drop / dropdown) ────────
// Routes stock-affecting transitions through the transactional helpers above;
// everything else is a plain field update.

export async function changeStageSafely(order: Order, newStage: OrderStage): Promise<void> {
  if (newStage === order.stage) return;
  if (newStage === 'cancelled') {
    await cancelOrderWithStock(order.id);
    return;
  }
  if (newStage === 'postProcessing' && order.stage === 'printing') {
    await finishPrintingAndConsume(order.id);
    return;
  }
  await updateDoc(doc(db, 'orders', order.id), sanitizeForFirestore({
    stage: newStage,
    updatedAt: new Date().toISOString(),
  }) as Record<string, unknown>);
}

// ─── Delete order: release any un-consumed reservation, then remove the doc ───

export async function deleteOrderWithStock(orderId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) return;
    const order = orderSnap.data() as Order;
    const now = new Date().toISOString();

    const shouldRelease = !order.stockConsumed && order.filamentId && order.reservedGrams;
    const stockRef = shouldRelease ? doc(db, 'filamentStock', order.filamentId as string) : null;
    const stockSnap = stockRef ? await tx.get(stockRef) : null;

    if (stockRef && stockSnap?.exists()) {
      const stock = stockSnap.data() as FilamentStock;
      tx.update(stockRef, {
        reservedGrams: Math.max(0, (stock.reservedGrams || 0) - (order.reservedGrams || 0)),
        updatedAt: now,
      });
    }

    tx.delete(orderRef);
  });
}

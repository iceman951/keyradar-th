import type { OfferLoadState, OfferSnapshot } from './models';

const snapshotFrom = (state: OfferLoadState): OfferSnapshot | undefined => {
  switch (state.status) {
    case 'ready':
    case 'refreshing':
    case 'stale':
      return state.snapshot;
    case 'loading':
    case 'error':
      return undefined;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
};

export const initialOfferLoadState = (): OfferLoadState => ({ status: 'loading' });

export const beginOfferRefresh = (state: OfferLoadState): OfferLoadState => {
  const snapshot = snapshotFrom(state);
  return snapshot ? { status: 'refreshing', snapshot } : { status: 'loading' };
};

export const resolveOfferSnapshot = (snapshot: OfferSnapshot): OfferLoadState => {
  if (snapshot.stale || snapshot.failedStores.length > 0) {
    const failedStoreText = snapshot.failedStores.length > 0
      ? ` (${snapshot.failedStores.join(', ')})`
      : '';
    return {
      status: 'stale',
      snapshot: { ...snapshot, stale: true },
      message: `ข้อมูลราคาบางส่วนอาจไม่เป็นปัจจุบัน${failedStoreText}`
    };
  }
  return { status: 'ready', snapshot };
};

export const failOfferLoad = (
  state: OfferLoadState,
  message = 'ไม่สามารถดึงข้อมูลราคาล่าสุดได้'
): OfferLoadState => {
  const snapshot = snapshotFrom(state);
  if (!snapshot) return { status: 'error', message };
  return {
    status: 'stale',
    snapshot: { ...snapshot, stale: true },
    message
  };
};

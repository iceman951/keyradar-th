import { describe, expect, it } from 'vitest';
import {
  beginOfferRefresh,
  failOfferLoad,
  initialOfferLoadState,
  resolveOfferSnapshot
} from '$lib/domain/offer-load-state';
import type { OfferSnapshot } from '$lib/domain/models';

const snapshot = (overrides: Partial<OfferSnapshot> = {}): OfferSnapshot => ({
  gameSlug: 'elden-ring',
  editionKey: 'standard',
  offers: [],
  fetchedAt: new Date('2026-08-02T14:32:00+07:00'),
  failedStores: [],
  stale: false,
  ...overrides
});

describe('offer load state transitions', () => {
  it('moves an initial request from loading to ready', () => {
    expect(initialOfferLoadState()).toEqual({ status: 'loading' });
    expect(resolveOfferSnapshot(snapshot()).status).toBe('ready');
  });

  it('retains the rendered snapshot while refreshing', () => {
    const current = resolveOfferSnapshot(snapshot());
    const refreshing = beginOfferRefresh(current);
    expect(refreshing.status).toBe('refreshing');
    expect(refreshing.status === 'refreshing' && refreshing.snapshot).toBe(
      current.status === 'ready' ? current.snapshot : undefined
    );
  });

  it('turns a partial snapshot into stale state with failed-store context', () => {
    const state = resolveOfferSnapshot(snapshot({ failedStores: ['gamesplanet'] }));
    expect(state.status).toBe('stale');
    expect(state.status === 'stale' && state.snapshot.stale).toBe(true);
    expect(state.status === 'stale' && state.message).toContain('gamesplanet');
  });

  it('retains prior rows after refresh failure but errors when no snapshot exists', () => {
    const current = beginOfferRefresh(resolveOfferSnapshot(snapshot()));
    const stale = failOfferLoad(current, 'ร้านค้าไม่ตอบสนอง');
    expect(stale.status).toBe('stale');
    expect(stale.status === 'stale' && stale.snapshot.gameSlug).toBe('elden-ring');
    expect(failOfferLoad(initialOfferLoadState(), 'โหลดไม่สำเร็จ')).toEqual({
      status: 'error',
      message: 'โหลดไม่สำเร็จ'
    });
  });
});

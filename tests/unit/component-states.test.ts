import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Component } from 'svelte';
import EmptyState from '$lib/components/ui/EmptyState.svelte';
import Autocomplete from '$lib/components/search/Autocomplete.svelte';
import OfferCard from '$lib/components/offers/OfferCard.svelte';
import ExitDialog from '$lib/components/offers/ExitDialog.svelte';
import { games } from '$lib/data/fixtures';
import type { EmptyStateKind } from '$lib/domain/models';
import { makeOffer, makeStore } from './helpers';

type ClientRenderer = {
  mount<Props extends Record<string, unknown>>(
    component: Component<Props>,
    options: { target: Node; props: Props }
  ): object;
  unmount(instance: object): Promise<void>;
};

const clientRendererUrl = pathToFileURL(resolve(
  process.cwd(),
  'node_modules/.pnpm/svelte@5.56.8/node_modules/svelte/src/internal/client/render.js'
)).href;
const clientRenderer: unknown = await import(/* @vite-ignore */ clientRendererUrl);
const { mount, unmount } = clientRenderer as ClientRenderer;

const mounted: object[] = [];

const render = <Props extends Record<string, unknown>>(
  component: Component<Props>,
  options: { props: Props }
): { body: string; instance: object } => {
  const instance = mount(component, { target: document.body, props: options.props });
  mounted.push(instance);
  return { body: document.body.innerHTML, instance };
};

const loadBody = (_body: string): HTMLElement => document.body;
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const release = (instance: object): void => {
  const index = mounted.indexOf(instance);
  if (index >= 0) mounted.splice(index, 1);
  void unmount(instance);
};

beforeEach(() => document.body.replaceChildren());
afterEach(() => {
  while (mounted.length) void unmount(mounted.pop()!);
  document.body.replaceChildren();
  document.body.style.overflow = '';
});

describe('EmptyState', () => {
  const states: Array<[EmptyStateKind, string, string]> = [
    ['no-results', 'ไม่พบเกมที่ตรงกับ “Missing Game”', 'กลับไปหน้าแรก'],
    ['no-th', 'ยังไม่พบข้อเสนอที่ยืนยันว่าเปิดใช้งานในประเทศไทยได้', 'ดูข้อเสนอทั้งหมดพร้อมคำเตือน'],
    ['no-price', 'ยังไม่มีข้อมูลราคาสำหรับเกมนี้', 'ลองดึงราคาอีกครั้ง'],
    ['no-deals', 'ไม่มีดีลในหมวดนี้ตอนนี้', 'ดูดีลแนะนำ'],
    ['store-down', 'ร้านค้านี้ไม่ตอบสนองชั่วคราว', 'ลองอีกครั้ง']
  ];

  it.each(states)('renders the %s state and its action label', (kind, title, cta) => {
    const action = vi.fn();
    const output = render(EmptyState, {
      props: { kind, query: 'Missing Game', action }
    });
    const body = loadBody(output.body);
    const state = body.querySelector<HTMLElement>('[data-testid="empty-state"]');

    expect(state?.textContent).toContain(title);
    expect(state?.querySelector('button')?.textContent).toContain(cta);
    expect(state?.getAttribute('aria-live')).toBe('polite');
    state?.querySelector('button')?.click();
    expect(action).toHaveBeenCalledOnce();
  });
});

describe('Autocomplete', () => {
  it('renders a busy loading state without result options', () => {
    const output = render(Autocomplete, {
      props: { games: games.slice(0, 2), query: 'eld', loading: true }
    });
    const body = loadBody(output.body);
    const listbox = body.querySelector<HTMLElement>('[role="listbox"]');

    expect(listbox?.getAttribute('aria-busy')).toBe('true');
    expect(listbox?.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(listbox?.textContent).toContain('เกมที่ตรงกับคำค้นหา');
    expect(listbox?.querySelectorAll('.skeletons > div')).toHaveLength(3);
  });

  it('renders result links with game metadata and minimum-price labels', () => {
    const selectedGames = games.slice(0, 2);
    const output = render(Autocomplete, {
      props: { games: selectedGames, query: 'e', loading: false }
    });
    const body = loadBody(output.body);
    const options = body.querySelectorAll<HTMLAnchorElement>('[role="option"]');

    expect(options).toHaveLength(2);
    expect(options[0].getAttribute('href')).toBe(`/games/${selectedGames[0].slug}`);
    expect(options[0].textContent).toContain(selectedGames[0].title);
    expect(options[0].textContent).toContain('ราคาสุทธิ');
    expect(options[1].textContent).toContain(selectedGames[1].year.toString());
  });

  it('renders the query-aware empty result state', () => {
    const output = render(Autocomplete, {
      props: { games: [], query: 'Missing Game', loading: false }
    });
    const text = loadBody(output.body).textContent;

    expect(text).toContain('ไม่พบเกมที่ตรงกับ “Missing Game”');
    expect(text).toContain('ลองพิมพ์ชื่อเกมเป็นภาษาอังกฤษ');
  });
});

describe('OfferCard', () => {
  const store = makeStore({ name: 'Fanatical', initials: 'FA' });

  it('marks only a confirmed in-stock best offer', () => {
    const onbuy = vi.fn();
    const offer = makeOffer({ id: 'best', isHistoricalLow: true });
    const output = render(OfferCard, {
      props: {
        offer,
        store,
        best: true,
        onbuy
      }
    });
    const card = loadBody(output.body).querySelector<HTMLElement>('[data-testid="offer-card"]');

    expect(card?.classList.contains('best')).toBe(true);
    expect(card?.textContent).toContain('ถูกที่สุดที่ใช้งานในไทยได้');
    expect(card?.textContent).toContain('ต่ำสุดเป็นประวัติการณ์');
    expect(card?.querySelector('.buy.best')).toBeTruthy();
    card?.querySelector<HTMLButtonElement>('.buy')?.click();
    expect(onbuy).toHaveBeenCalledWith(offer);
  });

  it('renders a blocked region with blocked semantics and no best banner', () => {
    const output = render(OfferCard, {
      props: {
        offer: makeOffer({ id: 'blocked', region: 'north-america', regionStatus: 'blocked' }),
        store,
        best: true,
        onbuy: vi.fn()
      }
    });
    const card = loadBody(output.body).querySelector<HTMLElement>('[data-testid="offer-card"]');

    expect(card?.classList.contains('blocked')).toBe(true);
    expect(card?.classList.contains('best')).toBe(false);
    expect(card?.textContent).toContain('อเมริกาเหนือ');
    expect(card?.textContent).toContain('ไม่รองรับไทย');
    expect(card?.textContent).not.toContain('ถูกที่สุดที่ใช้งานในไทยได้');
    expect(card?.querySelector('.buy.blocked')).toBeTruthy();
  });

  it('replaces the purchase action with an out-of-stock status', () => {
    const output = render(OfferCard, {
      props: {
        offer: makeOffer({ id: 'out-of-stock', inStock: false }),
        store,
        best: true,
        onbuy: vi.fn()
      }
    });
    const card = loadBody(output.body).querySelector<HTMLElement>('[data-testid="offer-card"]');

    expect(card?.querySelector('.oos')?.textContent).toContain('สินค้าหมด');
    expect(card?.querySelector('.buy')).toBeNull();
    expect(card?.classList.contains('best')).toBe(false);
  });

  it('renders expanded itemized price and seller details', () => {
    const output = render(OfferCard, {
      props: {
        offer: makeOffer({
          id: 'expanded',
          advertisedSatang: 45_000,
          fees: [{ kind: 'platform', label: 'ค่าบริการแพลตฟอร์ม', amountSatang: 2_500 }],
          finalSatang: 47_500,
          sellerRating: 98.6,
          sellerReviewCount: 12_480
        }),
        store: makeStore({ type: 'marketplace', name: 'Eneba', initials: 'EN' }),
        expanded: true,
        onbuy: vi.fn()
      }
    });
    const card = loadBody(output.body).querySelector<HTMLElement>('[data-testid="offer-card"]');
    const detailsButton = card?.querySelector<HTMLButtonElement>('button[aria-controls]');

    expect(detailsButton?.getAttribute('aria-expanded')).toBe('true');
    expect(card?.querySelector('.details')).toBeTruthy();
    expect(card?.textContent).toContain('ค่าบริการแพลตฟอร์ม');
    expect(card?.textContent).toContain('คะแนนผู้ขาย');
    expect(card?.textContent).toContain('จำนวนรีวิวผู้ขาย');
    expect(card?.textContent).toContain('98.6%');
  });
});

describe('ExitDialog', () => {
  it('renders an accessible dialog with the offer purchase URL and closes on Escape', () => {
    const game = games[0];
    const store = makeStore({ name: 'Fanatical', initials: 'FA' });
    const offer = makeOffer({
      id: 'dialog-offer',
      gameSlug: game.slug,
      purchaseUrl: 'https://www.fanatical.com/en/search?search=ELDEN%20RING'
    });
    const onclose = vi.fn();
    const output = render(ExitDialog, { props: { offer, game, store, onclose } });
    const body = loadBody(output.body);
    const dialog = body.querySelector<HTMLElement>('[role="dialog"]');
    const link = body.querySelector<HTMLAnchorElement>('a.continue');

    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('dialog-title');
    expect(dialog?.getAttribute('aria-describedby')).toBe('dialog-description');
    expect(link?.getAttribute('href')).toBe(offer.purchaseUrl);
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link?.textContent).toContain('ไปยัง Fanatical');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onclose).toHaveBeenCalledOnce();
  });

  it('focuses the first action, traps focus, and restores the prior focus', async () => {
    const previous = document.createElement('button');
    previous.textContent = 'previous focus';
    document.body.append(previous);
    previous.focus();

    const game = games[0];
    const store = makeStore({ name: 'Fanatical', initials: 'FA' });
    const offer = makeOffer({
      id: 'focus-dialog',
      gameSlug: game.slug,
      purchaseUrl: 'https://www.fanatical.com/en/search?search=ELDEN%20RING'
    });
    const output = render(ExitDialog, { props: { offer, game, store, onclose: vi.fn() } });
    const cancel = document.querySelector<HTMLButtonElement>('.dialog footer button');
    const continueLink = document.querySelector<HTMLAnchorElement>('.dialog footer a');

    await settle();
    expect(document.activeElement).toBe(cancel);
    expect(document.body.style.overflow).toBe('hidden');

    continueLink?.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(cancel);

    cancel?.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(continueLink);

    release(output.instance);
    await settle();
    expect(document.activeElement).toBe(previous);
    expect(document.body.style.overflow).toBe('');
    previous.remove();
  });
});

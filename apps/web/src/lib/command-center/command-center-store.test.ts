import { beforeEach, describe, expect, it } from 'vitest';

import { useCommandCenterStore } from './command-center-store';

describe('useCommandCenterStore', () => {
  beforeEach(() => {
    useCommandCenterStore.setState({ isOpen: false, seedContext: null });
  });

  it('starts closed with no seed context', () => {
    expect(useCommandCenterStore.getState().isOpen).toBe(false);
    expect(useCommandCenterStore.getState().seedContext).toBeNull();
  });

  it('open() sets isOpen true and stores the seed context', () => {
    useCommandCenterStore.getState().open('Customer: Ahmed Hassan');
    expect(useCommandCenterStore.getState().isOpen).toBe(true);
    expect(useCommandCenterStore.getState().seedContext).toBe('Customer: Ahmed Hassan');
  });

  it('open() with no argument stores a null seed context', () => {
    useCommandCenterStore.getState().open();
    expect(useCommandCenterStore.getState().seedContext).toBeNull();
  });

  it('close() sets isOpen false and clears the seed context', () => {
    useCommandCenterStore.getState().open('some context');
    useCommandCenterStore.getState().close();
    expect(useCommandCenterStore.getState().isOpen).toBe(false);
    expect(useCommandCenterStore.getState().seedContext).toBeNull();
  });

  it('toggle() opens when closed and closes when open', () => {
    useCommandCenterStore.getState().toggle();
    expect(useCommandCenterStore.getState().isOpen).toBe(true);
    useCommandCenterStore.getState().toggle();
    expect(useCommandCenterStore.getState().isOpen).toBe(false);
  });
});

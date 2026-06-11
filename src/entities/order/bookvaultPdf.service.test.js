import {
  BOOKVAULT_DIMENSIONS,
  calculateBookVaultTotalPages,
  normalizeBookVaultPageImages
} from './bookvaultPdf.service.js';

describe('BookVault PDF production formatting', () => {
  test('uses exact BookVault point dimensions', () => {
    expect(BOOKVAULT_DIMENSIONS.interior.widthPoints).toBe(630);
    expect(BOOKVAULT_DIMENSIONS.interior.heightPoints).toBe(810);
    expect(BOOKVAULT_DIMENSIONS.cover.widthPoints).toBe(1260);
    expect(BOOKVAULT_DIMENSIONS.cover.heightPoints).toBe(810);
  });

  test('rounds target page count up to the next multiple of 4', () => {
    expect(calculateBookVaultTotalPages(10)).toBe(12);
    expect(calculateBookVaultTotalPages(15)).toBe(16);
    expect(calculateBookVaultTotalPages(20)).toBe(20);
  });

  test('normalizes sparse page image maps without shifting page positions', () => {
    expect(
      normalizeBookVaultPageImages({
        3: 'third',
        1: 'first',
        bad: 'ignored',
        2: ''
      })
    ).toEqual(['first', undefined, 'third']);
  });
});

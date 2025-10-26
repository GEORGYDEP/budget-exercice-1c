import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveAssetUrl } from '../src/utils/assets.js';

describe('resolveAssetUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        origin: 'https://example.com',
        pathname: '/budget-exercice-1c/index.html',
        href: 'https://example.com/budget-exercice-1c/index.html'
      }
    });

    vi.stubGlobal('document', {
      querySelector: vi.fn(() => null)
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('résout un chemin relatif en utilisant le répertoire courant', () => {
    expect(resolveAssetUrl('assets/data/quiz.json'))
      .toBe('https://example.com/budget-exercice-1c/assets/data/quiz.json');
  });

  it('ignore un préfixe ./ ou /', () => {
    expect(resolveAssetUrl('./assets/images/page_1.png'))
      .toBe('https://example.com/budget-exercice-1c/assets/images/page_1.png');
    expect(resolveAssetUrl('/assets/images/page_1.png'))
      .toBe('https://example.com/budget-exercice-1c/assets/images/page_1.png');
  });

  it('respecte un élément <base> lorsqu\'il est présent', () => {
    const baseElement = {
      getAttribute: () => '/autre-emplacement/'
    };
    document.querySelector.mockReturnValue(baseElement);

    expect(resolveAssetUrl('assets/data/quiz.json'))
      .toBe('https://example.com/autre-emplacement/assets/data/quiz.json');
  });

  it('renvoie les URL absolues inchangées', () => {
    const absoluteUrl = 'https://cdn.example.org/images/doc.png';
    expect(resolveAssetUrl(absoluteUrl)).toBe(absoluteUrl);
  });
});

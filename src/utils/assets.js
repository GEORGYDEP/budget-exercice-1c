const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function getBaseUrlFromDocument() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  const baseEl = document.querySelector('base[href]');
  if (!baseEl) {
    return null;
  }

  const href = baseEl.getAttribute('href');
  if (!href) {
    return null;
  }

  try {
    const absoluteHref = new URL(href, window.location.href).href;
    return absoluteHref.endsWith('/') ? absoluteHref : `${absoluteHref}/`;
  } catch (error) {
    console.warn('resolveAssetUrl: invalid <base> href detected', error);
    return null;
  }
}

function getBaseUrlFromWindow() {
  if (typeof window === 'undefined') {
    return '';
  }

  const { origin, pathname } = window.location;
  const basePath = pathname.endsWith('/')
    ? pathname
    : pathname.slice(0, pathname.lastIndexOf('/') + 1);

  return `${origin}${basePath}`;
}

function normaliseRelativePath(path) {
  if (path.startsWith('./')) {
    return path.slice(2);
  }
  if (path.startsWith('/')) {
    return path.slice(1);
  }
  return path;
}

export function resolveAssetUrl(path) {
  if (!path) {
    throw new Error('resolveAssetUrl: an asset path must be provided');
  }

  if (ABSOLUTE_URL_PATTERN.test(path)) {
    return path;
  }

  const relativePath = normaliseRelativePath(path);
  const baseUrl = getBaseUrlFromDocument() ?? getBaseUrlFromWindow();

  if (!baseUrl) {
    return relativePath;
  }

  return `${baseUrl}${relativePath}`;
}

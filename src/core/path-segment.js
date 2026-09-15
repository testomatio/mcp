function pathParameter(value, label = 'Path parameter') {
  const segment = String(value ?? '');

  if (!segment || segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\')) {
    throw new TypeError(`${label} must be a single URL path segment`);
  }

  return segment;
}

export function encodePathParameter(value, label) {
  return encodeURIComponent(pathParameter(value, label));
}

export function decodePathParameter(value, label) {
  try {
    return pathParameter(decodeURIComponent(value), label);
  } catch {
    return '';
  }
}

/**
 * Slim projection for list-tool responses.
 *
 * List tools return only what an index view needs: known-heavy fields
 * (description/code/message/children/...) and null/empty values are dropped.
 * `verbose:true` returns the full body; `fields:[...]` selects a custom field set.
 * Every shaped response carries a `_view` marker so the caller knows it is partial.
 */

const HEAVY_FIELDS = new Set([
  'description',
  'code',
  'clean_title',
  'public_title',
  'message',
  'details',
  'children',
]);

function isEmptyValue(value) {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function pickFields(item, fields) {
  const result = {};
  for (const key of fields) {
    if (!(key in item)) continue;
    const value = item[key];
    if (isEmptyValue(value)) continue;
    result[key] = value;
  }
  return result;
}

function stripHeavy(item) {
  const result = {};
  for (const [key, value] of Object.entries(item)) {
    if (HEAVY_FIELDS.has(key)) continue;
    if (isEmptyValue(value)) continue;
    result[key] = value;
  }
  return result;
}

function mapItems(items, fn) {
  return items.map((item) =>
    item && typeof item === 'object' && !Array.isArray(item) ? fn(item) : item
  );
}

function applyToEnvelope(payload, fn) {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return mapItems(payload, fn);
  if (Array.isArray(payload.data)) {
    const next = { data: mapItems(payload.data, fn) };
    if (payload.meta !== undefined) next.meta = payload.meta;
    return next;
  }
  return payload;
}

const VIEW_NOTE =
  'Heavy fields (description/code/message/children/...) and empty values removed. Pass verbose:true for full bodies or fields:[...] to select fields.';

function withViewMarker(result, note = VIEW_NOTE) {
  if (
    result &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    Array.isArray(result.data)
  ) {
    const out = { _view: note };
    out.data = result.data;
    if (result.meta !== undefined) out.meta = result.meta;
    return out;
  }
  return result;
}

/**
 * Shape a list payload: drop heavy/empty fields by default, full body on `verbose`,
 * custom field set on `fields`. A `_view` marker is added to shaped envelopes.
 *
 * @param {*} payload              raw API response ({ data, meta } or a bare array)
 * @param {{ verbose?: boolean, fields?: string[] }} [opts]
 */
export function slimList(payload, { verbose = false, fields } = {}) {
  if (verbose) {
    return payload;
  }
  if (Array.isArray(fields) && fields.length) {
    return withViewMarker(
      applyToEnvelope(payload, (item) => pickFields(item, fields)),
      `Custom fields [${fields.join(', ')}]. Pass verbose:true for the full object.`
    );
  }
  return withViewMarker(applyToEnvelope(payload, stripHeavy));
}

const LIST_OPTION_PROPERTIES = {
  verbose: {
    type: 'boolean',
    default: false,
    description:
      'Return full response bodies. Default strips heavy fields (description/code/message/children/...) and null/empty values; set true when you need those.',
  },
  fields: {
    type: 'array',
    items: { type: 'string' },
    description:
      'Fields to keep per item (e.g. ["id","title","status","message"]). Ignored when verbose is true.',
  },
};

/**
 * Inject `verbose`/`fields` input params into every list-style tool definition so the
 * model can opt into full bodies or a custom projection. Returns shallow copies; the
 * source definitions are not mutated.
 *
 * @param {Array} tools
 * @param {{ extraNames?: string[] }} [options]  additional tool names to augment
 */
export function withListOptions(tools, { extraNames = [] } = {}) {
  return tools.map((tool) => {
    if (!tool || !tool.name) return tool;
    const isListStyle = tool.name.endsWith('_list') || extraNames.includes(tool.name);
    if (!isListStyle) return tool;

    const inputSchema = tool.inputSchema || { type: 'object', properties: {} };
    const properties = { ...(inputSchema.properties || {}), ...LIST_OPTION_PROPERTIES };

    return {
      ...tool,
      description: `${tool.description ?? ''} Heavy fields stripped by default; verbose:true for full bodies.`.trim(),
      inputSchema: {
        ...inputSchema,
        properties,
      },
    };
  });
}

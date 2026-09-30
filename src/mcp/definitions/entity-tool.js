import { COUNT_PROPERTY, GROUP_BY_PROPERTY, LIST_OPTION_PROPERTIES } from '../list-projection.js';

function withCommandPrefix(schema, commands) {
  return {
    ...schema,
    description: `(${commands.join('|')}) ${schema.description ?? ''}`.trim(),
  };
}

export function buildEntityTool(spec) {
  const properties = {
    command: {
      type: 'string',
      enum: Object.keys(spec.commands),
      description: `CLI-style operation to perform. ${Object.entries(spec.commands)
        .map(([command, summary]) => `${command}: ${summary}`)
        .join(' | ')}`,
    },
  };

  for (const [key, { commands: appliesTo = [], ...schema }] of Object.entries(spec.params)) {
    if (!appliesTo.length) continue; // no commands left after profile pruning
    properties[key] = withCommandPrefix(schema, appliesTo);
  }

  for (const command of Object.keys(spec.commands)) {
    const isListStyle = command === 'list' || command.endsWith('_list');
    if (!isListStyle) continue;
    const projection = command === 'list'
      ? { ...LIST_OPTION_PROPERTIES, count: COUNT_PROPERTY, group_by: GROUP_BY_PROPERTY }
      : LIST_OPTION_PROPERTIES;
    for (const [key, schema] of Object.entries(projection)) {
      properties[key] = withCommandPrefix(schema, [command]);
    }
  }

  return {
    name: spec.name,
    description: `${spec.summary} CLI-style: pass "command" plus the params it needs; each param description lists the commands it applies to.`,
    inputSchema: {
      type: 'object',
      properties,
      required: ['command'],
      additionalProperties: false,
    },
  };
}

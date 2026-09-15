export const TESTS_BULK_LIMITS = {
  maxTests: 100,
  maxSuites: 25,
  maxMarkdownBytes: 512 * 1024,
};

const SUITE_MARKER = '<!-- suite';
const TEST_MARKER = '<!-- test';
const HEADING_PREFIX = '#';
const COMMA_SEPARATED_LIST_KEYS = new Set(['tags', 'labels']);

function parseCommaSeparatedList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function parseMetadataBlock(lines, startIndex) {
  if (lines[startIndex].trim().endsWith('-->')) {
    return { data: {}, endIndex: startIndex + 1, unterminated: false };
  }

  const metadata = {};
  let i = startIndex + 1;
  while (i < lines.length && lines[i].trim() !== '-->') {
    const match = lines[i].trim().match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      metadata[key] = COMMA_SEPARATED_LIST_KEYS.has(key) ? parseCommaSeparatedList(value) : value;
    }
    i += 1;
  }

  return {
    data: metadata,
    endIndex: Math.min(i + 1, lines.length),
    unterminated: i >= lines.length,
  };
}

function trimBlankLines(listOfLines) {
  let start = 0;
  let end = listOfLines.length;
  while (start < end && !listOfLines[start].trim()) start += 1;
  while (end > start && !listOfLines[end - 1].trim()) end -= 1;
  return listOfLines.slice(start, end);
}

export function parseTestsMarkdown(markdown) {
  const suites = [];
  const errors = [];

  if (typeof markdown !== 'string' || !markdown.trim()) {
    errors.push({ line: 1, message: 'Markdown document is empty' });
    return { suites, errors };
  }

  if (Buffer.byteLength(markdown, 'utf8') > TESTS_BULK_LIMITS.maxMarkdownBytes) {
    errors.push({
      line: 1,
      message: `Document exceeds the ${TESTS_BULK_LIMITS.maxMarkdownBytes} bytes limit; split it into smaller documents`,
    });
    return { suites, errors };
  }

  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  let currentSuite = null;
  let currentTest = null;
  let suiteDescriptionLines = [];

  const closeTest = () => {
    if (!currentTest) return;
    currentSuite.tests.push({
      uid: currentTest.uid,
      title: currentTest.title,
      description: trimBlankLines(currentTest.descriptionLines).join('\n'),
      state: currentTest.state,
      priority: currentTest.priority,
      assignee: currentTest.assignee,
      tags: currentTest.tags,
      labels: currentTest.labels,
    });
    currentTest = null;
  };

  const closeSuite = () => {
    if (!currentSuite) return;
    currentSuite.description = trimBlankLines(suiteDescriptionLines).join('\n');
    suites.push(currentSuite);
    currentSuite = null;
    suiteDescriptionLines = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith(SUITE_MARKER)) {
      const markerLine = i + 1;
      const block = parseMetadataBlock(lines, i);
      if (block.unterminated) {
        closeTest();
        closeSuite();
        errors.push({ line: markerLine, message: 'Unterminated "<!-- suite" block' });
        break;
      }
      i = block.endIndex;

      while (i < lines.length && !lines[i].trim()) i += 1;
      if (i >= lines.length || !lines[i].trim().startsWith(HEADING_PREFIX)) {
        closeTest();
        closeSuite();
        errors.push({
          line: markerLine,
          message: 'Suite block is not followed by a title heading; suite skipped',
        });
        continue;
      }

      closeTest();
      closeSuite();
      currentSuite = {
        uid: block.data.id ?? null,
        title: lines[i].trim().replace(/^#+\s*/, ''),
        description: '',
        tags: block.data.tags ?? [],
        labels: block.data.labels ?? [],
        assignee: block.data.assignee,
        tests: [],
      };
      i += 1;
      continue;
    }

    if (line.startsWith(TEST_MARKER)) {
      const markerLine = i + 1;
      const block = parseMetadataBlock(lines, i);
      if (block.unterminated) {
        closeTest();
        errors.push({ line: markerLine, message: 'Unterminated "<!-- test" block' });
        break;
      }
      i = block.endIndex;

      while (i < lines.length && !lines[i].trim()) i += 1;
      if (i >= lines.length || !lines[i].trim().startsWith(HEADING_PREFIX)) {
        closeTest();
        errors.push({
          line: markerLine,
          message: 'Test block is not followed by a title heading; test skipped',
        });
        continue;
      }

      closeTest();
      if (!currentSuite) {
        errors.push({ line: markerLine, message: 'Test block appears before any suite block; test skipped' });
        i += 1;
        continue;
      }

      currentTest = {
        uid: block.data.id ?? null,
        title: lines[i].trim().replace(/^#+\s*/, ''),
        state: block.data.type,
        priority: block.data.priority,
        assignee: block.data.assignee,
        tags: block.data.tags ?? [],
        labels: block.data.labels ?? [],
        descriptionLines: [],
      };
      i += 1;

      while (i < lines.length) {
        const next = lines[i].trim();
        if (next.startsWith(SUITE_MARKER) || next.startsWith(TEST_MARKER)) break;
        currentTest.descriptionLines.push(lines[i]);
        i += 1;
      }
      continue;
    }

    if (currentSuite && !currentTest) {
      suiteDescriptionLines.push(lines[i]);
    }
    i += 1;
  }

  closeTest();
  closeSuite();

  return { suites, errors };
}

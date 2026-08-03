const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const cssDir = path.join(root, 'css');

function formatCss(source) {
  const lines = [];
  let buffer = '';
  let indent = 0;
  let quote = '';
  let comment = false;
  let commentBuffer = '';
  let parentheses = 0;

  const indentation = () => '  '.repeat(indent);
  const append = character => {
    if (/\s/.test(character)) {
      if (buffer && !/\s$/.test(buffer)) buffer += ' ';
      return;
    }
    buffer += character;
  };
  const flush = suffix => {
    let content = buffer.trim();
    if (suffix === ';' || (!suffix && indent > 0)) {
      content = content.replace(/^([-\w]+)\s*:\s*/, '$1: ');
    }
    if (content || suffix) lines.push(`${indentation()}${content}${suffix}`);
    buffer = '';
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (comment) {
      commentBuffer += character;
      if (character === '*' && next === '/') {
        commentBuffer += '/';
        index += 1;
        if (buffer.trim()) flush('');
        const commentLines = commentBuffer.trim().split(/\r?\n/);
        commentLines.forEach(line => lines.push(`${indentation()}${line.trim()}`));
        commentBuffer = '';
        comment = false;
      }
      continue;
    }

    if (quote) {
      buffer += character;
      if (character === '\\') {
        if (next !== undefined) {
          buffer += next;
          index += 1;
        }
      } else if (character === quote) {
        quote = '';
      }
      continue;
    }

    if (character === '/' && next === '*') {
      comment = true;
      commentBuffer = '/*';
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      buffer += character;
      continue;
    }
    if (character === '(') parentheses += 1;
    if (character === ')') parentheses = Math.max(0, parentheses - 1);

    if (parentheses === 0 && character === '{') {
      flush(' {');
    } else if (parentheses === 0 && character === ';') {
      flush(';');
    } else if (parentheses === 0 && character === '}') {
      if (buffer.trim()) flush('');
      indent = Math.max(0, indent - 1);
      lines.push(`${indentation()}}`);
      buffer = '';
    } else {
      append(character);
    }

    if (parentheses === 0 && character === '{') indent += 1;
  }

  if (commentBuffer) lines.push(`${indentation()}${commentBuffer.trim()}`);
  if (buffer.trim()) flush('');
  return `${lines.join('\n')
    .replace(/^(\s*)}\n(?!(?:\s*)})/gm, '$1}\n\n')
    .replace(/\n{3,}/g, '\n\n')}\n`;
}

const files = fs.readdirSync(cssDir)
  .filter(file => file.endsWith('.css'))
  .sort();

for (const file of files) {
  const filePath = path.join(cssDir, file);
  const source = fs.readFileSync(filePath, 'utf8');
  const formatted = formatCss(source);
  fs.writeFileSync(filePath, formatted, 'utf8');
  console.log(`Formatado: css/${file}`);
}

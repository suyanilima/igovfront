const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'index.html');
const outputPath = path.join(root, 'igov-controle.html');

let html = fs.readFileSync(sourcePath, 'utf8');

html = html.replace(
  /<link\s+href="(assets\/[^"]+\.png)"\s+rel="icon"\s+type="image\/png"\s*\/>/g,
  (_, relativePath) => {
    const image = fs.readFileSync(path.join(root, relativePath)).toString('base64');
    return `<link href="data:image/png;base64,${image}" rel="icon" type="image/png"/>`;
  },
);

html = html.replace(
  /<img([^>]*?)\s+src="(assets\/[^"]+\.png)"([^>]*?)\/>/g,
  (_, before, relativePath, after) => {
    const image = fs.readFileSync(path.join(root, relativePath)).toString('base64');
    return `<img${before} src="data:image/png;base64,${image}"${after}/>`;
  },
);

html = html.replace(
  /<link\s+href="(css\/[^"]+\.css)"\s+rel="stylesheet"\s*\/>/g,
  (_, relativePath) => {
    let css = fs.readFileSync(path.join(root, relativePath), 'utf8');
    // Mantém o arquivo totalmente independente, sem baixar fontes externas.
    css = css.replace(/@import\s+url\(['"]https:\/\/fonts\.googleapis\.com\/[^)]*\);?\s*/g, '');
    css = css.replace(
      /url\((['"]?)(\.\.\/assets\/[^)'"]+\.svg)\1\)/g,
      (_, _quote, assetPath) => {
        const absoluteAssetPath = path.resolve(path.dirname(path.join(root, relativePath)), assetPath);
        const svg = fs.readFileSync(absoluteAssetPath).toString('base64');
        return `url("data:image/svg+xml;base64,${svg}")`;
      },
    );
    return `<style data-source="${relativePath}">\n${css}\n</style>`;
  },
);

html = html.replace(
  /<script\s+src="(js\/[^"]+\.js)"><\/script>/g,
  (_, relativePath) => {
    const js = fs.readFileSync(path.join(root, relativePath), 'utf8');
    return `<script data-source="${relativePath}">\n${js}\n</script>`;
  },
);

if (/\b(?:href|src)="(?:assets|css|js)\//.test(html)) {
  throw new Error('Ainda existem dependências locais no HTML gerado.');
}

fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Arquivo independente criado: ${outputPath}`);

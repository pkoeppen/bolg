const beautify = require('js-beautify').html;
const fs = require('fs-extra');
const hljs = require('highlightjs');
const md = require('markdown-it')({
  typographer: true,
  linkify: true,
  quotes: '“”‘’',
  highlight
});
const meta = require('markdown-it-meta');

// Use metadata plugin.
md.use(meta);

// Set config variables.
const config = require('./config.json');
const siteTitle = config.siteTitle || 'bolg';

// Set base HTML template.
const template = `
  <!doctype html>
  <html>
    <head>
      <title>
        {{ title }}
      </title>
      <link href="https://fonts.googleapis.com/css?family=Oxygen+Mono&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/styles/a11y-dark.min.css">
    </head>
    <body>
      <div class="content">{{ content }}</div>
    </body>
    <style>
      html {
        font-family: 'Oxygen Mono', monospace;
        font-size: 13px;
        line-height: 1.8;
        color: #222222;
        background: #f1f3f4;
        letter-spacing: -.5px;
      }
      body {
        width: 100%;
        max-width: 750px;
        margin: 0 auto;
      }
      p {
        margin: 18px 0;
      }
      img {
        max-width: 100%;
      }
      blockquote {
        font-style: italic;
      }
      .content {
          margin: 0 6px;
      }
      .index a {
        display: block;
      }
    </style>
  </html>
`;

(async function() {
  // Start the timer.
  const start = Date.now();

  // Set slug string regex.
  const slugRegex = /^[\w\d]+(\-[\w\d]+)*$/i;

  // Read MD files in 'content' directory.
  const dir = await fs.readdir('./content');
  const files = dir.filter(filename => filename.endsWith('.md') && filename !== 'example.md');

  // Clean 'dist' directory.
  await fs.remove('./dist');

  // Parse MD files.
  const entries = [];
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];

    // Render markdown content.
    const raw = await fs.readFile(`./content/${filename}`);
    const rendered = md.render(raw.toString());

    // Extract slug from filename.
    const slug = md.meta.slug || filename.split('.')[0];
    if (!slug || !slugRegex.test(slug)) {
        throw new Error(`Error parsing '${filename}': Missing or invalid slug string format.`);
    }

    // Since everything will live in the same root directory,
    // disallow anything named 'index.md'.
    if (slug === 'index') {
        throw new Error(`Error parsing '${filename}': Invalid slug name 'index'.`);
    }

    // Entry title is required.
    const title = md.meta.title;
    if (!title) {
        throw new Error(`Error parsing '${filename}': Missing 'title' metadata.`);
    }

    // Add entry to entries array.
    entries.push({
        rendered,
        meta: md.meta
    });

    // Render and beautify entry HTML.
    const content = `
      <div style="height:20px;">
        <a href="${config.indexDocument ? '/' : 'index.html'}">&lt; back</a>
      </div>
      <h1>${title}</h1>
      <div>${rendered}</div>
    `;
    const entryRendered = template
      .replace('{{ title }}', `${title} | ${siteTitle}`)
      .replace('{{ content }}', content);
    const entryBeautified = beautify(entryRendered);

    // Write the file to disk.
    const outputPath = `./dist/${slug}${config.indexDocument ? '/index' : ''}.html`;
    await fs.outputFile(outputPath, entryBeautified);
  }

  if (config.sortByTimestamp) {
    entries.sort((a, b) => {

      const dateA = new Date(a.meta.timestamp);
      const dateB = new Date(b.meta.timestamp);
      const dateAValid = !isNaN(dateA);
      const dateBValid = !isNaN(dateB);
      const identical = dateA - dateB === 0;

      // Order by timestamp where possible.
      if (!identical) {
        if (dateAValid && dateBValid) {
          return dateA - dateB;
          // If only one of the compared dates is invalid, order the valid date lower.
        } else if (dateAValid) {
          return -1;
        } else if (dateBValid) {
          return 1;
        }
      }

      // Default to alphabetical order.
      if (a.title < b.title) {
        return -1;
      } else if (a.title > b.title) {
        return 1;
      } else {
        return 0;
      }
    });

  } else {
    entries.sort((a, b) => {
      if (a.title < b.title) {
        return -1;
      } else if (a.title > b.title) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  // Render and beautify index HTML.
  const links = entries.map(entry => {
    const href = `${entry.meta.slug}${config.indexDocument ? '' : '.html'}`;
    return `<a href="${href}">${entry.meta.title}</a>`;
  }).join('\n');
  const content = `
    <div style="height:20px;"></div>
    <h1>${siteTitle}</h1>
    <div class="index">${links}</div>
  `;
  const indexRendered = template
    .replace('{{ title }}', siteTitle)
    .replace('{{ content }}', content);
  const indexBeautified = beautify(indexRendered);

  // Write the file to disk.
  await fs.outputFile('./dist/index.html', indexBeautified);

  // Calculate time elapsed.
  const end = Date.now();
  const elapsed = ((end - start) / 1000).toFixed(2);

  console.log(`Rendered ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} in ${elapsed}s.`);
})()
.catch(error => {
    console.error(error.message);
});

/*
 * Highlight function for markdown-it.
 */
function highlight(str, lang) {
  if (lang && hljs.getLanguage(lang)) {
    let processed;
    try {
      processed = hljs.highlight(lang, str, true).value;
    } catch (error) {
      // Fallback.
      processed = md.utils.escapeHtml(str);
    }
    return `<pre class="hljs"><code>${processed}</code></pre>`;
  }
}

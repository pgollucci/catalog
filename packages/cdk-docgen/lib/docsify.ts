

export function renderIndex(options: { title: string, homepage: string }) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>${options.title}</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <meta name="description" content="${options.title}">
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <link rel="stylesheet" href="//unpkg.com/docsify/themes/vue.css">
  </head>
  <body>
    <div id="app"></div>
    <script>
      window.$docsify = {
        loadSidebar: true,
        auto2top: true,
        name: '${options.title}',
        homepage: '${options.homepage}',
        noEmoji: true,
      }
    </script>
    <script src="//unpkg.com/docsify/lib/docsify.min.js"></script>
    <script src="//unpkg.com/prismjs/components/prism-typescript.min.js"></script>
    <script src="//unpkg.com/prismjs/components/prism-java.min.js"></script>
    <script src="//unpkg.com/prismjs/components/prism-csharp.min.js"></script>
    <script src="//unpkg.com/prismjs/components/prism-python.min.js"></script>
    <script src="//unpkg.com/prismjs/components/prism-json.min.js"></script>
    <script src="//unpkg.com/prismjs/components/prism-javascript.min.js"></script>

  </body>
  </html>
  `;
}
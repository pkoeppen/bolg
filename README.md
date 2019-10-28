# bolg
A tiny blog with zero standards.

### how do?
It's basically a miniature JAM stack generator. Put  Markdown files in `./content`, then do `npm run render`. This will render an `index.html` file next to all blog entries in `./dist`. Voilà.

### option
There is one whole option, nestled appropriately in `config.json`, called `siteTitle`.

### dnager
Markdown files must have 'title' set in their YAML metadata, and filenames must be in kebab-case.

# bolg
A tiny blog with zero standards.

### how do?
It's basically a miniature JAM stack generator. Put  Markdown files in `./content`, then do `npm run render`. This will render an `index.html` file next to all blog entries in `./dist`. Voilà.

### option
There ~~is one whole option~~ are a few whole options, nestled appropriately in `config.json`. `siteTitle` is self-explanatory. `indexDocument` will output each post as `index.html` in its own directory, which is useful for removing the ".html" extension when using static hosting on a platform like AWS S3. `sortByTimestamp` will sort posts by the timestamp supplied in the post's YAML metadata.

### dnager
Markdown files must have 'title' set in their YAML metadata, and filenames must use kebab-case.

// Solo i sottoinsiemi latini: il resto (cirillico, greco, vietnamita) non serve
// a un sito interamente in italiano e triplicherebbe il peso. L'elenco vive in
// un file suo perché il test lo verifichi senza eseguire la copia, come
// `precache.mjs` rispetto a `build-sw.mjs`.
export const FONT = [
  ['@fontsource/fraunces', 'fraunces-latin-600-normal.woff2'],
  ['@fontsource/inter', 'inter-latin-400-normal.woff2'],
  ['@fontsource/inter', 'inter-latin-600-normal.woff2'],
  ['@fontsource/jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2'],
  ['@fontsource/eb-garamond', 'eb-garamond-latin-400-normal.woff2'],
  ['@fontsource/eb-garamond', 'eb-garamond-latin-400-italic.woff2'],
];

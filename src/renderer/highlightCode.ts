import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/'

loadLanguages(['typescript', 'bash', 'json', 'jsx', 'tsx'])

export function highlightCode(code: string, lang: string) {
  const langDef = Prism.languages[lang]

  if (!langDef) {
    throw new Error(
      `[prismjs error] language \`${lang}\` not supported. Please add the language in your .babelrc file.`
    )
  }

  const highlightedCode = Prism.highlight(
    code,
    langDef,
    lang
  )

  return `<pre class="language-${lang}"><code class="language-${lang}">${highlightedCode}</code></pre>`
}

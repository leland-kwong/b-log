import { replaceVariables } from './replaceVariables'

describe('replaceVariables', () => {
  const variables = {
    name: 'John',
    value: 42,
    another: 'example'
  }

  it('should replace variables except inside code blocks', () => {
    const text =
      "Hello, {{ name }}! This is a sample text. Here's a code block:\n```JavaScript\nvar x = {{ value }};\n```\nAnd another variable: {{ another }}."
    const expected =
      "Hello, John! This is a sample text. Here's a code block:\n```JavaScript\nvar x = {{ value }};\n```\nAnd another variable: example."
    const result = replaceVariables(text, variables)
    expect(result).toBe(expected)
  })

  it('should handle missing variables', () => {
    const text =
      "Hello, {{ name }}! This is a sample text. Here's a code block:\n```JavaScript\nvar x = {{ missingVariable }};\n```\nAnd another variable: {{ another }}."
    const expected =
      "Hello, John! This is a sample text. Here's a code block:\n```JavaScript\nvar x = {{ missingVariable }};\n```\nAnd another variable: example."
    const result = replaceVariables(text, variables)
    expect(result).toBe(expected)
  })
})

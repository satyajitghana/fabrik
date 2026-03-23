# create-fabrik-app

Scaffold a new [Fabrik UI](https://github.com/satyajitghana/fabrik) project in one command.

## Usage

```bash
npx create-fabrik-app my-app
```

This creates a Next.js app with:

- `@fabrik-sdk/ui` installed and configured
- Server route with your chosen LLM provider (OpenAI, Anthropic, or Google)
- Client page with `<Fabrik>` and `<Chat>`
- Example generative UI components
- Tailwind CSS + shadcn setup

## Options

```bash
npx create-fabrik-app my-app --provider openai
npx create-fabrik-app my-app --provider anthropic
npx create-fabrik-app my-app --provider google
```

## See also

- [`@fabrik-sdk/ui`](https://www.npmjs.com/package/@fabrik-sdk/ui) — Core SDK
- [`@fabrik-sdk/cli`](https://www.npmjs.com/package/@fabrik-sdk/cli) — CLI tool
- [Documentation](https://github.com/satyajitghana/fabrik)

## License

MIT

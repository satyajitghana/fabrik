# @fabrik-sdk/cli

CLI for [Fabrik UI](https://github.com/satyajitghana/fabrik) — the generative UI SDK for any LLM.

## Install

```bash
npm install -g @fabrik-sdk/cli
```

## Commands

### `fabrik init`

Scaffold a Fabrik project in your existing Next.js app. Sets up the server route, client page, and component definitions.

```bash
fabrik init
```

### `fabrik add <component>`

Add a pre-built generative UI component to your project.

```bash
fabrik add weather-card
fabrik add bar-chart
fabrik add data-table
```

### `fabrik diff`

Show a diff of changes Fabrik would make to your project.

```bash
fabrik diff
```

## See also

- [`@fabrik-sdk/ui`](https://www.npmjs.com/package/@fabrik-sdk/ui) — Core SDK
- [`create-fabrik-app`](https://www.npmjs.com/package/create-fabrik-app) — Project scaffolding
- [Documentation](https://github.com/satyajitghana/fabrik)

## License

MIT

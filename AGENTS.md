# Nexium Markets — Development Guidelines

- Keep the main branch in a working, tested state.
- Ensure TypeScript passes cleanly with `npm run build`.
- Strictly adhere to all business rules and resolved behaviors documented in `NEXIUM.md`. Never revert or regress these specifications.
- Security features listed in `NEXIUM.md` §8 are locked: never modify them, never bypass the `.githooks/pre-commit` lock (no `NEXIUM_UNLOCK`, no `--no-verify`) unless the owner provides the unlock code in the conversation.

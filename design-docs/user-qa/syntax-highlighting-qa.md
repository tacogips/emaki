# User QA: syntax highlighting

1. **Hybrid fallback.** Section 3.3 of the design may reopen the approach decision: a canvas-native language misses a perf budget after one optimization pass, or tree-sitter meets budgets that canvas-native misses. In that case, is an optional `emaki/tree-sitter` subpath with `web-tree-sitter` as an *optional* peer dependency acceptable? Nothing is implemented without approval.
2. **Spike prerequisites.** The comparison in section 9.5 is required evidence. It needs network access to install `web-tree-sitter` and the grammar packages into `$TMPDIR/emaki-ts-spike/`, outside the repository. If that is unavailable, the decision stays provisional and the acceptance signal is reported blocked. This is not a waiver: please provide access, or explicitly amend the requirement.

Resolved (kept for traceability):

- **Vue and Svelte** are in scope as additions (design section 8).
- **chilla inventory.** The 85 entries are mapped individually in design section 7. Implementation task 0 verifies them name-for-name against the reference.

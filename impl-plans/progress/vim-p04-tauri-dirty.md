
# P04 implementation progress

Dirty state compares the current document with the loaded or saved baseline; non-live mounts establish it before update registration and focus, while live remounts preserve it. Saves use the written snapshot, native titles are serialized latest-wins, and opt-in tracing plus mock launch regression are in place.

Root-cause hypothesis: WKWebView focus or its IME/input event stream may produce a docChanged update with unchanged content, which the former unconditional dirty flag treated as an edit. Out-of-order native title calls could leave a stale marker. This mechanism is analyzed, not natively observed; the baseline comparison mitigates it independently of the exact event.

Moving shared-tree verification: example check 0, build 0, production mock-symbol exclusion 0, smoke 0 (16 checks passed). Complete logs are in tmp/vim-20261111/vim-p04-tauri-dirty/. Formal review and serial reconciliation remain downstream.

//go:build js && wasm

// Exposes oasdiffChangelog(baseYaml, revisionYaml) to JavaScript.
// Same pipeline as `oasdiff changelog base rev -f json` with default flags.
package main

import (
	"syscall/js"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/oasdiff/oasdiff/checker"
	"github.com/oasdiff/oasdiff/diff"
	"github.com/oasdiff/oasdiff/formatters"
	"github.com/oasdiff/oasdiff/load"
)

func changelog(base, rev string) (string, error) {
	loader := openapi3.NewLoader()
	s1, err := load.NewSpecInfoFromData(loader, []byte(base), "base.yaml")
	if err != nil {
		return "", err
	}
	s2, err := load.NewSpecInfoFromData(loader, []byte(rev), "revision.yaml")
	if err != nil {
		return "", err
	}
	d, sources, err := diff.GetWithOperationsSourcesMap(diff.NewConfig(), s1, s2)
	if err != nil {
		return "", err
	}
	cfg := checker.NewConfig(checker.GetAllChecks(),
		checker.WithDeprecation(checker.DefaultBetaDeprecationDays, checker.DefaultStableDeprecationDays))
	changes := checker.CheckBackwardCompatibilityUntilLevel(cfg, d, sources, checker.INFO)
	f, err := formatters.Lookup("json", formatters.FormatterOpts{Language: "en"})
	if err != nil {
		return "", err
	}
	out, err := f.RenderChangelog(changes, formatters.RenderOpts{})
	return string(out), err
}

func main() {
	js.Global().Set("oasdiffChangelog", js.FuncOf(func(_ js.Value, args []js.Value) any {
		out, err := changelog(args[0].String(), args[1].String())
		if err != nil {
			return map[string]any{"error": err.Error()}
		}
		return map[string]any{"json": out}
	}))
	select {}
}

package gui

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/yetone/magpie/internal/catalog"
	"github.com/yetone/magpie/internal/provider"
)

func TestProviderModelChipsSayTheirOwnBrand(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("USERPROFILE", home)
	t.Setenv("XDG_CONFIG_HOME", filepath.Join(home, ".config"))
	t.Setenv("XDG_CACHE_HOME", filepath.Join(home, ".cache"))
	if err := os.MkdirAll(filepath.Dir(catalog.CachePath()), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(catalog.CachePath(), []byte(`{}`), 0o644); err != nil {
		t.Fatal(err)
	}
	catalog.Reset()
	t.Cleanup(catalog.Reset)
	want := map[string]string{
		"gpt-6.1-sol":                 "openai",
		"anthropic/claude-sonnet-4-5": "claude-color",
		"gemini-2.5-pro":              "gemini-color",
		"deepseek-chat":               "deepseek-color",
		"own-model":                   "",
	}
	ids := []string{"gpt-6.1-sol", "anthropic/claude-sonnet-4-5", "gemini-2.5-pro", "deepseek-chat", "own-model"}
	p := provider.Provider{ID: "relay", Name: "Relay", Icon: "qwen-color", Chat: "http://127.0.0.1:1/v1", Models: ids}
	body, err := json.Marshal(providerInfoWith(p, nil, nil))
	if err != nil {
		t.Fatal(err)
	}
	var result struct {
		Models []map[string]any `json:"models"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatal(err)
	}
	if len(result.Models) != len(want) {
		t.Fatalf("models: %s", body)
	}
	for _, m := range result.Models {
		id := m["id"].(string)
		logo, _ := m["logo"].(string)
		if logo != want[id] {
			t.Errorf("%s: logo %q, want %q", id, logo, want[id])
		}
		if id == "own-model" {
			if _, exists := m["logo"]; exists {
				t.Error("unknown model must not inherit the relay logo")
			}
		}
	}
}

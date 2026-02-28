package scanner

import (
	"os"

	"sigs.k8s.io/yaml"
)

const configFileName = ".kube-migrate.yaml"

// Config holds user overrides loaded from .kube-migrate.yaml.
type Config struct {
	IgnoreAnnotations []string `yaml:"ignoreAnnotations" json:"ignoreAnnotations"`
}

var builtinIgnorePrefixes = []string{
	"kubectl.kubernetes.io/",
	"meta.helm.sh/",
	"field.cattle.io/",
}

// loadConfig reads .kube-migrate.yaml from the current directory.
func loadConfig() Config {
	data, err := os.ReadFile(configFileName)
	if err != nil {
		return Config{}
	}
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return Config{}
	}
	return cfg
}

// shouldIgnoreAnnotation checks if an annotation should be skipped.
func shouldIgnoreAnnotation(key string, userPrefixes []string) bool {
	for _, prefix := range builtinIgnorePrefixes {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			return true
		}
	}
	for _, prefix := range userPrefixes {
		if prefix == "" {
			continue
		}
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			return true
		}
	}
	return false
}

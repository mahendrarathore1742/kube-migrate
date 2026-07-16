package scanner

import (
	"fmt"
	"os"

	"sigs.k8s.io/yaml"
)

const configFileName = ".kube-migrate.yaml"

// Config holds user overrides loaded from .kube-migrate.yaml.
type Config struct {
	Target            string   `yaml:"target" json:"target"`
	OutputDir         string   `yaml:"outputDir" json:"outputDir"`
	Namespace         string   `yaml:"namespace" json:"namespace"`
	IgnoreAnnotations []string `yaml:"ignoreAnnotations" json:"ignoreAnnotations"`
}

// Validate checks the config for valid values.
func (c *Config) Validate() error {
	if c.Target != "" && c.Target != "traefik" && c.Target != "gateway-api" {
		return fmt.Errorf("invalid target %q: must be 'traefik' or 'gateway-api'", c.Target)
	}
	return nil
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

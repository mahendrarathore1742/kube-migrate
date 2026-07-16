package scanner

import (
	"testing"
)

func TestClassifyComplexity(t *testing.T) {
	tests := []struct {
		name     string
		annots   map[string]string
		expected string
	}{
		{
			name:     "no annotations = simple",
			annots:   map[string]string{},
			expected: "simple",
		},
		{
			name:     "nil annotations = simple",
			annots:   nil,
			expected: "simple",
		},
		{
			name:     "ssl-redirect only = simple",
			annots:   map[string]string{"ssl-redirect": "true"},
			expected: "simple",
		},
		{
			name:     "auth-url = moderate",
			annots:   map[string]string{"auth-url": "http://auth.svc/verify"},
			expected: "moderate",
		},
		{
			name:     "limit-rps = moderate",
			annots:   map[string]string{"limit-rps": "10"},
			expected: "moderate",
		},
		{
			name:     "rewrite-target = moderate",
			annots:   map[string]string{"rewrite-target": "/$1"},
			expected: "moderate",
		},
		{
			name:     "snippets = complex",
			annots:   map[string]string{"snippets": "proxy_set_header X-Real-IP $remote_addr;"},
			expected: "complex",
		},
		{
			name:     "lua-resty-waf = complex",
			annots:   map[string]string{"lua-resty-waf": "active"},
			expected: "complex",
		},
		{
			name:     "complex overrides moderate",
			annots:   map[string]string{"auth-url": "http://auth/verify", "snippets": "whatever"},
			expected: "complex",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := classifyComplexity(tt.annots)
			if got != tt.expected {
				t.Errorf("classifyComplexity(%v) = %q, want %q", tt.annots, got, tt.expected)
			}
		})
	}
}

func TestShouldIgnoreAnnotation(t *testing.T) {
	tests := []struct {
		key          string
		userPrefixes []string
		want         bool
	}{
		{"kubectl.kubernetes.io/last-applied", nil, true},
		{"meta.helm.sh/release-name", nil, true},
		{"field.cattle.io/publicEndpoints", nil, true},
		{"ssl-redirect", nil, false},
		{"custom-internal", []string{"custom-"}, true},
		{"auth-url", []string{"custom-"}, false},
		{"something", []string{""}, false},
	}

	for _, tt := range tests {
		t.Run(tt.key, func(t *testing.T) {
			got := shouldIgnoreAnnotation(tt.key, tt.userPrefixes)
			if got != tt.want {
				t.Errorf("shouldIgnoreAnnotation(%q, %v) = %v, want %v", tt.key, tt.userPrefixes, got, tt.want)
			}
		})
	}
}

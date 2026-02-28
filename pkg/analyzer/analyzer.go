package analyzer

import "github.com/kube-migrate/kube-migrate/pkg/scanner"

// AnalysisReport is the full compatibility analysis for all ingresses.
type AnalysisReport struct {
	Target         string          `json:"target"`
	IngressReports []IngressReport `json:"ingressReports"`
	Summary        Summary         `json:"summary"`
}

// IngressReport is the per-ingress annotation analysis.
type IngressReport struct {
	Namespace     string              `json:"namespace"`
	Name          string              `json:"name"`
	Mappings      []AnnotationMapping `json:"mappings"`
	OverallStatus string              `json:"overallStatus"` // ready | workaround | breaking
}

// AnnotationMapping maps a single NGINX annotation to its target equivalent.
type AnnotationMapping struct {
	OriginalKey    string `json:"originalKey"`
	OriginalValue  string `json:"originalValue"`
	Status         string `json:"status"` // supported | partial | unsupported
	TargetResource string `json:"targetResource"`
	GeneratedYAML  string `json:"generatedYaml,omitempty"`
	Note           string `json:"note"`
}

// Summary aggregates compatibility counts.
type Summary struct {
	Total           int `json:"total"`
	FullyCompatible int `json:"fullyCompatible"`
	NeedsWorkaround int `json:"needsWorkaround"`
	HasUnsupported  int `json:"hasUnsupported"`
}

// Analyzer performs annotation compatibility analysis.
type Analyzer struct {
	target   string
	mappings map[string]CompatibilityEntry
}

// NewAnalyzer creates an analyzer for the given target.
func NewAnalyzer(target string) *Analyzer {
	var mappings map[string]CompatibilityEntry
	switch target {
	case "traefik":
		mappings = traefikMappings
	case "gateway-api":
		mappings = gatewayAPIMappings
	default:
		mappings = make(map[string]CompatibilityEntry)
	}
	return &Analyzer{target: target, mappings: mappings}
}

// Analyze runs compatibility analysis on scan results.
func (a *Analyzer) Analyze(scan *scanner.ScanResult) *AnalysisReport {
	report := &AnalysisReport{Target: a.target}

	for _, ing := range scan.Ingresses {
		ir := IngressReport{
			Namespace:     ing.Namespace,
			Name:          ing.Name,
			OverallStatus: "ready",
			Mappings:      []AnnotationMapping{},
		}

		for key, value := range ing.NginxAnnotations {
			mapping := a.mapAnnotation(key, value)
			ir.Mappings = append(ir.Mappings, mapping)

			switch mapping.Status {
			case "unsupported":
				ir.OverallStatus = "breaking"
			case "partial":
				if ir.OverallStatus != "breaking" {
					ir.OverallStatus = "workaround"
				}
			}
		}

		report.IngressReports = append(report.IngressReports, ir)
	}

	// Build summary
	report.Summary.Total = len(report.IngressReports)
	for _, ir := range report.IngressReports {
		switch ir.OverallStatus {
		case "ready":
			report.Summary.FullyCompatible++
		case "workaround":
			report.Summary.NeedsWorkaround++
		case "breaking":
			report.Summary.HasUnsupported++
		}
	}

	return report
}

func (a *Analyzer) mapAnnotation(key, value string) AnnotationMapping {
	entry, found := a.mappings[key]
	if !found {
		return AnnotationMapping{
			OriginalKey:    key,
			OriginalValue:  value,
			Status:         "unsupported",
			TargetResource: "N/A",
			Note:           "No known mapping for this annotation",
		}
	}

	return AnnotationMapping{
		OriginalKey:    key,
		OriginalValue:  value,
		Status:         entry.Status,
		TargetResource: entry.TargetResource,
		Note:           entry.Note,
	}
}

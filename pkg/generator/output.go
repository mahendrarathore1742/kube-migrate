package generator

import (
	"archive/zip"
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/kube-migrate/kube-migrate/pkg/analyzer"
)

// GeneratedFile represents a single file to be written.
type GeneratedFile struct {
	RelPath     string `json:"relPath"`
	Content     string `json:"content"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

// OutputGenerator writes migration files to disk.
type OutputGenerator struct {
	baseDir string
}

// NewOutputGenerator creates an output generator targeting the given directory.
func NewOutputGenerator(baseDir string) *OutputGenerator {
	return &OutputGenerator{baseDir: baseDir}
}

// Write writes all generated files and the migration report.
func (g *OutputGenerator) Write(files []GeneratedFile, report *analyzer.AnalysisReport) error {
	// Write the migration report first
	reportContent := g.buildReport(report)
	reportFile := GeneratedFile{
		RelPath:     "00-migration-report.md",
		Content:     reportContent,
		Description: "Full migration analysis report",
		Category:    "guide",
	}
	allFiles := append([]GeneratedFile{reportFile}, files...)

	for _, f := range allFiles {
		fullPath := filepath.Join(g.baseDir, f.RelPath)
		dir := filepath.Dir(fullPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("creating directory %s: %w", dir, err)
		}
		if err := os.WriteFile(fullPath, []byte(f.Content), 0644); err != nil {
			return fmt.Errorf("writing %s: %w", fullPath, err)
		}
	}
	return nil
}


// BuildReportFile creates the migration report as a GeneratedFile without writing to disk.
func (g *OutputGenerator) BuildReportFile(report *analyzer.AnalysisReport) GeneratedFile {
	return GeneratedFile{
		RelPath:     "00-migration-report.md",
		Content:     g.buildReport(report),
		Description: "Full migration analysis report",
		Category:    "guide",
	}
}
func (g *OutputGenerator) buildReport(report *analyzer.AnalysisReport) string {
	var b strings.Builder

	b.WriteString("# Migration Report\n\n")
	b.WriteString(fmt.Sprintf("**Target:** %s\n\n", report.Target))
	b.WriteString("## Summary\n\n")
	b.WriteString(fmt.Sprintf("| Metric | Count |\n"))
	b.WriteString(fmt.Sprintf("|--------|-------|\n"))
	b.WriteString(fmt.Sprintf("| Total Ingresses | %d |\n", report.Summary.Total))
	b.WriteString(fmt.Sprintf("| Fully Compatible ✅ | %d |\n", report.Summary.FullyCompatible))
	b.WriteString(fmt.Sprintf("| Needs Workaround ⚠️ | %d |\n", report.Summary.NeedsWorkaround))
	b.WriteString(fmt.Sprintf("| Has Unsupported ❌ | %d |\n\n", report.Summary.HasUnsupported))

	b.WriteString("## Per-Ingress Analysis\n\n")

	for _, ir := range report.IngressReports {
		statusIcon := "✅"
		switch ir.OverallStatus {
		case "workaround":
			statusIcon = "⚠️"
		case "breaking":
			statusIcon = "❌"
		}

		b.WriteString(fmt.Sprintf("### %s %s/%s\n\n", statusIcon, ir.Namespace, ir.Name))

		if len(ir.Mappings) > 0 {
			b.WriteString("| Annotation | Status | Target Resource | Note |\n")
			b.WriteString("|------------|--------|-----------------|------|\n")
			for _, m := range ir.Mappings {
				icon := "✅"
				switch m.Status {
				case "partial":
					icon = "⚠️"
				case "unsupported":
					icon = "❌"
				}
				b.WriteString(fmt.Sprintf("| %s `%s` | %s | %s | %s |\n",
					icon, m.OriginalKey, m.Status, m.TargetResource, m.Note))
			}
			b.WriteString("\n")
		} else {
			b.WriteString("No NGINX-specific annotations found.\n\n")
		}
	}

	return b.String()
}

// CreateZip creates an in-memory ZIP of all generated files plus the migration report.
func CreateZip(files []GeneratedFile, report *analyzer.AnalysisReport) ([]byte, error) {
var buf bytes.Buffer
w := zip.NewWriter(&buf)

// Add the migration report
gen := NewOutputGenerator(".")
reportContent := gen.buildReport(report)
if err := addToZip(w, "00-migration-report.md", reportContent); err != nil {
return nil, err
}

for _, f := range files {
if err := addToZip(w, f.RelPath, f.Content); err != nil {
return nil, err
}
}

if err := w.Close(); err != nil {
return nil, fmt.Errorf("closing zip: %w", err)
}
return buf.Bytes(), nil
}

func addToZip(w *zip.Writer, name, content string) error {
f, err := w.Create(name)
if err != nil {
return err
}
_, err = f.Write([]byte(content))
return err
}

// GenerateMigrationReport produces the markdown migration report content.
// Exported so the API layer can include it in the response files list.
func GenerateMigrationReport(files []GeneratedFile, report *analyzer.AnalysisReport) string {
gen := NewOutputGenerator(".")
return gen.buildReport(report)
}

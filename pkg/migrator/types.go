package migrator

import (
	"github.com/kube-migrate/kube-migrate/pkg/analyzer"
	"github.com/kube-migrate/kube-migrate/pkg/generator"
	"github.com/kube-migrate/kube-migrate/pkg/scanner"
)

// Migrator is the interface implemented by each target controller migrator.
type Migrator interface {
	Migrate(scan *scanner.ScanResult, report *analyzer.AnalysisReport) ([]generator.GeneratedFile, error)
}

package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/kube-migrate/kube-migrate/pkg/analyzer"
	"github.com/kube-migrate/kube-migrate/pkg/scanner"
	"github.com/spf13/cobra"
)

var analyzeTarget string

var analyzeCmd = &cobra.Command{
	Use:   "analyze",
	Short: "Analyze annotation compatibility for a target ingress controller",
	Long: `Analyzes every Ingress resource in the cluster and maps each
nginx.ingress.kubernetes.io/* annotation to its equivalent in the target controller.

Status indicators:
  supported   - Full equivalent exists, will work identically
  partial     - Equivalent exists but with behavioral differences
  unsupported - No equivalent; manual intervention required

Supported targets:
  traefik      Traefik v3.x (lowest migration friction)
  gateway-api  Kubernetes Gateway API via Envoy Gateway`,
	RunE: func(cmd *cobra.Command, args []string) error {
		return runAnalyze(cmd)
	},
}

func init() {
	analyzeCmd.Flags().StringVar(&analyzeTarget, "target", "", "Target controller: traefik|gateway-api (required)")
	analyzeCmd.MarkFlagRequired("target")
	analyzeCmd.Flags().StringVarP(&outputFormat, "output", "o", "table", "Output format: table|json")
	rootCmd.AddCommand(analyzeCmd)
}

func runAnalyze(_ *cobra.Command) error {
	if analyzeTarget != "traefik" && analyzeTarget != "gateway-api" {
		return fmt.Errorf("invalid target %q: must be 'traefik' or 'gateway-api'", analyzeTarget)
	}

	s, err := scanner.NewScanner(kubeconfig, kubecontext)
	if err != nil {
		return fmt.Errorf("connecting to cluster: %w", err)
	}

	scanResult, err := s.Scan(namespace)
	if err != nil {
		return fmt.Errorf("scanning cluster: %w", err)
	}

	a := analyzer.NewAnalyzer(analyzeTarget)
	report := a.Analyze(scanResult)

	switch outputFormat {
	case "json":
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(report)
	default:
		printAnalysisReport(report)
	}
	return nil
}

func printAnalysisReport(r *analyzer.AnalysisReport) {
	fmt.Printf("\n🔬 Annotation Compatibility Report (target: %s)\n", r.Target)
	fmt.Printf("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")

	fmt.Printf("  Summary:\n")
	fmt.Printf("    Total ingresses:     %d\n", r.Summary.Total)
	fmt.Printf("    Fully compatible:    %d ✅\n", r.Summary.FullyCompatible)
	fmt.Printf("    Needs workaround:    %d ⚠️\n", r.Summary.NeedsWorkaround)
	fmt.Printf("    Has unsupported:     %d ❌\n\n", r.Summary.HasUnsupported)

	for _, ir := range r.IngressReports {
		statusIcon := "✅"
		switch ir.OverallStatus {
		case "workaround":
			statusIcon = "⚠️"
		case "breaking":
			statusIcon = "❌"
		}

		fmt.Printf("  %s %s/%s\n", statusIcon, ir.Namespace, ir.Name)

		if len(ir.Mappings) > 0 {
			w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
			fmt.Fprintf(w, "    ANNOTATION\tSTATUS\tTARGET RESOURCE\tNOTE\n")
			fmt.Fprintf(w, "    ──────────\t──────\t───────────────\t────\n")
			for _, m := range ir.Mappings {
				icon := "✅"
				switch m.Status {
				case "partial":
					icon = "⚠️"
				case "unsupported":
					icon = "❌"
				}
				fmt.Fprintf(w, "    %s %s\t%s\t%s\t%s\n",
					icon, m.OriginalKey, m.Status, m.TargetResource, m.Note)
			}
			w.Flush()
		}
		fmt.Println()
	}
}

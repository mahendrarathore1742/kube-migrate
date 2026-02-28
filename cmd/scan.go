package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/kube-migrate/kube-migrate/pkg/scanner"
	"github.com/spf13/cobra"
)

var scanCmd = &cobra.Command{
	Use:   "scan",
	Short: "Scan your Kubernetes cluster for Ingress resources",
	Long: `Connects to the Kubernetes cluster and discovers:
  - The active ingress controller type and version
  - All Ingress resources across namespaces
  - Annotations used on each Ingress
  - Complexity classification per Ingress`,
	RunE: func(cmd *cobra.Command, args []string) error {
		return runScan(cmd)
	},
}

func init() {
	scanCmd.Flags().StringVarP(&outputFormat, "output", "o", "table", "Output format: table|json")
	rootCmd.AddCommand(scanCmd)
}

func runScan(_ *cobra.Command) error {
	s, err := scanner.NewScanner(kubeconfig, kubecontext)
	if err != nil {
		return fmt.Errorf("connecting to cluster: %w", err)
	}

	result, err := s.Scan(namespace)
	if err != nil {
		return fmt.Errorf("scanning cluster: %w", err)
	}

	switch outputFormat {
	case "json":
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(result)
	default:
		printScanResult(result)
	}
	return nil
}

func printScanResult(r *scanner.ScanResult) {
	fmt.Printf("\n🔍 Cluster Scan Results\n")
	fmt.Printf("━━━━━━━━━━━━━━━━━━━━━━\n\n")

	fmt.Printf("  Controller: %s\n", r.Controller.Type)
	fmt.Printf("  Version:    %s\n", r.Controller.Version)
	fmt.Printf("  Namespace:  %s\n\n", r.Controller.Namespace)

	fmt.Printf("  Found %d ingress(es)\n\n", len(r.Ingresses))

	if len(r.Ingresses) == 0 {
		return
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintf(w, "  NAMESPACE\tNAME\tHOSTS\tANNOTATIONS\tCOMPLEXITY\n")
	fmt.Fprintf(w, "  ─────────\t────\t─────\t───────────\t──────────\n")

	for _, ing := range r.Ingresses {
		hosts := ""
		for i, h := range ing.Hosts {
			if i > 0 {
				hosts += ", "
			}
			hosts += h
		}
		fmt.Fprintf(w, "  %s\t%s\t%s\t%d\t%s\n",
			ing.Namespace, ing.Name, hosts,
			len(ing.NginxAnnotations), ing.Complexity)
	}
	w.Flush()
	fmt.Println()
}

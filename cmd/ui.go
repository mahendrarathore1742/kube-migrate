package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"

	"github.com/kube-migrate/kube-migrate/pkg/server"
	"github.com/spf13/cobra"
)

var uiPort int

var uiCmd = &cobra.Command{
	Use:   "ui",
	Short: "Open the visual migration dashboard in your browser",
	Long: `Starts a local HTTP server that serves the kube-migrate web UI.
The UI provides a 4-step guided migration workflow:
  1. Detect  — scan your cluster
  2. Analyze — check annotation compatibility
  3. Migrate — generate and apply migration files
  4. Validate — verify migration status`,
	RunE: func(cmd *cobra.Command, args []string) error {
		return runUI()
	},
}

func init() {
	uiCmd.Flags().IntVar(&uiPort, "port", 8080, "Port for the web UI")
	rootCmd.AddCommand(uiCmd)
}

func runUI() error {
	url := fmt.Sprintf("http://localhost:%d", uiPort)

	fmt.Printf("\n🌐 kube-migrate UI starting on %s\n", url)
	fmt.Printf("   Press Ctrl+C to stop\n\n")

	// Open browser
	go openBrowser(url)

	srv := server.NewServer(kubeconfig, kubecontext, uiPort)
	return srv.Start()
}

func openBrowser(url string) {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "darwin":
		cmd = "open"
		args = []string{url}
	case "linux":
		cmd = "xdg-open"
		args = []string{url}
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start", url}
	default:
		return
	}

	c := exec.Command(cmd, args...)
	c.Stderr = os.Stderr
	_ = c.Start()
}

package server

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/kube-migrate/kube-migrate/pkg/analyzer"
	"github.com/kube-migrate/kube-migrate/pkg/generator"
	"github.com/kube-migrate/kube-migrate/pkg/migrator/gatewayapi"
	"github.com/kube-migrate/kube-migrate/pkg/migrator/traefik"
	"github.com/kube-migrate/kube-migrate/pkg/scanner"
)

//go:embed dist/*
var uiFS embed.FS

// Server is the HTTP server for the kube-migrate UI and API.
type Server struct {
	kubeconfig  string
	kubecontext string
	port        int
	cors        bool
	authToken   string
}

// NewServer creates a new HTTP server.
func NewServer(kubeconfig, kubecontext string, port int) *Server {
	return &Server{
		kubeconfig:  kubeconfig,
		kubecontext: kubecontext,
		port:        port,
		cors:        os.Getenv("KUBE_MIGRATE_CORS") == "1",
		authToken:   os.Getenv("KUBE_MIGRATE_TOKEN"),
	}
}

// Start starts the HTTP server with graceful shutdown.
func (s *Server) Start() error {
	mux := http.NewServeMux()

	// API routes with authentication
	apiMux := http.NewServeMux()
	apiMux.HandleFunc("/api/scan", s.handleScan)
	apiMux.HandleFunc("/api/analyze", s.handleAnalyze)
	apiMux.HandleFunc("/api/migrate", s.handleMigrate)
	apiMux.HandleFunc("/api/validate", s.handleValidate)
	apiMux.HandleFunc("/api/download", s.handleDownload)
	apiMux.HandleFunc("/api/apply", s.handleApply)

	// Wrap API routes with auth middleware
	mux.Handle("/api/", s.authMiddleware(apiMux))

	// Serve embedded UI with SPA fallback (no auth required for UI)
	distFS, err := fs.Sub(uiFS, "dist")
	if err != nil {
		return fmt.Errorf("embedding UI: %w", err)
	}
	mux.Handle("/", spaHandler(http.FS(distFS)))

	// Wrap with CORS middleware when enabled
	var handler http.Handler = mux
	if s.cors {
		handler = corsMiddleware(handler)
	}
	handler = loggingMiddleware(handler)
	handler = bodySizeMiddleware(handler)

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", s.port),
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-done
		fmt.Println("\nShutting down server...")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("shutdown error: %v", err)
		}
	}()

	if s.authToken != "" {
		fmt.Printf("kube-migrate UI running at http://localhost:%d (auth required)\n", s.port)
	} else {
		fmt.Printf("kube-migrate UI running at http://localhost:%d\n", s.port)
		fmt.Println("WARNING: No authentication token set. Set KUBE_MIGRATE_TOKEN environment variable for security.")
	}

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}

// spaHandler serves static files and falls back to index.html for SPA routes.
func spaHandler(root http.FileSystem) http.Handler {
	fileServer := http.FileServer(root)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Try to open the file
		f, err := root.Open(path)
		if err != nil {
			// File not found — serve index.html for SPA routing
			r.URL.Path = "/"
			fileServer.ServeHTTP(w, r)
			return
		}
		f.Close()
		fileServer.ServeHTTP(w, r)
	})
}

// corsMiddleware adds CORS headers for dev mode (frontend on :5173, API on :8080).
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sc, err := scanner.NewScanner(s.kubeconfig, s.kubecontext)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to connect to cluster: "+err.Error())
		return
	}

	result, err := sc.Scan("")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Scan failed: "+err.Error())
		return
	}

	writeJSON(w, result)
}

func (s *Server) handleAnalyze(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Target string `json:"target"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Target != "traefik" && req.Target != "gateway-api" {
		writeError(w, http.StatusBadRequest, "Target must be 'traefik' or 'gateway-api'")
		return
	}

	sc, err := scanner.NewScanner(s.kubeconfig, s.kubecontext)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to connect to cluster: "+err.Error())
		return
	}

	scanResult, err := sc.Scan("")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Scan failed: "+err.Error())
		return
	}

	a := analyzer.NewAnalyzer(req.Target)
	report := a.Analyze(scanResult)

	// Enrich with guides
	enrichReport(report, req.Target)

	writeJSON(w, report)
}

func (s *Server) handleMigrate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Target    string `json:"target"`
		OutputDir string `json:"outputDir"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Target != "traefik" && req.Target != "gateway-api" {
		writeError(w, http.StatusBadRequest, "Target must be 'traefik' or 'gateway-api'")
		return
	}
	if req.OutputDir == "" {
		req.OutputDir = "./migration"
	}

	sc, err := scanner.NewScanner(s.kubeconfig, s.kubecontext)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to connect: "+err.Error())
		return
	}

	scanResult, err := sc.Scan("")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Scan failed: "+err.Error())
		return
	}

	a := analyzer.NewAnalyzer(req.Target)
	report := a.Analyze(scanResult)

	var files []generator.GeneratedFile

	switch req.Target {
	case "traefik":
		m := traefik.NewMigrator()
		files, err = m.Migrate(scanResult, report)
	case "gateway-api":
		m := gatewayapi.NewMigrator()
		files, err = m.Migrate(scanResult, report)
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Migration failed: "+err.Error())
		return
	}

	// Add the migration report to the response (but don't write to disk from API)
	reportGen := generator.NewOutputGenerator(req.OutputDir)
	reportFile := reportGen.BuildReportFile(report)
	allFiles := append([]generator.GeneratedFile{reportFile}, files...)

	writeJSON(w, map[string]interface{}{
		"files":   allFiles,
		"summary": report.Summary,
	})
}

func (s *Server) handleValidate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Target string `json:"target"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	sc, err := scanner.NewScanner(s.kubeconfig, s.kubecontext)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to connect: "+err.Error())
		return
	}

	result := validateMigration(sc, req.Target)
	writeJSON(w, result)
}

func (s *Server) handleDownload(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("target")
	if target == "" {
		writeError(w, http.StatusBadRequest, "target required")
		return
	}

	sc, err := scanner.NewScanner(s.kubeconfig, s.kubecontext)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to connect: "+err.Error())
		return
	}

	scanResult, err := sc.Scan("")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Scan failed: "+err.Error())
		return
	}

	a := analyzer.NewAnalyzer(target)
	report := a.Analyze(scanResult)

	var files []generator.GeneratedFile
	switch target {
	case "traefik":
		m := traefik.NewMigrator()
		files, err = m.Migrate(scanResult, report)
	case "gateway-api":
		m := gatewayapi.NewMigrator()
		files, err = m.Migrate(scanResult, report)
	default:
		writeError(w, http.StatusBadRequest, "unknown target")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	zipData, err := generator.CreateZip(files, report)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Creating ZIP: "+err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="migration-%s.zip"`, target))
	w.Write(zipData)
}

func (s *Server) handleApply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Target   string `json:"target"`
		Category string `json:"category"`
		DryRun   bool   `json:"dryRun"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Target == "" || req.Category == "" {
		writeError(w, http.StatusBadRequest, "target and category required")
		return
	}

	// Generate migration files
	sc, err := scanner.NewScanner(s.kubeconfig, s.kubecontext)
	if err != nil {
		writeJSON(w, map[string]interface{}{"success": false, "error": "Cannot connect: " + err.Error()})
		return
	}

	scanResult, err := sc.Scan("")
	if err != nil {
		writeJSON(w, map[string]interface{}{"success": false, "error": "Scan failed: " + err.Error()})
		return
	}

	a := analyzer.NewAnalyzer(req.Target)
	report := a.Analyze(scanResult)

	var files []generator.GeneratedFile
	switch req.Target {
	case "traefik":
		m := traefik.NewMigrator()
		files, err = m.Migrate(scanResult, report)
	case "gateway-api":
		m := gatewayapi.NewMigrator()
		files, err = m.Migrate(scanResult, report)
	default:
		writeJSON(w, map[string]interface{}{"success": false, "error": "unknown target"})
		return
	}
	if err != nil {
		writeJSON(w, map[string]interface{}{"success": false, "error": err.Error()})
		return
	}

	// Filter to the requested category and write YAML to temp dir
	tmpDir, tmpErr := os.MkdirTemp("", "kube-migrate-apply-*")
	if tmpErr != nil {
		writeJSON(w, map[string]interface{}{"success": false, "error": "Cannot create temp dir"})
		return
	}
	defer os.RemoveAll(tmpDir)

	var applied []string
	var skipped []string
	for _, f := range files {
		if f.Category != req.Category {
			continue
		}
		if !strings.HasSuffix(f.RelPath, ".yaml") && !strings.HasSuffix(f.RelPath, ".yml") {
			continue
		}
		// Skip YAML files that aren't valid Kubernetes manifests
		// (e.g. Helm values.yaml, kustomization.yaml, config files)
		if !isKubernetesManifest(f.Content) {
			skipped = append(skipped, f.RelPath)
			continue
		}
		fname := strings.ReplaceAll(f.RelPath, "/", "_")
		dest := fmt.Sprintf("%s/%s", tmpDir, fname)
		if writeFileErr := os.WriteFile(dest, []byte(f.Content), 0644); writeFileErr != nil {
			continue
		}
		applied = append(applied, fname)
	}

	if len(applied) == 0 {
		msg := fmt.Sprintf("No applicable Kubernetes manifests for category '%s'.", req.Category)
		if len(skipped) > 0 {
			msg += fmt.Sprintf(" Skipped %d non-manifest files (Helm values, scripts, etc.): %s",
				len(skipped), strings.Join(skipped, ", "))
		}
		writeJSON(w, map[string]interface{}{
			"success": true,
			"output":  msg,
			"dryRun":  req.DryRun,
			"applied": applied,
			"skipped": skipped,
		})
		return
	}

	// Build kubectl command
	args := []string{"apply", "-f", tmpDir}
	if req.DryRun {
		args = append(args, "--dry-run=client")
	}
	if s.kubeconfig != "" {
		args = append([]string{"--kubeconfig", s.kubeconfig}, args...)
	}
	if s.kubecontext != "" {
		args = append([]string{"--context", s.kubecontext}, args...)
	}

	cmd := exec.Command("kubectl", args...)
	output, cmdErr := cmd.CombinedOutput()

	resp := map[string]interface{}{
		"success": cmdErr == nil,
		"output":  string(output),
		"dryRun":  req.DryRun,
		"applied": applied,
		"skipped": skipped,
	}
	if cmdErr != nil {
		resp["error"] = cmdErr.Error()
	}
	writeJSON(w, resp)
}

// isKubernetesManifest checks if the YAML content looks like a valid
// Kubernetes resource (contains apiVersion and kind at the top level).
// This filters out Helm values.yaml, kustomization files, etc.
func isKubernetesManifest(content string) bool {
	hasAPIVersion := false
	hasKind := false
	for _, line := range strings.Split(content, "\n") {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "apiVersion:") {
			hasAPIVersion = true
		}
		if strings.HasPrefix(trimmed, "kind:") {
			hasKind = true
		}
		if hasAPIVersion && hasKind {
			return true
		}
	}
	return false
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// loggingMiddleware logs each API request with method, path, status, and duration.
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/api/") {
			next.ServeHTTP(w, r)
			return
		}
		start := time.Now()
		rw := &statusWriter{ResponseWriter: w, status: 200}
		next.ServeHTTP(rw, r)
		log.Printf("[API] %s %s → %d (%s)", r.Method, r.URL.Path, rw.status, time.Since(start).Round(time.Millisecond))
	})
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

// bodySizeMiddleware limits request body to 1 MB for API endpoints.
func bodySizeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") && r.Body != nil {
			r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MB
		}
		next.ServeHTTP(w, r)
	})
}

// authMiddleware validates the Bearer token for API requests.
// If no token is configured, all requests are allowed (backwards compatible).
func (s *Server) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If no auth token configured, allow all requests
		if s.authToken == "" {
			next.ServeHTTP(w, r)
			return
		}

		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeError(w, http.StatusUnauthorized, "missing Authorization header")
			return
		}

		// Expect "Bearer <token>" format
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			writeError(w, http.StatusUnauthorized, "invalid Authorization header format, expected: Bearer <token>")
			return
		}

		if parts[1] != s.authToken {
			writeError(w, http.StatusForbidden, "invalid token")
			return
		}

		next.ServeHTTP(w, r)
	})
}

func enrichReport(report *analyzer.AnalysisReport, target string) {
	guides := traefikGuides
	if target == "gateway-api" {
		guides = gatewayAPIGuides
	}

	for i, ir := range report.IngressReports {
		for j, m := range ir.Mappings {
			if guide, ok := guides[m.OriginalKey]; ok {
				report.IngressReports[i].Mappings[j].Note = guide.What
			}
		}
	}
}

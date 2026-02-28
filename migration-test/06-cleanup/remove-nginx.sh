#!/bin/bash
set -euo pipefail

echo "=== Removing NGINX Ingress Controller ==="
echo ""
echo "⚠️  WARNING: Only run this after:"
echo "   1. DNS has been updated to Traefik IP"
echo "   2. Traffic has been flowing through Traefik for 24+ hours"
echo "   3. No errors in Traefik logs"
echo ""
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Cancelled."
  exit 0
fi

# Backup NGINX values
echo "Backing up NGINX Helm values..."
helm get values ingress-nginx -n ingress-nginx > nginx-values-backup.yaml 2>/dev/null || true

# Uninstall NGINX
echo "Removing NGINX Ingress Controller..."
helm uninstall ingress-nginx -n ingress-nginx

echo ""
echo "✅ NGINX removed. Backup saved to nginx-values-backup.yaml"

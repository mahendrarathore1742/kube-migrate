#!/bin/bash
set -euo pipefail

echo "=== Installing Gateway API CRDs ==="
echo "This is safe — it only registers API types, no traffic changes"
echo ""

kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml

echo ""
echo "✅ Gateway API CRDs installed"
kubectl get crd | grep gateway

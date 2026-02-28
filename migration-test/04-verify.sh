#!/bin/bash
set -euo pipefail

echo "=== Verifying Traefik Migration ==="
echo ""

# Get Traefik LoadBalancer IP
TRAEFIK_IP=$(kubectl get svc -n traefik-system traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)

if [ -z "$TRAEFIK_IP" ]; then
  echo "❌ Could not get Traefik LoadBalancer IP"
  exit 1
fi

echo "Traefik IP: $TRAEFIK_IP"
echo ""

echo "Testing admin.example.com..."
curl -sk --resolve admin.example.com:443:$TRAEFIK_IP https://admin.example.com/ -o /dev/null -w "  %{http_code} %{time_total}s\n"
echo "Testing api.example.com..."
curl -sk --resolve api.example.com:443:$TRAEFIK_IP https://api.example.com/ -o /dev/null -w "  %{http_code} %{time_total}s\n"
echo "Testing grpc.example.com..."
curl -sk --resolve grpc.example.com:443:$TRAEFIK_IP https://grpc.example.com/ -o /dev/null -w "  %{http_code} %{time_total}s\n"
echo "Testing old.example.com..."
curl -sk --resolve old.example.com:443:$TRAEFIK_IP https://old.example.com/ -o /dev/null -w "  %{http_code} %{time_total}s\n"
echo "Testing www.example.com..."
curl -sk --resolve www.example.com:443:$TRAEFIK_IP https://www.example.com/ -o /dev/null -w "  %{http_code} %{time_total}s\n"
echo "Testing example.com..."
curl -sk --resolve example.com:443:$TRAEFIK_IP https://example.com/ -o /dev/null -w "  %{http_code} %{time_total}s\n"
echo "Testing ws.example.com..."
curl -sk --resolve ws.example.com:443:$TRAEFIK_IP https://ws.example.com/ -o /dev/null -w "  %{http_code} %{time_total}s\n"

echo ""
echo "✅ Verification complete"
echo "   If all responses are 200, Traefik is ready for DNS cutover"

# DNS Migration Guide

## Overview

After verifying that Traefik serves all hosts correctly, update DNS to point to the Traefik LoadBalancer IP.

## Steps

1. **Get the Traefik IP:**
   ```bash
   kubectl get svc -n traefik-system traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
   ```

2. **Update DNS records** — change A/CNAME records to the Traefik IP

3. **Wait for propagation** — DNS TTL determines how long this takes (typically 5–60 minutes)

4. **Monitor** — watch logs for errors:
   ```bash
   kubectl logs -n traefik-system -l app.kubernetes.io/name=traefik -f
   ```

5. **Keep NGINX running** for at least 24 hours as a safety net

## Rollback

If issues are found, revert DNS to the NGINX LoadBalancer IP:
```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

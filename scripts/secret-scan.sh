#!/usr/bin/env bash
# Fails if any secret-like string appears in client source or the built bundle.
set -euo pipefail
cd "$(dirname "$0")/.."
PATTERN='sk_live_|sk_test_|sk-[A-Za-z0-9]{16}|SERVICE_ROLE_KEY|service_role|STRIPE_SECRET|whsec_|OPENAI_API_KEY|ANTHROPIC_API_KEY|PERPLEXITY_API_KEY'
STATUS=0
echo "Scanning src/ ..."
if grep -rInE "$PATTERN" src/ ; then echo "  ✗ secret-like string in src/"; STATUS=1; else echo "  ✓ clean"; fi
if [ -d dist ]; then
  echo "Scanning dist/ ..."
  if grep -rIoE "$PATTERN" dist/ ; then echo "  ✗ secret-like string in dist/"; STATUS=1; else echo "  ✓ clean"; fi
fi
echo "Client env reads (must be VITE_ only):"
grep -rhoE "import\.meta\.env\.[A-Za-z_]+" src/ | sort -u | sed 's/^/  /'
if grep -rhoE "import\.meta\.env\.[A-Za-z_]+" src/ | grep -vqE "VITE_"; then echo "  ✗ non-VITE_ client env read"; STATUS=1; fi
[ "$STATUS" = 0 ] && echo "SECURITY SCAN PASSED" || echo "SECURITY SCAN FAILED"
exit $STATUS

#!/usr/bin/env bash
# Install GitLab CLI (glab) to /usr/local/bin — Linux amd64 from official GitLab package registry.
# Requires: curl, tar, sudo (for system-wide install). Idempotent if same version already present.
set -euo pipefail

GLAB_VERSION="${GLAB_VERSION:-1.93.0}"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
TMP="${TMPDIR:-/tmp}/glab-install-$$"

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP"
cd "$TMP"

ENC_VER=$(printf '%s' "$GLAB_VERSION" | sed 's/\./%2E/g')
URL="https://gitlab.com/api/v4/projects/gitlab-org%2Fcli/packages/generic/glab/${ENC_VER}/glab_${GLAB_VERSION}_linux_amd64.tar.gz"

echo "Downloading glab ${GLAB_VERSION}..."
curl -fsSL -o glab.tgz "$URL"
tar xzf glab.tgz

if [[ ! -f bin/glab ]]; then
	echo "error: expected bin/glab in tarball" >&2
	exit 1
fi

if [[ "${INSTALL_DIR}" == "/usr/local/bin" ]] || [[ "${INSTALL_DIR}" == "/usr/bin" ]]; then
	sudo install -m 0755 bin/glab "${INSTALL_DIR}/glab"
else
	install -m 0755 bin/glab "${INSTALL_DIR}/glab"
fi

echo "Installed: $("${INSTALL_DIR}/glab" version 2>/dev/null | head -1")"

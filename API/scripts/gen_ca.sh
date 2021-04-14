#!/bin/sh
# Script to create the certificate authority (CA) certificate and key
# Usage: ./gen_ca [common name]
# easy-rsa must be in the PATH

# Check argument
if [ $# -ne 1 ]; then
  exit 1
fi

# PKI directory
pki=/etc/pki/$1

# Config env vars for easy-rsa
export EASYRSA_PKI="$pki"
export EASYRSA_REQ_CN="$1"

# Init PKI
easyrsa init-pki

# Build CA
easyrsa build-ca nopass

# Clean up
unset EASYRSA_PKI
unset EASYRSA_REQ_CN

#!/bin/sh
# Script to sign the certificate request from server/client
# Usage: ./sign_cert [common name] [server|client] [path/to/request] [server/client name]
# easy-rsa must be in the PATH

# Check arguments
if [ $# -ne 4 ]; then
  exit 1
fi

# PKI directory
pki=/etc/pki/$1

# Config env var for easy-rsa
export EASYRSA_PKI="$pki"

# Sign request
if [ "$2" = "server" ]; then
  easyrsa import-req "$3" "$4"
  easyrsa sign-req server "$4"
elif [ "$2" = "client" ]; then
  easyrsa import-req "$3" "$4"
  easyrsa sign-req client "$4"
else
  exit 1
fi

# Clean up
rm -f "$3"
unset EASYRSA_PKI

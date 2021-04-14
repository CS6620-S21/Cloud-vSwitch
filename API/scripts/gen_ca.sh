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

# Fix .rnd:
# https://github.com/OpenVPN/easy-rsa/issues/261#issuecomment-566245849
# dd if=/dev/urandom of="$pki"/.rnd bs=256 count=1
# https://github.com/openssl/openssl/issues/7754#issuecomment-653847708
openssl rand -out "$pki"/.rnd -writerand "$pki"/.rnd

# Build CA
easyrsa build-ca nopass

# Clean up
unset EASYRSA_PKI
unset EASYRSA_REQ_CN

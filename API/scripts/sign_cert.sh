#!/bin/sh
# Script to sign the certificate request from server/client for an organization
# Depends on the start_server script to set up easy-rsa environment variables beforehand
# Usage: ./sign_cert [common name] [server|client] [path/to/request] [server/client name]

# Check arguments
if [ $# -ne 4 ] || [ "$2" != "server" ] && [ "$2" != "client" ]; then
  exit 1
fi

# PKI directory for the organization
pki=$EASYRSA_PKI/$1

# Config env var for easy-rsa
export EASYRSA_PKI=$pki
export EASYRSA_REQ_CN=$1

# Import sign req if signed certificate does not exist
if [ ! -f "$pki/issued/$4.crt" ]; then
  easyrsa import-req "$3" "$4"
fi

# Sign request
if [ "$2" = "server" ]; then
  easyrsa sign-req server "$4"
else
  easyrsa sign-req client "$4"
fi

# Clean up
rm -f "$3"
unset EASYRSA_PKI
unset EASYRSA_REQ_CN

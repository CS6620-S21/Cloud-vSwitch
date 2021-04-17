#!/bin/sh
# Script to set up and start express server

# Set path to easy-rsa directory
export EASYRSA=$HOME/easy-rsa
# Set path to PKI directory where easy-rsa manages certificates
export EASYRSA_PKI=$EASYRSA/pki
# Copy easy-rsa to the directory
cp -r /usr/share/easy-rsa/3.0.8 "$EASYRSA"

# Config easy-rsa parameters
# Elliptic curve cryptography provides more security and eliminates
# the need for a Diffie-Hellman parameters file.
cat > "$EASYRSA"/vars << EOL
set_var EASYRSA_ALGO ec
set_var EASYRSA_CURVE secp521r1
set_var EASYRSA_DIGEST "sha512"
set_var EASYRSA_NS_SUPPORT "yes"
set_var EASYRSA_BATCH 1
EOL

# Load environment variables required by express server from .env file
export "$(grep -v '^#' .env | xargs)"
# Start express server in production mode
pm2 start ../server.js --name vswitch-api

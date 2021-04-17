#!/bin/sh
# Script to set up and start express server

# Set required environment variables
. ./.env

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

# Start express server
npm start

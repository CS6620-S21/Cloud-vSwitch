#!/bin/sh
# Script to create the certificate authority (CA) certificate and key

# Config easy-rsa
# Elliptic curve cryptography provides more security and eliminates
# the need for a Diffie-Hellman parameters file.
cat > "$EASYRSA"/vars << EOL
set_var EASYRSA_ALGO ec
set_var EASYRSA_CURVE secp521r1
set_var EASYRSA_DIGEST "sha512"
set_var EASYRSA_NS_SUPPORT "yes"
set_var EASYRSA_REQ_CN "cloud-vswitch"
set_var EASYRSA_BATCH 1
EOL

# init PKI
easyrsa init-pki

# build CA
easyrsa build-ca nopass

#!/bin/sh
# Generate self-signed SSL certificate for local / staging Docker testing
set -e

mkdir -p /etc/nginx/ssl
if [ ! -f /etc/nginx/ssl/server.crt ]; then
    echo "Generating self-signed SSL certificate for No Tre(ou)ble portal..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/server.key \
        -out /etc/nginx/ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=NoTrouble/OU=Security/CN=localhost"
    chmod 600 /etc/nginx/ssl/server.key
    echo "SSL Certificate generated successfully."
fi

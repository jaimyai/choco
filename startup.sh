#!/bin/bash
set -e

# Create the SSH directory with secure permissions
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Add the public key to authorized_keys
cat > /root/.ssh/authorized_keys <<'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICRM3VkzIVPOtfe2ga6aWQItx7wS373GIxrp+53KXzEH
EOF

# Lock down the file permissions
chmod 600 /root/.ssh/authorized_keys
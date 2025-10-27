#!/bin/bash

# Script to install Cypress dependencies in WSL
# Run this with: sudo bash install-cypress-deps.sh

echo "=================================================="
echo "Installing Cypress Dependencies for WSL"
echo "=================================================="
echo ""

# Update package lists
echo "Step 1: Updating package lists..."
apt-get update

echo ""
echo "Step 2: Installing core Cypress dependencies..."

# Install core dependencies
apt-get install -y \
  libasound2 \
  libgtk2.0-0 \
  libgtk-3-0 \
  libgbm-dev \
  libnotify-dev \
  libgconf-2-4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  xauth \
  xvfb

echo ""
echo "Step 3: Installing additional graphical dependencies..."

# Install additional dependencies
apt-get install -y \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libdbus-glib-1-2 \
  libxt6

echo ""
echo "Step 4: Installing X11 and display server dependencies..."

# Install X11 dependencies
apt-get install -y \
  x11-utils \
  libx11-xcb1 \
  libxcb-dri3-0 \
  libxcb1

echo ""
echo "=================================================="
echo "Installation Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Verify Cypress installation:"
echo "   cd /mnt/c/users/charl/claudeworkspace/testwebapp/frontend"
echo "   npx cypress verify"
echo ""
echo "2. Run Cypress tests in headless mode:"
echo "   npx cypress run"
echo ""
echo "3. Run specific test:"
echo "   npx cypress run --spec 'cypress/e2e/recipe-simple.cy.js'"
echo ""
echo "4. Run with Xvfb (virtual display):"
echo "   xvfb-run npx cypress run"
echo ""

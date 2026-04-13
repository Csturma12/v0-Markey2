#!/bin/bash
cd /vercel/share/v0-project
rm -f pnpm-lock.yaml
pnpm install
echo "pnpm-lock.yaml regenerated successfully"

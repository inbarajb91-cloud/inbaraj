#!/usr/bin/env node
// Hash an admin password for ADMIN_PASSWORD env var.
// Usage: node scripts/hash-password.mjs <password>
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs <password>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log(hash);

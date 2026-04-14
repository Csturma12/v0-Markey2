import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = '/vercel/share/v0-project';

try {
  // Delete the old lockfile
  const lockfilePath = path.join(projectRoot, 'pnpm-lock.yaml');
  if (fs.existsSync(lockfilePath)) {
    fs.unlinkSync(lockfilePath);
    console.log('Deleted old pnpm-lock.yaml');
  }

  // Regenerate lockfile
  process.chdir(projectRoot);
  execSync('pnpm install --frozen-lockfile=false', { stdio: 'inherit' });
  console.log('Successfully regenerated pnpm-lock.yaml');
} catch (error) {
  console.error('Error regenerating lockfile:', error.message);
  process.exit(1);
}

/**
 * One-off dev utility: gives any existing Profile with zero photos a simple
 * initials-avatar (a colored circle + letter), generated locally, not a
 * fabricated "photo of a person," just a placeholder so the app doesn't show
 * an empty photo grid for profiles created before photo upload existed.
 * Reuses the real ImageCompressionService/LocalStorageProvider so the result
 * matches what a real upload would produce. Run from apps/api with the
 * environment loaded (DATABASE_URL, API_PORT):
 *   set -a && source .env && set +a && npx ts-node scripts/seed-avatars.ts
 */
import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { ImageCompressionService } from '../src/storage/image-compression.service';
import { LocalStorageProvider } from '../src/storage/providers/local-storage.provider';

const AVATAR_COLORS = ['#c9542f', '#a63f21', '#7f2f18', '#e3805a', '#8a5a3a', '#b8712f'];

async function main() {
  const prisma = new PrismaClient();
  const compression = new ImageCompressionService();
  const storage = new LocalStorageProvider();

  const profiles = await prisma.profile.findMany({ include: { photos: true } });
  let seeded = 0;

  for (const [index, profile] of profiles.entries()) {
    if (profile.photos.length > 0) continue;

    const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const initial = profile.displayName.trim().charAt(0).toUpperCase() || '?';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="58%" font-family="Georgia, 'Times New Roman', serif" font-size="280"
            font-weight="700" fill="#fff9f6" text-anchor="middle">${initial}</text>
    </svg>`;

    const rawJpeg = await sharp(Buffer.from(svg)).jpeg().toBuffer();
    const compressed = await compression.compress(rawJpeg);
    const key = `profiles/${profile.id}/${randomUUID()}.jpg`;
    const { url } = await storage.upload(key, compressed, 'image/jpeg');

    await prisma.profilePhoto.create({ data: { profileId: profile.id, url, position: 0 } });
    console.log(`Seeded avatar for ${profile.displayName} (${profile.id}) -> ${url}`);
    seeded += 1;
  }

  console.log(seeded > 0 ? `Done: seeded ${seeded} profile(s).` : 'Nothing to do: every profile already has a photo.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

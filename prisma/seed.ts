import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const boardGames = [
  { name: "Catan", slug: "catan", minPlayers: 3, maxPlayers: 4, playTimeMinutes: 90, description: "Trade and build on the island of Catan." },
  { name: "Ticket to Ride", slug: "ticket-to-ride", minPlayers: 2, maxPlayers: 5, playTimeMinutes: 60, description: "Collect train cards to claim routes across the map." },
  { name: "Carcassonne", slug: "carcassonne", minPlayers: 2, maxPlayers: 5, playTimeMinutes: 45, description: "Tile-laying with meeples in medieval France." },
  { name: "Azul", slug: "azul", minPlayers: 2, maxPlayers: 4, playTimeMinutes: 45, description: "Draft beautiful tiles to decorate the palace wall." },
  { name: "Wingspan", slug: "wingspan", minPlayers: 1, maxPlayers: 5, playTimeMinutes: 70, description: "Engine-building about birds and habitats." },
  { name: "Pandemic", slug: "pandemic", minPlayers: 2, maxPlayers: 4, playTimeMinutes: 60, description: "Cooperative fight against global diseases." },
  { name: "Codenames", slug: "codenames", minPlayers: 4, maxPlayers: 8, playTimeMinutes: 20, description: "Word association party game with two teams." },
  { name: "Splendor", slug: "splendor", minPlayers: 2, maxPlayers: 4, playTimeMinutes: 30, description: "Renaissance merchants collecting gems and cards." },
  { name: "7 Wonders", slug: "7-wonders", minPlayers: 3, maxPlayers: 7, playTimeMinutes: 30, description: "Draft cards to build an ancient civilization." },
  { name: "King of Tokyo", slug: "king-of-tokyo", minPlayers: 2, maxPlayers: 6, playTimeMinutes: 30, description: "Monsters battle for control of Tokyo." },
  { name: "Love Letter", slug: "love-letter", minPlayers: 2, maxPlayers: 4, playTimeMinutes: 20, description: "Quick bluffing and deduction with a tiny deck." },
  { name: "The Crew", slug: "the-crew", minPlayers: 2, maxPlayers: 5, playTimeMinutes: 20, description: "Cooperative trick-taking space mission." },
  { name: "Root", slug: "root", minPlayers: 2, maxPlayers: 4, playTimeMinutes: 90, description: "Asymmetric woodland faction warfare." },
  { name: "Terraforming Mars", slug: "terraforming-mars", minPlayers: 1, maxPlayers: 5, playTimeMinutes: 120, description: "Corporations compete to make Mars habitable." },
  { name: "Spirit Island", slug: "spirit-island", minPlayers: 1, maxPlayers: 4, playTimeMinutes: 120, description: "Cooperative spirits defend an island from colonists." },
  { name: "Dixit", slug: "dixit", minPlayers: 3, maxPlayers: 8, playTimeMinutes: 30, description: "Creative storytelling with surreal art cards." },
  { name: "Hanabi", slug: "hanabi", minPlayers: 2, maxPlayers: 5, playTimeMinutes: 25, description: "Cooperative fireworks show with hidden cards." },
  { name: "Dominion", slug: "dominion", minPlayers: 2, maxPlayers: 4, playTimeMinutes: 30, description: "Deck-building classic with kingdom cards." },
  { name: "Betrayal at House on the Hill", slug: "betrayal-house-hill", minPlayers: 3, maxPlayers: 6, playTimeMinutes: 60, description: "Explore a haunted house until a scenario triggers." },
  { name: "Gloomhaven", slug: "gloomhaven", minPlayers: 1, maxPlayers: 4, playTimeMinutes: 120, description: "Legacy dungeon crawler with tactical combat." },
];

const penAndPaperGames = [
  { name: "Dungeons & Dragons 5e", slug: "dnd-5e", system: "D&D 5th Edition", description: "Fantasy adventure RPG — the modern classic." },
  { name: "Pathfinder 2e", slug: "pathfinder-2e", system: "Pathfinder 2nd Edition", description: "Crunchy fantasy with deep character options." },
  { name: "Call of Cthulhu", slug: "call-of-cthulhu", system: "Basic Roleplaying", description: "Investigators face cosmic horror." },
  { name: "Blades in the Dark", slug: "blades-in-the-dark", system: "Forged in the Dark", description: "Crew of scoundrels in a haunted industrial city." },
  { name: "Mothership", slug: "mothership", system: "Mothership", description: "Sci-fi horror in space — high tension." },
  { name: "Vampire: The Masquerade", slug: "vampire-masquerade", system: "Storyteller", description: "Personal horror among modern vampires." },
  { name: "Cyberpunk RED", slug: "cyberpunk-red", system: "Cyberpunk RED", description: "Neon dystopia and edgerunner missions." },
  { name: "Kids on Bikes", slug: "kids-on-bikes", system: "Powered by Kids", description: "Stranger Things vibes in a small town." },
  { name: "Monster of the Week", slug: "monster-of-the-week", system: "Powered by the Apocalypse", description: "Supernatural hunters with cinematic play." },
  { name: "Mausritter", slug: "mausritter", system: "OSR", description: "Brave mice explore a big dangerous world." },
  { name: "Ironsworn", slug: "ironsworn", system: "Ironsworn", description: "Solo or coop dark fantasy vows and journeys." },
  { name: "FATE Core", slug: "fate-core", system: "FATE", description: "Narrative-focused system for any genre." },
  { name: "Shadowrun", slug: "shadowrun", system: "Shadowrun 6e", description: "Cyberpunk meets fantasy in the Sixth World." },
  { name: "Traveller", slug: "traveller", system: "Traveller", description: "Hard sci-fi sandbox among the stars." },
  { name: "One-shot / homebrew", slug: "one-shot-homebrew", system: "Varies", description: "Custom rules or a single-session adventure." },
];

async function main() {
  for (const game of boardGames) {
    await prisma.boardGame.upsert({
      where: { slug: game.slug },
      create: game,
      update: {
        name: game.name,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        playTimeMinutes: game.playTimeMinutes,
        description: game.description,
      },
    });
  }

  for (const game of penAndPaperGames) {
    await prisma.penAndPaperGame.upsert({
      where: { slug: game.slug },
      create: game,
      update: {
        name: game.name,
        system: game.system,
        description: game.description,
      },
    });
  }

  console.log(
    `Seeded ${boardGames.length} board games and ${penAndPaperGames.length} pen & paper systems.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

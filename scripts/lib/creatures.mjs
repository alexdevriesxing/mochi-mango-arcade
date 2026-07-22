// Creature nouns that fix a character's identity.
//
// Shared by every script that pairs a spritesheet with a game's mascot. Pairing
// on a shared given name or title alone produces Captain Corgi in a game called
// Captain Churro, or Merge Molly standing in for Cy Moth -- the mascot name is
// player-visible, so a species mismatch reads as plainly wrong art. When both
// names identify a creature and the creatures differ, the pairing is rejected
// no matter how well everything else scores.

export const CREATURES = [
  'corgi', 'pup', 'dog', 'puffin', 'penguin', 'pigeon', 'piggyfly', 'pig', 'monkey', 'monster',
  'bear', 'panda', 'koala', 'bunny', 'rabbit', 'hare', 'fox', 'raccoon', 'cat', 'neko', 'tiger',
  'lion', 'sloth', 'hamster', 'gerbil', 'mouse', 'mole', 'hedgehog', 'turtle', 'tortoise',
  'dragon', 'dino', 'gecko', 'lizard', 'newt', 'snail', 'crab', 'prawn', 'shrimp', 'octopus',
  'kraken', 'squid', 'dolphin', 'whale', 'duck', 'crane', 'crow', 'owl', 'parrot', 'flamingo',
  'frog', 'toad', 'llama', 'quokka', 'wombat', 'beetle', 'moth', 'firefly', 'bat', 'goblin',
  'knight', 'pirate', 'wizard', 'mage', 'ninja', 'pixie', 'golem', 'mecha', 'bot', 'robot',
  'yeti', 'starling', 'tern', 'otter', 'walrus', 'seal', 'cow', 'mooncow', 'horse', 'pegasus',
  'snake', 'serpent', 'viper', 'wolf', 'deer', 'sheep', 'lamb', 'goat', 'ape', 'gorilla',
  'axolotl', 'katydid', 'marmoset', 'pika', 'cassowary', 'gerbil', 'toad', 'moth', 'viper',
];

/** The creature a name identifies, or null when it names none. */
export function creatureOf(tokens) {
  return tokens.find((t) => CREATURES.includes(t)) || null;
}

/** False when both names name a creature and those creatures disagree. */
export function speciesCompatible(aTokens, bTokens) {
  const a = creatureOf(aTokens), b = creatureOf(bTokens);
  return !(a && b && a !== b);
}

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public', 'assets', 'data');
const gamesPath = path.join(dataDir, 'games.json');
const productsPath = path.join(dataDir, 'products.json');

// Read games
let games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));

// Assign hero images to games (skip hero-002 which is the Super Sean plush)
// hero-001 goes to game 1, hero-003 to game 2, hero-004 to game 3, etc.
let heroIdx = 1;
games.forEach((g, i) => {
  // Skip hero-002 (the plush)
  if (heroIdx === 2) heroIdx = 3;
  let heroName = `hero-${String(heroIdx).padStart(3, '0')}.jpg`;
  g.image = `/assets/images/games/${heroName}`;
  g.built = true;
  heroIdx++;
});

fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2));
console.log(`Updated ${games.length} games with hero images`);

// Add Super Sean plush to products
let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
let superSeanExists = products.find(p => p.id === 'super-sean-plush');
if (!superSeanExists) {
  products.push({
    id: 'super-sean-plush',
    name: 'Super Sean Plush',
    type: 'Plushies',
    character: 'Sean',
    price: 29.99,
    tag: 'Limited',
    description: 'Super Sean Plush official Mochi Mango Arcade collectible. A brave little hero plush with cape and star emblem!',
    image: '/assets/images/products/super-sean-plush.jpg'
  });
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
  console.log('Added Super Sean Plush to products');
} else {
  console.log('Super Sean Plush already exists');
}

console.log('Done!');

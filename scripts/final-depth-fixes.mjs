import fs from 'node:fs';

const appPath='public/assets/js/app.js';
let app=fs.readFileSync(appPath,'utf8');
app=app.replace(
  "if(!visible){try{activeGame?.destroy?.()}catch{}activeGame=quality.startFallback(stage,g)}",
  "if(!visible){try{activeGame?.destroy?.()}catch{}activeGame=quality.startFallback(stage,g);activeGame=campaign.enhanceCampaign(stage,g,activeGame)||activeGame}"
);
if(!app.includes("activeGame=quality.startFallback(stage,g);activeGame=campaign.enhanceCampaign(stage,g,activeGame)||activeGame"))throw new Error('Fallback campaign patch failed');
fs.writeFileSync(appPath,app);

const campaignPath='public/assets/js/game-campaign.js';
let campaign=fs.readFileSync(campaignPath,'utf8');
campaign=campaign.replace(
  "const modifiers = modifiersFor(game);\n  const progress",
  "const modifiers = modifiersFor(game);\n  const chapters = chaptersFor(game);\n  const progress"
);
campaign=campaign.replace(
  "const target = targetFor(state, dailyActive);\n    objective.textContent",
  "const target = targetFor(state, dailyActive);\n    panel.querySelector('[data-campaign-title]').textContent = `Chapter ${state.chapter}: ${chapters[state.chapter - 1]}`;\n    panel.querySelector('[data-campaign-xp]').textContent = `${state.xp} XP`;\n    panel.querySelector('[data-campaign-tokens]').textContent = `◆ ${state.tokens}`;\n    panel.querySelector('[data-campaign-medals]').textContent = `🏅 ${state.medals}`;\n    panel.querySelector('.mma-campaign-chapters').innerHTML = chapters.map((chapter,index)=>`<li class=\"${index + 1 < state.chapter || state.finished ? 'complete' : index + 1 === state.chapter ? 'active' : ''}\"><span>${index + 1}</span>${chapter}</li>`).join('');\n    objective.textContent"
);
campaign=campaign.replace(
  "if (baseOver) instance.showOver = (...args) => {\n    currentScore",
  "if (baseOver) instance.showOver = (...args) => {\n    const wasDaily = dailyActive;\n    currentScore"
);
campaign=campaign.replace(
  "saveState(game, state);\n    }\n    const result = baseOver(...args);",
  "saveState(game, state);\n      refresh();\n    }\n    const result = baseOver(...args);"
);
campaign=campaign.replace(
  "Boolean(state.dailyComplete && state.dailyDate === todayKey())",
  "wasDaily"
);
for(const marker of ["const chapters = chaptersFor(game);","const wasDaily = dailyActive;","panel.querySelector('[data-campaign-xp]')"]){if(!campaign.includes(marker))throw new Error(`Campaign polish failed: ${marker}`)}
fs.writeFileSync(campaignPath,campaign);
console.log('Applied final campaign polish.');

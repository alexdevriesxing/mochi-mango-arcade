/**
 * Mochi Mango Arcade SDK
 * A premium, self-contained SDK for Mochi Mango Arcade games.
 * Handles rewarded ads, portal communication, and game state reporting.
 */

(function() {
  if (window.MochiMangoSDK) return;

  // CSS injection for the ad overlay (highly polished glassmorphic UI)
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');

    .mma-ad-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(8, 6, 12, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
      opacity: 0;
      transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .mma-ad-overlay.is-active {
      opacity: 1;
    }
    .mma-ad-card {
      background: linear-gradient(135deg, rgba(30, 27, 46, 0.9) 0%, rgba(20, 16, 32, 0.95) 100%);
      border: 1px solid rgba(255, 159, 63, 0.35);
      border-radius: 24px;
      padding: 32px;
      width: 90%;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 159, 63, 0.15);
      transform: scale(0.9);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
    }
    .mma-ad-overlay.is-active .mma-ad-card {
      transform: scale(1);
    }
    .mma-ad-card::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 159, 63, 0.08) 0%, transparent 70%);
      pointer-events: none;
      animation: mma-glow-spin 12s linear infinite;
    }
    @keyframes mma-glow-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .mma-ad-badge {
      display: inline-block;
      background: rgba(255, 159, 63, 0.15);
      border: 1px solid rgba(255, 159, 63, 0.4);
      color: #ff9f3f;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 6px 14px;
      border-radius: 12px;
      font-weight: 800;
      margin-bottom: 20px;
    }
    .mma-ad-title {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #fff 30%, #ffc078 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .mma-ad-desc {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .mma-ad-visual {
      background: rgba(10, 8, 16, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      height: 160px;
      margin-bottom: 24px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .mma-ad-visual-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, #2e1065 0%, #090514 100%);
      z-index: 1;
    }
    .mma-ad-particles {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 2;
    }
    .mma-ad-demo-game {
      z-index: 3;
      text-align: center;
      animation: mma-bounce-item 2s infinite ease-in-out;
    }
    @keyframes mma-bounce-item {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-10px) scale(1.05); }
    }
    .mma-ad-demo-title {
      font-size: 18px;
      font-weight: 800;
      color: #ffd166;
      margin-top: 8px;
      text-shadow: 0 0 10px rgba(253, 224, 71, 0.4);
    }
    .mma-ad-progress-container {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
    }
    .mma-ad-progress-svg {
      transform: rotate(-90deg);
      width: 80px;
      height: 80px;
    }
    .mma-ad-progress-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.05);
      stroke-width: 6;
    }
    .mma-ad-progress-bar {
      fill: none;
      stroke: #ff9f3f;
      stroke-width: 6;
      stroke-linecap: round;
      stroke-dasharray: 226;
      stroke-dashoffset: 226;
      transition: stroke-dashoffset 0.1s linear;
    }
    .mma-ad-timer {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 22px;
      font-weight: 800;
      color: #fff;
    }
    .mma-ad-status-text {
      font-size: 13px;
      color: #ffb86c;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .mma-ad-skip-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #94a3b8;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      z-index: 10;
      opacity: 0;
      pointer-events: none;
    }
    .mma-ad-skip-btn.is-visible {
      opacity: 1;
      pointer-events: auto;
    }
    .mma-ad-skip-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
      color: #f87171;
    }
    
    /* Confirmation Overlay */
    .mma-confirm-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 7, 16, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
      z-index: 20;
      border-radius: 24px;
    }
    .mma-confirm-overlay.is-active {
      opacity: 1;
      pointer-events: auto;
    }
    .mma-confirm-title {
      font-size: 18px;
      font-weight: 800;
      color: #ef4444;
      margin-bottom: 8px;
    }
    .mma-confirm-desc {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .mma-confirm-actions {
      display: flex;
      gap: 12px;
      width: 100%;
    }
    .mma-confirm-btn {
      flex: 1;
      border: none;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .mma-confirm-btn--keep {
      background: #ff9f3f;
      color: #0c0a12;
    }
    .mma-confirm-btn--keep:hover {
      background: #ffb060;
      box-shadow: 0 0 12px rgba(255, 159, 63, 0.4);
    }
    .mma-confirm-btn--skip {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .mma-confirm-btn--skip:hover {
      background: rgba(239, 68, 68, 0.3);
    }
  `;
  document.head.appendChild(style);

  // Audio utility for retro synthesized sound effects
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'tick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'success') {
        osc.type = 'triangle';
        // Major chord arpeggio
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.setValueAtTime(392.00, now + 0.08); // G4
        osc.frequency.setValueAtTime(523.25, now + 0.16); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.24); // E5

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.setValueAtTime(0.06, now + 0.24);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.55);
      } else if (type === 'cancel') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
        
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  }

  // Particle animation helper for the ad visual
  function drawParticles(canvas) {
    const ctx = canvas.getContext('2d');
    const particles = [];
    const count = 25;
    
    // Resize canvas
    canvas.width = canvas.parentElement.clientWidth || 400;
    canvas.height = canvas.parentElement.clientHeight || 160;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        speedY: -(Math.random() * 0.5 + 0.2),
        color: `rgba(255, 159, 63, ${Math.random() * 0.4 + 0.1})`
      });
    }

    let animationId;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        p.y += p.speedY;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
      });
      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => cancelAnimationFrame(animationId);
  }

  // The SDK Object
  const MochiMangoSDK = {
    showRewardedAd: function({ game, reason }) {
      console.log(`[Mochi Mango SDK] Rewarded ad requested. Game: ${game}, Reason: ${reason}`);

      const rewardHost = window.parent && window.parent !== window ? window.parent : window;
      if (rewardHost.MochiMangoRewards && typeof rewardHost.MochiMangoRewards.request === 'function') {
        return new Promise((resolve) => {
          let settled = false;
          const finish = (value) => { if (!settled) { settled = true; resolve(value); } };
          const accepted = rewardHost.MochiMangoRewards.request({
            slug: game === 'puddle-and-pip-meadow-dash' ? 'puddle-pip-meadow-dash' : game,
            source: reason || 'iframe-game',
            onRewardGranted: () => finish(true),
            onRewardFailed: () => finish(false),
          });
          if (!accepted) finish(false);
        });
      }

      return new Promise((resolve) => {
        // Create elements
        const overlay = document.createElement('div');
        overlay.className = 'mma-ad-overlay';

        // Select a sponsor/recommended game dynamically
        const adCampaigns = [
          { name: "Mango Bounce", type: "game", desc: "Keep the mango flying! A hyper-addictive physics puzzle." },
          { name: "Cloudflare Pages", type: "tech", desc: "Deploy your websites at lighting speed across the globe." },
          { name: "Dragon Run", type: "game", desc: "Dodge the fiery obstacles in this legendary pixel art platformer." }
        ];
        const campaign = adCampaigns[Math.floor(Math.random() * adCampaigns.length)];

        overlay.innerHTML = `
          <div class="mma-ad-card">
            <button class="mma-ad-skip-btn">Skip</button>
            <span class="mma-ad-badge">Sponsored Advertisement</span>
            
            <div class="mma-ad-visual">
              <div class="mma-ad-visual-bg"></div>
              <canvas class="mma-ad-particles"></canvas>
              <div class="mma-ad-demo-game">
                ${campaign.type === 'game' 
                  ? `<span style="font-size: 32px;">🎮</span>` 
                  : `<span style="font-size: 32px;">⚡</span>`}
                <div class="mma-ad-demo-title">${campaign.name}</div>
              </div>
            </div>

            <h2 class="mma-ad-title">Ad Playing...</h2>
            <p class="mma-ad-desc">${campaign.desc}</p>
            
            <div class="mma-ad-progress-container">
              <svg class="mma-ad-progress-svg">
                <circle class="mma-ad-progress-bg" cx="40" cy="40" r="36"></circle>
                <circle class="mma-ad-progress-bar" cx="40" cy="40" r="36"></circle>
              </svg>
              <div class="mma-ad-timer">5</div>
            </div>
            <div class="mma-ad-status-text">Hold on for your reward...</div>

            <!-- Confirmation Overlay -->
            <div class="mma-confirm-overlay">
              <div class="mma-confirm-title">Skip Ad?</div>
              <p class="mma-confirm-desc">Skipping this ad will forfeit your reward (revive). Keep watching to continue your run!</p>
              <div class="mma-confirm-actions">
                <button class="mma-confirm-btn mma-confirm-btn--keep">Keep Watching</button>
                <button class="mma-confirm-btn mma-confirm-btn--skip">Skip & Forfeit</button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);

        // Access elements
        const canvas = overlay.querySelector('.mma-ad-particles');
        const progressBar = overlay.querySelector('.mma-ad-progress-bar');
        const timerText = overlay.querySelector('.mma-ad-timer');
        const skipBtn = overlay.querySelector('.mma-ad-skip-btn');
        const statusText = overlay.querySelector('.mma-ad-status-text');
        const titleText = overlay.querySelector('.mma-ad-title');
        
        // Confirmation elements
        const confirmOverlay = overlay.querySelector('.mma-confirm-overlay');
        const keepWatchingBtn = overlay.querySelector('.mma-confirm-btn--keep');
        const skipForfeitBtn = overlay.querySelector('.mma-confirm-btn--skip');

        // Start particle animations
        const stopParticles = drawParticles(canvas);

        // Trigger transition
        setTimeout(() => overlay.classList.add('is-active'), 50);

        let count = 5;
        let elapsed = 0;
        const totalDuration = 5000; // 5 seconds
        const step = 100; // update progress every 100ms
        let isPaused = false;
        let adCompleted = false;

        // Animate progress circle
        const totalDash = 226; // 2 * PI * r (36)
        progressBar.style.strokeDashoffset = totalDash;

        function updateAd() {
          if (adCompleted || isPaused) return;

          elapsed += step;
          const ratio = Math.min(elapsed / totalDuration, 1);
          progressBar.style.strokeDashoffset = totalDash - (ratio * totalDash);

          const currentTimer = Math.max(5 - Math.floor(elapsed / 1000), 0);
          if (timerText.textContent !== String(currentTimer) && currentTimer > 0) {
            timerText.textContent = currentTimer;
            playSound('tick');
          }

          // Show skip button after 1.5 seconds
          if (elapsed >= 1500) {
            skipBtn.classList.add('is-visible');
          }

          if (elapsed >= totalDuration) {
            completeAd();
          } else {
            setTimeout(updateAd, step);
          }
        }

        // Start progress
        updateAd();

        function completeAd() {
          adCompleted = true;
          titleText.textContent = "Reward Unlocked!";
          statusText.textContent = "Loading game...";
          timerText.innerHTML = "✔";
          timerText.style.color = "#10b981";
          progressBar.style.stroke = "#10b981";
          
          skipBtn.classList.remove('is-visible');
          
          playSound('success');

          // Hold success state momentarily, then resolve
          setTimeout(() => {
            closeOverlay(true);
          }, 1000);
        }

        function closeOverlay(rewardEarned) {
          stopParticles();
          overlay.classList.remove('is-active');
          setTimeout(() => {
            overlay.remove();
            resolve(rewardEarned);
          }, 400);
        }

        // Event Listeners
        skipBtn.addEventListener('click', () => {
          isPaused = true;
          playSound('tick');
          confirmOverlay.classList.add('is-active');
        });

        keepWatchingBtn.addEventListener('click', () => {
          isPaused = false;
          confirmOverlay.classList.remove('is-active');
          playSound('tick');
          updateAd(); // resume
        });

        skipForfeitBtn.addEventListener('click', () => {
          playSound('cancel');
          closeOverlay(false); // resolve with false
        });
      });
    }
  };

  window.MochiMangoSDK = MochiMangoSDK;
})();

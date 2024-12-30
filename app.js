/************************************************
 * app.js — Mobile-Friendly & Efficient
 ************************************************/

// -------------------------
// Global Variables
// -------------------------
let canvas, ctx;
let w, h;
let displayActive = false;   // True during fireworks display
let gravity = 0.06;
let friction = 0.98;

// For dynamic letter-based fireworks
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let startFireworksTime = 0;
let lastLaunchTime = 0;
let rockets = [];
let explosions = [];

// Audio objects
const newYearAudio = new Audio('newYearAudio.ogg');
const loopAudio = new Audio('loopAudio.ogg');
loopAudio.loop = true;
newYearAudio.preload = 'auto';
loopAudio.preload = 'auto';

/************************************************
 * 1. Document Load & Initial Setup
 ************************************************/
document.addEventListener('DOMContentLoaded', () => {
  // If you want the name from ?n= in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const senderName = urlParams.get('n') || 'Sender';
  
  // Initialize the header text with the name
  const headerElement = document.querySelector('#container1 .header h1');
  if (headerElement) {
    headerElement.textContent = `${senderName}!`;
  }

  // Fade in the container1
  const container1 = document.getElementById('container1');
  container1.style.opacity = '1';

  // Attach the click event for the “View My Surprise” button
  $('#container1').on('click', () => {
    // Remove container1, start the countdown
    container1.remove();
    runCountdown();
  });
});

/************************************************
 * 2. Countdown & Fireworks Trigger
 ************************************************/
function runCountdown() {
  playCountdownAudio();

  let counter = 3;
  function displayCountdown() {
    if (counter > 0) {
      const countdown = $('<div id="countdown">' + counter + '</div>');
      countdown.appendTo($('.container'));
      // Animate the countdown number
      countdown.css({ animation: 'countdownZoom 0.8s ease-in-out forwards' });
      countdown.on('animationend', () => {
        countdown.remove();
        counter--;
        displayCountdown();
      });
    } else {
      // Once countdown is done
      startAudioSequence();
      displayActive = true;
      showGreeting();      // Show final greeting
      startTwinklingStars(); // Start star blinking
      startMainFireworks();  // Start fireworks
       
    }
  }
  displayCountdown();
}

/************************************************
 * 3. Audio Handling
 ************************************************/
function playCountdownAudio() {
  try {
    const countdownAudio = new Audio('countdownAudio.ogg');
    countdownAudio.volume = 1.0;
    countdownAudio.play().catch(err => {
      console.warn('Failed to play countdown audio:', err);
    });
  } catch (error) {
    console.warn('Countdown audio not found.');
  }
}

function startAudioSequence() {
  newYearAudio.play().catch(err => {
    console.warn('Failed to play newYearAudio:', err);
  });

  newYearAudio.addEventListener('ended', () => {
    loopAudio.play().catch(err => {
      console.warn('Failed to play loopAudio:', err);
    });
    // Gently lower volume after a few seconds
    setTimeout(() => {
      loopAudio.volume = 0.25;
    }, 5000);
  });
}

function playSingleBlast() {
  // Optional: dynamically create new Audio each time or reuse a pool
  try {
    const explosionSound = new Audio('blast.ogg');
    explosionSound.currentTime = 0;
    explosionSound.volume = Math.random() * 0.7 + 0.2;
    explosionSound.play().catch(() => {/* ignore if fails */});
  } catch (e) {
    /* ignore error if audio not found */
  }
}

/************************************************
 * 4. Fireworks Logic
 ************************************************/
function startMainFireworks() {
  canvas = document.createElement('canvas');
  document.getElementById('fireworks').appendChild(canvas);
  ctx = canvas.getContext('2d');
  onResize(); // set w/h
  startFireworksTime = performance.now();
  lastLaunchTime = 0;
  requestAnimationFrame(render);
}

function render(timestamp) {
  requestAnimationFrame(render);
  // Semi-transparent fill to create fade effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, w, h);

  // Launch rockets at dynamic intervals
  if (displayActive) {
    const currentInterval = getDynamicInterval(timestamp);
    if (timestamp - lastLaunchTime > currentInterval) {
      const randomLetter = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      launchRocket(randomLetter);
      lastLaunchTime = timestamp;
    }
  }

  updateRockets();
  updateExplosions();
}

function getDynamicInterval(timestamp) {
  const minInterval = 1000;  // 1 second
  const maxInterval = 4000;  // 4 seconds
  const rampDuration = 60000; // 1 min to go from min to max

  const elapsed = timestamp - startFireworksTime;
  const fraction = Math.min(elapsed / rampDuration, 1);
  return minInterval + fraction * (maxInterval - minInterval);
}

function launchRocket(letter) {
  const startX = w * 0.2 + Math.random() * (w * 0.6);
  const startY = h;
  const vx = (Math.random() - 0.5) * 3;
  const vy = -(Math.random() * 5 + 3);
  const targetHeight = h * (0.4 + Math.random() * 0.2);
  const letterParticles = makeChar(letter);

  rockets.push({ x: startX, y: startY, vx, vy, targetHeight, letterParticles });
}

function updateRockets() {
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.vy += gravity;
    r.x += r.vx;
    r.y += r.vy;

    drawRocket(r);

    // If rocket slows down / reaches apex
    if (r.vy >= 0 || r.y < r.targetHeight) {
      createExplosion(r);
      rockets.splice(i, 1);
    }
  }
}

function drawRocket(r) {
  ctx.beginPath();
  ctx.fillStyle = '#fff';
  ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.moveTo(r.x, r.y);
  ctx.lineTo(r.x - r.vx * 5, r.y - r.vy * 5);
  ctx.stroke();
}

function createExplosion(rocket) {
  if (!displayActive) return;
  playSingleBlast();
  const hue = Math.floor(Math.random() * 360);

  rocket.letterParticles.forEach(pt => {
    const scale = 0.8 + Math.random() * 0.4;
    const offsetX = pt[0] * scale;
    const offsetY = pt[1] * scale;

    const angle = Math.atan2(offsetY, offsetX);
    const speed = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    explosions.push({
      x: rocket.x,
      y: rocket.y,
      vx, vy,
      alpha: 1.0,
      color: `hsl(${hue}, 70%, 60%)`
    });
  });
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    p.vx *= friction;
    p.vy *= friction;
    p.vy += gravity;
    p.x += p.vx;
    p.y += p.vy;

    p.alpha -= 0.01;

    ctx.globalAlpha = Math.max(p.alpha, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    if (p.alpha <= 0) {
      explosions.splice(i, 1);
    }
  }
}

/************************************************
 * 5. Generate Letter Particles
 ************************************************/
function makeChar(c) {
  // Create a temp canvas for the character
  const tmp = document.createElement('canvas');
  const size = (window.innerWidth < 400 ? 200 : 300);
  tmp.width = size;
  tmp.height = size;
  const tmpCtx = tmp.getContext('2d');

  tmpCtx.font = `bold ${size}px Arial`;
  tmpCtx.fillStyle = '#fff';
  tmpCtx.textBaseline = 'middle';
  tmpCtx.textAlign = 'center';
  tmpCtx.fillText(c, size / 2, size / 2);

  const data = tmpCtx.getImageData(0, 0, size, size);
  const charParticles = [];
  let attempts = 0;
  while (charParticles.length < 80 && attempts < size * size) {
    attempts++;
    const x = Math.random() * size;
    const y = Math.random() * size;
    const offset = (Math.floor(y) * size + Math.floor(x)) * 4;
    // If pixel is > 128 means it's in the "text" area
    if (data.data[offset] > 128) {
      charParticles.push([x - size / 2, y - size / 2]);
    }
  }
  return charParticles;
}

/************************************************
 * 6. Greeting (after countdown)
 ************************************************/
function showGreeting() {
  const urlParams = new URLSearchParams(window.location.search);
  const nameParam = urlParams.get('n') || 'Your Friend';
  
  const greetingEl = document.getElementById('greeting');
  const userInputEl = document.getElementById('user-input');

  greetingEl.style.display = 'block';
  displayRandomQuote();
  displayRandomImage();
  displaySignature(nameParam);

  // Show user input field after some delay
  setTimeout(() => {
    userInputEl.style.display = 'flex';
  }, 3000);
}

/************************************************
 * 7. Twinkling Stars
 ************************************************/
function startTwinklingStars() {
  const sky = $('#space');
  // Lower star count for better mobile performance
  let amount = 200;

  for (let i = 0; i < amount; i++) {
    let s = $('<div class="star-blink"></div>');
    s.css({
      top: Math.random() * 100 + '%',
      left: Math.random() * 100 + '%',
      animationDelay: `${Math.random() * 50}s`,  // random start
      width: '14px',
      height: '14px',
      opacity: Math.random() * 0.5 + 0.5
    });

    if (i % 8 === 0) {
      s.addClass('red');
    } else if (i % 10 === 6) {
      s.addClass('blue');
    }
    sky.append(s);
  }
}

/************************************************
 * 8. Random Quotes & Images
 ************************************************/
const quotes = [
  "Wishing you a year of love, laughter, and happiness!",
  "May your dreams come true in 2025!",
  "May it be your best year yet!",
  "Wishing you peace, prosperity, and joy in 2025",
  "May the New Year bring you success and fulfillment!",
  "Here's to a year of new beginnings and endless possibilities!",
  "Wishing you a year filled with friendship, love, and adventure!",
  "May the New Year bring you courage, strength, and happiness!",
  "Wishing you a year of growth, learning, and self-discovery!",
  "May your New Year be bright, beautiful, and blessed!"
];

const images = [
  'https://cdn.pixabay.com/animation/2024/11/28/12/37/12-37-07-324_512.gif',
  'https://cdn.pixabay.com/animation/2024/12/07/21/56/21-56-57-850_512.gif',
  'https://cdn.pixabay.com/animation/2024/12/07/00/22/00-22-10-204_512.gif',
  'https://cdn.pixabay.com/animation/2024/09/02/08/29/08-29-52-859_512.gif',
  'https://cdn.pixabay.com/animation/2024/12/08/20/56/20-56-17-941_512.gif',
  'https://i.giphy.com/0n8j4zs6xhA6HuxDmQ.webp',
  'https://c.tenor.com/dVvlG5ueVjoAAAAC/tenor.gif',
  'https://data.textstudio.com/output/sample/animated/8/9/4/4/2025-10-14498.gif'
];

function displayRandomQuote() {
  const quoteEl = document.getElementById('quote');
  const randomIndex = Math.floor(Math.random() * quotes.length);
  quoteEl.textContent = `"${quotes[randomIndex]}"`;
}

function displayRandomImage() {
  const imageEl = document.getElementById('image');
  const randomIndex = Math.floor(Math.random() * images.length);
  imageEl.src = images[randomIndex];
  imageEl.alt = "Celebration Image";
}

function displaySignature(name) {
  const signatureEl = document.getElementById('signature');
  name = name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  signatureEl.textContent = `— ${name}`;
}

/************************************************
 * 9. Resize Fireworks Canvas
 ************************************************/
function onResize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', () => {
  if (canvas) onResize();
});

/************************************************
 * 10. Redirect Logic (for share link, etc.)
 ************************************************/
function redirect() {
  const nameInput = document.getElementById('name').value;
  if (nameInput.trim()) {
    // e.g., redirect to share.html?str1=...
    window.location.href = `share.html?str1=${encodeURIComponent(nameInput)}`;
  } else {
    alert('Please enter a name before submitting!');
  }
}

/* ======================
   GLOBAL STYLE
====================== */
/* ===== DEVICE DETECT & SCALE (ADD AT TOP) ===== */

let IS_MOBILE = true; // Forceer mobiel voor test
let SCALE_FACTOR = 1;

/* ===== SAFE CURSOR (NO p5 dependency) ===== */
let showHandCursor = false;

const style = document.createElement('style');
style.textContent = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: #0e1621;
  font-family: Arial, sans-serif;
  padding: 10px 10px 50px;
}

button {
  height: 38px;
  cursor: pointer;
  transition: transform .2s ease, opacity .2s ease;
}

button:hover { transform: scale(1.15); }
button:active { transform: scale(0.95); }

.nav {
  display: flex;
  gap: 5px;
  padding: 5px;
  flex-wrap: nowrap;
  justify-content: center;
  position: relative;
  z-index: 1000;
  width: 100%;
  overflow-x: auto;
}

.nav a {
  color: white;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,.15);
  font-weight: bold;
  font-size: 17px;      
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 40px;
  text-align: center;
}
.nav a:hover { background: rgba(255,255,255,.5); }

@media (max-width: 768px) {
  body {
    padding: 2px 2px 20px;
  }
  
  .nav {
    gap: 3px;
    padding: 3px;
    margin-bottom: 5px;
  }
  
  .nav a {
    padding: 4px 6px;
    font-size: 10px;
  }
}
`;
document.head.appendChild(style);

/* viewport */
let meta = document.querySelector('meta[name="viewport"]');
if (!meta) {
  meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
  document.head.appendChild(meta);
} else {
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
}
function setCursor(type) {
  document.body.style.cursor = type;
}

/* =====================================
   NAVIGATIEBALK INSTELLEN
===================================== */

function createNavigation() {
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = `
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/" ontouchstart="">🏠 Home</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/rekenen.html" ontouchstart="">➗ Rekenen</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas1.html" ontouchstart="">📘 Klas 1</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas2.html" ontouchstart="">📗 Klas 2</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas3.html" ontouchstart="">📙 Klas 3</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/overig.html" ontouchstart="">🎓 Overig</a>
  `;
  document.body.prepend(nav);
  
  setTimeout(() => {
    nav.querySelectorAll('a').forEach(link => {
      link.style.pointerEvents = 'auto';
      link.style.touchAction = 'manipulation';
      link.addEventListener('touchend', (e) => {
        e.stopPropagation();
        window.location.href = link.href;
      }, { passive: false });
    });
  }, 100);
}

// SPATIE BLOKKERING 
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.keyCode === 32) {
        if (showDinoGame && dinoGame && !dinoGame.gameOver) {
            e.preventDefault();
            e.stopPropagation();
            dinoGame.dino.jump();
        } else if (showDinoGame && dinoGame && dinoGame.gameOver) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}, true);


/* =====================================
   GRID & LAYOUT INSTELLINGEN
===================================== */

// =====================================================
// INTERPOLATIE TABEL INSTELLINGEN
// Elke "vraag" is een tabel met 2 rijen en 3 kolommen:
//   Rij 1 (x-waarden): x0 | x1 | x2
//   Rij 2 (y-waarden): y0 | y1 | y2
// Één cel is '?' – de leerling moet dit invullen door
// het juiste antwoordblokje erheen te slepen.
// =====================================================

// Grid
const COLS = 5;
const ROWS = 5;
const CELL_SIZE = 140;
const MARGIN = 200;

const TITLE_SPACE = -200;
const BUTTON_HEIGHT = 40;

// TITEL INSTELLINGEN
const TITLE_TEXT = 'Summon the Dragon';
const TITLE_LINK = 'https://r-van-kessel.github.io/Summon_the_Dragon/index.html';
const TITLE_SIZE = 30;
const TITLE_COLOR = [255, 200, 100];
const TITLE_Y = 30;

// ONDERTITEL INSTELLINGEN
const SUBTITLE_TEXT = 'Vind het ontbrekende getal (interpoleren/extrapoleren) om de draak op te roepen!';
const SUBTITLE_SIZE = 13;
const SUBTITLE_COLOR = [255, 200, 100];
const SUBTITLE_Y = 70;

const DINO_ZONE = {
    xRatio: 0.98,   
    yRatio: 0.47,   
    wRatio: 0.01,   
    hRatio: 0.01    
};

// DRAAK ACHTERGROND INSTELLINGEN
const DRAGON_SCALE_X = 0.9;
const DRAGON_SCALE_Y = 0.9;
const DRAGON_X_OFFSET = 50;
const DRAGON_Y_OFFSET = -80;
const DRAGON_OPACITY = 250;
const DRAGON_BLUR = true;

// ============================================

// =====================================================
// DATA STRUCTUUR VOOR INTERPOLATIE VRAGEN
// questions[] bevat objecten met:
//   tableData: 2D array [2][3] met waarden of null (= vraagteken)
//   answer: het correcte antwoord (1 decimaal)
//   questionPos: {row, col} positie van het vraagteken in de tabel
// =====================================================
let questions = [];   // Interpolatie-vraag objecten
let answers = [];     // Antwoordblokken (shuffled)
let blocks = [];      // Draggable blokken (vragen + antwoorden)

let draggingBlock = null;
let offsetX = 0;
let offsetY = 0;

let canvasButtons = [];

let isChecked = false;
let correctCount = 0;
let isFlashing = false;
let flashCounter = 0;

let dinoGame = null;
let showDinoGame = false;
let totalGamesPlayed = 0;
let dinoGameCount = 0;
let dinoImage = null;
let backgroundImage = null;
let bgLoaded = false;

// =====================================================
// HELPER: rond af op 1 decimaal
// =====================================================
function round1(val) {
  return Math.round(val * 10) / 10;
}

// =====================================================
// GENEREER ÉÉN INTERPOLATIE/EXTRAPOLATIE VRAAG
// Strategie:
//   1. Kies willekeurig een start x0 en stapgrootte dx
//   2. x1 = x0 + dx, x2 = x0 + 2*dx  (of extrapolatie: x2 = x0 - dx)
//   3. Kies lineaire functie: y = a*x + b  (a, b willekeurig)
//   4. Bereken y0, y1, y2
//   5. Kies willekeurig welke cel '?' wordt (niet alleen y-waarden)
// =====================================================
function generateInterpolationQuestion() {
  // Willekeurige stapgrootte met decimalen (moeilijker!)
  let dxOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 7.5, 10, 12.5, 15];
  let dx = dxOptions[floor(random(dxOptions.length))];
  
  // Startpunt x0 (grote getallen: 10 t/m 100, met decimalen)
  let x0 = round1(random(10, 100));
  let x1, x2;
  
  // 70% interpolatie, 30% extrapolatie
  let isExtrapolation = random() < 0.3;
  
  if (isExtrapolation) {
    // Extrapolatie: x2 buiten het bekende bereik
    x1 = round1(x0 + dx);
    x2 = round1(x0 + 2 * dx);
  } else {
    // Interpolatie: x1 ligt tussen x0 en x2
    x1 = round1(x0 + dx);
    x2 = round1(x0 + 2 * dx);
  }
  
  // Lineaire coëfficiënten (a = helling, b = snijpunt)
  // a: veel meer decimalen en grotere waarden
  let aOptions = [0.3, 0.7, 0.9, 1.2, 1.4, 1.6, 1.8, 2.1, 2.3, 2.7, 3.2, 3.8, 4.5, 5.2, -0.4, -0.8, -1.3, -1.7, -2.4, -3.1];
  let a = aOptions[floor(random(aOptions.length))];
  let b = round1(random(-50, 100));   // b: -50 t/m 100 (ook negatief!)
  
  // Bereken y-waarden
  let y0 = round1(a * x0 + b);
  let y1 = round1(a * x1 + b);
  let y2 = round1(a * x2 + b);
  
  // Tabel: rij 0 = x-rij, rij 1 = y-rij
  // Kolommen: 0=linker, 1=midden, 2=rechter
  let tableX = [x0, x1, x2];
  let tableY = [y0, y1, y2];
  
  // Kies welke cel '?' wordt
  // Mogelijkheden: y0, y1 of y2 (de x-rij tonen we altijd volledig)
  // Bij extrapolatie bij voorkeur y2
  let questionColY;
  if (isExtrapolation) {
    questionColY = 2;  // altijd de buitenste waarde bij extrapolatie
  } else {
    // Interpolatie: y0, y1 of y2 – maar y1 (midden) is klassieke interpolatie
    questionColY = floor(random(3));
  }
  
  let answer = tableY[questionColY];
  
  // Zorg dat het antwoord uniek genoeg is (geen 0 of negatief voor lage klassen)
  // Probeer opnieuw als antwoord < 0 (kan soms bij negatieve a)
  if (answer < 0) {
    // Probeer opnieuw met positieve a
    a = Math.abs(a);
    y0 = round1(a * x0 + b);
    y1 = round1(a * x1 + b);
    y2 = round1(a * x2 + b);
    tableY = [y0, y1, y2];
    answer = round1(tableY[questionColY]);
  }
  
  return {
    tableX: tableX,          // [x0, x1, x2]
    tableY: tableY,          // [y0, y1, y2] – compleet (voor interne check)
    questionColY: questionColY,  // welke y-kolom is '?'
    answer: answer,          // het correcte antwoord
    isExtrapolation: isExtrapolation,
    a: a,
    b: b
  };
}

// =====================================================
// CANVAS BUTTON CLASS
// =====================================================
class CanvasButton {
  constructor(x, y, w, h, label, color, action) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.color = color;
    this.action = action;
    this.hovered = false;
    this.hoverProgress = 0;
  }
  
  draw() {
    push();
    
    if (this.hoverProgress > 0) {
      let lift = -4 * this.hoverProgress;
      let scaleAmount = 1 + 0.10 * this.hoverProgress;
      
      translate(this.x + this.w / 2, this.y + this.h / 2 + lift);
      scale(scaleAmount);
      translate(-this.w / 2, -this.h / 2);
      
      drawingContext.shadowBlur = 15 * this.hoverProgress;
      drawingContext.shadowColor = 'rgba(0,0,0,0.4)';
      drawingContext.shadowOffsetY = 3 * this.hoverProgress;
    }
    
    if (this.hoverProgress > 0) {
      let brighten = 30 * this.hoverProgress;
      fill(
        red(this.color) + brighten, 
        green(this.color) + brighten, 
        blue(this.color) + brighten
      );
    } else {
      fill(this.color);
    }
    
    noStroke();
    
    if (this.hoverProgress > 0) {
      rect(0, 0, this.w, this.h, 8);
    } else {
      rect(this.x, this.y, this.w, this.h, 8);
    }
    
    drawingContext.shadowBlur = 0;
    drawingContext.shadowOffsetY = 0;
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(IS_MOBILE ? 12 : 16);
    textStyle(BOLD);
    
    if (this.hoverProgress > 0) {
      text(this.label, this.w / 2, this.h / 2);
    } else {
      text(this.label, this.x + this.w / 2, this.y + this.h / 2);
    }
    
    pop();
  }
  
  isClicked(mx, my) {
    return mx > this.x && mx < this.x + this.w && 
           my > this.y && my < this.y + this.h;
  }
  
  checkHover(mx, my) {
    this.hovered = this.isClicked(mx, my);
    const target = this.hovered ? 1 : 0;
    this.hoverProgress = lerp(this.hoverProgress, target, 0.15);
  }
}

// =====================================================
// DINO / GAME CLASSES (ongewijzigd)
// =====================================================
class Dino {
  constructor() {
    this.x = MARGIN + (COLS * CELL_SIZE) / 4;
    this.y = 0;
    this.width = 50;
    this.height = 53;
    this.vy = 0;
    this.gravity = 0.8;
    this.jumpPower = -15;
    this.onGround = true;
    this.onPlatform = false;
    this.legFrame = 0;
    this.invincible = false;
    this.invincibleUntil = 0;
    this.invincibleDuration = 3000;
    this.invincibleFlickerSpeed = 100;
  }

  activateInvincible() {
    this.invincible = true;
    this.invincibleUntil = millis() + this.invincibleDuration;
  }

  update() {
    if (this.invincible && millis() > this.invincibleUntil) {
      this.invincible = false;
    }
    this.vy += this.gravity;
    this.y += this.vy;
    if (this.y >= 0 && !this.onPlatform) {
      this.y = 0;
      this.vy = 0;
      this.onGround = true;
    }
    if (this.y > 0) {
      this.onPlatform = false;
    }
    if (this.onGround && frameCount % 6 === 0) {
      this.legFrame = (this.legFrame + 1) % 2;
    }
  }

  jump() {
    if (this.onGround) {
      if (this.onPlatform) {
        this.vy = this.jumpPower * 1.2;
        this.onPlatform = false;
      } else {
        this.vy = this.jumpPower;
      }
      this.onGround = false;
    }
  }

  draw(gameY) {
    push();
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    let drawY = groundY + this.y;
    fill(0, 0, 0, 40);
    noStroke();
    ellipse(this.x + this.width / 2, drawY + this.height + 2, this.width * 0.6, 10); 
    let flickerOn = true;
    if (this.invincible) {
      flickerOn = (millis() % (this.invincibleFlickerSpeed * 2)) < this.invincibleFlickerSpeed;
    }
    if (flickerOn) {
      if (dinoImage) {
        imageMode(CORNER);
        image(dinoImage, this.x, drawY, this.width, this.height);
      } else {
        textAlign(CENTER, CENTER);
        textSize(this.height);
        text('🦖', this.x + this.width / 2, drawY + this.height / 2);
      }
    }
    pop();
  }

  getBottom(gameY) {
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    return groundY + this.y + this.height;
  }

  getTop(gameY) {
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    return groundY + this.y;
  }
}

class Orb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.collected = false;
  }

  update() {
    this.y += sin(frameCount * 0.1) * 0.5;
  }

  draw() {
    if (!this.collected) {
      push();
      translate(this.x, this.y);
      rotate(frameCount * 0.02);
      fill(34, 2, 97, 100);
      noStroke();
      beginShape();
      vertex(0, -this.radius * 1.3);
      vertex(this.radius * 0.8, 0);
      vertex(0, this.radius * 1.3);
      vertex(-this.radius * 0.8, 0);
      endShape(CLOSE);
      fill(7, 165, 255);
      stroke(0);
      strokeWeight(2);
      beginShape();
      vertex(0, -this.radius);
      vertex(this.radius * 0.6, 0);
      vertex(0, this.radius);
      vertex(-this.radius * 0.6, 0);
      endShape(CLOSE);
      fill(255, 255, 255, 180);
      noStroke();
      beginShape();
      vertex(0, -this.radius);
      vertex(this.radius * 0.3, -this.radius * 0.3);
      vertex(0, 0);
      vertex(-this.radius * 0.3, -this.radius * 0.3);
      endShape(CLOSE);
      fill(255, 255, 255, 200);
      ellipse(this.radius * 0.4, -this.radius * 0.4, 3);
      ellipse(-this.radius * 0.3, this.radius * 0.3, 2);
      pop();
    }
  }

  hits(dino, gameY) {
    let dinoBottom = dino.getBottom(gameY);
    let dinoTop = dino.getTop(gameY);
    let dinoRight = dino.x + dino.width;
    let dinoLeft = dino.x;
    let closestX = constrain(this.x, dinoLeft, dinoRight);
    let closestY = constrain(this.y, dinoTop, dinoBottom);
    let dx = this.x - closestX;
    let dy = this.y - closestY;
    return dx * dx + dy * dy < this.radius * this.radius;
  }
}

class Obstacle {
  constructor(type, xPos) {
    this.type = type;
    this.x = xPos;
    this.scored = false;
    if (type === 'low') {
      this.width = 100;
      this.height = 40;
      this.isPlatform = false;
    } else if (type === 'high') {
      this.width = 25;
      this.height = 80;
      this.isPlatform = false;
    } else {
      this.width = 150;
      this.height = 15;
      this.isPlatform = true;
      this.hasOrb = random() < 0.3;
      if (this.hasOrb) {
        let platformY = CELL_SIZE + 25;
        this.orb = new Orb(this.x + this.width * 1.5, platformY - 80);
      } else {
        this.orb = null;
      }
    }
  }

  update(speed) {
    this.x -= speed;
    if (this.orb) this.orb.x -= speed;
  }

  draw(gameY) {
    push();
    if (this.isPlatform) {
      fill(229, 244, 58);
      stroke(139, 69, 19);
      strokeWeight(2);
      let platformY = gameY + (CELL_SIZE + 25);
      rect(this.x, platformY, this.width, this.height, 4);
      if (this.orb && !this.orb.collected) {
        this.orb.y = platformY - 80;
        this.orb.draw();
      }
    } else {
      fill(231, 76, 60);
      noStroke();
      let obsY = gameY + (CELL_SIZE * 2) - this.height;
      rect(this.x, obsY, this.width, this.height);
    }
    pop();
  }

  hits(dino, gameY) {
    if (this.isPlatform) {
      let platformTop = gameY + CELL_SIZE + 25;
      let platformBottom = platformTop + this.height;
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);
      let horizontalOverlap = dino.x + dino.width > this.x && dino.x < this.x + this.width;
      if (dino.vy >= 0 && dinoBottom >= platformTop - 5 && dinoBottom <= platformTop + 5 && horizontalOverlap) {
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformTop - groundY;
        dino.vy = 0;
        dino.onGround = true;
        dino.onPlatform = true;
      }
      if (dino.vy < 0 && dinoTop <= platformBottom + 5 && dinoTop >= platformTop && horizontalOverlap) {
        dino.vy = 0;
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformBottom - groundY;
      }
      if (this.hasOrb && !this.orb.collected) {
        if (this.orb.hits(dino, gameY)) {
          this.orb.collected = true;
          dino.activateInvincible();
        }
      }
      return false;
    } else {
      let obsTop = gameY + (CELL_SIZE * 2) - this.height;
      let obsBottom = gameY + (CELL_SIZE * 2);
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);
      if (dino.x + dino.width > this.x && dino.x < this.x + this.width && dinoBottom > obsTop && dinoTop < obsBottom) {
        return true;
      }
    }
    return false;
  }

  isOffScreen() {
    return this.x + this.width < MARGIN;
  }
}

class DinoGame {
  constructor() {
    this.dino = new Dino();
    this.obstacles = [];
    this.gameOver = false;
    this.score = 0;
    this.gameSpeed = 6;
    this.spawnTimer = 0;
    this.gamesPlayed = 0;
    this.maxGames = 3;
    this.gameOverTimer = 0;
  }

  reset() {
    this.dino = new Dino();
    this.obstacles = [];
    this.spawnTimer = 0;
    this.gameOver = false;
    this.gameOverTimer = 0;
    if (this.gamesPlayed >= this.maxGames) {
      this.score = 0;
      this.gameSpeed = 6;
      this.gamesPlayed = 0;
    }
  }

  spawnObstacles() {
    let rand = random();
    if (rand < 0.4) {
      this.obstacles.push(new Obstacle('low', MARGIN + COLS * CELL_SIZE));
    } else if (rand < 0.7) {
      this.obstacles.push(new Obstacle('high', MARGIN + COLS * CELL_SIZE));
    } else {
      let platform = new Obstacle('platform', MARGIN + COLS * CELL_SIZE);
      this.obstacles.push(platform);
      let followUp = new Obstacle(random() < 0.5 ? 'low' : 'high', MARGIN + COLS * CELL_SIZE + 250);
      this.obstacles.push(followUp);
    }
  }

  update(gameY) {
    if (this.gameOver) {
      this.gameOverTimer++;
      if (this.gameOverTimer >= 120) {
        if (this.gamesPlayed < this.maxGames) {
          this.reset();
        }
      }
      return;
    }
    this.dino.update();
    this.spawnTimer++;
    let spawnInterval = max(40, 80 - floor(this.score / 5) * 5);
    if (this.spawnTimer > spawnInterval) {
      this.spawnObstacles();
      this.spawnTimer = 0;
    }
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.update(this.gameSpeed);
      if (obs.isPlatform) {
        obs.hits(this.dino, gameY);
      }
      if (!obs.isPlatform && obs.hits(this.dino, gameY)) {
        if (!this.dino.invincible) {
          this.gameOver = true;
          this.gamesPlayed++;
          this.gameOverTimer = 0;
        }
      }
      if (!obs.scored && !obs.isPlatform && obs.x + obs.width < this.dino.x) {
        obs.scored = true;
        this.score++;
      }
      if (obs.isOffScreen()) {
        this.obstacles.splice(i, 1);
      }
    }
    if (frameCount % 180 === 0) {
      this.gameSpeed = min(this.gameSpeed + 0.5, 15);
    }
  }

  draw(gameY) {
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);
    drawingContext.clip();
    fill(135, 206, 235);
    noStroke();
    rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);
    fill(139, 69, 19);
    rect(MARGIN, gameY + (CELL_SIZE * 2) - 10, COLS * CELL_SIZE, 10);
    for (let obs of this.obstacles) {
      obs.draw(gameY);
    }
    this.dino.draw(gameY);
    drawingContext.restore();
    fill(51);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(16);
    textStyle(BOLD);
    text('Score: ' + this.score, MARGIN + 10, gameY + 10);
    textSize(14);
    textStyle(NORMAL);
    fill(85);
    text('Games: ' + this.gamesPlayed + '/' + this.maxGames, MARGIN + 10, gameY + 30);
    text('Speed: ' + nf(this.gameSpeed, 1, 1), MARGIN + 10, gameY + 50);
    if (this.gameOver) {
      fill(0, 0, 0, 180);
      rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(28);
      textStyle(BOLD);
      text('GAME OVER!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE - 20);
      textSize(18);
      textStyle(NORMAL);
      text('Score: ' + this.score, MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 10);
      text('Komt er nog een dragon?', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 35);
      if (this.gamesPlayed >= this.maxGames) {
        fill(243, 156, 18);
        textSize(18);
        textStyle(BOLD);
        text('Nee, klik nu op rode reset knop!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 65);
      }
    }
    pop();
  }
}

document.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.keyCode === 32) {
        if (showDinoGame && dinoGame) {
            e.preventDefault();
        }
    }
}, false);

function styleButton(btn, bgColor, padding) {
    btn.style('padding', padding);
    btn.style('font-size', '16px');
    btn.style('cursor', 'pointer');
    btn.style('background-color', bgColor);
    btn.style('color', 'white');
    btn.style('border', 'none');
    btn.style('border-radius', '8px');
    btn.style('position', 'absolute');  
}

function resetGame() {
    showDinoGame = false;
    dinoGame = null;
    generateQuestions();
}

function showInfo() {
    let overlay = document.createElement('div');
    overlay.id = 'infoOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    document.body.appendChild(overlay);
    
    let popup = document.createElement('div');
    popup.id = 'infoPopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 3px solid #333;
        border-radius: 10px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    popup.innerHTML = `
        <h2 style="color: #fb0427; margin-top: 0;">
        Summon the Dragon – Interpoleren
        </h2><br>
        <p style="color: #0E0E0E; line-height: 1.2;">
            <strong>Doel:<br></strong> Los alle 10 tabellen correct op en speel de Dragon game!<br><br>
            <strong>Hoe lees je de tabel:</strong>
            <ul style="color: #0909B4; margin: 5px 0;">
                <li>Elke tabel heeft 2 rijen en 3 kolommen.</li>
                <li>Rij 1 = x-waarden (invoer), Rij 2 = y-waarden (uitvoer).</li>
                <li>De waarden veranderen lineair (rechte lijn).</li>
                <li>Vind het <strong>?</strong> door te interpoleren (tussen de punten) of extrapoleren (buiten de punten).</li>
                <li>Antwoord is nauwkeurig op 1 decimaal.</li>
            </ul><br>
            <strong>Hoe speel je:</strong>
            <ol style="color: #0909B4; margin: 5px 0;">
                <li>Sleep blauwe tabelblokjes naar de juiste oranje antwoorden.</li>
                <li>Klik "Nakijken" om je antwoorden te controleren.</li>
                <li>Klik op "Score" om feedback te bekijken.</li>
                <li>Bij een score van 10/10 start de Dragon game automatisch!</li>
            </ol><br>
            <strong>Dragon Game:</strong>
            <li>Spring met spatie of muisklik.</li>
            <li>Pak de draaiende diamantjes voor tijdelijke onkwetsbaarheid.</li>
            <li>Na 3 game-overs komt er een volledige reset.</li><br>
            <strong>Reset:<br></strong> Klik "Reset" voor nieuwe tabellen.
        </p>
        <button id="closeBtn" style="
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">Sluiten</button>
    `;
    
    document.body.appendChild(popup);
    
    let closeBtn = document.getElementById('closeBtn');
    closeBtn.addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        popup.remove();
        overlay.remove();
    });
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) { popup.remove(); overlay.remove(); }
    });
    overlay.addEventListener('touchend', function(e) {
        if (e.target === overlay) { e.preventDefault(); popup.remove(); overlay.remove(); }
    });
}

function showScoreFeedback() {
    if (!isChecked) return;
    
    let feedbackTitle = '';
    let feedbackText = '';
    let feedbackColor = '';
    
    if (correctCount === 0) {
        feedbackTitle = '😢 Oeps! 0/10';
        feedbackText = 'Nog geen enkele tabel goed! Bekijk de stap tussen de x-waarden en hoe de y-waarden daarmee meeveranderen.';
        feedbackColor = '#e74c3c';
    } else if (correctCount <= 3) {
        feedbackTitle = '😕 Begin is er! ' + correctCount + '/10';
        feedbackText = 'Je hebt er al een paar goed! Probeer de stap (het verschil) tussen de waarden te berekenen.';
        feedbackColor = '#e67e22';
    } else if (correctCount <= 5) {
        feedbackTitle = '🙂 Halfway! ' + correctCount + '/10';
        feedbackText = 'Je bent al (bijna) halverwege! Goed gedaan, maar je kunt beter! Let op extrapolatie: de lijn gaat verder voorbij de bekende punten.';
        feedbackColor = '#f39c12';
    } else if (correctCount <= 7) {
        feedbackTitle = '😊 Goed bezig! ' + correctCount + '/10';
        feedbackText = 'Meer dan de helft goed! Jij kunt dit! Let op de 1 decimaal nauwkeurigheid.';
        feedbackColor = '#3498db';
    } else if (correctCount <= 9) {
        feedbackTitle = '🤩 Bijna perfect! ' + correctCount + '/10';
        feedbackText = 'Fantastisch! Je hebt ze bijna allemaal goed. Nog even goed rekenen en dan roep jij de draak op!';
        feedbackColor = '#2ecc71';
    } else {
        feedbackTitle = '🤩 Perfect! 10/10';
        feedbackText = 'Dragon Master! Je kunt lineair interpoleren en extrapoleren als een pro!';
        feedbackColor = '#FFC107';
    }
    
    let overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:999;`;
    document.body.appendChild(overlay);
    
    let popup = document.createElement('div');
    popup.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border:3px solid ${feedbackColor};border-radius:10px;padding:30px;max-width:500px;box-shadow:0 4px 20px rgba(0,0,0,.3);z-index:1000;font-family:Arial,sans-serif;`;
    popup.innerHTML = `
        <h2 style="margin-top:0;color:${feedbackColor};">${feedbackTitle}</h2>
        <p style="color:#333;line-height:1.6;font-size:16px;">${feedbackText}</p>
        <button id="closeFeedbackBtn" style="background:${feedbackColor};color:white;border:none;padding:10px 30px;border-radius:5px;cursor:pointer;font-size:16px;margin-top:20px;">Sluiten</button>
    `;
    document.body.appendChild(popup);
    
    let closeBtn = document.getElementById('closeFeedbackBtn');
    closeBtn.addEventListener('click', () => { popup.remove(); overlay.remove(); });
    closeBtn.addEventListener('touchend', (e) => { e.preventDefault(); popup.remove(); overlay.remove(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { popup.remove(); overlay.remove(); } });
    overlay.addEventListener('touchend', (e) => { if (e.target === overlay) { e.preventDefault(); popup.remove(); overlay.remove(); } });
}

function keyPressed(event) {
    return false;
}

// =====================================================
// GENERATE QUESTIONS – AANGEPAST VOOR INTERPOLATIE
//
// Layout (5 kolommen × 4 rijen vragen/antwoorden):
//   Rij 1: Tabel-blokken (vraag) voor vragen 1–5
//   Rij 2: Tabel-blokken (vraag) voor vragen 6–10
//   Rij 3: Antwoord-blokken voor vragen 1–5 (shuffled)
//   Rij 4: Antwoord-blokken voor vragen 6–10 (shuffled)
//
// Elk "vraagblok" toont een 2×3 tabel met één '?' cel.
// De leerling sleept het juiste antwoord (1 decimaal) ernaartoe.
// =====================================================
function generateQuestions() {
    blocks = [];
    questions = [];
    answers = [];
    isChecked = false;
    correctCount = 0;
    isFlashing = false;
    flashCounter = 0;

    // Genereer 10 unieke interpolatievragen
    // Zorg dat antwoorden niet dubbel zijn (anders is het toewijzen verwarrend)
    let usedAnswers = new Set();
    let maxAttempts = 200;
    
    while (questions.length < 10 && maxAttempts > 0) {
        maxAttempts--;
        let q = generateInterpolationQuestion();
        let key = q.answer.toFixed(1);
        
        // Vermijd dubbele antwoorden voor eerlijkheid
        if (!usedAnswers.has(key)) {
            usedAnswers.add(key);
            questions.push(q);
            answers.push(q.answer);
        }
    }
    
    // Vul aan als we niet op 10 komen (kan bij te strenge uniciteitscheck)
    while (questions.length < 10) {
        let q = generateInterpolationQuestion();
        questions.push(q);
        answers.push(q.answer);
    }
    
    // Shuffle de antwoorden
    let shuffledAnswers = shuffle([...answers]);

    // ===== MAAK VRAAG-BLOKKEN (rijen 1 en 2) =====
    for (let i = 0; i < 10; i++) {
        let col = i % COLS;       // kolom 0–4
        let row = (i < 5) ? 1 : 2; // rij 1 voor 0–4, rij 2 voor 5–9
        
        blocks.push({
            col: col,
            row: row,
            startCol: col,
            startRow: row,
            x: MARGIN + col * CELL_SIZE,
            y: MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE,
            isDragging: false,
            isPlaced: false,
            text: '',          // wordt getekend via drawBlock speciale logica
            answer: questions[i].answer,
            isQuestion: true,
            questionData: questions[i],  // volledige tabel data
            questionIndex: i,
            isCorrect: null,
            isHovered: false,
            hoverProgress: 0,
        });
    }

    // ===== MAAK ANTWOORD-BLOKKEN (rijen 3 en 4) =====
    for (let i = 0; i < 10; i++) {
        let col = i % COLS;
        let row = (i < 5) ? 3 : 4;
        
        blocks.push({
            col: col,
            row: row,
            startCol: col,
            startRow: row,
            x: MARGIN + col * CELL_SIZE,
            y: MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE,
            isDragging: false,
            isPlaced: true,
            text: shuffledAnswers[i].toFixed(1),
            answer: shuffledAnswers[i],
            isQuestion: false,
            isCorrect: null,
            isHovered: false,
            hoverProgress: 0,
        });
    }
}

// =====================================================
// DRAW BLOCK – AANGEPAST voor interpolatie-tabel weergave
// =====================================================
function drawBlock(block) {
  push();
  
  if (block.isQuestion && block.hoverProgress > 0) {
      let lift = -6 * block.hoverProgress;
      let scaleAmount = 1 + 0.12 * block.hoverProgress;
      translate(block.x + CELL_SIZE / 2, block.y + CELL_SIZE / 2 + lift);
      scale(scaleAmount);
      translate(-CELL_SIZE / 2, -CELL_SIZE / 2);
      drawingContext.shadowBlur = 20 * block.hoverProgress;
      drawingContext.shadowColor = 'rgba(0,0,0,0.5)';
      drawingContext.shadowOffsetY = 4 * block.hoverProgress;
  }
  
  // Bepaal achtergrondkleur blok
  if (isChecked && block.isCorrect !== null) {
      fill(block.isCorrect ? color(100, 200, 100) : color(250, 100, 100));
  } else if (block.isQuestion) {
      fill(100, 150, 250);   // origineel blauw voor vraagblokken
  } else {
      fill(255, 200, 100); // oranje voor antwoordblokken
  }
  
  stroke(50, 100, 200);
  strokeWeight(2);
  
  // Teken buitenste blok
  let bx = (block.isQuestion && block.hoverProgress > 0) ? 3 : block.x + 3;
  let by = (block.isQuestion && block.hoverProgress > 0) ? 3 : block.y + 3;
  rect(bx, by, CELL_SIZE - 6, CELL_SIZE - 6, 5);
  
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;
  
  if (block.isQuestion && block.questionData) {
      // ===================================================
      // TEKEN INTERPOLATIE TABEL (2 rijen × 3 kolommen)
      // ===================================================
      let q = block.questionData;
      
      // Tabel dimensies binnen het blok
      let padding = 8;
      let tblX = bx + padding;
      let tblY = by + padding;
      let tblW = CELL_SIZE - 6 - padding * 2;
      let tblH = CELL_SIZE - 6 - padding * 2;
      
      let colW = tblW / 3;
      let rowH = tblH / 2;
      
      // Rij 0 = x-rij, rij 1 = y-rij
      
      for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
              let cx = tblX + c * colW;
              let cy = tblY + r * rowH;
              
              // Cel achtergrond: transparant, witte rand
              noFill();
              stroke(255, 255, 255);
              strokeWeight(1);
              rect(cx, cy, colW, rowH, 2);
              
              // Celwaarde: altijd zwart, punt naar komma
              noStroke();
              textAlign(CENTER, CENTER);
              textStyle(BOLD);
              fill(0);
              
              let cellVal = '';
              
              if (r === 0) {
                  cellVal = ('' + q.tableX[c]).replace('.', ',');
                  textSize(11);
              } else {
                  if (c === q.questionColY) {
                      let hasAnswer = false;
                      cellVal = '?';
                      for (let ab of blocks) {
                          if (!ab.isQuestion && ab.col === block.col && ab.row === block.row) {
                              hasAnswer = true;
                              cellVal = ab.text.replace('.', ',');
                              break;
                          }
                      }
                      textSize(hasAnswer ? 10 : 14);
                  } else {
                      cellVal = q.tableY[c].toFixed(1).replace('.', ',');
                      textSize(11);
                  }
              }
              
              text(cellVal, cx + colW / 2, cy + rowH / 2);
          }
      }
      
  } else {
      // ===================================================
      // TEKEN ANTWOORD-BLOK (grote getallen)
      // ===================================================
      fill(0);
      noStroke();
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(22);
      textLeading(25);
      text(block.text.replace('.', ','), bx + (CELL_SIZE - 6) / 2, by + (CELL_SIZE - 6) / 2);
  }
  
  pop();
}

// =====================================================
// CHECK ANSWERS – vergelijk op 1 decimaal nauwkeurig
// =====================================================
function checkAnswers() {
    isChecked = true;
    correctCount = 0;
    
    for (let block of blocks) block.isCorrect = null;
    
    for (let questionBlock of blocks) {
        if (questionBlock.isQuestion) {
            let answerBlock = null;
            for (let block of blocks) {
                if (!block.isQuestion && block.col === questionBlock.col && block.row === questionBlock.row) {
                    answerBlock = block;
                    break;
                }
            }
            
            if (answerBlock) {
                // Vergelijk op 1 decimaal nauwkeurig
                let qAns = round1(questionBlock.answer);
                let aAns = round1(answerBlock.answer);
                
                if (Math.abs(qAns - aAns) < 0.05) {  // tolerantie van 0.05
                    questionBlock.isCorrect = true;
                    answerBlock.isCorrect = true;
                    correctCount++;
                } else {
                    questionBlock.isCorrect = false;
                    answerBlock.isCorrect = false;
                }
            } else {
                questionBlock.isCorrect = false;
            }
        }
    }
    
    if (canvasButtons.length > 1) {
        canvasButtons[1].label = 'Score: ' + correctCount + '/10';
    }
    
    if (correctCount === 10) {
        isFlashing = true;
        flashCounter = 0;
        if (canvasButtons.length > 1) {
            canvasButtons[1].color = color(255, 215, 0);
        }
    } else {
        if (canvasButtons.length > 1) {
            canvasButtons[1].color = color(156, 39, 176);
        }
    }
}

// =====================================================
// SETUP
// =====================================================
function setup() {
    createNavigation();
    
    IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (IS_MOBILE) {
        let baseCanvasWidth = COLS * CELL_SIZE + MARGIN * 2;
        let baseCanvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;
        let availableWidth = window.innerWidth - 20;
        let availableHeight = window.innerHeight - 150;
        let scaleByWidth = availableWidth / baseCanvasWidth;
        let scaleByHeight = availableHeight / baseCanvasHeight;
        SCALE_FACTOR = Math.min(scaleByWidth, scaleByHeight);
        SCALE_FACTOR = constrain(SCALE_FACTOR, 0.3, 1.2);
    } else {
        SCALE_FACTOR = 1;
    }
    
    let wrapper = createDiv();
    wrapper.style('display', 'flex');
    wrapper.style('flex-direction', 'column');
    wrapper.style('align-items', 'center');
    wrapper.style('width', '100%');
        
    let container = createDiv();
    container.parent(wrapper);
    container.style('position', 'relative');
    container.style('display', 'inline-block');
    
    let canvasWidth = COLS * CELL_SIZE + MARGIN * 2;
    let canvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;

    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent(container);
    cnv.elt.style.touchAction = 'none';  
    cnv.elt.style.userSelect = 'none';
  
    if (IS_MOBILE) {
        cnv.elt.style.maxWidth = '100vw';
        cnv.elt.style.height = 'auto';
        cnv.elt.style.width = '100%';
        container.elt.style.width = '100%';
        container.elt.style.padding = '0';
        container.elt.style.margin = '0';
    }
    
    loadImage('background_dragon.png', 
      (img) => { backgroundImage = img; bgLoaded = true; },
      () => {
        loadImage('background_dragon.png', 
          (img) => { backgroundImage = img; bgLoaded = true; }
        );
      }
    );
 
    loadImage('dino.png', (img) => { dinoImage = img; });
    
    generateQuestions();
    
    let btnW = IS_MOBILE ? 75 : 90;
    let btnH = IS_MOBILE ? 35 : 38;
    let btnY = MARGIN + TITLE_SPACE + BUTTON_HEIGHT + 80;
    let btnGap = IS_MOBILE ? 15 : 50;

    let totalWidth = btnW * 3 + (btnW + 20) + btnGap * 3;

    if (IS_MOBILE && totalWidth > width - 40) {
        let availableWidth = width - 40;
        btnGap = 10;
        btnW = (availableWidth - (btnGap * 3) - 20) / 4;
    }
    
    let startX = (width - totalWidth) / 2; 
  
    canvasButtons = [
      new CanvasButton(startX, btnY, btnW, btnH, 'Nakijken', color(76, 175, 80), checkAnswers),
      new CanvasButton(startX + btnW + btnGap, btnY, btnW + 20, btnH, 'Score: 0/10', color(156, 39, 176), showScoreFeedback),
      new CanvasButton(startX + (btnW + btnGap) * 2 + 20, btnY, btnW, btnH, 'Reset', color(244, 67, 54), resetGame),
      new CanvasButton(startX + (btnW + btnGap) * 3 + 20, btnY, btnW, btnH, 'ℹ Info', color(3, 169, 244), showInfo)
    ];
    
    document.body.style.backgroundColor = '#0e1621';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
}

// =====================================================
// DRAW LOOP
// =====================================================
function draw() {
    background(14, 22, 33);  
    
    if (bgLoaded && backgroundImage) {
        push();
        let scaledW = width * DRAGON_SCALE_X;
        let scaledH = height * DRAGON_SCALE_Y;
        let imgX = (width - scaledW) / 2 + DRAGON_X_OFFSET;
        let imgY = (height - scaledH) / 2 + DRAGON_Y_OFFSET;
        tint(255, DRAGON_OPACITY);
        imageMode(CORNER);
        image(backgroundImage, imgX, imgY, scaledW, scaledH);
        noTint();
        if (DRAGON_BLUR) {
            fill(14, 22, 33, 100);
            noStroke();
            rect(0, 0, width, height);
        }
        pop();
    }
    
    // Titel
    push();
    fill(TITLE_COLOR[0], TITLE_COLOR[1], TITLE_COLOR[2]);
    textAlign(CENTER, TOP);
    textSize(TITLE_SIZE);
    textStyle(BOLD);
    text(TITLE_TEXT, width / 2, TITLE_Y);
    fill(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2]);
    textSize(SUBTITLE_SIZE);
    textStyle(NORMAL);
    text(SUBTITLE_TEXT, width / 2, SUBTITLE_Y);
    pop();
    
    // Grid
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = MARGIN + col * CELL_SIZE;
            const y = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
            if (showDinoGame && (row === 1 || row === 2)) continue;
            fill(row >= 3 ? color(200, 220, 200, 0) : color(220, 220, 200, 0));
            stroke(100, 100, 100, 0);
            strokeWeight(2);
            rect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }   
    
    // Hover detectie
    for (let block of blocks) {
        block.isHovered = false;
        if (!IS_MOBILE && !showDinoGame && block.isQuestion && block.row >= 1 && block.row < 3 && !draggingBlock &&
            mouseX >= block.x && mouseX <= block.x + CELL_SIZE &&
            mouseY >= block.y && mouseY <= block.y + CELL_SIZE) {
            block.isHovered = true;
        }
        const target = block.isHovered ? 1 : 0;
        block.hoverProgress = lerp(block.hoverProgress, target, 0.15);
    }

    // Blokken tekenen (antwoorden eerst, dan vragen)
    for (let block of blocks) {
        if (!block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 1 || block.row === 2)) continue;
            drawBlock(block);
        }
    }
    for (let block of blocks) {
        if (block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 1 || block.row === 2)) continue;
            drawBlock(block);
        }
    }
  
    // Flashing effect
    if (isFlashing) {
        flashCounter++;
        if (flashCounter % 20 < 10) {
            fill(255, 255, 0, 150);
            noStroke();
            rect(0, 0, width, height);
        }
        if (flashCounter > 100) {
            isFlashing = false;
            flashCounter = 0;
            if (totalGamesPlayed >= 1 || dinoGame !== null) {
                showDinoGame = true;
            } else {
                showDinoGame = true;
                dinoGame = new DinoGame();
            }
        }
    }
    
    // Dino game
    if (showDinoGame && dinoGame) {
        const gameY = MARGIN + CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
        dinoGame.update(gameY);
        dinoGame.draw(gameY);
    }

    // Dragging block
    if (draggingBlock) {
        drawBlock(draggingBlock);
    }
    
    // Canvas buttons
    for (let btn of canvasButtons) {
        if (!IS_MOBILE && !draggingBlock) {
            btn.checkHover(mouseX, mouseY);
        }
        btn.draw();
    }
    
    if (canvasButtons.length > 1) {
        canvasButtons[1].label = 'Score: ' + correctCount + '/10';
    }
  
    // Cursor logica
    showHandCursor = false;
    if (!showDinoGame && !draggingBlock) {
        for (let btn of canvasButtons) {
            if (btn.isClicked(mouseX, mouseY)) { showHandCursor = true; break; }
        }
    }
    if (!showDinoGame && !showHandCursor) {
        for (let block of blocks) {
            if (block.isQuestion && block.row >= 1 && block.row < 3 &&
                mouseX >= block.x && mouseX <= block.x + CELL_SIZE &&
                mouseY >= block.y && mouseY <= block.y + CELL_SIZE) {
                showHandCursor = true;
                break;
            }
        }
    }
    if (draggingBlock) showHandCursor = true;
    if (!IS_MOBILE) {
        setCursor(showHandCursor ? 'pointer' : 'default');
    } else {
        setCursor('default');
    }
}

// =====================================================
// INPUT HANDLERS
// =====================================================
function mousePressed() {
  let zoneX = width  * DINO_ZONE.xRatio;
  let zoneY = height * DINO_ZONE.yRatio;
  let zoneW = width  * DINO_ZONE.wRatio;
  let zoneH = height * DINO_ZONE.hRatio;
  if (mouseX > zoneX && mouseX < zoneX + zoneW && mouseY > zoneY && mouseY < zoneY + zoneH) {
    showDinoGame = true;
    dinoGame = new DinoGame();
    isFlashing = false;
    return false;
  }
  pointerDown(mouseX, mouseY);
  return false;
}

function mouseDragged() { pointerMove(mouseX, mouseY); return false; }
function mouseReleased() { pointerUp(); return false; }
function touchStarted() { if (touches.length > 0) pointerDown(touches[0].x, touches[0].y); return false; }
function touchMoved() { if (touches.length > 0) pointerMove(touches[0].x, touches[0].y); return false; }
function touchEnded() { pointerUp(); return false; }

function pointerDown(px, py) {
  showHandCursor = false;
  
  for (let btn of canvasButtons) {
    if (btn.isClicked(px, py)) { btn.action(); return false; }
  }

  if (showDinoGame && dinoGame && !dinoGame.gameOver) {
    dinoGame.dino.jump();
    return false;
  }
  
  if (!showDinoGame) {
    for (let i = blocks.length - 1; i >= 0; i--) {
      let block = blocks[i];
      if (block.isQuestion && block.row < 3 &&
          px > block.x && px < block.x + CELL_SIZE &&
          py > block.y && py < block.y + CELL_SIZE) {
        draggingBlock = block;
        offsetX = px - block.x;
        offsetY = py - block.y;
        block.isDragging = true;
        isChecked = false;
        showHandCursor = true;
        break;
      }
    }
  }
}

function pointerMove(px, py) {
  if (draggingBlock) {
    draggingBlock.x = px - offsetX;
    draggingBlock.y = py - offsetY;
    showHandCursor = true;
  }
}

function pointerUp() {
  if (!draggingBlock) return;
  draggingBlock.isDragging = false;
  snapBlock(draggingBlock);
  draggingBlock = null;
}

function snapBlock(block) {
  let col = Math.round((block.x - MARGIN) / CELL_SIZE);
  let row = Math.round((block.y - MARGIN - BUTTON_HEIGHT - TITLE_SPACE) / CELL_SIZE);
  col = constrain(col, 0, COLS - 1);
  row = constrain(row, 0, ROWS - 1);

  for (let other of blocks) {
    if (other !== block && other.isQuestion && other.col === col && other.row === row) {
      col = block.startCol;
      row = block.startRow;
      break;
    }
  }

  block.col = col;
  block.row = row;
  block.x = MARGIN + col * CELL_SIZE;
  block.y = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
}

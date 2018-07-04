import { Observable, BehaviorSubject } from "rxjs";
import { RSA_X931_PADDING } from "constants";

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const ScoreSubject = new BehaviorSubject(0);
const score = ScoreSubject.scan((prev,cur)=> prev + cur,0);
const SCORE_INCREASE = 10;

document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function paintStars(stars){
  ctx.fillStyle = '#000000';
  ctx.fillRect(0,0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  stars.forEach(star=>{
    ctx.fillRect(star.x, star.y, star.size, star.size);
  })
}

const SPEED = 40;
const STAR_NUMBER = 250;
const StarStream$ = Observable.range(1, STAR_NUMBER)
  .map(()=>({
    x: parseInt(Math.random()*canvas.width, 10),
    y: parseInt(Math.random()* canvas.height, 10),
    size: Math.random() * 3 + 1
  }))
  .toArray()
  .flatMap(starArray => Observable.interval(SPEED).map(()=>{
    starArray.forEach(star=>{
      if(star.y>= canvas.height){
        star.y = 0; // reset star to the top of the screen
      }
      star.y += star.size;
    });
    return starArray;
    }));

function drawTriangle(x,y,width,color,direction){
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x-width, y);
  ctx.lineTo(x, direction === 'up' ? y - width : y + width);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x - width, y);
  ctx.fill();
}

function renderScene(actors){
  paintStars(actors.stars);
  paintSpaceShip(actors.spaceship.x, actors.spaceship.y);
  paintEnemies(actors.enemies);
  paintHeroShots(actors.heroShots, actors.enemies);
  paintScore(actors.score);
}

function paintSpaceShip(x,y){
  drawTriangle(x, y, 20, '#ff0000', 'up');
}


const HERO_Y = canvas.height - 30;
const mouseMove = Observable.fromEvent(canvas, 'mousemove');
const SpaceShip = mouseMove
    .map(event=> ({
        x: event.clientX,
        y: HERO_Y
    }))
    .startWith({
      x: canvas.width / 2,
      y: HERO_Y
    })

const ENEMY_FREQ = 1500;
const ENEMY_SHOOTING_FREQ = 750;

function isVisible(obj){
  return obj.x > -40 &&
    obj.x < canvas.width + 40 &&
    obj.y > -40 &&
    obj.y < canvas.height + 40;
}
const Enemies$ = Observable.interval(ENEMY_FREQ).scan(enemyArray=>{
  const enemy = {
    x: parseInt(Math.random() * canvas.width, 10),
    y: -30,
    shots: []
  };

  Observable.interval(ENEMY_SHOOTING_FREQ).subscribe(()=>{
    if(!enemy.isDead){
      enemy.shots.push({x: enemy.x, y: enemy.y});
    }
    enemy.shots = enemy.shots.filter(isVisible);
  })

  enemyArray.push(enemy);
  return enemyArray.filter(isVisible)
    .filter(enemy=>!(enemy.isDead && enemy.shots.length===0));
}, []);

function getRandomInt(min, max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

function paintEnemies(enemies){
  enemies.forEach(enemy=>{
    enemy.y+= 5,
    enemy.x += getRandomInt(-15,15);

    if(!enemy.isDead){
      drawTriangle(enemy.x, enemy.y, 20, "#00ff00", 'down');
    }

    enemy.shots.forEach(shot=>{
      shot.y+=SHOOTING_SPEED;
      drawTriangle(shot.x, shot.y, 5, '#00ffff', 'down');
    })
  })
}

function paintScore(score){
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif',
  ctx.fillText(`Score: ${score}`, 40, 43);
}

function collision(target1, target2){
  let collision = (
    target1.x>target2.x-20 &&
    target1.x<target2.x+20 &&
    (target1.y>target2.y-20 && target1.y<target2.y+20)
  );
  if(collision){
    console.log('collision detected');
  }
  return collision;
}

const playerFiring = Observable
  .merge(
    Observable.fromEvent(canvas, 'click'),
    Observable.fromEvent(document, 'keydown')
      .filter(evt=> evt.keyCode===32)
  )
  .startWith({})
  .sampleTime(200)
  .timestamp();

const HeroShots = Observable
  .combineLatest(playerFiring, SpaceShip, 
    (shotEvents, spaceship)=>{
      return {
        timestamp: shotEvents.timestamp,
        x:spaceship.x}
    }
  )
  .distinctUntilChanged( (a,b, c)=>{
    return a.timestamp===b.timestamp;
  })
  .scan(
    (shotArray, shot)=> {
      shotArray.push({
        x:shot.x,
        y:HERO_Y
      });
      return shotArray;
    },[]
  );

const SHOOTING_SPEED = 15;

function gameOver(ship, enemies) {
  return enemies.some(enemy => {
    if (collision(ship, enemy)) {
      console.log('GAME OVER');
      return true;
    }

    return enemy.shots.some(shot => collision(ship, shot));
  });
}

function paintHeroShots(heroShots, enemies){
  heroShots.forEach(shot=>{
    for(let l =0; l<enemies.length;l++){
      const enemy = enemies[l];
      if(!enemy.isDead && collision(shot, enemy)){
        ScoreSubject.next(SCORE_INCREASE);
        enemy.isDead = true;
        shot.x = shot.y = -100;
        break;
      }
    }
    shot.y -= SHOOTING_SPEED;
    drawTriangle(shot.x, shot.y, 5, '#ffff00', 'up');
  })
}





const Game = Observable.combineLatest(StarStream$, SpaceShip, Enemies$, HeroShots, score, (
  stars,
  spaceship,
  enemies,
  heroShots,
  score
) => ({
  stars,spaceship, enemies, heroShots, score
}))
.sampleTime(SPEED)
.takeWhile(actors=>gameOver(actors.spaceship, actors.enemies)===false);


Game.subscribe(renderScene);

const rows = 12;
const columns = 6;
const container = document.querySelector(".gameboard");
const startBtn = document.getElementById("startBtn");
const bombBtn = document.querySelector("#bombBtn");
const capacity2 = [1, 6, 67, 72];
const capacity3 = [2, 3, 4, 5, 68, 69, 70, 71];
const teleportationCells = [[0,0],[11,4],[8,1],[8,2],[4,2],[9,1],[1,3],[5,0]];
const click = new Audio("./assets/click.wav");
const explosionSound = new Audio("./assets/explosion.wav");
const playerTemplates = [
   { name:"Blue", color:"blue" },
   { name:"Green", color:"green" },
   { name:"Red", color:"red" },
   { name:"Yellow", color:"yellow" }
];
let grid = [];
let moveHistory = [];
let gameOver = false;
let turnNumber =1;
let i=1;
let timerGame = null;
let timerPlayer = null;
let startTime = 0;
let elapsedTime = 0;
let elapsedTimePlayer = 0;
let playerStartTime = 0;
let isGameRunning = false;
let isRunning = false;
let bombMode = false;
let currentPlayerIndex = 0;
let players;

bombBtn.addEventListener("click", () => {
  if(getCurrentPlayer().bombs>0){
    bombMode = true;
    alert(getCurrentPlayer().name + " selected bomb!");
  }
});

startBtn.addEventListener("click", () => {
  const playerCount = parseInt(document.getElementById("dropdown").value);
  if(playerCount == 0){
    alert("Choose the number of players!");
  }
  else{
    createPlayers(playerCount);
    startGame();
    showGrid();
  }
});

function startGame(){
  createGrid();
  document.querySelector(".menuScreen").style.display = "none";
  document.querySelector(".screen").style.display = "flex";
  updateScoreboard();
}
  
function explodeBomb(row, col){
    for(let r = row - 1; r <= row + 1; r++){
      for(let c = col - 1; c <= col + 1; c++){
            if(r >= 0 && r < rows && c >= 0 && c < columns){
                const cell = grid[r][c];
                cell.owner = null;
                cell.count = 0;
                changeVisuals(cell);
            }
        }
    }
}

function createPlayers(playerCount){
  players = [];
  for(let i = 0; i<playerCount; i++){
    players.push({
      ...playerTemplates[i],
      score: 0,
      eliminated: false,
      bombs: 1
    });
  }
}

function getCurrentPlayer(){
  return players[currentPlayerIndex];
}

function updateScoreboard(){
  const scoreboard = document.querySelector(".scoreboard");
  scoreboard.innerHTML = "";
  for(let i = 0; i < players.length; i++){
    scoreboard.innerHTML += `
      <div>${players[i].name}: ${players[i].score}</div>`;
  }
}

function updateHistory(playerMove){
  moveHistory.push(playerMove);
  updateVisualMoves();
}

function updateVisualMoves(){
  const visualMoves = document.querySelector(".visualMoves");
  visualMoves.innerHTML = "";
  for(let i = moveHistory.length - 1; i>=0; i--){
    visualMoves.innerHTML += `<div>${moveHistory[i]}</div>`;
  }
}

function startGameTimer(){
  if(!isGameRunning){
    startTime = Date.now() - elapsedTime;
    timerGame = setInterval(updateGameTime,10);
    isGameRunning = true; 
  }
}

function startPlayerTimer(){
    clearInterval(timerPlayer);
    elapsedTimePlayer = 0;
    playerStartTime = Date.now();
    timerPlayer = setInterval(updatePlayerTime,10);
    isRunning = true; 
}

function resumePlayerTimer(){
  clearInterval(timerPlayer);
  playerStartTime = Date.now() - elapsedTimePlayer;
  timerPlayer = setInterval(updatePlayerTime,10);
}

function updateGameTime(){
  const currentTime = Date.now();
  elapsedTime = currentTime - startTime;

  let gameTimeLeft = 300*1000 - elapsedTime;

  if(gameTimeLeft <= 0){
    gameOver = true;
    clearInterval(timerGame);
    clearInterval(timerPlayer);
    alert("Time Over!");     
    
    return;
  }

  let gameSeconds = Math.floor(gameTimeLeft/1000%60);
  let gameMinutes = Math.floor(gameTimeLeft/(1000*60)%60);

  gameSeconds = String(gameSeconds).padStart(2, "0");
  gameMinutes = String(gameMinutes).padStart(2, "0");

  document.getElementsByClassName("gameTimer")[0].textContent = `${gameMinutes}:${gameSeconds}`;
}

function updatePlayerTime(){
  const currentTime = Date.now();
  elapsedTimePlayer = currentTime - playerStartTime; 
  
  let playerTimeLeft = 15*1000 - elapsedTimePlayer;

  if(playerTimeLeft<=0){
    clearInterval(timerPlayer);
    alert(getCurrentPlayer().name + " ran out of time");
    getCurrentPlayer().eliminated = true;
    if(scanGrid().length == 1){
      alert(scanGrid()[0] + " wins!");
      resetTimers();
      gameOver = true;
    }
    changeTurn();
    startPlayerTimer();
    return;
  }

  let playerSeconds = Math.floor(playerTimeLeft/1000%60);
  let playerMinutes = Math.floor(playerTimeLeft/(1000*60)%60);

  playerSeconds = String(playerSeconds).padStart(2, "0");
  playerMinutes = String(playerMinutes).padStart(2, "0");

  document.getElementsByClassName("playerTimer")[0].textContent = `${playerMinutes}:${playerSeconds}`;
}

function pause(){
  if(isRunning){
    clearInterval(timerGame);
    clearInterval(timerPlayer);
    elapsedTime = Date.now() - startTime;
    elapsedTimePlayer = Date.now() - playerStartTime;
    isRunning = false;
    isGameRunning=false;
  }
}

function resetTimers(){
  clearInterval(timerGame);
  clearInterval(timerPlayer);
  isRunning = false;
  isGameRunning = false;
}

function resetPlayerTimer(){
  clearInterval(timerPlayer);
  elapsedTimePlayer = 0;
  startPlayerTimer();
}

function scanGrid(){
  let owners = [];
  for(var r = 0; r<12; r++){
    for(var c = 0; c<6; c++){
      const cell = grid[r][c];
      if(!(owners.includes(cell.owner)) && cell.owner!=null){
        owners.push(cell.owner);
      }
    }
  }
    return owners;
}

function explosion(startRow,startColumn){
  const queue = [[startRow, startColumn]];

  while(queue.length>0){
   const [r,c] = queue.shift();
   const currentCell = grid[r][c];

   if(currentCell.count < currentCell.capacity){
      getCurrentPlayer().score += 1;
      updateScoreboard();
      continue;
   }

   getCurrentPlayer().score += (1+(findNeighbours(r,c).length));
   updateScoreboard();

   currentCell.count = 0;
   currentCell.owner = null;
   explosionSound.play();
   changeVisuals(currentCell);

   const neighbours = findNeighbours(r,c);

   for(let [nr, nc] of neighbours){
    const neighbourCell = grid[nr][nc];
    neighbourCell.count++;
    neighbourCell.owner = getCurrentPlayer().name;
    changeVisuals(neighbourCell);
    teleportCells(nr,nc);
    if(neighbourCell.count >= neighbourCell.capacity){
      queue.push([nr,nc]);
    }
   }
  }
}

function findNeighbours(r,c){

  const neighbours = [];

  if(c+1<=5){
    neighbours.push([r,c+1]);
  }
  if(r+1<=11){
    neighbours.push([r+1,c]);
  }
  if(r-1>=0){
    neighbours.push([r-1,c]);
  }
  if(c-1>=0){
    neighbours.push([r,c-1]);
  }

  return neighbours;

}

function teleportCells(row, column){
  let c = grid[row][column];
  let teleportedCell;
  let teleportedRow;
  let teleportedColumn;
  for(let pair of teleportationCells){
    if(pair[0]==row && pair[1]==column){
      do{
        teleportedRow = Math.floor(Math.random()*12);
        teleportedColumn = Math.floor(Math.random()*6);
       }
      while(teleportedRow == row && teleportedColumn == column);
      teleportedCell = grid[teleportedRow][teleportedColumn];
      teleportedCell.owner = c.owner;
      teleportedCell.count += c.count;
      changeVisuals(teleportedCell);
      updateHistory(`${c.owner} triggered teleport`);
      if(teleportedCell.count >= teleportedCell.capacity){
        explosion(teleportedRow, teleportedColumn);
      }
      c.owner = null;
      c.count = 0;
      changeVisuals(grid[row][column]);
      break;
    }
  }
}

function createGrid(){
  for (var r = 0; r < rows; r++) {
  let rowCells = [];
  for (var c = 0; c < columns; c++) {
    let capacity = 0;
    if (i % 6 === 0 || i % 6 === 1) {
      for (var x = 0; x < capacity2.length; x++) {
        if (i == capacity2[x]) {
          capacity = 2;
          break;
        } else {
          capacity = 3;
        }
      }
    } else {
      for (var y = 0; y < capacity3.length; y++) {
        if (i == capacity3[y]) {
          capacity = 3;
          break;
        } else if (capacity == 0) {
          capacity = 4;
        }
      }
    }

    const cell = {
      owner: null,
      count: 0,
      capacity: capacity,
      element: null,
    };
    rowCells.push(cell);
    i++;
  }
  grid.push(rowCells);
}
}

function changeTurn() {
  let turns = 0;
  do{
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  turns++;

  if(turns > players.length){
    gameOver = true;
    return;
  }
  }
  while(players[currentPlayerIndex].eliminated == true);
}

function changeVisuals(currentCell){
  const el = currentCell.element;
  
  const c1 = el.querySelector(".circle1");
  const c2 = el.querySelector(".circle2");
  const c3 = el.querySelector(".circle3");

  const c21 = el.querySelector(".circle21");
  const c22 = el.querySelector(".circle22");

  const c31 = el.querySelector(".circle31");
  const c32 = el.querySelector(".circle32");
  const c33 = el.querySelector(".circle33");

  c1.style.visibility = "hidden";
  c2.style.visibility = "hidden";
  c3.style.visibility = "hidden";

  let color = currentCell.owner;

   if (currentCell.count === 1) {
    c1.style.visibility = "visible";
    c1.style.backgroundColor = color;
  }

  else if (currentCell.count === 2) {
    c2.style.visibility = "visible";
    c21.style.backgroundColor = color;
    c22.style.backgroundColor = color;
  }

  else if (currentCell.count === 3) {
    c3.style.visibility = "visible";
    c31.style.backgroundColor = color;
    c32.style.backgroundColor = color;
    c33.style.backgroundColor = color;
  }
}

//Creating buttons and adding event listeners

function showGrid()
{
  for (let r = 0; r < rows; r++) {
  for (let c = 0; c < columns; c++) {
    const btn = document.createElement("button");
    btn.classList.add("gridcell");
    grid[r][c].element = btn;

    btn.dataset.row = r;
    btn.dataset.col = c;

    btn.innerHTML = `
  <div class="circle1"></div>
  <div class="circle2">
    <div class="circle21"></div>
    <div class="circle22"></div>
  </div>
  <div class="circle3">
    <div class="circle31"></div>
    <div class="circle32"></div>
    <div class="circle33"></div>
  </div>
`;

    btn.addEventListener("click", function(){

      click.play();

      if(turnNumber ==1){
        startGameTimer();
      }

      if(gameOver === false){
      const clickedCell = grid[r][c];

      if(bombMode){
        updateHistory(`${getCurrentPlayer().name} used bomb at (${r},${c})`);
        explodeBomb(r,c);
        getCurrentPlayer().bombs--;
        bombMode = false;

        let owners = scanGrid();

        if(owners.length == 1){
          alert(owners[0] + " Wins");
          resetTimers();
          gameOver = true;
          return;
      }
      changeTurn();
      startPlayerTimer();
      return;
  }

      if(turnNumber <= players.length && clickedCell.owner == null){
        clickedCell.count = clickedCell.capacity -1;
        clickedCell.owner = getCurrentPlayer().name;
        updateHistory(`${getCurrentPlayer().name} placed at (${r},${c})`);
        changeVisuals(clickedCell);
        turnNumber++;
        getCurrentPlayer().score += clickedCell.count;
        updateScoreboard();
        teleportCells(r,c);
        changeTurn();
        clearInterval(timerPlayer);
        startPlayerTimer();
      }

      if(clickedCell.owner == getCurrentPlayer().name && turnNumber > players.length){
        updateHistory(`${getCurrentPlayer().name} placed at (${r},${c})`);
        clickedCell.count++;
        changeVisuals(clickedCell);
        explosion(r,c);
        turnNumber++;
        let x = scanGrid();
        if(x.length < players.length){
          for(let player of players){
            let found = false;
            for(let owner of x){
              if(player.name==owner){
                found = true;
                break;
              }
            }
            if(!found){
              player.eliminated = true;
            }
          }
        }
        if(x&&x.length == 1){
          alert(x[0] + "Wins");
          resetTimers();
          gameOver = true;
          return;
        }
        changeTurn();
        clearInterval(timerPlayer);
        startPlayerTimer();
      }
    }
    });
    container.appendChild(btn);
  }
}}
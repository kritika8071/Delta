const rows = 12;
const columns = 6;
const container = document.querySelector(".gameboard");
const capacity2 = [1, 6, 67, 72];
const capacity3 = [2, 3, 4, 5, 68, 69, 70, 71];
const click = new Audio("./assets/click.wav");
const explosionSound = new Audio("./assets/explosion.wav");
let grid = [];
let gameOver = false;
let currentPlayer = "Blue";
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
let blueScore = 0;
let greenScore = 0;

function startGameTimer(){
  if(!isGameRunning){
    startTime = Date.now() - elapsedTime;
    timerGame = setInterval(updateGameTime,10);
    isGameRunning = true; 
  }
}

function startPlayerTimer(){
    clearInterval(timerPlayer);
    playerStartTime = Date.now()-elapsedTimePlayer;
    timerPlayer = setInterval(updatePlayerTime,10);
    isRunning = true; 
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
    clearInterval(timerGame);
    clearInterval(timerPlayer);
    alert(currentPlayer + " ran out of time");
    if(currentPlayer == "Blue"){
      alert("Green Wins!");
    }
    else{
      alert("Blue Wins!");
    }
    gameOver = true;
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
  if(owners.length == 1){
    return owners[0];
  }
}

function explosion(startRow,startColumn){
  const queue = [[startRow, startColumn]];

  while(queue.length>0){
   const [r,c] = queue.shift();
   const currentCell = grid[r][c];

   if(currentCell.count < currentCell.capacity){
      if(currentCell.owner=="Blue"){
        blueScore += 1;
      }
      else{
        greenScore += 1;
      }
      continue;
   }
    
   if(currentPlayer == "Blue"){
    blueScore += (1+(findNeighbours(r,c).length));
   }
   else{
    greenScore += (1+findNeighbours(r,c).length);
   }

   currentCell.count = 0;
   currentCell.owner = null;
   explosionSound.play();
   changeVisuals(currentCell);

   const neighbours = findNeighbours(r,c);

   for(let [nr, nc] of neighbours){
    const neighbourCell = grid[nr][nc];
    neighbourCell.count++;
    neighbourCell.owner = currentPlayer;
    changeVisuals(neighbourCell);

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

function changeTurn() {
  if (currentPlayer == "Blue") {
    currentPlayer = "Green";
  } else {
    currentPlayer = "Blue";
  }
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

  let color;

  if(currentCell.owner == "Blue"){
    color = "blue";
  }
  else{
    color = "green";
  }
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

      if((turnNumber == 1 || turnNumber == 2) && clickedCell.owner == null){
        clickedCell.count = clickedCell.capacity -1;
        clickedCell.owner = currentPlayer;
        changeVisuals(clickedCell);
        turnNumber++;
        if(currentPlayer == "Blue"){
          blueScore += clickedCell.count;
        }
        else{
          greenScore += clickedCell.count;
        }
        document.getElementsByClassName("blueScore")[0].textContent = `Blue: ${blueScore}`;
        document.getElementsByClassName("greenScore")[0].textContent = `Green: ${greenScore}`;
        changeTurn();
        clearInterval(timerPlayer);
        startPlayerTimer();
      }

      if(clickedCell.owner == currentPlayer && turnNumber >2){
        clickedCell.count++;
        changeVisuals(clickedCell);
        explosion(r,c);
        
        document.getElementsByClassName("blueScore")[0].textContent = `Blue: ${blueScore}`;
        document.getElementsByClassName("greenScore")[0].textContent = `Green: ${greenScore}`;
        turnNumber++;
        changeTurn();
        clearInterval(timerPlayer);
        startPlayerTimer();
        const x = scanGrid();
        if(x == "Blue"|| x == "Green"){
          alert(x + "Wins");
          resetTimers();
          gameOver = true;
        }
      }
    }
    });
    container.appendChild(btn);
  }
}
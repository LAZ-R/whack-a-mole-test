import { APP_NAME, APP_VERSION } from "../../../app-properties.js";
import { ICONS } from "../../data/svgIcons.data.js";
import { toExternalPath } from "../../router.js";
import { getSvgIcon } from "../../services/icons.service.js";
import { updateMenuDom } from "../../services/menu.service.js";
import { showToast } from "../../services/toast.service.js";
import { isLaptopOrUp, isPhone, isTablet } from "../../utils/breakpoints.js";
import { getRandomIntegerBetween } from "../../utils/math.utils.js";

// VARIABLES //////////////////////////////////////////////////////////////////////////////////////
const HEADER_ICON_CONTAINER = document.getElementById('headerIconContainer');
const HEADER_TITLE = document.getElementById('headerTitle');
const MAIN = document.getElementById('main');
const FOOTER = document.getElementById('footer');

let gridSize = 6;
let activeTime = 800;
let triggerProbability = 50;
let gameDuration = 60;

let currentStartingTime = 0;
let currentEndingingTime = 0;
let currentGameTimeout = null;
let currentTarget = 0;
let currentTimeTimeout = null;

let currentScore = 0;
let currentlyActiveCellId = null;
let activated = 0;

// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////

export function render() {
  // Set HEADER layout
  if (isPhone || isTablet) {
    HEADER_TITLE.innerHTML = APP_NAME;
  }
  if (isLaptopOrUp) {
    HEADER_TITLE.innerHTML = APP_NAME;
  }

  // Set MAIN layout
  MAIN.innerHTML = `
    <div id="gameArea" class="game-area">
      <div id="screenArea" class="screen-area">Define your game rules<br>by setting your slider values,<br>then click the Start button.</div>
    </div>

    <div class="page-container homepage" style="margin-bottom: auto;">
      <div class="input-container">
        <div><span>Grid size</span><strong id="gridSizeValue">${gridSize} x ${gridSize}</strong></div>
        <input id="gridSizeInput" type="range" min="2" max="12" value="${gridSize}" oninput="onGridSizeChange(event)" />
      </div>
      <hr>
      <div class="input-container">
        <div><span>Active time</span><strong id="activeTimeValue">${activeTime}ms</strong></div>
        <input id="activeTimeInput" type="range" min="100" max="1000" step="10" value="${activeTime}" oninput="onActiveTimeChange(event)" />
      </div>
      <hr>
      <div class="input-container">
        <div><span>Trigger probability</span><strong id="triggerProbabilityValue">${triggerProbability}%</strong></div>
        <input id="triggerProbabilityInput" type="range" min="1" max="100" step="1" value="${triggerProbability}" oninput="onTriggerProbabilityChange(event)" />
      </div>
      <hr>
      <div class="input-container">
        <div><span>Game duration</span><strong id="gameDurationValue">${gameDuration}s</strong></div>
        <input id="gameDurationInput" type="range" min="30" max="300" step="10" value="${gameDuration}" oninput="onGameDurationChange(event)" />
      </div>
      
      <span style="margin: 4px auto; margin-top: 16px; display: flex; justify-content: space-between; width: 100%;">
        <span>Target : <strong id="target">${currentTarget}</strong></span>
        <span>Activated : <strong id="activated">${activated}</strong></span>
      </span>
      <span style="margin: 4px auto; margin-bottom: 16px; display: flex; justify-content: space-between; width: 100%;">
        <span>Remaining time : <strong id="time">${gameDuration}s</strong></span>
        <span>Score : <strong id="score">0</strong></span>
      </span>
      <button onclick="startGame()" class="lzr-button lzr-solid" style="width: 100%; margin-top: auto;">Start</button>
    </div>
  `;

  // Set FOOTER layout
  FOOTER.innerHTML = ``;

  updateMenuDom('homepage');
}

function setupGrid() {
  const screenArea = document.getElementById('screenArea');
  screenArea.style = `--grid-size: ${gridSize};`;

  let gridHtmlString = '';
  for (let index_Y = 0; index_Y < gridSize; index_Y++) {
    for (let index_X = 0; index_X < gridSize; index_X++) {
      gridHtmlString += `<div onclick="onCellClick(event)" id="${index_X}-${index_Y}" class="grid-cell">${index_X}-${index_Y}</div>`;
    }
  }

  screenArea.innerHTML = gridHtmlString;
}

function launchGame() {
  let currentTime = Date.now();
  if (currentTime >= currentEndingingTime) {
    const screenArea = document.getElementById('screenArea');
    screenArea.classList.remove('playing');
    document.getElementById('time').innerHTML = `0s`;
    clearTimeout(currentGameTimeout);
    clearTimeout(currentTimeTimeout);
    return;
  }
  
  let proba = getRandomIntegerBetween(1, 100);
  let shouldTrigger = proba <= triggerProbability;
  let randomCell = null;
  if (shouldTrigger) {
    const randomId = `${getRandomIntegerBetween(0, gridSize - 1)}-${getRandomIntegerBetween(0, gridSize - 1)}`;
    currentlyActiveCellId = randomId;
    randomCell = document.getElementById(randomId);
    randomCell.classList.add('active');
    activated += 1;
    document.getElementById('activated').innerHTML = activated;
  }
  currentGameTimeout = setTimeout(() => {
    if (shouldTrigger) {
      randomCell.classList.remove('active');
      randomCell.classList.remove('obtained');
      currentlyActiveCellId = null;
    }
    launchGame();
  }, activeTime);
}

function onCellClick(event) {
  const cellId = event.target.id;
  if (cellId == currentlyActiveCellId) {
    const cellElement = document.getElementById(cellId);
    cellElement.classList.remove('active');
    cellElement.classList.add('obtained');
    currentScore += 1;
    document.getElementById('score').innerHTML = currentScore;
  }
}
window.onCellClick = onCellClick;

function startGame() {
  clearTimeout(currentGameTimeout);
  clearTimeout(currentTimeTimeout);
  gridSize = document.getElementById('gridSizeInput').value;
  activeTime = document.getElementById('activeTimeInput').value;
  triggerProbability = document.getElementById('triggerProbabilityInput').value;
  gameDuration = document.getElementById('gameDurationInput').value;

  // target
  currentTarget = ((((gameDuration * 1000) / activeTime) * (triggerProbability / 100)) * .5).toFixed(0);
  document.getElementById('target').innerHTML = currentTarget;

  // time
  currentStartingTime = Date.now();
  currentEndingingTime = currentStartingTime + (gameDuration * 1000);

  currentScore = 0;
  document.getElementById('score').innerHTML = currentScore;
  activated = 0;
  document.getElementById('activated').innerHTML = activated;

  setupGrid();
  launchGame();
  document.getElementById('screenArea').classList.add('playing');
  updateTime();
}
window.startGame = startGame;

function updateTime() {
  let currentTime = Date.now();
  document.getElementById('time').innerHTML = `${((currentEndingingTime - currentTime) / 1000).toFixed(1)}s`;
  currentTimeTimeout = setTimeout(() => {
    updateTime()
  }, 100);
}

function onGridSizeChange(event) {
  document.getElementById('gridSizeValue').innerHTML = `${event.target.value} x ${event.target.value}`;
}
window.onGridSizeChange = onGridSizeChange;

function onActiveTimeChange(event) {
  document.getElementById('activeTimeValue').innerHTML = `${event.target.value}ms`;
}
window.onActiveTimeChange = onActiveTimeChange;

function onTriggerProbabilityChange(event) {
  document.getElementById('triggerProbabilityValue').innerHTML = `${event.target.value}%`;
}
window.onTriggerProbabilityChange = onTriggerProbabilityChange;

function onGameDurationChange(event) {
  document.getElementById('gameDurationValue').innerHTML = `${event.target.value}s`;
}
window.onGameDurationChange = onGameDurationChange;
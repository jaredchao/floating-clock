import { getCurrentWindow } from "@tauri-apps/api/window";
import { startClock } from "./clock";

async function setupDragging() {
  const appWindow = getCurrentWindow();
  const appEl = document.getElementById("app")!;

  appEl.addEventListener("mousedown", async (e) => {
    if (e.button === 0) {
      await appWindow.startDragging();
    }
  });
}

function initClock() {
  const clockEl = document.getElementById("clock")!;
  const stopClock = startClock((timeStr) => {
    clockEl.textContent = timeStr;
  });

  return stopClock;
}

function init() {
  setupDragging();
  initClock();
  console.log("悬浮时钟已启动");
}

init();

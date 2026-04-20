import { getCurrentWindow } from "@tauri-apps/api/window";

async function setupDragging() {
  const appWindow = getCurrentWindow();
  const appEl = document.getElementById("app")!;

  appEl.addEventListener("mousedown", async (e) => {
    if (e.button === 0) {
      await appWindow.startDragging();
    }
  });
}

function init() {
  setupDragging();
  console.log("悬浮时钟已启动");
}

init();

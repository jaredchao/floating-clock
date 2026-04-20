import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { startClock } from "./clock";
import {
  getAlarms,
  addAlarm,
  deleteAlarm,
  toggleAlarm,
  formatAlarmTime,
} from "./alarm";

let isAlarmPanelOpen = false;

async function setupDragging() {
  const appWindow = getCurrentWindow();
  const appEl = document.getElementById("app")!;

  appEl.addEventListener("mousedown", async (e) => {
    const target = e.target as HTMLElement;
    if (e.button === 0 && !target.closest("#alarm-panel") && !isAlarmPanelOpen) {
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

async function renderAlarmList() {
  const listEl = document.getElementById("alarm-list")!;
  const alarms = await getAlarms();

  const indicator = document.getElementById("alarm-indicator")!;
  indicator.classList.toggle("active", alarms.some((a) => a.enabled));

  listEl.innerHTML = "";
  alarms.forEach((alarm) => {
    const item = document.createElement("div");
    item.className = `alarm-item ${alarm.enabled ? "" : "disabled"}`;
    item.innerHTML = `
      <div class="alarm-item-info">
        <span class="alarm-item-time">${formatAlarmTime(alarm)}</span>
        <span class="alarm-item-label">${alarm.label || "闹钟"}</span>
      </div>
      <div class="alarm-item-actions">
        <button class="toggle-btn ${alarm.enabled ? "active" : ""}" data-id="${alarm.id}"></button>
        <button class="delete-btn" data-id="${alarm.id}">×</button>
      </div>
    `;
    listEl.appendChild(item);
  });

  listEl.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id!;
      await toggleAlarm(id);
      await renderAlarmList();
    });
  });

  listEl.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id!;
      await deleteAlarm(id);
      await renderAlarmList();
      updateAddButton();
    });
  });
}

function updateAddButton() {
  const btn = document.getElementById("add-alarm-btn") as HTMLButtonElement;
  getAlarms().then((alarms) => {
    btn.disabled = alarms.length >= 3;
    btn.textContent = alarms.length >= 3 ? "已达到上限" : "+ 添加闹钟";
  });
}

function initAlarmPanel() {
  const clockEl = document.getElementById("clock")!;
  const panel = document.getElementById("alarm-panel")!;
  const closeBtn = document.getElementById("close-alarm")!;
  const addBtn = document.getElementById("add-alarm-btn")!;
  const form = document.getElementById("alarm-form")!;
  const cancelBtn = document.getElementById("cancel-alarm")!;
  const saveBtn = document.getElementById("save-alarm")!;

  clockEl.addEventListener("dblclick", async () => {
    isAlarmPanelOpen = true;
    panel.classList.remove("hidden");
    await renderAlarmList();
    updateAddButton();
  });

  closeBtn.addEventListener("click", () => {
    panel.classList.add("hidden");
    isAlarmPanelOpen = false;
  });

  addBtn.addEventListener("click", () => {
    form.classList.remove("hidden");
    addBtn.classList.add("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    form.classList.add("hidden");
    addBtn.classList.remove("hidden");
    (document.getElementById("alarm-time") as HTMLInputElement).value = "";
    (document.getElementById("alarm-label") as HTMLInputElement).value = "";
  });

  saveBtn.addEventListener("click", async () => {
    const timeInput = document.getElementById("alarm-time") as HTMLInputElement;
    const labelInput = document.getElementById("alarm-label") as HTMLInputElement;

    if (!timeInput.value) return;

    const [hour, minute] = timeInput.value.split(":").map(Number);
    await addAlarm(hour, minute, labelInput.value.trim());

    form.classList.add("hidden");
    addBtn.classList.remove("hidden");
    timeInput.value = "";
    labelInput.value = "";

    await renderAlarmList();
    updateAddButton();
  });
}

function playAlarmSound() {
  try {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);

    return { stop: () => audioCtx.close() };
  } catch {
    return { stop: () => {} };
  }
}

function showAlarmNotification(alarm: { hour: number; minute: number; label: string }) {
  const sound = playAlarmSound();

  const modal = document.createElement("div");
  modal.className = "alarm-modal";
  modal.innerHTML = `
    <div class="alarm-modal-content">
      <div class="alarm-modal-title">⏰ 闹钟响了</div>
      <div class="alarm-modal-time">${formatAlarmTime(alarm as any)}</div>
      <div class="alarm-modal-label">${alarm.label || "闹钟"}</div>
      <button class="alarm-modal-close">知道了</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".alarm-modal-close")!.addEventListener("click", () => {
    modal.remove();
    sound.stop();
  });

  setTimeout(() => {
    if (document.body.contains(modal)) {
      modal.remove();
      sound.stop();
    }
  }, 5000);
}

function initAlarmTrigger() {
  listen("alarm-triggered", (event) => {
    const alarm = event.payload as { hour: number; minute: number; label: string };
    showAlarmNotification(alarm);
  });
}

function init() {
  setupDragging();
  initClock();
  initAlarmPanel();
  initAlarmTrigger();
  console.log("悬浮时钟已启动");
}

init();

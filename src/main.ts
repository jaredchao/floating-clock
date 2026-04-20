import { getCurrentWindow } from "@tauri-apps/api/window";
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

function init() {
  setupDragging();
  initClock();
  initAlarmPanel();
  console.log("悬浮时钟已启动");
}

init();

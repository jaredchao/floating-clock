import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { startClock } from "./clock";
import {
  getAlarms,
  addAlarm,
  deleteAlarm,
  toggleAlarm,
  formatAlarmTime,
  type Alarm,
} from "./alarm";
import { getSettings, saveSettings, type ClockSettings } from "./settings";

let activePanel: "none" | "alarm" | "settings" = "none";
let currentSettings: ClockSettings = { is24Hour: true, autoStart: false };

function formatDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekDay = weekDays[date.getDay()];
  return `${month}/${day} ${weekDay}`;
}

async function setupDragging() {
  const appWindow = getCurrentWindow();
  const appEl = document.getElementById("app")!;

  appEl.addEventListener("mousedown", async (e) => {
    const target = e.target as HTMLElement;
    if (
      e.button === 0 &&
      !target.closest(".toolbar") &&
      !target.closest(".panel") &&
      !target.closest("button")
    ) {
      await appWindow.startDragging();
    }
  });
}

function initClock() {
  const clockEl = document.getElementById("clock")!;
  const dateEl = document.getElementById("date")!;

  const stopClock = startClock((timeStr) => {
    clockEl.textContent = timeStr;
    dateEl.textContent = formatDate(new Date());
  });

  dateEl.textContent = formatDate(new Date());
  return stopClock;
}

async function updateAlarmDot() {
  const dot = document.getElementById("alarm-dot")!;
  const alarms = await getAlarms();
  const hasEnabled = alarms.some((a) => a.enabled);
  dot.classList.toggle("hidden", !hasEnabled);
}

async function renderAlarmList() {
  const listEl = document.getElementById("alarm-list")!;
  const alarms = await getAlarms();

  listEl.innerHTML = "";
  if (alarms.length === 0) {
    const empty = document.createElement("div");
    empty.style.cssText =
      "color:rgba(255,255,255,0.25);font-size:12px;text-align:center;padding:20px 0;";
    empty.textContent = "暂无闹钟";
    listEl.appendChild(empty);
  } else {
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
        await updateAlarmDot();
      });
    });

    listEl.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id!;
        await deleteAlarm(id);
        await renderAlarmList();
        updateAddButton();
        await updateAlarmDot();
      });
    });
  }

  await updateAlarmDot();
}

function updateAddButton() {
  const btn = document.getElementById("add-alarm-btn") as HTMLButtonElement;
  getAlarms().then((alarms) => {
    btn.disabled = alarms.length >= 3;
    btn.textContent = alarms.length >= 3 ? "已达到上限" : "+ 添加闹钟";
  });
}

function openPanel(panelName: "alarm" | "settings") {
  const alarmPanel = document.getElementById("alarm-panel")!;
  const settingsPanel = document.getElementById("settings-panel")!;

  if (panelName === "alarm") {
    settingsPanel.classList.add("hidden");
    alarmPanel.classList.remove("hidden");
    renderAlarmList();
    updateAddButton();
  } else {
    alarmPanel.classList.add("hidden");
    settingsPanel.classList.remove("hidden");
  }

  activePanel = panelName;
}

function closePanels() {
  document.getElementById("alarm-panel")!.classList.add("hidden");
  document.getElementById("settings-panel")!.classList.add("hidden");
  activePanel = "none";
}

function initAlarmPanel() {
  const btnAlarm = document.getElementById("btn-alarm")!;
  const closeBtn = document.getElementById("close-alarm")!;
  const addBtn = document.getElementById("add-alarm-btn")!;
  const form = document.getElementById("alarm-form")!;
  const cancelBtn = document.getElementById("cancel-alarm")!;
  const saveBtn = document.getElementById("save-alarm")!;

  btnAlarm.addEventListener("click", () => {
    if (activePanel === "alarm") {
      closePanels();
    } else {
      openPanel("alarm");
    }
  });

  closeBtn.addEventListener("click", closePanels);

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
      <div class="alarm-modal-title">闹钟响了</div>
      <div class="alarm-modal-time">${formatAlarmTime(alarm as Alarm)}</div>
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

async function initSettings() {
  currentSettings = await getSettings();

  const toggle24h = document.getElementById("toggle-24h")!;
  toggle24h.classList.toggle("active", currentSettings.is24Hour);

  toggle24h.addEventListener("click", async () => {
    currentSettings.is24Hour = !currentSettings.is24Hour;
    toggle24h.classList.toggle("active", currentSettings.is24Hour);
    await saveSettings(currentSettings);
    window.dispatchEvent(new Event("settings-changed"));
  });
}

function initSettingsPanel() {
  const btnSettings = document.getElementById("btn-settings")!;
  const closeSettings = document.getElementById("close-settings")!;

  btnSettings.addEventListener("click", () => {
    if (activePanel === "settings") {
      closePanels();
    } else {
      openPanel("settings");
    }
  });

  closeSettings.addEventListener("click", closePanels);
}

function init() {
  setupDragging();
  initClock();
  initAlarmPanel();
  initSettingsPanel();
  initSettings();
  initAlarmTrigger();
  updateAlarmDot();
  console.log("悬浮时钟已启动");
}

init();

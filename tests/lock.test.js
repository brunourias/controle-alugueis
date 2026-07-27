import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOCK_STORAGE_KEY, bootApp, click, makeState, makeUnit, setValue } from "./helpers/app.js";

function storedLock() {
  return JSON.parse(localStorage.getItem(LOCK_STORAGE_KEY));
}

function toBase64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function lockConfigFor(pin) {
  const salt = new Uint8Array(16).fill(7);
  const pinBytes = new TextEncoder().encode(pin);
  const combined = new Uint8Array(salt.length + pinBytes.length);
  combined.set(salt);
  combined.set(pinBytes, salt.length);
  return {
    salt: toBase64Url(salt),
    hash: toBase64Url(new Uint8Array(await webcrypto.subtle.digest("SHA-256", combined))),
    credentialId: null
  };
}

function submitPin(pin) {
  setValue("unlockPin", pin);
  document.getElementById("unlockForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

function lockError() {
  return document.getElementById("lockError").textContent;
}

function securityStatus() {
  return document.getElementById("securityStatus").textContent;
}

function renderedUnits() {
  return document.querySelectorAll("#grid tbody tr").length;
}

const stateWithUnit = () => makeState({ units: [makeUnit({ dueDay: null })] });

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  window.crypto = webcrypto;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("lock screen", () => {
  it("renders straight away when no pin is configured", async () => {
    await bootApp(stateWithUnit());
    expect(renderedUnits()).toBe(1);
  });

  it("keeps the data hidden until a pin is verified", async () => {
    await bootApp(stateWithUnit(), await lockConfigFor("1234"));
    expect(renderedUnits()).toBe(0);
  });

  it("rejects a malformed pin without hashing it", async () => {
    await bootApp(stateWithUnit(), await lockConfigFor("1234"));
    submitPin("12");
    await vi.waitFor(() => expect(lockError()).toBe("Digite um PIN numérico com pelo menos 4 dígitos."));
    expect(renderedUnits()).toBe(0);
  });

  it("rejects a wrong pin", async () => {
    await bootApp(stateWithUnit(), await lockConfigFor("1234"));
    submitPin("9999");
    await vi.waitFor(() => expect(lockError()).toBe("PIN incorreto. Tente novamente."));
    expect(renderedUnits()).toBe(0);
  });

  it("unlocks and renders the app with the right pin", async () => {
    await bootApp(stateWithUnit(), await lockConfigFor("1234"));
    submitPin("1234");
    await vi.waitFor(() => expect(renderedUnits()).toBe(1));
    expect(document.getElementById("lockScreen").hidden).toBe(true);
  });

  it("ignores an unusable lock configuration", async () => {
    await bootApp(stateWithUnit(), { salt: 1, hash: null });
    expect(renderedUnits()).toBe(1);
  });
});

describe("pin management", () => {
  async function unlock(pin) {
    submitPin(pin);
    await vi.waitFor(() => expect(document.getElementById("lockScreen").hidden).toBe(true));
  }

  it("stores a salted hash instead of the pin itself", async () => {
    await bootApp();
    click("settingsButton");
    setValue("newPin", "4321");
    setValue("confirmPin", "4321");
    click("savePin");

    await vi.waitFor(() => expect(storedLock()).not.toBeNull());
    const config = storedLock();
    expect(config.hash).not.toContain("4321");
    expect(config.salt).toEqual(expect.any(String));
    expect(securityStatus()).toBe("PIN salvo neste dispositivo.");
    expect(document.getElementById("newPin").value).toBe("");
  });

  it("requires the confirmation to match", async () => {
    await bootApp();
    click("settingsButton");
    setValue("newPin", "4321");
    setValue("confirmPin", "1234");
    click("savePin");

    await vi.waitFor(() => expect(securityStatus()).toBe("A confirmação do novo PIN não confere."));
    expect(storedLock()).toBeNull();
  });

  it("requires at least four digits", async () => {
    await bootApp();
    click("settingsButton");
    setValue("newPin", "12a");
    setValue("confirmPin", "12a");
    click("savePin");

    await vi.waitFor(() => expect(securityStatus()).toBe("O novo PIN deve ter pelo menos 4 dígitos numéricos."));
    expect(storedLock()).toBeNull();
  });

  it("requires the current pin before changing it", async () => {
    await bootApp(makeState(), await lockConfigFor("1234"));
    await unlock("1234");

    click("settingsButton");
    setValue("currentPin", "0000");
    setValue("newPin", "4321");
    setValue("confirmPin", "4321");
    click("savePin");
    await vi.waitFor(() => expect(securityStatus()).toBe("PIN atual incorreto."));
  });

  it("replaces the stored hash when the current pin matches", async () => {
    const original = await lockConfigFor("1234");
    await bootApp(makeState(), original);
    await unlock("1234");

    click("settingsButton");
    setValue("currentPin", "1234");
    setValue("newPin", "4321");
    setValue("confirmPin", "4321");
    click("savePin");
    await vi.waitFor(() => expect(storedLock().hash).not.toBe(original.hash));
  });

  it("removes the pin once the current one is confirmed", async () => {
    await bootApp(makeState(), await lockConfigFor("1234"));
    await unlock("1234");

    click("settingsButton");
    setValue("currentPin", "1234");
    click("removePin");
    await vi.waitFor(() => expect(storedLock()).toBeNull());
    expect(securityStatus()).toBe("PIN removido. O acesso não está mais bloqueado.");
  });

  it("keeps the pin when the current one is wrong", async () => {
    await bootApp(makeState(), await lockConfigFor("1234"));
    await unlock("1234");

    click("settingsButton");
    setValue("currentPin", "0000");
    click("removePin");
    await vi.waitFor(() => expect(securityStatus()).toBe("PIN atual incorreto."));
    expect(storedLock()).not.toBeNull();
  });

  it("refuses to enable biometrics without a pin", async () => {
    await bootApp();
    click("settingsButton");
    const toggle = document.getElementById("biometricToggle");
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(securityStatus()).toBe("Salve um PIN antes de ativar a biometria."));
    expect(toggle.checked).toBe(false);
  });

  it("clears the stored credential when biometrics are turned off", async () => {
    await bootApp(makeState(), Object.assign(await lockConfigFor("1234"), { credentialId: "abc" }));
    await unlock("1234");

    click("settingsButton");
    const toggle = document.getElementById("biometricToggle");
    toggle.checked = false;
    toggle.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(storedLock().credentialId).toBeNull());
    expect(securityStatus()).toBe("Biometria desativada.");
  });
});

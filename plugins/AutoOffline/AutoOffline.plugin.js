/**
 * @name AutoOffline
 * @version 1.0.0
 * @author Kamiikaze
 * @authorId 141851936168214528
 * @description Automatically sets your Discord status to online on app start and invisible on app quit.
 */

// Destructure modules from BdApi
const { UI, Webpack } = BdApi; 

/**
 * Defines the priority level for status update operations.
 * Lower numbers are processed first.
 * @type {number}
 */
const UPDATE_PRIORITY = 0;

// Retrieve the store that holds user settings, including status
const UserSettingsProtoStore = Webpack.getModule(
  m => m?.getName?.() === "UserSettingsProtoStore",
  { first: true, searchExports: true }
);

// Retrieve the utilities for updating user settings asynchronously
const UserSettingsProtoUtils = Webpack.getModule(
  m => m?.ProtoClass?.typeName?.endsWith(".PreloadedUserSettings"),
  { first: true, searchExports: true }
);

// Validate that required modules were found, log errors if not
if (!UserSettingsProtoStore?.settings) console.error("[AutoOffline] UserSettingsProtoStore not found or invalid");
if (typeof UserSettingsProtoUtils?.updateAsync !== "function") console.error("[AutoOffline] updateAsync utility missing");

module.exports = class AutoOffline {
  constructor(meta) {
    this.meta = meta;
    this.currentUserStatus = "offline";
    this.handleUnload = this.handleUnload.bind(this);
    this.listenerAdded = false; 
  }

  /**
   * Called when the plugin is enabled.
   * Reads current status, sets status to online, and registers unload listener.
   */
  start() {
    console.log("[AutoOffline] Plugin started");
    this.currentUserStatus = this.getCurrentStatus();
    this.setStatus("online");

    // Add unload listener only once to prevent duplicate calls
    if (!this.listenerAdded) {
      window.addEventListener("beforeunload", this.handleUnload);
      this.listenerAdded = true;
    }
  }

  /**
   * Called when the plugin is disabled.
   * Sets status to invisible and removes the unload listener.
   */
  stop() {
    console.log("[AutoOffline] Plugin stopped");
    this.setStatus(this.currentUserStatus);

    // Remove the unload listener if it was added
    if (this.listenerAdded) {
      window.removeEventListener("beforeunload", this.handleUnload);
      this.listenerAdded = false;
    }
  }

  /**
   * Event handler for the window "beforeunload" event.
   * Ensures the status is set to invisible when the app is closed.
   */
  handleUnload() {
    console.log("[AutoOffline] handleUnload triggered");
    this.setStatus("invisible");
  }

  /**
   * Safely retrieves the user's current status from the settings store.
   * @returns {string} The current status or "offline" if not available.
   */
  getCurrentStatus() {
    try {
      const statusValue = UserSettingsProtoStore.settings.status.status.value;
      console.log("[AutoOffline] Current status:", statusValue);
      return statusValue;
    } catch (error) {
      console.error("[AutoOffline] Error reading current status", error);
      UI.showToast("Error reading status, defaulting to offline", { type: "error" });
      return "offline";
    }
  }

  /**
   * Updates the user's status if it differs from the current one.
   * @param {"online"|"idle"|"invisible"|"dnd"} newStatus - The status to set.
   */
  setStatus(newStatus) {
    console.log(
      `[AutoOffline] setStatus called with newStatus='${newStatus}', current='${this.currentUserStatus}'`
    );

    // Skip if status is unchanged
    if (newStatus === this.currentUserStatus) return;

    try {
      UserSettingsProtoUtils.updateAsync(
        "status",
        setting => { setting.status.value = newStatus; },
        UPDATE_PRIORITY
      );

      // Update local cache and notify success
      this.currentUserStatus = newStatus;
      console.log("[AutoOffline] Status successfully updated to", newStatus);
      UI.showToast(`Status changed: ${newStatus}`, { type: "success" });
    } catch (error) {
      console.error("[AutoOffline] Error updating status", error);
      UI.showToast("Error updating status", { type: "error" });
    }
  }
};

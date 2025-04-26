/**
 * @name AutoOffline
 * @version 1.0.0
 * @author Kamiikaze
 * @authorId 141851936168214528
 * @description Automatically sets your Discord status to online on app start and invisible on app quit.
 */
 
 /**
 * The module for accessing user settings.
 * @typedef {Object} UserSettingsProtoStore
 * @property {Object} settings - The user settings object.
 */
const UserSettingsProtoStore = BdApi.Webpack.getModule(
	(m) =>
		m && typeof m.getName == "function" && m.getName() == "UserSettingsProtoStore" && m,
	{ first: true, searchExports: true }
);
 
/**
 * Utility functions for updating user settings.
 * @typedef {Object} UserSettingsProtoUtils
 * @property {Function} updateAsync - Asynchronously updates a user setting.
 */
const UserSettingsProtoUtils = BdApi.Webpack.getModule(
	(m) => m?.ProtoClass?.typeName?.endsWith(".PreloadedUserSettings"),
	{ first: true, searchExports: true }
);
 
module.exports = class AutoOffline {
	constructor(meta) {
		this.meta = meta;
		this.currentUserStatus = null
	}
	
	start() {
		const targetStatus = 'online' 
		this.currentUserStatus = this.currentStatus()
		
		this.updateStatus('online')
		
		// Adding EventListener for App closing
		window.addEventListener('beforeunload', () => {
			this.updateStatus('invisible');
		});
	}

	stop() {
		this.updateStatus('invisible')
	}
	
	currentStatus() {
		try {
			return UserSettingsProtoStore.settings.status.status.value;
		} catch (error) {
			console.error("ERRORS.ERROR_GETTING_CURRENT_USER_STATUS", error);
			BdApi.UI.showToast("ERRORS.ERROR_GETTING_CURRENT_USER_STATUS", {type:"error"});
			return "";
		}
	}
	
	updateStatus(toStatus) {
		if (toStatus == this.currentUserStatus) return;
			
		try {
			UserSettingsProtoUtils.updateAsync(
				"status",
				(statusSetting) => {
					statusSetting.status.value = toStatus;
				},
				0
			);
			BdApi.UI.showToast("Status changed: " + toStatus, {type:"success"});
		} catch (error) {
			console.error("ERRORS.ERROR_UPDATING_USER_STATUS", error);
			BdApi.UI.showToast("ERRORS.ERROR_UPDATING_USER_STATUS", {type:"error"});
		}
	}
};

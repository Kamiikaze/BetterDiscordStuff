/**
 * @name AutoOffline
 * @version 1.0.1
 * @author Kamiikaze
 * @authorId 141851936168214528
 * @description Automatically sets your Discord status to online on app start and invisible on app quit.
 */


const UserSettingsProtoStore = BdApi.Webpack.getStore("UserSettingsProtoStore");
 
const UserSettingsProtoUtils = BdApi.Webpack.getModule(
	(m) => m?.ProtoClass?.typeName?.endsWith(".PreloadedUserSettings"),
	{ first: true, searchExports: true }
);


module.exports = class AutoOffline {
	constructor(meta) {
		this.meta = meta;
		this.currentUserStatus = 'invisible'
		this.listenerAdded = false;
		this.handleUnload = this.handleUnload.bind(this);
	}
	
	start() {
		console.log("[AutoOffline] Plugin started");
		this.currentUserStatus = this.getCurrentStatus();
		this.updateStatus("online");
		
		if (!this.listenerAdded) {
			window.addEventListener("beforeunload", this.handleUnload);
		}
	}

	stop() {
		console.log("[AutoOffline] Plugin stopped");
		
		if (this.listenerAdded) {
			window.removeEventListener("beforeunload", this.handleUnload);
			this.listenerAdded = false;
		}
	}
	
	handleUnload() {
		this.updateStatus("invisible");
	}
	
	getCurrentStatus() {
		try {
			return UserSettingsProtoStore.settings.status.status.value;
		} catch (error) {
			console.error("ERRORS.ERROR_GETTING_CURRENT_USER_STATUS", error);
			return "invisible";
		}
	}
	
	updateStatus(newStatus) {
		if (newStatus == this.currentUserStatus) return;
			
		try {
			UserSettingsProtoUtils.updateAsync(
				"status",
				(statusSetting) => {
					statusSetting.status.value = newStatus;
				},
				0
			);
			BdApi.UI.showToast("Status changed: " + newStatus, {type:"success"});
		} catch (error) {
			console.error("ERRORS.ERROR_UPDATING_USER_STATUS", error);
		}
	}
};

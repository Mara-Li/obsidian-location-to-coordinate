import { Plugin, Modal } from "obsidian";

import { resources, translationLanguage } from "./i18n";
import i18next from "i18next";

import { LocationToCoordinateSettings, DEFAULT_SETTINGS } from "./interfaces";
import { LocationToCoordinateSettingTab } from "./settings";

export default class LocationToCoordinate extends Plugin {
	settings!: LocationToCoordinateSettings;

	async onload() {
		console.log(`[${this.manifest.name}] Loaded`);

		await this.loadSettings();

		//load i18next
		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources,
			returnNull: false,
			returnEmptyString: false,
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LocationToCoordinateSettingTab(this.app, this));
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

import i18next from "i18next";
import { Plugin } from "obsidian";
import { resources, translationLanguage } from "./i18n";

import { DEFAULT_SETTINGS, type Settings } from "./interfaces";
import SettingTab from "./settings";
import {merge} from "ts-deepmerge";

export default class LocationToCoordinate extends Plugin {
	settings!: Settings;

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
		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
	}

	async loadSettings() {
		//we have nested keys so Object.assign doesn't do a deep merge
		//this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		//we need to do a deep merge with ts-deepmerge
		this.settings = merge(DEFAULT_SETTINGS, await this.loadData() as Settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

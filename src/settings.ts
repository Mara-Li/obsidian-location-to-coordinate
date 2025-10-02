import {type App, Component, MarkdownRenderer, PluginSettingTab, Setting} from "obsidian";
import type LocationToCoordinate from "./main";
import "./i18n/obsidian-i18n";
import dedent from "dedent";
import i18next from "i18next";
export class SettingTab extends PluginSettingTab {
	plugin: LocationToCoordinate;

	constructor(app: App, plugin: LocationToCoordinate) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.addClass("loc-to-coord-settings");

		new Setting(containerEl)
			.setNames("inputKeys.header")
			.setHeading()
		
		const t= new Setting(containerEl)
			.setNames("inputKeys.mode.name")
			.setClass("mode")
			.addDropdown((d) =>
				d
					.addOption("simple", i18next.t("inputKeys.mode.options.simple"))
					.addOption("template", i18next.t("inputKeys.mode.options.template"))
					.setValue(this.plugin.settings.inputKeys.mode)
					.onChange(async (value) => {
						this.plugin.settings.inputKeys.mode = value as "simple" | "template";
						await this.plugin.saveSettings();
						await this.display();
					})
			)
		
		const component = new Component()
		await MarkdownRenderer.render(this.app, dedent(`${i18next.t("inputKeys.mode.desc")}`), t.descEl, "", component)
		component.onunload();
		
		if (this.plugin.settings.inputKeys.mode === "simple") {
			new Setting(containerEl)
				.setNames("inputKeys.simpleKey.name")
				.addText(
					(text) =>
						text
							.setValue(this.plugin.settings.inputKeys.simpleKey)
							.setPlaceholders("inputKeys.simpleKey.placeholder")
							.onChange(async (value) => {
								this.plugin.settings.inputKeys.simpleKey = value;
								await this.plugin.saveSettings();
							})
				)
		}
	}
}

import {type App, Component, MarkdownRenderer, PluginSettingTab, sanitizeHTMLToDom, Setting} from "obsidian";
import type LocationToCoordinate from "./main";
import "./i18n/obsidian-i18n";
import dedent from "dedent";
import i18next from "i18next";
class SettingTab extends PluginSettingTab {
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
		
		const inputSettings= new Setting(containerEl)
			.setNames("mode")
			.setClass("mode")
			.addDropdown((d) =>
				d
					.addOption("simple", i18next.t("simple"))
					.addOption("template", i18next.t("template"))
					.setValue(this.plugin.settings.inputKeys.mode)
					.onChange(async (value) => {
						this.plugin.settings.inputKeys.mode = value as "simple" | "template";
						await this.plugin.saveSettings();
						await this.display();
					})
			)
		
		const component = new Component()
		await MarkdownRenderer.render(this.app, dedent(`${i18next.t("inputKeys.desc")}`), inputSettings.descEl, "", component)
		component.onunload();
		
		if (this.plugin.settings.inputKeys.mode === "simple") {
			new Setting(containerEl)
				.setNames("keyName")
				.addText(
					(text) =>
						text
							.setValue(this.plugin.settings.inputKeys.simpleKey)
							.setPlaceholders("simpleKey.placeholder")
							.onChange(async (value) => {
								this.plugin.settings.inputKeys.simpleKey = value;
								await this.plugin.saveSettings();
							})
				);
		}
		else {
			new Setting(containerEl)
				.setNames("template")
				.setDesc(sanitizeHTMLToDom(`${i18next.t("inputKeys.template")}`))
				.addText(
					(text) =>
						text
							.setValue(this.plugin.settings.inputKeys.template)
							.setPlaceholders("inputKeys.template.placeholder")
							.onChange(async (value) => {
								this.plugin.settings.inputKeys.template = value;
								await this.plugin.saveSettings();
							})
				);
			
		}
		new Setting(containerEl)
				.setNames("object.name")
				.setDescs("object.desc")
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.inputKeys.object)
						.onChange(async (value) => {
							this.plugin.settings.inputKeys.object = value;
							await this.plugin.saveSettings();
						})
				);
		
		/**
		 * Output Format
		 */
		new Setting(containerEl)
			.setNames("outputFormat.header")
			.setHeading()
		
		const outputSettings= new Setting(containerEl)
			.setNames("mode")
			.setClass("mode")
			.addDropdown((d) =>
				d
					.addOption("simple", i18next.t("simple"))
					.addOption("multiple", i18next.t("template"))
					.setValue(this.plugin.settings.outputFormat.mode)
					.onChange(async (value) => {
						this.plugin.settings.outputFormat.mode = value as "simple" | "template";
						await this.plugin.saveSettings();
						await this.display();
					})
			)
		const component2 = new Component()
		await MarkdownRenderer.render(this.app, dedent(`${i18next.t("outputFormat.desc")}`), outputSettings.descEl, "", component2)
		component2.onunload();
		
		if (this.plugin.settings.outputFormat.mode === "simple") {
			new Setting(containerEl)
				.setNames("latitude.name")
				.addText(
					(text) =>
						text
							.setValue(this.plugin.settings.outputFormat.simpleKey.latitude)
							.setPlaceholders("latitude.placeholder")
							.onChange(async (value) => {
								this.plugin.settings.outputFormat.simpleKey.latitude = value;
								await this.plugin.saveSettings();
							})
				);
			
			new Setting(containerEl)
				.setNames("longitude.name")
				.addText(
					(text) =>
						text
							.setValue(this.plugin.settings.outputFormat.simpleKey.longitude)
							.setPlaceholders("longitude.placeholder")
							.onChange(async (value) => {
								this.plugin.settings.outputFormat.simpleKey.longitude = value;
								await this.plugin.saveSettings();
							})
				);
		} else {
			new Setting(containerEl)
				.setNames("keyName")
				.addText(
					(text) =>
						text
							.setValue(this.plugin.settings.outputFormat.template.key)
							.setPlaceholders("outputFormat.keyName")
							.onChange(async (value) => {
								this.plugin.settings.outputFormat.template.key = value;
								await this.plugin.saveSettings();
							})
				);
			
			const codeKeys = {
				latitude: `<code>{latitude}</code>`,
				longitude: `<code>{longitude}</code>`
			}
			
			new Setting(containerEl)
				.setNames("template")
				.setDesc(sanitizeHTMLToDom(`${i18next.t("outputFormat.template", {code:codeKeys})}`))
				.addText(
					(text) =>
						text
							.setValue(this.plugin.settings.outputFormat.template.value)
							.setPlaceholders("outputFormat.template.placeholder")
							.onChange(async (value) => {
								this.plugin.settings.outputFormat.template.value = value;
							})
				);
		}
		new Setting(containerEl)
				.setNames("object.name")
				.setDescs("object.desc")
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.outputFormat.object)
						.onChange(async (value) => {
							this.plugin.settings.outputFormat.object = value;
							await this.plugin.saveSettings();
						})
				);
		
	}
}

export default SettingTab;

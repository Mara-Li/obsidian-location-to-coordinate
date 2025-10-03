import i18next from "i18next";
import { Notice, Plugin, TFile } from "obsidian";
import { merge } from "ts-deepmerge";
import { FrontMatterUtils } from "./frontmatter";
import { resources, translationLanguage } from "./i18n";
import { DEFAULT_SETTINGS, type Settings } from "./interfaces";
import SettingTab from "./settings";

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

		this.addCommand({
			id: "insert-coordinate-at-file",
			name: i18next.t("command.insertAtFile"),
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				const frontmatter = file
					? this.app.metadataCache.getFileCache(file)?.frontmatter
					: null;
				if (file && frontmatter) {
					if (!checking) {
						this.insertLocation(file);
					}
					return true;
				}
				return false;
			},
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!(file instanceof TFile)) return; //only files
				const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
				if (!frontmatter) return; //fail silently if no frontmatter
				menu.addItem((item) => {
					item.setTitle(i18next.t("command.insertAtFile"));
					item.setIcon("map-pin");
					item.onClick(() => this.insertLocation(file));
				});
			})
		);

		/**
		 * Process all files in the vault
		 */
		this.addCommand({
			id: "insert-coordinate-in-all-files",
			name: i18next.t("command.insertInAllFiles"),
			callback: async () => {
				const files = this.app.vault.getMarkdownFiles();
				const totalFiles = files.length;
				let processedFiles = 0;
				//create a loading notice
				const notice = new Notice(i18next.t("processing"), 0);
				for (const file of files) {
					processedFiles++;
					notice.setMessage(
						i18next.t("processingFile", { progress: `${processedFiles}/${totalFiles}` })
					);
					await this.insertLocation(file);
				}
				notice.setMessage(i18next.t("done"));
				setTimeout(() => notice.hide(), 2000);
			},
		});
	}

	async insertLocation(file: TFile) {
		//get the frontmatter of the file
		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		if (!frontmatter) return; //fail silently if no frontmatter
		const fmUtils = new FrontMatterUtils(this.settings, frontmatter, this.app);
		try {
			const coord = await fmUtils.extractLocation();
			console.log(coord);
			//insert the coordinate into the frontmatter
			await fmUtils.insertCoordinate(coord, file);
		} catch (e) {
			console.error(e);
			new Notice(`${i18next.t("error")}: ${(e as Error).message}`);
		}
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
	}

	async loadSettings() {
		const data = (await this.loadData()) as Settings | null | undefined;
		this.settings = merge(
			DEFAULT_SETTINGS,
			(data ?? {}) as Partial<Settings>
		) as Settings;
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

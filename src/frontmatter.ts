/**
 * Utilities function to handle frontmatter in markdown files.
 */
import type { App, FrontMatterCache, TFile } from "obsidian";
import type { Coordinate, Settings } from "./interfaces";
import { getCoordinate, getNestedKey } from "./utils";

export class FrontMatterUtils {
	settings: Settings;
	frontmatter: FrontMatterCache;
	app: App;
	constructor(settings: Settings, frontmatter: FrontMatterCache, app: App) {
		this.settings = settings;
		this.frontmatter = frontmatter;
		this.app = app;
	}

	private getSimpleKey(): string | null {
		const key = this.settings.inputKeys.simpleKey;
		if (this.settings.inputKeys.object) {
			const nestedKeys = getNestedKey(key, this.frontmatter);
			return nestedKeys ? String(nestedKeys) : null;
		}
		return this.frontmatter[key] ? String(this.frontmatter[key]) : null;
	}

	private createTemplate(): string | null {
		let template = this.settings.inputKeys.template;
		const regex = /{([^}]+)}/g;
		let match;
		// biome-ignore lint/suspicious/noAssignInExpressions: easy way to loop through all matches
		while ((match = regex.exec(this.settings.inputKeys.template)) !== null) {
			const placeholder = match[0]; // e.g., "{address}"
			const key = match[1];
			let value: string | null = null;
			if (this.settings.inputKeys.object) {
				const nestedKeys = getNestedKey(key, this.frontmatter);
				value = nestedKeys ? String(nestedKeys) : null;
			} else value = this.frontmatter[key] ? String(this.frontmatter[key]) : null;
			//pass if value is null or empty
			if (!value) continue;
			template = template.replace(placeholder, value);
		}
		//if after replacing, there is still { or }, return null
		if (template.includes("{") || template.includes("}")) return null; //incomplete template or missing keys

		return template.trim() === "" ? null : template;
	}

	private getLocation(): string | null {
		if (this.settings.inputKeys.mode === "simple") return this.getSimpleKey();
		else return this.createTemplate();
	}

	public async extractLocation(): Promise<Coordinate> {
		const location = this.getLocation();
		if (!location) throw new Error("Location not found in frontmatter.");
		//get the coordinate from nominatim
		const res = await getCoordinate(location);
		if (!res) throw new Error("Unable to get coordinate from location.");
		return res;
	}

	private async setSimple(coordinate: Coordinate, file: TFile) {
		const longitudeKey = this.settings.outputFormat.simpleKey.longitude;
		const latitudeKey = this.settings.outputFormat.simpleKey.latitude;
		if (this.settings.outputFormat.object) {
			//we need to set the key in the frontmatter as an object if it doesn't exist
			await this.setNestedKey(latitudeKey, coordinate.latitude, file);
			await this.setNestedKey(longitudeKey, coordinate.longitude, file);
		} else {
			await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
				frontmatter[latitudeKey] = coordinate.latitude;
				frontmatter[longitudeKey] = coordinate.longitude;
			});
		}
	}

	//use  Obsidian api to set nested key
	private async setNestedKey(path: string, value: any, file: TFile) {
		const keys = path.split(".");
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			let current = frontmatter;
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if (i === keys.length - 1) current[key] = value;
				else {
					if (typeof current[key] !== "object" || current[key] === null) {
						current[key] = {};
					}
					current = current[key];
				}
			}
		});
	}

	private async setTemplate(coordinate: Coordinate, file: TFile) {
		let value = this.settings.outputFormat.template.value;
		//we can only have {latitude} and {longitude} as placeholders
		value = value.replace(/{latitude}/g, `${coordinate.latitude}`);
		value = value.replace(/{longitude}/g, `${coordinate.longitude}`);
		if (this.settings.outputFormat.object) {
			const key = this.settings.outputFormat.template.key;
			await this.setNestedKey(key, value, file);
		} else {
			await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
				frontmatter[this.settings.outputFormat.template.key] = value;
			});
		}
	}

	public async insertCoordinate(coordinate: Coordinate, file: TFile) {
		if (this.settings.outputFormat.mode === "simple")
			await this.setSimple(coordinate, file);
		else await this.setTemplate(coordinate, file);
	}
}

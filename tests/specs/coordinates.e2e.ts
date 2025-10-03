import { browser, expect } from "@wdio/globals";
import * as fs from "fs";
import * as path from "path";
import { obsidianPage } from "wdio-obsidian-service";

const manifest = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, "..", "..", "manifest.json"), "utf-8")
) as { id: string; name: string; version: string };

const expectedEiffel = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, "..", "expected", "eiffel.json"), "utf-8")
) as { latRange: [number, number]; lonRange: [number, number] };

async function getFrontmatter(filePathInVault: string) {
	return await browser.executeObsidian(({ app, obsidian }, filePath) => {
		const file = app.vault.getAbstractFileByPath(filePath);
		if (file instanceof obsidian.TFile) {
			return app.metadataCache.getFileCache(file)?.frontmatter ?? null;
		}
		return null;
	}, filePathInVault);
}

async function ensurePluginReady() {
	// Wait until plugin is loaded and command is registered
	await browser.waitUntil(
		async () =>
			await browser.executeObsidian(({ app }, pluginId) => {
				const plugin: any = app.plugins.getPlugin(pluginId);
				const hasSettings = !!plugin && !!plugin.settings;
				const cmdId = `${pluginId}:insert-coordinate-at-file`;
				const hasCommand =
					!!(app as any).commands?.commands?.[cmdId] ||
					(app as any).commands.listCommands().some((c: any) => c.id === cmdId);
				return hasSettings && hasCommand;
			}, manifest.id),
		{ timeout: 30000, interval: 250 }
	);
}

async function openAsActiveFile(filePathInVault: string) {
	await browser.executeObsidian(async ({ app, obsidian }, filePath) => {
		const file = app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof obsidian.TFile)) throw new Error(`No file ${filePath}`);
		const leaf = app.workspace.getLeaf(true);
		await leaf.openFile(file);
		(app.workspace as any).setActiveLeaf?.(leaf, true, true);
	}, filePathInVault);
}

describe("Coordinates insertion", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault();
		await ensurePluginReady();
	});

	it("should insert lat/lon in simple mode (default) for places/simple.md", async function () {
		const filePath = "places/simple.md";
		await openAsActiveFile(filePath);

		await browser.executeObsidianCommand(`${manifest.id}:insert-coordinate-at-file`);

		// wait for metadata cache update
		await browser.waitUntil(
			async () => {
				const fm = await getFrontmatter(filePath);
				return (
					!!fm && typeof fm.latitude === "number" && typeof fm.longitude === "number"
				);
			},
			{ timeout: 20000, interval: 250 }
		);

		const fm = await getFrontmatter(filePath);
		expect(fm).not.toBeNull();
		if (!fm) return;
		expect(typeof fm.latitude).toBe("number");
		expect(typeof fm.longitude).toBe("number");
		expect(fm.latitude).toBeGreaterThanOrEqual(expectedEiffel.latRange[0]);
		expect(fm.latitude).toBeLessThanOrEqual(expectedEiffel.latRange[1]);
		expect(fm.longitude).toBeGreaterThanOrEqual(expectedEiffel.lonRange[0]);
		expect(fm.longitude).toBeLessThanOrEqual(expectedEiffel.lonRange[1]);
	});

	it("should support template input and nested output keys", async function () {
		await ensurePluginReady();
		// Switch to template input and nested output keys
		await browser.executeObsidian(({ app }, pluginId) => {
			const plugin: any = app.plugins.getPlugin(pluginId);
			plugin.settings.inputKeys.mode = "template";
			plugin.settings.inputKeys.object = false;
			plugin.settings.inputKeys.template = "{address}, {city}, {state}";

			plugin.settings.outputFormat.mode = "simple";
			plugin.settings.outputFormat.object = true;
			plugin.settings.outputFormat.simpleKey.latitude = "geo.lat";
			plugin.settings.outputFormat.simpleKey.longitude = "geo.lon";
		}, manifest.id);

		const filePath = "places/template.md";
		await openAsActiveFile(filePath);
		await browser.executeObsidianCommand(`${manifest.id}:insert-coordinate-at-file`);

		await browser.waitUntil(
			async () => {
				const fm = await getFrontmatter(filePath);
				return (
					!!fm &&
					typeof (fm.geo?.lat as any) === "number" &&
					typeof (fm.geo?.lon as any) === "number"
				);
			},
			{ timeout: 20000, interval: 250 }
		);

		const fm = await getFrontmatter(filePath);
		expect(fm).not.toBeNull();
		if (!fm) return;
		expect(fm.geo).toBeDefined();
		expect(typeof fm.geo.lat).toBe("number");
		expect(typeof fm.geo.lon).toBe("number");
		expect(fm.geo.lat).toBeGreaterThanOrEqual(expectedEiffel.latRange[0]);
		expect(fm.geo.lat).toBeLessThanOrEqual(expectedEiffel.latRange[1]);
		expect(fm.geo.lon).toBeGreaterThanOrEqual(expectedEiffel.lonRange[0]);
		expect(fm.geo.lon).toBeLessThanOrEqual(expectedEiffel.lonRange[1]);
	});
});

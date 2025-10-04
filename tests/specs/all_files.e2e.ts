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
	await browser.waitUntil(
		async () =>
			await browser.executeObsidian(({ app }, pluginId) => {
				const plugin: any = app.plugins.getPlugin(pluginId);
				const hasSettings = !!plugin && !!plugin.settings;
				const cmdId = `${pluginId}:insert-coordinate-in-all-files`;
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

describe("Insert into all files and edge cases", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault();
		await ensurePluginReady();
	});

	it("should disable single-file command when no frontmatter is present", async function () {
		const filePath = "Welcome.md";
		await openAsActiveFile(filePath);

		const isAvailable = await browser.executeObsidian(({ app }, pluginId) => {
			const cmdId = `${pluginId}:insert-coordinate-at-file`;
			const cmd = (app as any).commands?.commands?.[cmdId];
			if (!cmd || typeof cmd.checkCallback !== "function") return false;
			return cmd.checkCallback(true) === true;
		}, manifest.id);

		expect(isAvailable).toBe(false);
	});

	it("should process all files, insert coordinates where possible, and skip others silently", async function () {
		await browser.executeObsidianCommand(`${manifest.id}:insert-coordinate-in-all-files`);

		// Wait until at least simple.md gets updated with lat/lon
		await browser.waitUntil(
			async () => {
				const fm = await getFrontmatter("places/simple.md");
				return (
					!!fm && typeof fm?.latitude === "number" && typeof fm?.longitude === "number"
				);
			},
			{ timeout: 30000, interval: 300 }
		);

		// Validate simple.md
		const fmSimple = await getFrontmatter("places/simple.md");
		expect(fmSimple).not.toBeNull();
		if (fmSimple) {
			expect(typeof fmSimple.latitude).toBe("number");
			expect(typeof fmSimple.longitude).toBe("number");
			expect(fmSimple.latitude).toBeGreaterThanOrEqual(expectedEiffel.latRange[0]);
			expect(fmSimple.latitude).toBeLessThanOrEqual(expectedEiffel.latRange[1]);
			expect(fmSimple.longitude).toBeGreaterThanOrEqual(expectedEiffel.lonRange[0]);
			expect(fmSimple.longitude).toBeLessThanOrEqual(expectedEiffel.lonRange[1]);
		}

		// Validate template.md also gets coordinates with default simple input key (address)
		const fmTemplate = await getFrontmatter("places/template.md");
		expect(fmTemplate).not.toBeNull();
		if (fmTemplate) {
			expect(typeof fmTemplate.latitude).toBe("number");
			expect(typeof fmTemplate.longitude).toBe("number");
			expect(fmTemplate.latitude).toBeGreaterThanOrEqual(expectedEiffel.latRange[0]);
			expect(fmTemplate.latitude).toBeLessThanOrEqual(expectedEiffel.latRange[1]);
			expect(fmTemplate.longitude).toBeGreaterThanOrEqual(expectedEiffel.lonRange[0]);
			expect(fmTemplate.longitude).toBeLessThanOrEqual(expectedEiffel.lonRange[1]);
		}

		// Files without frontmatter should remain without frontmatter
		const fmWelcome = await getFrontmatter("Welcome.md");
		expect(fmWelcome).toBeNull();

		// Files with frontmatter but without location should not gain coordinates
		const fmNoLocation = await getFrontmatter("places/no-location.md");
		expect(fmNoLocation).not.toBeNull();
		if (fmNoLocation) {
			expect(fmNoLocation.latitude).toBeUndefined();
			expect(fmNoLocation.longitude).toBeUndefined();
		}

		// Files with empty address should not gain coordinates
		const fmEmpty = await getFrontmatter("places/empty-address.md");
		expect(fmEmpty).not.toBeNull();
		if (fmEmpty) {
			expect(fmEmpty.latitude).toBeUndefined();
			expect(fmEmpty.longitude).toBeUndefined();
		}
	});
});

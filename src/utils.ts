import { type PluginManifest, requestUrl } from "obsidian";
import type { Coordinate } from "./interfaces";

export function getNestedKey(key: string, obj: Record<string, any>): any {
	const keys = key.split(".");
	let current: any = obj;

	for (const k of keys) {
		if (current[k] === undefined) return undefined;

		current = current[k];
	}
	return current;
}

// Simple promise-based rate limiter to ensure only one Nominatim request per second globally
let lastRequestTimestamp = 0;
let requestQueue: Promise<unknown> = Promise.resolve();

async function runWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
	const run = async () => {
		const now = Date.now();
		const elapsed = now - lastRequestTimestamp;
		const waitMs = lastRequestTimestamp ? Math.max(0, 1000 - elapsed) : 0;
		// biome-ignore lint/correctness/noUndeclaredVariables: sleep is a global function in Obsidian
		if (waitMs > 0) await sleep(waitMs);
		lastRequestTimestamp = Date.now();
		return fn();
	};

	const current = requestQueue.then(run);
	// Keep the queue alive regardless of success/failure
	requestQueue = current.then(
		() => void 0,
		() => void 0
	);
	return current as Promise<T>;
}

export async function getCoordinate(
	location: string,
	manifest: PluginManifest
): Promise<Coordinate | null> {
	//use obsidian requestUrl to get the coordinate from nominatim, respecting the rate limit
	const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(location)}&addressdetails=1&limit=1`;
	const response = await runWithRateLimit(() =>
		requestUrl({
			url,
			headers: {
				"User-Agent": `obsidian-geocoder/${manifest.version} (https://github.com/mara-li/obsidian-geocoder)`,
			},
		})
	);
	if (!response.status || response.status !== 200) {
		throw new Error(
			`Error fetching data from Nominatim: ${response.status} ${response.status}`
		);
	}
	const data = response.json;
	if (!data || data.length === 0) return null;
	return {
		latitude: convertToNumber(data[0].lat),
		longitude: convertToNumber(data[0].lon),
	};
}

function convertToNumber(value: any): number | any {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const num = parseFloat(value);
		return isNaN(num) ? value : num;
	}
	return value;
}

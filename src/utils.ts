import { requestUrl } from "obsidian";
import type { Coordinate } from "./interfaces";

export function getNestedKey(key: string, obj: Record<string, any>): any {
	const keys = key.split(".");
	let current: any = obj;

	for (const k of keys) {
		if (current[k] === undefined) {
			return undefined;
		}
		current = current[k];
	}
	return current;
}

export async function getCoordinate(location: string): Promise<Coordinate | null> {
	//use obsidian requestUrl to get the coordinate from nominatim
	const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(location)}&addressdetails=1&limit=1`;
	const response = await requestUrl(url);
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

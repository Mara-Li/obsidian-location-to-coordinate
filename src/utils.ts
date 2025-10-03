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

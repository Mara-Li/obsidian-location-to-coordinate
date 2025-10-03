export interface Settings {
	/**
	 * To get the properties names, they are two modes:
	 * - Simple key (aka one properties to get the entire location): "123 Main St, Springfield, IL"
	 * - Template mode (aka multiple properties to get the entire location): "{address}, {city}, {state}"
	 */
	inputKeys: {
		mode: "simple" | "template";
		simpleKey: string;
		template: string;
		/**
		 * If true, the `.` in the template will be replaced by the `inputKeys.template` value.
		 */
		object: boolean;
	},
	outputFormat : {
		/**
		 * If true, the `.` in the outputFormat will be replaced by the `outputFormat.keyName` value.
		 */
		object: boolean;
		/**
		 * If "simple", will use two keys: `latitude` and `longitude`.
		 * If multiple, allow to use one keys for the coordinate, in the form of a template: `{latitude}, {longitude}`.
		 */
		mode: "simple" | "template";
		simpleKey: {
			latitude: string;
			longitude: string;
		};
		template: {
			key: string;
			value: string;
		}
	}
}

export const DEFAULT_SETTINGS: Settings = {
	inputKeys: {
		mode: "simple",
		simpleKey: "address",
		object: false,
		template: "{address}, {city}, {state}"
	},
	outputFormat: {
		object: false,
		mode: "simple",
		simpleKey: {
			latitude: "latitude",
			longitude: "longitude"
		},
		template: {
			key: "coordinates",
			value: "{latitude}, {longitude}"
		}
	}
};

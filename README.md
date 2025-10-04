# Location To Coordinate

Fetch geographic coordinates (latitude and longitude) from a location described in your note’s frontmatter, then write the result back into the frontmatter.

- Geocoding provider: OpenStreetMap Nominatim (no API key required)
- Works with a single property (simple mode) or by combining multiple properties (template mode)
- Output as two numeric keys or as a single templated string
- Supports nested frontmatter keys (dot notation)


## Quick start

1) Ensure your Markdown file has YAML frontmatter and contains address information (either as one field or multiple fields).
2) Open the settings for “Location To Coordinate” and configure:
   - Input keys (Simple or Template)
   - Output keys (Simple or Template)
   - Whether you use nested keys (Object toggle)
3) Open a note with frontmatter and run the command:
   - Command palette → “Enter the coordinates for the current file”
4) The plugin calls Nominatim to resolve the coordinates and writes them to your configured output keys.

If a location can’t be resolved (or a template placeholder can’t be replaced), you’ll see a notice with the error.


## Examples

### A) Simple input → Simple output
Frontmatter before:

```md
---
address: "1600 Amphitheatre Parkway, Mountain View, CA"
---
```
Settings:
- Input keys → Mode: Simple, Key name: `address`
- Output keys → Mode: Simple, Latitude key: `latitude`, Longitude key: `longitude`

Frontmatter after running the command (example values):
```md
---
address: "1600 Amphitheatre Parkway, Mountain View, CA"
latitude: 37.42205
longitude: -122.08410
---
```

### B) Template input (nested) → Simple output
Frontmatter before:

```md
---
place:
  street: "5 Avenue Anatole France"
  city: "Paris"
  postcode: "75007"
  country: "France"
---
```

Settings:
- Input keys → Mode: Template, Template: `{place.street}, {place.city}, {place.postcode}, {place.country}`
- Input keys → Object: ON (allows `{place.street}` with dot notation)
- Output keys → Mode: Simple, Latitude key: `geo.lat`, Longitude key: `geo.lon`
- Output keys → Object: ON (writes into nested keys)

Frontmatter after (example values):

```md
---
place:
  street: "5 Avenue Anatole France"
  city: "Paris"
  postcode: "75007"
  country: "France"
geo:
  lat: 48.85837
  lon: 2.29448
---
```

### C) Any input → Template output
Want a single string with both coordinates.

Settings:
- Output keys → Mode: Template
- Key name: `coordinates`
- Template value: `{latitude}, {longitude}`

Frontmatter after (example values):

```md
---
coordinates: "48.85837, 2.29448"
---
```

## Settings

The plugin settings have two main sections.

### 1) Input keys
- Mode
  - Simple: The full address is stored in one property (default key: `address`).
  - Template: Build the address from multiple properties using `{placeholder}` syntax, e.g. `{street}, {city}, {state}`.
- Key name (Simple)
  - Name of the single field that contains the whole address.
- Template (Template)
  - A string with placeholders wrapped in `{}`, for example: `{street}, {city}, {country}`.
  - All placeholders must resolve to values; otherwise you’ll get an error.
- Object (nested key support)
  - ON: You can use dot notation to read nested keys in frontmatter (e.g. `{place.street}` or `place.street` in Simple mode).

### 2) Output keys
- Mode
  - Simple: Write two numeric keys for latitude and longitude.
  - Template: Write a single key whose value is built from a template string.
- Simple mode fields
  - Latitude key (default: `latitude`)
  - Longitude key (default: `longitude`)
- Template mode fields
  - Key name (default: `coordinates`)
  - Template value supports the placeholders `{latitude}` and `{longitude}`
- Object (nested key support)
  - ON: Write into nested keys using dot notation (e.g. `geo.lat`, `geo.lon`, or `location.coords`).


## Command
- Enter the coordinates for the current file
  - Only available when the active note has YAML frontmatter.
  - On success, coordinates are added/updated in frontmatter according to your output settings.

- Enter the coordinates for all files
  - Processes every Markdown file in your vault.
  - For each file with YAML frontmatter, coordinates are added/updated according to your output settings.
  - Progress is shown in a notice during the operation.

- Enter the coordinates for all files in a specific folder
  - Lets you select a folder; all Markdown files in that folder are processed.
  - For each file with YAML frontmatter, coordinates are added/updated according to your output settings.

### Strict mode
- When enabled in the Input keys settings, strict mode requires all template fields to be present and non-empty in the frontmatter.
- If any required field is missing or empty, the command will not send a geocoding request and will not update the coordinates.
- This ensures only notes with complete location information are processed.


## How it works (under the hood)
- The plugin reads your note’s frontmatter to build a location string (Simple or Template).
- It sends one request to OpenStreetMap Nominatim to fetch coordinates for that location.
- It writes the result back to frontmatter using your chosen output format.


## Privacy and data
- The location string you construct from frontmatter is sent to OpenStreetMap Nominatim to perform geocoding.
- No API keys are used or stored by this plugin.
- Please use Nominatim responsibly and in accordance with their usage policy: https://operations.osmfoundation.org/policies/nominatim/

## Installation

- [ ] From Obsidian's community plugins
- [x] Using BRAT with `https://github.com/Mara-Li/obsidian-location-to-coordinate`
- [x] From the release page: 
    - Download the latest release
    - Unzip `location-to-coordinate.zip` in `.obsidian/plugins/` path
    - In Obsidian settings, reload the plugin
    - Enable the plugin

## Translations
- [x] English
- [x] French
- To add a new translation:
  1. Create a new JSON file in `src/i18n/locales`, e.g. `de.json`.
  2. Copy the keys from `src/i18n/locales/en.json` and translate the values.
  3. Edit `src/i18n/index.ts`:
     - `import <lang> from "./locales/<lang>.json";`
     - Add it to `resources`: `<lang>: { translation: <lang> }`

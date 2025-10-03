import { type App, FuzzySuggestModal, TFolder } from "obsidian";

export class SelectFolderModal extends FuzzySuggestModal<TFolder> {
	onSubmit: (folder: TFolder) => void;
	constructor(app: App, onSubmit: (folder: TFolder) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	getItems(): TFolder[] {
		return this.app.vault
			.getAllLoadedFiles()
			.filter((f) => f instanceof TFolder) as TFolder[];
	}

	getItemText(item: TFolder): string {
		return item.path;
	}

	onChooseItem(item: TFolder, evt: MouseEvent | KeyboardEvent): void {
		this.onSubmit(item);
	}
}

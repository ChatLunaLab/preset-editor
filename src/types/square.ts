export interface SquarePresetData {
    name: string;
    keywords: string[];
    rawPath: string;
    description?: string;
    rating?: number;
    modified: number;
    tags?: string[];
    sha1: string;
    relativePath: string;
    type: "main" | "character";
}

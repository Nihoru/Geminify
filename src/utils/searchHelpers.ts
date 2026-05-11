export type SortOption = "relevance" | "calories" | "protein" | "fat" | "carbs";

export interface SearchableItem {
    baseName?: string;
    brand?: string;
    specs?: string;
    title?: string;
    calories: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    macros?: { p: number; f: number; c: number };
}

export const calculateRelevanceScore = (
    item: SearchableItem,
    query: string,
    words: string[],
): number => {
    let score = 0;
    const itemName = (item.baseName || item.title || "").toLowerCase();
    const brand = (item.brand || "").toLowerCase();
    const specs = (item.specs || "").toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Приоритет 1: Точное совпадение основного названия
    if (itemName === lowerQuery) score += 1000;
    // Приоритет 2: Название начинается с запроса
    else if (itemName.startsWith(lowerQuery)) score += 500;
    // Приоритет 3: Бренд начинается с запроса
    else if (brand.startsWith(lowerQuery)) score += 400;

    // Приоритет 4: Совпадение слов в начале токенов названия/бренда
    const nameWords = itemName.split(/\s+/);
    const brandWords = brand.split(/\s+/);

    words.forEach((word) => {
        const lowerWord = word.toLowerCase();
        if (nameWords.some((w) => w.startsWith(lowerWord))) score += 100;
        if (brandWords.some((w) => w.startsWith(lowerWord))) score += 50;
    });

    // Приоритет 5: Вхождение запроса в характеристики
    if (specs.includes(lowerQuery)) score += 10;

    return score;
};

export const sortItems = <T extends SearchableItem>(
    items: T[] | Realm.Results<T>,
    query: string,
    sortBy: SortOption,
    descending: boolean = true,
): T[] => {
    const trimmedQuery = query.trim().toLowerCase();
    const words = trimmedQuery.split(/\s+/).filter(Boolean);

    const result = Array.from(items);

    return result.sort((a, b) => {
        if (sortBy === "relevance") {
            if (trimmedQuery === "") {
                const nameA = a.baseName || a.title || "";
                const nameB = b.baseName || b.title || "";
                return nameA.localeCompare(nameB);
            }
            const scoreA = calculateRelevanceScore(a, trimmedQuery, words);
            const scoreB = calculateRelevanceScore(b, trimmedQuery, words);
            if (scoreA !== scoreB) return scoreB - scoreA;
            const nameA = a.baseName || a.title || "";
            const nameB = b.baseName || b.title || "";
            return nameA.localeCompare(nameB);
        }

        let valA = 0;
        let valB = 0;

        switch (sortBy) {
            case "calories":
                valA = a.calories;
                valB = b.calories;
                break;
            case "protein":
                valA = a.protein ?? a.macros?.p ?? 0;
                valB = b.protein ?? b.macros?.p ?? 0;
                break;
            case "fat":
                valA = a.fat ?? a.macros?.f ?? 0;
                valB = b.fat ?? b.macros?.f ?? 0;
                break;
            case "carbs":
                valA = a.carbs ?? a.macros?.c ?? 0;
                valB = b.carbs ?? b.macros?.c ?? 0;
                break;
        }

        if (valA === valB) {
            const nameA = a.baseName || a.title || "";
            const nameB = b.baseName || b.title || "";
            return nameA.localeCompare(nameB);
        }

        return descending ? valB - valA : valA - valB;
    });
};

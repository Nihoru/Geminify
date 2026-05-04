import Fuse from "fuse.js";
import localFoodDB from "../assets/food_db.json";

const PENALTY_WEIGHTS = [0.0, 0.15, 0.3];
const FULL_THRESHOLD = 0.55; // Мягкий порог для длинных запросов
const BASE_THRESHOLD = 0.45; // Строгий порог для базовых слов

export class FoodSearchService {
    private fuseFull: Fuse<any>;
    private fuseBase: Fuse<any>;

    constructor() {
        // Подготавливаем базу
        const searchableDB = localFoodDB.map((item: any) => ({
            ...item,
            fullName:
                `${item.base_name || ""} ${item.specs || ""} ${item.brand || ""}`.trim(),
        }));

        // 1. Поиск для сложных запросов (Уровни 0 и 1)
        this.fuseFull = new Fuse(searchableDB, {
            keys: ["fullName"],
            includeScore: true,
            threshold: FULL_THRESHOLD,
            ignoreLocation: true,
            useExtendedSearch: true,
            ignoreFieldNorm: true, // ПРОЩАЕМ длинные specs!
        });

        // 2. Поиск ТОЛЬКО по базовому названию (Уровень 2)
        this.fuseBase = new Fuse(searchableDB, {
            keys: ["base_name"],
            includeScore: true,
            threshold: BASE_THRESHOLD,
            ignoreLocation: true,
            useExtendedSearch: true,
            ignoreFieldNorm: false, // ШТРАФУЕМ за лишние слова (защита от "рахат-лукума")
        });
    }

    public findBestMatch(
        itemName: string,
        searchQueries: string[] | undefined,
    ) {
        console.log(
            `  - Ингредиент: "${itemName}". Запуск каскадного поиска OpenFood...`,
        );

        let bestGlobalMatch: any = null;
        let bestGlobalScore = 1.0;

        const queries = Array.isArray(searchQueries)
            ? searchQueries
            : [itemName];

        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            const cascadePenalty =
                PENALTY_WEIGHTS[i] !== undefined ? PENALTY_WEIGHTS[i] : 0.4;

            // Если это базовый уровень [2] — переключаемся на строгий поиск только по base_name
            const isBaseLevel = i === 2;
            const fuseInstance = isBaseLevel ? this.fuseBase : this.fuseFull;
            const currentThreshold = isBaseLevel
                ? BASE_THRESHOLD
                : FULL_THRESHOLD;

            const searchResults = fuseInstance.search(query);

            if (searchResults.length > 0) {
                const match = searchResults[0];
                const rawScore = match.score!;

                if (rawScore <= currentThreshold) {
                    const penalizedScore = rawScore + cascadePenalty;

                    console.log(
                        `      🔍 Уровень [${i}] ("${query}"): найден "${match.item.fullName}" (Raw: ${rawScore.toFixed(3)}, Итог: ${penalizedScore.toFixed(3)})`,
                    );

                    if (penalizedScore < bestGlobalScore) {
                        bestGlobalScore = penalizedScore;
                        bestGlobalMatch = match.item;
                    }
                } else {
                    console.log(
                        `      ❌ Уровень [${i}] ("${query}"): найдено "${match.item.base_name}", но score (${rawScore.toFixed(3)}) хуже порога.`,
                    );
                }
            } else {
                console.log(
                    `      ❌ Уровень [${i}] ("${query}"): ничего не найдено.`,
                );
            }
        }

        if (bestGlobalMatch) {
            console.log(
                `    ✅ ПОБЕДИТЕЛЬ OpenFood: "${bestGlobalMatch.base_name} ${bestGlobalMatch.specs || ""}" (Итоговый score: ${bestGlobalScore.toFixed(3)}).`,
            );
        } else {
            console.log(`    ⚠️ В локальной БД (OpenFood) ничего не подошло.`);
        }

        return { match: bestGlobalMatch, score: bestGlobalScore };
    }
}

export const foodSearchService = new FoodSearchService();

import Fuse from "fuse.js";
import localFoodDB from "../assets/food_db.json";

const PENALTY_WEIGHTS = [0.0, 0.15, 0.3];
const BASE_THRESHOLD = 0.45; // Ослабленный порог, чтобы прощать мелкие опечатки и синонимы

export class FoodSearchService {
    private fuse: Fuse<any>;

    constructor() {
        // 1. Создаем виртуальное поле fullName для идеального поиска
        const searchableDB = localFoodDB.map((item: any) => ({
            ...item,
            // Склеиваем: "пряник тульский со сгущенным молоком Ясная Поляна"
            fullName:
                `${item.base_name || ""} ${item.specs || ""} ${item.brand || ""}`.trim(),
        }));

        // 2. Инициализируем Fuse
        this.fuse = new Fuse(searchableDB, {
            keys: ["fullName"], // Ищем по нашей склеенной строке
            includeScore: true,
            threshold: BASE_THRESHOLD,
            ignoreLocation: true,
            useExtendedSearch: true,
            ignoreFieldNorm: false, // Отключаем штраф за длину строки
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

            // 1. Получаем сырые результаты от Fuse.js
            const rawSearchResults = this.fuse.search(query);

            // 2. УМНЫЙ ФИЛЬТР: защищаем только короткие базовые слова
            const searchResults = rawSearchResults.filter((match) => {
                const dbItemName = match.item.fullName.toLowerCase();
                const queryWords = query.toLowerCase().trim().split(/\s+/);

                // Срабатываем ТОЛЬКО если запрос состоит из одного короткого слова (<= 4 букв)
                // Это спасет "лук" от "рахат-лукума", но не будет мешать сложным запросам
                if (queryWords.length === 1 && queryWords[0].length <= 4) {
                    const qw = queryWords[0];
                    // [^a-zа-яё0-9] означает: границей слова является любой символ, КРОМЕ букв и цифр
                    const regex = new RegExp(
                        `(^|[^a-zа-яё0-9])${qw}([^a-zа-яё0-9]|$)`,
                    );
                    return regex.test(dbItemName);
                }

                // Во всех остальных случаях (длинные слова, цифры, много слов)
                // мы полностью доверяем алгоритму Fuse.js
                return true;
            });

            if (searchResults.length > 0) {
                const match = searchResults[0];
                const rawScore = match.score!;

                if (rawScore <= BASE_THRESHOLD) {
                    const penalizedScore = rawScore + cascadePenalty;

                    console.log(
                        `      🔍 Уровень [${i}] ("${query}"): найден "${match.item.fullName}". Raw: ${rawScore.toFixed(3)}, Итог: ${penalizedScore.toFixed(3)}`,
                    );

                    if (penalizedScore < bestGlobalScore) {
                        bestGlobalScore = penalizedScore;
                        bestGlobalMatch = match.item;
                    }
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

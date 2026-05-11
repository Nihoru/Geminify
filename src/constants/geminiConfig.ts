import { Schema, SchemaType } from "@google/generative-ai";

const SKURIKHIN_CATEGORIES = [
    "Баранина",
    "Блюда и гарниры из картофеля",
    "Блюда из молока и творога",
    "Борщи",
    "Брюква",
    "Говядина",
    "Голубцы овощные",
    "Горбуша",
    "Желе",
    "Жерех",
    "Зубан",
    "Зубатка пятнистая",
    "Индейка",
    "Кабачки",
    "Камбала дальневосточная",
    "Капуста белокачанная",
    "Капуста белокачанная квашеная",
    "Капуста цветная",
    "Карась",
    "Карп",
    "Картофельные и овощные супы",
    "Каша геркулесовая",
    "Каша гречневая",
    "Каша манная",
    "Каша овсяная",
    "Каша перловая",
    "Каша пшениичная",
    "Каша пшеничная",
    "Каша пшенная",
    "Каша рисовая",
    "Каша ячневая",
    "Кисель",
    "Компот",
    "Кролик",
    "Куры",
    "Ледяная",
    "Лещ",
    "Лук репчатый",
    "Макароны высшего сорта, вермишель высшего сорта",
    "Макрель",
    "Макрурус",
    "Мероу",
    "Минтай",
    "Морковь",
    "Мусс",
    "Мучные изделия",
    "Навага дальневосточная",
    "Налим",
    "Напитки",
    "Нототения",
    "Окунь морской",
    "Омлеты",
    "Палтус чёрный",
    "Петрушка",
    "Пристипома",
    "Путассу",
    "Рассольник",
    "Репа",
    "Рыба-сабля",
    "Салана",
    "Сардина океаническая",
    "Свекла",
    "Свинина",
    "Сельдерей",
    "Скумбрия",
    "Сом амурский",
    "Ставрица",
    "Субпродукты",
    "Судак",
    "Супы молочные",
    "Супы с макаронными изделиями, домашней лапшой, крупой и бобовыми",
    "Супы-пюре",
    "Терпуг",
    "Треска",
    "Тыква",
    "Утята",
    "Хек",
    "Цыплята",
    "Щи",
    "Щука",
    "Яичницы",
    "Яйца куриные",
];

export const getFoodAnalysisPrompt = (textPrompt: string): string => {
    return `You are an expert culinary analyzer. Group the input into distinct dishes, and break down each home-cooked dish into raw ingredients.

Analyzed text: "${textPrompt}"

Strict Instructions:
1. Hierarchy: First, identify the distinct dishes (e.g., "Борщ", "Салат Цезарь", "Сникерс"). 
2. Deconstruction: 
   - For home-cooked meals, provide the list of atomic ingredients inside that dish.
   - For standard commercial products, complex pastries, or fast-food, treat the dish itself as a single ingredient. Put the commercial name in 'dishName' and duplicate it in the single 'ingredient' name. DO NOT break it down into flour, sugar, etc.
3. Naming Rule: For ingredient names, output the base product followed by its specific type in Russian (e.g., "курица грудка", "рис бурый").
4. Cascade Search Rule: Provide a 'searchQueries' array with EXACTLY 3 descending levels of detail in Russian.
   - STRICT FORMATTING: Omit ALL prepositions (с, со, без, из). Use canonical dictionary names (e.g., "сгущенное молоко" instead of "сгущенка", "картофель" instead of "картошка"). Do NOT use adjectives like "варёной" if it's just a flavor descriptor, stick to the base noun.
   - [0] Highly Specific: Brand + Core product + Flavor (e.g., "ясная поляна пряник тульский сгущенное молоко").
   - [1] Generic: Core product + Flavor (e.g., "пряник тульский сгущенное молоко").
   - [2] Base: Core product (e.g., "пряник").
   CRITICAL FOR PLAIN FOODS: If the item is completely unflavored (e.g., plain milk, plain cottage cheese, black tea), DO NOT invent or append adjectives like "классический" or "натуральный" unless the user explicitly typed them. Just output the base product name (e.g., "творог мягкий", "чай черный"). Let the search algorithm handle the matching.
5. Liquid Meal Rule: If the user logs a PORTION of a liquid dish without giving the exact recipe, automatically include 'вода' or 'бульон' as an ingredient using standard culinary ratios (e.g., soups 70-80% water).
6. AI Fallback Macros: Estimate realistic raw nutritional values per 100 grams for each ingredient.
7. Weight Distribution Rule (COOKED WEIGHT): The user input represents the weight of the ALREADY COOKED dish. You must distribute this total cooked weight among the 'ingredients'. The sum of all ingredient 'weight' values MUST exactly equal the total weight provided by the user. Do NOT estimate raw weights.
8. Thermal Processing & Skurikhin Losses: 
   - Determine the 'preparationMethod' (e.g., "варка", "жарка", "тушение", "запекание", "без обработки") for the dish and each ingredient.
   - Provide 'estimated_dish_loss' with percentages of loss for mass, proteins, fats, carbs, and energy value based on standard culinary science (Skurikhin methodology).
   - CRITICAL: Mass gain (e.g., boiling pasta or grains that absorb water) MUST be represented as a NEGATIVE 'mass_loss_percent' (e.g., -150). All other values remain standard percentages.
9. Database Routing (searchTarget): 
   - Assign "skurikhin" if the item is a basic agricultural product, whole food (e.g., fresh apple, raw meat, plain rice, vegetables), or a basic component of a home-cooked dish.
   - Assign "openfood" ONLY if the item is a specific commercial brand, fast-food item, or complex store-bought product (e.g., "Snickers", "Big Mac", "Lay's chips").

Skurikhin Database Categories (SELECT ONE FOR EACH DISH):
${SKURIKHIN_CATEGORIES.join(", ")}
Return data strictly matching the JSON schema.`;
};

export const extractionSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        mealName: { type: SchemaType.STRING },
        dishes: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    dishCategory: {
                        type: SchemaType.STRING,
                        description:
                            "Exact category from the provided Skurikhin list",
                    },
                    dishName: { type: SchemaType.STRING },
                    preparationMethod: {
                        type: SchemaType.STRING,
                        description:
                            "General preparation method for the whole dish, e.g., варка, жарка, без обработки",
                    },
                    estimated_dish_loss: {
                        type: SchemaType.OBJECT,
                        description:
                            "Estimated loss percentages based on Skurikhin. Use negative mass_loss_percent for items that absorb water.",
                        properties: {
                            mass_loss_percent: { type: SchemaType.NUMBER },
                            proteins_loss_percent: { type: SchemaType.NUMBER },
                            fats_loss_percent: { type: SchemaType.NUMBER },
                            carbohydrates_loss_percent: {
                                type: SchemaType.NUMBER,
                            },
                            energy_value_loss_percent: {
                                type: SchemaType.NUMBER,
                            },
                        },
                        required: [
                            "mass_loss_percent",
                            "proteins_loss_percent",
                            "fats_loss_percent",
                            "carbohydrates_loss_percent",
                            "energy_value_loss_percent",
                        ],
                    },
                    ingredients: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                category: {
                                    type: SchemaType.STRING,
                                    description:
                                        "Exact category from the provided Skurikhin list",
                                },
                                name: { type: SchemaType.STRING },
                                searchTarget: {
                                    type: SchemaType.STRING,
                                    description:
                                        "MUST BE 'skurikhin' for all raw ingredients, whole foods (fruits, vegetables, meats, grains), and home-cooked meal parts. MUST BE 'openfood' ONLY for commercial branded products (e.g., Snickers, Coca-Cola), fast food, or complex store-bought ready meals.",
                                },
                                preparationMethod: {
                                    type: SchemaType.STRING,
                                    description:
                                        "Specific preparation method for this ingredient, e.g., пассерование, отваривание, сырой",
                                },
                                searchQueries: {
                                    type: SchemaType.ARRAY,
                                    items: { type: SchemaType.STRING },
                                    description:
                                        "Array of exactly 3 search queries ordered from specific to broad.",
                                },
                                weight: { type: SchemaType.INTEGER },
                                calories_per_100g: { type: SchemaType.INTEGER },
                                protein_per_100g: { type: SchemaType.INTEGER },
                                fat_per_100g: { type: SchemaType.INTEGER },
                                carbs_per_100g: { type: SchemaType.INTEGER },
                            },
                            required: [
                                "name",
                                "searchTarget",
                                "preparationMethod",
                                "searchQueries",
                                "weight",
                                "calories_per_100g",
                                "protein_per_100g",
                                "fat_per_100g",
                                "carbs_per_100g",
                            ],
                        },
                    },
                },
                required: [
                    "dishName",
                    "preparationMethod",
                    "estimated_dish_loss",
                    "ingredients",
                ],
            },
        },
    },
    required: ["mealName", "dishes"],
};

export const getAiAdvicePrompt = (
    stats: { calories: number; protein: number; fat: number; carbs: number },
    limits: { calories: number; protein: number; fat: number; carbs: number },
    mealCount: number,
): string => {
    return `You are a professional nutritionist. Analyze the user's daily nutritional intake and provide a short, helpful advice for the rest of the day.

Current intake:
- Calories: ${stats.calories} / ${limits.calories} kcal
- Proteins: ${stats.protein} / ${limits.protein} g
- Fats: ${stats.fat} / ${limits.fat} g
- Carbs: ${stats.carbs} / ${limits.carbs} g
- Meals logged: ${mealCount}

Instructions:
1. Provide a concise advice (max 30 words).
2. No "fluff" or empty phrases.
3. Give specific recommendations on what macros to focus on or limit for the remaining meals.
4. Style: User-friendly, encouraging, and professional.
5. Language: Russian.

Example: "Вы набрали норму белка. На ужин сфокусируйтесь на сложных углеводах, например, гречке, чтобы восполнить энергию в рамках калорийности."`;
};

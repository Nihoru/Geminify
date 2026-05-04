import { Realm, createRealmContext } from "@realm/react";

// 1. Самый нижний уровень - атомарный ингредиент
export class Ingredient extends Realm.Object<Ingredient> {
    name!: string;
    cookedWeight!: number; // Заменили старый weight
    rawWeightEstimated!: number; // Новое поле (восстановленный сырой вес)
    calories!: number;
    protein!: number;
    fat!: number;
    carbs!: number;

    static schema: Realm.ObjectSchema = {
        name: "Ingredient",
        embedded: true,
        properties: {
            name: "string",
            cookedWeight: "int",
            rawWeightEstimated: "int",
            calories: "int",
            protein: "int",
            fat: "int",
            carbs: "int",
        },
    };
}

// 2. Средний уровень - блюдо
export class Dish extends Realm.Object<Dish> {
    name!: string;
    preparationMethod?: string; // Опциональное поле (со знаком ?)
    totalWeight!: number;
    totalCalories!: number;
    totalProtein!: number;
    totalFat!: number;
    totalCarbs!: number;
    ingredients!: Realm.List<Ingredient>;

    static schema: Realm.ObjectSchema = {
        name: "Dish",
        embedded: true,
        properties: {
            name: "string",
            preparationMethod: "string?", // Знак вопроса означает optional
            totalWeight: "int",
            totalCalories: "int",
            totalProtein: "int",
            totalFat: "int",
            totalCarbs: "int",
            ingredients: "Ingredient[]",
        },
    };
}

// 3. Верхний уровень - весь прием пищи
export class Meal extends Realm.Object<Meal> {
    _id!: Realm.BSON.ObjectId;
    mealName!: string;
    createdAt!: Date;
    totalWeight!: number; // Новое поле для всего приема пищи
    totalCalories!: number;
    totalProtein!: number;
    totalFat!: number;
    totalCarbs!: number;
    dishes!: Realm.List<Dish>;

    static schema: Realm.ObjectSchema = {
        name: "Meal",
        primaryKey: "_id",
        properties: {
            _id: { type: "objectId", default: () => new Realm.BSON.ObjectId() },
            mealName: "string",
            createdAt: { type: "date", default: () => new Date() },
            totalWeight: { type: "int", default: 0 }, // Защита для старых данных
            totalCalories: "int",
            totalProtein: "int",
            totalFat: "int",
            totalCarbs: "int",
            dishes: "Dish[]",
        },
    };
}

export const MealRealmContext = createRealmContext({
    schema: [Meal, Dish, Ingredient],
    schemaVersion: 3,
    onMigration: (oldRealm, newRealm) => {
        if (oldRealm.schemaVersion < 3) {
            // Итерируем по всем приемам пищи (они имеют Primary Key и их можно запрашивать)
            const oldMeals = oldRealm.objects("Meal");
            const newMeals = newRealm.objects<Meal>("Meal");

            for (let i = 0; i < oldMeals.length; i++) {
                const oldMeal = oldMeals[i] as any;
                const newMeal = newMeals[i];

                // Перебираем блюда внутри приема пищи
                for (let j = 0; j < oldMeal.dishes.length; j++) {
                    const oldDish = oldMeal.dishes[j];
                    const newDish = newMeal.dishes[j];

                    // Перебираем ингредиенты внутри блюда
                    for (let k = 0; k < oldDish.ingredients.length; k++) {
                        const oldIng = oldDish.ingredients[k];
                        const newIng = newDish.ingredients[k];

                        // Берем старый вес и записываем в оба новых поля
                        const oldWeight = oldIng.weight || 0;
                        newIng.cookedWeight = oldWeight;
                        newIng.rawWeightEstimated = oldWeight;
                    }
                }
            }
        }
    },
});

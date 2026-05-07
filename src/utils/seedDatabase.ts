import Realm from "realm";
import localFoodDB from "../assets/food_db.json";

export const seedFoodDatabase = (realm: Realm) => {
    // Проверяем, есть ли уже продукты в базе
    const existingProducts = realm.objects("FoodProduct");

    if (existingProducts.length === 0) {
        console.log("[App] Инициализация базы продуктов из JSON...");

        // Открываем транзакцию на запись
        realm.write(() => {
            localFoodDB.forEach((item: any) => {
                realm.create("FoodProduct", {
                    brand: item.brand || "",
                    baseName: item.base_name || "",
                    specs: item.specs || "",
                    // Приводим все числа к Number на случай, если в JSON закралась строка
                    calories: Number(item.calories) || 0,
                    protein: Number(item.protein) || 0,
                    fat: Number(item.fat) || 0,
                    carbs: Number(item.carbs) || 0,
                    barcode: item.barcode || "",
                });
            });
        });

        console.log(
            `[App] Успешно загружено ${localFoodDB.length} продуктов в Realm!`,
        );
    } else {
        console.log(
            `[App] База продуктов уже содержит ${existingProducts.length} записей. Пропускаем инициализацию.`,
        );
    }
};

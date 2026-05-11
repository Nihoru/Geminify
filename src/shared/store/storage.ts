import * as SecureStore from "expo-secure-store";

export const STORAGE_KEYS = {
    GEMINI_API_KEY: "gemini_api_key",
    GEMINI_MODEL: "gemini_model",
    USER_PROFILE: "user_profile",
    MACRO_LIMITS: "macro_limits",
    AI_ADVICE: "ai_advice",
};

export const storage = {
    getString: async (key: string) => {
        return await SecureStore.getItemAsync(key);
    },
    set: async (key: string, value: string) => {
        await SecureStore.setItemAsync(key, value);
    },
    getBoolean: async (key: string) => {
        const value = await SecureStore.getItemAsync(key);
        return value === "true";
    },
    setBoolean: async (key: string, value: boolean) => {
        await SecureStore.setItemAsync(key, value ? "true" : "false");
    },

    getObject: async <T>(key: string): Promise<T | null> => {
        try {
            const value = await SecureStore.getItemAsync(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Ошибка при чтении ${key} из хранилища:`, error);
            return null;
        }
    },
    setObject: async (key: string, value: object) => {
        try {
            await SecureStore.setItemAsync(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Ошибка при записи ${key} в хранилище:`, error);
        }
    },
};

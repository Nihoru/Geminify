import * as SecureStore from "expo-secure-store";

export const STORAGE_KEYS = {
    GEMINI_API_KEY: "gemini_api_key",
    GEMINI_MODEL: "gemini_model",
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
};

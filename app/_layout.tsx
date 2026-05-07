import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import "react-native-get-random-values";
import {
    MD3DarkTheme,
    MD3LightTheme,
    PaperProvider,
    adaptNavigationTheme,
} from "react-native-paper";
import { registerTranslation, ru } from "react-native-paper-dates";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initVectorDB } from "../src/services/vectorSearch";
import { MealRealmContext } from "../src/shared/store/models";
registerTranslation("ru", ru);

// 1. ИМПОРТЫ ДЛЯ ЖЕСТОВ И ШТОРОК
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// 2. НОВЫЕ ИМПОРТЫ ДЛЯ ИНИЦИАЛИЗАЦИИ БАЗ ДАННЫХ
import { seedFoodDatabase } from "../src/utils/seedDatabase";
// Раскомментируй эту строку, если перенесешь инициализацию векторов из index.tsx:
// import { initVectorDB } from "../src/services/vectorSearch";

SplashScreen.preventAutoHideAsync();

// Вытаскиваем useRealm для нашего невидимого компонента
const { RealmProvider, useRealm } = MealRealmContext;

// 3. НОВЫЙ КОМПОНЕНТ-ИНИЦИАЛИЗАТОР
function AppInitializer() {
    const realm = useRealm();

    useEffect(() => {
        // Загружаем продукты в Realm (произойдет только один раз, если база пустая)
        seedFoodDatabase(realm);

        // Инициализируем векторные базы (здесь им самое место — на уровне всего приложения)
        initVectorDB().catch(console.error);
    }, [realm]);

    return null; // Компонент ничего не рисует на экране, только выполняет логику
}

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [loaded, error] = useFonts({
        MaterialSymbolsRounded: require("../assets/fonts/MaterialSymbolsRounded-Regular.ttf"),
    });

    const { theme: systemTheme } = useMaterial3Theme();

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    const paperTheme = useMemo(() => {
        const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
        const dynamicColors = isDark ? systemTheme.dark : systemTheme.light;

        return {
            ...baseTheme,
            colors: {
                ...baseTheme.colors,
                ...dynamicColors,
            },
        };
    }, [isDark, systemTheme]);

    const navigationTheme = useMemo(() => {
        const { LightTheme, DarkTheme } = adaptNavigationTheme({
            reactNavigationLight: NavigationDefaultTheme,
            reactNavigationDark: NavigationDarkTheme,
            materialLight: paperTheme,
            materialDark: paperTheme,
        });

        return isDark ? DarkTheme : LightTheme;
    }, [isDark, paperTheme]);

    if (!loaded && !error) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <RealmProvider>
                    {/* 4. ВСТАВЛЯЕМ ИНИЦИАЛИЗАТОР ВНУТРЬ ПРОВАЙДЕРА REALM */}
                    <AppInitializer />

                    <PaperProvider theme={paperTheme}>
                        <BottomSheetModalProvider>
                            <StatusBar
                                style={isDark ? "light" : "dark"}
                                translucent
                                backgroundColor="transparent"
                            />
                            <ThemeProvider value={navigationTheme}>
                                <Stack screenOptions={{ headerShown: false }}>
                                    <Stack.Screen name="(tabs)" />
                                </Stack>
                            </ThemeProvider>
                        </BottomSheetModalProvider>
                    </PaperProvider>
                </RealmProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

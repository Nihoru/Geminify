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
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MealRealmContext } from "../src/shared/store/models";

// 1. ДОБАВЛЯЕМ ИМПОРТЫ ДЛЯ ЖЕСТОВ И ШТОРОК
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const { RealmProvider } = MealRealmContext;

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
        // 2. ОБЯЗАТЕЛЬНО оборачиваем всё в GestureHandlerRootView с flex: 1,
        // иначе свайпы шторки просто не будут регистрироваться
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <RealmProvider>
                    <PaperProvider theme={paperTheme}>
                        {/* 3. Добавляем провайдер для модальных шторок */}
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

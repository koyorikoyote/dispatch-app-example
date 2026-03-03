import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
export const STORAGE_KEYS = {
    TAB_FILTERS: "tab_filters",
    SWIPEABLE_PAGES_INDEX: "swipeable_pages_index",
    DATE_FILTER: "date_filter",
};

// Tab filters types
export interface TabFilters {
    inquiries: boolean;
    daily_record: boolean;
    interaction_records: boolean;
    complaint_details: boolean;
}

export const DEFAULT_TAB_FILTERS: TabFilters = {
    inquiries: true,
    daily_record: true,
    interaction_records: true,
    complaint_details: true,
};

/**
 * Save tab filter states to AsyncStorage
 */
export async function saveToggleStates(filters: TabFilters): Promise<void> {
    try {
        await AsyncStorage.setItem(
            STORAGE_KEYS.TAB_FILTERS,
            JSON.stringify(filters)
        );
    } catch (error) {
        console.error("Failed to save toggle states:", error);
        throw error;
    }
}

/**
 * Load tab filter states from AsyncStorage
 * Returns default state if no saved state exists or if data is corrupted
 */
export async function loadToggleStates(): Promise<TabFilters> {
    try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.TAB_FILTERS);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (isValidTabFilters(parsed)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Failed to load toggle states:", error);
    }
    // Return default state on any error or missing data
    return DEFAULT_TAB_FILTERS;
}

/**
 * Validate tab filters structure
 */
function isValidTabFilters(obj: any): obj is TabFilters {
    return (
        obj &&
        typeof obj === "object" &&
        typeof obj.inquiries === "boolean" &&
        typeof obj.daily_record === "boolean" &&
        typeof obj.interaction_records === "boolean" &&
        typeof obj.complaint_details === "boolean"
    );
}

// Date filter types
export type DateFilterMode = "last7days" | "month" | "year";

export interface DateFilterState {
    mode: DateFilterMode;
    month: number;
    year: number;
}

export async function saveDateFilter(filter: DateFilterState): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.DATE_FILTER, JSON.stringify(filter));
    } catch (error) {
        console.error("Failed to save date filter:", error);
    }
}

export async function loadDateFilter(): Promise<DateFilterState | null> {
    try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.DATE_FILTER);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed.mode === "string" && typeof parsed.month === "number" && typeof parsed.year === "number") {
                return parsed as DateFilterState;
            }
        }
    } catch (error) {
        console.error("Failed to load date filter:", error);
    }
    return null;
}

/**
 * Save current page index to AsyncStorage
 */
export async function saveNavigationState(pageIndex: number): Promise<void> {
    try {
        await AsyncStorage.setItem(
            STORAGE_KEYS.SWIPEABLE_PAGES_INDEX,
            pageIndex.toString()
        );
    } catch (error) {
        console.error("Failed to save navigation state:", error);
        throw error;
    }
}

/**
 * Load saved page index from AsyncStorage
 * Returns null if no saved state exists
 */
export async function loadNavigationState(): Promise<number | null> {
    try {
        const saved = await AsyncStorage.getItem(
            STORAGE_KEYS.SWIPEABLE_PAGES_INDEX
        );
        if (saved !== null) {
            const index = parseInt(saved, 10);
            if (!isNaN(index) && index >= 0) {
                return index;
            }
        }
    } catch (error) {
        console.error("Failed to load navigation state:", error);
    }
    return null;
}

/**
 * Clear all saved navigation and filter states
 * Called on logout to reset user preferences
 */
export async function clearAllSavedStates(): Promise<void> {
    try {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.TAB_FILTERS,
            STORAGE_KEYS.SWIPEABLE_PAGES_INDEX,
        ]);
    } catch (error) {
        console.error("Failed to clear saved states:", error);
        throw error;
    }
}

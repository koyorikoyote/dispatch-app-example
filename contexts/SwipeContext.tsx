import { createContext, useContext, useState, ReactNode } from "react"

interface SwipeContextType {
    isSwipeInProgress: boolean
    setSwipeInProgress: (inProgress: boolean) => void
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined)

export function SwipeProvider({ children }: { children: ReactNode }) {
    const [isSwipeInProgress, setSwipeInProgress] = useState(false)

    return (
        <SwipeContext.Provider value={{ isSwipeInProgress, setSwipeInProgress }}>
            {children}
        </SwipeContext.Provider>
    )
}

export function useSwipe() {
    const context = useContext(SwipeContext)
    if (!context) {
        throw new Error("useSwipe must be used within SwipeProvider")
    }
    return context
}

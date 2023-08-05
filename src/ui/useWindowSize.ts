import { useEffect, useState } from "react";

/**
 * React hook that returns the browser window size.
 */
export default function useWindowSize() {
    const [windowSize, setWindowSize] = useState(getSize);

    useEffect(() => {
        const onResize = debounce(() => setWindowSize(getSize()), 100);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return windowSize;
}

function getSize() {
    return { width: window.innerWidth, height: window.innerHeight };
}

function debounce(callback: () => void, delayMs: number) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            timeout = undefined;
            callback();
        }, delayMs);
    };
}

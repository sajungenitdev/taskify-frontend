import { useEffect, useRef } from "react";

export function useRefreshOnFocus(refetch: () => void) {
  const enabledRef = useRef(false);

  useEffect(() => {
    const onFocus = () => {
      if (enabledRef.current) {
        refetch();
      } else {
        enabledRef.current = true;
      }
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetch]);
}

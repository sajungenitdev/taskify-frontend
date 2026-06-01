"use client";

import { useEffect } from "react";

export default function HydrationFix() {
  useEffect(() => {
    // Remove extension-added attributes to prevent hydration mismatch
    const removeExtensionAttributes = () => {
      const attrsToRemove = [
        "data-new-gr-c-s-check-loaded",
        "data-gr-ext-installed",
        "data-grammarly",
        "data-grammarly-shadow-root",
      ];

      attrsToRemove.forEach((attr) => {
        document.body.removeAttribute(attr);
        document.documentElement.removeAttribute(attr);
      });
    };

    removeExtensionAttributes();

    // Also handle dynamically added attributes
    const observer = new MutationObserver(() => {
      removeExtensionAttributes();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        "data-new-gr-c-s-check-loaded",
        "data-gr-ext-installed",
      ],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

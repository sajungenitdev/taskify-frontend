// components/tasks/DependencyArrow.tsx
"use client";

import { useEffect, useRef } from "react";

interface DependencyArrowProps {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    type?: "FS" | "SS" | "FF" | "SF";
    isBlocked?: boolean;
}

export default function DependencyArrow({
    fromX,
    fromY,
    toX,
    toY,
    type = "FS",
    isBlocked = false,
}: DependencyArrowProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 10;
        const arrowSize = 8;

        // Calculate start and end points
        let startX = fromX + padding;
        let startY = fromY + 12;
        let endX = toX - padding;
        let endY = toY + 12;

        // Adjust for different dependency types
        switch (type) {
            case "SS":
                startX = fromX + padding;
                startY = fromY + 12;
                break;
            case "FF":
                endX = toX - padding;
                endY = toY + 12;
                break;
            case "SF":
                startX = fromX + padding;
                startY = fromY + 12;
                endX = toX - padding;
                endY = toY + 12;
                break;
            default: // FS
                break;
        }

        // Calculate angle for arrow
        const angle = Math.atan2(endY - startY, endX - startX);

        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = isBlocked ? "#ef4444" : "#6366f1";
        ctx.lineWidth = isBlocked ? 3 : 2;
        ctx.setLineDash(isBlocked ? [6, 4] : []);
        ctx.stroke();

        // Reset dash
        ctx.setLineDash([]);

        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = isBlocked ? "#ef4444" : "#6366f1";
        ctx.fill();

        // Draw dependency type label
        ctx.fillStyle = isBlocked ? "#ef4444" : "#6366f1";
        ctx.font = "10px sans-serif";
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2 - 10;
        ctx.fillText(type, midX - 10, midY);

        // If blocked, draw X mark
        if (isBlocked) {
            ctx.fillStyle = "#ef4444";
            ctx.font = "14px sans-serif";
            ctx.fillText("⚠️", (startX + endX) / 2 + 10, midY + 4);
        }
    }, [fromX, fromY, toX, toY, type, isBlocked]);

    return (
        <canvas
            ref={canvasRef}
            width={Math.abs(toX - fromX) + 40}
            height={40}
            className="absolute pointer-events-none"
            style={{
                left: Math.min(fromX, toX) - 20,
                top: fromY - 20,
                zIndex: 5,
            }}
        />
    );
}
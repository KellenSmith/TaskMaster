import { Stack } from "@mui/material";

interface CircleSectorProps {
    arcLength: number; // % of circle
    color: string;
    startOffset: number; // % of circle
    radius: number; // % of circle
    zIndex: number;
}

const CircleSector = ({ arcLength, color, startOffset, radius, zIndex }: CircleSectorProps) => {
    // Convert percents (0-100) to degrees (0-360)
    const arcDeg = Math.max(0, Math.min(360, arcLength * 3.6));
    const startDeg = startOffset * 3.6;

    if (arcLength <= 0) return null;

    return (
        <Stack
            sx={{
                // Use a conic-gradient to draw a pie-sector (wedge) of the circle.
                // The gradient fills from 0deg to arcDeg with the given color, the rest is transparent.
                background: `conic-gradient(from 0deg, ${color} 0deg ${arcDeg}deg, transparent ${arcDeg}deg 360deg)`,
                backgroundRepeat: "no-repeat",

                // Absolute positioning such that zIndex controls stacking
                // Parent (YearWheelDashboard) must be position: relative
                position: "absolute",
                zIndex: zIndex,
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) rotate(${startDeg}deg)`,
                // Make it a circle
                borderRadius: "50%",

                // Size of the event circle (radius prop is in percent of parent)
                height: `${2 * radius}%`,
                aspectRatio: 1,
            }}
        />
    );
};

export default CircleSector;

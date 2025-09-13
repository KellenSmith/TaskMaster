import React, { useCallback, useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Box, useTheme } from "@mui/material";

interface Props {
    containerRef: React.RefObject<HTMLDivElement>;
    markerDate: Dayjs;
    // eslint-disable-next-line no-unused-vars
    setMarkerDate: (d: Dayjs) => void;
    displayStartTime: Dayjs;
    zIndex: number;
}

const YearWheelMarker = ({
    containerRef,
    markerDate,
    setMarkerDate,
    displayStartTime,
    zIndex,
}: Props) => {
    const theme = useTheme();
    const [isDragging, setIsDragging] = useState(false);
    const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

    const pointerToDate = useCallback(
        (clientX: number, clientY: number) => {
            // Use the measured containerRect (client coordinates) so calculations match
            // the visual layout. If it's not measured yet, bail.
            if (!containerRect) return;
            const rect = containerRect;
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = clientX - cx;
            const dy = clientY - cy;
            const angleRad = Math.atan2(dy, dx);
            const angleDeg = (angleRad * (180 / Math.PI) + 360) % 360;

            // Map so top of the circle corresponds to 0° (start of year).
            // atan2() produces 270° for the screen-top direction, so subtract 270°.
            const angleDegShifted = (angleDeg - 270 + 360) % 360;

            const startOfYear = dayjs.utc(displayStartTime).startOf("year");
            const msInYear = dayjs.utc(startOfYear).add(1, "year").diff(startOfYear, "millisecond");
            const newMs = (angleDegShifted / 360) * msInYear;
            setMarkerDate(startOfYear.add(newMs, "millisecond"));
        },
        [containerRect, displayStartTime, setMarkerDate],
    );

    useEffect(() => {
        const onPointerMove = (e: PointerEvent) => {
            if (!isDragging) return;
            pointerToDate(e.clientX, e.clientY);
        };
        const onPointerUp = () => setIsDragging(false);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
        };
    }, [isDragging, pointerToDate]);

    // Measure the container as soon as the ref is attached. Use a small polling loop
    // (via requestAnimationFrame) to detect when the ref becomes available, then
    // attach a ResizeObserver so measurements stay up to date.
    useEffect(() => {
        let mounted = true;
        let rafId: number | null = null;
        let ro: ResizeObserver | null = null;

        const tryMeasure = () => {
            if (!mounted) return;
            if (containerRef.current) {
                setContainerRect(containerRef.current.getBoundingClientRect());
                ro = new ResizeObserver(() => {
                    if (containerRef.current)
                        setContainerRect(containerRef.current.getBoundingClientRect());
                });
                ro.observe(containerRef.current);
            } else {
                rafId = requestAnimationFrame(tryMeasure);
            }
        };

        tryMeasure();

        return () => {
            mounted = false;
            if (rafId) cancelAnimationFrame(rafId);
            if (ro) ro.disconnect();
        };
    }, [containerRef]);

    if (!containerRect) return null;

    const rect = containerRect;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Compute angle from markerDate relative to displayStartTime
    const startOfYear = dayjs.utc(displayStartTime).startOf("year");
    const msIntoYear = dayjs.utc(markerDate).diff(startOfYear, "millisecond");
    const msInYear = dayjs.utc(startOfYear).add(1, "year").diff(startOfYear, "millisecond");
    // Compute angle (degrees) for the marker. Add 270° so start-of-year is at the top.
    const angleDeg = ((msIntoYear / msInYear) * 360 + 270) % 360;

    // Convert angle to radians and compute position on a circle of 45% radius of container
    const angleRad = angleDeg * (Math.PI / 180);
    const radius = Math.min(rect.width, rect.height) * 0.45;
    const x = cx + radius * Math.cos(angleRad) - 8; // center the 16px marker
    const y = cy + radius * Math.sin(angleRad) - 8;
    const markerCenterX = x + 8;
    const markerCenterY = y + 8;

    return (
        <Box
            sx={{
                position: "absolute",
                left: 0,
                top: 0,
                zIndex: zIndex,
                width: "100%",
                aspectRatio: 1,
                pointerEvents: "none",
            }}
        >
            {/* line from center to marker */}
            <svg
                width={rect.width}
                height={rect.height}
                style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
            >
                <line
                    x1={cx}
                    y1={cy}
                    x2={markerCenterX}
                    y2={markerCenterY}
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                    strokeLinecap="round"
                    opacity={0.9}
                />
            </svg>
            {/* marker */}
            <Box
                onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.target as Element).setPointerCapture(e.pointerId);
                    setIsDragging(true);
                }}
                onPointerUp={(e) => {
                    e.stopPropagation();
                    (e.target as Element).releasePointerCapture(e.pointerId);
                    setIsDragging(false);
                }}
                onPointerMove={(e) => {
                    if (!isDragging) return;
                    pointerToDate(e.clientX, e.clientY);
                }}
                title={markerDate.format("YYYY-MM-DD")}
                sx={{
                    position: "absolute",
                    left: `${x}px`,
                    top: `${y}px`,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: theme.palette.error.main,
                    border: `2px solid ${theme.palette.error.dark}`,
                    boxShadow: "0 0 6px rgba(0,0,0,0.4)",
                    pointerEvents: "auto",
                    cursor: isDragging ? "grabbing" : "grab",
                    userSelect: "none",
                }}
            />
            {/* label */}
            <Box
                sx={{
                    position: "absolute",
                    left: `${x + 20}px`,
                    top: `${y - 8}px`,
                    pointerEvents: "auto",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    color: "#000",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
            >
                {markerDate.format("YYYY-MM-DD")}
            </Box>
        </Box>
    );
};

export default YearWheelMarker;

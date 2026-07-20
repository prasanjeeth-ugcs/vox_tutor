/**
 * ScoreRing — An animated circular progress ring that shows a score from 0–100.
 *
 * How the SVG ring math works:
 *   - We draw two concentric circles.
 *   - The background circle is always full (grey track).
 *   - The foreground circle uses `stroke-dasharray` and `stroke-dashoffset`
 *     to show only the percentage of the ring that matches the score.
 *
 * Props:
 *   score — A number from 0 to 100
 *   size  — The width/height of the SVG in pixels (default: 96)
 */
export default function ScoreRing({ score, size = 96 }) {
  // The radius of the ring (leaving 5px padding on each side for the stroke width)
  const radius = (size - 10) / 2;

  // The full circumference of the circle
  const circumference = 2 * Math.PI * radius;

  // How much of the circumference to "hide" — based on the score percentage
  // A score of 100 means offset = 0 (full ring visible)
  // A score of 0 means offset = circumference (ring completely hidden)
  const strokeOffset = circumference - (score / 100) * circumference;

  // Color changes based on score range
  const ringColor = score >= 75 ? '#10b981'  // green  — good score
                  : score >= 50 ? '#f59e0b'  // yellow — okay score
                  : '#ef4444';               // red    — poor score

  // Center coordinates
  const center = size / 2;

  return (
    <svg width={size} height={size}>
      {/* Background track (always full circle, grey) */}
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth="10"
      />

      {/* Foreground ring (shows the score percentage) */}
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeOffset}
        transform={`rotate(-90 ${center} ${center})`} // Start from top (12 o'clock position)
        style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} // Animate on load
      />

      {/* Score number shown in the center */}
      <text
        x="50%" y="50%"
        textAnchor="middle"
        dy="0.35em"
        fill={ringColor}
        fontSize={size * 0.22}
        fontFamily="Inter"
        fontWeight="700"
      >
        {score}
      </text>
    </svg>
  );
}

// file: src/components/ScoreDisplay.tsx
interface ScoreDisplayProps {
  score: number;
  summary: string[];
}

export default function ScoreDisplay({ score, summary }: ScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Assessment Score</h3>
        <div className={`
          px-4 py-2 rounded-full text-2xl font-bold
          ${getScoreColor(score)} ${getScoreBackground(score)}
        `}>
          {score}/100
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">Summary:</h4>
        <ul className="space-y-1 list-disc list-inside">
          {summary.map((point, index) => (
            <li key={index} className="text-sm text-gray-600">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
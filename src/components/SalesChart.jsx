import { useRef, useEffect } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default function SalesChart({ data, label, color }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy()
    if (!canvasRef.current || !data?.length) return

    const ctx = canvasRef.current.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, 200)
    gradient.addColorStop(0, (color || 'rgba(102,126,234,') + '0.4)')
    gradient.addColorStop(1, (color || 'rgba(102,126,234,') + '0.0)')

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: label || 'Value',
          data: data.map(d => d.value),
          borderColor: color || '#667eea',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: color || '#667eea',
          pointBorderColor: 'rgba(255,255,255,0.8)',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(17,22,56,0.95)',
            titleColor: '#fff',
            bodyColor: 'rgba(255,255,255,0.8)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11, family: 'Inter' } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11, family: 'Inter' } },
            beginAtZero: true,
          },
        },
        interaction: { intersect: false, mode: 'index' },
      },
    })

    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [data, label, color])

  return (
    <div className="chart-container">
      <canvas ref={canvasRef} />
    </div>
  )
}

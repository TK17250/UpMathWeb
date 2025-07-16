'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface ChartBarProps {
    data: Array<{
        name: string;
        count: number;
    }>;
    maxItems?: number;
}

export default function ChartBar({ data, maxItems }: ChartBarProps) {
    // Limit data to maxItems if specified
    const limitedData = maxItems ? data.slice(0, maxItems) : data;
    
    const chartData = {
        labels: limitedData.map(item => item.name),
        datasets: [
            {
                label: 'จำนวน',
                data: limitedData.map(item => item.count),
                backgroundColor: '#80ED99',
                borderColor: '#80ED99',
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 60, // Limit bar width
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        categoryPercentage: 0.8, // Reduce space between categories
        barPercentage: 0.7, // Reduce bar width within category
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#203D4F',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                borderColor: '#80ED99',
                borderWidth: 1,
                callbacks: {
                    label: function(context: any) {
                        const dataPoint = context.raw;
                        return `จำนวน: ${dataPoint}`;
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                display: false, // This removes the y-axis numbers
                grid: {
                    display: false,
                },
            },
            x: {
                ticks: {
                    color: '#FFFFFF',
                    font: {
                        size: 12,
                    },
                    maxRotation: 45,
                    minRotation: 0,
                },
                grid: {
                    display: false,
                },
            },
        },
    };

    return (
        <div className="w-full h-full">
            <Bar data={chartData} options={options} />
        </div>
    );
}

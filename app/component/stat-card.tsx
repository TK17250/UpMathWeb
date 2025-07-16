interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color?: string;
}

export default function StatCard({ icon, title, value, color = "text-white" }: StatCardProps) {
    return (
        <div className="bg-[#203D4F] rounded-xl p-6 border-4 border-[#2D4A5B] hover:border-[#80ED99] transition-all duration-300">
            <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="text-white text-lg font-semibold">{title}</div>
                    <div className="text-2xl font-bold text-[#80ED99]">{value}</div>
                </div>
            </div>
        </div>
    );
}

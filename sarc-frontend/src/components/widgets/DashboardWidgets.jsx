import React from 'react';

export const Card = ({ children, className = '', onClick }) => (
    <div onClick={onClick} className={`bg-white rounded-xl shadow-soft p-6 border border-slate-100 hover:shadow-md transition-shadow duration-300 ${className}`}>
        {children}
    </div>
);

export const Badge = ({ children, color = 'blue', className = '' }) => {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        teal: 'bg-teal-50 text-teal-600 border-teal-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        slate: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles[color]} ${className}`}>
            {children}
        </span>
    );
};

export const StatWidget = ({ title, value, icon: Icon, trend }) => (
    <Card className="flex items-center p-6">
        <div className="flex-grow">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</h3>
            <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-semibold text-slate-900">{value}</p>
                {trend && (
                    <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            {Icon && <Icon size={24} />}
        </div>
    </Card>
);

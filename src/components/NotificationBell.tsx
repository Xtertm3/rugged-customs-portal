import React from 'react';

interface NotificationBellProps {
    isSubscribed: boolean;
    permission: NotificationPermission;
    onClick: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ isSubscribed, permission, onClick }) => {
    const getBellState = () => {
        if (permission === 'denied') {
            return {
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341" />
                    </svg>
                ),
                color: 'text-red-500',
                title: 'Notifications blocked. Please enable in browser settings.',
            };
        }
        if (isSubscribed) {
            return {
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                ),
                color: 'text-green-400',
                title: 'Notifications enabled. Click to disable.',
            };
        }
        return {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-7.753-5.903M12 5v.01M12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12 21a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'text-zinc-400',
            title: 'Notifications disabled. Click to enable.',
        };
    };

    const { icon, color, title } = getBellState();

    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-full hover:bg-zinc-700/50 transition-colors ${color}`}
            aria-label={title}
        >
            {icon}
        </button>
    );
};

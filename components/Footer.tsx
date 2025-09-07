
import React from 'react';
import { SITE_NAME } from '../constants';

export const Footer: React.FC = () => {
    return (
        <footer className="border-t border-neutral-200 bg-white/70">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-xs text-neutral-500">
                <div>© {new Date().getFullYear()} {SITE_NAME}</div>
            </div>
        </footer>
    );
};

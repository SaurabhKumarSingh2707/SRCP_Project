import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../common/Button';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 border-b border-primary/20 shadow-sm">
            {/* Top Academic Ribbon */}
            <div className="bg-primary text-secondary text-xs py-1 text-center font-medium tracking-widest uppercase">
                Established 1987
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-xl md:text-2xl font-bold font-heading text-primary flex items-center gap-3">
                            <img src="/images/logo.jpg" alt="Sathyabama Logo" className="h-12 w-auto object-contain" />
                            SATHYABAMA <span className="text-slate-500 font-normal text-sm hidden lg:inline border-l border-slate-300 ml-3 pl-3">SARC Portal</span>
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#about" className="text-slate-700 hover:text-primary font-medium transition-colors">About</a>
                        <a href="#projects" className="text-slate-700 hover:text-primary font-medium transition-colors">Research Projects</a>
                        <a href="#industry" className="text-slate-700 hover:text-primary font-medium transition-colors">Industry Collaboration</a>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" className="hidden sm:flex text-primary font-bold" onClick={() => navigate('/login')}>Faculty Login</Button>
                        <Button variant="primary" onClick={() => navigate('/register?role=student')}>Join as Student</Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

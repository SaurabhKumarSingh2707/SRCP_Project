import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-primary text-white border-t border-primary-dark mt-20">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <span className="text-2xl font-bold font-heading text-secondary">SARC Portal</span>
                        <p className="mt-4 text-sm text-white/80">
                            Sathyabama Institute of Science and Technology. Empowering faculty and students through AI-driven research collaboration.
                        </p>
                        <p className="mt-2 text-sm text-secondary italic">
                            Established 1987
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-secondary tracking-wider uppercase">Platform</h3>
                        <ul className="mt-4 space-y-4">
                            <li><a href="#" className="text-base text-white/80 hover:text-secondary transition-colors">Browse Projects</a></li>
                            <li><a href="#" className="text-base text-white/80 hover:text-secondary transition-colors">For Students</a></li>
                            <li><a href="#" className="text-base text-white/80 hover:text-secondary transition-colors">For Faculty</a></li>
                            <li><a href="#" className="text-base text-white/80 hover:text-secondary transition-colors">Admin Portal</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-secondary tracking-wider uppercase">Contact</h3>
                        <ul className="mt-4 space-y-4">
                            <li className="text-base text-white/80">Sathyabama University</li>
                            <li className="text-base text-white/80">Jeppiaar Nagar, Rajiv Gandhi Salai</li>
                            <li className="text-base text-white/80">Chennai, Tamil Nadu 600119</li>
                            <li><a href="#" className="text-base text-secondary hover:text-white transition-colors">research@sathyabama.ac.in</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-secondary tracking-wider uppercase">Connect</h3>
                        <div className="flex space-x-6 mt-4">
                            <span className="text-white/60 hover:text-secondary cursor-pointer transition-colors">Twitter</span>
                            <span className="text-white/60 hover:text-secondary cursor-pointer transition-colors">LinkedIn</span>
                            <span className="text-white/60 hover:text-secondary cursor-pointer transition-colors">GitHub</span>
                        </div>
                    </div>
                </div>
                <div className="mt-12 border-t border-primary-dark pt-8 flex items-center justify-center lg:justify-start">
                    <p className="text-base text-white/60">
                        &copy; {new Date().getFullYear()} Sathyabama Institute of Science and Technology. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

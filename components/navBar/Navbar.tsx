"use client";

import Image from "next/image";

export default function Navbar() {
    return (
        <nav className="max-w-md mx-auto px-4 py-2">
            <div className="flex items-center justify-center my-2">
                <Image src="/logo2.png" alt="Logo" width={70} height={70} className="rotate-10"/>
            </div>
        </nav>        
    );
}
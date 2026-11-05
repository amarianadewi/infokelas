"use client";

import React from "react";
import Image from "next/image";

interface HeaderProps {
  title1?: string;
  title2?: string;
  subtitle?: string;
  showPills?: boolean;
}

export default function Header({
  title1 = "Info Harian",
  title2 = "Kelas 4 Ceria",
  subtitle = "SDN Kaliwungu 05",
  showPills = true
}: HeaderProps) {
  return (
    <header className="hd">
      <div className="relative z-10">
        <div className="lg" />
        <h1 className="font-heading font-semibold text-2xl sm:text-3xl text-[#17456b] mt-1 mb-1">
          <span className="b1">{title1}</span>
          <br />
          <span className="b2">{title2}</span> ✨
        </h1>
        <div className="m2">{subtitle}</div>
        {showPills && (
          <div className="pl">
            <span>📋 Absen</span>
            <span>🏠 Jam Pulang</span>
            <span>🎨 Kegiatan</span>
            <span>📚 PR</span>
          </div>
        )}
      </div>
    </header>
  );
}

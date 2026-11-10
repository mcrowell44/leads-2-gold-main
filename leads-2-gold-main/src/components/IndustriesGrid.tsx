
import React from 'react';
import IndustryCard, { Industry } from './IndustryCard';

interface IndustriesGridProps {
  industries: Industry[];
  onSearchIndustry: (industryName: string) => void;
}

const IndustriesGrid = ({ industries, onSearchIndustry }: IndustriesGridProps) => {
  if (industries.length === 0) {
    return (
      <div className="w-full max-w-4xl text-center p-8">
        <p className="text-leather/70 text-lg">
          No industries found. Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <section className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {industries.map((industry, index) => (
        <IndustryCard 
          key={index} 
          industry={industry} 
          onSearchIndustry={onSearchIndustry}
        />
      ))}
    </section>
  );
};

export default IndustriesGrid;

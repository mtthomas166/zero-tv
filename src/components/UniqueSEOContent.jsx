import React from 'react';
import { buildUniqueContent } from '../lib/api.js';

export default function UniqueSEOContent({ media }) {
  const content = buildUniqueContent(media);
  if (!content) return null;

  return (
    <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '12px', color: '#fff' }}>About {content.title} {content.year ? `(${content.year})` : ""}</h2>
      <p style={{ color: '#b8c0cc', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{content.longDesc}</p>

      <h3 style={{ fontSize: '16px', margin: '20px 0 8px', color: '#fff' }}>Why Watch?</h3>
      <p style={{ color: '#a9b3c0', lineHeight: '1.6', fontSize: '14px' }}>{content.whyWatch}</p>

      <h3 style={{ fontSize: '16px', margin: '24px 0 12px', color: '#fff' }}>FAQs</h3>
      <div style={{ display: 'grid', gap: '12px' }}>
        {content.faqs.map((f, i) => (
          <div key={i} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <strong style={{ color: '#e5e9f0', fontSize: '14px' }}>{f.q}</strong>
            <p style={{ color: '#8a96a6', margin: '6px 0 0', fontSize: '13px', lineHeight: '1.5' }}>{f.a}</p>
          </div>
        ))}
      </div>

      {/* JSON-LD for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": content.typeLabel === "movie" ? "Movie" : "TVSeries",
        "name": content.title,
        "datePublished": content.year,
        "genre": content.genres,
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": content.rating, "bestRating": "10" },
        "description": content.metaDescription
      })}} />
    </div>
  );
}

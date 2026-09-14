export default function BlogPostSchema({ title, description, slug, publishedAt, updatedAt, imageUrl, author, tags = [] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    image: imageUrl,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: {
      '@type': 'Person',
      '@id': 'https://www.lecturerroom.online/#author',
      name: author?.name || 'Lecturer Room',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://www.lecturerroom.online/#organization',
      name: 'Lecturer Room Blog',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.lecturerroom.online/blogs/${slug}`,
    },
    keywords: tags.join(', '),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
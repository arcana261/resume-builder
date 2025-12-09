import { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface SafeHTMLProps {
  html: string;
  className?: string;
}

/**
 * Decodes HTML entities (e.g., &lt; to <, &amp; to &)
 */
function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Safely renders HTML content by sanitizing it with DOMPurify.
 * Prevents XSS attacks and injection vulnerabilities.
 * Also handles HTML entity decoding.
 */
export function SafeHTML({ html, className = '' }: SafeHTMLProps) {
  const sanitizedHTML = useMemo(() => {
    if (!html) return '';

    // First decode HTML entities if they exist
    let decodedHTML = html;

    // Check if the content has HTML entities (e.g., &lt;, &gt;, &amp;)
    if (html.includes('&lt;') || html.includes('&gt;') || html.includes('&amp;')) {
      decodedHTML = decodeHTMLEntities(html);
    }

    // Configure DOMPurify to allow safe HTML elements
    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div',
        'blockquote', 'pre', 'code', 'hr', 'table', 'thead', 'tbody',
        'tr', 'th', 'td', 'img', 'section', 'article', 'dl', 'dt', 'dd'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'class', 'id', 'style',
        'src', 'alt', 'title', 'width', 'height'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false
    };

    return DOMPurify.sanitize(decodedHTML, config);
  }, [html]);

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert
        prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
        prose-p:text-gray-700 dark:prose-p:text-gray-300
        prose-p:leading-relaxed prose-p:mb-4
        prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
        prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
        prose-li:mb-2 prose-li:text-gray-700 dark:prose-li:text-gray-300
        prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700
        ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}

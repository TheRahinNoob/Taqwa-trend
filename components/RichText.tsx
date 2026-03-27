export default function RichText({ html }: { html: string }) {
  // Minimal styling wrapper for WooCommerce HTML
  return (
    <div
      className="prose prose-neutral max-w-none prose-p:leading-7 prose-a:text-neutral-900 prose-a:underline prose-strong:text-neutral-900"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}